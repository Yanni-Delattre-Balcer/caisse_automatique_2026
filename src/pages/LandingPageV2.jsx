import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { 
  Check, Wifi, Smartphone, FileSpreadsheet, 
  ArrowRight, ChevronDown, ChevronUp, Zap, Gem, ShieldCheck 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Assets
import heroMockup from '../assets/nexus/hero-mockup.png';
import offlineStory from '../assets/nexus/offline-story.png';
import scannerStory from '../assets/nexus/scanner-story.png';
import accountingStory from '../assets/nexus/accounting-story.png';

// --- Components ---

/**
 * FadeIn Component - Wrapper for scroll reveal animations
 */
function FadeIn({ children, delay = 0, className = '', y = 20 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const LANDING_PLANS = [
  {
    id: 'starter',
    label: 'Starter (Solo)',
    price: '19',
    usage: '1 accès, Inventaire, Exports',
    highlight: false,
    planType: 'starter',
  },
  {
    id: 'business',
    label: 'Business (Multi)',
    price: '39',
    usage: '5 accès, Gestion des stocks, Dashboard',
    highlight: true,
    badge: 'Populaire',
    planType: 'business',
  },
];

const FAQ = [
  {
    q: "Puis-je encaisser si mon Wi-Fi tombe en panne ?",
    a: "Oui, c'est la raison d'être d'Heryze. Les ventes sont enregistrées localement dans votre navigateur (IndexedDB). Dès que la connexion revient, tout se synchronise automatiquement."
  },
  {
    q: "J'ai une douchette code-barre, est-ce compatible ?",
    a: "Oui, mais Heryze utilise la caméra de votre smartphone comme un scanner sans fil. C'est plus rapide, plus moderne, et ça ne coûte rien."
  },
  {
    q: "Heryze remplace-t-il mon expert-comptable ?",
    a: "Non. Nous générons les exports (FEC, Z-caisse) que votre comptable attend. Cela lui fait gagner du temps et réduit vos honoraires de saisie."
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Absolument. Vos données sont isolées et cryptées. Heryze est conçu pour la conformité NF525 (certification en cours)."
  }
];

export function LandingPageV2() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const handleSelectPlan = (planType) => {
    navigate(`/checkout-summary?plan=${planType}`);
  };

  return (
    <div className="bg-white overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center pt-24 pb-16 px-6 sm:px-12">
        <FadeIn className="text-center max-w-5xl z-10" y={40}>
          <h1 className="text-5xl md:text-[5.5rem] font-black tracking-tight leading-[1.05] text-gray-900 mb-8">
            Encaissez même quand <br className="hidden md:block" />
            le monde s'arrête.
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            Heryze est la caisse SaaS nouvelle génération qui fonctionne sans internet et automatise votre comptabilité.
          </p>
          <div className="flex justify-center gap-6 mb-16">
            <Link
              to="/register"
              className="bg-gray-900 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
            >
              Essai Gratuit
            </Link>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.3} className="w-full max-w-7xl px-4" y={60}>
          <div className="relative rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-gray-100">
            <img 
              src={heroMockup} 
              alt="Heryze Interface Mockup" 
              className="w-full h-auto object-cover"
            />
          </div>
        </FadeIn>
      </section>

      {/* 2. MANIFESTE */}
      <section className="py-40 px-6 bg-gray-50 flex flex-col items-center justify-center text-center">
        <FadeIn className="max-w-4xl">
          <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-sm mb-6 block">Le partenaire de votre croissance</span>
          <h2 className="text-3xl md:text-4xl font-medium text-gray-600 leading-snug">
            Heryze n'est pas qu'un logiciel de caisse. C'est un partenaire qui libère les commerçants des contraintes techniques et comptables, pour qu'ils puissent se concentrer sur l'essentiel : <span className="text-gray-900 font-black">leurs clients.</span>
          </h2>
        </FadeIn>
      </section>

      {/* 3. GREAT STORIES (Bénéfices immersifs) */}
      
      {/* Story 1: Offline */}
      <section id="presentation" className="py-40 px-6 sm:px-12 max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        <FadeIn className="order-2 md:order-1">
          <div className="space-y-6">
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
              Votre comptabilité se fait pendant que vous dormez.
            </h3>
            <p className="text-xl font-bold text-gray-900">Zéro saisie manuelle. Zéro stress.</p>
            <p className="text-lg text-gray-500 font-medium leading-relaxed">
              Dès que la transaction est faite, Heryze prépare l'export FEC pour votre comptable. Plus besoin de passer vos dimanches sur Excel.
            </p>
            <Link to="/register" className="inline-flex items-center text-[#0066cc] font-bold text-lg hover:gap-2 transition-all">
              En savoir plus <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </FadeIn>
        <FadeIn className="order-1 md:order-2" delay={0.2} y={40}>
          <img src={offlineStory} alt="Offline Story" className="rounded-3xl shadow-2xl" />
        </FadeIn>
      </section>

      {/* Story 2: Scanner (Alterné) */}
      <section className="py-40 px-6 sm:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <FadeIn delay={0.2} y={40}>
            <img src={scannerStory} alt="Scanner Story" className="rounded-3xl shadow-2xl" />
          </FadeIn>
          <FadeIn>
            <div className="space-y-6">
              <h3 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                Transformez votre smartphone en douchette laser.
              </h3>
              <p className="text-xl font-bold text-gray-900">Fini les câbles et les installations coûteuses.</p>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Heryze utilise la puissance de votre smartphone pour scanner vos produits instantanément. Économisez 200€ de matériel dès le premier jour.
              </p>
              <Link to="/register" className="inline-flex items-center text-[#0066cc] font-bold text-lg hover:gap-2 transition-all">
                Démarrer maintenant <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Story 3: Accounting */}
      <section id="why" className="py-40 px-6 sm:px-12 max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        <FadeIn>
          <div className="space-y-6">
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
              Encaissez sans Wi-Fi. Sans compromis.
            </h3>
            <p className="text-xl font-bold text-gray-900">Offline-first par design.</p>
            <p className="text-lg text-gray-500 font-medium leading-relaxed">
              Une coupure réseau ? Heryze continue de fonctionner. Vos ventes sont sauvegardées et se synchronisent automatiquement dès le retour de la connexion.
            </p>
            <Link to="/register" className="inline-flex items-center text-[#0066cc] font-bold text-lg hover:gap-2 transition-all">
              Découvrir la techno <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </FadeIn>
        <FadeIn delay={0.2} y={40}>
          <img src={accountingStory} alt="Accounting Story" className="rounded-3xl shadow-2xl" />
        </FadeIn>
      </section>

      {/* 4. L'EFFET 3-EN-1 */}
      <section className="py-40 px-6 bg-gray-900 text-white text-center">
        <FadeIn className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-12">Heryze est votre...</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold">Caisse</h4>
              <p className="text-gray-400 font-medium">Ultra-rapide, même offline.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold">Scanner</h4>
              <p className="text-gray-400 font-medium">Zéro matériel à acheter.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold">Comptable</h4>
              <p className="text-gray-400 font-medium">Exports automatiques.</p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* 5. PRICING (Investissement) */}
      <section className="py-40 px-6 max-w-5xl mx-auto">
        <FadeIn className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Le choix intelligent.</h2>
          <p className="text-xl text-gray-500 font-medium">Deux plans, un seul but : libérer votre potentiel.</p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-12">
          {LANDING_PLANS.map((plan) => (
            <FadeIn key={plan.id} className={`rounded-[2.5rem] p-12 border ${plan.highlight ? 'border-[#0066cc] bg-white ' : 'border-gray-100 bg-gray-50'} relative transition-all hover:scale-[1.02] duration-500`}>
              {plan.badge && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0066cc] text-white text-xs font-black tracking-widest uppercase px-6 py-2 rounded-full shadow-lg">
                  {plan.badge}
                </span>
              )}
              <div className="space-y-8">
                <div>
                  <h4 className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-2">{plan.label}</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter text-gray-900">{plan.price}€</span>
                    <span className="text-gray-400 font-bold">/mois</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 font-medium text-gray-700">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>{plan.usage}</span>
                  </div>
                  <div className="flex items-center gap-3 font-medium text-gray-700">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Hébergement Cloud inclus</span>
                  </div>
                  <div className="flex items-center gap-3 font-medium text-gray-700">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Mises à jour à vie</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleSelectPlan(plan.planType)}
                  className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${plan.highlight ? 'bg-[#0066cc] text-white hover:bg-[#0055aa]' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
                >
                  Choisir ce plan
                </button>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="py-40 px-6 sm:px-12 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-20 font-black">
            <h2 className="text-4xl md:text-5xl tracking-tight">Questions. Réponses.</h2>
          </FadeIn>
          
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="border border-gray-100 rounded-3xl bg-gray-50 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-8 py-6 text-left font-bold text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg">{item.q}</span>
                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-8 pb-8 text-gray-500 font-medium leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4} className="mt-16">
            <div className="bg-[#fff9e6] border border-[#ffecb3] p-8 rounded-3xl text-[#856404] font-medium leading-relaxed">
              <ShieldCheck className="w-6 h-6 inline mr-3 mb-1" />
              <strong>Mention légale :</strong> Heryze est conçu pour la conformité NF525. Les exports FEC sont générés à titre indicatif. Consultez votre expert-comptable pour la validation de vos liasses fiscales.
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 7. CTA FINAL (Puissant) */}
      <section className="py-60 px-6 bg-[#0066cc] text-center text-white relative">
        <div className="absolute inset-0 bg-linear-to-b from-[#0066cc] to-[#004488]" />
        <FadeIn className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
            Prêt pour le futur <br /> du commerce ?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 font-medium mb-16 max-w-2xl mx-auto">
            Rejoignez les commerçants qui ont choisi la tranquillité d'esprit. 14 jours d'essai offerts, sans engagement.
          </p>
          <Link
            to="/register"
            className="bg-white text-[#0066cc] px-12 py-5 rounded-full font-black text-xl hover:scale-105 transition-all shadow-2xl inline-block"
          >
            Commencer maintenant
          </Link>
        </FadeIn>
      </section>

    </div>
  );
}
