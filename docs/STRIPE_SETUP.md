# Configuration Stripe pour OmniPOS

## 1. Créer un compte Stripe

1. Aller sur https://dashboard.stripe.com/register
2. Compléter l'inscription et vérifier votre identité

## 2. Récupérer les clés API

Dashboard Stripe → **Developers** → **API Keys**

| Clé                        | Variable d'environnement          | Usage          |
|----------------------------|-----------------------------------|----------------|
| Publishable key (`pk_...`) | `VITE_STRIPE_PUBLISHABLE_KEY`     | Frontend       |
| Secret key (`sk_...`)      | `STRIPE_SECRET_KEY` (serveur)     | Backend/Edge   |

> **IMPORTANT**: La Secret Key ne doit JAMAIS être exposée côté client.

## 3. Créer les Produits/Prix

Dashboard Stripe → **Products** → **Add product**

### Plan Abonnement Zen (29€/mois)
- Nom: `OmniPOS Abonnement Zen`
- Prix: `29.00 EUR` / mois (récurrent)
- Notez le **Price ID** (`price_xxx...`)

### Plan Licence Perpétuelle (499€)
- Nom: `OmniPOS Licence Perpétuelle`
- Prix: `499.00 EUR` (paiement unique)
- Notez le **Price ID** (`price_xxx...`)

## 4. Ajouter au fichier `.env`

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_LIFETIME_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx
```

## 5. Installer le SDK

```bash
npm install @stripe/stripe-js
```

## 6. Configurer un Webhook (pour la production)

Dashboard Stripe → **Developers** → **Webhooks**

1. **Add endpoint**
2. URL: `https://votre-domaine.com/api/stripe-webhook`
3. Events à écouter:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 7. Fonction Supabase Edge (backend paiement)

Créez une Edge Function Supabase pour gérer le checkout:

```typescript
// supabase/functions/create-checkout/index.ts
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const { priceId, businessId, email } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: priceId.includes('recurring') ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.headers.get('origin')}/pos?payment=success`,
    cancel_url: `${req.headers.get('origin')}/#pricing`,
    metadata: { businessId },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## 8. Tester en mode développement

Stripe fournit des cartes de test:

| Carte               | Résultat            |
|----------------------|---------------------|
| `4242 4242 4242 4242` | Paiement réussi    |
| `4000 0000 0000 0002` | Carte refusée      |
| `4000 0025 0000 3155` | Requiert 3D Secure |

Date d'expiration: n'importe quelle date future
CVC: n'importe quels 3 chiffres

## 9. Checklist avant mise en production

- [ ] Passer en mode **Live** (Dashboard Stripe → Toggle)
- [ ] Remplacer les clés `pk_test_` par `pk_live_`
- [ ] Configurer le webhook en production
- [ ] Tester le flux complet (abonnement + annulation)
- [ ] Configurer les emails de reçu Stripe (Settings → Emails)
- [ ] Activer la facturation automatique
