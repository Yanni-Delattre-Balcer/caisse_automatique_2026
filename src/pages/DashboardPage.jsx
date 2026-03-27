import React from 'react';
import { RevenueChart } from '../features/dashboard/RevenueChart';
import { Card, Button } from '@heroui/react';
import { DownloadCloud, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import * as XLSX from 'xlsx';

export function DashboardPage() {
  
  const handleExport = () => {
    // Generate a simple Excel file for Accounting (Export Comptable)
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      { Date: '2026-03-24', Heure: '10:15', Client: 'Client A', Montant: 45.0, Paiement: 'CB' },
      { Date: '2026-03-24', Heure: '11:30', Client: 'Client B', Montant: 22.0, Paiement: 'Espèces' },
      { Date: '2026-03-24', Heure: '14:20', Client: 'Client C', Montant: 120.0, Paiement: 'CB' }
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Compta_Export");
    XLSX.writeFile(wb, "omnipos_export_compta.xlsx");
  };

  return (
    <div className="flex flex-col gap-6 h-full p-2 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">Analytiques</h1>
          <p className="text-zinc-500 font-medium">Suivez les performances globales de votre commerce.</p>
        </div>
        <Button 
          onPress={handleExport}
          className="bg-green-600/20 text-green-400 font-bold border border-green-500/30 hover:bg-green-600/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
          startContent={<DownloadCloud className="w-5 h-5" />}
        >
          Export Comptable
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/5 bg-blue-500/5 transition-transform hover:-translate-y-1">
          <div className="p-6 flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-400">CA du Jour (TTC)</p>
              <p className="text-3xl font-black text-zinc-100">1,204.50€</p>
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
              <p className="text-3xl font-black text-zinc-100">42</p>
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
              <p className="text-3xl font-black text-zinc-100">28.67€</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <RevenueChart />
      </div>
    </div>
  );
}
