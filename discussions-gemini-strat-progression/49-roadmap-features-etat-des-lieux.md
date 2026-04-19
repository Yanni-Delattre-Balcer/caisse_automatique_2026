# Doc 49 — Roadmap Features & État des Lieux Heryze
**Date : 16 avril 2026**
**Statut : DOCUMENT DE TRAVAIL — base de décision pour les prochains sprints**

---

## 1. État des lieux — Ce qui existe vraiment

### ✅ Ce qui est en place et fonctionnel

| Module | Ce qu'il fait réellement | Qualité |
|--------|--------------------------|---------|
| **POS (caisse)** | Grille produits, panier, paiement CB/Espèces, enregistrement en base | ✅ Solide |
| **Quick POS** | Version simplifiée, saisie montant rapide | ✅ Solide |
| **Inventaire** | CRUD produits, import CSV, code-barres, stock, TVA HT/TTC | ✅ Bon |
| **Dashboard Analytiques** | CA jour, panier moyen, nb ventes, graphique semaine, export Excel | ✅ Correct |
| **Z-Caisse** | Clôture quotidienne, ventilation CB/Espèces, export CSV, liste transactions | ✅ Bon |
| **Scanner Mobile** | Scan code-barres depuis mobile connecté en local | ✅ Spécifique |
| **Tunnel de paiement** | Stripe Checkout → webhook → activation `subscription_status` | ✅ Validé 16/04 |
| **HardWall** | Blocage au-delà de la période d'essai, redirection pricing | ✅ En place |
| **Auth** | Register, Login, Zustand persist, onboarding | ✅ Solide |
| **Landing + Pricing** | 3 plans (Starter 19€ / Business 39€ / Expert 69€) + module Restauration 10€ | ✅ En place |

### ❌ Faiblesses structurelles actuelles

| Problème | Impact | Gravité |
|----------|--------|---------|
| Price IDs `price_mock_*` dans PricingPage | Le bouton "Souscrire" depuis la landing ne crée pas de vraie session Stripe | 🔴 Bloquant prod |
| Feature gating non câblé | Starter et Business ont les mêmes droits — le HardWall ne distingue pas les plans | 🔴 Bloquant prod |
| Mapping plan webhook (`monthly` au lieu de `starter`) | Mauvais tracking en base, futur bug de gating | 🟠 Moyen |
| Pas de mode hors-ligne | Une coupure Wi-Fi = caisse morte | 🟠 Moyen |
| Pas de ticket client | Pas de reçu PDF ni email envoyé au client | 🟠 Moyen |
| Pas de remises/promo | Impossible de faire -10% ou un code promo | 🟠 Moyen |
| Z-Caisse seulement "aujourd'hui" | Pas d'historique des clôtures passées | 🟡 Faible |
| Pas de gestion caissiers/PIN | Un seul compte — pas de multi-employés avec sessions séparées | 🟡 Faible |
| Dashboard limité à la semaine courante | Pas de sélection de période (mois, trimestre, comparatif) | 🟡 Faible |
| Pas de remboursement/retour | Impossible d'annuler une vente proprement | 🟡 Faible |

---

## 2. Analyse par profil — Ce qui déclenche l'abonnement

### 👤 Starter — 19€/mois — Auto-entrepreneur, Artisan, Indépendant

**Profil** : Un seul opérateur, souvent sans comptable. Il veut que ça marche tout de suite, comprendre ce qu'il gagne vraiment, et éviter les problèmes avec l'URSSAF.

**Ce qui le ferait payer aujourd'hui** :
- Il a une caisse qui marche, un Z-Caisse propre à montrer à son comptable → ✅ déjà là
- Un reçu email envoyé au client → ❌ absent
- Un calcul simple "ce que vous devez mettre de côté pour l'URSSAF" → ❌ absent
- Un export simple pour sa déclaration → ✅ partiellement (CSV/Excel)

**Ce qui le ferait churner** :
- La caisse tombe en panne sans Wi-Fi → mode offline absent
- Il ne comprend pas la différence entre HT et TTC → pas d'aide contextuelle
- Il rate une vente parce que le produit n'est pas dans le catalogue → Quick POS existe mais pas évident

**Features prioritaires pour ce segment** :

| Feature | Effort | Impact rétention |
|---------|--------|-----------------|
| Ticket dématérialisé (email via Resend) | Moyen | Élevé |
| Widget URSSAF / Prévisionnel mensuel | Faible | Élevé |
| Remise rapide (-X% ou -X€ sur le panier) | Faible | Moyen |
| Mode hors-ligne basique (IndexedDB) | Élevé | Élevé |
| Aide contextuelle (tooltip TVA, Z-Caisse) | Faible | Moyen |

---

### 👥 Business — 39€/mois — Boutique, Café, Salon, Équipe de 2-5 personnes

