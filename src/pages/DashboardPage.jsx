import React, { useEffect, useState } from 'react';
import { RevenueChart } from '../features/dashboard/RevenueChart';
import { Card, Button } from '@heroui/react';
import { DownloadCloud, TrendingUp, Users, ShoppingBag, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

export function DashboardPage() {
  const { user, isDemo } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [stats, setStats] = useState({ dailyRevenue: 0, totalSales: 0, avgBasket: 0 });
  const [sales, setSales] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (isDemo) {
      // Données de démonstration
      setStats({ dailyRevenue: 1204.50, totalSales: 42, avgBasket: 28.67 });
      setWeeklyData([
        { name: 'Lun', total: 400 },
        { name: 'Mar', total: 300 },
        { name: 'Mer', total: 550 },
        { name: 'Jeu', total: 450 },
        { name: 'Ven', total: 800 },
        { name: 'Sam', total: 1200 },
        { name: 'Dim', total: 0 },
      ]);
      setSales([
        { created_at: '2026-03-31T10:15:00', total_ttc: 45.0, payment_method: 'CB', items: [] },
        { created_at: '2026-03-31T11:30:00', total_ttc: 22.0, payment_method: 'Espèces', items: [] },
        { created_at: '2026-03-31T14:20:00', total_ttc: 120.0, payment_method: 'CB', items: [] },
      ]);
      setLoading(false);
      return;
    }

    if (!user?.businessId) return;
    setLoading(true);

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

      // Ventes du jour
      const { data: todaySales, error } = await supabase
        .from('sales')
        .select('id, total_ttc, payment_method, items, created_at, cashier_name')
        .eq('business_id', user.businessId)
        .gte('created_at', startOfDay)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allTodaySales = todaySales || [];
      const dailyRevenue = allTodaySales.reduce((sum, s) => sum + Number(s.total_ttc), 0);
      const totalSales = allTodaySales.length;
      const avgBasket = totalSales > 0 ? dailyRevenue / totalSales : 0;

      setStats({ dailyRevenue, totalSales, avgBasket });
      setSales(allTodaySales);

      // Données hebdomadaires pour le graphique
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Lundi
      weekStart.setHours(0, 0, 0, 0);

      const { data: weekSales } = await supabase
        .from('sales')
        .select('total_ttc, created_at')
        .eq('business_id', user.businessId)
        .gte('created_at', weekStart.toISOString())
        .order('created_at', { ascending: true });

      const weekMap = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const dayName = dayNames[d.getDay()];
        weekMap[dayName] = 0;
      }

      (weekSales || []).forEach((s) => {
        const d = new Date(s.created_at);
        const dayName = dayNames[d.getDay()];
        weekMap[dayName] = (weekMap[dayName] || 0) + Number(s.total_ttc);
      });

      const ordered = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      setWeeklyData(ordered.map((name) => ({ name, total: Math.round((weekMap[name] || 0) * 100) / 100 })));
    } catch (err) {
      console.error('[Dashboard] Erreur:', err.message);
      addToast({ type: 'error', message: 'Erreur lors du chargement des données.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.businessId, isDemo]);

  const handleExport = () => {
    if (sales.length === 0) {
      addToast({ type: 'warning', message: 'Aucune vente à exporter.' });
      return;
    }
    const exportData = sales.map((s) => ({
      Date: new Date(s.created_at).toLocaleDateString('fr-FR'),
      Heure: new Date(s.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      'Montant TTC (€)': Number(s.total_ttc).toFixed(2),
      Paiement: s.payment_method,
      Articles: (s.items || []).map((i) => `${i.quantity}x ${i.name}`).join(', ') || '-',
      Caissier: s.cashier_name || '-',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Export_Comptable');
    XLSX.writeFile(wb, `heryze_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addToast({ type: 'success', message: 'Export comptable téléchargé.' });
  };

  return (
    <div className="flex flex-col gap-6 h-full p-2 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400">Analytiques</h1>
          <p className="text-zinc-500 font-medium">Suivez les performances globales de votre commerce.</p>
        </div>
        <div className="flex gap-3">
          <Button
            isIconOnly
            onPress={fetchDashboardData}
            isLoading={loading}
            className="bg-white/5 text-gray-400 hover:text-white border border-white/10 rounded-xl"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onPress={handleExport}
            className="bg-green-600/20 text-green-400 font-bold border border-green-500/30 hover:bg-green-600/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
            startContent={<DownloadCloud className="w-5 h-5" />}
          >
            Export Comptable
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/5 bg-blue-500/5 transition-transform hover:-translate-y-1">
          <div className="p-6 flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-400">CA du Jour (TTC)</p>
              <p className="text-3xl font-black text-zinc-100">
                {loading ? '...' : `${stats.dailyRevenue.toFixed(2)}€`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass border-white/5 bg-purple-500/5 transition-transform hover:-translate-y-1">
          <div className="p-6 flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-400">Ventes Totales</p>
              <p className="text-3xl font-black text-zinc-100">
                {loading ? '...' : stats.totalSales}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass border-white/5 bg-pink-500/5 transition-transform hover:-translate-y-1">
          <div className="p-6 flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-pink-500/20 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-400">Panier Moyen</p>
              <p className="text-3xl font-black text-zinc-100">
                {loading ? '...' : `${stats.avgBasket.toFixed(2)}€`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <RevenueChart data={weeklyData} loading={loading} />
      </div>
    </div>
  );
}
