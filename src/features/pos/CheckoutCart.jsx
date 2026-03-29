import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/useCartStore';

export function CheckoutCart() {
  const { cart, updateItemQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const total = getTotal();
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const handleConfirmClear = () => {
    clearCart();
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1c1e] rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/40 dark:shadow-none p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Commande en cours</h2>
          <p className="text-sm text-gray-500">{cart.reduce((acc, item) => acc + item.quantity, 0)} article(s)</p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
             <ShoppingCart className="w-12 h-12 opacity-20" />
             <span className="text-sm font-medium tracking-wide flex items-center gap-2">
               <ArrowLeft className="w-4 h-4 animate-pulse" />
               Appuyez sur un produit pour l'ajouter
             </span>
          </div>
        ) : (
          <AnimatePresence>
            {cart.map((item) => (
             <motion.div 
               key={item.id}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: 0.2 }}
               className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-gray-100 dark:border-transparent"
             >
               <div className="flex-1 pr-4 truncate">
                 <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate block">
                   {item.name}
                 </span>
               </div>
               
               <div className="flex items-center gap-4 shrink-0">
                 <div className="flex items-center gap-2">
                   <Button isIconOnly size="sm" variant="flat" className="h-7 w-7 min-w-7 bg-white dark:bg-white/10 dark:text-white rounded-full border border-gray-200 dark:border-transparent" onPress={() => updateItemQuantity(item.id, item.quantity - 1)}>
                     <Minus className="w-3 h-3" />
                   </Button>
                   <span className="text-sm font-bold w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                   <Button isIconOnly size="sm" variant="flat" className="h-7 w-7 min-w-7 bg-white dark:bg-white/10 dark:text-white rounded-full border border-gray-200 dark:border-transparent" onPress={() => updateItemQuantity(item.id, item.quantity + 1)}>
                     <Plus className="w-3 h-3" />
                   </Button>
                 </div>
                 <span className="font-bold text-sm text-[#0055ff] dark:text-[#3377ff] w-14 text-right">
                   {(item.price * item.quantity).toFixed(2)}€
                 </span>
               </div>
             </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="h-px w-full bg-gray-100 dark:bg-white/10 my-6" />

      {/* Totals & Actions */}
      <div className="space-y-4">
        <div className="flex justify-between items-end mb-4">
          <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total</span>
          <span className="text-[2.5rem] font-black tracking-tighter text-gray-900 dark:text-white leading-none">
            {total.toFixed(2)} <span className="text-2xl">€</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button className="h-14 w-full font-bold bg-[#262626] dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white shadow-md text-sm rounded-xl">
            C.B
          </Button>
          <Button className="h-14 w-full font-bold bg-[#262626] dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white shadow-md text-sm rounded-xl">
            Espèces
          </Button>
        </div>
        
        <div className="mt-4">
          <Button 
            variant="light" 
            color="danger" 
            className="w-full text-sm font-semibold h-12 rounded-xl text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            onPress={onOpen}
            isDisabled={cart.length === 0}
          >
            Annuler la commande
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#1a1c1e] p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-white/10"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vider le panier</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Voulez-vous vraiment annuler cette commande et vider le panier en cours ?
              </p>
              <div className="flex gap-3 justify-end items-center mt-4">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                  Non, fermer
                </button>
                <button onClick={handleConfirmClear} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 transition-all">
                  Oui, vider
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
