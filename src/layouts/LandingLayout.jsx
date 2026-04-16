import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useAuthStore } from '../store/useAuthStore';

export function LandingLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const initials = (user?.companyName ?? user?.email ?? 'US').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navbar v3 style */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] md:w-[80%] bg-white/70 backdrop-blur-md rounded-full px-6 md:px-8 py-4 flex items-center justify-between z-50 border border-black/5 shadow-xl">
        <Link to="/" className="text-xl md:text-2xl font-black tracking-tight bg-linear-to-br from-[#00f2ff] to-[#0055ff] text-transparent bg-clip-text transition-all hover:scale-105">
          Heryze
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wider uppercase text-blue-600/80">
          <a href="#features" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-blue-600 transition-colors">Tarifs</a>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <button
                onClick={() => navigate('/pos')}
                className="hidden md:flex items-center gap-2.5 bg-white border border-gray-200 rounded-full pl-2 pr-4 py-1.5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-7 h-7 rounded-full bg-linear-to-tr from-[#00f2ff] to-[#0055ff] flex items-center justify-center text-white text-[10px] font-black">
                  {initials}
                </div>
                <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition-colors max-w-[120px] truncate">
                  {user.companyName ?? user.email}
                </span>
              </button>
              <Button
                as={Link}
                to="/pos"
                className="bg-[#0055ff] text-white px-6 py-2 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg shadow-blue-500/30 hover:bg-[#0044cc] transition-all"
              >
                Mon espace
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden md:block text-xs font-bold tracking-wider uppercase text-blue-600 hover:opacity-70 transition-opacity">
                Connexion
              </Link>
              <Button as={Link} to="/register" className="bg-[#0055ff] text-white px-6 py-2 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg shadow-blue-500/30 hover:bg-[#0044cc] transition-all">
                Inscription
              </Button>
            </>
          )}
        </div>
      </nav>

      <main className="pt-32">
        <Outlet />
      </main>

      <footer className="bg-white text-gray-400 py-10 text-center">
        <p className="text-xs tracking-widest uppercase font-semibold mb-2">Developped by Nexus © 2026 — All Rights Reserved</p>
        <Link 
          to="/about" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-300 hover:text-[#0099ff] transition-colors tracking-widest uppercase"
        >
          About Nexus
        </Link>
      </footer>
    </div>
  );
}
