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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  let response: Response;
  try {
    response = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Runtime Supabase authentifié via anon key (HS256)
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        // JWT utilisateur passé dans un header custom pour éviter le rejet ES256
        'x-user-token': token,
      },
      body: JSON.stringify({ priceId, planType }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('La requête a expiré (15s). Vérifiez que la Edge Function Supabase est bien déployée.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error || body?.message || `Erreur HTTP ${response.status}`;
    throw new Error(message);
  }

  const { url } = await response.json();

  if (!url) {
    throw new Error('URL de paiement manquante dans la réponse.');
  }

  // Redirection vers la page de paiement Stripe (même onglet — évite les popup blockers)
  window.location.href = url;
};
