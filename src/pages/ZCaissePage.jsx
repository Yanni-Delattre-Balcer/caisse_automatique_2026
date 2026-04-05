import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { BarChart3, TrendingUp, CreditCard, Banknote, Package, Download, X } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

function formatCurrency(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

export function ZCaissePage() {
  const { user, isDemo } = useAuthStore();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);

  // Charger les ventes du jour
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isDemo) {
      // Données démo fictives
      setSales([
        { id: '1', total_ttc: 12.50, payment_method: 'CB', items: [{ name: 'Pain au Chocolat', quantity: 3, price: 1.20 }, { name: 'Café Expresso', quantity: 2, price: 1.50 }], created_at: new Date(today.getTime() + 3600000).toISOString() },
        { id: '2', total_ttc: 7.80, payment_method: 'Espèces', items: [{ name: 'Baguette Tradition', quantity: 2, price: 1.30 }, { name: 'Croissant Beurre', quantity: 4, price: 1.10 }], created_at: new Date(today.getTime() + 7200000).toISOString() },
        { id: '3', total_ttc: 21.40, payment_method: 'CB', items: [{ name: 'Sandwich Jambon Beurre', quantity: 3, price: 4.80 }, { name: 'Jus d\'Orange Frais', quantity: 2, price: 3.50 }], created_at: new Date(today.getTime() + 10800000).toISOString() },
        { id: '4', total_ttc: 8.70, payment_method: 'Espèces', items: [{ name: 'Eclair Chocolat', quantity: 2, price: 2.80 }, { name: 'Café Expresso', quantity: 2, price: 1.50 }], created_at: new Date(today.getTime() + 14400000).toISOString() },
      ]);
      setLoading(false);
      return;
    }

    supabase
      .from('sales')
      .select('*')
      .eq('business_id', user?.businessId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setSales(data || []);
        setLoading(false);
      });
  }, [user?.businessId, isDemo]);

  // Calculs statistiques
  const totalCA = sales.reduce((sum, s) => sum + (s.total_ttc || 0), 0);
  const totalCB = sales.filter(s => s.payment_method === 'CB').reduce((sum, s) => sum + s.total_ttc, 0);
  const totalEspeces = sales.filter(s => s.payment_method === 'Espèces').reduce((sum, s) => sum + s.total_ttc, 0);
  const nbTransactions = sales.length;
  const panierMoyen = nbTransactions > 0 ? totalCA / nbTransactions : 0;

  // Ventilation par catégorie via les items
  const byCategory = {};
  sales.forEach(sale => {
    (sale.items || []).forEach(item => {
      const cat = item.category || item.name || 'Divers';
      byCategory[cat] = (byCategory[cat] || 0) + item.price * item.quantity;
    });
  });

  // Export CSV
  const handleExport = () => {
    const today = new Date().toLocaleDateString('fr-FR');
    const rows = [
      ['Date', 'Heure', 'Total TTC', 'Moyen de paiement', 'Articles'],
      ...sales.map(s => [
        new Date(s.created_at).toLocaleDateString('fr-FR'),
        new Date(s.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        s.total_ttc.toFixed(2),
        s.payment_method,
        (s.items || []).map(i => `${i.quantity}x ${i.name}`).join(' | ')
      ])
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Z-Caisse_Heryze_${today.replace(/\//g, '-')}.csv`;
    link.click();
    setShowExport(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#0055ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full p-2 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400">
            Z-Caisse
          </h1>
          <p className="text-zinc-500 font-medium">
            Clôture du {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button
          onPress={() => setShowExport(true)}
          className="bg-[#0055ff] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
          startContent={<Download className="w-4 h-4" />}
        >
          Exporter CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'CA du jour', value: formatCurrency(totalCA), icon: <TrendingUp className="w-5 h-5" />, color: 'text-[#0055ff]' },
          { label: 'Transactions', value: String(nbTransactions), icon: <BarChart3 className="w-5 h-5" />, color: 'text-emerald-400' },
          { label: 'Panier moyen', value: formatCurrency(panierMoyen), icon: <Package className="w-5 h-5" />, color: 'text-amber-400' },
          { label: 'Espèces', value: formatCurrency(totalEspeces), icon: <Banknote className="w-5 h-5" />, color: 'text-purple-400' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className={`mb-2 ${kpi.color}`}>{kpi.icon}</div>
            <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-zinc-500 font-semibold mt-1 uppercase tracking-wider">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Ventilation paiement */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Ventilation paiements</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#0055ff]" />
            <div>
              <div className="font-black text-white">{formatCurrency(totalCB)}</div>
              <div className="text-xs text-zinc-500">Carte Bancaire</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-black text-white">{formatCurrency(totalEspeces)}</div>
              <div className="text-xs text-zinc-500">Espèces</div>
            </div>
          </div>
        </div>

        {/* Barre de répartition */}
        <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#0055ff] rounded-full transition-all"
            style={{ width: totalCA > 0 ? `${(totalCB / totalCA) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>CB: {totalCA > 0 ? ((totalCB / totalCA) * 100).toFixed(0) : 0}%</span>
          <span>Espèces: {totalCA > 0 ? ((totalEspeces / totalCA) * 100).toFixed(0) : 0}%</span>
        </div>
      </div>

      {/* Dernières transactions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Transactions du jour ({nbTransactions})</h2>
        {sales.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-6">Aucune vente enregistrée aujourd'hui.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
            {[...sales].reverse().map((sale) => (
              <div key={sale.id} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  {sale.payment_method === 'CB' ? (
                    <CreditCard className="w-4 h-4 text-[#0055ff]" />
                  ) : (
                    <Banknote className="w-4 h-4 text-emerald-400" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {new Date(sale.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {(sale.items || []).length} article(s)
                    </div>
                  </div>
                </div>
                <span className="font-black text-[#0055ff]">{formatCurrency(sale.total_ttc)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmation export */}
      <AnimatePresence>
        {showExport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#1a1c1e] p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-2">Exporter la Z-Caisse</h3>
              <p className="text-sm text-gray-400 mb-6">
                Un fichier CSV sera téléchargé avec toutes les ventes du jour, prêt à envoyer à votre expert-comptable.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowExport(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-colors">Annuler</button>
                <Button onPress={handleExport} className="bg-[#0055ff] text-white font-bold rounded-xl" startContent={<Download className="w-4 h-4" />}>
                  Télécharger
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
