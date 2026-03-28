# 🗺️ Plan d'Implémentation Technique : Migration Supabase SaaS

Ce document constitue la feuille de route détaillée pour transformer le prototype actuel de la **Caisse Automatique Universelle 2026** en une plateforme SaaS multi-tenant fonctionnelle.

---

## 🎯 Vision & Objectifs
L'architecture cible repose sur un modèle **CSR-First** (Client-Side Rendering) :
- **Moteur Logique** : Zustand (calculs, gestion d'état, règles métier).
- **Couche de Données** : Supabase (Authentification, Persistance, Sécurité RLS, Realtime).
- **Résilience** : Offline-First via IndexedDB pour garantir l'encaissement sans réseau.

---

## 🚀 Phase 1 : Socle technique & Authentification Multi-tenant
**Objectif** : Connecter l'application à Supabase et gérer l'isolation des données par commerce.

### 1.1 Initialisation du SDK
- Installation de `@supabase/supabase-js`.
- Création de `src/lib/supabaseClient.js` utilisant les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

### 1.2 Migration de `useAuthStore.js`
- Remplacer le mock par `supabase.auth.signInWithPassword` et `signUp`.
- **Inscription (Register)** :
    - Étape A : Création du compte utilisateur dans `auth.users`.
    - Étape B : Insertion immédiate dans la table `businesses` (nom du commerce, type de métier, owner_id).
- **Hydratation** : Lors du login, récupérer le `business_id` et le `business_type` pour configurer le reste de l'application.
- **Persistance** : Implémenter `initialize()` pour restaurer la session via `supabase.auth.getSession()`.

---

## 📦 Phase 2 : Catalogue Dynamique & Synchronisation Temps Réel
**Objectif** : Dé-mocker les produits et permettre une mise à jour instantanée entre terminaux.

### 2.1 Refonte de `useCatalogStore.js`
- Abandonner `CATALOGS_BY_DOMAIN` au profit d'un fetch sur la table `products` filtré par `business_id`.
- **Optimisation Realtime** : 
    - Activer `supabase.channel()` pour écouter les événements `INSERT`, `UPDATE` et `DELETE` sur la table `products`.
    - Mettre à jour le store localement sans recharger la page entière.
- **Stock & Code-barres** : Les champs `stock_quantity` et `barcode` deviennent les sources de vérité pour le scanner et l'inventaire.

---

## 🛒 Phase 3 : Ventes Résilientes & Stratégie Offline
**Objectif** : Sécuriser chaque transaction, même en cas de coupure internet.

### 3.1 Implémentation du Checkout (`useCartStore.js`)
- Création de la méthode `checkout(paymentMethod)` :
    - Génération du `salePayload` (items, total, timestamp).
    - Soumission à la table `sales` de Supabase.
- **Mise à jour des stocks** :
    - Calcul de la nouvelle quantité côté client (CSR-First).
    - Envoi d'un `UPDATE` sur `products.stock_quantity`.

### 3.2 File d'attente Offline (IndexedDB)
- Installation de `idb-keyval`.
- Si `navigator.onLine` est faux : Stocker la vente dans IndexedDB avec un préfixe `offline_sale_`.
- **Sync Automatique** : Écouter l'événement `window.online` pour vider la file d'attente et pousser les ventes manquées vers Supabase.

---

## ⚖️ Phase 4 : Fiabilité, Légal & Rapports
**Objectif** : Rendre l'application conforme aux attentes comptables et commerciales.

### 4.1 Rapports & Dashboard
- Création d'un `useReportStore` pour agréger les ventes journalières (Z-caisse).
- Export des données en CSV/Excel pour la comptabilité.

### 4.2 Préparation NF525
- Ajout des colonnes de hachage chainé dans la table `sales` (`previous_hash`, `current_hash`).
- Mise en place d'un système d'annulation par transaction négative (aucune suppression autorisée).

---

## 🛠️ Master Prompt pour l'IA d'Exécution
> [!TIP]
> Copiez ce bloc pour lancer la réalisation de la Phase 1 et 2.

```markdown
**Mission** : Dé-mocker les stores Zustand (Auth et Catalog) et connecter le backend Supabase réel.

**Contraintes techniques** :
1. Architecture CSR-First : Zéro logique serveur, tout dans Zustand.
2. Tout le code en **TypeScript**.
3. Utiliser `@supabase/supabase-js`.
4. Respecter le schéma SQL multi-tenant (RLS activé).
5. Implémenter le mode **Realtime** pour le catalogue produits.

**Livrables prioritaires** :
- `src/lib/supabaseClient.js`
- `src/store/useAuthStore.js` (Sign-up, Login, Session Restore)
- `src/store/useCatalogStore.js` (Fetch produits, Realtime subscription)
```

---
*Plan généré le 2026-03-28 | Contexte : Migration Supabase pour Caisse 2026*
