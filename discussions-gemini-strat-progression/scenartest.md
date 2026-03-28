# 🧪 Scénarios de Test : Validation Migration Supabase

Ce document détaille les tests critiques à réaliser pour valider l'implémentation de la couche de données Supabase et de la résilience offline.

---

## 🔐 1. Authentification & Multi-tenant
**Objectif** : Vérifier que les données sont hermétiquement isolées entre les commerçants.

| Étape | Action | Résultat Attendu |
| :--- | :--- | :--- |
| 1.1 | Créer deux comptes distincts (A et B). | Les deux comptes sont créés dans `auth.users`. |
| 1.2 | Login avec le Compte A et ajouter un produit "Pomme". | Le produit est visible dans le catalogue du Compte A. |
| 1.3 | Logout A, Login avec le Compte B. | Le catalogue du Compte B est vide (ou contient ses propres produits). |
| 1.4 | Rechercher "Pomme" dans le catalogue B. | **Aucun résultat**. Étanchéité RLS confirmée. |

---

## 🔄 2. Synchronisation Temps Réel (Realtime)
**Objectif** : Vérifier que les stocks et produits se mettent à jour instantanément sur plusieurs terminaux.

| Étape | Action | Résultat Attendu |
| :--- | :--- | :--- |
| 2.1 | Ouvrir l'app sur deux terminaux (PC + Mobile) avec le même compte. | Les deux affichent le même catalogue. |
| 2.2 | Sur le PC, changer le prix d'un produit. | Le prix change **instantanément** sur le mobile sans rafraîchir. |
| 2.3 | Sur le Mobile, modifier le stock d'un produit. | La valeur du stock est mise à jour sur le PC en temps réel. |

---

## 📶 3. Résilience Offline (Mode Avion)
**Objectif** : Valider que l'encaissement reste possible sans réseau.

| Étape | Action | Résultat Attendu |
| :--- | :--- | :--- |
| 3.1 | Passer en **Mode Avion** (déconnexion complète). | L'UI doit rester fluide (Offline-First). |
| 3.2 | Réaliser une vente complète avec deux produits. | Le panier se vide, un reçu s'affiche (simulé). |
| 3.3 | Vérifier IndexedDB (Inspecteur Browser > Application). | La vente est présente dans la file d'attente `offline_sale_...`. |
| 3.4 | Désactiver le Mode Avion / Rétablir la connexion. | L'app détecte le réseau et vide la file d'attente. |
| 3.5 | Vérifier le Dashboard Supabase. | La vente est apparue dans la table `sales` avec le bon timestamp. |

---

## 📉 4. Intégrité des Stocks (CSR-First)
**Objectif** : Vérifier que le calcul du stock après vente est correct.

| Étape | Action | Résultat Attendu |
| :--- | :--- | :--- |
| 4.1 | Noter le stock d'un produit (ex: 10 unités). | - |
| 4.2 | Vendre 3 unités du même produit. | - |
| 4.3 | Vérifier immédiatement le catalogue. | Le stock affiche **7 unités**. |
| 4.4 | Vérifier dans Supabase (Table `products`). | `stock_quantity` est bien à 7. |

---

## 📱 5. Expérience Mobile & PWA
**Objectif** : S'assurer que l'installation et l'usage mobile sont optimaux.

- [ ] L'application peut être ajoutée à l'écran d'accueil (PWA).
- [ ] Le scanner de code-barre (via caméra) fonctionne sans latence.
- [ ] L'interface s'adapte correctement au format portrait/paysage.

---
*Ce scénario doit être exécuté après chaque modification majeure des stores Zustand.*
