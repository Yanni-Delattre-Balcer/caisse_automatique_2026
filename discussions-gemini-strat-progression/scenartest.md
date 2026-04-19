# 🧪 Scénarios de Test — Heryze MVP (Pré-Bêta)

> **Date de mise à jour** : 2026-04-16 (v2 — 1er paiement Stripe validé)
> **Comment tester** : Lancer `npm run dev`, ouvrir `https://localhost:5177` (HTTPS requis pour PWA/caméra).  
> **Testeurs** : Deux navigateurs / deux comptes suffisent pour les tests multi-tenant.

---

## ✅ État du MVP — Ce qui est implémenté

| Fonctionnalité | Page / Fichier | État |
| :--- | :--- | :--- |
| Authentification (inscription/connexion) | `/login`, `/register` | ✅ |
| Mode Démo (données fictives, sans compte) | Bouton landing & login | ✅ |
| **Onboarding post-inscription (wizard 2 étapes)** | `/onboarding` | ✅ **Nouveau** |
| Caisse Rapide (12 produits favoris, tactile) | `/pos/quick` | ✅ |
| Caisse Complète (catalogue entier) | `/pos` | ✅ |
| Paiement CB / Espèces avec rendu monnaie | CheckoutCart | ✅ |
| **Remises (% ou montant fixe) sur le panier** | CheckoutCart | ✅ **Nouveau** |
| Ticket numérique QR Code après vente | CheckoutCart (modale post-paiement) | ✅ |
| **Page ticket publique accessible sans connexion** | `/receipt/:id` | ✅ **Fix RLS** |
| Inventaire CRUD + Import CSV | `/inventory` | ✅ |
| Dashboard Analytiques + Export Excel | `/dashboard` | ✅ |
| Z-Caisse journalière + Export CSV | `/z-caisse` | ✅ |
| Offline-First (ventes en file IndexedDB) | Automatique | ✅ |
| Sync temps réel Supabase (Realtime) | Automatique | ✅ |
| Indicateur de connexion (Wifi/Sync) | Sidebar | ✅ |
| Badge stock bas (≤ 5 unités) | Icône Inventaire sidebar | ✅ |
| Dark Mode | Sidebar | ✅ |
| PWA installable sur mobile | Via navigateur | ✅ |
| Scanner Smartphone (WebRTC) | `/scanner-setup` | ✅ |
| **Page Tarifs câblée Stripe (checkout fonctionnel)** | `/pricing` | ✅ **Nouveau** |
| Paramètres commerce (SIRET, TVA, caissier) | `/settings` | ✅ |
| Isolation données multi-tenant (RLS) | Automatique | ✅ |

**✅ Ajouté depuis le 16/04/2026 :**
| Fonctionnalité | Page / Fichier | État |
| :--- | :--- | :--- |
| Tunnel abonnement Stripe complet (checkout → webhook → DB) | `/checkout-summary`, Edge Functions | ✅ **1er paiement validé** |
| Page récapitulatif avant paiement (SAS transparence) | `/checkout-summary` | ✅ |
| Page succès paiement avec polling webhook | `/payment-success` | ⚠️ Partiel — bug condition polling (voir doc 48) |
| HardWall fin d'essai (blocage UI + export données) | `HardWall.jsx` | ✅ |
| Badge profil connecté dans navbar landing | `LandingLayout.jsx` | ✅ |
| Scroll vers `#pricing` depuis liens internes | `LandingPage.jsx` | ✅ |
| Trial 14 jours + trigger SQL automatique | `businesses.trial_ends_at` | ✅ |
| Table `subscriptions` + synchronisation webhook | Supabase | ✅ |

**⚠️ Non encore implémenté :**
- Raccourcis clavier (`/` chercher, `Entrée` payer, `Esc` annuler)
- Page Tables de restauration (`/tables` — nav visible pour Restauration mais route absente)
- Export Z-Caisse au format PDF
- Ticket par email (Resend)
- Chaînage cryptographique NF525
- Feature gating Stripe actif (HardWall actif, mais `useSubscription` non branché partout)
- Page `/payment-success` : polling corrigé (bug condition — voir doc 48)
- Mapping plan `starter`/`business` dans le webhook (retourne `monthly` — voir doc 47)

