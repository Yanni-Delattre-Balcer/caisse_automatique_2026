import React, { useState } from 'react';
import { Card } from '@heroui/react';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useCartStore } from '../../store/useCartStore';

export function PosGrid() {
  const items = useCatalogStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  const [activeCategory, setActiveCategory] = useState('Tous');

  const categories = ['Tous', ...new Set(items.map(i => i.category))];

  const filteredItems = activeCategory === 'Tous' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
        {categories.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap shadow-sm border ${
                isActive
                  ? 'bg-[#0055ff] border-[#0055ff] text-white shadow-[#0055ff]/20'
                  : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-24 scrollbar-hide items-start content-start">
        {filteredItems.map((item) => (
          <Card 
            key={item.id} 
            isPressable 
            onPress={() => addItem(item)}
            className="bg-white dark:bg-[#222222] border-[0.5px] border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md h-[150px] flex flex-col justify-between p-4 rounded-2xl w-full"
            shadow="none"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                {item.category}
              </span>
              {item.stock !== null && (
                <div className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 dark:text-gray-400 px-2.5 py-0.5 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/5">
                  {item.stock}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-start w-full mt-auto">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-left leading-tight mb-2 line-clamp-2">
                {item.name}
              </h3>
              <span className="font-black text-2xl text-[#0055ff] tracking-tight">
                {item.price.toFixed(2)} <span className="text-xl">€</span>
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
