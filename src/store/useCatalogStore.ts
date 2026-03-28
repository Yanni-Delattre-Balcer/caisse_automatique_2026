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
    const { user } = useAuthStore.getState();
    if (!user?.businessId) return;

    set({ isLoading: true });

    const { data, error } = await supabase
      .from('products')
      .select('id, name, price_ht, tva_rate, category, stock_quantity, barcode')
      .eq('business_id', user.businessId)
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

    // Nettoyer l'abonnement précédent si on change de compte
    const prevChannel = get()._realtimeChannel;
    if (prevChannel) supabase.removeChannel(prevChannel);

    // Abonnement Realtime — toute modification dans Supabase Studio se répercute instantanément
    const channel = supabase
      .channel(`products-${user.businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `business_id=eq.${user.businessId}`,
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
    const { user } = useAuthStore.getState();
    if (!user?.businessId) throw new Error('Non authentifié');
    const { error } = await supabase.from('products').insert({
      business_id: user.businessId,
      name: itemData.name,
      price_ht: itemData.price_ht,
      tva_rate: itemData.tva_rate ?? 20.0,
      category: itemData.category,
      stock_quantity: itemData.stock ?? 0,
      barcode: itemData.barcode ?? null,
    });
    if (error) throw new Error(error.message);
    // Le Realtime met à jour le store automatiquement — pas de set() manuel ici
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
