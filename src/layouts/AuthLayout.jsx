import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans flex text-gray-900 selection:bg-blue-500/30">
      {/* Left side: Form */}
      <div className="w-full lg:w-[45%] flex flex-col px-8 sm:px-16 py-10 relative bg-white">
        {/* Logo */}
        <Link to="/" className="text-2xl font-black tracking-tight bg-gradient-to-br from-[#00f2ff] to-[#0055ff] text-transparent bg-clip-text w-max">
          OmniPOS
        </Link>
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
          <Outlet />
        </div>
      </div>
      
      {/* Right side: Branding/Image */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-b from-[#f8f9fa] to-[#eaf0ff] relative items-center justify-center overflow-hidden border-l border-gray-100">
        {/* Abstract decor */}
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-[#00f2ff]/20 to-[#0055ff]/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex flex-col items-center text-center p-12">
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-lg leading-tight">
                Le poste d'encaissement<br/>de nouvelle génération.
            </h2>
            <p className="text-lg text-gray-500 font-medium max-w-md">
                Gérez votre entreprise en toute simplicité avec notre interface ultra-rapide, pensée spécifiquement pour votre activité.
            </p>
        </div>
      </div>
    </div>
  );
}
