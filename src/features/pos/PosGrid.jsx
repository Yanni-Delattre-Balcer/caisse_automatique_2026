import React from 'react';
import { Card, Chip } from '@heroui/react';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useCartStore } from '../../store/useCartStore';

export function PosGrid() {
  const items = useCatalogStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);

  const categories = [...new Set(items.map(i => i.category))];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Chip className="cursor-pointer px-5 font-bold bg-[#0055ff] text-white shadow-md shadow-blue-500/20">Tous</Chip>
        {categories.map(cat => (
          <Chip key={cat} variant="flat" className="cursor-pointer px-5 font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            {cat}
          </Chip>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20 scrollbar-hide">
        {items.map((item) => (
          <Card 
            key={item.id} 
            isPressable 
            onPress={() => addItem(item)}
            className="bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all h-32 flex flex-col justify-between"
            shadow="none"
          >
            <div className="p-4 flex-1 flex flex-col items-start text-left w-full">
              <h3 className="font-bold text-sm text-gray-900 leading-tight">{item.name}</h3>
              <span className="text-xs font-medium text-gray-400 mt-1">{item.category}</span>
            </div>
            <div className="px-4 py-3 bg-gray-50/80 flex justify-between items-center rounded-b-xl border-t border-gray-100 w-full">
              <span className="font-black text-[#0055ff]">{item.price.toFixed(2)}€</span>
              {item.stock !== null && (
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{item.stock} en stock</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
