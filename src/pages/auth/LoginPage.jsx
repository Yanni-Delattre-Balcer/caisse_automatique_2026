import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore(state => state.login);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const redirectPath = searchParams.get('redirect') || '/pos';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-center items-end gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#00f2ff] to-[#0055ff] flex items-center justify-center text-white text-xl shadow-md shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
          </div>
          <div className="font-sans font-bold text-2xl text-gray-900 uppercase tracking-wide">
              Heryze
          </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Connexion</h3>
      <p className="text-sm text-gray-500 text-center mb-8 font-medium">Accédez à votre poste d'encaissement sécurisé.</p>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
            <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Adresse email</label>
            <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                autoFocus
                placeholder="contact@entreprise.fr"
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#0055ff] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
            />
        </div>
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Mot de passe</label>
            <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#0055ff] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
            />
        </div>
        
        <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-linear-to-r from-[#0055ff] to-[#0044cc] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>

      </form>

      <p className="text-center text-sm text-gray-500 mt-8 font-medium">
        Pas encore de compte ? <Link to={`/register?redirect=${encodeURIComponent(redirectPath)}`} className="text-[#0055ff] hover:underline font-bold">Créer un compte</Link>
      </p>
    </div>
  );
}
