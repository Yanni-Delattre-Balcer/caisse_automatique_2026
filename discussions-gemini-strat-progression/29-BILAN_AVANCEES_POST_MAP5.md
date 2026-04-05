# 📋 Bilan Complet des Avancées — Post Map-5

*Document rédigé le 05/04/2026. Couvre toutes les réalisations techniques et stratégiques depuis le fichier `23-map-5.md` jusqu'à aujourd'hui.*

---

## 🎯 Contexte de Départ (23-map-5.md)

Au moment de la Map-5, l'état du projet était :

| Aspect | Statut |
| :--- | :--- |
| Frontend (logique Zustand) | 85% |
| Backend (schéma Supabase / RLS) | 90% |
| Infra (DevOps / déploiement) | 50% |
| Business (Stripe / SaaS) | 20% |

Les tâches identifiées étaient : migration GitHub Pages → Cloudflare Pages, PWA installable, Ticket QR Code, Rendu Monnaie, Indicateur de Sync, Alerte Stock Bas, Z-Caisse, Import CSV, Caisse Rapide.

---

## ✅ Ce qui a été réalisé

### 1. Nouvelles Pages et Fonctionnalités Métier

#### `/pos/quick` — Caisse Rapide (`QuickPosPage.jsx`)
- Interface optimisée pour usage tactile (smartphone/tablette).
- Grille de tuiles larges pour les produits favoris / les plus vendus.
- Accessible directement depuis la sidebar, définie comme vue par défaut à l'ouverture de l'app (start_url PWA pointe sur cette URL).
- Composant `QuickPosGrid.jsx` créé pour gérer la grille.

#### `/z-caisse` — Clôture Journalière (`ZCaissePage.jsx`)
- Récapitulatif complet du CA de la journée.
- Ventilation des paiements (CB / Espèces).
- Calcul du panier moyen.
- Historique des transactions du jour.
- **Export CSV** : bouton d'export comptable qui génère un fichier téléchargeable avec toutes les ventes.

