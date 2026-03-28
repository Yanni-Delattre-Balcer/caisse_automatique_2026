# MASTER PROMPT — Migration Supabase : Caisse Automatique Universelle 2026
> À copier-coller intégralement dans l'IA de code. Ne pas résumer.

---

## 🏗️ PHILOSOPHIE D'ARCHITECTURE — CSR-First (à lire avant tout le reste)

Ce projet suit une architecture **Client-Side Rendering maximal**, inspirée de la stratégie historique de Facebook : tout ce qui peut être calculé dans le navigateur doit l'être. Le serveur ne doit jamais être un serveur de calcul.

**Contrat architectural strict :**
- **Zustand = cerveau de l'application.** Toute la logique métier (calculs TTC, gestion de panier, agrégations, tri, filtrage) vit dans les stores côté client. Jamais côté serveur.
- **Supabase = couche de persistance et de sécurité uniquement.** Il reçoit des données finales, déjà calculées par le client. Il ne fait aucun calcul métier. Ses seules responsabilités sont : stocker, authentifier, et appliquer les RLS.
- **Zéro API intermédiaire.** Aucun serveur Node.js, Express, ou Edge Function ne doit être créé. Le SDK `@supabase/supabase-js` est appelé directement depuis le navigateur.
- **Déploiement statique.** L'application est un bundle de fichiers statiques (`vite build`) hébergeable sur GitHub Pages, Cloudflare Pages, ou tout CDN. Aucune logique ne nécessite un serveur d'application.
- **Conséquence directe :** Toute tentation d'utiliser `supabase.rpc()` pour déporter un calcul côté PostgreSQL est une **violation de cette architecture**. La seule exception tolérée est une contrainte d'intégrité de données qui ne peut pas être garantie côté client (ex : unicité).

---

## 🎯 CONTEXTE & CONTRAINTES ABSOLUES

Tu interviens sur une application React (Vite + React 19 + Tailwind CSS 4 + HeroUI) de caisse enregistreuse universelle SaaS. Le state management repose sur **Zustand** avec persistance locale. L'objectif de cette session est de **remplacer l'entièreté des données mockées** par un backend **Supabase** réel, sans casser l'UI existante ni changer la structure des stores.

**Règles non négociables :**
- Ne jamais modifier les noms des stores (`useAuthStore`, `useCatalogStore`, `useCartStore`).
- Ne jamais modifier les interfaces des méthodes publiques exposées par les stores (les composants UI ne doivent subir aucune modification).
- Respecter l'identité visuelle HeroUI + Tailwind 4 pour tout nouveau composant.
- Tout le code produit doit être en **TypeScript**.
- La clé publique Supabase (`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`) sera fournie via `.env`. Tu ne dois jamais hardcoder ces valeurs.

---

## 📐 SCHÉMA SQL DE RÉFÉRENCE (déjà appliqué sur Supabase — NE PAS recréer)

```sql
-- Table des entreprises (multi-tenant)
CREATE TABLE businesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users NOT NULL,
  business_type text CHECK (business_type IN ('retail', 'restauration', 'service', 'beaute')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table des produits
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

-- Table des ventes
CREATE TABLE sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) NOT NULL,
  total_ttc numeric(10,2) NOT NULL,
  payment_method text,
  items jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS activé sur toutes les tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_businesses" ON businesses FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "owner_products" ON products FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "owner_sales" ON sales FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
```

---

## 📦 ÉTAPE 0 — Initialisation du client Supabase

**Fichier à créer : `src/lib/supabaseClient.js`**

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes dans .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Commande d'installation préalable :**
```bash
npm install @supabase/supabase-js
```

---

## 🔐 ÉTAPE 1 — Migration de `useAuthStore.js`

**Fichier cible : `src/store/useAuthStore.js`**

**Objectif :** Remplacer le mock par `supabase.auth`. Le store doit exposer exactement les mêmes méthodes (`login`, `register`, `logout`) avec les mêmes signatures. Ajouter une méthode `initialize()` pour restaurer la session au démarrage.

