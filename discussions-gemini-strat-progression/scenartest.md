# 🧪 Scénarios de Test — Heryze MVP (Pré-Bêta)

> **Date de mise à jour** : 2026-04-05  
> **Comment tester** : Lancer `npm run dev`, ouvrir `https://localhost:5177` (HTTPS requis pour PWA/caméra).  
> **Testeurs** : Deux navigateurs / deux comptes suffisent pour les tests multi-tenant.

---

## ✅ État du MVP — Ce qui est implémenté

| Fonctionnalité | Page | État |
| :--- | :--- | :--- |
| Authentification (inscription/connexion) | `/login`, `/register` | ✅ |
| Mode Démo (données fictives, sans compte) | Bouton sur landing & login | ✅ |
| Caisse Rapide (12 produits favoris, tactile) | `/pos/quick` | ✅ |
| Caisse Complète (catalogue entier) | `/pos` | ✅ |
| Paiement CB / Espèces avec rendu monnaie | CheckoutCart | ✅ |
| Ticket numérique QR Code après vente | CheckoutCart (modale post-paiement) | ✅ |
| Page ticket publique (lien scannable) | `/receipt/:id` | ✅ |
| Inventaire CRUD + Import CSV | `/inventory` | ✅ |
| Dashboard Analytiques + Export Excel | `/dashboard` | ✅ |
| Z-Caisse journalière | `/z-caisse` | ✅ |
| Offline-First (ventes en file IndexedDB) | Automatique | ✅ |
| Sync temps réel Supabase (Realtime) | Automatique | ✅ |
| Indicateur de connexion (Wifi/Sync) | Sidebar | ✅ |
| Badge stock bas (≤ 5 unités) | Icône Inventaire sidebar | ✅ |
| Dark Mode | Sidebar | ✅ |
| PWA installable sur mobile | Via navigateur | ✅ |
| Scanner Smartphone (WebRTC) | `/scanner-setup` | ✅ |
| Page Tarifs | `/pricing` | ✅ |
| Paramètres | `/settings` | ✅ |
| Isolation données multi-tenant (RLS) | Automatique | ✅ |

**⚠️ Non encore implémenté :**
- Raccourcis clavier (`/` chercher, `Entrée` payer, `Esc` annuler)
- Page Tables de restauration (`/tables` — nav visible mais route absente)
- Export Z-Caisse au format PDF
- Chaînage cryptographique NF525

---

## 🎯 0. Avant de commencer — Setup

```
1. Copier .env.example → .env et renseigner les clés Supabase
   (ou tester uniquement le mode Démo si pas de projet Supabase)
2. npm install && npm run dev
3. Ouvrir https://localhost:5177
4. Accepter l'avertissement de certificat auto-signé (normal en dev)
```

---

## 🟣 1. Mode Démo (Sans compte — à tester en premier)

> Valide le parcours "découverte" pour un visiteur non inscrit.

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 1.1 | Aller sur `/` (landing page) et cliquer **"Démo"** dans la navbar | Redirige vers `/pos/quick` avec 8 produits boulangerie pré-chargés |
| 1.2 | OU aller sur `/login` et cliquer **"Accéder au Mode Démo"** | Même résultat |
| 1.3 | Vérifier la sidebar | Badge "Boulangerie Louise", indicateur vert en ligne |
| 1.4 | Naviguer entre toutes les pages (Analytiques, Inventaire, Z-Caisse...) | Aucun crash, données de démo présentes partout |
| 1.5 | Rafraîchir la page (`F5`) en étant sur `/pos/quick` | **L'app reste en mode démo**, pas de redirection vers login |
| 1.6 | Se déconnecter (icône LogOut) | Retour sur `/` |

---

## 💳 2. Flux d'Encaissement de Base — Caisse Rapide

> Scénario nominal : une vente simple et rapide.

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 2.1 | Ouvrir `/pos/quick` | Grille de 8 produits (ou 12 max) avec prix en grand |
| 2.2 | Cliquer sur **"Pain au Chocolat"** | Apparaît dans le panier à droite, quantité 1 |
| 2.3 | Cliquer à nouveau sur le même produit | Quantité passe à 2, total mis à jour |
| 2.4 | Cliquer sur **"+"** dans le panier | Quantité 3 |
| 2.5 | Cliquer sur **"−"** jusqu'à 0 | L'article disparaît du panier |
| 2.6 | Ajouter 3 produits différents | Le total TTC s'affiche correctement |
| 2.7 | Cliquer **"Annuler la commande"** | Modale de confirmation apparaît |
| 2.8 | Confirmer l'annulation | Panier vide, toast "Commande annulée" |

