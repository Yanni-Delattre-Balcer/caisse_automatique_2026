import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cart: [],
  client: null,
  discounts: [],
  paymentMethods: [], // e.g [{ type: 'CB', amount: 50 }, { type: 'CASH', amount: 20 }]

  addItem: (item) => set((state) => {
    const existingItem = state.cart.find(i => i.id === item.id);
    if (existingItem) {
      return {
        cart: state.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      };
    }
    return { cart: [...state.cart, { ...item, quantity: 1, discount: 0 }] };
  }),

  removeItem: (itemId) => set((state) => ({
    cart: state.cart.filter(i => i.id !== itemId)
  })),

  updateItemQuantity: (itemId, quantity) => set((state) => ({
    cart: state.cart.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, quantity) } : i)
  })),

  setClient: (client) => set({ client }),

  clearCart: () => set({ cart: [], client: null, paymentMethods: [], discounts: [] }),

  getTotal: () => {
    const state = get();
    return state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
