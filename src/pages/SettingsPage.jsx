import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Save, Building2, User, Receipt, Palette, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useConfigStore } from '../store/useConfigStore';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabaseClient';

export function SettingsPage() {
  const { user, isDemo } = useAuthStore();
  const { cashierName, setCashierName, theme, toggleTheme, businessMode, setBusinessMode } = useConfigStore();
  const addToast = useToastStore((s) => s.addToast);

  const [businessForm, setBusinessForm] = useState({
    name: user?.companyName || '',
    address: '',
    phone: '',
    email: user?.email || '',
    siret: '',
    tva_intracom: '',
  });
  const [saving, setSaving] = useState(false);
  const [localCashier, setLocalCashier] = useState(cashierName);

  // Charger les infos du commerce depuis Supabase
  useEffect(() => {
    if (isDemo || !user?.businessId) return;

    supabase
      .from('businesses')
      .select('name, address, phone, email, siret, tva_intracom')
      .eq('id', user.businessId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBusinessForm({
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            siret: data.siret || '',
            tva_intracom: data.tva_intracom || '',
          });
        }
      });
  }, [user?.businessId, isDemo]);

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      if (!isDemo && user?.businessId) {
        const { error } = await supabase
          .from('businesses')
          .update({
            name: businessForm.name,
            address: businessForm.address,
            phone: businessForm.phone,
            email: businessForm.email,
            siret: businessForm.siret,
            tva_intracom: businessForm.tva_intracom,
          })
          .eq('id', user.businessId);
        if (error) throw new Error(error.message);
      }
      setCashierName(localCashier);
      addToast({ type: 'success', message: 'Paramètres enregistrés.' });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const Section = ({ icon, title, children }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-[#0055ff]/10 text-[#3377ff]">{icon}</div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Input = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div>
      <label className="block text-sm font-semibold text-zinc-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]/50 font-medium placeholder:text-zinc-600"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full p-2 max-w-3xl mx-auto">
      <div className="mb-2">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400">
          Paramètres
        </h1>
        <p className="text-zinc-500 font-medium">Configurez votre commerce et vos préférences.</p>
      </div>

      {/* Informations Commerce */}
      <Section icon={<Building2 className="w-5 h-5" />} title="Informations du commerce">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom du commerce"
            value={businessForm.name}
            onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
            placeholder="Mon Commerce"
          />
          <Input
            label="Email de contact"
            value={businessForm.email}
            onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
            placeholder="contact@commerce.fr"
            type="email"
          />
          <Input
            label="Téléphone"
            value={businessForm.phone}
            onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
            placeholder="01 23 45 67 89"
          />
          <Input
            label="Adresse"
            value={businessForm.address}
            onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
            placeholder="12 Rue de la Paix, 75001 Paris"
          />
        </div>
      </Section>

      {/* Informations Fiscales */}
      <Section icon={<Receipt className="w-5 h-5" />} title="Informations fiscales">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="SIRET"
            value={businessForm.siret}
            onChange={(e) => setBusinessForm({ ...businessForm, siret: e.target.value })}
            placeholder="123 456 789 00012"
          />
          <Input
            label="N° TVA Intracommunautaire"
            value={businessForm.tva_intracom}
            onChange={(e) => setBusinessForm({ ...businessForm, tva_intracom: e.target.value })}
            placeholder="FR12345678901"
          />
        </div>
      </Section>

      {/* Caissier */}
      <Section icon={<User className="w-5 h-5" />} title="Poste de caisse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom du caissier"
            value={localCashier}
            onChange={(e) => setLocalCashier(e.target.value)}
            placeholder="Admin"
          />
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Mode d'activité</label>
            <select
              value={businessMode}
              onChange={(e) => setBusinessMode(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]/50 font-medium appearance-none"
            >
              <option value="retail">Commerce / Retail</option>
              <option value="snack">Restauration / Snack</option>
              <option value="service">Services / Beauté</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Apparence */}
      <Section icon={<Palette className="w-5 h-5" />} title="Apparence">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Thème sombre</p>
            <p className="text-xs text-zinc-500">Basculer entre le thème clair et sombre</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-[#0055ff]' : 'bg-zinc-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Section>

      {/* Infos compte */}
      <Section icon={<Shield className="w-5 h-5" />} title="Compte">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-400">Email</span>
            <span className="text-white font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">ID Commerce</span>
            <span className="text-zinc-500 font-mono text-xs">{user?.businessId || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Mode</span>
            <span className={`font-bold ${isDemo ? 'text-amber-400' : 'text-green-400'}`}>
              {isDemo ? 'Démonstration' : 'Production'}
            </span>
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="sticky bottom-0 bg-[#151515]/80 backdrop-blur-md py-4 -mx-2 px-2">
        <Button
          onPress={handleSaveBusiness}
          isLoading={saving}
          startContent={!saving && <Save className="w-4 h-4" />}
          className="w-full bg-[#0055ff] text-white font-bold rounded-xl h-12 shadow-lg shadow-blue-500/20"
          size="lg"
        >
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