**Contrat de données du `user` (identique à l'existant) :**
```javascript
{
  id: string,           // UUID de auth.users
  email: string,
  companyName: string,  // Mappé depuis businesses.name
  businessDomain: string, // Mappé depuis businesses.business_type
  businessId: string    // UUID de businesses.id — NOUVEAU champ critique
}
```

**Code complet attendu :**

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // À appeler dans App.jsx au montage (useEffect)
      initialize: async () => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await get()._hydrateUserFromSession(session.user);
        }
        // Écouter les changements de session (refresh token, logout externe)
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            await get()._hydrateUserFromSession(session.user);
          } else {
            set({ user: null, isAuthenticated: false });
          }
        });
        set({ isLoading: false });
      },

      // Méthode interne — ne pas exposer dans l'UI
      _hydrateUserFromSession: async (authUser) => {
        const { data: business, error } = await supabase
          .from('businesses')
          .select('id, name, business_type')
          .eq('owner_id', authUser.id)
          .single();

        if (error || !business) {
          // L'utilisateur existe dans auth mais n'a pas encore de business
          set({ user: { id: authUser.id, email: authUser.email, companyName: null, businessDomain: null, businessId: null }, isAuthenticated: true });
          return;
        }

        set({
          user: {
            id: authUser.id,
            email: authUser.email,
            companyName: business.name,
            businessDomain: business.business_type,
            businessId: business.id,
          },
          isAuthenticated: true,
        });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          set({ isLoading: false });
          throw new Error(error.message); // L'UI doit catcher cette erreur
        }
        await get()._hydrateUserFromSession(data.user);
        set({ isLoading: false });
      },

      // register crée le compte auth ET la ligne business en une seule transaction logique
      register: async (email, password, companyName, businessDomain) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          set({ isLoading: false });
          throw new Error(error.message);
        }

        // Insérer le business immédiatement après la création du compte
        const { error: bizError } = await supabase
          .from('businesses')
          .insert({ name: companyName, owner_id: data.user.id, business_type: businessDomain });

        if (bizError) {
          set({ isLoading: false });
          throw new Error('Compte créé mais erreur lors de la création du commerce : ' + bizError.message);
        }

        await get()._hydrateUserFromSession(data.user);
        set({ isLoading: false });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      // Ne persister que les infos non-sensibles. La session est gérée par Supabase.
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

**Modification requise dans `App.jsx` (ou le composant racine) :**
```javascript
// Dans le useEffect de démarrage de l'app
import { useAuthStore } from './store/useAuthStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  useEffect(() => { initialize(); }, []);
  // ...
}
```

---

## 🛍️ ÉTAPE 2 — Migration de `useCatalogStore.js`

**Fichier cible : `src/store/useCatalogStore.js`**

**Objectif :** Remplacer les données statiques par une requête vers la table `products`. Activer le mode **Realtime** de Supabase pour que toute modification du catalogue (ajout produit, mise à jour stock) se répercute instantanément dans l'UI sans polling.

**Important :** La méthode `hydrateForDomain(domain)` doit toujours exister mais son implémentation change. Elle doit maintenant lire `businessId` depuis `useAuthStore` et ne plus avoir besoin du paramètre `domain` (le conserver pour la rétrocompatibilité).

```javascript
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

export const useCatalogStore = create((set, get) => ({
  items: [],
  isLoading: false,
  _realtimeChannel: null, // Référence interne au channel Supabase Realtime

  hydrateForDomain: async (_domain) => {
    // Le paramètre _domain est conservé pour la rétrocompatibilité mais ignoré.
    // La source de vérité est maintenant useAuthStore.
    const { user } = useAuthStore.getState();
    if (!user?.businessId) return;

    set({ isLoading: true });

    // 1. Charger les données initiales
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price_ht, tva_rate, category, stock_quantity, barcode')
      .eq('business_id', user.businessId)
      .order('category', { ascending: true });

    if (error) {
      console.error('[CatalogStore] Erreur chargement produits:', error);
      set({ isLoading: false });
      return;
    }

    // Mapper les colonnes SQL vers l'interface attendue par l'UI
    const mappedItems = data.map((p) => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price_ht) * (1 + parseFloat(p.tva_rate) / 100), // Calcul TTC
      price_ht: parseFloat(p.price_ht),
      tva_rate: parseFloat(p.tva_rate),
      category: p.category,
      stock: p.stock_quantity,
      barcode: p.barcode,
    }));

    set({ items: mappedItems, isLoading: false });

    // 2. S'abonner aux changements Realtime
    // Nettoyer l'abonnement précédent si existant
    const prevChannel = get()._realtimeChannel;
    if (prevChannel) supabase.removeChannel(prevChannel);

    const channel = supabase
      .channel(`products-${user.businessId}`)
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'products',
        filter: `business_id=eq.${user.businessId}`,
      }, (payload) => {
        // Mettre à jour le store localement sans re-fetcher toute la table
        if (payload.eventType === 'INSERT') {
          const p = payload.new;
          set((state) => ({ items: [...state.items, { id: p.id, name: p.name, price: parseFloat(p.price_ht) * (1 + parseFloat(p.tva_rate) / 100), price_ht: parseFloat(p.price_ht), tva_rate: parseFloat(p.tva_rate), category: p.category, stock: p.stock_quantity, barcode: p.barcode }] }));
        }
        if (payload.eventType === 'UPDATE') {
          const p = payload.new;
          set((state) => ({ items: state.items.map((item) => item.id === p.id ? { ...item, name: p.name, price: parseFloat(p.price_ht) * (1 + parseFloat(p.tva_rate) / 100), stock: p.stock_quantity } : item) }));
        }
        if (payload.eventType === 'DELETE') {
          set((state) => ({ items: state.items.filter((item) => item.id !== payload.old.id) }));
        }
      })
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
    // Le Realtime s'occupe de la mise à jour du store automatiquement
  },

  updateStock: async (itemId, newStockQuantity) => {
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newStockQuantity })
      .eq('id', itemId);

    if (error) throw new Error(error.message);
    // Le Realtime s'occupe de la mise à jour du store automatiquement
  },

  cleanup: () => {
    const channel = get()._realtimeChannel;
    if (channel) supabase.removeChannel(channel);
    set({ _realtimeChannel: null });
  },
}));

// Conserver le mécanisme d'auto-hydratation existant — il fonctionnera toujours
useAuthStore.subscribe((state, prevState) => {
  if (state.user?.businessId && state.user.businessId !== prevState.user?.businessId) {
    useCatalogStore.getState().hydrateForDomain(state.user?.businessDomain);
  }
});
```

