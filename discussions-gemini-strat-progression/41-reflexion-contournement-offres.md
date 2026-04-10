# 🏰 Stratégie de "Verrouillage" et de Segmentation des Offres

En tant qu'étudiants et créateurs de SaaS, vous devez construire un système "étanche" où ce n'est pas la bonne volonté du client qui décide du prix, mais les **limites techniques** du logiciel.

Pour empêcher un gros commerce de se "glisser" dans l'offre Starter à 19 €, vous ne devez pas lui demander son CA (qu'il pourrait cacher), mais limiter les fonctionnalités dont il a physiquement besoin pour faire tourner son business.

---

## 1. Le verrouillage par les "Limites Techniques" (Hard Limits)

C'est la méthode la plus efficace. Le logiciel bloque automatiquement si l'utilisateur dépasse ce qui est inclus dans son plan.

| Ressource | Limitation Starter (19€) | Conséquence du dépassement |
| :--- | :--- | :--- |
| **Terminaux (Caisse)** | **1 seul** accès simultané | Message demandant le passage à l'offre Business. |
| **Références (SKU)** | **200 à 500** produits | Blocage de l'ajout de nouveaux produits. |
| **Volume Tickets** | **~500** / mois | Invitation à l'upgrade pour continuer à encaisser. |

> [!IMPORTANT]
> **Le Shadow Tracking :** Grâce à PostHog, si un compte Starter génère un flux constant d'activité 12h/24, vous recevez une alerte pour un upgrade manuel ou automatique.

---

## 2. Le verrouillage par les "Fonctionnalités Métier" (Feature Gating)

Ici, on ne bloque pas l'usage, on rend l'offre Starter inutilisable pour un gros acteur parce qu'il lui manque des outils vitaux.

### 👥 Rôles et Permissions
Dans le plan **Starter**, il n'y a qu'un compte "Admin". Un gros commerce a besoin de comptes "Vendeurs" limités (pour protéger les marges et éviter les suppressions de ventes).

### 🏢 Multi-boutique
Un commerçant avec plusieurs points de vente doit centraliser ses stocks. Cette fonction de synchronisation globale est exclusive au plan **Expert**.

### 📊 Intelligence Expert
Un indépendant se contente de savoir ce qu'il a vendu. Une PME a besoin d'exports comptables complexes et de l'**IA Business Advisor** pour piloter sa rentabilité.

---

## 3. Communication et Conversion

Ne voyez pas cela comme "empêcher l'arnaque", mais comme une **segmentation de la valeur**.

*   **L'artisan solo** est ravi car il a un prix bas pour ses besoins simples.
*   **Le gros commerce** paie plus car il consomme des ressources massives (Supabase) et demande plus de support.

> [!TIP]
> **Astuce d'implémentation :** Dans votre code React, une simple variable `plan` liée à l'utilisateur suffit à désactiver les boutons "Ajouter un terminal" ou "Gestion d'équipe". C'est propre, automatique via Stripe, et impossible à contourner.