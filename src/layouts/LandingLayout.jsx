import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useAuthStore } from '../store/useAuthStore';

export function LandingLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navbar v3 style */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] md:w-[80%] bg-white/70 backdrop-blur-md rounded-full px-6 md:px-8 py-4 flex items-center justify-between z-50 border border-black/5 shadow-xl">
        <Link to="/" className="text-xl md:text-2xl font-black tracking-tight bg-linear-to-br from-[#00f2ff] to-[#0055ff] text-transparent bg-clip-text transition-all hover:scale-105">
          Heryze
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wider uppercase text-blue-600/80">
          <a href="#features" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
          <Link to="/pricing" className="hover:text-blue-600 transition-colors">Tarifs</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:block text-xs font-bold tracking-wider uppercase text-blue-600 hover:opacity-70 transition-opacity">
            Se connecter
          </Link>
          <button
            onClick={() => {
                useAuthStore.getState().loginAsDemo();
                navigate('/pos/quick');
            }}
            className="hidden md:block text-xs font-bold tracking-wider uppercase text-gray-500 hover:text-blue-600 transition-colors"
          >
            Démo
          </button>
          <Button as={Link} to="/register" className="bg-[#0055ff] text-white px-6 py-2 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg shadow-blue-500/30 hover:bg-[#0044cc] transition-all">
            Essayer gratuitement
          </Button>
        </div>
      </nav>

      <main className="pt-32">
        <Outlet />
      </main>

      <footer className="bg-white text-gray-400 py-10 text-center border-t border-gray-100 mt-20">
        <p className="text-xs tracking-widest uppercase font-semibold mb-2">Developped by Nexus © 2026 — All Rights Reserved</p>
        <div className="text-xs text-gray-300 hover:text-[#0099ff] transition-colors tracking-widest uppercase">
          Propulsé par la Douchette Magique
        </div>
      </footer>
    </div>
  );
}
