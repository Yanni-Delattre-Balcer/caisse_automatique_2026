import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Settings, Smartphone, Utensils, LogOut, Sun, Moon, Search, Zap, BarChart3, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useAuthStore } from '../store/useAuthStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useConfigStore } from '../store/useConfigStore';
import { useCartStore } from '../store/useCartStore';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isDemo, loginAsDemo, logout } = useAuthStore();
  const hydrateForDomain = useCatalogStore(state => state.hydrateForDomain);
  const lowStockCount = useCatalogStore(state =>
    state.items.reduce((n, i) => n + (i.stock !== null && i.stock <= 5 ? 1 : 0), 0)
  );
  const { theme, toggleTheme } = useConfigStore();
  const syncOfflineQueue = useCartStore(state => state.syncOfflineQueue);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync & online status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await syncOfflineQueue().catch(() => {});
      setIsSyncing(false);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineQueue]);

  // Garde d'authentification — redirige ou active le mode démo via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true' && !isDemo) {
      loginAsDemo();
    } else if (!isAuthenticated && params.get('demo') !== 'true') {
      navigate('/login');
    }
  }, [isAuthenticated, isDemo, navigate, loginAsDemo]);

  // Hydratation du catalogue — uniquement quand le domaine métier change
  useEffect(() => {
    if (user?.businessDomain) {
      hydrateForDomain(user.businessDomain);
    }
  }, [user?.businessDomain, hydrateForDomain]);

  if (!isAuthenticated || !user) return null;

  const baseNavItems = [
    { name: "Caisse Rapide", path: "/pos/quick", icon: <Zap className="w-5 h-5" /> },
    { name: "Caisse Complète", path: "/pos", icon: <ShoppingCart className="w-5 h-5" /> },
    { name: "Analytiques", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Inventaire", path: "/inventory", icon: <Package className="w-5 h-5" />, badge: lowStockCount },
    // Only show "Gestion des Tables" if domain is Restauration
    ...(user.businessDomain === "Restauration" ? [{ name: "Tables", path: "/tables", icon: <Utensils className="w-5 h-5" /> }] : []),
    { name: "Scanner Mobile", path: "/scanner-setup", icon: <Smartphone className="w-5 h-5" /> },
    { name: "Z-Caisse", path: "/z-caisse", icon: <BarChart3 className="w-5 h-5" /> },
    { name: "Paramètres", path: "/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] dark:bg-[#151515] text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Rail Sidebar */}
      <aside className="relative z-20 w-[72px] bg-white/70 dark:bg-[#1e1e1e]/70 backdrop-blur-md border-r border-gray-200 dark:border-white/10 shadow-sm flex flex-col items-center py-6 transition-colors duration-300">
        <div className="flex flex-col items-center mb-8 gap-1">
          <div className="font-black text-transparent bg-clip-text bg-linear-to-br from-[#00f2ff] to-[#0055ff] text-xs leading-tight text-center px-1 tracking-tight">
            Heryze
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-4 w-full px-3">
          {baseNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={item.name}
              className={({ isActive }) =>
                `relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 dark:bg-[#0055ff]/10 text-[#0055ff] shadow-sm ring-1 ring-[#0055ff]/20"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                }`
              }
            >
              {item.icon}
              {/* Badge stock bas */}
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-4 mt-auto">
          {/* Sync Indicator */}
          <div title={isOnline ? (isSyncing ? 'Synchronisation...' : 'En ligne') : 'Hors ligne'}
            className="flex items-center justify-center w-10 h-10 rounded-full">
            {!isOnline ? (
              <WifiOff className="w-4 h-4 text-red-400" />
            ) : isSyncing ? (
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4 text-green-500" />
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title="Basculer le thème"
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User & Logout */}
          <div className="flex flex-col items-center gap-3">
            <div title={user.companyName} className="w-10 h-10 rounded-full bg-linear-to-tr from-[#00f2ff] to-[#0055ff] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-500/20">
              {user.companyName.substring(0,2).toUpperCase()}
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              title="Se déconnecter"
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        {/* Header (Top Bar as in Mockup) */}
        <header className="h-[72px] border-b border-gray-200/60 dark:border-white/5 bg-transparent flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Caisse en ligne &middot; {user.companyName}</span>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#0055ff]/50 transition-shadow text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