---

## 🛒 ÉTAPE 3 — Migration de `useCartStore.js` (Checkout + Offline-First)

**Fichier cible : `src/store/useCartStore.js`**

**Objectif :** Implémenter la méthode `checkout()` manquante avec :
1. Persistance de la vente dans Supabase (`sales` table).
2. Décrémenter le stock des produits vendus.
3. Gestion Offline-First : si pas de réseau, empiler dans `IndexedDB` via la librairie `idb-keyval` (légère, ~600 bytes gzippée).

**Installation préalable :**
```bash
npm install idb-keyval
```

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';
import { useCatalogStore } from './useCatalogStore'; // Nécessaire pour la mise à jour CSR du stock

// --- Logique de sync offline (fonction utilitaire pure) ---
const OFFLINE_QUEUE_PREFIX = 'offline_sale_';

const persistSaleToSupabase = async (salePayload) => {
  // 1. Persister la vente — Supabase est une couche de stockage, pas de calcul.
  const { error } = await supabase.from('sales').insert(salePayload);
  if (error) throw error;

  // 2. Décrémenter le stock côté CLIENT puis écrire le résultat final.
  // Philosophie CSR-First : le calcul (stock actuel - quantité vendue) est fait ici,
  // dans le navigateur. On envoie à Supabase uniquement la nouvelle valeur absolue.
  // On lit le stock depuis useCatalogStore (source de vérité locale) pour éviter
  // un aller-retour réseau inutile.
  const { items: catalogItems } = useCatalogStore.getState();

  const stockUpdates = salePayload.items
    .filter((soldItem) => {
      const catalogItem = catalogItems.find((p) => p.id === soldItem.id);
      // Ne mettre à jour que les produits avec un stock suivi (non null)
      return catalogItem?.stock !== null && catalogItem?.stock !== undefined;
    })
    .map((soldItem) => {
      const catalogItem = catalogItems.find((p) => p.id === soldItem.id);
      const newStock = Math.max(0, catalogItem.stock - soldItem.quantity); // Calcul CSR
      return { id: soldItem.id, stock_quantity: newStock };
    });

  // Envoyer les mises à jour en parallèle (best-effort, non bloquant sur la vente)
  await Promise.allSettled(
    stockUpdates.map(({ id, stock_quantity }) =>
      supabase.from('products').update({ stock_quantity }).eq('id', id)
    )
  );
  // Note : Le Realtime Supabase répercutera automatiquement ces changements
  // dans useCatalogStore via le channel postgres_changes — pas de set() manuel nécessaire.
};

const flushOfflineQueue = async () => {
  const allKeys = await idbKeys();
  const offlineKeys = allKeys.filter((k) => String(k).startsWith(OFFLINE_QUEUE_PREFIX));
  if (offlineKeys.length === 0) return;

  for (const key of offlineKeys) {
    const salePayload = await idbGet(key);
    try {
      await persistSaleToSupabase(salePayload);
      await idbDel(key); // Supprimer de la queue seulement si le push a réussi
    } catch (e) {
      console.warn('[CartStore] Sync offline échoué pour', key, e);
      break; // Arrêter au premier échec pour préserver l'ordre
    }
  }
};

