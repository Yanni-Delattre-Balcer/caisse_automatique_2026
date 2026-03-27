import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@heroui/react';
import { useAuthStore } from '../../store/useAuthStore';

const DOMAINS = [
  { value: "Restauration", label: "🍽️  Restauration & Bar" },
  { value: "Retail", label: "👕  Retail & Prêt-à-porter" },
  { value: "Beauté", label: "💇  Coiffure & Beauté" },
  { value: "Multi-services", label: "🔧  Multi-services" },
  { value: "Autre", label: "📦  Autre" }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    register(formData.companyName, formData.email, formData.password, formData.domain);
    navigate('/pos');
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900">Créer un compte</h1>
      <p className="text-gray-500 mb-8 font-medium text-sm">Rejoignez OmniPOS et configurez votre caisse en 2 minutes.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          isRequired
          label="Nom de l'entreprise"
          placeholder="ex: Le Petit Bistro"
          variant="faded"
          value={formData.companyName}
          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
        />
        <Input
          isRequired
          type="email"
          label="Adresse email"
          placeholder="contact@entreprise.fr"
          variant="faded"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <Input
          isRequired
          type="password"
          label="Mot de passe"
          variant="faded"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Domaine d'activité *</label>
          <select
            required
            value={formData.domain}
            onChange={(e) => setFormData({...formData, domain: e.target.value})}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-[#0055ff] transition-colors cursor-pointer"
          >
            {DOMAINS.map((domain) => (
              <option key={domain.value} value={domain.value}>{domain.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 font-medium">L'interface de la caisse s'adaptera à votre domaine.</p>
        </div>

        <Button type="submit" className="w-full font-bold bg-[#0055ff] text-white shadow-xl shadow-blue-500/20 py-6 mt-2 hover:bg-[#0044cc]" size="lg">
          Démarrer gratuitement
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-8 font-medium">
        Déjà un compte ? <Link to="/login" className="text-[#0055ff] hover:underline font-bold">Se connecter</Link>
      </p>
    </div>
  );
}
