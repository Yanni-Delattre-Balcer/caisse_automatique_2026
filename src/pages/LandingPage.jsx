import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Smartphone, Zap, Cloud, Check, ShieldCheck, CalendarDays, Gem, Crown,
  Wifi, FileSpreadsheet, Clock, ArrowRight, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ContactForm } from '../components/ContactForm';

// ── Utilitaire d'animation scroll ────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Plans tarifaires ──────────────────────────────────────────────────────────
const PLANS_MENSUEL = [
  {
    id: 'solo',
    icon: <Zap className="w-5 h-5" />,
    label: 'Solo',
    sublabel: 'Pour démarrer',
    price: '0',
    priceSuffix: 'gratuit pour toujours',
    billing: 'Aucune carte requise',
    badge: null,
    highlight: false,
    cta: 'Démarrer gratuitement',
    ctaLink: '/register',
    features: [
      '1 utilisateur, 1 commerce',
      "Jusqu'à 50 produits au catalogue",
      "Jusqu'à 100 transactions/mois",
      'Caisse offline-first',
      'Scanner smartphone (WebRTC)',
      'Ticket numérique QR Code',
      'Export CSV basique',
    ],
    disabledFeatures: [
      'Z-caisse PDF',
      'Dashboard analytiques',
      'Alertes stock',
      'Import CSV catalogue',
      'Support prioritaire',
    ],
  },
  {
    id: 'pro',
    icon: <Gem className="w-5 h-5" />,
    label: 'Pro',
    sublabel: 'Boulangeries, salons, épiceries',
    price: '19',
    priceSuffix: '€/mois',
    billing: 'Facturé mensuellement',
    badge: 'LE PLUS POPULAIRE',
    highlight: true,
    cta: 'Démarrer gratuitement',
    ctaLink: '/register',
    features: [
      'Produits & transactions illimités',
      'Z-caisse PDF quotidien',
      'Dashboard analytiques complet',
      'Alertes stock bas configurables',
      'Import catalogue CSV',
      'Tickets avec logo du commerce',
      'Historique ventes 12 mois',
      '2 terminaux inclus',
      'Support email (réponse sous 48h)',
    ],
    disabledFeatures: [],
  },
  {
    id: 'business',
    icon: <Crown className="w-5 h-5" />,
    label: 'Business',
    sublabel: 'Restaurants, multi-postes',
    price: '39',
    priceSuffix: '€/mois',
    billing: 'Facturé mensuellement',
    badge: null,
    highlight: false,
    cta: 'Démarrer gratuitement',
    ctaLink: '/register',
    features: [
      'Terminaux illimités',
      'Gestion des tables (Restauration)',
      'Multi-utilisateurs avec rôles',
      'Export comptable normé (FEC)',
      'Programme de fidélité client',
      'Statistiques avancées & prédictions',
      'Support chat prioritaire (sous 24h)',
      'White-label tickets (votre marque)',
    ],
    disabledFeatures: [],
  },
];

