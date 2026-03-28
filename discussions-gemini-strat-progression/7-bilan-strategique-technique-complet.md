# 📖 BIBLE DU PROJET : Caisse Automatique Universelle 2026 (Analyse Profonde & Technique)

> [!IMPORTANT]
> **Avertissement à l'attention de l'Expert IA** : Ce document est la "Bible" technique et stratégique du projet. Il analyse en profondeur l'état actuel du code source en le confrontant à l'architecture cible définie dans le dossier `discussions-gemini-strat-progression`. 
> Les extraits de code présents dans ce document reflètent **strictement** le code actuel de l'application et la structure SQL attendue.

---

## 📌 Table des Matières
1. [Contexte et Genèse Stratégique](#1-contexte-et-genèse-stratégique)
2. [Audit de l'Architecture Frontend (L'Existant)](#2-audit-de-larchitecture-frontend-lexistant)
3. [Audit du State Management (Zustand) et Lignes de Code](#3-audit-du-state-management-zustand-et-lignes-de-code)
4. [La Transition vers le SaaS SaaS (Supabase)](#4-la-transition-vers-le-saas- supabase)
5. [Le Verrou Légal : La Certification NF525](#5-le-verrou-légal--la-certification-nf525)
6. [Feuille de Route & Master Prompt pour l'Expert IA](#6-feuille-de-route--master-prompt-pour-lexpert-ia)

---

## 1. Contexte et Genèse Stratégique

### 1.1 La Vision "Moteur Unique, Carrosseries Multiples"
Le projet vise à disrupter le marché des logiciels de caisse (dominé par Planity, Merlin, 60-100€/mois), en proposant une alternative **SaaS universelle** (Retail, Food, Beauté) à **19-39€/mois**. 

L'avantage concurrentiel repose sur 3 piliers :
1.  **Zéro Hardware Propriétaire** : L'app utilise le smartphone du commerçant comme douchette code-barre via **WebRTC** (`PeerJS`).
2.  **Résilience Absolue** : Une conception **Offline-First** (Zero perte de vente).
3.  **Universalité UI** : Un système adaptant l'UI au secteur (Boutique = scan rapide, Restauration = modificateurs de plats).

---

## 2. Audit de l'Architecture Frontend (L'Existant)

Le code repose sur une stack moderne : **Vite + React 19 + Tailwind CSS 4 + HeroUI** (`package.json`).

### 2.1 Analyse de l'Arborescence `src/` Actuelle
- **`/features/`** : Découpage clair par domaine (`/pos`, `/dashboard`, `/scanner`).
- **`/store/`** : Cœur logique (Zustand).
- **`/pages/`** : Routage lourd (`DashboardPage.jsx`, `LandingPage.jsx`, `PosPage.jsx`).
- **`/layouts/`** : Enveloppes UI.

---

## 3. Audit du State Management (Zustand) et Lignes de Code

L'architecture s'appuie sur la philosophie "Store-First". Les contrats de données actuels sont définis ainsi :

### 3.1 `useAuthStore.js` (L'Authentification)
**Alerte** : Le store actuel est intégralement *mocké* et stocké localement.
```javascript
// Extrait actuel de src/store/useAuthStore.js
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // Structure attendue: { companyName, email, businessDomain }
      isAuthenticated: false,
      login: (email, password) => {
        // Mock login actuel
        set({ 
          user: { companyName: "Demo Company", email, businessDomain: "Restauration" },
          isAuthenticated: true 
        });
      },
      // ... register et logout
    }),
    { name: 'auth-storage' }
  )
);
```

### 3.2 `useCatalogStore.js` (Les Produits)
**Alerte** : Le catalogue est un gros objet statique. Il inclut déjà une logique d'hydratation automatique liée au domaine de l'Auth, c'est une excellente base pour la future requête réseau.
```javascript
// Extrait actuel de src/store/useCatalogStore.js
const CATALOGS_BY_DOMAIN = {
  "Restauration": [
    { id: '1', name: 'Espresso', category: 'Boissons', price: 2.5, stock: null, barcode: null },
    // ...
  ],
  "Retail": [
    { id: '1', name: 'T-Shirt Blanc Basique', category: 'Vêtements', price: 15.0, stock: 100, barcode: '111222' },
  ]
};

export const useCatalogStore = create((set, get) => ({
  items: [],
  isLoading: false,
  hydrateForDomain: (domain) => {
    const catalog = CATALOGS_BY_DOMAIN[domain] || CATALOGS_BY_DOMAIN["Autre"];
    set({ items: catalog });
  },
  // ... addItem, updateStock
}));

// Auto-hydrate quand le store auth change
useAuthStore.subscribe((state, prevState) => {
  if (state.user?.businessDomain && state.user.businessDomain !== prevState.user?.businessDomain) {
    useCatalogStore.getState().hydrateForDomain(state.user.businessDomain);
  }
});
```

### 3.3 `useCartStore.js` (Le Panier)
**Alerte** : Il manque la méthode fondamentale `checkout()` pour persister la liste de produits finale.
```javascript
// Extrait actuel de src/store/useCartStore.js
export const useCartStore = create((set, get) => ({
  cart: [],
  client: null,
  discounts: [],
  paymentMethods: [], 
  // methodes: addItem, removeItem, updateItemQuantity, setClient, clearCart
  getTotal: () => {
    const state = get();
    return state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
```

---

## 4. La Transition vers le SaaS (Supabase)

La stratégie validée (`6-supabase-vs-cloudflare.md`) impose PostgreSQL. 
Le schéma ci-dessous, issu de `4-precisions-supabase.md`, **doit** être implémenté.

### 4.1 Script SQL Cible (Multi-tenant)
```sql
CREATE TABLE businesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users NOT NULL,
  business_type text CHECK (business_type IN ('retail', 'restauration', 'service', 'beaute')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
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
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) NOT NULL,
  total_ttc numeric(10,2) NOT NULL,
  payment_method text,
  items jsonb NOT NULL, -- Stockage brut de l'état "cart" du useCartStore
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4.2 L'Impératif de Sécurité Publique (RLS)
Les stratégies RLS (Row Level Security) SQL suivantes empêcheront toute fuite de données inter-clients sur l'API publique Supabase :
```sql
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accès entreprise par propriétaire" ON businesses 
FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Accès produits par entreprise" ON products 
FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
```

---

## 5. Le Verrou Légal : La Certification NF525

Il s'agit du chantier le plus complexe techniquement (`2-mise-au-point1.md`). Le code actuel ne le gère pas.

### 5.1 Inaltérabilité & Le Chaînage Cryptographique
En France, un logiciel de caisse ne permet **jamais** de modifier une transaction (Pas d'Update sur les montants, pas de suppression). Toute modification prend la forme d'une ligne comptable négative (Annulation).
- **Mission Technique** : La table `sales` nécessitera l'ajout d'une colonne `previous_hash` et `current_hash`. Chaque nouvelle insertion de vente devra hasher ses propres données avec le hash de la vente précédente calculé par le serveur PostgreSQL (probablement via un Trigger ou une Fonction Edge) pour éviter une brèche depuis le client JS.

### 5.2 L'Impératif "Offline-First"
- **Mission Technique** : `useCartStore` doit écrire dans `IndexedDB` au moment du checkout. Si `navigator.onLine` est faux, la donnée s'empile. Une fonction asynchrone tentera le push vers le backend (`supabase.from('sales').insert()`) dès le retour du flux.

---

## 6. Expertise IA : Audit, Vision & Pistes d'Amélioration 🚀

Ce document a été conçu comme une **"Bible de Référence"** pour permettre à une IA experte de s'immerger instantanément dans le projet. 

### 🎯 Objectifs de la Consultation
L'Expert IA est invité à utiliser cet état des lieux pour remplir les missions suivantes :

1.  **Audit Critique** : Donner un avis technique tranché sur la situation actuelle du code (Zustand, PeerJS, structure Vite/React 19).
2.  **Validation de Vision** : Analyser si la trajectoire actuelle (Supabase, Offline-First, NF525) est la plus pertinente pour un lancement en 3 semaines.
3.  **Force de Proposition** : Proposer des pistes d'améliorations techniques ou des idées stratégiques auxquelles nous n'aurions pas pensé pour rendre le produit encore plus disruptif.
4.  **Exécution du Master Prompt** : Une fois l'audit terminé, passer à la proposition de plan d'implémentation des couches de données réelles, des bouts de codes d'exemples, afin qu'une autre ia de code puisse avoir le maximum de chances de bien réaliser la demande, et pour cela, il faudra être le plus précis possible, donner le meilleur des prompts possible.

### 📝 Directives Opérationnelles (Master Prompt)
> **Mission** : Dé-mocker les stores Zustand et remplacer le stockage local par le backend Supabase, en respectant le schéma multi-tenant sécurisé.

- **Auth Layer** : Intégrer `@supabase/supabase-js`. Mapper le `businessDomain`.
- **Sync Layer** : Connecter `useCatalogStore.js` à la table `products` avec le mode **Realtime**.
- **Checkout Layer** : Implémenter la persistance résiliente (Offline-first) dans `useCartStore.js`.
- **UI Policy** : Respecter l'identité visuelle **HeroUI** et **Tailwind 4**.

Le produit doit être commercialisable sous 21 jours. Nous attendons des solutions, pas des questions. À vous de jouer.
Précision ULTRA-IMPORTANTE : tu es une autre ia experte en code que nous utilisons, et à laquelle nous demandons ici un avis technique et stratégique sur le projet. Tu dois donc être le plus précis possible, donner le meilleur des prompts possible, afin qu'une autre ia de code puisse avoir le maximum de chances de bien réaliser la demande. Mais nous ne te demandons pas ici de réaliser la chose, simplement de nous donner le meilleur des prompts afin que nous le donnions à une autre ia qui aura alors le max de chances de réaliser la demande au mieux.
