import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Package, ChevronRight, Check, Save, Upload, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@heroui/react';
import { useAuthStore } from '../store/useAuthStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabaseClient';

const ONBOARDING_KEY = (bizId) => `heryze_onboarded_${bizId}`;

const STEP_ICONS = [
  <Building2 className="w-5 h-5" />,
  <Package className="w-5 h-5" />,
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, isDemo } = useAuthStore();
  const addItem = useCatalogStore((s) => s.addItem);
  const addToast = useToastStore((s) => s.addToast);

  const [step, setStep] = useState(0); // 0 = infos commerce, 1 = premier produit
  const [saving, setSaving] = useState(false);

  // Step 0 — infos commerce
  const [bizForm, setBizForm] = useState({
    address: '',
    phone: '',
    siret: '',
    tva_intracom: '',
  });

  // Step 1 — premier produit
  const [productForm, setProductForm] = useState({
    name: '',
    price_ht: '',
    tva_rate: '20',
    category: '',
    stock: '',
  });
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvImporting, setCsvImporting] = useState(false);

  const finish = () => {
    if (user?.businessId) {
      localStorage.setItem(ONBOARDING_KEY(user.businessId), '1');
    }
    navigate('/pos/quick');
  };

  // ── Step 0 : Enregistrer les infos commerce ───────────────────────────────
  const handleSaveBiz = async () => {
    setSaving(true);
    try {
      if (!isDemo && user?.businessId) {
        const { error } = await supabase
          .from('businesses')
          .update({
            address: bizForm.address || null,
            phone: bizForm.phone || null,
            siret: bizForm.siret || null,
            tva_intracom: bizForm.tva_intracom || null,
          })
          .eq('id', user.businessId);
        if (error) throw new Error(error.message);
      }
      setStep(1);
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Step 1 : Ajouter le premier produit ──────────────────────────────────
  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.price_ht) {
      addToast({ type: 'warning', message: 'Nom et prix HT sont obligatoires.' });
      return;
    }
    setSaving(true);
    try {
      await addItem({
        name: productForm.name,
        price_ht: parseFloat(productForm.price_ht),
        tva_rate: parseFloat(productForm.tva_rate) || 20,
        category: productForm.category || null,
        stock: productForm.stock ? parseInt(productForm.stock) : 0,
        barcode: null,
      });
      addToast({ type: 'success', message: `"${productForm.name}" ajouté au catalogue.` });
      finish();
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Import CSV rapide ─────────────────────────────────────────────────────
  const handleCsvFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter((l) => l.trim());
      const sep = lines[0]?.includes(';') ? ';' : ',';
      const dataLines = lines[0]?.toLowerCase().includes('nom') ? lines.slice(1) : lines;
      const parsed = dataLines
        .map((line) => {
          const parts = line.split(sep).map((p) => p.trim().replace(/^"|"$/g, ''));
          return {
            name: parts[0] || '',
            price_ht: parseFloat(parts[1]) || 0,
            tva_rate: parseFloat(parts[2]) || 20,
            category: parts[3] || 'Divers',
            stock: parseInt(parts[4]) || 0,
          };
        })
        .filter((p) => p.name && p.price_ht > 0);
      setCsvPreview(parsed);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleCsvImport = async () => {
    if (!csvPreview?.length) return;
    setCsvImporting(true);
    try {
      for (const product of csvPreview) {
        await addItem({ ...product, barcode: null });
      }
      addToast({ type: 'success', message: `${csvPreview.length} produit(s) importé(s).` });
      finish();
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setCsvImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00f2ff] to-[#0055ff] shadow-lg shadow-blue-500/30 mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Bienvenue sur Heryze</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Votre caisse sera prête en 2 étapes.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {['Votre commerce', 'Premier produit'].map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-[#0055ff] text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-bold hidden sm:block ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < 1 && <div className="w-8 h-px bg-gray-200 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Étape 0 : Infos commerce ── */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 text-[#0055ff]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Informations légales</h2>
                  <p className="text-xs text-gray-400">Apparaissent sur vos tickets de caisse</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">SIRET</label>
                    <input
                      type="text"
                      value={bizForm.siret}
                      onChange={(e) => setBizForm({ ...bizForm, siret: e.target.value })}
                      placeholder="123 456 789 00012"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0055ff] transition-colors font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">N° TVA</label>
                    <input
                      type="text"
                      value={bizForm.tva_intracom}
                      onChange={(e) => setBizForm({ ...bizForm, tva_intracom: e.target.value })}
                      placeholder="FR12345678901"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0055ff] transition-colors font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Adresse</label>
                  <input
                    type="text"
                    value={bizForm.address}
                    onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                    placeholder="12 Rue de la Paix, 75001 Paris"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0055ff] transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Téléphone</label>
                  <input
                    type="tel"
                    value={bizForm.phone}
                    onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                    placeholder="01 23 45 67 89"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0055ff] transition-colors font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Passer cette étape
                </button>
                <Button
                  onPress={handleSaveBiz}
                  isLoading={saving}
                  startContent={!saving && <Save className="w-4 h-4" />}
                  className="flex-1 bg-[#0055ff] text-white font-bold rounded-xl"
                >
                  Enregistrer
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Étape 1 : Premier produit ── */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 text-[#0055ff]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Ajoutez votre premier produit</h2>
                  <p className="text-xs text-gray-400">Ou importez tout votre catalogue CSV</p>
                </div>
              </div>

              {/* Import CSV ou formulaire */}
              {csvPreview ? (
                <div>
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {csvPreview.length} produit(s) détecté(s) — prêts à importer
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50 mb-6">
                    {csvPreview.slice(0, 8).map((p, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                        <span className="font-medium text-gray-900 truncate">{p.name}</span>
                        <span className="font-bold text-[#0055ff] ml-4 shrink-0">{p.price_ht.toFixed(2)}€ HT</span>
                      </div>
                    ))}
                    {csvPreview.length > 8 && (
                      <div className="px-4 py-2 text-xs text-gray-400 text-center">
                        +{csvPreview.length - 8} autres produits...
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setCsvPreview(null)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                      Annuler
                    </button>
                    <Button onPress={handleCsvImport} isLoading={csvImporting} startContent={!csvImporting && <Upload className="w-4 h-4" />}
                      className="flex-1 bg-[#0055ff] text-white font-bold rounded-xl">
                      Importer {csvPreview.length} produit(s)
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Nom du produit *</label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="ex: Croissant Beurre"
                        autoFocus
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0055ff] transition-colors font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Prix HT (€) *</label>
                        <input
                          type="number" step="0.01" min="0"
                          value={productForm.price_ht}
                          onChange={(e) => setProductForm({ ...productForm, price_ht: e.target.value })}
                          placeholder="0.00"
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0055ff] transition-colors font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">TVA</label>
                        <select
                          value={productForm.tva_rate}
                          onChange={(e) => setProductForm({ ...productForm, tva_rate: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0055ff] transition-colors font-medium appearance-none"
                        >
                          <option value="20">20%</option>
                          <option value="10">10%</option>
                          <option value="5.5">5.5%</option>
                          <option value="2.1">2.1%</option>
                          <option value="0">0%</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Catégorie</label>
                        <input
                          type="text"
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          placeholder="ex: Viennoiserie"
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0055ff] transition-colors font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Stock initial</label>
                        <input
                          type="number" min="0"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          placeholder="0"
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0055ff] transition-colors font-medium"
                        />
                      </div>
                    </div>
                    {productForm.price_ht && (
                      <div className="text-xs text-center text-gray-400">
                        Prix TTC estimé : <span className="font-bold text-[#0055ff]">
                          {(parseFloat(productForm.price_ht) * (1 + parseFloat(productForm.tva_rate || '20') / 100)).toFixed(2)}€
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {/* Import CSV alternatif */}
                    <label className="flex-1 cursor-pointer">
                      <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvFile} />
                      <span className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-gray-600 border-2 border-dashed border-gray-200 hover:border-[#0055ff]/40 hover:text-[#0055ff] rounded-xl transition-colors">
                        <Upload className="w-4 h-4" />
                        Importer CSV
                      </span>
                    </label>
                    <Button
                      onPress={handleAddProduct}
                      isLoading={saving}
                      startContent={!saving && <ChevronRight className="w-4 h-4" />}
                      className="flex-1 bg-[#0055ff] text-white font-bold rounded-xl"
                    >
                      Ajouter
                    </Button>
                  </div>

                  <button onClick={finish} className="w-full mt-3 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
                    Passer — j'ajouterai mes produits plus tard
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
