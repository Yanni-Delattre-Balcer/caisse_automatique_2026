import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.warn('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY manquante. Paiements désactivés.');
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export const redirectToCheckout = async (priceId: string, email?: string) => {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe non configuré. Ajoutez VITE_STRIPE_PUBLISHABLE_KEY dans .env');
  }

  // En production, cette URL pointe vers une Supabase Edge Function ou un API endpoint
  const checkoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL || '/api/create-checkout';

  const response = await fetch(checkoutUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, email }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création de la session de paiement.');
  }

  const { url } = await response.json();
  window.location.href = url;
};
