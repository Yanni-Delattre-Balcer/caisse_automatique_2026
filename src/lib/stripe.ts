import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

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

/**
 * Crée une session Stripe Checkout et redirige l'utilisateur vers la page de paiement.
 * Nécessite que l'utilisateur soit authentifié (JWT Supabase requis).
 */
export const redirectToCheckout = async (priceId: string, planType: string) => {
  // Récupérer la session courante pour obtenir le JWT
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Vous devez être connecté pour souscrire à un abonnement.');
  }

  // URL de la Supabase Edge Function (configurée dans .env)
  const checkoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL;

  if (!checkoutUrl) {
    throw new Error('VITE_STRIPE_CHECKOUT_URL non configurée dans le .env');
  }

  const response = await fetch(checkoutUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ priceId, planType }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || 'Erreur lors de la création de la session de paiement.');
  }

  const { url } = await response.json();

  if (!url) {
    throw new Error('URL de paiement manquante dans la réponse.');
  }

  // Redirection vers la page de paiement Stripe
  window.location.href = url;
};
