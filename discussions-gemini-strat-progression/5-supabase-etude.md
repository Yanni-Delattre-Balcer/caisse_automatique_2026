# 🤖 Guide de Pilotage de l'IA (Focus Supabase)

Ce document contient le prompt "Master" à fournir à votre IA de développement pour connecter le backend Supabase à votre application React.

---

## 📝 Le Master Prompt

> [!TIP]
> Copiez ce prompt intégralement pour donner un contexte clair à votre IA.

```markdown
**Contexte** : Développement d'un SaaS de caisse (POS) avec React 19, Vite, Tailwind 4 et Zustand.
**Objectif** : Connecter l'application à Supabase.

**Missions Techniques** :
1. **Initialisation** : Configurer `@supabase/supabase-js` avec variables d'environnement (.env).
2. **Authentification** : Créer un `useAuthStore` (Zustand) gérant le Sign-up (avec `business_type`) et le Login.
3. **Liaison des données** :
   - `useCatalogStore` : Récupérer les produits depuis la table `products`.
   - `useCartStore` : Insérer les ventes validées dans la table `sales`.
4. **Sécurité** : Inclure le `business_id` dans chaque requête pour respecter les politiques RLS.
5. **Mode Offline** : Stockage temporaire (IndexedDB) si Supabase est injoignable.

**Schéma SQL** : (Collez ici le script de la doc 4-precisions-supabase.md)
```

---

## 🛠️ Conseils de Pilotage
Pour des résultats optimaux, procédez par étapes plutôt que de tout demander d'un coup.

- **Étape 1** : "Fais-moi juste la page de connexion et d'inscription."
- **Étape 2** : "Affiche maintenant la liste des produits depuis la DB."
- **Demande de Hooks** : Demandez à l'IA de séparer la logique via des hooks (ex: `useProducts.ts`, `useSales.ts`) pour garder vos composants HeroUI propres.
- **Effet Wahou** : Demandez l'implémentation de `supabase.channel()` pour le **Realtime**.

---

## 🚀 Check-list de Lancement
1. [ ] Créer un compte sur [Supabase.com](https://supabase.com).
2. [ ] Initialiser le projet et exécuter le script SQL.
3. [ ] Récupérer l'URL et la **Anon Key** dans les paramètres API.
4. [ ] Lancer le prompt ci-dessus !

---
**Navigation :** [Bilan](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/1-bilan_developpement_1.md) | [Mise au point](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/2-mise-au-point1.md) | [Précisions Supabase](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/4-precisions-supabase.md)