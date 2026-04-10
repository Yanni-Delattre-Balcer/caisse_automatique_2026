# Configuration Stripe pour Heryze

Ce guide couvre l'intégration Stripe de A à Z pour Heryze, en mode Test puis en production.

## 1. Créer votre compte Stripe

1. Aller sur https://dashboard.stripe.com/register
2. Créer un compte (l'activation du compte réel peut attendre — le mode Test est illimité et gratuit)
3. **Rester en Mode Test** tant que tout n'est pas validé (interrupteur en haut à droite du Dashboard)

---

## 2. Récupérer les clés API

Dashboard Stripe → **Developers** → **API Keys** (en mode Test)

| Clé                        | Variable                          | Où ?                      |
|----------------------------|-----------------------------------|---------------------------|
| Publishable key (`pk_test_`) | `VITE_STRIPE_PUBLISHABLE_KEY`   | `.env` frontend           |
| Secret key (`sk_test_`)     | `STRIPE_SECRET_KEY`              | Secrets Supabase Edge     |

> ⚠️ **La Secret Key ne doit JAMAIS figurer dans le code ou côté client.**

---

## 3. Créer les 3 Produits dans Stripe

Dashboard Stripe → **Product catalog** → **Add product**

### Plan Mensuel (19 €/mois)
- **Nom** : `Heryze Pro Mensuel`
- **Prix** : `19.00 EUR` / mois (récurrent)
- Notez le **Price ID** → `VITE_STRIPE_PRICE_MONTHLY`

### Plan Annuel (190 €/an)
- **Nom** : `Heryze Pro Annuel`
- **Prix** : `190.00 EUR` / an (récurrent)
- Notez le **Price ID** → `VITE_STRIPE_PRICE_ANNUAL`

### Plan Pro (39 €/mois)
- **Nom** : `Heryze Business Pro`
- **Prix** : `39.00 EUR` / mois (récurrent)
- Notez le **Price ID** → `VITE_STRIPE_PRICE_PRO`

---

## 4. Variables d'environnement

### Frontend — `.env`

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx

# Price IDs (récupérés depuis le Dashboard Stripe > Product catalog)
VITE_STRIPE_PRICE_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxx

# URL de la Supabase Edge Function stripe-checkout
VITE_STRIPE_CHECKOUT_URL=https://<PROJECT_REF>.supabase.co/functions/v1/stripe-checkout
```

### Backend — Secrets Supabase Edge Functions

Ces secrets sont à configurer dans **Dashboard Supabase → Settings → Edge Functions → Secrets** :

```
STRIPE_SECRET_KEY=sk_test_51Px_REMOVED_FOR_SECURITY
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxx
APP_URL=https://heryze.fr  (ou http://localhost:5173 en dev)
```

---

## 5. Déployer les Edge Functions

```bash
# Installer la CLI Supabase si ce n'est pas fait
npm install -g supabase

# Connexion
supabase login

# Déploiement des deux fonctions
supabase functions deploy stripe-checkout --project-ref <PROJECT_REF>
supabase functions deploy stripe-webhook --project-ref <PROJECT_REF>
```

---

## 6. Configurer le Webhook Stripe

Dashboard Stripe → **Developers** → **Webhooks** → **Add endpoint**

- **URL** : `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`
- **Events à écouter** :
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Notez le **Webhook Secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### Test en local avec la CLI Stripe

```bash
# Installer la CLI Stripe
# Linux : https://stripe.com/docs/stripe-cli

# Forwarder les événements vers votre Edge Function locale
stripe listen --forward-to https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook

# Simuler un paiement réussi
stripe trigger checkout.session.completed
```

---

## 7. Cartes de test

| Numéro               | Résultat            |
|----------------------|---------------------|
| `4242 4242 4242 4242` | Paiement réussi    |
| `4000 0000 0000 0002` | Carte refusée      |
| `4000 0025 0000 3155` | Requiert 3D Secure |

- Date d'expiration : n'importe quelle date future
- CVC : n'importe quels 3 chiffres

---

## 8. Flux complet (rappel)

```
Utilisateur clique "Souscrire"
  → PricingPage appelle redirectToCheckout(priceId)
  → stripe.ts envoie POST à la Supabase Edge Function stripe-checkout (avec JWT)
  → Edge Function crée la session Stripe et retourne l'URL
  → Navigateur redirige vers Stripe Checkout
  → Utilisateur paie avec sa carte
  → Stripe appelle le webhook stripe-webhook
  → Edge Function met à jour la table subscriptions dans Supabase
  → Utilisateur est redirigé vers /dashboard?payment=success
```

---

## 9. Checklist avant mise en production

- [ ] Basculer Stripe en mode **Live** (Dashboard → interrupteur)
- [ ] Remplacer toutes les clés `pk_test_` / `sk_test_` par leurs équivalents `pk_live_` / `sk_live_`
- [ ] Reconfigurer le webhook en Live avec la nouvelle `whsec_` Live
- [ ] Mettre à jour les secrets Supabase Edge Functions avec les clés Live
- [ ] Tester le flux complet (abonnement + annulation + renouvellement)
- [ ] Activer les emails de reçu Stripe (Settings → Emails)
- [ ] Vérifier que `APP_URL` pointe vers le domaine de production
