import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CalendarDays, Gem, Crown, Loader2, Utensils, AlertCircle } from 'lucide-react';
import { redirectToCheckout } from '../lib/stripe';
import { useAuthStore } from '../store/useAuthStore';

// ──────────────────────────────────────────────────
// Données des Modèles
// ──────────────────────────────────────────────────

const PRICE = {
  starter:  import.meta.env.VITE_STRIPE_PRICE_STARTER  || '',
  business: import.meta.env.VITE_STRIPE_PRICE_BUSINESS || '',
  monthly:  import.meta.env.VITE_STRIPE_PRICE_STARTER  || '',
  pro:      import.meta.env.VITE_STRIPE_PRICE_BUSINESS || '',
};

const HYBRID_PLANS = [
  {
    id: 'hybrid-starter',
    label: 'Starter (Solo)',
    price: '19',
    usage: '1 accès, Inventaire, Exports',
    highlight: false,
    icon: <CalendarDays className="w-5 h-5 text-blue-500" />,
    priceId: PRICE.monthly,
    planType: 'monthly',
  },
  {
    id: 'hybrid-pro',
    label: 'Pro (Multi)',
    price: '39',
    usage: '5 accès, Gestion des stocks, Dashboard',
    highlight: true,
    icon: <Gem className="w-5 h-5 text-blue-600" />,
    priceId: PRICE.pro,
    planType: 'pro',
  }
];

const FLOW_PLANS = [
  {
    id: 'flow-starter',
    label: 'Starter',
    sublabel: 'Indépendant & Artisan',
    price: '19',
    feature: '1 seul point de vente',
    desc: 'Psychologiquement indolore, parfait pour débuter.',
    icon: <CalendarDays className="w-5 h-5" />,
    priceId: PRICE.starter,
    planType: 'starter',
  },
  {
    id: 'flow-business',
    label: 'Business',
    sublabel: 'Boutique & Équipe',
    price: '39',
    feature: 'Multi-postes / Accès simultanés',
    desc: 'Deux fois moins cher que la concurrence.',
    icon: <Gem className="w-5 h-5" />,
    priceId: PRICE.business,
    planType: 'business',
  },
  {
    id: 'flow-expert',
    label: 'Expert',
    sublabel: 'Restauration & Complexité',
    price: '69',
    feature: 'Plan de salle & Imprimante cuisine',
    desc: 'Le sauveur de rentabilité pour les restaurateurs.',
    icon: <Crown className="w-5 h-5" />,
    priceId: PRICE.expert,
    planType: 'expert',
  }
];

const MODULES = [
  {
    id: 'mod-resto',
    label: 'Module Restauration',
    price: '10',
    desc: 'Plan de salle interactif et gestion des tables en temps réel.',
    icon: <Utensils className="w-5 h-5 text-amber-500" />,
  }
];

