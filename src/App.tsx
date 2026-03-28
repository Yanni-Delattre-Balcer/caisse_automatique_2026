import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

// Layouts
import { LandingLayout } from './layouts/LandingLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PosPage } from './pages/PosPage';
import { RemoteScannerView } from './features/scanner/RemoteScannerView';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const syncOfflineQueue = useCartStore((state) => state.syncOfflineQueue);

  // Restaurer la session Supabase au démarrage de l'app
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Synchroniser les ventes offline dès que le réseau revient
  useEffect(() => {
    syncOfflineQueue();
    window.addEventListener('online', syncOfflineQueue);
    return () => window.removeEventListener('online', syncOfflineQueue);
  }, [syncOfflineQueue]);

  return (
    <Routes>
      {/* Vitrine Commerciale */}
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Authentification */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Interface POS (Caissiers & Admins) */}
      <Route element={<DashboardLayout />}>
        <Route path="/pos" element={<PosPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<div className="flex items-center justify-center h-full text-gray-500 font-medium text-lg">Inventaire (En cours de construction...)</div>} />
        <Route path="/scanner-setup" element={<RemoteScannerView />} />
        <Route path="/settings" element={<div className="flex items-center justify-center h-full text-gray-500 font-medium text-lg">Paramètres du commerce (En cours de construction...)</div>} />
      </Route>
    </Routes>
  );
}
