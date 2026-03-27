import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@heroui/react';
import { useAuthStore } from '../../store/useAuthStore';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData.email, formData.password);
    navigate('/pos');
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900">Bon retour</h1>
      <p className="text-gray-500 mb-8 font-medium text-sm">Connectez-vous pour accéder à votre poste d'encaissement.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Button type="submit" className="w-full font-bold bg-[#0055ff] text-white shadow-xl shadow-blue-500/20 py-6 mt-2 hover:bg-[#0044cc]" size="lg">
          Se connecter
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-8 font-medium">
        Pas encore de compte ? <Link to="/register" className="text-[#0055ff] hover:underline font-bold">Créer un compte</Link>
      </p>
    </div>
  );
}
