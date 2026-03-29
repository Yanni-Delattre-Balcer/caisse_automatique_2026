# Plan d'Implémentation Définitif — Caisse Automatique Universelle 2026
> Document d'exécution directe. Suivre les étapes dans l'ordre indiqué.
> Version finale — TypeScript · CSR-First · Supabase

---

## Note préalable — Stack définitive

- **Langage** : TypeScript (fichiers `.ts` / `.tsx`)
- **Framework** : Vite + React 19
- **UI** : Tailwind CSS 4 + HeroUI
- **State** : Zustand (stores inchangés dans leur interface publique)
- **Backend** : Supabase (persistance + auth + RLS + Realtime) — zéro logique serveur
- **Offline** : idb-keyval (IndexedDB)

---

## Ordre d'exécution obligatoire

```
Étape 0 — npm install
    ↓
Étape 1 — SQL dans Supabase Studio   ← les tables doivent exister avant le code
    ↓
Étape 2 — supabaseClient.ts          ← les stores en dépendent
    ↓
Étape 3 — types.ts                   ← les stores en dépendent
    ↓
Étape 4 — useAuthStore.ts            ← le catalog en dépend
    ↓
Étape 5 — useCatalogStore.ts         ← le cart en dépend
    ↓
Étape 6 — useCartStore.ts
    ↓
Étape 7 — App.tsx                    ← branchement final
```

---

## Étape 0 — Terminal (une seule fois)

```bash
npm install @supabase/supabase-js idb-keyval
```

Vérifier que le `.env` à la racine contient :

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Étape 1 — SQL dans Supabase Studio

Aller dans le projet Supabase → **SQL Editor** → **New query** → coller ceci intégralement → **Run**.

C'est le seul endroit où on touche au serveur. Aucune fonction, trigger ou Edge Function ne sera créée.

```sql
-- TABLES

CREATE TABLE businesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users NOT NULL,
  business_type text CHECK (business_type IN ('retail', 'restauration', 'service', 'beaute')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price_ht numeric(10,2) NOT NULL,
  tva_rate numeric(5,2) DEFAULT 20.0,
  category text,
  stock_quantity integer DEFAULT 0,
  barcode text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) NOT NULL,
  total_ttc numeric(10,2) NOT NULL,
  payment_method text,
  items jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- SÉCURITÉ RLS

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_businesses" ON businesses
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "owner_products" ON products
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "owner_sales" ON sales
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- FILET DE SÉCURITÉ STOCK
-- N'empêche pas la logique CSR, bloque uniquement le stock négatif en base
ALTER TABLE products ADD CONSTRAINT stock_non_negatif CHECK (stock_quantity >= 0);
```

---

## Étape 2 — `src/lib/supabaseClient.ts` (nouveau fichier)

Point d'entrée unique vers Supabase. Tout le reste importera depuis ici.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquantes dans .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Test immédiat possible** — dans n'importe quel composant temporairement :
```typescript
import { supabase } from '../lib/supabaseClient';
console.log(supabase); // Doit afficher l'objet client, pas une erreur
```

---

## Étape 3 — `src/types/index.ts` (nouveau fichier)

Contrats de données partagés entre tous les stores. Définir ici une seule fois, importer partout.

```typescript
// L'utilisateur tel qu'exposé par useAuthStore
export interface AppUser {
  id: string;
  email: string;
  companyName: string | null;    // Depuis businesses.name
  businessDomain: string | null; // Depuis businesses.business_type
  businessId: string | null;     // UUID de businesses.id — critique pour les requêtes
}

// Un produit tel qu'exposé par useCatalogStore (prix TTC calculé côté client)
export interface CatalogItem {
  id: string;
  name: string;
  price: number;       // TTC — calculé côté client depuis price_ht + tva_rate
  price_ht: number;
  tva_rate: number;
  category: string | null;
  stock: number | null;
  barcode: string | null;
}

// Un article dans le panier
export interface CartItem extends CatalogItem {
  quantity: number;
}

// Payload d'une vente envoyé à Supabase
export interface SalePayload {
  business_id: string;
  total_ttc: number;
  payment_method: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  created_at: string;
}

// Donnée brute retournée par Supabase pour un produit
export interface SupabaseProduct {
  id: string;
  name: string;
  price_ht: number;
  tva_rate: number;
  category: string | null;
  stock_quantity: number;
  barcode: string | null;
}
```

