import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Clock, CreditCard, Banknote } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Hook simplifié de lecture d'une vente publique
function useSale(saleId) {
  const [sale, setSale] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!saleId) return;
    setLoading(true);
    supabase
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError('Ticket introuvable.');
        else setSale(data);
        setLoading(false);
      });
  }, [saleId]);

  return { sale, loading, error };
}

export function ReceiptPage() {
  const { saleId } = useParams();
  const { sale, loading, error } = useSale(saleId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0055ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-gray-500 p-6">
        <ShoppingBag className="w-16 h-16 opacity-20" />
        <h1 className="text-xl font-bold text-gray-700">Ticket introuvable</h1>
        <p className="text-sm text-center">Ce lien est invalide ou le ticket a expiré.</p>
        <Link to="/" className="mt-4 text-[#0055ff] font-bold text-sm hover:underline">← Retour à l'accueil</Link>
      </div>
    );
  }

  const date = new Date(sale.created_at);
  const PayIcon = sale.payment_method === 'Espèces' ? Banknote : CreditCard;

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6 pt-10 font-sans">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Paiement confirmé</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Votre achat a bien été enregistré
          </p>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Meta */}
          <div className="bg-gradient-to-br from-[#0055ff]/5 to-[#00f2ff]/5 p-6 border-b border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                <PayIcon className="w-4 h-4" />
                <span>{sale.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="p-6 space-y-3">
            {(sale.items || []).map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold text-gray-900">{item.name}</span>
                  <span className="text-gray-400 ml-2">× {item.quantity}</span>
                </div>
                <span className="font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-dashed border-gray-200 mx-6 mb-0" />
          <div className="p-6 pt-4 flex justify-between items-baseline">
            <span className="font-bold text-gray-700 uppercase text-xs tracking-widest">Total TTC</span>
            <span className="font-black text-3xl tracking-tighter text-[#0055ff]">
              {sale.total_ttc?.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Powered by */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            Ticket généré par{' '}
            <Link to="/" className="font-bold text-[#0055ff] hover:underline">Heryze</Link>
            {' '}— votre caisse enregistreuse intelligente
          </p>
        </div>
      </div>
    </div>
  );
}
