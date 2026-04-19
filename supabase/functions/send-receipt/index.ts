import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = Deno.env.get('RECEIPT_FROM_EMAIL') || 'recu@heryze.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildHtml(sale: Record<string, unknown>, companyName: string): string {
  const items = (sale.items as Array<{ name: string; quantity: number; price: number }>) || [];
  const discountAmount = Number(sale.discount_amount) || 0;
  const totalTtc = Number(sale.total_ttc) || 0;
  const rawTotal = totalTtc + discountAmount;

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:6px 0;color:#374151;">${i.quantity}x ${i.name}</td>
      <td style="padding:6px 0;color:#374151;text-align:right;">${(i.price * i.quantity).toFixed(2)} €</td>
    </tr>`).join('');

  const discountHtml = discountAmount > 0 ? `
    <tr>
      <td style="padding:6px 0;color:#059669;">Remise</td>
      <td style="padding:6px 0;color:#059669;text-align:right;">−${discountAmount.toFixed(2)} €</td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0055ff,#00c2ff);padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Heryze</h1>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">${companyName}</p>
    </div>

    <div style="padding:32px;">
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">
        ${formatDate(String(sale.created_at))} · Paiement par ${sale.payment_method}
      </p>

      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${itemsHtml}
          ${discountHtml}
        </tbody>
        <tfoot>
          <tr style="border-top:2px solid #f3f4f6;">
            <td style="padding:12px 0 0;font-weight:900;font-size:16px;color:#111827;">Total TTC</td>
            <td style="padding:12px 0 0;font-weight:900;font-size:20px;color:#0055ff;text-align:right;">${totalTtc.toFixed(2)} €</td>
          </tr>
          ${discountAmount > 0 ? `<tr><td colspan="2" style="padding:4px 0 0;font-size:12px;color:#9ca3af;">Dont remise de ${discountAmount.toFixed(2)} € sur un total de ${rawTotal.toFixed(2)} €</td></tr>` : ''}
        </tfoot>
      </table>

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">Merci pour votre achat chez <strong>${companyName}</strong>.</p>
        <p style="color:#d1d5db;font-size:11px;margin:8px 0 0;">Reçu généré par Heryze · heryze.com</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userToken = req.headers.get('x-user-token');
    if (!userToken) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, sale, companyName } = await req.json();
    if (!email || !sale) {
      return new Response(JSON.stringify({ error: 'Paramètres manquants' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = buildHtml(sale, companyName || 'Votre commerce');

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${companyName || 'Heryze'} <${FROM_EMAIL}>`,
        to: [email],
        subject: `Votre reçu — ${companyName || 'Heryze'}`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.json().catch(() => ({}));
      console.error('[send-receipt] Resend error:', err);
      throw new Error(err.message || 'Erreur Resend');
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[send-receipt] Erreur:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
