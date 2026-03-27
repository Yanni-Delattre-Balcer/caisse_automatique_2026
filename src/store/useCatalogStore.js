import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

const CATALOGS_BY_DOMAIN = {
  "Restauration": [
    { id: '1', name: 'Espresso', category: 'Boissons', price: 2.5, stock: null, barcode: null },
    { id: '2', name: 'Burger Maison', category: 'Plats', price: 14.0, stock: 50, barcode: null },
    { id: '3', name: 'Salade César', category: 'Plats', price: 12.0, stock: 30, barcode: null },
    { id: '4', name: 'Tiramisu', category: 'Desserts', price: 6.5, stock: 20, barcode: null },
  ],
  "Retail": [
    { id: '1', name: 'T-Shirt Blanc Basique', category: 'Vêtements', price: 15.0, stock: 100, barcode: '111222' },
    { id: '2', name: 'Jeans Denim', category: 'Vêtements', price: 49.99, stock: 40, barcode: '333444' },
    { id: '3', name: 'Casquette', category: 'Accessoires', price: 19.99, stock: 25, barcode: '555666' },
  ],
  "Beauté": [
    { id: '1', name: 'Shampoing Premium', category: 'Produits', price: 25.0, stock: 40, barcode: '123456' },
    { id: '2', name: 'Coupe Homme', category: 'Prestations', price: 22.0, stock: null, barcode: null },
    { id: '3', name: 'Coupe + Brushing Femme', category: 'Prestations', price: 45.0, stock: null, barcode: null },
  ],
  "Multi-services": [
    { id: '1', name: 'Intervention 1h', category: 'Services', price: 50.0, stock: null, barcode: null },
    { id: '2', name: 'Forfait Réparation', category: 'Services', price: 120.0, stock: null, barcode: null },
  ],
  "Autre": [
    { id: '1', name: 'Produit Général 1', category: 'Général', price: 10.0, stock: 100, barcode: null },
    { id: '2', name: 'Prestation Standard', category: 'Service', price: 50.0, stock: null, barcode: null },
  ]
};

export const useCatalogStore = create((set, get) => ({
  items: [],
  isLoading: false,

  // Fonction appelée pour hydrater le store selon le domaine
  hydrateForDomain: (domain) => {
    const catalog = CATALOGS_BY_DOMAIN[domain] || CATALOGS_BY_DOMAIN["Autre"];
    set({ items: catalog });
  },

  setCatalog: (newItems) => set({ items: newItems }),
  
  addItem: (item) => set((state) => ({
    items: [...state.items, { ...item, id: crypto.randomUUID() }]
  })),

  updateStock: (itemId, qtyChange) => set((state) => ({
    items: state.items.map(i => {
      if (i.id === itemId && i.stock !== null) {
        return { ...i, stock: Math.max(0, i.stock + qtyChange) };
      }
      return i;
    })
  })),
}));

// Auto-hydrate quand le store auth change
useAuthStore.subscribe((state, prevState) => {
  if (state.user?.businessDomain && state.user.businessDomain !== prevState.user?.businessDomain) {
    useCatalogStore.getState().hydrateForDomain(state.user.businessDomain);
  }
});