---

## 💵 3. Paiement — CB, Espèces, Ticket QR

### 3a. Paiement CB

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 3.1 | Ajouter des produits, cliquer **"C.B"** | Modale de reçu s'affiche avec récapitulatif + QR code |
| 3.2 | Vérifier le QR code | Scanner avec smartphone → ouvre `/receipt/:id` dans le navigateur |
| 3.3 | Cliquer **"Fermer le reçu"** | Modale ferme, panier vide, prêt pour nouvelle vente |

### 3b. Paiement Espèces avec rendu monnaie

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 3.4 | Ajouter des produits (ex: total = 5,60 €), cliquer **"Espèces"** | Modale rendu monnaie apparaît |
| 3.5 | Saisir **10,00** dans "Montant remis" | Affiche en vert "Monnaie à rendre : 4,40 €" |
| 3.6 | Saisir **4,00** (insuffisant) | Affiche en rouge "Montant insuffisant", bouton Valider grisé |
| 3.7 | Corriger à 6,00, cliquer **"Valider le paiement"** | Vente enregistrée, reçu + QR code affiché |

---

## 📶 4. Résilience Offline (Mode Avion)

> Test critique avant bêta.

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 4.1 | Activer le **mode avion** (ou couper le WiFi) | Icône WifiOff rouge apparaît dans la sidebar |
| 4.2 | Réaliser une vente complète (2 produits, paiement CB) | Vente s'enregistre normalement, toast succès |
| 4.3 | Ouvrir l'Inspecteur navigateur → Application → IndexedDB | Une clé `offline_sale_...` est présente avec les données de la vente |
| 4.4 | Réactiver la connexion | L'icône passe en orange animé ("Synchronisation..."), puis vert |
| 4.5 | Vérifier Supabase Dashboard → Table `sales` | La vente est apparue avec le bon timestamp |
| 4.6 | Vérifier IndexedDB | La clé `offline_sale_...` a été supprimée |

---

## 📦 5. Inventaire & Catalogue

### 5a. Ajout manuel

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 5.1 | Aller sur `/inventory`, cliquer **"Ajouter un produit"** | Modale s'ouvre |
| 5.2 | Saisir : Nom="Test Produit", Prix HT=8,00, TVA=20% | Prix TTC estimé affiché : 9,60 € |
| 5.3 | Valider | Produit apparaît dans la liste, également visible dans la Caisse |
| 5.4 | Modifier le produit (icône crayon) | Les valeurs sont pré-remplies, modification sauvegardée |
| 5.5 | Mettre le stock à **3** | Le badge rouge apparaît sur l'icône Inventaire dans la sidebar |
| 5.6 | Supprimer le produit | Confirmation, produit retiré du catalogue et de la caisse |

### 5b. Import CSV

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 5.7 | Créer un fichier CSV : `nom;prix_ht;tva;catégorie;stock;code-barre` | — |
| 5.8 | Cliquer **"Importer CSV"**, sélectionner le fichier | Aperçu avec le nombre de produits détectés |
| 5.9 | Confirmer l'import | Toast de succès, produits visibles dans le catalogue |

---

## 📊 6. Analytiques & Z-Caisse

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 6.1 | Aller sur `/dashboard` (en mode démo) | Chiffres fictifs (CA 1 204,50€, 42 ventes), graphique hebdomadaire |
| 6.2 | Cliquer **"Export Comptable"** | Téléchargement d'un fichier `.xlsx` avec les ventes |
| 6.3 | Aller sur `/z-caisse` | Récapitulatif du jour : CA, ventilation CB/Espèces, panier moyen |
| 6.4 | Cliquer l'icône de téléchargement Z-Caisse | Fichier CSV/export généré |

---

## 🔐 7. Authentification & Multi-tenant (Nécessite Supabase configuré)

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 7.1 | Créer deux comptes : **Boulangerie A** et **Épicerie B** | Deux entrées dans `auth.users` |
| 7.2 | Avec A, ajouter un produit "Baguette" | Visible dans le catalogue de A |
| 7.3 | Se déconnecter, se connecter avec B | Le catalogue B est vide (ou contient ses propres produits) |
| 7.4 | Rechercher "Baguette" dans le catalogue B | **Aucun résultat** — isolation RLS confirmée |
| 7.5 | Ouvrir l'app sur deux onglets avec le même compte A | Modifier un prix dans l'onglet 1 → se met à jour **instantanément** dans l'onglet 2 |