---

## 🔧 Pré-requis avant de commencer

### Config minimale (Mode Démo uniquement)
```bash
cp .env.example .env
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm install && npm run dev
# Ouvrir https://localhost:5177
```

### Config Stripe (pour les tests d'abonnement)
Voir `docs/STRIPE_SETUP.md` pour le guide complet. Variables à renseigner dans `.env` :
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
VITE_STRIPE_CHECKOUT_URL=https://PROJECT_REF.supabase.co/functions/v1/stripe-checkout
VITE_STRIPE_PRICE_STARTER=price_xxxx   # 19 €/mois — à créer dans Stripe Dashboard
VITE_STRIPE_PRICE_BUSINESS=price_xxxx  # 39 €/mois
VITE_STRIPE_PRICE_EXPERT=price_xxxx    # 69 €/mois
```

### SQL à exécuter dans Supabase Dashboard > SQL Editor (une seule fois)
```sql
-- ① Accès public aux tickets (QR code clients non connectés)
CREATE POLICY "sales_public_receipt_read" ON sales
  FOR SELECT TO anon USING (true);

-- ② Contrainte plan élargie (requis pour webhook Stripe)
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('monthly', 'annual', 'pro', 'starter', 'business', 'expert'));
```

### Cartes de test Stripe
| Numéro de carte | Résultat |
| :--- | :--- |
| `4242 4242 4242 4242` | ✅ Paiement réussi |
| `4000 0000 0000 0002` | ❌ Carte refusée |
| `4000 0025 0000 3155` | 🔐 3D Secure requis |

- **Date d'expiration** : n'importe quelle date future (ex: `12/29`)
- **CVC** : n'importe quels 3 chiffres (ex: `123`)
- **Code postal** : n'importe lequel (ex: `75001`)

---

## 🟣 1. Mode Démo (Sans compte — à tester en premier)

> Valide le parcours "découverte" pour un visiteur non inscrit.

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 1.1 | Aller sur `/` (landing page) et cliquer **"Démo"** dans la navbar | Redirige vers `/pos/quick` avec 8 produits boulangerie pré-chargés |
| 1.2 | OU aller sur `/login` → cliquer **"Accéder au Mode Démo"** | Même résultat |
| 1.3 | Vérifier la sidebar | Badge "Boulangerie Louise", indicateur vert en ligne |
| 1.4 | Naviguer entre toutes les pages (Analytiques, Inventaire, Z-Caisse…) | Aucun crash, données de démo présentes partout |
| 1.5 | Rafraîchir la page (`F5`) sur `/pos/quick` | L'app reste en mode démo, **pas de redirection** vers login |
| 1.6 | Se déconnecter (icône LogOut en bas de sidebar) | Retour sur `/` |

---

## 🆕 2. Onboarding Post-Inscription

> Valide le parcours d'un nouveau client qui crée son compte.

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 2.1 | Aller sur `/register`, remplir le formulaire et cliquer **"Démarrer gratuitement"** | Redirection automatique vers `/onboarding` (pas vers `/pos`) |
| 2.2 | Vérifier l'étape 1 | Formulaire avec SIRET, N° TVA, adresse, téléphone — tous optionnels |
| 2.3 | Remplir le SIRET et l'adresse, cliquer **"Enregistrer"** | Données sauvegardées en Supabase (`businesses`), passage à l'étape 2 |
| 2.4 | Cliquer **"Passer cette étape"** au lieu d'enregistrer | L'étape 1 est ignorée, passage à l'étape 2 directement |
| 2.5 | Étape 2 : saisir un produit (ex: "Café", 1.20 HT, TVA 10%) | Prix TTC estimé affiché : 1.32 € |
| 2.6 | Cliquer **"Ajouter"** | Produit créé en Supabase, redirection vers `/pos/quick` |
| 2.7 | Répéter en cliquant **"Passer — j'ajouterai mes produits plus tard"** | Redirection vers `/pos/quick` sans produit créé |
| 2.8 | Étape 2 : cliquer **"Importer CSV"** et choisir un fichier | Prévisualisation des produits détectés, bouton "Importer" |
| 2.9 | Vérifier dans Supabase Dashboard → Table `businesses` | Les champs SIRET/adresse ont bien été enregistrés |
| 2.10 | Se déconnecter puis se reconnecter | Redirection vers `/pos/quick` directement (onboarding déjà fait, flag localStorage présent) |

---

## 💳 3. Flux d'Encaissement de Base — Caisse Rapide

> Scénario nominal : une vente simple et rapide.

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 3.1 | Ouvrir `/pos/quick` | Grille de produits avec prix en grand, panier vide à droite |
| 3.2 | Cliquer sur un produit | Apparaît dans le panier, quantité 1, total mis à jour |
| 3.3 | Cliquer à nouveau sur le même produit | Quantité passe à 2 |
| 3.4 | Cliquer **"+"** dans le panier | Quantité incrémente |
| 3.5 | Cliquer **"−"** jusqu'à 0 | L'article disparaît du panier |
| 3.6 | Ajouter 3 produits différents | Total TTC s'affiche correctement |
| 3.7 | Cliquer **"Annuler la commande"** | Modale de confirmation apparaît |
| 3.8 | Confirmer l'annulation | Panier vide, toast "Commande annulée" |

---

## 🏷️ 4. Remises sur le Panier

> Valide l'application et la suppression de remises.

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 4.1 | Sans produits dans le panier, vérifier le bouton "Remise" | Bouton désactivé (grisé) |
| 4.2 | Ajouter des produits (ex: total brut = 20,00 €), cliquer **"Remise"** | Modale remise s'ouvre |
| 4.3 | Cliquer le preset **-10%** | Modale ferme, badge "−10%" visible, total passe à 18,00 €, toast confirmation |
| 4.4 | Rouvrir la modale et cliquer **-20%** | La remise précédente est remplacée, total = 16,00 € |
| 4.5 | Saisir **3,00** dans le champ montant fixe et cliquer **"OK"** | Remise fixe appliquée, total = 17,00 € |
| 4.6 | Tenter de saisir un montant ≥ au total brut | Toast d'avertissement "Remise supérieure ou égale au total" |
| 4.7 | Cliquer **"Supprimer la remise"** | Remise retirée, total revient au brut |
| 4.8 | Appliquer une remise puis valider le paiement (CB) | Le `total_ttc` enregistré dans Supabase est le **montant après remise** |
| 4.9 | Sur le reçu QR post-paiement : vérifier le total | Affiche le montant remisé, pas le total brut |
| 4.10 | Vider le panier (bouton "Annuler") | La remise est aussi effacée — prochain panier repart sans remise |

---

## 💵 5. Paiement — CB, Espèces, Ticket QR

### 5a. Paiement CB

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 5.1 | Ajouter des produits, cliquer **"C.B"** | Modale de reçu avec récapitulatif + QR code |
| 5.2 | Vérifier le total affiché | Correspond au total (avec éventuelle remise) |
| 5.3 | Scanner le QR code avec un smartphone | Ouvre `/receipt/:id` dans le navigateur du téléphone — **sans connexion requise** |
| 5.4 | Vérifier la page `/receipt/:id` | Affiche les articles, total TTC, heure et mode de paiement |
| 5.5 | Cliquer **"Fermer le reçu"** | Modale ferme, panier vide, prêt pour la vente suivante |

### 5b. Paiement Espèces avec rendu monnaie

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 5.6 | Ajouter des produits (ex: total = 5,60 €), cliquer **"Espèces"** | Modale rendu monnaie, total affiché en grand |
| 5.7 | Saisir **10,00** dans "Montant remis" | Affiche en vert "Monnaie à rendre : 4,40 €" |
| 5.8 | Saisir **4,00** (insuffisant) | Affiche en rouge "Montant insuffisant", bouton Valider grisé |
| 5.9 | Corriger à 6,00, cliquer **"Valider le paiement"** | Vente enregistrée, reçu + QR code affiché |
| 5.10 | Appliquer une remise de -10% (total brut 10 €→ remisé 9 €), payer en espèces avec 10 € | Monnaie à rendre = 1,00 € (calcul sur le montant après remise) |

---

## 📶 6. Résilience Offline (Mode Avion)

> Test critique avant bêta.

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 6.1 | Activer le **mode avion** (ou couper le WiFi) | Icône WifiOff rouge apparaît dans la sidebar |
| 6.2 | Réaliser une vente complète (2 produits, paiement CB) | Vente s'enregistre normalement, toast de succès |
| 6.3 | Ouvrir l'Inspecteur → Application → IndexedDB → `idb-keyval` | Une clé `offline_sale_xxxxx` est présente avec les données |
| 6.4 | Réactiver la connexion | Icône passe en orange animé ("Synchronisation…"), puis vert |
| 6.5 | Vérifier Supabase Dashboard → Table `sales` | La vente est apparue avec le bon timestamp |
| 6.6 | Vérifier IndexedDB | La clé `offline_sale_...` a été supprimée |
| 6.7 | Réaliser **3 ventes** hors-ligne, reconnecter | Les 3 ventes sont synchronisées **dans l'ordre chronologique** |
| 6.8 | Réaliser une vente offline avec remise (-10%) | La remise est préservée dans la file : `total_ttc` est le montant remisé |

---

## 📦 7. Inventaire & Catalogue

### 7a. Ajout manuel

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 7.1 | Aller sur `/inventory`, cliquer **"Ajouter un produit"** | Modale s'ouvre |
| 7.2 | Saisir : Nom="Test Produit", Prix HT=8,00, TVA=20% | Prix TTC estimé affiché : 9,60 € |
| 7.3 | Valider | Produit visible dans la liste ET dans la caisse instantanément (Realtime) |
| 7.4 | Modifier le produit (icône crayon) | Valeurs pré-remplies, modification sauvegardée |
| 7.5 | Mettre le stock à **3** | Badge rouge "3" ou "9+" apparaît sur l'icône Inventaire dans la sidebar |
| 7.6 | Supprimer le produit | Confirmation, produit retiré du catalogue et de la caisse |

### 7b. Import CSV

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 7.7 | Créer un fichier CSV avec en-tête : `nom;prix_ht;tva;catégorie;stock;code-barre` | — |
| 7.8 | Exemple de ligne : `Croissant;0.92;20;Viennoiserie;50;` | — |
| 7.9 | Cliquer **"Importer CSV"**, sélectionner le fichier | Aperçu avec le nombre de produits détectés |
| 7.10 | Vérifier le format d'avertissement affiché | `nom;prix_ht;tva;catégorie;stock;code-barre` |
| 7.11 | Confirmer l'import | Toast de succès, produits visibles dans le catalogue |

---

## 📊 8. Analytiques & Z-Caisse

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 8.1 | Aller sur `/dashboard` (mode démo) | CA fictif 1 204,50 €, 42 ventes, graphique hebdomadaire |
| 8.2 | Cliquer **"Rafraîchir"** (icône) | Données rechargées, indicateur de chargement |
| 8.3 | Cliquer **"Export Comptable"** | Téléchargement d'un `.xlsx` avec toutes les ventes du jour |
| 8.4 | Ouvrir le fichier Excel | Colonnes : Date, Heure, Montant TTC, Paiement, Articles, Caissier |
| 8.5 | Aller sur `/z-caisse` | Récapitulatif du jour : CA, nb transactions, panier moyen, répartition CB/Espèces |
| 8.6 | Vérifier la barre de répartition CB/Espèces | Proportionnelle aux montants réels |
| 8.7 | Cliquer **"Exporter CSV"** | Modale de confirmation, puis téléchargement `Z-Caisse_Heryze_DD-MM-YYYY.csv` |
| 8.8 | Ouvrir le CSV dans Excel | Colonnes : Date, Heure, Total TTC, Moyen de paiement, Articles |

---

## 🔐 9. Authentification & Multi-tenant (Nécessite Supabase)

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 9.1 | Créer deux comptes : **Boulangerie A** et **Épicerie B** | Deux entrées dans `auth.users` et `businesses` |
| 9.2 | Avec A, ajouter un produit "Baguette" | Visible dans le catalogue de A |
| 9.3 | Se déconnecter, se connecter avec B | Catalogue de B : vide ou contient uniquement ses propres produits |
| 9.4 | Chercher "Baguette" dans B | **Aucun résultat** — isolation RLS confirmée |
| 9.5 | Deux onglets, même compte A : modifier un prix dans l'onglet 1 | Mise à jour **instantanée** dans l'onglet 2 (Realtime) |
| 9.6 | Tenter d'accéder à `/pos` sans être connecté | Redirection vers `/login` |
| 9.7 | Copier l'URL d'un ticket `/receipt/:id` (vente de A) et l'ouvrir en navigation privée | Ticket visible **sans être connecté** (fix RLS anon) |

---

## 📱 10. PWA & Mobile

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 10.1 | Ouvrir l'app sur mobile (Chrome Android / Safari iOS) | Interface s'adapte à l'écran |
| 10.2 | Android Chrome : menu "Ajouter à l'écran d'accueil" | L'app s'installe avec l'icône Heryze |
| 10.3 | Lancer depuis l'écran d'accueil | Mode standalone, sans barre navigateur, sur `/pos/quick` |
| 10.4 | Tester la Caisse Rapide au doigt | Boutons larges, cliquables facilement |
| 10.5 | Passer en mode avion sur mobile → faire une vente | Vente mise en queue offline, synchronisée au retour du réseau |
| 10.6 | Aller sur `/scanner-setup` sur desktop | QR code pour connecter un smartphone comme scanner |
| 10.7 | Scanner un produit depuis le smartphone | Produit ajouté au panier sur le desktop |

---

## 💳 11. Flux Stripe & Abonnements

> **Pré-requis** : Clés Stripe configurées dans `.env`, Edge Functions déployées, SQL pré-requis exécuté, mode Test actif sur le Dashboard Stripe.

### 11a. Vérification de la configuration

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 11.1 | Aller sur `/pricing` **sans être connecté** | Boutons "Choisir ce plan" présents |
| 11.2 | Cliquer sur un bouton sans être connecté | Redirection vers `/register` |
| 11.3 | Aller sur `/pricing` avec un `VITE_STRIPE_PRICE_STARTER` **vide** dans `.env` | Badge orange "Price ID manquant dans .env" à la place du bouton |
| 11.4 | Aller sur `/pricing` avec tous les Price IDs renseignés, authentifié | Tous les boutons "Choisir ce plan" sont actifs |

### 11b. Flux de souscription (carte réussie) — ✅ VALIDÉ le 16/04/2026

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 11.5 | Depuis `/` ou dashboard, cliquer **"S'abonner"** | Redirection vers `/#pricing` avec scroll automatique vers les plans |
| 11.6 | Cliquer **"Souscrire"** sur le plan Starter | Redirection vers `/checkout-summary?plan=starter` |
| 11.7 | Vérifier la page `/checkout-summary` | Récapitulatif plan, promesse transparence, date de fin d'essai affiché |
| 11.8 | Cliquer **"Sécuriser mon compte (0€)"** | Redirection vers Stripe Checkout dans le **même onglet** |
| 11.9 | Vérifier la page Stripe Checkout | "Essayez Heryze Starter — 14 jours gratuits, puis 19€/mois", email pré-rempli |
| 11.10 | Remplir : carte `4242 4242 4242 4242`, date `12/29`, CVC `123` | Champs valides, bouton "Démarrer la période d'essai" actif |
| 11.11 | Cliquer **"Démarrer la période d'essai"** | Traitement Stripe, redirection vers `/payment-success?session_id=cs_test_xxx` |
| 11.12 | Vérifier Supabase → Table `subscriptions` | Ligne avec `status='active'`, `stripe_subscription_id` présent |
| 11.13 | Vérifier Supabase → Table `businesses` | `subscription_status = 'active'` |
| 11.14 | Vérifier Stripe → Webhooks → événements reçus | `checkout.session.completed` et `invoice.payment_succeeded` : **200 OK** |