**Profil** : Un gérant + des employés. Il a besoin de contrôle, de sécurité, et d'efficacité. Il perd de l'argent sur les erreurs de caisse et les ruptures de stock qu'il ne voit pas à temps.

**Ce qui le ferait payer aujourd'hui** :
- Plusieurs postes qui ne se marchent pas dessus → multi-accès simultanés ❌ non géré
- Ses employés ont leur propre login ou PIN → ❌ absent
- Il voit en temps réel ce qui se vend → ✅ dashboard (limité)
- Il reçoit une alerte quand un produit est presque épuisé → ❌ absent
- Il clôture la caisse sans erreur → ✅ Z-Caisse (limité au jour actuel)

**Ce qui le ferait churner** :
- Un employé rembourse sans autorisation → pas de droits différenciés
- La caisse est différente selon le poste → pas de sync temps réel
- Il doit refaire l'inventaire à la main → pas d'alerte stock critique

**Features prioritaires pour ce segment** :

| Feature | Effort | Impact rétention |
|---------|--------|-----------------|
| Gestion employés (PIN ou sous-compte) | Élevé | Très élevé |
| Alertes stock critique (seuil configurable) | Faible | Élevé |
| Historique Z-Caisse (clôtures passées) | Faible | Élevé |
| Dashboard période personnalisable (mois, trimestre) | Moyen | Moyen |
| Remboursement / avoir | Moyen | Élevé |
| Sync temps réel entre postes | Très élevé | Très élevé |
| Rapport par caissier | Moyen | Moyen |

---

### 🏢 Expert — 69€/mois — Restaurant, Bar, Commerce multi-services

**Profil** : Il a des tables, une cuisine, des serveurs. Son logiciel actuel coûte 150€/mois et c'est une boîte noire. Il veut quelque chose de moderne qui s'intègre à sa façon de travailler.

