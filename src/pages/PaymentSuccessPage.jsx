import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function PaymentSuccessPage() {
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.businessId) return;

    // Polling : vérifier toutes les 2 secondes si le webhook a renseigné le profil
    // Maximum 10 tentatives (20 secondes)
    const interval = setInterval(async () => {
      
      const { data, error } = await supabase
        .from('businesses')
        .select('stripe_subscription_id, subscription_status')
        .eq('id', user.businessId)
        .single();
        
      if (!error && data?.stripe_subscription_id) {
        setSuccess(true);
        clearInterval(interval);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
      
      setAttempts((prev) => {
        if (prev >= 10) {
          clearInterval(interval);
          // Rediriger au bout de 20s même si le webhook traîne,
          // l'essai gratuit de Supabase leur donne quand même accès au dashboard.
          setTimeout(() => navigate('/dashboard'), 2000);
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [user?.businessId, navigate]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans text-gray-900">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 text-center border border-gray-100">
        {!success ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-black mb-3">Sécurisation en cours...</h2>
            <p className="text-gray-500 font-medium text-sm">
              Nous synchronisons votre compte avec notre partenaire bancaire. Veuillez patienter un instant.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-3">Compte Sécurisé !</h2>
            <p className="text-gray-500 font-medium text-sm">
              Bienvenue sur Heryze. Redirection vers votre tableau de bord...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
