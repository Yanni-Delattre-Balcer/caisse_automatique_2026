import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Assets
import nexusLogo from '../assets/nexus/nexus-logo-black.png';
import nexusLogoWhite from '../assets/nexus/nexus-logo-white.png';

/**
 * NexusLayout - The Hub Layout
 * Features a floating glassmorphism navbar (90% width) and a news bar.
 */
export function NexusLayout() {
  const location = useLocation();
  const isNexusProp = location.pathname === '/nexus-prop' || location.pathname === '/nexus-leadership';
  
  // Newsbar Narrative State
  const [newsStep, setNewsStep] = React.useState('credits'); // credits -> main

  React.useEffect(() => {
    const timer = setTimeout(() => setNewsStep('main'), 3000);
    return () => clearTimeout(timer);
  }, []);

  const newsVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-500/10 flex flex-col">
      
      {/* 1. The Nexus Hub Navigation */}
      <nav className={`${isNexusProp ? 'fixed' : 'absolute'} top-6 left-1/2 -translate-x-1/2 w-[92%] md:w-[90%] h-16 bg-white/70 backdrop-blur-md rounded-full px-8 flex items-center justify-between z-50 border border-blue-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)]`}>
        
        {/* Left: Branding */}
        <Link to="/" className="flex items-center gap-3 px-6 hover:opacity-80 transition-opacity">
          <img src={nexusLogo} alt="Nexus Logo" className="h-[27px] w-auto object-contain" />
          <span className="text-xl font-bold tracking-tighter text-gray-900 font-inter">
            NEXUS
          </span>
        </Link>

        {/* Center: Links (Absolutely Centered) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-[13px] font-semibold text-gray-500">
          <a href="#synapseo" className="hover:text-gray-900 transition-colors">Synapseo</a>
          <Link to="/" className="hover:text-gray-900 transition-colors">Heryze</Link>
          <a href="#store" className="hover:text-gray-900 transition-colors">Store</a>
          <a href="#support" className="hover:text-gray-900 transition-colors">Support</a>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-6 text-gray-400">
          <Search className="w-4 h-4 cursor-pointer hover:text-gray-900 transition-colors" />
          <ShoppingBag className="w-4 h-4 cursor-pointer hover:text-gray-900 transition-colors" />
        </div>
      </nav>

      {/* 2. Dynamic Newsbar - Narrative Sequence */}
      <div className="pt-24 pb-8 w-full bg-white z-40 relative">
        <div className="max-w-7xl mx-auto min-h-[50px] grid grid-cols-1 items-center justify-items-center box-border">
          <AnimatePresence mode="wait">
            {newsStep === 'credits' && (
              <motion.div 
                key="credits"
                variants={newsVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center space-y-1"
                style={{ gridArea: '1 / 1' }}
              >
                <p className="text-[14px] md:text-[15px] text-gray-900 font-medium tracking-tight">
                  Yanni Delattre-Balcer and Bérangère • Development presents
                </p>
                <p className="text-[14px] md:text-[15px] text-gray-900 font-medium tracking-tight">
                  a Nexus production
                </p>
              </motion.div>
            )}
            {newsStep === 'main' && (
              <motion.div 
                key="main"
                variants={newsVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="px-6 text-center"
                style={{ gridArea: '1 / 1' }}
              >
                <p className="text-[14px] md:text-[15px] text-gray-900 font-medium tracking-tight leading-relaxed">
                  Nexus dévoile Heryze : La caisse nouvelle génération pour commerçants visionnaires. {(location.pathname === '/nexus-prop' || location.pathname === '/') && <Link to="/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline ml-1">Découvrir {'>'}</Link>}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <main className="flex-grow">
        <Outlet />
      </main>

      {/* 7. Footer (Architecture Nexus) */}
      <footer className="bg-white py-24 px-6 border-t border-gray-100">
        {/* Bloc Signature Dynamique - Centré au-dessus */}
        <div className="max-w-4xl mx-auto text-center mb-20 space-y-4">
          <div className="text-[13px] font-semibold text-gray-600 space-y-1 leading-relaxed">
            {location.pathname === '/nexus-prop' ? (
              <div className="flex flex-col items-center">
                <p className="text-gray-900">Nexus</p>
                <p>Developed by</p>
                <p className="mt-1 text-gray-600">
                  <a href="https://github.com/Yanni-Delattre-Balcer" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">Yanni Delattre-Balcer</a> & <a href="#" className="hover:text-blue-500 transition-colors">Bérangère • Development</a>
                </p>
              </div>
            ) : (
              <p>
                <span className="text-gray-900">Nexus</span><br />
                Developed by <a href="https://github.com/Yanni-Delattre-Balcer" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">Yanni Delattre-Balcer</a> & <a href="#" className="hover:text-blue-500 transition-colors">Bérangère • Development</a>
              </p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Écosystème</span>
            <a href="#synapseo" className="text-sm font-medium text-gray-600 hover:text-gray-900">Synapseo</a>
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">Heryze</Link>
            <a href="#store" className="text-sm font-medium text-gray-600 hover:text-gray-900">Store</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Entreprise</span>
            <Link to="/nexus-leadership" className="text-sm font-medium text-gray-600 hover:text-gray-900">Direction de Nexus</Link>
            <a href="#support" className="text-sm font-medium text-gray-600 hover:text-gray-900">Support</a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Blog</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Légal</span>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Confidentialité</a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Conditions</a>
          </div>
        </div>

        {/* Mention Légale Isolée */}
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-gray-100 flex flex-col items-center">
          <p className="text-[11px] text-gray-300 font-bold tracking-[0.2em] uppercase">
            © 2026 Nexus • All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