### 11c. Flux de souscription (carte refusée)

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 11.11 | Répéter le flux avec la carte `4000 0000 0000 0002` | Stripe affiche "Votre carte a été refusée" sur la page Checkout |
| 11.12 | Cliquer "Retour" depuis Stripe Checkout | Retour sur `/pricing?payment=cancelled` |

### 11d. Flux 3D Secure

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 11.13 | Utiliser la carte `4000 0025 0000 3155` | Stripe affiche une modale 3D Secure |
| 11.14 | Cliquer **"Complete"** dans la modale 3D Secure | Paiement réussi, redirection `/dashboard?payment=success` |
| 11.15 | Cliquer **"Fail"** dans la modale 3D Secure | Paiement échoué, retour sur Stripe Checkout avec message d'erreur |

### 11e. Test du Webhook (Simulation annulation)

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 11.16 | Dans Stripe Dashboard (Test) → Customers → trouver le client test | — |
| 11.17 | Cliquer sur son abonnement → **"Cancel subscription"** | Stripe envoie un événement `customer.subscription.deleted` |
| 11.18 | Attendre < 5 secondes, vérifier Supabase `subscriptions` | Le `status` est passé à `cancelled` |
| 11.19 | *(Optionnel)* Tester via Stripe CLI : `stripe trigger customer.subscription.deleted` | Même résultat dans Supabase |

