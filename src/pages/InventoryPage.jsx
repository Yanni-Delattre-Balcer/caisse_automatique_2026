import React, { useState } from 'react';
import { Button, Card } from '@heroui/react';
import { Plus, Pencil, Trash2, Package, Search, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCatalogStore } from '../store/useCatalogStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabaseClient';

const EMPTY_PRODUCT = {
  name: '',
  price_ht: '',
  tva_rate: '20',
  category: '',
  stock: '',
  barcode: '',
};

export function InventoryPage() {
  const { items } = useCatalogStore();
  const { user, isDemo } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const addItem = useCatalogStore((s) => s.addItem);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.barcode && item.barcode.includes(search)) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_PRODUCT);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      price_ht: String(item.price_ht),
      tva_rate: String(item.tva_rate),
      category: item.category || '',
      stock: String(item.stock ?? ''),
      barcode: item.barcode || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price_ht) {
      addToast({ type: 'warning', message: 'Nom et prix HT sont obligatoires.' });
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: form.name,
        price_ht: parseFloat(form.price_ht),
        tva_rate: parseFloat(form.tva_rate) || 20,
        category: form.category || null,
        stock: form.stock ? parseInt(form.stock) : 0,
        barcode: form.barcode || null,
      };

      if (editingId) {
        // Modification
        if (isDemo) {
          // En mode démo, on met à jour localement
          useCatalogStore.setState((state) => ({
            items: state.items.map((i) =>
              i.id === editingId
                ? {
                    ...i,
                    ...productData,
                    price: productData.price_ht * (1 + productData.tva_rate / 100),
                  }
                : i
            ),
          }));
        } else {
          const { error } = await supabase
            .from('products')
            .update({
              name: productData.name,
              price_ht: productData.price_ht,
              tva_rate: productData.tva_rate,
              category: productData.category,
              stock_quantity: productData.stock,
              barcode: productData.barcode,
            })
            .eq('id', editingId);
          if (error) throw new Error(error.message);
        }
        addToast({ type: 'success', message: `"${form.name}" modifié.` });
      } else {
        // Ajout
        await addItem(productData);
        addToast({ type: 'success', message: `"${form.name}" ajouté au catalogue.` });
      }

      setShowModal(false);
      setForm(EMPTY_PRODUCT);
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Supprimer "${item.name}" ?`)) return;

    try {
      if (isDemo) {
        useCatalogStore.setState((state) => ({
          items: state.items.filter((i) => i.id !== item.id),
        }));
      } else {
        const { error } = await supabase.from('products').delete().eq('id', item.id);
        if (error) throw new Error(error.message);
      }
      addToast({ type: 'success', message: `"${item.name}" supprimé.` });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full p-2 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400">
            Inventaire
          </h1>
          <p className="text-zinc-500 font-medium">{items.length} produit(s) au catalogue</p>
        </div>
        <Button
          onPress={openAdd}
          className="bg-[#0055ff] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
          startContent={<Plus className="w-4 h-4" />}
        >
          Ajouter un produit
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, code-barre, catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#0055ff]/50 transition-shadow text-white placeholder:text-gray-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-4 py-3 text-zinc-400 font-semibold">Produit</th>
              <th className="px-4 py-3 text-zinc-400 font-semibold">Catégorie</th>
              <th className="px-4 py-3 text-zinc-400 font-semibold text-right">Prix HT</th>
              <th className="px-4 py-3 text-zinc-400 font-semibold text-right">TVA</th>
              <th className="px-4 py-3 text-zinc-400 font-semibold text-right">Prix TTC</th>
              <th className="px-4 py-3 text-zinc-400 font-semibold text-right">Stock</th>
              <th className="px-4 py-3 text-zinc-400 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  {search ? 'Aucun produit trouvé.' : 'Aucun produit dans le catalogue.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{item.name}</div>
                    {item.barcode && <div className="text-xs text-zinc-500">{item.barcode}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {item.category && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-zinc-300 border border-white/10">
                        {item.category}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-300">{item.price_ht.toFixed(2)}€</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{item.tva_rate}%</td>
                  <td className="px-4 py-3 text-right font-bold text-[#3377ff]">{item.price.toFixed(2)}€</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${item.stock !== null && item.stock <= 5 ? 'text-red-400' : 'text-zinc-300'}`}>
                      {item.stock ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajout/Modification */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#1a1c1e] p-6 rounded-3xl shadow-2xl max-w-md w-full border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-6">
                {editingId ? 'Modifier le produit' : 'Ajouter un produit'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Nom du produit *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="ex: Croissant Beurre"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]/50 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Prix HT (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price_ht}
                      onChange={(e) => setForm({ ...form, price_ht: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]/50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-1.5">TVA (%)</label>
                    <select
                      value={form.tva_rate}
                      onChange={(e) => setForm({ ...form, tva_rate: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]/50 font-medium appearance-none"
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
                    <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Catégorie</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="ex: Viennoiserie"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]/50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]/50 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-400 mb-1.5">Code-barre</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder="ex: 3760000000001"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]/50 font-medium"
                  />
                </div>

                {form.price_ht && (
                  <div className="bg-[#0055ff]/10 border border-[#0055ff]/20 rounded-xl px-4 py-3 text-sm">
                    <span className="text-zinc-400">Prix TTC estimé : </span>
                    <span className="font-bold text-[#3377ff]">
                      {(parseFloat(form.price_ht) * (1 + parseFloat(form.tva_rate || '20') / 100)).toFixed(2)}€
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <Button
                  onPress={handleSave}
                  isLoading={saving}
                  startContent={!saving && <Save className="w-4 h-4" />}
                  className="bg-[#0055ff] text-white font-bold rounded-xl"
                >
                  {editingId ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
