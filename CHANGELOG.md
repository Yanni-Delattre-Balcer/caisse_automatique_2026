# CHANGELOG — OmniPOS (31 Mars 2026)

## Vue d'ensemble

Cette mise à jour majeure prépare OmniPOS pour un déploiement en production avec de vrais clients.
Tous les boutons sont maintenant fonctionnels, les pages manquantes sont créées, et l'architecture
est prête pour intégrer Auth0 (authentification) et Stripe (paiements).

---

## Nouveaux fichiers créés

### Base de données — `supabase/schema.sql`
- **Schéma SQL complet** à exécuter dans le SQL Editor de Supabase
- Tables: `businesses`, `products`, `sales`, `categories`, `staff`, `subscriptions`
- **Row Level Security (RLS)** sur toutes les tables — chaque commerce ne voit que ses données
- Indexes optimisés pour les requêtes fréquentes
- Trigger auto `updated_at` sur les tables modifiables
- Trigger auto de génération de numéro de reçu (`REC-20260331-00001`)
- Table `subscriptions` prête pour Stripe

### Système de notifications — `src/store/useToastStore.ts` + `src/components/ToastContainer.jsx`
- Store Zustand pour les toasts (success, error, info, warning)
- Composant animé (Framer Motion) en bas à droite de l'écran
- Auto-disparition après 4 secondes (configurable)
- Utilisé partout : checkout, inventaire, paramètres, dashboard, export

### Error Boundary — `src/components/ErrorBoundary.jsx`
- Attrape les erreurs React non gérées au runtime
- Affiche une page d'erreur élégante avec bouton "Recharger"
- Wrappé autour de toute l'app dans `main.jsx`

### Page Inventaire — `src/pages/InventoryPage.jsx`
- **Tableau complet** des produits avec recherche par nom/code-barre/catégorie
- **Ajout de produit** : modal avec tous les champs (nom, prix HT, TVA, catégorie, stock, code-barre)
- **Modification** : pré-remplit le formulaire avec les données existantes
- **Suppression** : avec confirmation
- Calcul automatique du prix TTC affiché en temps réel dans le formulaire
- Alerte visuelle (rouge) pour les stocks faibles (≤ 5)
- Fonctionne en mode démo (modifications locales) ET en production (Supabase)

### Page Paramètres — `src/pages/SettingsPage.jsx`
- **Informations commerce** : nom, email, téléphone, adresse
- **Informations fiscales** : SIRET, N° TVA intracommunautaire
- **Poste de caisse** : nom du caissier, mode d'activité
- **Apparence** : toggle thème sombre/clair
- **Infos compte** : email, ID commerce, mode (démo/production)
- Sauvegarde en un clic vers Supabase

### Intégration Stripe — `src/lib/stripe.ts`
- Module d'initialisation Stripe (lazy loading)
- Fonction `redirectToCheckout` pour rediriger vers Stripe Checkout
- Les boutons "Démarrer l'essai" et "Demander un devis" sur la landing page sont câblés
- Si Stripe n'est pas configuré → toast informatif (pas de crash)

### Documentation — `docs/`
- **`docs/AUTH0_SETUP.md`** : Guide étape par étape pour configurer Auth0
  - Création du tenant, de l'application
  - Variables d'environnement à remplir
  - Installation du SDK `@auth0/auth0-react`
  - Code d'exemple pour le Provider et les composants
  - Connexion Auth0 ↔ Supabase
- **`docs/STRIPE_SETUP.md`** : Guide complet pour configurer Stripe
  - Création des produits/prix (29€/mois et 499€ unique)
  - Variables d'environnement
  - Configuration des webhooks
  - Code de la Supabase Edge Function pour le checkout
  - Cartes de test pour le développement
  - Checklist avant mise en production

### Configuration — `.env.example`
- Template de toutes les variables d'environnement nécessaires
- Sections : Supabase (obligatoire), Stripe (optionnel), Auth0 (optionnel)

---

## Fichiers modifiés