### 11f. Re-souscription sur le même compte

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 11.20 | Après annulation, retourner sur `/pricing` et souscrire à nouveau | Le webhook `upsert` met à jour la ligne existante (pas de doublon en DB) |
| 11.21 | Vérifier Supabase `subscriptions` | Une seule ligne par `business_id`, status repasse à `active` |

---

## 🐛 12. Régressions à vérifier

> Points qui ont déjà posé problème — à re-tester systématiquement.

| # | Scénario | Ce qu'on vérifie |
| :--- | :--- | :--- |
| R.1 | Cliquer "Mode Démo" depuis la page Login | **Pas de boucle infinie** "Maximum update depth exceeded" (corrigé le 05/04) |
| R.2 | Rafraîchir la page en mode démo | Le mode démo **persiste**, pas de redirection login |
| R.3 | Cliquer sur "Tables" dans la sidebar (domaine Restauration) | Route inexistante → page blanche (bug connu, non bloquant) |
| R.4 | Ajouter 50 produits en mode démo | Badge stock bas correct, pas de re-render infini |
| R.5 | Appliquer une remise, vider le panier via "Annuler" | **La remise est aussi effacée** — pas de remise "fantôme" sur le panier suivant |
| R.6 | Scanner le QR code post-vente en navigation privée | Page `/receipt/:id` visible sans être connecté (fix RLS anon) |
| R.7 | Se reconnecter après l'onboarding | **Pas de retour sur `/onboarding`** — flag localStorage respecté |
| R.8 | Cliquer "Choisir ce plan" sur `/pricing` sans `.env` Stripe configuré | Badge "Price ID manquant" — **pas de crash**, pas de call réseau échoué |
| R.9 | Faire une vente avec remise en mode offline | Le montant enregistré dans IndexedDB est bien le `total_ttc` après remise |

