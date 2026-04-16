import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Shield, AlertCircle, ArrowLeft, Loader2, DownloadCloud } from 'lucide-react';
import { redirectToCheckout } from '../lib/stripe';
import { useAuthStore } from '../store/useAuthStore';

const PLANS = {
  starter: {
    label: 'Starter (Solo)',
    price: '19',
    priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER || '',
    features: ['1 accès', 'Gestion des inventaires', 'Exports comptables'],
  },
  business: {
    label: 'Business (Multi)',
    price: '39',
    priceId: import.meta.env.VITE_STRIPE_PRICE_BUSINESS || '',
    features: ['5 accès simultanés', 'Gestion fine des stocks', 'Dashboard Analytique'],
  }
};

export function CheckoutSummaryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planType = searchParams.get('plan') || 'starter';
  const plan = PLANS[planType];
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calcul de la date de fin (J+14)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14);
  const formattedEndDate = endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      // Rediriger vers l'inscription en gardant en mémoire le choix
      navigate(`/register?plan=${planType}`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      if (!plan.priceId) {
        throw new Error("L'identifiant du produit (Price ID) est manquant. Vérifiez votre configuration.");
      }
      await redirectToCheckout(plan.priceId, planType);
      // La redirection Stripe a eu lieu — on remet le bouton en état normal
      // au cas où l'utilisateur revient en arrière depuis Stripe
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans text-gray-900">
      <div className="max-w-4xl w-full">
        
        {/* Navigation retour */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </button>

        <div className="grid md:grid-cols-[1fr_350px] gap-8">
          
          {/* Colonne de gauche : Explications & Rassurance */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Activation de l'essai gratuit</h1>
              <p className="text-gray-500 text-lg">
                Vous avez choisi l'offre <strong className="text-gray-900">{plan.label}</strong>. Excellente décision.
              </p>
            </div>

            {/* Encadré de contexte B2B Transparent */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0055ff]" />
                Notre promesse transparence
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-1 mt-0.5"><Check className="w-4 h-4 text-green-600" /></div>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    <strong className="text-gray-900">14 jours offerts</strong> pour tester notre solution dans sa totalité, sans bridage.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-0.5"><Check className="w-4 h-4 text-blue-600" /></div>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    <strong className="text-gray-900">La garantie récupération :</strong> Au terme de ces 14 jours, si vous n'êtes pas convaincu, vous pourrez alors exporter et récupérer tout votre travail (produits, factures) en un clic et sans aucun frais, puis annuler.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-gray-100 rounded-full p-1 mt-0.5"><Check className="w-4 h-4 text-gray-600" /></div>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    <strong className="text-gray-900">0€ aujourd'hui.</strong> Vos coordonnées sont requises pour sécuriser le compte et éviter les abus, mais <span className="underline decoration-green-400 decoration-2">aucun prélèvement ne sera effectué</span> avant la fin de la période d'essai.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Colonne de droite : Ticket/Récapitulatif */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden sticky top-8">
              {/* Entête Ticket */}
              <div className="bg-[#0055ff] p-6 text-white">
                <p className="text-xs font-black tracking-widest uppercase opacity-80 mb-1">Plan sélectionné</p>
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-black">{plan.label}</h2>
                  <div className="text-right">
                    <span className="text-3xl font-black">{plan.price}</span>
                    <span className="text-sm font-medium opacity-80 pl-1">€/mois</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <Check className="w-4 h-4 text-[#0055ff] shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                <hr className="border-gray-100 my-4" />

                <div className="bg-gray-50 rounded-xl p-4 text-sm font-medium text-gray-500 mb-6 text-center">
                  Votre essai se termine le <strong>{formattedEndDate}</strong>.<br />
                  Sauf résiliation avant cette date, vous serez prélevé de {plan.price} €/mois à partir du {formattedEndDate}.
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full bg-[#0055ff] hover:bg-[#0044cc] text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sécuriser mon compte (0€)'}
                </button>
              </div>
            </div>

            {/* Lien alternatif */}
            <div className="text-center mt-6">
              <button 
                onClick={() => navigate('/#pricing')}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest"
              >
                Changer de plan
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