// --- Le Store ---
export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      client: null,
      discounts: [],
      paymentMethods: [],

      addItem: (product) => {
        set((state) => {
          const existing = state.cart.find((i) => i.id === product.id);
          if (existing) {
            return { cart: state.cart.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) };
          }
          return { cart: [...state.cart, { ...product, quantity: 1 }] };
        });
      },

      removeItem: (productId) => set((state) => ({ cart: state.cart.filter((i) => i.id !== productId) })),

      updateItemQuantity: (productId, quantity) => {
        if (quantity <= 0) { get().removeItem(productId); return; }
        set((state) => ({ cart: state.cart.map((i) => i.id === productId ? { ...i, quantity } : i) }));
      },

      setClient: (client) => set({ client }),

      clearCart: () => set({ cart: [], client: null, discounts: [], paymentMethods: [] }),

      getTotal: () => {
        const state = get();
        return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      // ✅ LA MÉTHODE MANQUANTE — Implémentation complète
      checkout: async (paymentMethod) => {
        const state = get();
        const { user } = useAuthStore.getState();

        if (!user?.businessId) throw new Error('Utilisateur non authentifié');
        if (state.cart.length === 0) throw new Error('Panier vide');

        const salePayload = {
          business_id: user.businessId,
          total_ttc: parseFloat(state.getTotal().toFixed(2)),
          payment_method: paymentMethod,
          items: state.cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          created_at: new Date().toISOString(),
        };

        if (navigator.onLine) {
          // Mode connecté : push direct
          try {
            await persistSaleToSupabase(salePayload);
          } catch (e) {
            console.error('[CartStore] Erreur push vente, mise en queue offline:', e);
            const queueKey = `${OFFLINE_QUEUE_PREFIX}${Date.now()}`;
            await idbSet(queueKey, salePayload);
          }
        } else {
          // Mode offline : empiler dans IndexedDB
          const queueKey = `${OFFLINE_QUEUE_PREFIX}${Date.now()}`;
          await idbSet(queueKey, salePayload);
          console.info('[CartStore] Vente mise en queue offline. Clé:', queueKey);
        }

        get().clearCart();
        return salePayload; // Retourner le payload pour permettre l'affichage du reçu
      },

      // Appeler au démarrage de l'app ET à chaque reconnexion réseau
      syncOfflineQueue: async () => {
        if (navigator.onLine) await flushOfflineQueue();
      },
    }),
    { name: 'cart-storage' }
  )
);
```

**Modification requise dans `App.jsx` pour la sync offline :**
```javascript
useEffect(() => {
  const { syncOfflineQueue } = useCartStore.getState();
  syncOfflineQueue(); // Au démarrage
  window.addEventListener('online', syncOfflineQueue);
  return () => window.removeEventListener('online', syncOfflineQueue);
}, []);
```

---

## 🚫 PAS D'ÉTAPE 4 — Aucune fonction serveur à créer

Conformément à la philosophie **CSR-First**, aucune fonction PostgreSQL (`FUNCTION`), trigger, ou Edge Function Supabase ne doit être créée. La mise à jour du stock est gérée entièrement côté client dans `persistSaleToSupabase` (voir Étape 3). Supabase ne contient que des tables et des politiques RLS.

---

## ✅ CHECKLIST DE VALIDATION FINALE

Après implémentation, l'IA de code doit vérifier les points suivants :

- [ ] `supabase.auth.signInWithPassword` retourne un token valide et le user est hydraté dans `useAuthStore`
- [ ] La déconnexion via `logout()` vide bien le store et invalide la session Supabase
- [ ] Après login, `useCatalogStore.items` contient les produits de la table `products` filtrés par `business_id`
- [ ] Modifier un produit dans Supabase Studio met à jour l'UI sans reload (Realtime)
- [ ] `checkout()` insère bien une ligne dans la table `sales` avec le bon `business_id`
- [ ] Passer en mode avion, effectuer une vente, revenir en ligne : la vente se synchronise automatiquement
- [ ] Aucun composant UI n'a été modifié (seuls les stores et `App.jsx`)

---

## 🚫 CE QUE L'IA DE CODE NE DOIT PAS FAIRE

- Ne pas installer TypeScript ni convertir les fichiers `.jsx` en `.tsx`
- Ne pas modifier les composants dans `/features/` ou `/pages/`
- Ne pas utiliser `localStorage` pour la queue offline (utiliser `idb-keyval` comme spécifié)
- Ne pas implémenter le chaînage NF525 (hachage `previous_hash` / `current_hash`) dans cette session — c'est la prochaine étape
- Ne pas modifier le schéma SQL (les tables sont déjà créées)
- Ne pas utiliser `@supabase/auth-helpers-react` — utiliser uniquement `@supabase/supabase-js` directement
- **Ne jamais créer de fonction PostgreSQL, trigger, ou Edge Function Supabase** — toute logique métier doit vivre dans les stores Zustand
- **Ne jamais appeler `supabase.rpc()`** — c'est un appel à du code serveur, violation directe de l'architecture CSR-First
- **Ne jamais créer de fichier backend** (serveur Node.js, Express, API route) — l'app est 100% statique

---

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

*Généré le 2026-03-28 | Version 1.2 — CSR-First + Annexe Stock Offline | Projet : Caisse Automatique Universelle*
