import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // { companyName, email, businessDomain }
      isAuthenticated: false,
      login: (email, password) => {
        // Mock login
        set({ 
          user: { companyName: "Demo Company", email, businessDomain: "Restauration" },
          isAuthenticated: true 
        });
      },
      register: (companyName, email, password, businessDomain) => {
        // Mock register
        set({
          user: { companyName, email, businessDomain },
          isAuthenticated: true
        });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
