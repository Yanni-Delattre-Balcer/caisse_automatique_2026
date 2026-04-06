import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';
import type { CatalogItem, SupabaseProduct } from '../types';

interface CatalogState {
  items: CatalogItem[];
  isLoading: boolean;
  _realtimeChannel: RealtimeChannel | null;
  hydrateForDomain: (domain?: string) => Promise<void>;
  addItem: (itemData: Omit<CatalogItem, 'id'>) => Promise<void>;
  updateStock: (itemId: string, newStockQuantity: number) => Promise<void>;
  cleanup: () => void;
}

// Calcul TTC côté client — CSR-First
const mapProduct = (p: SupabaseProduct): CatalogItem => ({
  id: p.id,
  name: p.name,
  price: parseFloat((p.price_ht * (1 + p.tva_rate / 100)).toFixed(2)),
  price_ht: p.price_ht,
  tva_rate: p.tva_rate,
  category: p.category,
  stock: p.stock_quantity,
  barcode: p.barcode,
});

export const useCatalogStore = create<CatalogState>((set, get) => ({
  items: [],
  isLoading: false,
  _realtimeChannel: null,

  // Signature rétrocompatible avec l'existant — le paramètre domain est ignoré,
  // le businessId depuis useAuthStore est la source de vérité
  hydrateForDomain: async (_domain?: string) => {
    const { user, isDemo } = useAuthStore.getState();
    if (!user?.businessId && !isDemo) return;

    if (isDemo) {
      set({
        items: [
          { id: 'p1', name: 'Pain au Chocolat', price: 1.20, price_ht: 1.00, tva_rate: 20, category: 'Viennoiserie', stock: 24, barcode: '123' },
          { id: 'p2', name: 'Croissant Beurre', price: 1.10, price_ht: 0.92, tva_rate: 20, category: 'Viennoiserie', stock: 18, barcode: '124' },
          { id: 'p3', name: 'Baguette Tradition', price: 1.30, price_ht: 1.23, tva_rate: 5.5, category: 'Pains', stock: 50, barcode: '125' },
          { id: 'p4', name: 'Café Expresso', price: 1.50, price_ht: 1.36, tva_rate: 10, category: 'Boissons', stock: 100, barcode: '126' },
          { id: 'p5', name: 'Jus d\'Orange Frais', price: 3.50, price_ht: 3.18, tva_rate: 10, category: 'Boissons', stock: 12, barcode: '127' },
          { id: 'p6', name: 'Sandwich Jambon Beurre', price: 4.80, price_ht: 4.36, tva_rate: 10, category: 'Snacking', stock: 15, barcode: '128' },
          { id: 'p7', name: 'Eclair Chocolat', price: 2.80, price_ht: 2.33, tva_rate: 20, category: 'Pâtisserie', stock: 8, barcode: '129' },
          { id: 'p8', name: 'Tartelette Framboise', price: 3.90, price_ht: 3.25, tva_rate: 20, category: 'Pâtisserie', stock: 6, barcode: '130' },
        ],
        isLoading: false,
      });
      return;
    }

    const bizId = user?.businessId;
    if (!bizId) return;

    set({ isLoading: true });

    const { data, error } = await supabase
      .from('products')
      .select('id, name, price_ht, tva_rate, category, stock_quantity, barcode')
      .eq('business_id', bizId)
      .order('category', { ascending: true });

    if (error) {
      console.error('[CatalogStore] Erreur chargement:', error.message);
      set({ isLoading: false });
      return;
    }

    set({
      items: (data as SupabaseProduct[]).map(mapProduct),
      isLoading: false,
    });

    // Ne pas s'abonner au temps réel en mode démo
    if (isDemo) return;

    // Nettoyer l'ancien canal s'il existe pour éviter la lenteur exponentielle
    const oldChannel = get()._realtimeChannel;
    if (oldChannel) supabase.removeChannel(oldChannel);

    // Abonnement Realtime — toute modification dans Supabase Studio se répercute instantanément
    const channel = supabase
      .channel(`products-${bizId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `business_id=eq.${bizId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            set((state) => ({
              items: [...state.items, mapProduct(payload.new as SupabaseProduct)],
            }));
          }
          if (payload.eventType === 'UPDATE') {
            set((state) => ({
              items: state.items.map((item) =>
                item.id === payload.new.id
                  ? mapProduct(payload.new as SupabaseProduct)
                  : item
              ),
            }));
          }
          if (payload.eventType === 'DELETE') {
            set((state) => ({
              items: state.items.filter((item) => item.id !== payload.old.id),
            }));
          }
        }
      )
      .subscribe();

    set({ _realtimeChannel: channel });
  },

  addItem: async (itemData) => {
    const { user, isDemo } = useAuthStore.getState();
    if (isDemo) {
      // Simulation locale en mode démo
      set((state) => ({
        items: [...state.items, { ...itemData, id: Math.random().toString(36).substr(2, 9), price: itemData.price_ht * (1 + (itemData.tva_rate || 20) / 100) } as any]
      }));
      return;
    }
    if (!user?.businessId) throw new Error('Non authentifié');
    const { data, error } = await supabase.from('products').insert({
      business_id: user.businessId,
      name: itemData.name,
      price_ht: itemData.price_ht,
      tva_rate: itemData.tva_rate ?? 20.0,
      category: itemData.category,
      stock_quantity: itemData.stock ?? 0,
      barcode: itemData.barcode ?? null,
    }).select().single();
    
    if (error) throw new Error(error.message);
    
    // UI instantanée : on n'attend pas que le Realtime se réveille
    set((state) => {
      if (state.items.some(i => i.id === data.id)) return state; // évite le doublon si Realtime est ultra-rapide
      return { items: [...state.items, mapProduct(data as SupabaseProduct)] };
    });
  },

  updateStock: async (itemId: string, newStockQuantity: number) => {
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newStockQuantity })
      .eq('id', itemId);
    if (error) throw new Error(error.message);
    // Le Realtime met à jour le store automatiquement
  },

  cleanup: () => {
    const channel = get()._realtimeChannel;
    if (channel) supabase.removeChannel(channel);
    set({ _realtimeChannel: null });
  },
}));

// Conserver le mécanisme d'auto-hydratation existant
useAuthStore.subscribe((state, prevState) => {
  if (
    state.user?.businessId &&
    state.user.businessId !== prevState.user?.businessId
  ) {
    useCatalogStore
      .getState()
      .hydrateForDomain(state.user.businessDomain ?? undefined);
  }
});
