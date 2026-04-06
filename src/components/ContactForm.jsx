import React, { useState } from 'react';
import { Button, Input } from '@heroui/react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

export function ContactForm() {
  const [state, setState] = useState({
    loading: false,
    success: false,
    error: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    setState((prev) => ({ ...prev, error: null }));
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState({ loading: true, success: false, error: null });

    try {
      const { data, error } = await supabase.functions.invoke('send-contact', {
        body: formData,
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || "Erreur inconnue lors de l'envoi");
      }

      setState({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', message: '' });

      // Retour au formulaire après 5 secondes
      setTimeout(() => setState((prev) => ({ ...prev, success: false })), 5000);
    } catch (err) {
      setState({ loading: false, success: false, error: err.message });
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {state.success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center text-center py-12"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
            <p className="text-gray-500">
              Nous avons bien reçu votre demande et vous répondrons dans les plus brefs délais (généralement sous 24 à 48h).
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">Contactez-nous</h3>
              <p className="text-gray-500 text-sm mb-6">
                Une question ? Un besoin spécifique ? Remplissez ce formulaire.
              </p>
            </div>

            <Input
              label="Nom ou Raison Sociale"
              placeholder="Votre nom de commerce"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              variant="bordered"
              className="border-gray-200"
            />

            <Input
              label="Adresse Email"
              placeholder="votre@email.com"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              variant="bordered"
              className="border-gray-200"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">Votre Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Décrivez votre besoin..."
                className="w-full bg-transparent border-2 border-gray-200 hover:border-[#0055ff] focus:border-[#0055ff] focus:ring-0 rounded-xl px-4 py-3 placeholder-gray-400 text-sm transition-colors outline-none resize-y"
              />
            </div>

            {state.error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{state.error}</p>
              </div>
            )}

            <Button
              type="submit"
              isLoading={state.loading}
              endContent={!state.loading && <Send className="w-4 h-4 ml-1" />}
              className="bg-[#0055ff] text-white font-bold h-12 rounded-xl text-md mt-2 shadow-lg shadow-blue-500/25"
            >
              Envoyer le message
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
