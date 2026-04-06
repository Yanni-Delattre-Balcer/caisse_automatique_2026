# Plan d'implémentation : Système de Paiement & Abonnement Stripe (V2)

Ce document met à jour le plan d'implémentation pour le système de paiement Heryze, en intégrant les analyses de Gemini sur Stripe et les exigences spécifiques de modularité (feature gating préparé mais non activé).

## 1. Vision Stratégique (Inspirée de Fufuni)
Comme dans l'architecture `fufuni`, nous utilisons **Stripe Checkout** pour externaliser la sécurité et la complexité des formulaires bancaires, tout en gardant une synchronisation temps-réel via **Webhooks** vers nos Supabase Edge Functions.

### Principes Clés :
- **0 € de frais fixes** : Utilisation du modèle "Pay-as-you-go" de Stripe.
- **Stripe Billing** : Gestion des abonnements récurrents (gratuit jusqu'à 10k€ de revenus).
- **Checkout Session** : Redirection vers une page de paiement pro hébergée par Stripe.

## 2. Infrastructure Backend (Supabase)

### 2.1. Supabase Edge Functions
Nous déploierons deux fonctions principales :
- `stripe-checkout` : Reçoit le `priceId`, crée la session Stripe et retourne l'URL de redirection.
- `stripe-webhook` : Point d'entrée public pour Stripe. Valide la signature et met à jour la table `subscriptions`.

### 2.2. Base de Données
Nous utilisons la table `subscriptions` déjà existante :
- `status` : 'active', 'past_due', 'canceled', 'trialing'.
- `plan` : 'monthly', 'annual', 'pro'. (On conserve les 3 plans actuels).
- `current_period_end` : Date de fin de validité de l'abonnement.

## 3. Préparation du Feature Gating (Inactif)

Conformément à la demande, le système sera prêt techniquement mais n'appliquera aucune restriction immédiate.

### 3.1. Hook `useSubscription`
Un hook sera créé dans `src/hooks/useSubscription.ts` pour centraliser la logique de vérification :
```typescript
export const useSubscription = () => {
  const user = useAuthStore(state => state.user);
  
  // Pour l'instant, on retourne "true" pour tout pour ne pas bloquer l'usage
  return {
    status: user?.subscription?.status || 'trial',
    plan: user?.subscription?.plan || 'monthly',
    canAccessAnalytics: true, // Préparé : sera lié au plan plus tard
    canAccessInventory: true,
    isPro: true
  };
};
```

## 4. Checklist d'Exécution

### Phase A : Configuration Stripe
- [ ] Création du compte Stripe (Mode Test).
- [ ] Création des 3 produits/prix (Monthly, Annual, Pro) dans le Dashboard Stripe.
- [ ] Récupération des `Price IDs` et de la `Webhook Secret`.

### Phase B : Développement Backend
- [ ] Implémentation de la fonction Edge `stripe-checkout`.
- [ ] Implémentation de la fonction Edge `stripe-webhook` (gestion des événements `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`).

### Phase C : Intégration Frontend
- [ ] Mise à jour de `src/lib/stripe.ts` pour pointer vers les fonctions Edge.
- [ ] Connexion des boutons de la `PricingPage.jsx` au flux Stripe.
- [ ] Hydratation du store Auth avec les données de souscription.

## 5. Tests et Sécurité
- **Stripe CLI** : Utilisation pour le forwarding des webhooks en local.
- **Cartes de Test** : Utilisation systématique de la carte `4242...` pour valider les flux.
- **Validation de Signature** : Vérification stricte du secret webhook pour éviter les injections de faux paiements.

---
*Ce plan est une mise à jour directe de la partie 3 du document de stratégie initiale.*
