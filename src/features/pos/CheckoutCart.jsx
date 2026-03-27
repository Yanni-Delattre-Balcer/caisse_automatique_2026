import React from 'react';
import { Button } from '@heroui/react';
import { Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

export function CheckoutCart() {
  const { cart, updateItemQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const total = getTotal();

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-6">
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
             <ShoppingCart className="w-12 h-12 opacity-20" />
             <span className="text-sm font-bold tracking-wide">Panier vide</span>
          </div>
        ) : (
          cart.map((item) => (
           <div key={item.id} className="flex flex-col gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
             <div className="flex justify-between items-start">
               <span className="font-bold text-sm text-gray-900 leading-tight pr-4">{item.name}</span>
               <span className="font-black text-sm text-[#0055ff]">{(item.price * item.quantity).toFixed(2)}€</span>
             </div>
             <div className="flex justify-between items-center mt-1">
               <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                 <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                   <Minus className="w-3 h-3" />
                 </button>
                 <span className="text-sm font-bold w-4 text-center text-gray-900">{item.quantity}</span>
                 <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                   <Plus className="w-3 h-3" />
                 </button>
               </div>
               <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
           </div>
          ))
        )}
      </div>

      <div className="h-px w-full bg-gray-100 my-6" />

      {/* Totals & Actions */}
      <div className="space-y-6">
        <div className="flex justify-between items-end bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Total à payer</span>
          <span className="text-4xl font-black tracking-tighter text-[#0055ff]">
            {total.toFixed(2)}€
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button color="primary" className="h-16 w-full font-bold bg-[#0055ff] text-white shadow-xl shadow-blue-500/30 hover:bg-[#0044cc] text-md rounded-2xl">
            <CreditCard className="w-5 h-5 mr-2" /> C.B
          </Button>
          <Button className="h-16 w-full font-bold bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 text-md rounded-2xl">
            <Banknote className="w-5 h-5 mr-2" /> Espèces
          </Button>
        </div>
        
        <Button 
          variant="flat" 
          color="danger" 
          className="w-full text-xs font-bold h-12 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl"
          onPress={clearCart}
          isDisabled={cart.length === 0}
        >
          Annuler la commande
        </Button>
      </div>
    </div>
  );
}
