import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ContactForm } from '../components/ContactForm';

export function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 pb-20">
        <div className="text-center mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm border border-blue-100">
            Support Client
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-lg text-gray-500 font-medium">
            Que ce soit pour une question sur nos offres, une assistance technique ou un retour, notre équipe vous répond généralement sous 24h.
          </p>
        </div>

        <ContactForm />
      </main>
    </div>
  );
}
