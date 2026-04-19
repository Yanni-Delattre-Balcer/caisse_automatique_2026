import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Zap, Target, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * FadeIn - Kinetic Typography component
 * Provides a smooth fade-in and upward slide triggered on scroll.
 */
function FadeIn({ children, delay = 0, className = '', y = 30 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function NexusLeadershipPage() {
  return (
    <div className="bg-white overflow-hidden selection:bg-blue-500/20">
      
      {/* 1. LE HERO (LE MANIFESTE) */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-6 overflow-hidden">
        {/* Halo Nexus Subtil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl text-center z-10 space-y-8">
          <FadeIn delay={0.2}>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-tight">
              L'intelligence de l'invisible.
            </h1>
          </FadeIn>
          <FadeIn delay={0.4} y={20}>
            <p className="text-xl md:text-3xl text-gray-400 font-medium tracking-tight">
              "La technologie n'a de sens que lorsqu'elle s'efface au profit de l'humain."
            </p>
          </FadeIn>
        </div>
      </section>

      {/* 2. NOTRE ORIGINE (L'ÉTINCELLE) */}
      <section className="py-40 px-6 bg-white border-b border-gray-100/10">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <FadeIn>
            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">Notre Origine</span>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mt-6 tracking-tight">L'ADN de deux visionnaires.</h2>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed italic">
              "Nexus est née sur les bancs d'un cursus en Réseaux & Télécommunications. Là où d'autres voyaient des câbles et des protocoles, nous avons vu des barrières. Nous sommes Yanni Delattre-Balcer et Briac Le Meillat (Bérangère • Development), et nous partageons une conviction radicale : la complexité technique est l'échec du design."
            </p>
          </FadeIn>
        </div>
      </section>

      {/* 3. NOTRE VOCATION (LA MISSION) */}
      <section className="py-40 px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <FadeIn className="space-y-8">
            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">La Mission</span>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight">L'ambition sans le frein.</h2>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-xl">
              "Nous ne créons pas des logiciels. Nous sculptons des expériences. Passionnés par l'architecture des systèmes, nous avons fondé Nexus pour transformer des outils autrefois lourds et archaïques en interfaces instinctives. Notre quête est universelle : rendre le complexe imperceptible."
            </p>
          </FadeIn>

          <FadeIn delay={0.2} className="grid grid-cols-2 gap-8">
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-4 transition-transform hover:-translate-y-2 duration-500">
              <Zap className="text-blue-600 w-8 h-8" />
              <h4 className="font-bold text-lg">Instinctif</h4>
              <p className="text-sm text-gray-400">Des flux naturels, zéro friction.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-4 transition-transform hover:-translate-y-2 duration-500 mt-8">
              <Target className="text-indigo-600 w-8 h-8" />
              <h4 className="font-bold text-lg">Précis</h4>
              <p className="text-sm text-gray-400">L'IA au service du détail.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECTION PORTRAITS */}
      <section className="py-40 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">Les Fondateurs</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-24">
            {/* Yanni */}
            <FadeIn delay={0.2} className="flex flex-col items-center text-center space-y-8">
              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="w-48 h-48 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center relative z-10 overflow-hidden">
                  <span className="text-5xl font-black text-gray-800 tracking-tighter">YDB</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Yanni Delattre-Balcer</h3>
                <p className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">Co-Fondateur & Visionnaire</p>
              </div>
            </FadeIn>

            {/* Briac (Bérangère) */}
            <FadeIn delay={0.4} className="flex flex-col items-center text-center space-y-8">
              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="w-48 h-48 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center relative z-10 overflow-hidden">
                  <span className="text-5xl font-black text-gray-800 tracking-tighter">BLM</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Briac Le Meillat</h3>
                <p className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">Bérangère • Development</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 4. LA PREUVE PAR L'ACTION : HERYZE */}
      <section className="py-40 px-6 bg-gray-50 border-t border-gray-100/10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <FadeIn>
            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">Le Premier Chapitre</span>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mt-6 tracking-tight">Heryze : La caisse, réinventée.</h2>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed italic">
              "Heryze est le premier chapitre de notre histoire. Ce n'est pas une simple caisse enregistreuse ; c'est une déclaration de guerre à l'inefficacité. Rapide, résiliente et d'une simplicité désarmante, elle rend aux commerçants leur ressource la plus précieuse : le temps."
            </p>
          </FadeIn>

          <FadeIn delay={0.4} className="pt-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-3 bg-white border border-gray-200 text-gray-900 px-8 py-4 rounded-full font-bold hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm"
            >
              Découvrir la genèse <ArrowRight className="w-5 h-5" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* 5. VISION FUTURE (L'APPEL À L'AVENIR) */}
      <section className="py-60 px-6 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <FadeIn y={0}>
            <p className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter italic leading-tight">
              "Nous ne construisons pas pour aujourd'hui. <br className="hidden md:block" />
              Nous bâtissons les fondations de demain."
            </p>
          </FadeIn>
        </div>
        
        {/* Footer Signature Specific Section */}
        <div className="max-w-3xl mx-auto mt-40 text-center space-y-4 py-20 border-t border-gray-100/50">
          <FadeIn delay={0.2} y={10} className="space-y-4">
            <p className="text-[13px] font-semibold text-gray-400 tracking-wide">
              Yanni Delattre-Balcer and Bérangère • Development presents
            </p>
            <p className="text-[13px] font-bold text-gray-500 uppercase tracking-[0.3em]">
              a Nexus production
            </p>
            <p className="text-[11px] text-gray-300 font-bold tracking-[0.2em] pt-8">
              Developed by Nexus © 2026 — All Rights Reserved
            </p>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
