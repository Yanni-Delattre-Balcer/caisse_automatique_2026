# 🚀 Stratégie : "Moteur Unique, Carrosseries Multiples"

L'objectif est de ne pas coder 10 applications, mais une seule plateforme dynamique capable de s'adapter à chaque métier.

---

## 1. Concepts Fondamentaux

### A. Le sélecteur de "Business Type"
À l'inscription, l'utilisateur choisit son secteur. Ce choix injecte une configuration dans le `useConfigStore` :
- **Retail** : Active les champs "Code-barres" et "Stock unité".
- **Services** : Active les champs "Durée" et "Praticien".
- **Restauration** : Active les "Variantes" (ex: Cuisson) et le bouton "Cuisine".

### B. L'Épine Dorsale : Supabase
C'est ce qui transforme l'app en SaaS :
- **Authentification** : Gestion sécurisée des comptes.
- **Multi-tenant** : Isolation stricte des données par `business_id`.
- **Storage** : Logos pour tickets et photos produits.

---

## 2. Plan d'Action (4 Semaines)

| Semaine | Objectif | Tâches Critiques |
| :--- | :--- | :--- |
| **S1** | **Cloud & Auth** | Connecter Supabase + Store Zustand. Formulaire d'inscription. |
| **S2** | **Universalisation** | Tables `categories` et `products` dynamiques. Test modes Retail/Snack. |
| **S3** | **Fiabilité & Légal** | Grand Livre (Immuable). Exports PDF/Excel (Z-caisse). |
| **S4** | **Polissage & Vente** | Landing page de démo. Approche commerciale terrain. |

---

## 3. Missions Prioritaires pour l'IA
> [!TIP]
> Pour avancer vite, demandez à l'IA d'exécuter des blocs précis.

### Mission 1 : Schéma SQL Multi-Tenant
> "Génère le script SQL Supabase : tables `businesses`, `products`, `sales`. Ajoute les politiques RLS pour l'isolation des données."

### Mission 2 : Synchro Zustand ↔ Supabase
> "Modifie `useCartStore` pour appeler `saveSaleToCloud`. Gère le mode *Offline* via IndexedDB si la connexion échoue."

### Mission 3 : Système de Templates UI
> "Crée un `MetierWrapper` React. Adapte l'interface (bouton Table vs Scanner) selon le `business_type` du store."

---

## 4. Maximiser les Ventes Immédiates
> [!IMPORTANT]
> Pour convaincre une TPE en 3 semaines, levez leurs deux peurs majeures.

1.  **La peur de perdre les données** : Montrez la synchronisation Cloud en direct.
2.  **La peur de l'installation** : Démontrez la puissance de la **PWA** (installation en 2 clics sans App Store).

---
**Navigation :** [Bilan](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/1-bilan_developpement_1.md) | [Mise au point](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/2-mise-au-point1.md) | [Étude Supabase](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/5-supabase-etude.md)