---

## Étape 4 — `src/store/useAuthStore.ts` (remplacement complet)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { AppUser } from '../types';

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
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
          } else {
            set({ user: null, isAuthenticated: false });
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
        if (error) {
          set({ isLoading: false });
          throw new Error(error.message);
        }
        // Créer le commerce lié immédiatement après le compte
        const { error: bizError } = await supabase.from('businesses').insert({
          name: companyName,
          owner_id: data.user!.id,
          business_type: businessDomain,
        });
        if (bizError) {
          set({ isLoading: false });
          throw new Error('Compte créé mais erreur commerce : ' + bizError.message);
        }
        await get()._hydrateUserFromSession(data.user!);
        set({ isLoading: false });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      // Ne persister que les données non-sensibles — la session JWT est gérée par Supabase
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## Étape 5 — `src/store/useCatalogStore.ts` (remplacement complet)

```typescript
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

// Conserver le mécanisme d'auto-hydratation existant — identique à l'original
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
```

---

## Étape 6 — `src/store/useCartStore.ts` (remplacement complet)

```typescript
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

interface CartState {
  cart: CartItem[];
  client: string | null;
  discounts: unknown[];
  paymentMethods: unknown[];
  addItem: (product: CartItem) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  setClient: (client: string | null) => void;
  clearCart: () => void;
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
      await persistSaleToSupabase(salePayload!);
      await idbDel(key);
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
      discounts: [],
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

      clearCart: () =>
        set({ cart: [], client: null, discounts: [], paymentMethods: [] }),

      getTotal: () => {
        const state = get();
        return state.cart.reduce(
          (total, item) => total + item.price * item.quantity,
          0
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
```

---

## Étape 7 — Modifications dans `App.tsx`

Deux `useEffect` à ajouter dans le composant racine. Le reste de `App.tsx` reste inchangé.

```typescript
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const syncOfflineQueue = useCartStore((state) => state.syncOfflineQueue);

  // Restaurer la session Supabase au démarrage de l'app
  useEffect(() => {
    initialize();
  }, []);

  // Synchroniser les ventes offline dès que le réseau revient
  useEffect(() => {
    syncOfflineQueue();
    window.addEventListener('online', syncOfflineQueue);
    return () => window.removeEventListener('online', syncOfflineQueue);
  }, []);

  // ... le reste de ton App.tsx inchangé
}
```

---

## Checklist de validation — 5 tests dans l'ordre

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1 | S'inscrire avec un nouveau compte | Une ligne apparaît dans la table `businesses` de Supabase Studio |
| 2 | Se connecter | `useAuthStore.getState().user.businessId` non null dans la console DevTools |
| 3 | Ajouter un produit via Supabase Studio | Le produit apparaît dans l'UI **sans reload** (Realtime) |
| 4 | Réaliser une vente en mode connecté | Une ligne apparaît dans la table `sales` avec le bon `business_id` |
| 5 | Mode avion → vente → retour réseau | La vente arrive dans `sales` quelques secondes après la reconnexion |

---

## Ce qu'on ne fait PAS dans ce plan

- Aucune fonction PostgreSQL, trigger ou Edge Function
- Aucun appel `supabase.rpc()`
- Aucun serveur Node.js / Express / API route
- Aucune modification des composants dans `/features/` ou `/pages/`
- Aucune modification du schéma SQL après l'Étape 1
- Pas de `localStorage` pour la queue offline — uniquement `idb-keyval`
- Pas d'implémentation du chaînage NF525 (`previous_hash` / `current_hash`) — prochaine étape

---

## Rappel — Problème de stock offline (connu, accepté pour le MVP)

En mode offline avec plusieurs vendeurs simultanés, deux ventes du même produit peuvent s'empiler sans se connaître. Pour un commerce mono-vendeur (cible MVP), ce problème n'existe pas structurellement. La solution v2 passe par un `UPDATE` conditionnel avec garde `WHERE stock_quantity >= quantite_vendue` — atomique, côté serveur, unique exception tolérée à l'architecture CSR-First.

---

## 📚 ANNEXE — Le Problème de Stock en Mode Offline Multi-Vendeurs

> Cette section est informative. Elle ne décrit pas un bug du MVP, mais une limite architecturale connue à anticiper pour la v2.

### Le scénario qui pose problème

Imagine un commerce avec **2 vendeurs** sur 2 appareils différents, et un produit dont le stock est **1** (dernière unité). Les deux appareils perdent le réseau en même temps.

- **Appareil A** vend le produit → calcule `1 - 1 = 0` → stocke `{stock: 0}` dans son IndexedDB.
- **Appareil B** vend le même produit → calcule `1 - 1 = 0` → stocke `{stock: 0}` dans son IndexedDB.

Le réseau revient. Les deux appareils synchronisent.

- **Appareil A** envoie : `UPDATE products SET stock_quantity = 0` ✅ Supabase accepte.
- **Appareil B** envoie : `UPDATE products SET stock_quantity = 0` ✅ Supabase accepte aussi.

Résultat : le produit a été **vendu deux fois** alors qu'il n'en restait qu'un. Personne ne le sait. C'est un **conflit d'écriture silencieux**.

### Pourquoi ça n'arrive pas en mode connecté

En mode connecté, le Realtime Supabase répercute le `UPDATE` de l'Appareil A sur l'Appareil B **avant** qu'il tente sa vente. L'Appareil B voit le stock passer à 0 en temps réel, et l'UI peut bloquer la vente. Le problème n'existe que quand les deux appareils sont **simultanément déconnectés**.

### Pourquoi c'est acceptable pour le MVP

Le projet cible des **petits commerces mono-vendeur** dans un premier temps. Un seul appareil = aucune concurrence possible. Le problème n'existe structurellement pas.

### Ce que `CHECK (stock_quantity >= 0)` fait vraiment

```sql
ALTER TABLE products ADD CONSTRAINT stock_non_negatif CHECK (stock_quantity >= 0);
```

Cette contrainte empêche d'aller en stock négatif, ce qui est utile. Mais elle **ne résout pas** le double-sell : quand l'Appareil B envoie `SET stock_quantity = 0` alors que le stock est déjà à 0, Supabase accepte quand même, car 0 ≥ 0. C'est un filet de sécurité, pas une solution complète.

### La vraie solution v2 — L'UPDATE conditionnel (atomique)

Au lieu d'envoyer "mets le stock à 0", on envoie "mets le stock à 0, **mais seulement si il est encore à 1**" :

```sql
UPDATE products
SET stock_quantity = stock_quantity - 1
WHERE id = 'xyz'
AND stock_quantity >= 1  -- La condition de garde
```

Si l'Appareil A est passé en premier, le stock est déjà à 0. La requête de l'Appareil B ne trouve aucune ligne correspondante, ne modifie rien, et retourne **0 lignes affectées**. Le client détecte cet échec et alerte le vendeur.

C'est une opération **atomique côté serveur** — et c'est précisément pourquoi elle ne peut pas être répliquée en CSR pur : deux clients ne peuvent pas se "voir" l'un l'autre au moment de décider. C'est la **seule limite réelle de l'architecture CSR-First** : la gestion de la contention sur une ressource partagée hors ligne.

Pour la v2 multi-vendeurs, il faudra accepter ce seul appel logique côté serveur — via un `UPDATE` conditionnel ou un système de **réservation de stock** (un appareil "réserve" une unité avant de finaliser la vente, même offline).

---

*Généré le 2026-03-28 | Version 2.0 — TypeScript · CSR-First | Projet : Caisse Automatique Universelle*
