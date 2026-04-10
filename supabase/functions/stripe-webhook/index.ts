// supabase/functions/stripe-webhook/index.ts
// Reçoit les événements Stripe et synchronise la table `subscriptions` dans Supabase.
// Ce endpoint est PUBLIC (pas d'authentification JWT) mais sécurisé par signature HMAC.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper : Mettre à jour ou créer l'abonnement dans Supabase
async function upsertSubscription(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan?: string;
    status?: string;
    currentPeriodEnd?: Date | null;
    priceId?: string;
  }
) {
  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        business_id: businessId,
        stripe_customer_id: data.stripeCustomerId,
        stripe_subscription_id: data.stripeSubscriptionId,
        plan: data.plan || 'monthly',
        status: data.status || 'active',
        current_period_end: data.currentPeriodEnd?.toISOString() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'business_id' }
    );

  if (error) {
    console.error('[stripe-webhook] Erreur upsert subscription:', error);
    throw error;
  }
}

// Helper : Déterminer le plan depuis le priceId
function getPlanFromPriceId(priceId: string): string {
  const PRICE_MAP: Record<string, string> = {
    [Deno.env.get('STRIPE_PRICE_MONTHLY') || '']: 'monthly',
    [Deno.env.get('STRIPE_PRICE_ANNUAL') || '']: 'annual',
    [Deno.env.get('STRIPE_PRICE_PRO') || '']: 'pro',
  };
  return PRICE_MAP[priceId] || 'monthly';
}

serve(async (req) => {
  // Seul POST est accepté — pas de CORS car c'est Stripe qui appelle, pas le navigateur
  if (req.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Signature manquante', { status: 400 });
  }

  // 1. Vérifier la signature Stripe pour éviter les faux webhooks
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] Signature invalide:', err.message);
    return new Response(`Webhook invalide: ${err.message}`, { status: 400 });
  }

  console.log(`[stripe-webhook] Événement reçu: ${event.type}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (event.type) {

      // ── Paiement initial réussi (abonnement activé) ────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.metadata?.businessId;

        if (!businessId) {
          console.error('[stripe-webhook] businessId manquant dans les métadonnées');
          break;
        }

        // Récupérer les détails de l'abonnement Stripe
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const priceId = subscription.items.data[0]?.price?.id || '';
        const plan = getPlanFromPriceId(priceId);

        await upsertSubscription(supabase, businessId, {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          plan,
          status: 'active',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });

        console.log(`[stripe-webhook] Abonnement activé pour business: ${businessId}, plan: ${plan}`);
        break;
      }

      // ── Renouvellement de paiement réussi ─────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Retrouver le business depuis le customer Stripe
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('business_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!sub) break;

        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id || '';

        await upsertSubscription(supabase, sub.business_id, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          plan: getPlanFromPriceId(priceId),
          status: 'active',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });

        console.log(`[stripe-webhook] Renouvellement confirmé pour customer: ${customerId}`);
        break;
      }

      // ── Mise à jour de l'abonnement (changement de plan, pause...) ─────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('business_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!sub) break;

        const priceId = subscription.items.data[0]?.price?.id || '';

        await upsertSubscription(supabase, sub.business_id, {
          stripeSubscriptionId: subscription.id,
          plan: getPlanFromPriceId(priceId),
          status: subscription.status === 'active' ? 'active'
            : subscription.status === 'past_due' ? 'past_due'
            : subscription.status === 'trialing' ? 'trialing'
            : 'cancelled',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });

        console.log(`[stripe-webhook] Mise à jour abonnement: ${subscription.id}`);
        break;
      }

      // ── Abonnement annulé (fin, non-renouvellement) ───────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('business_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!sub) break;

        await upsertSubscription(supabase, sub.business_id, {
          stripeSubscriptionId: subscription.id,
          status: 'cancelled',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });

        console.log(`[stripe-webhook] Abonnement annulé pour customer: ${customerId}`);
        break;
      }

      // ── Paiement échoué ───────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('business_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!sub) break;

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('business_id', sub.business_id);

        console.warn(`[stripe-webhook] Paiement échoué pour customer: ${customerId}`);
        break;
      }

      default:
        console.log(`[stripe-webhook] Événement non géré: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[stripe-webhook] Erreur de traitement:', error);
    // On retourne 200 pour éviter que Stripe ré-essaie en boucle en cas de bug non-critique
    return new Response(JSON.stringify({ received: true, warning: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
