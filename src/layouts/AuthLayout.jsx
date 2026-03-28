import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans bg-[#f0f4ff] overflow-hidden">
      {/* Abstract background blobs for the glass effect to shine */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-[#00f2ff]/30 to-[#0055ff]/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-[#0055ff]/20 to-[#00f2ff]/20 rounded-full blur-[100px]" />
      
      <div className="relative z-10 w-full max-w-[480px] px-4 py-8">
        {/* Outer glow */}
        <div className="absolute -inset-[1px] rounded-[2.2rem] bg-gradient-to-br from-white/80 via-blue-100/30 to-white/60 pointer-events-none z-0 blur-[2px]" />
        
        {/* Glass card */}
        <div
            className="relative z-10 rounded-[2rem] p-8 sm:p-10"
            style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(60px) saturate(200%) brightness(1.05)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.05)',
                border: '1px solid rgba(255,255,255,0.70)',
                boxShadow: '0 24px 80px rgba(0,60,200,0.08), 0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.90)',
            }}
        >
            {/* Inner top shimmer */}
            <div className="absolute top-0 left-16 right-16 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
            
            <Outlet />
        </div>
      </div>
    </div>
  );
}
