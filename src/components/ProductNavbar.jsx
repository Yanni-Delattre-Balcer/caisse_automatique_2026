import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * ProductNavbar - Floating 'pill' navigation for Heryze
 */
export function ProductNavbar({ isVisible = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const isHome = location.pathname === '/';

  const handleLinkClick = (e, target) => {
    if (!isHome) {
      // If not on home, redirect to home with hash
      // But React Router doesn't always handle hashes well on navigate
      // So we might need to handle it manually or just navigate to '/'
    }
  };

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
              <Link to="/" className="text-lg md:text-xl font-bold tracking-tighter text-gray-900 font-inter hover:opacity-70 transition-opacity">
                Heryze
              </Link>
            </div>

            {/* Right: Actions & Toggle */}
            <div className="flex items-center gap-3 md:gap-8">
              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-8">
                <a 
                  href={isHome ? "#presentation" : "/#presentation"} 
                  className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Présentation
                </a>
                <a 
                  href="/specs" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Caractéristiques
                </a>
              </div>

              {/* Mobile Chevron */}
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
                    navigate(`/login?redirect=${location.pathname}`);
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

      {/* Mobile Expanded Menu overlay */}
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
              <a href={isHome ? "#presentation" : "/#presentation"} onClick={() => setIsOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900">Présentation</a>
              <a href="/specs" target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900">Caractéristiques</a>
              <a href={isHome ? "#store" : "/#store"} onClick={() => setIsOpen(false)} className="text-4xl font-bold tracking-tight text-gray-900">Boutique Nexus</a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
