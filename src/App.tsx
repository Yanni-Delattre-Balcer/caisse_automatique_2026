import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

// Layouts
import { LandingLayout } from './layouts/LandingLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LandingV2Layout } from './layouts/LandingV2Layout';
import { NexusLayout } from './layouts/NexusLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LandingPageV2 } from './pages/LandingPageV2';
import { NexusPropPage } from './pages/NexusPropPage';
import { HeryzePage } from './pages/HeryzePage';
import { NexusLeadershipPage } from './pages/NexusLeadershipPage';
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
import { OnboardingPage } from './pages/OnboardingPage';
import { RemoteScannerView } from './features/scanner/RemoteScannerView';
import { CheckoutSummaryPage } from './pages/CheckoutSummaryPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';

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
      {/* Vitrine Commerciale (Legacy) */}
      <Route element={<LandingLayout />}>
        <Route path="/old-landingpage" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      {/* Landing Page V2 — Apple Style Review */}
      <Route element={<LandingV2Layout />}>
        <Route path="/landing-v2" element={<LandingPageV2 />} />
      </Route>

      {/* Nexus Hub (New Home & Ecosystem) */}
      <Route element={<NexusLayout />}>
        <Route path="/nexus-prop" element={<NexusPropPage />} />
        <Route path="/nexus-leadership" element={<NexusLeadershipPage />} />
        <Route path="/" element={<HeryzePage />} />
      </Route>

      {/* Ticket public — sans authentification */}
      <Route path="/receipt/:saleId" element={<ReceiptPage />} />

      {/* Onboarding post-inscription — standalone, pas de sidebar */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Authentification */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Tunnel d'Abonnement */}
      <Route path="/checkout-summary" element={<CheckoutSummaryPage />} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />

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
