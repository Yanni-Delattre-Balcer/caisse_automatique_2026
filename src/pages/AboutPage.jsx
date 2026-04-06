import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Globe, Heart, Rocket } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] selection:bg-blue-500/10">
      {/* Background Decor */}
      <div className="absolute top-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[60%] h-[60%] bg-linear-to-br from-[#00f2ff]/10 to-[#0055ff]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] bg-linear-to-br from-blue-200/5 to-indigo-200/10 rounded-full blur-[120px]" />
      </div>

      <main className="max-w-4xl mx-auto px-6 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black tracking-[0.2em] uppercase mb-8 shadow-sm border border-blue-100/50">
            <Sparkles className="w-3 h-3" />
            L'ADN de Nexus
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 leading-[1.1] mb-8">
            La technologie n'a de sens que lorsqu'elle s'efface au profit de l'humain.
          </h1>
        </motion.div>

        <div className="grid gap-12 md:gap-20">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row gap-8 items-start"
          >
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Notre Vocation</h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Nous sommes deux étudiants en Réseaux & Télécommunications, unis par une conviction profonde : la complexité technique ne doit jamais être un frein à l'ambition. Passionnés par l'architecture des systèmes et la fluidité des échanges, nous avons fondé Nexus avec un objectif radical : transformer des outils souvent lourds et archaïques en expériences invisibles et intuitives.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row-reverse gap-8 items-start"
          >
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <div className="md:text-right">
              <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Notre Quête</h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Peu importe le domaine, notre quête reste la même : faciliter le quotidien.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row gap-8 items-start"
          >
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center">
              <Rocket className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Heryze</h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Aujourd'hui, nous sommes fiers de vous présenter Heryze. Plus qu'une simple caisse enregistreuse, c'est une réinvention de la gestion commerciale. Conçue pour être rapide, résiliente et d'une simplicité désarmante, elle permet aux commerçants de se concentrer sur ce qui compte vraiment : leur métier.
              </p>
            </div>
          </motion.section>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 pt-20 border-t border-gray-100 text-center"
        >
          <p className="text-gray-400 font-bold text-lg mb-4">
            Nous ne construisons pas seulement des logiciels. Nous bâtissons les outils de demain.
          </p>
          <div className="space-y-1">
            <p className="text-xs font-black tracking-[0.3em] uppercase text-gray-300">
              Yanni Delattre-Balcer and Bérangère • Development presents
            </p>
            <p className="text-xs font-black tracking-[0.3em] uppercase text-blue-500/50">
              a Nexus production
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
