import React, { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Settings, Smartphone, Utensils, LogOut } from "lucide-react";
import { useAuthStore } from '../store/useAuthStore';
import { useCatalogStore } from '../store/useCatalogStore';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const hydrateForDomain = useCatalogStore(state => state.hydrateForDomain);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.businessDomain) {
      hydrateForDomain(user.businessDomain);
    }
  }, [isAuthenticated, navigate, user, hydrateForDomain]);

  if (!isAuthenticated || !user) return null;

  const baseNavItems = [
    { name: "Caisse", path: "/pos", icon: <ShoppingCart className="w-5 h-5" /> },
    { name: "Analytiques", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Inventaire", path: "/inventory", icon: <Package className="w-5 h-5" /> },
    // Only show "Gestion des Tables" if domain is Restauration
    ...(user.businessDomain === "Restauration" ? [{ name: "Tables", path: "/tables", icon: <Utensils className="w-5 h-5" /> }] : []),
    { name: "Scanner Mobile", path: "/scanner-setup", icon: <Smartphone className="w-5 h-5" /> },
    { name: "Paramètres", path: "/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-[#f4f6f8] text-gray-900 overflow-hidden selection:bg-blue-500/30 font-sans">
      {/* Sidebar */}
      <aside className="relative z-10 w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col">
        <div className="flex items-center h-20 px-8 border-b border-gray-100">
          <h1 className="text-2xl font-black bg-gradient-to-br from-[#00f2ff] to-[#0055ff] bg-clip-text text-transparent tracking-tight">
            OmniPOS
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {baseNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-blue-50 text-[#0055ff] shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
            >
              {item.icon}
              <span className="text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00f2ff] to-[#0055ff] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-500/20">
              {user.companyName.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{user.companyName}</p>
              <p className="text-xs text-blue-600 font-medium truncate">{user.businessDomain}</p>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        {/* Header */}
        <header className="h-20 border-b border-gray-200/60 bg-white/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-bold text-gray-600 tracking-wide uppercase">Caisse En Ligne</span>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