// ──────────────────────────────────────────────────
// Sous-composant Carte
// ──────────────────────────────────────────────────
function PricingCard({ plan, isAnnual, onSelect, isLoading }) {
  const displayPrice = isAnnual ? Math.floor(plan.price * 10) : plan.price;
  const suffix = isAnnual ? '€/an' : '€/mois';
  const missingPriceId = !plan.priceId;

  return (
    <div className={`relative rounded-2xl bg-white p-7 border transition-all duration-200 ${
      plan.highlight
        ? 'border-2 border-blue-500 shadow-xl -mt-2'
        : 'border-gray-200 shadow-sm hover:shadow-md'
    }`}>
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest leading-none shadow-md">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        {plan.icon}
        <span className="font-bold text-gray-900">{plan.label}</span>
      </div>

      {plan.sublabel && <p className="text-xs text-blue-500 font-bold mb-3 uppercase tracking-wider">{plan.sublabel}</p>}

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-gray-900">{displayPrice}</span>
          <span className="text-gray-500 font-medium text-sm">{suffix}</span>
        </div>
        {isAnnual && (
          <p className="text-green-600 text-xs font-bold mt-1">2 mois offerts inclus</p>
        )}
      </div>

      <hr className="mb-5 border-gray-100" />

      <div className="space-y-3 mb-8">
        {plan.usage && (
          <div className="flex items-start gap-2 text-sm font-medium text-gray-700">
            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <span>{plan.usage}</span>
          </div>
        )}
        {plan.feature && (
          <div className="flex items-start gap-2 text-sm font-bold text-gray-900">
            <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>{plan.feature}</span>
          </div>
        )}
        {plan.desc && <p className="text-xs text-gray-500 leading-relaxed font-medium">{plan.desc}</p>}
      </div>

      {missingPriceId ? (
        <div className="w-full py-2.5 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 flex items-center justify-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          Price ID manquant dans .env
        </div>
      ) : (
        <button
          onClick={() => onSelect(plan.priceId, plan.planType)}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            plan.highlight
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-60'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-60'
          }`}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choisir ce plan'}
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────
// Composant Principal
// ──────────────────────────────────────────────────
export function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [billing, setBilling] = useState('mensuel');
  const [checkingOutPlanId, setCheckingOutPlanId] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const isAnnual = billing === 'annuel';

  const handleSelect = async (priceId, planType) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    setCheckingOutPlanId(planType);
    setCheckoutError(null);
    try {
      await redirectToCheckout(priceId, planType);
    } catch (err) {
      setCheckoutError(err.message);
      setCheckingOutPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans pb-24">
      
      {/* ── Header ──────────────── */}
      <header className="pt-20 pb-12 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black tracking-widest uppercase mb-6 border border-blue-100">
          Laboratoire de Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-6">
          Visualisez nos nouveaux <br /> 
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">concepts stratégiques</span>
        </h1>
        <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">
          Test visuel des grilles tarifaires sans IA. Comparez l'approche "Hybrid" vs. l'approche "Flow" par métier.
        </p>

        {/* ── Toggle ──────────────── */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
            <button 
              onClick={() => setBilling('mensuel')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${billing === 'mensuel' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mensuel
            </button>
            <button 
              onClick={() => setBilling('annuel')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${billing === 'annuel' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Annuel 
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px]">-2 mois</span>
            </button>
          </div>
        </div>
      </header>

      {/* Bandeau erreur checkout */}
      {checkoutError && (
        <div className="max-w-2xl mx-auto px-6 mb-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 space-y-24">

        {/* ── Section 1 : Hybrid ──────────────── */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Grille "Heryze Hybrid"</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          <div className="grid sm:grid-cols-2 lg:max-w-3xl mx-auto gap-8">
            {HYBRID_PLANS.map(plan => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isAnnual={isAnnual}
                onSelect={handleSelect}
                isLoading={checkingOutPlanId === plan.planType}
              />
            ))}
          </div>
        </section>

        {/* ── Section 2 : Modules ──────────────── */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Power Features (Modules)</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          <div className="flex justify-center">
            {MODULES.map(mod => (
              <div key={mod.id} className="w-full max-w-md bg-white rounded-2xl p-6 border border-amber-100 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                  {mod.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{mod.label}</h4>
                  <p className="text-xs text-gray-500 font-medium mb-1">{mod.desc}</p>
                  <p className="text-xs font-bold text-amber-600">+{mod.price}€ / mois</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 transition-colors">
                  Bientôt
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3 : Flow ──────────────── */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Paliers Métier (Heryze Flow)</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {FLOW_PLANS.map(plan => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isAnnual={isAnnual}
                onSelect={handleSelect}
                isLoading={checkingOutPlanId === plan.planType}
              />
            ))}
          </div>
        </section>

      </div>

      {/* ── Note ──────────────── */}
      <footer className="mt-24 text-center">
        <p className="text-gray-400 text-sm font-medium">
          Ce visuel est une simulation commerciale. <br />
          <span className="font-bold">Zéro IA intégrée dans ces tarifs pour le moment.</span>
        </p>
      </footer>

    </div>
  );
}
