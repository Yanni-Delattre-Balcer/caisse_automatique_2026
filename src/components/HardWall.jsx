import React from 'react';
import { ShieldAlert, DownloadCloud, LogOut, CreditCard, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

export function HardWall() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleExport = async () => {
    try {
      if (!user?.businessId) return;
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('business_id', user.businessId)
        .order('created_at', { ascending: false });

      if (!sales || sales.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
      }

      const exportData = sales.map((s) => ({
        Date: new Date(s.created_at).toLocaleDateString('fr-FR'),
        Heure: new Date(s.created_at).toLocaleTimeString('fr-FR'),
        Total_TTC: s.total_ttc,
        Methode: s.payment_method,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Ventes_Heryze_Export');
      XLSX.writeFile(wb, `heryze_rescue_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#121212] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center relative shadow-sm">
            <ShieldAlert className="w-10 h-10 text-blue-500" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-25" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
          Période d'essai terminée
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-10">
          Votre période de découverte de 14 jours est arrivée à échéance. 
          Pour continuer à utiliser l'intégralité de vos outils Heryze, 
          veuillez activer votre abonnement.
        </p>

        <div className="space-y-4">
          {/* Action principale */}
          <button
            onClick={() => navigate('/checkout-summary?plan=starter')}
            className="w-full bg-[#0055ff] hover:bg-[#0044cc] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-3"
          >
            <CreditCard className="w-5 h-5" />
            Débloquer mon espace
          </button>

          {/* Garantie éthique : Export */}
          <button
            onClick={handleExport}
            className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <DownloadCloud className="w-5 h-5 text-emerald-500" />
            Récupérer mon travail (.xlsx)
          </button>
        </div>

        <div className="mt-12 pt-12 border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-6">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="text-red-400/60 hover:text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Supprimer mon compte définitivement
          </button>
        </div>
      </div>
    </div>
  );
}