---

## 📱 8. PWA & Mobile

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 8.1 | Ouvrir l'app sur mobile (Chrome/Safari) | Interface s'adapte à l'écran |
| 8.2 | Sur Android Chrome : menu "Ajouter à l'écran d'accueil" | L'app s'installe avec l'icône Heryze bleue |
| 8.3 | Lancer depuis l'écran d'accueil | Ouvre en mode standalone (sans barre navigateur) sur `/pos/quick` |
| 8.4 | Tester la Caisse Rapide sur mobile | Les boutons sont larges, cliquables facilement au doigt |
| 8.5 | Aller sur `/scanner-setup` | Instructions pour connecter un smartphone comme scanner |

---

## 🐛 9. Régressions à vérifier

> Points qui ont déjà posé problème — à re-tester systématiquement.

| # | Scénario | Ce qu'on vérifie |
| :--- | :--- | :--- |
| R.1 | Cliquer "Mode Démo" depuis la page Login | **Pas de boucle infinie** "Maximum update depth exceeded" (bug corrigé le 05/04) |
| R.2 | Rafraîchir la page en mode démo | Le mode démo **persiste** (pas de redirection login) |
| R.3 | Cliquer sur "Tables" dans la sidebar (domaine Restauration) | Route inexistante → page blanche ou 404 (bug connu, non bloquant) |
| R.4 | Ajouter 50 produits au catalogue en mode démo | Le badge stock bas se met à jour correctement sans re-render infini |

---

## 💳 10. Flux Stripe & Abonnements (Nouveau)

> **Pré-requis** : Avoir configuré les clés Stripe et déployé les fonctions Edge (`stripe-checkout`, `stripe-webhook`). Correction SQL effectuée.

| # | Action | Résultat attendu |
| :--- | :--- | :--- |
| 10.1 | Aller sur `/pricing` (authentifié) | Affiche le sélecteur d'effectif avec calcul dynamique du prix |
| 10.2 | Ajuster l'effectif à **3** et cliquer "S'abonner" | Spinner "Redirection...", puis redirection vers Stripe Checkout |
| 10.3 | Vérifier Stripe Checkout | Affiche le bon libellé (Heryze Mensuel) et la quantité (3) |
| 10.4 | Payer avec une carte de test (`4242...`) | Redirection vers `/dashboard?payment=success` |
| 10.5 | Vérifier le Dashboard | Toast de succès affiché, accès aux fonctionnalités débloqué |
| 10.6 | Vérifier Supabase (Table `subscriptions`) | Une ligne `monthly` avec status `active` est apparue pour le business |
| 10.7 | Test Webhook : Simuler une annulation dans Stripe | Le status passe en `cancelled` dans Supabase sous 5 secondes |

---

## 🚦 Checklist "Go/No-Go" pour la Bêta

### Go obligatoire (bloquant) 🔴
- [ ] Correction de la contrainte SQL `subscriptions_plan_check` (Monthly uniquement)
- [ ] Flux de vente Offline-First : vente → sync automatique à la reconnexion
- [ ] Mode Démo stable (pas de boucle infinie au login)
- [ ] Paiement Stripe fonctionnel (Checkout → Webhook → DB Sync)
- [ ] Ticket QR Code scannable par le client

### Go souhaitable (non bloquant) 🟡
- [ ] PWA installable sans erreur de cache (Workbox limit fixe)
- [ ] Interface responsive sur tablette (IPad)
- [ ] Scanner smartphone : latence < 500ms
- [ ] Z-Caisse : cohérence mathématique des totaux
- [ ] Raccourcis clavier de base (`/`, `Entrée`)

---

## 📋 Bugs connus / À ne pas oublier pour la bêta

| Priorité | Problème | Fichier concerné |
| :--- | :--- | :--- |
| 🔴 Corrigé | Boucle infinie en mode démo | `DashboardLayout.jsx`, `useAuthStore.ts` |
| 🟡 Moyen | Route `/tables` absente (lien mort pour Restauration) | `App.tsx` |
| 🟡 Moyen | Raccourcis clavier non implémentés | — |
| 🟢 Faible | `import React` inutilisé dans DashboardLayout (JSX transform) | `DashboardLayout.jsx` |

---

*Dernière mise à jour : 2026-04-05 — Bug mode démo résolu, PWA configurée, MVP fonctionnel.*