const PLANS_ANNUEL = [
  { ...PLANS_MENSUEL[0] },
  {
    ...PLANS_MENSUEL[1],
    price: '159',
    priceSuffix: '€/an',
    priceNote: 'soit 13,25 €/mois — 2 mois offerts',
    oldPrice: '228',
    billing: 'Facturé annuellement',
    badge: 'MEILLEURE VALEUR',
  },
  {
    ...PLANS_MENSUEL[2],
    price: '319',
    priceSuffix: '€/an',
    priceNote: 'soit 26,58 €/mois — 2 mois offerts',
    oldPrice: '468',
    billing: 'Facturé annuellement',
  },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Puis-je encaisser si mon Wi-Fi tombe en panne ?",
    a: "Oui, c'est la raison d'être d'Heryze. Les ventes sont enregistrées localement dans votre navigateur (IndexedDB). Dès que la connexion revient, tout se synchronise automatiquement dans le Cloud, sans que vous fassiez quoi que ce soit."
  },
  {
    q: "J'ai une douchette code-barre, est-ce compatible ?",
    a: "Oui, les douchettes USB et Bluetooth fonctionnent comme un clavier. Mais avec Heryze, vous n'en avez plus besoin — la caméra de votre smartphone fait exactement le même travail, sans câble et sans achat. Économie directe : 100–200 €."
  },
  {
    q: "Heryze remplace-t-il mon expert-comptable ?",
    a: "Non, et nous ne le promettons jamais. Heryze génère les exports que votre comptable attend (FEC, résumé TVA, Z-caisse). C'est lui qui mâche le travail à votre place — votre comptable gagne du temps, vous aussi."
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Vos données sont isolées par Row Level Security (RLS) côté Supabase — aucun autre commerçant ne peut voir les vôtres. Heryze est conçu pour la conformité NF525 : chaque vente est chaînée cryptographiquement, la certification formelle est en cours."
  },
  {
    q: "Que se passe-t-il si je dépasse 100 transactions avec le plan Solo ?",
    a: "Vous pouvez continuer à utiliser la caisse, mais les nouvelles ventes ne s'ajouteront plus à votre historique mensuel. Aucune interruption de service — mais vous recevrez une invitation à passer au plan Pro."
  },
  {
    q: "Puis-je exporter mes données si je pars ?",
    a: "Toujours. L'export de toutes vos ventes et de votre catalogue est disponible à tout moment, en un clic. Vous ne serez jamais 'piégé' — c'est une promesse."
  },
];

