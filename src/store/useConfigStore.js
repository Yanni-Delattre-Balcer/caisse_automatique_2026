import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useConfigStore = create(
  persist(
    (set) => ({
      businessMode: 'retail', // 'retail', 'snack', 'service'
      cashierName: 'Admin',
      taxRates: [20, 10, 5.5, 2.1], // Standard French VAT rates
      businessName: 'OmniPOS Demo',

      setBusinessMode: (mode) => set({ businessMode: mode }),
      setCashierName: (name) => set({ cashierName: name }),
      setBusinessName: (name) => set({ businessName: name }),
    }),
    {
      name: 'omnipos-config', // Persisted in localStorage
    }
  )
);