---

## 🚦 Checklist "Go/No-Go" pour la Bêta

### Go obligatoire (bloquant) 🔴
- [ ] SQL pré-requis exécuté dans Supabase (politique RLS anon + contrainte plan)
- [ ] Flux de vente Offline-First : vente → sync automatique à la reconnexion
- [ ] Mode Démo stable (pas de boucle infinie, persistance après refresh)
- [ ] Onboarding : inscription → wizard → `/pos/quick`
- [ ] Remises : calcul correct + effacement à l'annulation du panier
- [ ] Paiement Stripe fonctionnel bout-en-bout (Checkout → Webhook → table `subscriptions`)
- [ ] Ticket QR Code scannable **sans connexion** (navigation privée, autre appareil)
- [ ] Isolation multi-tenant RLS : compte B ne voit pas les données de A

### Go souhaitable (non bloquant) 🟡
- [ ] PWA installable sans erreur de cache (Workbox limit fixe)
- [ ] Interface responsive sur tablette (iPad 9")
- [ ] Scanner smartphone : latence < 500 ms
- [ ] Z-Caisse : cohérence mathématique des totaux (CB + Espèces = CA total)
- [ ] Webhook Stripe : test d'annulation simulé (`customer.subscription.deleted`)
- [ ] Export XLSX Dashboard : fichier lisible dans Excel et LibreOffice
- [ ] Raccourcis clavier de base (`/` chercher, `Entrée` payer, `Esc` annuler)

---

## 📋 Bugs connus & Statut

| Priorité | Problème | Statut | Fichier concerné |
| :--- | :--- | :--- | :--- |
| 🔴 | Boucle infinie mode démo au login | ✅ Corrigé (05/04) | `DashboardLayout.jsx`, `useAuthStore.ts` |
| 🔴 | QR code ticket inaccessible sans connexion | ✅ Corrigé — SQL RLS anon à exécuter | `supabase/schema.sql` |
| 🔴 | Contrainte `plan IN ('monthly')` bloquait webhook | ✅ Corrigé — SQL contrainte à exécuter | `supabase/schema.sql` |
| 🔴 | Login "infini" après ajout colonnes manquantes Gemini | ✅ Corrigé (16/04) — crash `companyName.substring(null)` + SQL migration | `DashboardLayout.jsx`, `trial_setup.sql` |
| 🔴 | Edge Function checkout — import Stripe incompatible Deno v2 | ✅ Corrigé (16/04) — `npm:stripe@17` | `stripe-checkout/index.ts` |
| 🔴 | JWT ES256 rejeté par runtime Supabase | ✅ Corrigé (16/04) — header `x-user-token` custom | `stripe.ts`, `stripe-checkout/index.ts` |
| 🟡 | Mapping plan webhook retourne `monthly` au lieu de `starter` | ⏳ À corriger | `stripe-webhook/index.ts` |
| 🟡 | `PaymentSuccessPage` : condition polling incorrecte | ⏳ À corriger (doc 48) | `PaymentSuccessPage.jsx` |
| 🟡 | Route `/tables` absente (lien mort Restauration) | ⏳ À implémenter | `App.tsx` |
| 🟡 | Raccourcis clavier non implémentés | ⏳ Backlog | — |
| 🟡 | Feature gating Stripe inactif (`useSubscription` tout à `true`) | ⏳ Intentionnel — à activer post-bêta | `src/hooks/useSubscription.ts` |
| 🟢 | Texte brut en fin de `.env` (bloque CLI Supabase) | ⏳ À nettoyer | `.env` |

---

---

## ✅ Historique des validations majeures

| Date | Milestone |
| :--- | :--- |
| 2026-04-05 | Fix boucle infinie mode démo, onboarding, remises, fix RLS receipt |
| 2026-04-10 | Câblage Stripe `/pricing`, PricingPage, Edge Functions (code) |
| **2026-04-16** | **🎉 1er paiement Stripe test validé bout-en-bout** — checkout, webhook 200 OK, `subscriptions` enregistré |

*Dernière mise à jour : 2026-04-16 (v2)*
