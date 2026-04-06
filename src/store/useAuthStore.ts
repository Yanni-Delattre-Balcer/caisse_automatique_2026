import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { AppUser } from '../types';

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  loginAsDemo: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    companyName: string,
    businessDomain: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  _hydrateUserFromSession: (authUser: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isDemo: false,
      isLoading: false,

      // Appelé une seule fois dans App.tsx au montage
      initialize: async () => {
        set({ isLoading: true });
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await get()._hydrateUserFromSession(session.user);
        }
        // Écouter les changements de session (refresh token, logout externe, autre onglet)
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            await get()._hydrateUserFromSession(session.user);
          } else if (!get().isDemo) {
            // Ne pas écraser le mode démo — la session Supabase est vide en mode démo par design
            set({ user: null, isAuthenticated: false, isDemo: false });
          }
        });
        set({ isLoading: false });
      },

      // Méthode privée — ne jamais appeler depuis l'UI
      _hydrateUserFromSession: async (authUser: User) => {
        const { data: business, error } = await supabase
          .from('businesses')
          .select('id, name, business_type')
          .eq('owner_id', authUser.id)
          .single();

        if (error || !business) {
          // Compte auth existant mais sans commerce associé (cas edge à l'inscription)
          set({
            user: {
              id: authUser.id,
              email: authUser.email ?? '',
              companyName: null,
              businessDomain: null,
              businessId: null,
            },
            isAuthenticated: true,
            isDemo: false, // Force la sortie du mode démo
          });
          return;
        }

        set({
          user: {
            id: authUser.id,
            email: authUser.email ?? '',
            companyName: business.name,
            businessDomain: business.business_type,
            businessId: business.id,
          },
          isAuthenticated: true,
          isDemo: false, // Force la sortie du mode démo
        });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          set({ isLoading: false });
          throw new Error(error.message);
        }
        await get()._hydrateUserFromSession(data.user);
        set({ isLoading: false });
      },

      register: async (
        email: string,
        password: string,
        companyName: string,
        businessDomain: string
      ) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error || !data.user) {
          set({ isLoading: false });
          throw new Error(error?.message || 'Erreur lors de l’inscription');
        }
        // Créer le commerce lié immédiatement après le compte
        const { error: bizError } = await supabase.from('businesses').insert({
          name: companyName,
          owner_id: data.user.id,
          business_type: businessDomain,
        });
        if (bizError) {
          set({ isLoading: false });
          throw new Error('Compte créé mais erreur commerce : ' + bizError.message);
        }
        await get()._hydrateUserFromSession(data.user);
        set({ isLoading: false });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, isDemo: false });
      },

      loginAsDemo: () => {
        set({
          user: {
            id: 'demo-user-id',
            email: 'demo@heryze.com',
            companyName: 'Boulangerie Louise',
            businessDomain: 'Restauration',
            businessId: 'demo-business-id',
          },
          isAuthenticated: true,
          isDemo: true,
        });
      },
    }),
    {
      name: 'auth-storage',
      // Ne persister que les données non-sensibles — la session JWT est gérée par Supabase
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isDemo: state.isDemo,
      }),
    }
  )
);
