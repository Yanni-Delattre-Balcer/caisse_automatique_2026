# Plan d'implémentation : Déploiement GitHub Pages + Formulaire de contact + Paiement / Abonnement

## Contexte
Ce plan couvre les 4 axes demandés :
1. Diagnostiquer et réparer le déploiement GitHub Pages.
2. Ajouter un formulaire de contact sur la landing page et envoyer les messages par mail vers `briac.le.meillat@gmail.com`.
3. Mettre en place le paiement / abonnement d'entreprise en s'inspirant précisément de l'architecture Stripe de `sctg-development/fufuni`.
4. Prévoir la gestion des permissions / restrictions selon l'abonnement souscrit.

---

## 1. Diagnostic et correction GitHub Pages
### 1.1. Vérifier l’existant
- Le workflow `.github/workflows/deploy.yml` utilise `actions/configure-pages@v4` et `actions/deploy-pages@v4`.
- Il build bien `dist/` avec `VITE_BASE_PATH=/caisse_automatique_2026/`.

### 1.2. Sources probables de l’erreur
- `HttpError: Not Found` indique souvent que GitHub Pages n’est pas activé ou que le site Pages n’est pas encore créé pour ce dépôt.
- Le message `Get Pages site failed` renvoie à une configuration du repo GitHub Pages.

### 1.3. Actions à mener
1. Vérifier dans les paramètres GitHub du dépôt que Pages est activé et que la source est bien `GitHub Actions`.
2. Vérifier que le repo n’est pas configuré pour utiliser une branche ou un dossier différent.
3. S’assurer que les permissions Actions incluent bien `pages: write` et `id-token: write` (déjà présent dans le workflow).
4. Si nécessaire, activer manuellement un site Pages une première fois dans GitHub et relancer le workflow.
5. Vérifier que `public/404.html` existe si le site est servi en SPA, même si ce workflow déploie `dist/`.

### 1.4. Option alternative recommandée
- Si le problème persiste ou pour une configuration plus fiable, migrer le déploiement vers **Cloudflare Pages**, comme déjà recommandé dans plusieurs notes/doc du projet.
- Avantages : HTTPS natif sur domaine perso, meilleure compatibilité SPA, plus simple à configurer pour un frontend statique.

---

## 2. Formulaire de contact sur la landing page
### 2.1. Objectif
Ajouter un formulaire `Contact` sur la page d’accueil qui envoie un mail vers `briac.le.meillat@gmail.com`.

### 2.2. Système recommandé (même principe que `briac-le-meillat`)
- Créer un endpoint backend `/api/contact`.
- Le backend envoie un mail via SMTP Gmail.
- Variables à stocker en environnement :
  - `SMTP_EMAIL`
  - `SMTP_PASSWORD`
  - `ADMIN_EMAIL=briac.le.meillat@gmail.com`
  - éventuellement `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`

### 2.3. Architecture cible
- Frontend : formulaire `name`, `email`, `message`.
- POST JSON vers `/api/contact`.
- Backend : validation du payload, envoi SMTP, retour `200` / `400`.
- UI : afficher confirmation/erreur après soumission.

### 2.4. Option d’implémentation
- Si le projet reste statique : créer une fonction serverless (Supabase Edge Function, Cloudflare Worker, Netlify Function) qui fait l’envoi.
- Si un backend est ajouté : un endpoint Express/FastAPI / Node simple suffit.

### 2.5. Comportement exact du `briac-le-meillat`
- Le backend fait un `send_contact_email(name, email, message)`.
- Le message est envoyé à `ADMIN_EMAIL`.
- Le `Reply-To` est défini sur l’email du visiteur.
- Si SMTP n’est pas configuré, l’API retourne quand même une réponse mais sans envoi effectif.

---

## 3. Paiement / abonnement – implémentation similaire à `fufuni`
### 3.1. Principes à reprendre de `fufuni`
- Frontend SPA + backend API séparé.
- Stripe Checkout pour la redirection de paiement.
- Webhooks Stripe pour valider les paiements et synchroniser le statut d’abonnement.
- Stockage des informations de facturation / abonnement côté backend / base.
- Permissions basées sur abonnement / rôle.

### 3.2. Composants clés
1. **Front-end**
   - Boutons de pricing sur la landing page.
   - `src/lib/stripe.ts` déjà existant dans le projet.
   - `handleSubscribe(plan)` sur la page de tarification.
2. **Back-end**
   - Endpoint `POST /api/create-checkout` ou `POST /api/checkout-session`.
   - Endpoint webhook `POST /api/webhook/stripe`.

### 3.3. Variables d’environnement nécessaires
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `VITE_STRIPE_MONTHLY_PRICE_ID`
- `VITE_STRIPE_LIFETIME_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_CHECKOUT_URL` (URL du backend de création de session)
- `SUCCESS_URL` et `CANCEL_URL` si l’on veut externaliser.

### 3.4. Flux de paiement
1. L’utilisateur clique sur un plan.
2. Le frontend appelle l’API de création de session avec : `priceId`, `email` et éventuellement `userId`.
3. Le backend crée la session Stripe :
   - `mode = subscription` si abonnement récurrent
   - `mode = payment` si achat one-shot
   - `customer_email`
   - `line_items: [{ price: priceId, quantity: 1 }]`
   - `success_url`, `cancel_url`
   - `metadata: { userId, plan, subscriptionType }`
