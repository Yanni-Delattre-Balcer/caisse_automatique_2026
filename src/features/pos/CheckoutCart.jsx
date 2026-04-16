import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { Plus, Minus, CreditCard, Banknote, ShoppingCart, ArrowLeft, CheckCircle2, Receipt, X, QrCode, Tag, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';

const RECEIPT_BASE_URL = window.location.origin;

export function CheckoutCart() {
  const { cart, updateItemQuantity, clearCart, getTotal, getRawTotal, getDiscountAmount, discount, applyDiscount, clearDiscount, checkout } = useCartStore();
  const addToast = useToastStore((s) => s.addToast);
  const total = getTotal();
  const rawTotal = getRawTotal();
  const discountAmount = getDiscountAmount();

  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [cashGiven, setCashGiven] = useState('');
  const [showCashModal, setShowCashModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [customDiscount, setCustomDiscount] = useState('');

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const change = cashGivenNum - total;

  const handleCheckout = async (method) => {
    if (cart.length === 0) {
      addToast({ type: 'warning', message: 'Le panier est vide.' });
      return;
    }
    if (method === 'Espèces' && !showCashModal) {
      setShowCashModal(true);
      return;
    }
    setIsProcessing(true);
    try {
      const sale = await checkout(method);
      setLastSale(sale);
      setShowCashModal(false);
      setCashGiven('');
      addToast({ type: 'success', message: `Paiement de ${sale.total_ttc.toFixed(2)}€ par ${method} enregistré !`, duration: 5000 });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Erreur lors du paiement.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmCashPayment = () => {
    if (cashGivenNum < total) { addToast({ type: 'warning', message: 'Montant insuffisant.' }); return; }
    handleCheckout('Espèces');
  };

  const receiptUrl = lastSale?.id ? `${RECEIPT_BASE_URL}/receipt/${lastSale.id}` : null;

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
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate block">{item.name}</span>
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

      <div className="h-px w-full bg-gray-100 dark:bg-white/10 my-4" />

      {/* Remise rapide */}
      <div className="flex items-center justify-between mb-4">
        {discount ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <Tag className="w-3 h-3" />
              {discount.type === 'percent' ? `-${discount.value}%` : `-${discount.value.toFixed(2)}€`}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-xs">−{discountAmount.toFixed(2)}€</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">Aucune remise</span>
        )}
        <button
          onClick={() => { setCustomDiscount(''); setShowDiscountModal(true); }}
          disabled={cart.length === 0}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0055ff] hover:text-[#0044cc] disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors"
        >
          <Percent className="w-3.5 h-3.5" />
          {discount ? 'Modifier' : 'Remise'}
        </button>
      </div>

      <div className="h-px w-full bg-gray-100 dark:bg-white/10 mb-4" />

      {/* Totals & Actions */}
      <div className="space-y-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider block mb-1">Total</span>
            {discount && (
              <span className="text-xs text-gray-400 line-through">{rawTotal.toFixed(2)}€</span>
            )}
          </div>
          <span className="text-[2.5rem] font-black tracking-tighter text-gray-900 dark:text-white leading-none">
            {total.toFixed(2)} <span className="text-2xl">€</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onPress={() => handleCheckout('CB')}
            isDisabled={cart.length === 0 || isProcessing}
            isLoading={isProcessing}
            startContent={!isProcessing && <CreditCard className="w-4 h-4" />}
            className="h-14 w-full font-bold bg-[#262626] dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white shadow-md text-sm rounded-xl disabled:opacity-50"
          >
            C.B
          </Button>
          <Button
            onPress={() => handleCheckout('Espèces')}
            isDisabled={cart.length === 0 || isProcessing}
            startContent={<Banknote className="w-4 h-4" />}
            className="h-14 w-full font-bold bg-[#262626] dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white shadow-md text-sm rounded-xl disabled:opacity-50"
          >
            Espèces
          </Button>
        </div>

        <div className="mt-4">
          <Button
            variant="light" color="danger"
            className="w-full text-sm font-semibold h-12 rounded-xl text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            onPress={() => setIsOpen(true)}
            isDisabled={cart.length === 0}
          >
            Annuler la commande
          </Button>
        </div>
      </div>

      {/* ── Modal Annulation ── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#1a1c1e] p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-white/10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vider le panier</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Voulez-vous vraiment annuler cette commande et vider le panier en cours ?
              </p>
              <div className="flex gap-3 justify-end items-center mt-4">
                <button onClick={() => setIsOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                  Non, fermer
                </button>
                <button onClick={() => { clearCart(); setIsOpen(false); addToast({ type: 'info', message: 'Commande annulée.' }); }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 transition-all">
                  Oui, vider
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Rendu Monnaie ── */}
      <AnimatePresence>
        {showCashModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#1a1c1e] p-7 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Paiement Espèces</h3>
                <button onClick={() => { setShowCashModal(false); setCashGiven(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 font-medium mb-1">Total à régler</div>
                <div className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white">
                  {total.toFixed(2)} <span className="text-3xl">€</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Montant remis</label>
                <div className="relative">
                  <input
                    type="number" step="0.01" min={total}
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder={total.toFixed(2)}
                    className="w-full text-2xl font-black px-5 py-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:border-[#0055ff] transition-colors"
                    autoFocus
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">€</span>
                </div>
              </div>

              {cashGiven && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-4 mb-6 text-center ${change >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'}`}>
                  <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">
                    {change >= 0 ? 'Monnaie à rendre' : 'Montant insuffisant'}
                  </div>
                  <div className={`text-4xl font-black tracking-tighter ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {change >= 0 ? change.toFixed(2) : (total - cashGivenNum).toFixed(2)} <span className="text-2xl">€</span>
                  </div>
                </motion.div>
              )}

              <Button
                onPress={confirmCashPayment}
                isLoading={isProcessing}
                isDisabled={cashGivenNum < total || isProcessing}
                className="w-full h-14 bg-[#0055ff] text-white font-bold rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20 disabled:opacity-50"
                startContent={!isProcessing && <Banknote className="w-4 h-4" />}
              >
                Valider le paiement
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Remise ── */}
      <AnimatePresence>
        {showDiscountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#1a1c1e] p-7 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Appliquer une remise</h3>
                <button onClick={() => setShowDiscountModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Presets % */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pourcentage</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[5, 10, 15, 20].map(pct => (
                  <button key={pct} onClick={() => { applyDiscount('percent', pct); setShowDiscountModal(false); addToast({ type: 'success', message: `Remise de ${pct}% appliquée.` }); }}
                    className={`py-3 rounded-xl font-black text-sm transition-all ${discount?.type === 'percent' && discount?.value === pct ? 'bg-[#0055ff] text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-[#0055ff]/10 hover:text-[#0055ff]'}`}>
                    -{pct}%
                  </button>
                ))}
              </div>

              {/* Montant fixe libre */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Montant fixe (€)</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input type="number" step="0.01" min="0" max={rawTotal}
                    value={customDiscount}
                    onChange={e => setCustomDiscount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:border-[#0055ff] transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                </div>
                <button
                  onClick={() => {
                    const v = parseFloat(customDiscount);
                    if (!v || v <= 0) { addToast({ type: 'warning', message: 'Montant invalide.' }); return; }
                    if (v >= rawTotal) { addToast({ type: 'warning', message: 'Remise supérieure ou égale au total.' }); return; }
                    applyDiscount('fixed', v);
                    setShowDiscountModal(false);
                    addToast({ type: 'success', message: `Remise de ${v.toFixed(2)}€ appliquée.` });
                  }}
                  className="px-4 py-3 bg-[#0055ff] text-white rounded-xl font-bold text-sm hover:bg-[#0044cc] transition-colors"
                >
                  OK
                </button>
              </div>

              {discount && (
                <button onClick={() => { clearDiscount(); setShowDiscountModal(false); addToast({ type: 'info', message: 'Remise supprimée.' }); }}
                  className="w-full mt-4 py-2.5 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                  Supprimer la remise
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Reçu + QR Code ── */}
      <AnimatePresence>
        {lastSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1a1c1e] p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-white/10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Paiement validé</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {lastSale.payment_method} — {new Date(lastSale.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>

              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-5 text-left space-y-2">
                {(lastSale.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{item.quantity}x {item.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(item.price * item.quantity).toFixed(2)}€</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-white/10 pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Total TTC</span>
                  <span className="font-black text-lg text-[#0055ff]">{lastSale.total_ttc?.toFixed(2)}€</span>
                </div>
              </div>

              {/* QR Code */}
              {receiptUrl && lastSale.id && (
                <div className="mb-5">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium mb-3">
                    <QrCode className="w-3.5 h-3.5" />
                    Ticket numérique — à scanner par le client
                  </div>
                  <div className="flex justify-center p-3 bg-white rounded-2xl border border-gray-100 mx-auto w-fit">
                    <QRCodeSVG value={receiptUrl} size={110} fgColor="#0055ff" />
                  </div>
                </div>
              )}

              <button onClick={() => setLastSale(null)}
                className="w-full py-3 bg-[#0055ff] hover:bg-[#0044cc] text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <Receipt className="w-4 h-4" />
                Fermer le reçu
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
