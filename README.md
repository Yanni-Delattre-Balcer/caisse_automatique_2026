# 🛒 Caisse Automatique Universelle 2026 (OmniPOS)

Bienvenue sur le projet **Caisse Automatique Universelle 2026** !
Il s'agit d'une application de point de vente (POS) ultra-moderne, conçue pour offrir une expérience "Apple-Grade", robuste, réactive, et capable de fonctionner en mode hors-ligne.

## ✨ Fonctionnalités Principales

- **Interface "Apple-Grade"** : Design épuré utilisant le Glassmorphism (inspiré par Synapseo), avec une sidebar de navigation "Rail", des cartes produits interactives et un panier sécurisé.
- **Offline-First & Résilience** : Grâce à IndexedDB, l'application continue de fonctionner et d'encaisser même sans connexion internet. Les données sont synchronisées dès le retour du réseau.
- **Synchronisation Temps Réel** : Les modifications du catalogue (prix, stocks) via Supabase sont répercutées instantanément sur toutes les caisses connectées.
- **Multi-Tenant Sécurisé** : Chaque commerçant possède son propre espace, hautement sécurisé grâce au Row Level Security (RLS) de Supabase.
- **Mode Démo Inclus** : Possibilité de lancer l'application avec un faux jeu de données (ex: Boulangerie Louise) pour des démonstrations commerciales sans base de données.

## 🛠️ Stack Technique

- **Frontend** : React 19, Vite
- **Styling** : Tailwind CSS v4, HeroUI, Framer Motion (pour les animations fluides)
- **Gestion d'État** : Zustand (persisté)
  - `useAuthStore` : Sessions et rôles.
  - `useCatalogStore` : Catalogue et flux temps réel.
  - `useCartStore` : Logique transactionnelle.
- **Backend / BaaS** : Supabase (PostgreSQL, Auth, Realtime)
- **Stockage Local** : `idb-keyval` (IndexedDB)

## 🚀 Commencer
Consultez le fichier `commands.md` pour les instructions détaillées sur la façon d'installer et de lancer le projet en local afin de garantir un environnement de dev identique pour toute l'équipe.
