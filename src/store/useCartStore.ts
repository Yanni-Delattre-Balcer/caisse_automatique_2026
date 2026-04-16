import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  get as idbGet,
  set as idbSet,
  del as idbDel,
  keys as idbKeys,
} from 'idb-keyval';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';
import { useCatalogStore } from './useCatalogStore';
import type { CartItem, SalePayload } from '../types';

interface Discount {
  type: 'percent' | 'fixed';
  value: number;
}

interface CartState {
  cart: CartItem[];
  client: string | null;
  discount: Discount | null;
  paymentMethods: unknown[];
  addItem: (product: CartItem) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  setClient: (client: string | null) => void;
  applyDiscount: (type: 'percent' | 'fixed', value: number) => void;
  clearDiscount: () => void;
  clearCart: () => void;
  getRawTotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  checkout: (paymentMethod: string) => Promise<SalePayload>;
  syncOfflineQueue: () => Promise<void>;
}

const OFFLINE_QUEUE_PREFIX = 'offline_sale_';

// Calcul et écriture côté client — Supabase reçoit uniquement des valeurs finales
const persistSaleToSupabase = async (salePayload: SalePayload): Promise<void> => {
  const { error } = await supabase.from('sales').insert(salePayload);
  if (error) throw error;

  // Mise à jour du stock : calcul CSR-First, on envoie la valeur absolue finale
  const { items: catalogItems } = useCatalogStore.getState();

  const stockUpdates = salePayload.items
    .filter((soldItem) => {
      const catalogItem = catalogItems.find((p) => p.id === soldItem.id);
      return catalogItem?.stock !== null && catalogItem?.stock !== undefined;
    })
    .map((soldItem) => {
      const catalogItem = catalogItems.find((p) => p.id === soldItem.id)!;
      return {
        id: soldItem.id,
        stock_quantity: Math.max(0, (catalogItem.stock ?? 0) - soldItem.quantity),
      };
    });

  // Envoi en parallèle, best-effort — une erreur de stock ne bloque pas la vente
  await Promise.allSettled(
    stockUpdates.map(({ id, stock_quantity }) =>
      supabase.from('products').update({ stock_quantity }).eq('id', id)
    )
  );
  // Le Realtime répercutera les changements de stock dans useCatalogStore automatiquement
};

const flushOfflineQueue = async (): Promise<void> => {
  const allKeys = await idbKeys();
  const offlineKeys = (allKeys as string[]).filter((k) =>
    k.startsWith(OFFLINE_QUEUE_PREFIX)
  );
  if (offlineKeys.length === 0) return;

  for (const key of offlineKeys) {
    const salePayload = await idbGet<SalePayload>(key);
    try {
      if (salePayload) {
        await persistSaleToSupabase(salePayload);
        await idbDel(key);
      }
    } catch (e) {
      const err = e as Error;
      console.warn('[CartStore] Sync offline échouée pour', key, err.message);
      break; // Préserver l'ordre chronologique — s'arrêter au premier échec
    }
  }
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      client: null,
      discount: null,
      paymentMethods: [],

      addItem: (product: CartItem) => {
        set((state) => {
          const existing = state.cart.find((i) => i.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { cart: [...state.cart, { ...product, quantity: 1 }] };
        });
      },

      removeItem: (productId: string) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== productId),
        })),

      updateItemQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((i) =>
            i.id === productId ? { ...i, quantity } : i
          ),
        }));
      },

      setClient: (client: string | null) => set({ client }),

      applyDiscount: (type: 'percent' | 'fixed', value: number) =>
        set({ discount: { type, value } }),

      clearDiscount: () => set({ discount: null }),

      clearCart: () =>
        set({ cart: [], client: null, discount: null, paymentMethods: [] }),

      getRawTotal: () => {
        const state = get();
        return state.cart.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getDiscountAmount: () => {
        const state = get();
        if (!state.discount) return 0;
        const raw = state.getRawTotal();
        if (state.discount.type === 'percent') {
          return parseFloat(((raw * state.discount.value) / 100).toFixed(2));
        }
        return Math.min(state.discount.value, raw);
      },

      getTotal: () => {
        const state = get();
        return parseFloat(
          Math.max(0, state.getRawTotal() - state.getDiscountAmount()).toFixed(2)
        );
      },

      checkout: async (paymentMethod: string): Promise<SalePayload> => {
        const state = get();
        const { user } = useAuthStore.getState();

        if (!user?.businessId) throw new Error('Utilisateur non authentifié');
        if (state.cart.length === 0) throw new Error('Panier vide');

        const salePayload: SalePayload = {
          business_id: user.businessId,
          total_ttc: parseFloat(state.getTotal().toFixed(2)),
          payment_method: paymentMethod,
          items: state.cart.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          created_at: new Date().toISOString(),
        };

        if (navigator.onLine) {
          try {
            await persistSaleToSupabase(salePayload);
          } catch (e) {
            const err = e as Error;
            console.error(
              '[CartStore] Push échoué, mise en queue offline:',
              err.message
            );
            await idbSet(`${OFFLINE_QUEUE_PREFIX}${Date.now()}`, salePayload);
          }
        } else {
          // Mode offline — empiler dans IndexedDB, sync au retour du réseau
          await idbSet(`${OFFLINE_QUEUE_PREFIX}${Date.now()}`, salePayload);
          console.info('[CartStore] Mode offline — vente en queue.');
        }

        get().clearCart();
        return salePayload; // Retourner pour permettre l'affichage du reçu dans l'UI
      },

      syncOfflineQueue: async () => {
        if (navigator.onLine) await flushOfflineQueue();
      },
    }),
    { name: 'cart-storage' }
  )
);
