import React from 'react';
import { Card } from '@heroui/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Lun', total: 400 },
  { name: 'Mar', total: 300 },
  { name: 'Mer', total: 550 },
  { name: 'Jeu', total: 450 },
  { name: 'Ven', total: 800 },
  { name: 'Sam', total: 1200 },
  { name: 'Dim', total: 0 },
];

export function RevenueChart() {
  return (
    <Card className="glass border-white/5 w-full h-[400px]">
      <div className="px-6 pt-6 pb-0">
        <h3 className="text-xl font-bold text-zinc-200">Revenus de la semaine</h3>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{fill: '#9ca3af', fontSize: 12}} dy={10} axisLine={false} tickLine={false} />
            <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}€`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value) => [`${value}€`, 'Chiffre d\'Affaires']}
            />
            <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
