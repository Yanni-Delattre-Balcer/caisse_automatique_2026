import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Smartphone, Zap, FileSpreadsheet, Wifi, Star, Cloud } from 'lucide-react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

// Assets
import nexusHero from '../assets/nexus/nexus-hero.png';
import synapseoVisual from '../assets/nexus/synapseo-visual.png';
import synapseoWide from '../assets/nexus/synapseo-wide.png';
import synapseoDashboard from '../assets/nexus/synapseo-dashboard.png';
import heryzeWide from '../assets/nexus/heryze-wide.png';
import heryzePos from '../assets/nexus/heryze-pos.png';
import heryzeMockup from '../assets/nexus/hero-mockup.png';

// --- Components ---

function FadeIn({ children, delay = 0, className = '', y = 24 }) {
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

/**
 * AtmosphericBackground - Animated liquid background using CSS and Framer
 */
function AtmosphericBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10 bg-white">
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[120px]"
      />
      <motion.div 
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, 60, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50/50 rounded-full blur-[100px]"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-tr from-blue-50/20 to-transparent rounded-full blur-[150px]" />
    </div>
  );
}


/**
 * ProductHero - Monumental centered introduction for a product
 */
function ProductHero({ title, subtitle, image, id, bgColor = "bg-white" }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  return (
    <section id={id} className={`flex flex-col items-center pt-8 pb-32 overflow-hidden ${bgColor} relative`}>
      <AtmosphericBackground />
      
      {/* Text Content (Top) */}
      <div className="max-w-4xl px-6 mb-12 flex flex-col items-center text-center z-10">
        <FadeIn className="space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 leading-tight text-balance font-inter">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-gray-400 font-medium max-w-xl mx-auto">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-3 items-center">
            {/* Bouton En savoir plus: Pilule bleue compacte */}
            <button className="bg-[#0071e3] text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-[#0077ed] transition-all">
              En savoir plus
            </button>
            
            {/* Bouton Connexion / Lancer : Taille alignée sur 'En savoir plus' et halo extérieur pur */}
            <div className="relative group">
              {/* Le halo (Aura Nexus) - Émanation strictement extérieure */}
              <div className="absolute -inset-1 bg-blue-500/40 rounded-full blur-md opacity-20 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <motion.button 
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/pos');
                  } else {
                    navigate('/login?redirect=/nexus-prop');
                  }
                }}
                className="relative px-5 py-2 rounded-full font-semibold text-sm border border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center min-w-[140px] z-10"
              >
                {isAuthenticated ? 'Lancer Heryze' : 'Connexion'}
              </motion.button>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Immersive Panoramic Image (Bottom) - Smaller and airy */}
      <FadeIn delay={0.2} y={30} className="w-full flex justify-center px-6 md:px-12 lg:px-24">
        <div className="w-full h-auto flex justify-center">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-auto object-contain rounded-2xl md:rounded-3xl shadow-2xl" 
          />
        </div>
      </FadeIn>

    </section>
  );
}

const PRICING_PLANS = [
  {
    id: 'starter',
    label: 'Starter',
    price: '19',
    usage: 'Idéal pour les indépendants',
    highlight: false,
    planType: 'starter',
  },
  {
    id: 'business',
    label: 'Business',
    price: '39',
    usage: 'La puissance de l\'écosystème Nexus',
    highlight: true,
    badge: 'Populaire',
    planType: 'business',
  },
];

