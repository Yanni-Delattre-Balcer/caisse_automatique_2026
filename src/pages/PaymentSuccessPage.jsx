import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function PaymentSuccessPage() {
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const navigate = useNavigate();
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    if (!user?.businessId) {
      navigate('/login');
      return;
    }

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('subscription_status')
        .eq('id', user.businessId)
        .single();

      if (!error && data?.subscription_status === 'active') {
        setSuccess(true);
        clearInterval(interval);
        setTimeout(async () => {
          await initialize();
          navigate('/dashboard');
        }, 2000);
        return;
      }

      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= 10) {
          clearInterval(interval);
          setTimedOut(true);
        }
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [user?.businessId, navigate, initialize]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans text-gray-900">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 text-center border border-gray-100">

        {success && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 animate-[scale-in_0.3s_ease-out]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-3">Compte activé !</h2>
            <p className="text-gray-500 font-medium text-sm">
              Votre essai de 14 jours commence maintenant. Redirection...
            </p>
            <div className="mt-5 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 animate-[progress_2s_linear]" />
            </div>
          </div>
        )}

        {!success && timedOut && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-3">Paiement reçu, activation en cours</h2>
            <p className="text-gray-500 font-medium text-sm mb-6">
              Stripe a bien validé votre paiement. Notre système finalise l'activation — cela peut prendre jusqu'à 1 minute.
            </p>
            <button
              onClick={async () => {
                await initialize();
                navigate('/dashboard');
              }}
              className="w-full py-3 px-6 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-700 transition-colors"
            >
              Accéder à mon espace
            </button>
            <p className="text-gray-400 text-xs mt-4">
              Si vous ne voyez pas l'accès immédiatement, actualisez dans 1 minute.
            </p>
          </div>
        )}

        {!success && !timedOut && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-black mb-3">Activation en cours...</h2>
            <p className="text-gray-500 font-medium text-sm mb-4">
              Synchronisation avec notre partenaire bancaire. Quelques secondes.
            </p>
            <p className="text-gray-300 text-xs">
              Vérification {attempts}/10
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