#### `/receipt/:saleId` — Ticket Numérique Public (`ReceiptPage.jsx`)
- Page accessible **sans authentification** : n'importe quel client peut consulter son ticket.
- Affiche le détail de la vente : produits, quantités, prix, total, mode de paiement, date/heure.
- Route déclarée hors du `DashboardLayout` (pas de sidebar, pas de garde d'auth).

#### `/pricing` — Page Tarifs (`PricingPage.jsx`)
- Design "Apple-grade" avec cartes modernes.
- 3 plans : Solo (gratuit), Pro, Business.
- Toggle mensuel/annuel avec calcul automatique des prix annuels.
- Badges de valeur, CTA, bannière d'essai gratuit.

#### `/v2` — Landing Page V2 (`LandingPageV2.jsx`)
- Copie de la landing page officielle, entièrement réécrite sur la base du fichier stratégique `28-heryze_strategie_risques_prix.md`.
- Sections : Hero repositionné, 3 piliers (Offline, Scanner, Compta automatique), comparatif concurrents (Merlin, Pennylane, Shine, Excel), "Comment ça marche" en 3 étapes.
- Section tarifs intégrée directement (design repris de `/pricing`) avec les prix de la stratégie : Solo 0€, Pro 19€/mois (159€/an), Business 39€/mois (319€/an).
- 3 reformulations de prix ("prix d'un café par jour", etc.).
- FAQ 6 questions + mention légale TVA.
- CTA final fort.

---

### 2. Améliorations UX dans la Caisse

#### Rendu Monnaie
- Lorsque le mode de paiement "Espèces" est sélectionné, une **modale dédiée** s'ouvre.
- Champ de saisie du montant remis par le client.
- Calcul automatique et affichage immédiat de la monnaie à rendre.
- Feedback visuel clair pour le caissier.

#### Tickets QR Code à la Fin de Vente
- À la validation d'une vente, un QR Code est généré (via `html5-qrcode` déjà chargé dans `index.html`).
- Le QR Code encode l'URL de la page `/receipt/:saleId`.
- Le client peut le scanner avec son smartphone pour consulter son ticket sans avoir besoin d'une adresse e-mail.

#### Indicateur de Synchronisation
- Icône visuelle dans la sidebar / en-tête de l'app.
- 3 états : **Vert** (connecté + synchronisé), **Orange** (file d'attente offline en cours de sync), **Rouge** (hors ligne).
- Rassure le commerçant sur l'état de ses données en temps réel.

#### Alerte Stock Bas
- Badge rouge sur l'icône "Inventaire" dans la sidebar.
- Se déclenche dès qu'au moins un produit a un stock `≤ 5`.
- Implémenté avec un **sélecteur Zustand stable** (comptage numérique via `.reduce()`) pour éviter les re-renders inutiles.

---

### 3. Import CSV Inventaire
- Bouton d'import sur la page `/inventory`.
- Sélection d'un fichier `.csv` depuis l'appareil.
- **Prévisualisation** des données avant import : tableau récapitulatif avec les colonnes détectées.
- **Validation** des données (champs obligatoires, types).
- Import en masse dans le catalogue Zustand (et Supabase si connecté).

---

### 4. Correction de Bug Critique — Boucle Infinie (Mode Démo)

**Symptôme :** Erreur React "Maximum update depth exceeded" au premier accès en mode Démo.

**Causes identifiées (3 problèmes simultanés) :**

1. **`useAuthStore.ts` — `onAuthStateChange` écrasait le mode Démo**  
   Quand Supabase détecte l'absence de session, le callback `null` était appelé, ce qui remettait `isDemo` à `false` même si on venait de le passer à `true` via `loginAsDemo()`.  
   **Fix :** Condition ajoutée — on ne clear le state que si `!get().isDemo`.

2. **`DashboardLayout.jsx` — `useEffect` combiné avec trop de dépendances**  
   Un seul `useEffect` gérait à la fois le garde d'auth et l'hydratation du catalogue. `user` (objet Supabase) changeait de référence à chaque cycle, déclenchant une re-exécution infinie.  
   **Fix :** Séparation en **deux `useEffect` distincts** :
   - Premier : garde de navigation (`isAuthenticated`, `isDemo`, `navigate`, `loginAsDemo`).
   - Second : hydratation catalogue (`user?.businessDomain`, `hydrateForDomain`).

3. **`lowStockItems` — sélecteur Zustand instable**  
   Le sélecteur retournait `.filter()` qui crée un **nouveau tableau** à chaque render, forçant Zustand à notifier un changement même si rien n'avait changé.  
   **Fix :** Remplacement par un sélecteur `.reduce()` renvoyant un **nombre** (`lowStockCount`).

---

### 5. Déploiement GitHub Pages + PWA

#### GitHub Actions (`.github/workflows/deploy.yml`)
- Workflow automatique déclenché sur chaque push sur `main` (et manuellement via `workflow_dispatch`).
- Build Node 20 avec `npm ci` + `npm run build`.
- Variable d'environnement `VITE_BASE_PATH=/caisse_automatique_2026/` pour adapter le base path à GitHub Pages.
- Secrets configurables dans les Settings GitHub : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, etc.
- Upload de l'artifact `dist/` via `actions/upload-pages-artifact@v3`.
- Déploiement via `actions/deploy-pages@v4`.
- Permissions correctes : `pages: write`, `id-token: write`.

#### SPA Routing sur GitHub Pages (`public/404.html`)
- GitHub Pages retourne un 404 pour toute URL qui ne correspond pas à un fichier physique (ex : `/caisse_automatique_2026/pos/quick`).
- **Solution standard** (pattern rafgraph/spa-github-pages) : le fichier `404.html` encode le chemin dans la query string et redirige vers la racine.
- `index.html` contient le script inverse qui décode et restaure l'URL via `history.replaceState`.
- Résultat : React Router peut gérer toutes les routes sans 404 visible.

#### Vite Config (`vite.config.js`)
- `base` dynamique : `VITE_BASE_PATH || '/'` — fonctionne en dev local (`/`) et en production GitHub Pages (`/caisse_automatique_2026/`).
- `basicSsl` activé **uniquement en dev** (`mode === 'development'`) — nécessaire pour WebRTC/caméra en local, inutile en prod.
- `BrowserRouter basename` dans `main.jsx` utilise `import.meta.env.BASE_URL` (exposé automatiquement par Vite depuis `base`).

#### PWA (vite-plugin-pwa)
- `start_url` et `scope` construits dynamiquement depuis `base` pour pointer sur `/caisse_automatique_2026/pos/quick` en production.
- Raccourcis PWA (appui long sur l'icône) : "Caisse Rapide" et "Z-Caisse".
- Icônes `192x192` et `512x512` avec version `maskable` pour Android.
- Runtime caching Workbox : `NetworkFirst` pour les requêtes Supabase (avec timeout 5s → fallback cache).
- PWA désactivé en dev (`devOptions.enabled: false`) pour éviter les conflits HMR.

#### iOS / Safari (`index.html`)
- `<link rel="apple-touch-icon">` → icône sur l'écran d'accueil iOS.
- `<meta name="apple-mobile-web-app-capable" content="yes">` → mode plein écran.
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` → barre de statut transparente.
- `<meta name="apple-mobile-web-app-title" content="Heryze">` → nom sous l'icône.
- `viewport-fit=cover` → respect du notch iPhone.
- Favicon → `icons/icon-192.png` (logo Heryze).

---

### 6. Mise à Jour Stratégique (`scenartest.md`)

Fichier de tests complètement restructuré en 9 sections pour permettre à l'équipe de valider le MVP :

1. **Setup** — Prérequis, accès démo, installation PWA
2. **Mode Démo** — Flux complet sans compte Supabase
3. **Caisse Rapide** — Tests tactiles, scanner, panier
4. **Paiement** — CB, espèces, rendu monnaie, QR Code ticket
5. **Offline** — Vente sans connexion, resynchronisation
6. **Inventaire** — CRUD produits, import CSV, alerte stock
7. **Analytics / Z-Caisse** — Clôture journalière, export CSV
8. **Auth Multi-Tenant** — Inscription, connexion, isolation des données
9. **PWA** — Installation, raccourcis, comportement offline

Chaque test précise : **Précondition → Action → Résultat attendu → Statut (✅/❌/⏳)**.

Inclut un tableau des bugs connus et une checklist de Go/No-Go pour la bêta.

---

## 📊 État du Projet au 05/04/2026

| Aspect | Statut avant Map-5 | Statut actuel |
| :--- | :--- | :--- |
| **Caisse (POS)** | 80% | 🟢 95% |
| **Tickets & QR Code** | 0% | 🟢 90% |
| **Z-Caisse / Export** | 0% | 🟢 85% |
| **Import CSV** | 0% | 🟢 80% |
| **PWA / Installation** | 30% | 🟢 90% |
| **Déploiement CI/CD** | 50% | 🟢 95% |
| **Landing Page** | 70% | 🟢 90% |
| **Backend Supabase** | 90% | 🟢 90% |
| **Mode Démo** | ❌ Bug bloquant | 🟢 Corrigé |

---

## 🔧 Fichiers Créés ou Modifiés

| Fichier | Type | Description |
| :--- | :--- | :--- |
| `src/pages/QuickPosPage.jsx` | Nouveau | Interface Caisse Rapide |
| `src/pages/ZCaissePage.jsx` | Nouveau | Clôture journalière + export CSV |
| `src/pages/ReceiptPage.jsx` | Nouveau | Ticket public sans auth |
| `src/pages/PricingPage.jsx` | Nouveau | Page tarifs design premium |
| `src/pages/LandingPageV2.jsx` | Nouveau | Landing V2 stratégique |
| `src/features/pos/QuickPosGrid.jsx` | Nouveau | Grille de la caisse rapide |
| `src/App.tsx` | Modifié | Ajout des routes V2, Z-Caisse, Receipt, Pricing, QuickPos |
| `src/layouts/DashboardLayout.jsx` | Modifié | Fix boucle infinie (2 useEffect + sélecteur stable) |
| `src/store/useAuthStore.ts` | Modifié | Fix onAuthStateChange (préserve isDemo) |
| `vite.config.js` | Modifié | Base dynamique, basicSsl dev-only, PWA manifest complet |
| `src/main.jsx` | Modifié | BrowserRouter basename depuis BASE_URL |
| `index.html` | Modifié | Favicon, PWA iOS meta, script SPA redirect |
| `public/404.html` | Nouveau | Redirect SPA GitHub Pages |
| `.github/workflows/deploy.yml` | Nouveau | CI/CD GitHub Actions → GitHub Pages |
| `discussions-gemini-strat-progression/scenartest.md` | Modifié | Restructuré pour tests MVP |

---

## 🚧 Ce qui Reste à Faire (Prochaine Priorité)

### Priorité Haute (avant bêta)
- [ ] **Tester le déploiement GitHub Pages** : vérifier que toutes les routes fonctionnent sur `https://briacl.github.io/caisse_automatique_2026/`.
- [ ] **Valider le scenartest.md** : passer en revue chaque test avec l'équipe, marquer les statuts.
- [ ] **Configurer les Secrets GitHub** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` dans Settings > Secrets > Actions.
- [ ] **Test PWA mobile** : installer sur Android et iOS, vérifier les raccourcis et le mode offline.
- [ ] **Test Rendu Monnaie** : valider le calcul dans différents cas (montant exact, gros billet).

### Priorité Moyenne (P1)
- [ ] **Cloudflare Pages** : migration recommandée depuis Map-5 (plus rapide, domaine `heryze.fr`). GitHub Pages est fonctionnel mais Cloudflare offre HTTPS automatique sur domaine perso et meilleure performance.
- [ ] **Stripe** : connecter les boutons de tarifs vers Stripe Checkout pour les abonnements.
- [ ] **Multi-photos produit** : intégration Cloudflare R2 (10 Go gratuits vs 1 Go Supabase).

### Priorité Basse (P2 — post-bêta)
- [ ] Raccourcis clavier (/, Entrée, Esc).
- [ ] Micro-animations sur le bouton "Payer".
- [ ] Module fidélité client.
- [ ] Statistiques avancées (heatmap ventes, top produits).

---

## 💡 Points d'Attention Techniques

1. **HTTPS en dev** : `basicSsl` est activé uniquement en mode `development`. Ne jamais le passer en production (inutile + peut bloquer le build).

2. **Variable VITE_BASE_PATH** : en dev local, laisser à `'/'`. Le workflow CI la définit automatiquement à `/caisse_automatique_2026/`. Ne pas hardcoder ce chemin dans le code source.

3. **Supabase `onAuthStateChange`** : la correction actuelle vérifie `!get().isDemo` avant de clear le state. Si on ajoute de nouveaux modes d'auth temporaires à l'avenir, penser à les protéger de la même manière.

4. **Sélecteurs Zustand** : toujours éviter de retourner des tableaux créés à la volée (`filter`, `map`, `slice`) dans un sélecteur — préférer des primitives (nombre, booléen, string). Sinon, utiliser `shallow` de Zustand.

5. **PWA en dev** : le Service Worker est désactivé en dev (`devOptions.enabled: false`) pour éviter les conflits avec le Hot Module Replacement de Vite. Pour tester la PWA, faire un `npm run build` + `npm run preview`.