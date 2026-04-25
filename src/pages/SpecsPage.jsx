import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ProductNavbar } from '../components/ProductNavbar';
import { Footer } from '../components/Footer';

/**
 * SpecsPage - Premium technical specifications for Heryze
 * Design: Apple-inspired (White, Black, Minimalist, 2-column)
 */
const SpecsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const sections = [
    {
      category: "Architecture logicielle",
      items: [
        { label: "Type d'application", value: "Progressive Web App (PWA)" },
        { label: "Logique de rendu", value: "Client-Side Rendering (CSR) pour minimiser la charge serveur" },
        { label: "Performance", value: "Interface optimisée pour 60 FPS avec micro-interactions calibrées" }
      ]
    },
    {
      category: "Résilience et Stockage",
      items: [
        { label: "Mode hors-ligne", value: "Architecture Offline-first native" },
        { label: "Synchronisation", value: "File d'attente intelligente et synchronisation automatique au retour réseau" },
        { label: "Disponibilité", value: "Accès instantané aux données locales sans latence serveur" }
      ]
    },
    {
      category: "Technologies de saisie",
      items: [
        { label: "Douchette Magique", value: "Scanner temps réel basé sur WebRTC (usage de la caméra smartphone/tablette)" },
        { label: "Quick POS", value: "Interface d'encaissement rapide par saisie de montant direct" },
        { label: "Protocoles", value: "Support prévu pour imprimantes thermiques via ESC/POS" }
      ]
    },
    {
      category: "Conformité et Finance",
      items: [
        { label: "Certification", value: "Conçu pour la conformité à la norme NF525" },
        { label: "Exports", value: "Génération automatique de Z-caisse et fichiers FEC (format comptable)" },
        { label: "Paiements", value: "Intégration native Stripe pour terminaux, CB et gestion d'abonnements" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] font-sans selection:bg-blue-500/10">
      {/* Shared Product Navbar */}
      <ProductNavbar isVisible={true} />

      {/* Main Content */}
      <main className="pt-32 pb-32 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="mb-24 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
            Spécifications techniques.
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl">
            La puissance de l'ingénierie Nexus au service de votre commerce.
          </p>
        </div>

        <div className="space-y-0">
          {sections.map((section, idx) => (
            <section 
              key={section.category} 
              className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-0 py-16 md:py-24 border-t border-gray-100"
            >
              {/* Left Column: Category */}
              <div className="md:col-span-4 text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f]">
                {section.category}
              </div>

              {/* Right Column: Content */}
              <div className="md:col-span-8 space-y-12">
                {section.items.map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <span className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {item.label}
                    </span>
                    <span className="text-xl md:text-2xl font-medium leading-[1.3] text-[#1d1d1f]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Shared Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default SpecsPage;
