import React, { useRef, useState } from 'react';
import { Button, Card } from '@heroui/react';
import { Smartphone, Zap, Cloud, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';

function FadeIn({ children, delay = 0, className = '' }) {
    const navigate = useNavigate();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function LandingPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSubscribe = async (plan) => {
    const priceId = plan === 'monthly'
      ? import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID
      : import.meta.env.VITE_STRIPE_LIFETIME_PRICE_ID;

    if (!priceId || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      addToast({ type: 'info', message: 'Paiement Stripe non configuré. Voir docs/STRIPE_SETUP.md' });
      return;
    }

    setLoadingPlan(plan);
    try {
      const { redirectToCheckout } = await import('../lib/stripe');
      await redirectToCheckout(priceId);
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Erreur de paiement.' });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="relative w-full overflow-x-hidden bg-[#f8f9fa] font-sans text-gray-900">
      
      {/* Background Decor */}
      <div className="absolute top-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] bg-linear-to-br from-[#00f2ff]/20 to-[#0055ff]/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-linear-to-br from-blue-300/20 to-indigo-300/20 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pb-20 pt-10">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="flex flex-col items-center"
        >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-[pulse_2s_infinite]" />
              Nouvelle Génération API
            </div>
            
            <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-black tracking-tight mb-6 leading-[1.05] max-w-5xl text-gray-900">
              La caisse enregistreuse <br className="hidden md:block"/>
              <span className="bg-linear-to-br from-[#00f2ff] to-[#0055ff] bg-clip-text text-transparent">
                sans compromis.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mt-5 font-medium leading-relaxed">
              Transformez votre smartphone en douchette ultra-rapide. Gagnez du temps, réduisez le matériel, et protégez vos encaissements dans le Cloud.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to="/register" className="bg-[#0055ff] text-white px-8 py-4 rounded-full font-bold tracking-wider uppercase text-sm shadow-xl shadow-blue-500/30 hover:bg-[#0044cc] hover:-translate-y-1 transition-all text-center">
                  Démarrer gratuitement
              </Link>
              <a href="#pricing" className="text-gray-400 px-4 py-4 rounded-full font-bold tracking-wider uppercase text-xs hover:text-gray-600 transition-all text-center">
                  Voir nos tarifs
              </a>
            </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white relative z-20 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-500 text-xs font-bold tracking-widest uppercase mb-6">Pourquoi Heryze ?</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Oubliez les installations complexes.</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto font-medium">Une plateforme unique, sans matériel propriétaire hors de prix.</p>
          </FadeIn>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
                {
                    icon: <Smartphone className="w-8 h-8 text-blue-600" />,
                    title: 'Douchette Magique',
                    desc: "L'appareil photo de votre smartphone devient un scanner laser sans fil via WebRTC. Plus besoin d'acheter une douchette à 150€.",
                    color: 'from-blue-50 to-cyan-50',
                    border: 'border-blue-100',
                },
                {
                    icon: <Zap className="w-8 h-8 text-purple-600" />,
                    title: 'SaaS Offline-First',
                    desc: "Coupure Wi-Fi ? Aucun problème. Encaissez vos clients en cache local de manière transparente. Le système se synchronise à la reconnexion.",
                    color: 'from-purple-50 to-pink-50',
                    border: 'border-purple-100',
                },
                {
                    icon: <Cloud className="w-8 h-8 text-emerald-600" />,
                    title: 'Compta Zéro Effort',
                    desc: "Toutes vos données sécurisées dans le cloud. En fin de mois, générez vos rapports de vente et exports comptables en un seul clic.",
                    color: 'from-emerald-50 to-teal-50',
                    border: 'border-emerald-100',
                },
            ].map((c, i) => (
                <FadeIn key={c.title} delay={i * 0.15}>
                    <div className={`rounded-3xl p-8 bg-linear-to-br ${c.color} border ${c.border} h-full shadow-sm hover:shadow-md transition-shadow`}>
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm border border-black/5">{c.icon}</div>
                        <h3 className="font-bold text-gray-900 text-xl mb-3 tracking-tight">{c.title}</h3>
                        <p className="text-gray-600 leading-relaxed text-sm font-medium">{c.desc}</p>
                    </div>
                </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-linear-to-b from-[#f8f9fa] to-white relative z-20">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-6">Tarification simple</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Des tarifs transparents</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto font-medium">Choisissez la flexibilité de l'abonnement ou la tranquillité de l'achat à vie.</p>
          </FadeIn>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* SaaS Plan */}
            <FadeIn delay={0.1}>
                <div className="bg-white rounded-4xl border-2 border-[#0055ff] shadow-2xl shadow-blue-500/10 relative overflow-hidden h-full flex flex-col translate-y-[-10px]">
                  <div className="absolute top-0 right-0 p-6">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#0055ff] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                      Idéal TPE
                    </div>
                  </div>
                  <div className="p-10 pb-6 flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">Abonnement Zen</h3>
                    <div className="flex items-baseline gap-2 mt-4 mb-6">
                      <span className="text-6xl font-black tracking-tighter text-[#0055ff]">29€</span>
                      <span className="text-gray-500 font-medium tracking-wide">HT / mois</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed h-12">La liberté totale sans engagement, avec toutes les mises à jour majeures.</p>
                    
                    <ul className="space-y-4 mt-8">
                      {[
                        "Scanner WebRTC illimité",
                        "Synchronisation Cloud temps réel",
                        "Export Comptable simplifié",
                        "Outils analytiques complets",
                        "Support Prioritaire 7j/7"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <div className="shrink-0 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center mt-0.5 border border-blue-100">
                            <CheckCircle2 className="w-4 h-4 text-[#0055ff]" />
                          </div>
                          <span className="text-gray-700 font-medium text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-10 pt-0 mt-auto">
                    <Button
                      onPress={() => handleSubscribe('monthly')}
                      isLoading={loadingPlan === 'monthly'}
                      className="w-full font-bold rounded-xl bg-[#0055ff] text-white shadow-xl shadow-blue-500/20 py-6 text-sm uppercase tracking-wider hover:bg-[#0044cc]"
                      size="lg"
                    >
                      Démarrer l'essai 14 Jours
                    </Button>
                  </div>
                </div>
            </FadeIn>

            {/* Lifetime Plan */}
            <FadeIn delay={0.2}>
                <div className="bg-gray-50 rounded-4xl border border-gray-200 relative overflow-hidden h-full flex flex-col hover:border-gray-300 transition-colors">
                  <div className="p-10 pb-6 flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">Licence Perpétuelle</h3>
                    <div className="flex items-baseline gap-2 mt-4 mb-6">
                      <span className="text-6xl font-black tracking-tighter text-gray-800">499€</span>
                      <span className="text-gray-500 font-medium tracking-wide">HT unique</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed h-12">Acquisition fixe en une passe <span className="text-gray-400">(+10€/mois pour l'hébergement cloud optionnel)</span>.</p>
                    
                    <ul className="space-y-4 mt-8 opacity-80">
                      {[
                        "Logiciel acquis à vie",
                        "Scanner WebRTC illimité",
                        "Stockage local (Offline garanti)",
                        "Export Comptable classique",
                        "Support Standard Email"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-gray-600 font-medium text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-10 pt-0 mt-auto">
                    <Button
                      onPress={() => handleSubscribe('lifetime')}
                      isLoading={loadingPlan === 'lifetime'}
                      className="w-full font-bold rounded-xl py-6 text-sm uppercase tracking-wider bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm"
                      size="lg"
                    >
                      Demander un devis
                    </Button>
                  </div>
                </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}
