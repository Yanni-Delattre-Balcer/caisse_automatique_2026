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
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PosPage } from './pages/PosPage';
import { QuickPosPage } from './pages/QuickPosPage';
import { ZCaissePage } from './pages/ZCaissePage';
import { ReceiptPage } from './pages/ReceiptPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { RemoteScannerView } from './features/scanner/RemoteScannerView';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const syncOfflineQueue = useCartStore((state) => state.syncOfflineQueue);

  useEffect(() => { initializeAuth(); }, [initializeAuth]);

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
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      {/* Ticket public — sans authentification */}
      <Route path="/receipt/:saleId" element={<ReceiptPage />} />

      {/* Authentification */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Interface POS (Caissiers & Admins) */}
      <Route element={<DashboardLayout />}>
        <Route path="/pos/quick" element={<QuickPosPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route path="/z-caisse" element={<ZCaissePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/scanner-setup" element={<RemoteScannerView />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
