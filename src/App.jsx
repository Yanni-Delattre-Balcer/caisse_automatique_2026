import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingLayout } from './layouts/LandingLayout';
import { LandingPage } from './pages/LandingPage';
import { AuthLayout } from './layouts/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PosPage } from './pages/PosPage';
import { RemoteScannerView } from './features/scanner/RemoteScannerView';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
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