**Ce qui le ferait payer aujourd'hui** :
- Plan de salle interactif (tables numérotées, statut occupé/libre) → ❌ route `/tables` existe mais non développée
- Envoi commande en cuisine (bon de commande) → ❌ absent
- Gestion des additions partagées → ❌ absent
- Export FEC (obligatoire au-dessus d'un certain CA) → ❌ absent
- Connexion imprimante ticket thermique → ❌ absent

**Ce qui le ferait churner** :
- Il doit retaper la commande deux fois (une pour le serveur, une pour la cuisine)
- Il ne peut pas splitter une addition
- Il n'a pas son FEC en fin d'année → risque légal

**Features prioritaires pour ce segment** :

| Feature | Effort | Impact conversion |
|---------|--------|------------------|
| Plan de salle (tables + statut) | Élevé | Très élevé |
| Bon de commande cuisine (affichage écran ou imprimante) | Élevé | Très élevé |
| Split addition | Moyen | Élevé |
| Export FEC normé | Moyen | Très élevé (légal) |
| Pourboires (tips) intégrés | Faible | Moyen |
| Impression ticket thermique (ESC/POS) | Élevé | Très élevé |

---

## 3. Quick Wins — Ce qu'on peut faire vite avec un fort impact

Ces features coûtent peu et débloquent une vraie valeur perçue ou corrigent un risque de churn immédiat.

### QW-1 : Câbler les vrais Price IDs dans PricingPage
**Effort** : 30 minutes  
**Impact** : Bloquant pour la mise en production  
Remplacer les `price_mock_*` par les vrais IDs Stripe depuis `.env`. Sans ça, personne ne peut s'abonner depuis la landing page.

### QW-2 : Feature gating réel par plan
**Effort** : 1-2 jours  
**Impact** : Bloquant pour la monétisation  
Le store sait que l'utilisateur est `starter` ou `business`. Il faut que les features Business/Expert soient réellement inaccessibles au Starter (ex : Dashboard avancé, multi-postes). Un hook `useGating(plan)` qui retourne `canAccess` suffit.

### QW-3 : Remise rapide sur le panier
**Effort** : 2-3 heures  
**Impact** : Demandé par tous les commerçants, différenciateur face aux solutions simplistes  
Un bouton "Remise" dans CheckoutCart → modale avec choix % ou montant fixe → s'applique au total.

### QW-4 : Alertes stock critique dans Inventaire
**Effort** : 2 heures  
**Impact** : Élevé pour le Business, coût quasi-nul  
Seuil configurable par produit (ou global à 5 unités). Bandeau d'alerte en haut de la page Inventaire + badge rouge sur l'icône nav.

### QW-5 : Historique Z-Caisse
**Effort** : 1 jour  
**Impact** : Élevé pour le Business — un gérant veut voir la semaine passée  
Une table `z_sessions` avec snapshot quotidien (CA, nb transactions, ventilation). Affichage liste des clôtures passées en dessous de la clôture du jour.

### QW-6 : Widget URSSAF dans le Dashboard
**Effort** : 1 jour  
**Impact** : Fort différenciateur Starter  
Sur la base du CA du mois en cours et du régime déclaré dans Settings (micro-BIC / micro-BNC / micro-commercial), afficher :
- CA du mois
- Cotisation URSSAF estimée (taux fixe par régime)
- "Il vous reste X€ avant le plafond micro"
Disclaimer : "Indicatif — consultez un comptable pour votre déclaration."

### QW-7 : Ticket dématérialisé (email)
**Effort** : 1-2 jours  
**Impact** : Très demandé, écologique, construit une base d'emails clients  
Après chaque vente, option "Envoyer le reçu par email". Intégration Resend (déjà dans l'écosystème Supabase). Template HTML simple avec le détail de la vente.

---

## 4. Chantiers Moyen Terme (1-3 mois)

| # | Feature | Plan cible | Effort estimé |
|---|---------|-----------|---------------|
| MT-1 | Mode hors-ligne (IndexedDB + sync) | Tous | 1-2 semaines |
| MT-2 | Remboursement / avoir client | Business+ | 3-4 jours |
| MT-3 | Gestion employés (PIN + session caissier) | Business+ | 1 semaine |
| MT-4 | Dashboard période personnalisable | Business+ | 3-4 jours |
| MT-5 | Rapport par caissier | Business+ | 2-3 jours |
| MT-6 | Export FEC normé | Expert | 3-4 jours |
| MT-7 | Plan de salle interactif (tables) | Expert | 2-3 semaines |
| MT-8 | Bon de commande cuisine | Expert | 1-2 semaines |
| MT-9 | Impression ticket thermique (ESC/POS) | Business+ | 1 semaine |
| MT-10 | Programme fidélité simple (points/tampon) | Business+ | 1-2 semaines |

---

## 5. Ce qu'on ne fait PAS (et pourquoi)

| Feature écartée | Raison |
|-----------------|--------|
| Application mobile native (React Native / Flutter) | La PWA mobile suffit pour l'instant. Coût de maintenance 2x. |
| IA Advisor (recommandations automatiques) | Trop tôt. Pas assez de données. Risque de réponses fausses. |
| Comptabilité intégrée complète | On n'est pas un logiciel de compta — on exporte vers un comptable. |
| Marketplace fournisseurs | Hors scope, complexité extrême, autre business model. |
| Multi-devises | < 1% des cibles actuelles, coût disproportionné. |

---

## 6. Ordre d'implémentation recommandé

### Sprint A — Débloquage prod (maintenant)
1. QW-1 : Vrais Price IDs → mettre en production Stripe possible
2. Fix mapping plan webhook (`starter` au lieu de `monthly`)
3. QW-2 : Feature gating réel → la monétisation a du sens

### Sprint B — Rétention Starter (après prod)
4. QW-3 : Remise rapide
5. QW-4 : Alertes stock critique
6. QW-6 : Widget URSSAF
7. QW-7 : Ticket email (Resend)

### Sprint C — Rétention Business
8. QW-5 : Historique Z-Caisse
9. MT-2 : Remboursement / avoir
10. MT-3 : Gestion employés (PIN)
11. MT-4 : Dashboard période personnalisable

### Sprint D — Conversion Expert
12. MT-7 : Plan de salle
13. MT-6 : Export FEC
14. MT-8 : Bon de commande cuisine
15. MT-9 : Impression thermique

---

## 7. Résumé — Forces vs Concurrents

| Critère | Heryze aujourd'hui | SumUp / iZettle | Lightspeed / Zelty |
|---------|-------------------|-----------------|-------------------|
| Prix | ✅ 19-69€/mois | ✅ Gratuit (% transaction) | ❌ 80-200€/mois |
| Interface moderne | ✅✅ | ⚠️ Correct | ⚠️ Daté |
| Setup en 5 min | ✅ | ✅ | ❌ |
| Z-Caisse | ✅ | ❌ | ✅ |
| Inventaire | ✅ | ⚠️ Basique | ✅✅ |
| Mode hors-ligne | ❌ | ✅ | ✅ |
| Plan de salle resto | ❌ | ❌ | ✅ |
| Export compta | ⚠️ CSV/Excel | ❌ | ✅ FEC |
| Remise/promo | ❌ | ⚠️ | ✅ |
| Ticket email | ❌ | ✅ | ✅ |
| API ouverte | ❌ | ⚠️ | ✅ |

**Verdict** : Heryze gagne sur le prix et l'interface. Il perd sur la complétude. Le Sprint B et C comblent les manques les plus visibles face à la concurrence sans casser le modèle économique.

---

> Ce document sert de base de décision. Chaque feature validée fera l'objet d'un doc dédié avant implémentation.