### `src/features/pos/CheckoutCart.jsx` — REFONTE MAJEURE
**Avant** : Les boutons CB et Espèces ne faisaient rien.
**Après** :
- Boutons **CB** et **Espèces** câblés au `checkout()` du store
- Icônes CreditCard et Banknote sur les boutons
- **État de chargement** pendant le traitement (spinner + disabled)
- **Modal de reçu** après paiement réussi : détail des articles, total, méthode, heure
- **Toasts** de confirmation/erreur
- Les boutons sont désactivés si le panier est vide

### `src/pages/DashboardPage.jsx` — DONNÉES RÉELLES
**Avant** : Données hardcodées (1,204.50€, 42 ventes, 28.67€ panier moyen).
**Après** :
- **Requêtes Supabase** pour les ventes du jour (CA, nombre, panier moyen)
- **Graphique hebdomadaire** avec données réelles (Lun→Dim)
- Bouton **Rafraîchir** pour recharger les données
- **Export comptable** basé sur les vraies ventes (pas des données fake)
- Mode démo conservé avec des données de démonstration
- États de chargement ("...") pendant le fetch

### `src/features/dashboard/RevenueChart.jsx`
- Accepte maintenant des `props` (`data`, `loading`) au lieu de données hardcodées
- Fallback vers un graphique vide si pas de données
- Indicateur de chargement dans le header

### `src/App.tsx` — NOUVELLES ROUTES
- Route `/inventory` → `InventoryPage` (remplace le placeholder "En cours de construction")
- Route `/settings` → `SettingsPage` (remplace le placeholder)
- Imports des nouvelles pages

### `src/main.jsx` — WRAPPING GLOBAL
- `ErrorBoundary` wrappé autour de toute l'app
- `ToastContainer` ajouté (accessible partout)

### `src/pages/LandingPage.jsx` — BOUTONS STRIPE
- Bouton "Démarrer l'essai 14 Jours" → `handleSubscribe('monthly')`
- Bouton "Demander un devis" → `handleSubscribe('lifetime')`
- Toast informatif si Stripe non configuré

### `index.html` — SEO & PWA
- `lang="fr"` au lieu de `lang="en"`
- Balises meta SEO (description, keywords, author)
- Open Graph pour les réseaux sociaux
- Meta tags PWA (theme-color, apple-mobile-web-app)
- Titre mis à jour : "OmniPOS — Caisse enregistreuse nouvelle génération"

---

## Architecture des données (Supabase)

```
businesses (1 par owner)
├── products (catalogue, sync Realtime)
├── sales (historique, numéro de reçu auto)
├── categories (personnalisables)
├── staff (caissiers, rôles)
└── subscriptions (Stripe, plan actif)
```

Toutes les tables ont RLS activé. Un utilisateur ne peut accéder qu'aux données de son commerce.

---

## Comment utiliser

### 1. Base de données
1. Aller dans Supabase Dashboard → SQL Editor
2. Copier/coller le contenu de `supabase/schema.sql`
3. Exécuter
4. Aller dans Database → Replication → Activer Realtime sur `products` et `sales`

### 2. Auth0 (inscription)
Suivre `docs/AUTH0_SETUP.md` et remplir les variables dans `.env`

### 3. Stripe (paiements)
Suivre `docs/STRIPE_SETUP.md` et remplir les variables dans `.env`

### 4. Lancer
```bash
cp .env.example .env  # Remplir les valeurs
npm install
npm run dev
```

---

## Prochaines étapes suggérées

- [ ] Exécuter `schema.sql` dans Supabase
- [ ] Configurer Auth0 (SDK + variables)
- [ ] Configurer Stripe (produits + variables)
- [ ] Créer la Supabase Edge Function pour le checkout Stripe
- [ ] Tester le flux complet : inscription → ajout produits → vente → export
- [ ] Ajouter la génération de reçu PDF / impression thermique
- [ ] Conformité NF525 (obligation légale France)
- [ ] Tests unitaires et d'intégration
