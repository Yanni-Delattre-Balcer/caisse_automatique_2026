import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Smartphone, Zap, FileSpreadsheet, Wifi, Star, Cloud, ChevronDown, X, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Assets
import nexusHero from '../assets/nexus/nexus-hero.png';
import synapseoVisual from '../assets/nexus/synapseo-visual.png';
import synapseoDashboard from '../assets/nexus/synapseo-dashboard.png';
import heryzePos from '../assets/nexus/heryze-pos.png';
import heryzeMockup from '../assets/nexus/hero-mockup.png';
import nexusLogo from '../assets/nexus/nexus-logo-black.png';

// --- Components ---

/**
 * ProductNavbar - Floating 'pill' navigation for Heryze
 */
function ProductNavbar({ isVisible }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: -20, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: -20, opacity: 0, x: '-50%' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-6 left-1/2 w-[92%] md:w-[90%] max-w-6xl h-16 bg-white/70 backdrop-blur-md rounded-full px-8 flex items-center justify-between z-[120] border border-blue-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-500"
        >
          <div className="flex items-center justify-between w-full h-full">
            {/* Left: Branding */}
            <div className="flex items-center">
              <span className="text-lg md:text-xl font-bold tracking-tighter text-gray-900 font-inter">
                Heryze
              </span>
            </div>

            {/* Right: Actions & Toggle */}
            <div className="flex items-center gap-3 md:gap-8">
              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-8">
                <a href="#presentation" className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">Présentation</a>
                <a href="#experience" onClick={(e) => { e.preventDefault(); document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">Caractéristiques</a>
              </div>

              {/* Mobile Chevron (Centered between text and button in mobile view) */}
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 hover:bg-gray-100/50 rounded-full transition-colors order-2"
              >
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-900" />
                </motion.div>
              </button>

              {/* Connexion / Lancer Button */}
              <button 
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/pos');
                  } else {
                    navigate('/login?redirect=/');
                  }
                }}
                className="bg-[#0071e3] text-white px-4 md:px-5 py-1.5 md:py-2 rounded-full font-bold text-[12px] md:text-sm hover:bg-[#0077ed] transition-all order-3"
              >
                {isAuthenticated ? 'Lancer Heryze' : 'Connexion'}
              </button>
            </div>
          </div>

        </motion.nav>
      )}

      {/* Mobile Expanded Menu overlay style sync with NexusLayout - Moved outside to fix stacking context */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-0 left-0 w-full h-[100vh] bg-white z-[999] flex flex-col p-10 md:hidden"
          >
            <div className="flex items-center justify-between mb-12">
              <span className="text-xl font-bold tracking-tighter text-gray-900 font-inter">Heryze</span>
              <button onClick={() => setIsOpen(false)} className="p-2 -mr-2">
                <X className="w-8 h-8 text-gray-900" />
              </button>
            </div>
            <nav className="flex flex-col gap-8">
              <a href="#presentation" onClick={() => setIsOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900">Présentation</a>
              <a href="#experience" onClick={() => setIsOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900">Caractéristiques</a>
              <a href="#store" onClick={() => setIsOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900">Boutique Nexus</a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

function ExperienceCard({ icon, color, title, description, badge, glowColor }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="snap-center shrink-0 w-[72vw] md:w-[450px] glow-card relative p-[1px] rounded-[2.5rem] bg-gray-100 overflow-hidden group transition-all duration-500 hover:scale-[1.02]">
      <div className="glow-ray absolute left-1/2 top-1/2 w-[200%] h-[200%] opacity-0 pointer-events-none"
        style={{ background: `conic-gradient(from 0deg, transparent 0%, transparent 40%, ${glowColor} 50%, transparent 60%, transparent 100%)` }}
      />
      <div className="relative h-full bg-white rounded-[2.4rem] p-10 flex flex-col z-10">
        <div className={`h-48 mb-8 flex items-center justify-center bg-${color}-50/50 rounded-3xl overflow-hidden relative`}>
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className={`bg-${color}-500/10 w-32 h-32 rounded-full absolute blur-3xl`} 
          />
          {icon}
        </div>
        <span className={`text-xs font-black uppercase tracking-widest text-${color}-600 mb-4`}>{badge}</span>
        <h4 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">{title}</h4>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 font-bold text-[#0066cc] hover:opacity-70 transition-opacity mb-4"
        >
          <span>{isExpanded ? 'Réduire' : 'En savoir plus'}</span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        {/* Expandable Text - 100% Hidden by default */}
        <div className="relative">
          <motion.div 
            initial={false}
            animate={{ 
              height: isExpanded ? 'auto' : '0px',
              opacity: isExpanded ? 1 : 0
            }}
            className="overflow-hidden"
          >
            <p className="text-gray-500 font-medium leading-relaxed pt-2">
              {description}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

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
 * ProductHero - Monumental centered introduction for a product
 */
function ProductHero({ title, subtitle, image, id, bgColor = "bg-white", titleRef }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  return (
    <section id={id} className={`flex flex-col items-center pt-8 pb-32 overflow-hidden ${bgColor} relative`}>
      <AtmosphericBackground />
      
      {/* Text Content (Top) */}
      <div className="max-w-4xl px-6 mb-12 flex flex-col items-center text-center z-10">
        <FadeIn className="space-y-4">
          <h2 ref={titleRef} className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 leading-tight text-balance font-inter">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-gray-400 font-medium max-w-xl mx-auto">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-3 items-center">
            {/* Bouton En savoir plus: Pilule bleue compacte */}
            <button 
              onClick={() => document.getElementById('presentation')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#0071e3] text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-[#0077ed] transition-all"
            >
              En savoir plus
            </button>
            
            {/* Bouton Démonstration / Lancer : Taille alignée sur 'En savoir plus' et halo extérieur pur */}
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
                    document.getElementById('store')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="relative px-5 py-2 rounded-full font-semibold text-sm border border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center min-w-[140px] z-10"
              >
                {isAuthenticated ? 'Lancer Heryze' : 'Démonstration'}
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

export function HeryzePage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  // Trigger logic for Level 2 Navbar
  const titleRef = useRef(null);
  const isTitleInView = useInView(titleRef, { margin: "-100px 0px 0px 0px" });
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    // Show navbar when title is NOT in view
    setShowNav(!isTitleInView);
  }, [isTitleInView]);

  // Ref for the narrative section to track its local scroll progress
  const narrativeRef = useRef(null);
  const { scrollYProgress: narrativeScrollProgress } = useScroll({
    target: narrativeRef,
    offset: ["start end", "center center"]
  });

  // Transformations dynamiques: opacité et scale pour l'effet focus
  const textOpacity = useTransform(narrativeScrollProgress, [0, 0.9, 1], [0.2, 0.8, 1]);
  const textScale = useTransform(narrativeScrollProgress, [0, 1], [0.95, 1]);
  const blurValue = useTransform(narrativeScrollProgress, [0, 0.5, 1], ["4px", "2px", "0px"]);

  const handleSelectPlan = (planType) => {
    navigate(`/checkout-summary?plan=${planType}`);
  };

  return (
    <div className="bg-white overflow-hidden selection:bg-blue-500/20">
      <ProductNavbar isVisible={showNav} />
      
      {/* 1. HERO SECTION (Synchronized Architecture) */}
      <ProductHero 
        id="heryze"
        title="Heryze"
        subtitle="Encaissez. Synchronisez. Respirez."
        image={heryzePos}
        titleRef={titleRef}
      />

      {/* 2. DESCRIPTIVE SECTION (Apple-Style Scroll Transition) */}
      <section ref={narrativeRef} id="presentation" className="pt-60 pb-32 px-6 flex items-center justify-center bg-white relative">
        <motion.div 
          style={{ 
            opacity: textOpacity, 
            scale: textScale,
            filter: `blur(${blurValue})`
          }}
          className="max-w-4xl text-center"
        >
          <p className="text-2xl md:text-3xl font-medium text-black leading-relaxed text-balance transition-colors duration-500">
            "Si Heryze transforme radicalement votre façon de travailler, c'est parce qu'il s'adapte à votre réalité, pas l'inverse. En faire votre partenaire, c'est s'assurer que chaque vente est un moment de fluidité, même sans connexion. C'est libérer votre esprit des calculs comptables pour vous concentrer sur ce qui compte vraiment : vos clients."
          </p>
        </motion.div>
      </section>

      {/* 3. POINTS FORTS (Carousel Interactif) */}
      <section id="experience" className="py-40 bg-white">
        <style>{`
          .snap-scroll-container::-webkit-scrollbar { display: none; }
          .snap-scroll-container { -ms-overflow-style: none; scrollbar-width: none; }
          
          @keyframes glow-sweep {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to   { transform: translate(-50%, -50%) rotate(360deg); }
          }
          .glow-card:hover .glow-ray {
            opacity: 1;
            animation: glow-sweep 2s linear infinite;
          }
        `}</style>

        <div className="px-6 md:px-12 lg:px-24 mb-6">
          <FadeIn>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
              L'expérience Heryze.
            </h3>
          </FadeIn>
        </div>

        <div className="snap-scroll-container flex overflow-x-auto snap-x snap-mandatory gap-8 px-6 md:px-12 lg:px-24 pb-12">
          <ExperienceCard 
            icon={<Wifi className="w-20 h-20 text-blue-500 relative z-10" />}
            color="blue"
            glowColor="rgba(59,130,246,0.3)"
            badge="La résilience offline"
            title="Le réseau tombe. Votre business, jamais."
            description="“Heryze redéfinit le point de vente. Que vous soyez en ligne ou au milieu de nulle part sans connexion, votre business ne s'arrête jamais. Les ventes s'enregistrent localement et se synchronisent d'elles-mêmes dès que vous retrouvez le signal.”"
          />

          <ExperienceCard 
            icon={<Smartphone className="w-20 h-20 text-purple-500 relative z-10" />}
            color="purple"
            glowColor="rgba(139,92,246,0.3)"
            badge="L'Économie Intelligente"
            title="Votre smartphone est votre meilleure douchette."
            description="“Pourquoi acheter un scanner coûteux quand vous avez un outil ultra-puissant dans votre poche ? Grâce à la technologie WebRTC, la caméra de votre téléphone devient un scanner haute précision instantané.”"
          />

          <ExperienceCard 
            icon={<FileSpreadsheet className="w-20 h-20 text-emerald-500 relative z-10" />}
            color="emerald"
            glowColor="rgba(16,185,129,0.3)"
            badge="La Sérénité Administrative"
            title="Votre comptable va vous adorer."
            description="“Heryze automatise tout ce que vous détestez faire. Calcul de TVA, rapport Z de fin de journée, exports FEC prêts pour votre expert-comptable.”"
          />
        </div>
      </section>

      {/* 4. DEEP DIVE SECTION (Apple Watch Style) */}
      <section className="py-40 bg-zinc-950 text-white overflow-hidden">
        <div className="px-6 md:px-24 mb-20">
          <FadeIn>
            <h3 className="text-5xl md:text-[6rem] font-bold tracking-tight max-w-4xl text-balance">
              La comptabilité silencieuse.
            </h3>
            <p className="text-xl md:text-2xl text-zinc-400 font-medium max-w-2xl mt-8 leading-relaxed">
              Heryze ne se contente pas d'encaisser. Elle analyse, classe et exporte. Vos données de vente sont chaînées automatiquement pour garantir une conformité totale sans que vous ayez à lever le petit doigt.
            </p>
          </FadeIn>
        </div>

        <div className="px-6 md:px-12 lg:px-24 relative">
          <FadeIn delay={0.4} y={60}>
            {/* Tablet Mockup - Wide Style */}
            <div className="relative mx-auto rounded-[3rem] p-4 border-[12px] border-zinc-800 bg-zinc-900 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-800 rounded-full" />
              <img 
                src={heryzePos} 
                alt="Heryze Interface Tablet" 
                className="w-full h-auto rounded-[2rem]"
              />
              {/* Notification Overlay */}
              <motion.div 
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute top-1/2 right-12 -translate-y-1/2 bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl text-gray-900 max-w-xs border border-white/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">H</div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notification</span>
                </div>
                <p className="font-bold text-lg leading-tight">Rapport Z généré et transmis à votre expert-comptable.</p>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>


      {/* 6. COMPARATIF CONCURRENTS (Grid Minimaliste) */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-20">
            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">Comparatif Honnête</span>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mt-4 tracking-tight">Pourquoi pas les autres ?</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { rival: 'Merlin / Lightspeed', desc: 'Cher, pas d\'offline, interface datée.', color: 'border-gray-100' },
              { rival: 'Pennylane / QuickBooks', desc: 'Pour les comptables, pas pour la caisse.', color: 'border-gray-100' },
              { rival: 'Excel / Papier', desc: 'Saisie manuelle, erreurs, perte de temps.', color: 'border-gray-100' },
              { rival: 'Heryze', desc: 'Offline-first, scanner intégré, compta auto.', color: 'border-blue-500 bg-blue-50/10 shadow-[0_0_30px_rgba(59,130,246,0.1)]', highlight: true }
            ].map((c, i) => (
              <FadeIn key={c.rival} delay={i * 0.1}>
                <div className={`p-8 rounded-[2.5rem] border ${c.color} h-full relative group`}>
                  {c.highlight && (
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] -z-10" 
                    />
                  )}
                  <h4 className={`text-sm font-black uppercase tracking-widest mb-4 ${c.highlight ? 'text-blue-600' : 'text-gray-400'}`}>vs {c.rival}</h4>
                  <p className={`text-lg font-bold leading-tight ${c.highlight ? 'text-gray-900' : 'text-gray-500'}`}>{c.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 7. MISE EN ROUTE (Séquence au Scroll) */}
      <section className="py-40 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-24">
            <span className="text-emerald-600 font-bold tracking-widest uppercase text-xs">Mise en route</span>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mt-4 tracking-tight">Prêt en 3 minutes.</h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <Star className="w-8 h-8" />, title: 'Compte', desc: 'Inscrivez-vous en 30 secondes.' },
              { icon: <Smartphone className="w-8 h-8" />, title: 'Produits', desc: 'Importez votre catalogue en 1 clic.' },
              { icon: <Zap className="w-8 h-8" />, title: 'Vente', desc: 'Commencez à encaisser immédiatement.' }
            ].map((s, i) => {
              const itemRef = useRef(null);
              const isInView = useInView(itemRef, { margin: "-20% 0px -20% 0px" });
              
              return (
                <div key={s.title} ref={itemRef} className="flex flex-col items-center text-center group">
                  <motion.div 
                    animate={isInView ? { 
                      scale: 1.1,
                      backgroundColor: 'rgba(59, 130, 246, 1)',
                      color: '#fff',
                      boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
                    } : { 
                      scale: 1,
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                      color: 'rgba(59, 130, 246, 1)',
                      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)'
                    }}
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 border border-blue-100 transition-all duration-700"
                  >
                    {s.icon}
                  </motion.div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">{s.title}</h4>
                  <p className="text-gray-500 font-medium leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. PRICING FINAL (Landing Page Sync) */}
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
          {/* 1. Titre & Démo Immédiate */}
          <FadeIn className="text-center mb-32 flex flex-col items-center">
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-gray-900 mb-12">
              Testez à fond.
            </h2>
            
            <p className="text-xl md:text-3xl text-gray-900 font-bold mb-8">Envie de tester sans créer de compte ?</p>
            <button
              onClick={() => {
                useAuthStore.getState().loginAsDemo();
                navigate('/pos/quick');
              }}
              className="px-16 py-7 border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/50 text-blue-600 rounded-[2rem] font-black text-2xl md:text-3xl transition-all flex items-center gap-5 group shadow-xl shadow-blue-500/5 hover:scale-105 active:scale-95"
            >
              <Zap className="w-10 h-10 text-blue-500 group-hover:animate-pulse" />
              Accéder au Mode Démo
            </button>
          </FadeIn>

          {/* 2. Transition vers Pricing */}
          <FadeIn delay={0.2} className="text-center mt-60 mb-24">
            <p className="text-2xl md:text-4xl text-gray-400 font-medium italic">Abonnez-vous si cela vous convient.</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
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

      {/* 9. FINAL CTA */}
      <section className="py-60 px-6 bg-white border-t border-gray-100 text-center">
        <FadeIn className="max-w-4xl mx-auto">
          <p className="text-blue-600 font-bold tracking-[0.2em] uppercase text-sm mb-6">Conclusion</p>
          <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-8">
            Heryze n'est pas une dépense, c'est un investissement dans la stabilité de votre commerce.
          </h2>
          <div className="flex flex-col items-center justify-center mt-16">
            {/* Bouton Premium avec Aura (Sync Nexus Universe) */}
            <div className="relative group flex items-center justify-center">
              {/* Le halo (Aura Nexus) - Émanation strictement extérieure */}
              <div className="absolute -inset-1 bg-blue-500/40 rounded-full blur-md opacity-20 group-hover:opacity-100 transition-opacity duration-500 will-change-[opacity,filter]"></div>
              
              <motion.button 
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/pos');
                  } else {
                    navigate('/login?redirect=/pos');
                  }
                }}
                className="relative px-12 py-5 rounded-full font-black text-xl border border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-colors duration-300 flex items-center justify-center min-w-[240px] z-10 will-change-transform"
              >
                Lancer Heryze
              </motion.button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* 10. ÉCOSYSTÈME NEXUS (Animated Orbit) */}
      <section className="py-60 px-6 bg-white flex flex-col items-center justify-center text-center">
        <FadeIn className="max-w-4xl space-y-12 mb-32">
          <h2 className="text-5xl md:text-[5rem] font-bold tracking-tight text-gray-900">Mieux ensemble.</h2>
          <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Heryze fait partie de Nexus. Vos données circulent, votre business respire.
          </p>
        </FadeIn>

        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* Central Nexus Sphere */}
          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-xl z-10 shadow-[0_0_60px_rgba(59,130,246,0.6)]">
            N
          </div>
          
          {/* Orbiting Sync (Synapseo) */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute w-full h-full border border-gray-100 rounded-full"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 shadow-sm">Syn</div>
          </motion.div>

          {/* Orbiting Her (Heryze) */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute w-full h-full border border-gray-100/50 rounded-full scale-125"
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 shadow-sm">Her</div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
