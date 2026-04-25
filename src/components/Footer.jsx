import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer - Shared Nexus ecosystem footer
 */
export function Footer() {
  return (
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
  );
}