4. Le backend retourne `session.url`.
5. Le frontend redirige l’utilisateur vers Stripe Checkout.

### 3.5. Webhook Stripe à gérer
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.updated`
- `invoice.payment_failed`
- `customer.subscription.deleted`

### 3.6. Synchronisation du statut d’abonnement
- Lors du webhook `checkout.session.completed`, stocker en base :
  - `userId`
  - `plan` / `subscriptionType`
  - `stripeCustomerId`
  - `stripeSubscriptionId`
  - `priceId`
  - `status`
  - `current_period_end`
- Lors du webhook `customer.subscription.updated`, mettre à jour le statut et la date de fin.

### 3.7. Equivalence avec `fufuni`
- `fufuni` stocke l’état de paiement côté backend et utilise Stripe comme source de vérité.
- Notre implémentation doit aussi se baser sur Stripe + webhooks pour ne pas conserver un état non fiable côté client.
- Le frontend doit simplement déclencher le checkout et lire le statut dans l’API / user session.

---

## 4. Gestion des permissions / restrictions selon l’abonnement
### 4.1. Cartographie des offres
Proposition de niveaux :
- `free` / `demo`
- `pro` / `monthly`
- `lifetime`
- éventuellement `enterprise` si besoin ultérieur

### 4.2. Features associées
- `free` : accès de base, démo, nombre limité de produits/transactions, pas de dashboard avancé.
- `pro` : accès complet à l’essentiel, support email, analyses, export CSV, Z-caisse, multi-utilisateur.
- `lifetime` : mêmes fonctionnalités que `pro` + accès permanent sans abonnement récurrent.

### 4.3. Implantation technique
1. Créer un champ `subscription` / `plan` pour l’utilisateur dans la table `profiles` ou `users`.
2. Charger ce statut au login et le stocker dans `useAuthStore`.
3. Créer un service `subscriptionService` ou `featureGate` qui expose :
   - `canUseAnalytics`
   - `canUseZCaisse`
   - `canUseImportCsv`
   - `canUseSync`
   - `canAccessSupport`
4. Dans les pages sensibles, vérifier avant rendu et afficher un message `upgrade` si besoin.
5. Si possible, renforcer côté backend avec des vérifications sur les endpoints importants.

### 4.4. Exemple de règles
- `free` : accès à `QuickPos`, `Pos` basique, catalogue limité.
- `pro` : accès à `Dashboard`, `Inventory`, `ZCaisse`, `ReceiptPage`, `Export CSV`.
- `lifetime` : tout accès débloqué.

### 4.5. Gestion proactive des tests et des erreurs
- Lors du chargement du user, si la souscription Stripe n’est pas valide, forcer la catégorie `free`.
- En cas d’erreur webhook, stocker l’événement et alerter le développeur par mail si possible.

---

## 5. Tests d’inscription, connexion, produit et notifications
### 5.1. Scénarios de test essentiels
- Inscription et login avec un nouveau compte.
- Accès à la démo sans connexion.
- Envoi du formulaire de contact et réception du mail.
- Achat d’un abonnement `monthly` via Stripe Checkout.
- Achat d’une licence `lifetime` via Stripe Checkout.
- Réception du webhook et mise à jour du statut d’utilisateur.
- Utilisation des fonctionnalités gated selon l’abonnement.
- Tentative d’accès à une fonctionnalité payante avec un compte `free`.

### 5.2. Tests de robustesse
- En cas d’échec SMTP, le contact form doit informer l’utilisateur sans planter.
- En cas de webhook Stripe invalide, journaliser l’événement et alerter le développeur.
- Vérifier que `VITE_BASE_PATH` ne casse pas le build GitHub Pages.

---

## 6. Priorisation des tâches
### Phase 1 : Déploiement + contact
- Fixer le déploiement GitHub Pages.
- Ajouter le formulaire de contact sur la landing page.
- Créer l’API `POST /api/contact` et le flux SMTP Gmail.

### Phase 2 : Paiement / abonnement
- Valider l’architecture Stripe Checkout + backend.
- Créer l’endpoint de session de paiement.
- Déployer et tester le webhook Stripe.
- Configurer les produits/prix Stripe.

### Phase 3 : Permissions / gating
- Stocker le statut d’abonnement dans le profil utilisateur.
- Implémenter les restrictions de fonctionnalités.
- Tester tous les scénarios d’usage.

### Phase 4 : Revue et production
- Vérifier les secrets GitHub Actions / environnements.
- Préparer la documentation interne (README + docs/STRIPE_SETUP.md).
- Si besoin, basculer vers Cloudflare Pages pour une configuration plus stable.

---

## 7. Recommandations finales
- **Courte échéance** : réparer GitHub Pages + contact mail.
- **Moyen terme** : finaliser Stripe + abonnement.
- **Long terme** : basculer vers un déploiement stable Cloudflare et ajouter une vraie gestion de permissions par plan.
- **Note** : le système de contact doit rester simple et robuste. Le pattern Gmail SMTP de `briac-le-meillat` est adapté pour démarrer.
