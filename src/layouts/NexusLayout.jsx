import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, Settings, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

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
  
  // Mobile Menu State
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const initials = (user?.companyName ?? user?.email ?? 'U').substring(0, 2).toUpperCase();
  
  // Newsbar Narrative State
  const [newsStep, setNewsStep] = React.useState('credits'); // credits -> main

  React.useEffect(() => {
    const timer = setTimeout(() => setNewsStep('main'), 2500); // Shorter initial wait
    return () => clearTimeout(timer);
  }, []);

  const newsVariants = {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-500/10 flex flex-col">
      
      {/* 1. The Nexus Hub Navigation */}
      <nav className={`${isNexusProp ? 'fixed' : 'absolute'} top-6 left-1/2 -translate-x-1/2 w-[92%] md:w-[90%] h-16 bg-white/70 backdrop-blur-md rounded-full px-8 flex items-center justify-between z-[100] border border-blue-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-500`}>
        
        {/* Left: Branding */}
        <Link to="/" className="flex items-center gap-3 px-2 hover:opacity-80 transition-opacity">
          <img src={nexusLogo} alt="Nexus Logo" className="h-[20px] md:h-[24px] w-auto object-contain" />
        </Link>

        {/* Center: Links (Desktop) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-[13px] font-semibold text-gray-500">
          <a href="#synapseo" className="hover:text-gray-900 transition-colors">Synapseo</a>
          <Link to="/" className="hover:text-gray-900 transition-colors">Heryze</Link>
          <a href="#store" className="hover:text-gray-900 transition-colors">Store</a>
          <a href="#support" className="hover:text-gray-900 transition-colors">Support</a>
          {location.pathname !== '/' && isAuthenticated && (
            <button 
              onClick={() => navigate('/pos')}
              className="text-blue-600 font-bold hover:opacity-70 transition-opacity"
            >
              Lancer Heryze
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 text-gray-400 relative">
          
          {/* Landing Page Action Button */}
          {location.pathname === '/' && (
            <button 
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/pos');
                } else {
                  navigate('/login?redirect=/');
                }
              }}
              className="text-[#0071e3] font-bold text-sm h-10 px-4 flex items-center hover:opacity-70 transition-opacity"
            >
              {isAuthenticated ? 'Lancer Heryze' : 'Connexion'}
            </button>
          )}

          {/* Nexus Prop Signature: Search & Cart */}
          {location.pathname !== '/' && (
            <>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="w-5 h-5 text-gray-900" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => {
                    setIsCartOpen(!isCartOpen);
                    setIsProfileOpen(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-900" />
                </button>
                
                <AnimatePresence>
                  {isCartOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-[110]"
                    >
                      <p className="text-sm font-bold text-gray-900 mb-4">Votre panier est vide</p>
                      {!isAuthenticated && (
                        <div className="pt-4 border-t border-gray-50">
                          <p className="text-xs text-gray-400 mb-3 font-medium">Pour commander vos outils :</p>
                          <Link 
                            to="/login?redirect=/nexus-prop" 
                            className="text-blue-600 font-bold text-sm hover:underline"
                            onClick={() => setIsCartOpen(false)}
                          >
                            Connectez-vous
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Profile Menu (Authenticated Only - Signature in all Nexus Hub) */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsCartOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-linear-to-tr from-[#00f2ff] to-[#0055ff] flex items-center justify-center text-white text-xs font-black shadow-md hover:scale-105 transition-transform"
              >
                {initials}
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110]"
                  >
                    {/* User Info Header */}
                    <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Session active</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.companyName || 'Mon Commerce'}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                    </div>

                    {/* Actions List */}
                    <div className="p-2">
                       <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/settings');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        Compte
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Apple-style Mobile Menu Trigger */}
          <button 
            className="md:hidden flex flex-col items-center justify-center gap-1.5 w-8 h-8 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <motion.div 
              animate={isMenuOpen ? { rotate: 45, y: 4.5 } : { rotate: 0, y: 0 }}
              className="w-5 h-[1.5px] bg-gray-900 rounded-full" 
            />
            <motion.div 
              animate={isMenuOpen ? { rotate: -45, y: -4.5 } : { rotate: 0, y: 0 }}
              className="w-5 h-[1.5px] bg-gray-900 rounded-full" 
            />
          </button>
        </div>

      </nav>
      
      {/* Mobile Menu Overlay (Apple Style - Full Screen) - Moved outside nav to fix stacking context */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white z-[999] flex flex-col p-10 md:hidden"
          >
            {/* Header inside overlay */}
            <div className="flex items-center justify-between mb-12">
              <img src={nexusLogo} alt="Nexus Logo" className="h-[20px] w-auto object-contain" />
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 -mr-2"
              >
                <X className="w-8 h-8 text-gray-900" />
              </button>
            </div>

            {/* Navigation Links - Large Bold Typography */}
            <nav className="flex flex-col gap-6">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900 hover:text-blue-600 transition-colors">Store</Link>
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900 hover:text-blue-600 transition-colors">Synapseo</Link>
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900 hover:text-blue-600 transition-colors">Heryze</Link>
              <a href="#support" onClick={() => setIsMenuOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900 hover:text-blue-600 transition-colors">Assistance</a>
              <a href="#support" onClick={() => setIsMenuOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900 hover:text-blue-600 transition-colors">Support</a>
            </nav>

            {/* Overlay Footer spacing if needed */}
            <div className="mt-auto pt-8" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Dynamic Newsbar - Narrative Sequence */}
      <div className="pt-24 pb-8 w-full bg-white z-40 relative">
        <div className="max-w-7xl mx-auto min-h-[50px] grid grid-cols-1 items-center justify-items-center box-border">
          <AnimatePresence mode="popLayout">
            {newsStep === 'credits' && (
              <motion.div 
                key="credits"
                variants={newsVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
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
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
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
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="text-[13px] font-semibold text-gray-600 flex flex-col items-center gap-1 leading-relaxed">
            <span className="text-gray-900">Nexus</span>
            <span>Developed by</span>
            <div className="text-gray-500">
              <a href="https://github.com/Yanni-Delattre-Balcer" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">Yanni Delattre-Balcer</a>
              <span className="mx-1">&</span>
              <a href="#" className="hover:text-blue-500 transition-colors">Bérangère • Development</a>
            </div>
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
