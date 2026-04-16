// supabase/functions/stripe-checkout/index.ts
// Crée une session Stripe Checkout sécurisée pour les abonnements Heryze.
// Appelée par le frontend avec le JWT Supabase de l'utilisateur connecté.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Vérifier l'authentification via le header custom x-user-token
    // (Authorization contient l'anon key pour le runtime, x-user-token contient le JWT utilisateur)
    const userToken = req.headers.get('x-user-token');
    if (!userToken) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Valider le JWT utilisateur via l'API Auth Supabase (vérification serveur, pas locale)
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Récupérer le corps de la requête
    const { priceId, planType } = await req.json();

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'priceId manquant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Récupérer le commerce (business) associé à l'utilisateur
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('owner_id', user.id)
      .single();

    if (bizError || !business) {
      return new Response(JSON.stringify({ error: 'Commerce introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Vérifier si un client Stripe existe déjà pour ce commerce
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('business_id', business.id)
      .single();

    let customerId = sub?.stripe_customer_id;

    // Sinon, créer un nouveau client Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: business.name,
        metadata: {
          businessId: business.id,
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // 5. Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      subscription_data: {
        trial_period_days: 14,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // URLs de retour post-paiement
      success_url: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/checkout-summary?plan=${planType || 'starter'}&payment=cancelled`,
      // Métadonnées pour la réconciliation dans le webhook
      metadata: {
        businessId: business.id,
        userId: user.id,
        planType: planType || 'unknown',
      },
      // Option : pré-remplir l'email
      customer_email: !customerId ? user.email : undefined,
      // Activer la gestion des taxes automatique (optionnel)
      // automatic_tax: { enabled: true },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[stripe-checkout] Erreur:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
