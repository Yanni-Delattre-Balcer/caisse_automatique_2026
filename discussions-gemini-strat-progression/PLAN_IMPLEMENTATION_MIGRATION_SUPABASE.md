# 🗺️ Plan d'Implémentation : Migration Supabase (Version Adaptée)

Ce plan est l'adaptation de la stratégie de migration vers Supabase, alignée sur les préconisations techniques du document `PLAN_IMPLEMENTATION_FINAL_CLAUDE.md`. L'objectif est une migration propre en **TypeScript**, respectant l'architecture **CSR-First** et **Offline-First**.

---

## 🏗️ Architecture Technique
- **Stack** : Vite + React 19 + TypeScript.
- **Backend** : Supabase (Auth, RLS, Realtime).
- **State Management** : Zustand (Logicielle métier).
- **Résilience** : IndexedDB via `idb-keyval`.

---

## 📅 Étapes de Mise en Œuvre

### Étape 0 : Préparation (Effectué ✅)
- Installation des dépendances : `@supabase/supabase-js`, `idb-keyval`.
- Configuration du fichier `.env` avec les clés API.

### Étape 1 : Infrastructure SQL (Côté Utilisateur)
- Application du schéma SQL dans le Studio Supabase :
  - Tables : `businesses`, `products`, `sales`.
  - Politiques RLS pour l'isolation multi-tenant.
  - Contrainte `CHECK` sur les stocks.

### Étape 2 : Initialisation du Client (`src/lib/supabaseClient.ts`)
- Création du point d'entrée unique pour les interactions avec le SDK Supabase.
- Validation des variables d'environnement.

### Étape 3 : Définition des Types globaux (`src/types/index.ts`)
- Centralisation des interfaces : `AppUser`, `CatalogItem`, `CartItem`, `SalePayload`.
- Mapping propre entre les données brutes Supabase et les besoins de l'UI.

### Étape 4 : Migration du Store Auth (`src/store/useAuthStore.ts`)
- Remplacement du mock local par `supabase.auth`.
- Logique de `signUp` avec création automatique d'un commerce (`businesses`).
- Hydratation de l'utilisateur avec son `businessId` lors de la connexion.

### Étape 5 : Migration du Store Catalogue (`src/store/useCatalogStore.ts`)
- Chargement des produits filtrés par `businessId`.
- **Realtime** : Abonnement aux changements PostgreSQL pour une mise à jour instantanée des stocks et prix sur tous les terminaux.

### Étape 6 : Migration du Store Panier & Offline (`src/store/useCartStore.ts`)
- Implémentation du `checkout()` avec insertion dans `sales`.
- **CSR-First** : Calcul du nouveau stock côté client avant envoi.
- **File d'attente Offline** : Mise en queue des ventes dans IndexedDB en cas de perte de réseau.

### Étape 7 : Finalisation dans `App.tsx`
- Initialisation de la session Supabase au montage.
- Branchement des écouteurs `online` pour synchroniser automatiquement les ventes offline.

---

## 🧪 Protocole de Validation
Une fois l'implémentation terminée, nous suivrons strictement le fichier [scenartest.md](file:///Users/blemeill/Development/caisse_automatique_2026/discussions-gemini-strat-progression/scenartest.md) pour valider :
1. L'isolation des données (Multi-tenant).
2. La synchronisation instantanée (Realtime).
3. La continuité de service hors connexion (Offline).
4. La justesse des stocks.

---
*Ce plan sert de base pour les prochaines itérations de code.*
