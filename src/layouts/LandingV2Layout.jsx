import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * LandingV2Layout - Apple-inspired minimalist layout
 * Features a transparent blurred navbar and a centered narrative structure.
 */
export function LandingV2Layout() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-500/20">
      {/* Apple-style minimalist Navbar */}
      <nav className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 flex items-center justify-center px-6">
        <div className="w-full max-w-7xl flex items-center justify-between">
          {/* Left: Brand */}
          <Link to="/" className="text-xl font-black tracking-tight text-gray-900 hover:opacity-80 transition-opacity">
            Heryze
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#presentation" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors tracking-tight">
              Présentation
            </a>
            <a href="#why" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors tracking-tight">
              Pourquoi Heryze
            </a>
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button
                as={Link}
                to="/pos"
                className="bg-gray-900 text-white px-6 h-9 rounded-full font-bold text-xs hover:bg-gray-800 transition-all"
              >
                Mon espace
              </Button>
            ) : (
              <Button
                as={Link}
                to="/register"
                className="bg-[#0066cc] text-white px-6 h-9 rounded-full font-bold text-xs shadow-md hover:bg-[#0055aa] transition-all"
              >
                Essai Gratuit
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <Outlet />
      </main>

      {/* Minimalist Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <span className="text-lg font-black tracking-tight">Heryze</span>
            <p className="text-sm text-gray-500 max-w-xs font-medium leading-relaxed">
              La caisse enregistreuse nouvelle génération. Conçue pour la rapidité, la fiabilité et la simplicité.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-24">
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Produit</span>
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Fonctionnalités</a>
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Tarifs</a>
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">FAQ</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Entreprise</span>
              <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900">À propos</Link>
              <Link to="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900">Contact</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400 font-medium">
            © 2026 Nexus Architecture. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