export function NexusPropPage() {
  const navigate = useNavigate();

  const handleSelectPlan = (planType) => {
    navigate(`/checkout-summary?plan=${planType}`);
  };

  return (
    <div className="bg-white overflow-hidden selection:bg-blue-500/20">
      

      {/* 4. HERYZE HERO (MIRROR OF SYNAPSEO) */}
      <ProductHero 
        id="heryze"
        title="Heryze"
        subtitle="Encaissez. Synchronisez. Respirez."
        image={heryzePos}
      />

      {/* 5. HERYZE DETAILS (EXISTING) */}
      <section className="py-32 px-6 sm:px-12 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <FadeIn delay={0.2} className="order-2 md:order-1">
            <img src={heryzeMockup} alt="Heryze Mockup" className="w-full h-auto rounded-3xl shadow-2xl scale-110" />
          </FadeIn>
          <FadeIn className="order-1 md:order-2">
            <div className="space-y-8">
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                La résilience offline.
              </h3>
              <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
                Heryze redéfinit le point de vente. Que vous soyez en ligne ou au milieu de nulle part sans connexion, votre business ne s'arrête jamais.
              </p>
              <a href="#" className="inline-flex items-center text-[#0066cc] font-bold text-lg hover:underline group">
                En savoir plus sur le offline <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 2. SYNAPSEO HERO (MONUMENTAL) */}
      <ProductHero 
        id="synapseo"
        title="Synapseo"
        subtitle="L'intelligence qui anticipe chaque flux de votre commerce."
        image={synapseoDashboard}
        bgColor="bg-gradient-to-b from-white to-blue-50/30"
      />

      {/* 3. SYNAPSEO DETAILS (EXISTING) */}
      <section className="py-32 px-6 sm:px-12 max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
        <FadeIn>
          <div className="space-y-8">
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900">
              L'intelligence prédictive.
            </h3>
            <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
              Synapseo analyse vos flux en temps réel pour prédire vos besoins de demain. Une IA discrète, mais omniprésente, au service de votre prise de décision.
            </p>
            <a href="#" className="inline-flex items-center text-[#0066cc] font-bold text-lg hover:underline group">
              Découvrir la technologie <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </FadeIn>
        <FadeIn delay={0.2} className="relative">
          <div className="absolute inset-0 bg-white blur-3xl rounded-full -z-10 opacity-50" />
          <img src={synapseoVisual} alt="Synapseo Visual" className="w-full h-auto rounded-3xl" />
        </FadeIn>
      </section>

      {/* 6. ÉCOSYSTÈME (LE 3-EN-1) */}
      <section className="py-60 px-6 bg-white text-center">
        <FadeIn className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Mieux ensemble.</h2>
          
          <div className="relative h-24 max-w-md mx-auto flex items-center justify-between px-12 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 shadow-sm">Syn</div>
            <div className="flex-1 flex justify-center perspective-[500px]">
              <motion.div 
                animate={{ x: [-100, 100], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 shadow-sm">Her</div>
          </div>

          <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Vos outils partagent la même intelligence. <br />
            Pour que vous n'ayez plus à le faire.
          </p>
        </FadeIn>
      </section>

      {/* 7. PRICING SECTION (Synchronized Architecture) */}
      <section id="store" className="py-48 px-6 bg-white relative overflow-hidden">
        <style>{`
          @keyframes pricing-sweep {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to   { transform: translate(-50%, -50%) rotate(360deg); }
          }
          .card-pro-wrapper:hover .card-sweep-ray {
            animation: pricing-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) 1 forwards;
          }
        `}</style>
        
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
              Testez à fond.
              <br />
              <span className="text-gray-300">Abonnez-vous si ça marche.</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Plan Starter */}
            <FadeIn>
              <div className="relative rounded-[2.5rem] bg-gray-50 border border-gray-100 p-12 transition-all hover:scale-[1.02] duration-500 group">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 uppercase tracking-widest">Starter</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-7xl font-black tracking-tighter text-gray-900">19€</span>
                  <span className="text-gray-400 font-bold">/mois</span>
                </div>
                <p className="text-green-600 text-sm font-bold mb-8">14 jours offerts inclus</p>
                <div className="space-y-4 mb-12">
                  <div className="flex items-center gap-3 font-medium text-gray-700">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>1 accès Solo</span>
                  </div>
                  <div className="flex items-center gap-3 font-medium text-gray-700">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Inventaire complet</span>
                  </div>
                  <div className="flex items-center gap-3 font-medium text-gray-700">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Exports FEC illimités</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleSelectPlan('starter')}
                  className="w-full py-5 rounded-2xl font-black text-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition-all uppercase tracking-widest"
                >
                  Choisir Starter
                </button>
              </div>
            </FadeIn>

            {/* Plan Business (Premium) */}
            <FadeIn delay={0.15}>
              <div className="relative pt-6">
                {/* Badge */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                  <span className="bg-blue-600 text-white text-[11px] font-black tracking-widest uppercase px-6 py-2 rounded-full shadow-lg">
                    Populaire
                  </span>
                </div>
                
                {/* Wrapper border sweep */}
                <div 
                  className="card-pro-wrapper relative rounded-[2.6rem] overflow-hidden p-[2px] transition-shadow duration-500 hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] shadow-[0_0_40px_rgba(59,130,246,0.3)]"
                  style={{ background: '#3b82f6' }}
                >
                  {/* Sweep Ray */}
                  <div 
                    className="card-sweep-ray absolute left-1/2 top-1/2 w-[300%] h-[300%] pointer-events-none"
                    style={{ 
                      background: 'conic-gradient(from 0deg, transparent 0%, transparent 38%, rgba(255,255,255,0.9) 46%, white 50%, rgba(255,255,255,0.9) 54%, transparent 62%, transparent 100%)',
                      transform: 'translate(-50%, -50%) rotate(0deg)'
                    }}
                  />
                  
                  {/* Nội dung card */}
                  <div className="relative z-10 bg-white rounded-[2.5rem] p-12">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 shadow-sm flex items-center justify-center text-blue-600">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-lg font-black text-gray-900 uppercase tracking-widest">Business</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                       <span className="text-7xl font-black tracking-tighter text-gray-900">39€</span>
                       <span className="text-gray-400 font-bold">/mois</span>
                    </div>
                    <p className="text-green-600 text-sm font-bold mb-8">14 jours offerts inclus</p>
                    <div className="space-y-4 mb-12">
                      <div className="flex items-center gap-3 font-medium text-gray-700">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>5 accès Multi-utilisateurs</span>
                      </div>
                      <div className="flex items-center gap-3 font-medium text-gray-700">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Gestion des stocks avancée</span>
                      </div>
                      <div className="flex items-center gap-3 font-medium text-gray-700">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Dashboard Analytics en direct</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSelectPlan('business')}
                      className="w-full py-5 rounded-2xl font-black text-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest"
                    >
                      Choisir Business
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA (Synchronized) */}
      <section className="py-60 px-6 bg-white border-t border-gray-100 text-center">
        <FadeIn className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-8">
            Rejoignez l'univers Nexus.
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 font-medium mb-8 max-w-2xl mx-auto">
            Plus qu'un outil, une nouvelle façon de voir votre commerce.
          </p>
          <div className="flex flex-col items-center justify-center mt-12">
            {/* Bouton Acheter: Design Inscription-style (Style Heryze) */}
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-1 bg-blue-500/40 rounded-full blur-md opacity-20 group-hover:opacity-100 transition-opacity duration-500 will-change-[opacity,filter]"></div>
              
              <motion.button 
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => document.getElementById('store')?.scrollIntoView({ behavior: 'smooth' })}
                className="relative px-8 py-4 rounded-full font-black text-xl border border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-colors duration-300 flex items-center justify-center min-w-[200px] z-10 will-change-transform"
              >
                Découvrir la suite
              </motion.button>
            </div>
          </div>
        </FadeIn>
      </section>

    </div>
  );
}
