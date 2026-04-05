import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Download, ShieldCheck, CalendarDays, Gem, Crown } from 'lucide-react';

// ──────────────────────────────────────────────────
// Données des plans
// ──────────────────────────────────────────────────
const PLANS = [
  {
    id: 'monthly',
    icon: <CalendarDays className="w-5 h-5" />,
    label: 'Mensuel',
    price: '19',
    priceSuffix: '€/mois',
    billing: 'Facturé mensuellement',
    badge: null,
    highlight: false,
    features: [
      'Scanner WebRTC illimité',
      'Synchronisation Cloud temps réel',
      'Export comptable mensuel',
      'Tableau de bord analytique',
      'Support par email 5j/7',
    ],
    disabledFeatures: [],
  },
  {
    id: 'annual',
    icon: <Gem className="w-5 h-5" />,
    label: 'Annuel',
    price: '190',
    priceSuffix: '€/an',
    priceNote: 'soit 15,83 €/mois',
    billing: 'Facturé annuellement',
    badge: 'MEILLEURE VALEUR',
    highlight: true,
    oldPrice: '228',
    features: [
      'Scanner WebRTC illimité',
      'Synchronisation Cloud temps réel',
      'Export comptable mensuel',
      'Tableau de bord analytique',
      '2 mois offerts vs mensuel',
      'Support prioritaire 7j/7',
    ],
    disabledFeatures: [],
  },
  {
    id: 'pro',
    icon: <Crown className="w-5 h-5" />,
    label: 'Pro',
    price: '39',
    priceSuffix: '€/mois',
    priceNote: 'Facturé annuellement',
    billing: 'Multi-postes · Équipe',
    badge: null,
    highlight: false,
    features: [
      'Tout du plan Annuel',
      "Jusqu'à 5 postes de caisse",
      'Programme de fidélité client',
      'Statistiques avancées & prédictions',
      'Export expert-comptable PDF/CSV',
      'Support dédié + onboarding',
    ],
    disabledFeatures: [],
  },
];

// ──────────────────────────────────────────────────
// Composant principal
// ──────────────────────────────────────────────────
export function PricingPage() {
  const [hoveredPlan, setHoveredPlan] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">

      {/* ── Hero ──────────────────────────────── */}
      <section className="pt-10 pb-4 px-6 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
          Essayez gratuitement,<br />
          <span className="text-gray-900">payez quand vous êtes prêt</span>
        </h1>
        <p className="text-gray-500 text-base md:text-lg font-medium">
          Heryze est gratuit à essayer pendant 14 jours. Aucune carte bancaire requise.
        </p>

        {/* ── Badges avantages ──────────────── */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-green-200 bg-green-50 text-green-700 text-sm font-semibold shadow-sm">
            <Check className="w-4 h-4" />
            Gratuit à essayer
          </span>
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            Payez quand vous êtes prêt
          </span>
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            Garantie satisfait 14 jours
          </span>
        </div>
      </section>

      {/* ── Bannière Essai Gratuit ─────────── */}
      <section className="max-w-4xl mx-auto px-6 mt-10 mb-2">
        <div className="rounded-2xl border-2 border-green-200 bg-green-50/60 px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-5 h-5 text-green-600" />
              <span className="text-lg font-black text-gray-900">Essai Gratuit</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900">0 €</span>
            </div>
            <p className="text-green-700 font-bold text-sm mt-1">14 jours · Aucune carte requise</p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-gray-600 font-medium">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Toutes les fonctionnalités débloquées</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Mode démo avec données fictives</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Synchronisation Cloud incluse</span>
            <span className="flex items-center gap-2 text-gray-400"><Check className="w-4 h-4 text-gray-300" /> Nécessite un abonnement après 14j</span>
          </div>

          <Link
            to="/register"
            className="shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md shadow-green-500/20 hover:-translate-y-0.5"
          >
            Démarrer l'essai
          </Link>
        </div>
      </section>

      {/* ── 3 cartes plans ────────────────── */}
      <section className="max-w-5xl mx-auto px-6 mt-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`relative rounded-2xl bg-white flex flex-col transition-all duration-200 ${
                plan.highlight
                  ? 'border-2 border-[#0099ff] shadow-xl shadow-blue-500/10 -mt-3'
                  : 'border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
              }`}
            >
              {/* Badge Meilleure Valeur */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-[#0099ff] text-white text-[11px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-md shadow-blue-400/30 whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-7 pt-8 flex-1 flex flex-col">
                {/* En-tête plan */}
                <div className="flex items-center gap-2 text-gray-700 font-semibold mb-5">
                  <span className={plan.highlight ? 'text-[#0099ff]' : 'text-gray-500'}>
                    {plan.icon}
                  </span>
                  <span className="text-base font-bold">{plan.label}</span>
                </div>

                {/* Prix */}
                <div className="mb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 font-medium text-sm">{plan.priceSuffix}</span>
                    {plan.oldPrice && (
                      <span className="text-gray-400 text-sm line-through font-medium">
                        {plan.oldPrice} €
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">{plan.billing}</p>
                  {plan.priceNote && (
                    <p className={`text-sm font-bold mt-0.5 ${plan.highlight ? 'text-[#0099ff]' : 'text-gray-400'}`}>
                      {plan.priceNote}
                    </p>
                  )}
                </div>

                <hr className="my-5 border-gray-100" />

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-medium">{f}</span>
                    </li>
                  ))}
                  {plan.disabledFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm opacity-40">
                      <Check className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <span className="text-gray-400 font-medium">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-7 flex flex-col gap-2">
                  <Link
                    to="/register"
                    className={`w-full text-center font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-all ${
                      plan.highlight
                        ? 'bg-[#0099ff] hover:bg-[#007acc] text-white shadow-md shadow-blue-400/20 hover:-translate-y-0.5'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
                    }`}
                  >
                    Commencer l'essai gratuit
                  </Link>
                  <p className="text-center text-xs text-gray-400">
                    Déjà essayé ?{' '}
                    <Link to="/login" className="text-[#0099ff] hover:underline font-semibold">
                      Activer mon plan
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note bas de page */}
        <p className="text-center text-gray-400 text-sm font-medium mt-12">
          Pas de frais cachés. Pas d'engagement annuel sur le plan mensuel.{' '}
          <span className="font-bold">Vous contrôlez votre abonnement.</span>
        </p>
      </section>
    </div>
  );
}
