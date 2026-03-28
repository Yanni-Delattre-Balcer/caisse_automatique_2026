import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const DOMAINS = [
  { value: "Restauration", label: "🍽️ Restauration & Bar" },
  { value: "Retail", label: "👕 Retail & Mode" },
  { value: "Beauté", label: "💇 Coiffure & Beauté" },
  { value: "Multi-services", label: "🔧 Multi-services" },
  { value: "Autre", label: "📦 Autre" }
];

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore(state => state.register);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    domain: 'Restauration'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(formData.companyName, formData.email, formData.password, formData.domain);
      navigate('/pos');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-center items-end gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2ff] to-[#0055ff] flex items-center justify-center text-white text-xl shadow-md shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
          </div>
          <div className="font-sans font-bold text-2xl text-gray-900 uppercase tracking-wide">
              Omni<span className="text-[#0055ff]">POS</span>
          </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Créer un compte</h3>
      <p className="text-sm text-gray-500 text-center mb-8 font-medium">Configurez votre caisse en 2 minutes.</p>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
            <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Nom de l'entreprise</label>
            <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                required
                autoFocus
                placeholder="ex: Le Petit Bistro"
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#0055ff] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
            />
        </div>
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Adresse email</label>
            <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
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
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Domaine d'activité</label>
            <div className="relative">
                <select
                    required
                    value={formData.domain}
                    onChange={(e) => setFormData({...formData, domain: e.target.value})}
                    className="w-full appearance-none px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#0055ff] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium cursor-pointer"
                >
                    {DOMAINS.map((domain) => (
                    <option key={domain.value} value={domain.value}>{domain.label}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-1.5">L'interface s'adaptera à votre domaine.</p>
        </div>
        
        <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 bg-gradient-to-r from-[#0055ff] to-[#0044cc] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {loading ? 'Création en cours...' : 'Démarrer gratuitement'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6 font-medium">
        Déjà un compte ? <Link to="/login" className="text-[#0055ff] hover:underline font-bold">Se connecter</Link>
      </p>
    </div>
  );
}