// ── Page principale ───────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('mensuel');
  const [openFaq, setOpenFaq] = useState(null);
  const plans = billing === 'annuel' ? PLANS_ANNUEL : PLANS_MENSUEL;

  const handleDemo = () => {
    useAuthStore.getState().loginAsDemo();
    navigate('/pos/quick');
  };

  return (
    <div className="relative w-full overflow-x-hidden bg-[#f8f9fa] font-sans text-gray-900">

      {/* Décor fond */}
      <div className="absolute top-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-8%] left-[15%] w-[55%] h-[45%] bg-linear-to-br from-[#00f2ff]/15 to-[#0055ff]/8 rounded-full blur-[130px]" />
        <div className="absolute top-[25%] right-[-8%] w-[38%] h-[38%] bg-linear-to-br from-blue-200/15 to-indigo-200/15 rounded-full blur-[120px]" />
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-6 pb-16 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          className="flex flex-col items-center max-w-6xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black tracking-[0.2em] uppercase mb-8 shadow-sm border border-blue-100/50">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            CONÇU POUR LA CONFORMITÉ NF525
          </div>

          {/* Titre */}
          <h1 className="text-4xl sm:text-6xl lg:text-[5.5rem] font-black tracking-[-0.04em] mb-10 leading-[1.1] text-gray-900">
            <span className="block md:whitespace-nowrap">Encaissez sans internet.</span>
            <span className="bg-linear-to-br from-[#00f2ff] to-[#0055ff] bg-clip-text text-transparent block md:whitespace-nowrap">
              Votre comptable dit merci.
            </span>
          </h1>

          {/* Sous-titre — phrase de positionnement principale */}
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mt-3 font-medium leading-relaxed">
            Heryze est le seul logiciel qui encaisse vos clients <strong className="text-gray-700">sans internet</strong>, et envoie la comptabilité à votre expert-comptable <strong className="text-gray-700">sans que vous touchiez à rien</strong>.
          </p>

          {/* Reformulations-clés */}
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-semibold shadow-sm">
              <Smartphone className="w-4 h-4 text-blue-500" />
              Zéro douchette à acheter
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-semibold shadow-sm">
              <Wifi className="w-4 h-4 text-purple-500" />
              Offline-first garanti
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-semibold shadow-sm">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Export FEC pour votre comptable
            </span>
          </div>

          {/* CTAs */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/register"
              className="bg-[#0055ff] text-white px-8 py-4 rounded-full font-bold tracking-wider uppercase text-sm shadow-xl shadow-blue-500/30 hover:bg-[#0044cc] hover:-translate-y-1 transition-all text-center"
            >
              Démarrer gratuitement
            </Link>
            <a
              href="#pricing"
              className="text-gray-400 px-4 py-4 rounded-full font-bold tracking-wider uppercase text-xs hover:text-gray-600 transition-all text-center"
            >
              Voir les tarifs
            </a>
          </div>

          {/* Social proof micro */}
          <p className="mt-8 text-xs text-gray-400 font-medium tracking-wide">
            Gratuit pour toujours jusqu'à 100 transactions/mois · Aucune carte requise
          </p>
        </motion.div>
      </section>

      {/* ── 3 PILLIERS ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white border-y border-gray-100 relative z-20">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-500 text-xs font-bold tracking-widest uppercase mb-5">
              L'intersection que personne d'autre n'occupe
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Trois forces. Un seul outil.
            </h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto font-medium">
              Ni Pennylane ni Merlin ne font les trois simultanément.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Wifi className="w-8 h-8 text-purple-600" />,
                title: 'Caisse Offline-First',
                desc: "Votre box tombe en panne ? Votre 4G lâche en plein service ? Heryze encaisse quand même. Les ventes s'empilent localement et se synchronisent dès que le réseau revient — automatiquement, sans rien faire.",
                color: 'from-purple-50 to-pink-50',
                border: 'border-purple-100',
                tag: 'Avantage vs Merlin / Lightspeed',
              },
              {
                icon: <Smartphone className="w-8 h-8 text-blue-600" />,
                title: 'Scanner Zéro Achat',
                desc: "L'appareil photo de n'importe quel smartphone devient un scanner de code-barre sans fil via WebRTC. Une douchette coûte 100–200 €. Avec Heryze, vous économisez ça dès le premier mois — et vous n'avez rien à brancher.",
                color: 'from-blue-50 to-cyan-50',
                border: 'border-blue-100',
                tag: 'Avantage matériel direct',
              },
              {
                icon: <FileSpreadsheet className="w-8 h-8 text-emerald-600" />,
                title: 'Compta Sans Effort',
                desc: "Heryze calcule votre TVA, génère votre Z-caisse, et prépare l'export FEC que votre expert-comptable peut importer directement dans son logiciel. Vous ne touchez à rien — lui non plus presque.",
                color: 'from-emerald-50 to-teal-50',
                border: 'border-emerald-100',
                tag: 'Avantage vs Pennylane / Excel',
              },
            ].map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.12}>
                <div className={`rounded-3xl p-8 bg-linear-to-br ${c.color} border ${c.border} h-full shadow-sm hover:shadow-md transition-shadow flex flex-col`}>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-5 shadow-sm border border-black/5">{c.icon}</div>
                  <h3 className="font-bold text-gray-900 text-xl mb-3 tracking-tight">{c.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm font-medium flex-1">{c.desc}</p>
                  <span className="mt-5 inline-block text-xs font-bold tracking-wider uppercase text-gray-400">{c.tag}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARATIF CONCURRENTS ────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#f8f9fa] relative z-20">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold tracking-widest uppercase mb-5">
              Comparatif honnête
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Pourquoi pas les autres ?
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                rival: 'Merlin / Lightspeed',
                color: 'border-orange-200 bg-orange-50/50',
                tagColor: 'text-orange-500 bg-orange-100',
                weakness: 'Cher (60 €+), interface datée, pas d\'offline',
                heryze: 'Mêmes fonctionnalités, deux fois moins cher, et ça marche quand votre box tombe en panne.',
              },
              {
                rival: 'Pennylane / QuickBooks',
                color: 'border-blue-200 bg-blue-50/50',
                tagColor: 'text-blue-500 bg-blue-100',
                weakness: 'Pensé par des comptables pour des comptables — pas pour la caisse physique',
                heryze: 'Pennylane vous donne une belle comptabilité. Mais il ne sait pas que vous avez vendu 47 croissants ce matin. Heryze si.',
              },
              {
                rival: 'Shine / Qonto',
                color: 'border-green-200 bg-green-50/50',
                tagColor: 'text-green-600 bg-green-100',
                weakness: 'Banque pro avec exports — pas de caisse physique',
                heryze: 'Votre banque vous donne vos relevés. Heryze vous donne votre comptabilité. Ce n\'est pas la même chose — demandez à votre comptable.',
              },
              {
                rival: 'Excel',
                color: 'border-gray-200 bg-gray-50/50',
                tagColor: 'text-gray-500 bg-gray-200',
                weakness: 'Saisie manuelle, formules cassables, 1 à 3h par mois',
                heryze: '19 €/mois, c\'est moins que 15 minutes de votre temps à la fin du mois pour refaire vos calculs à la main.',
              },
            ].map((c, i) => (
              <FadeIn key={c.rival} delay={i * 0.1}>
                <div className={`rounded-2xl border p-6 ${c.color}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${c.tagColor}`}>
                      vs {c.rival}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-3 italic">
                    "{c.weakness}"
                  </p>
                  <div className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-[#0055ff] shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-800 font-semibold leading-snug">{c.heryze}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white border-y border-gray-100 relative z-20">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-green-50 text-green-600 text-xs font-bold tracking-widest uppercase mb-5">
              Mise en route
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Prêt en 3 minutes.
            </h2>
            <p className="mt-4 text-gray-500 text-lg font-medium">
              Pas d'installation. Pas de technicien. Pas de matériel.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Créez votre compte',
                desc: 'Inscrivez-vous en 30 secondes. Choisissez votre domaine métier (Boulangerie, Restaurant, Épicerie...). Heryze se configure automatiquement.',
                icon: <Star className="w-6 h-6 text-blue-500" />,
              },
              {
                step: '02',
                title: 'Ajoutez vos produits',
                desc: "Saisissez-les un par un ou importez votre catalogue CSV en un clic. Les prix TTC sont calculés automatiquement depuis le HT et la TVA.",
                icon: <Cloud className="w-6 h-6 text-purple-500" />,
              },
              {
                step: '03',
                title: 'Encaissez, dormez',
                desc: "Vendez en ligne ou hors ligne. En fin de journée, votre Z-caisse est prêt. En fin de mois, l'export pour votre comptable est généré en 2 clics.",
                icon: <Clock className="w-6 h-6 text-emerald-500" />,
              },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.15}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 shadow-sm">
                    {s.icon}
                  </div>
                  <span className="text-xs font-black text-gray-300 tracking-widest mb-2">{s.step}</span>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 tracking-tight">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION PRICING ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-[#f8f9fa] relative z-20">
        <div className="max-w-5xl mx-auto">

          <FadeIn className="text-center mb-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-5">
              Tarification
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Commencez gratuit.
              <br />
              <span className="text-gray-400">Grandissez à votre rythme.</span>
            </h2>
            <p className="mt-4 text-gray-500 text-lg font-medium max-w-xl mx-auto">
              Un plan gratuit permanent — pas un essai. Vous montez en plan quand <em>vous</em> en avez besoin.
            </p>
          </FadeIn>

          {/* Toggle mensuel / annuel */}
          <FadeIn delay={0.1} className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-gray-200 shadow-sm">
              <button
                onClick={() => setBilling('mensuel')}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  billing === 'mensuel'
                    ? 'bg-[#0055ff] text-white shadow'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBilling('annuel')}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                  billing === 'annuel'
                    ? 'bg-[#0055ff] text-white shadow'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Annuel
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  billing === 'annuel' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                }`}>
                  −2 mois
                </span>
              </button>
            </div>
          </FadeIn>

          {/* Cartes plans */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => (
              <FadeIn key={plan.id + billing} delay={i * 0.1}>
                <div
                  className={`relative rounded-2xl bg-white flex flex-col transition-all duration-200 ${
                    plan.highlight
                      ? 'border-2 border-[#0099ff] shadow-xl shadow-blue-500/10 -mt-3'
                      : 'border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-[#0099ff] text-white text-[11px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-7 pt-8 flex-1 flex flex-col">
                    {/* En-tête */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={plan.highlight ? 'text-[#0099ff]' : 'text-gray-500'}>
                        {plan.icon}
                      </span>
                      <span className="text-base font-bold text-gray-900">{plan.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mb-4">{plan.sublabel}</p>

                    {/* Prix */}
                    <div className="mb-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
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
                      <p className="text-gray-400 text-sm mt-0.5">{plan.billing}</p>
                      {plan.priceNote && (
                        <p className={`text-sm font-bold mt-0.5 ${plan.highlight ? 'text-[#0099ff]' : 'text-gray-400'}`}>
                          {plan.priceNote}
                        </p>
                      )}
                    </div>

                    <hr className="my-5 border-gray-100" />

                    {/* Features actives */}
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm">
                          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-gray-700 font-medium">{f}</span>
                        </li>
                      ))}
                      {plan.disabledFeatures && plan.disabledFeatures.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm opacity-35">
                          <Check className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                          <span className="text-gray-400 font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="mt-7 flex flex-col gap-2">
                      <Link
                        to={plan.ctaLink}
                        className={`w-full text-center font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-all ${
                          plan.highlight
                            ? 'bg-[#0099ff] hover:bg-[#007acc] text-white shadow-md hover:-translate-y-0.5'
                            : plan.id === 'solo'
                            ? 'bg-gray-900 hover:bg-black text-white shadow-sm hover:-translate-y-0.5'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {plan.cta}
                      </Link>
                      <p className="text-center text-xs text-gray-400">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="text-[#0099ff] hover:underline font-semibold">
                          Se connecter
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Reformulations-prix */}
          <FadeIn delay={0.2} className="mt-14 grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                quote: "19 €/mois, c'est moins que 15 minutes de vos calculs en fin de mois.",
                sub: 'vs. votre temps',
              },
              {
                quote: "Une douchette coûte 150 €. Avec Heryze, vous économisez ça dès le premier mois.",
                sub: 'vs. le matériel',
              },
              {
                quote: "Une heure chez votre expert-comptable coûte 80–120 €. Heryze lui mâche le travail.",
                sub: 'vs. votre comptable',
              },
            ].map((r) => (
              <div key={r.sub} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-sm text-gray-700 font-semibold leading-snug italic mb-2">"{r.quote}"</p>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{r.sub}</span>
              </div>
            ))}
          </FadeIn>

          <p className="text-center text-gray-400 text-sm font-medium mt-8">
            Pas de frais cachés. Export de vos données disponible à tout moment.{' '}
            <span className="font-bold text-gray-500">Vous ne serez jamais bloqué.</span>
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white border-t border-gray-100 relative z-20">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold tracking-widest uppercase mb-5">
              Questions fréquentes
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Ce que les commerçants nous demandent.
            </h2>
          </FadeIn>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm md:text-base">{item.q}</span>
                    {openFaq === i
                      ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    }
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-100 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Mention légale TVA — conformité document stratégique */}
          <FadeIn delay={0.2} className="mt-10">
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-800 font-medium leading-relaxed">
              <ShieldCheck className="w-4 h-4 inline mr-2 text-amber-600" />
              <strong>Mention légale :</strong> Les montants de TVA et les exports générés par Heryze sont calculés à titre indicatif à partir de vos ventes enregistrées. Ils ne constituent pas un conseil fiscal. Vérifiez toujours avec votre expert-comptable avant de déposer votre déclaration. Heryze est conçu pour la conformité NF525 — la certification formelle est en cours.
            </div>
          </FadeIn>
        </div>
      </section>
      {/* ── CONTACT SECTION ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white shrink-0" id="contact">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                Une question ? Nous sommes là.
              </h2>
              <p className="mt-4 text-lg text-gray-500 font-medium">
                Notre équipe vous répond sous 24h à 48h. Laissez-nous un message.
              </p>
            </div>
            <ContactForm />
          </FadeIn>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-linear-to-br from-[#0055ff] to-[#00c4ff] relative overflow-hidden z-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-5 leading-tight">
              <span className="md:whitespace-nowrap">Votre prochaine journée sans panne,</span>
              <br className="hidden md:block" />
              commence maintenant.
            </h2>
            <p className="text-blue-100 text-lg font-medium mb-10 max-w-xl mx-auto">
              Rejoignez les commerçants qui encaissent sans stresser — même quand internet lâche.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-[#0055ff] px-9 py-4 rounded-full font-black tracking-wider uppercase text-sm shadow-2xl hover:-translate-y-1 transition-all text-center"
              >
                Démarrer gratuitement
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}