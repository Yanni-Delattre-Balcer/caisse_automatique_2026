import React from 'react';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useCartStore } from '../../store/useCartStore';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const QUICK_PRODUCT_LIMIT = 12;

export function QuickPosGrid() {
  const items = useCatalogStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  // Prendre les N premiers produits comme favoris rapides
  const quickItems = items.slice(0, QUICK_PRODUCT_LIMIT);

  if (quickItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
        <Zap className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">Aucun produit disponible.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <Zap className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Caisse Rapide — {quickItems.length} favoris
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-24 scrollbar-hide items-start content-start">
        {quickItems.map((item, idx) => (
          <motion.button
            key={item.id}
            onClick={() => addItem(item)}
            whileTap={{ scale: 0.93 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: idx * 0.03 }}
            className="relative flex flex-col justify-between h-[150px] p-4 rounded-2xl bg-white dark:bg-[#222222] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-[#0055ff]/30 dark:hover:border-[#0055ff]/30 transition-all text-left w-full group"
          >
            {/* Stock badge */}
            <div className="flex justify-between items-start w-full">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider truncate pr-2">
                {item.category}
              </span>
              {item.stock !== null && (
                <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center justify-center border shrink-0 ${
                  item.stock <= 5
                    ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10 dark:border-red-500/20'
                    : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/5'
                }`}>
                  {item.stock}
                </div>
              )}
            </div>

            <div className="flex flex-col items-start w-full mt-auto">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-left leading-tight mb-2 line-clamp-2 text-sm">
                {item.name}
              </h3>
              <span className="font-black text-2xl text-[#0055ff] tracking-tight group-hover:scale-105 transition-transform origin-left">
                {item.price.toFixed(2)}<span className="text-xl"> €</span>
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
