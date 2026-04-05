# 🚀 Roadmap de Préparation à la Bêta — Heryze

Ce document définit les étapes cruciales à franchir pour passer d'un prototype fonctionnel à une version **Bêta exploitable** par de vrais commerçants. Il s'appuie sur l'analyse stratégique de Claude (P0/P1) et l'architecture technique existante.

---

## 🎯 Objectif de la Bêta
Prouver que Heryze peut encaisser une journée entière sans erreur, sans matériel coûteux, et avec une synchronisation parfaite (Online/Offline).

---

## 🛠️ Phase 1 : Les Incontournables "Produit" (Priorité P0)
Ces fonctionnalités sont nécessaires pour valider la proposition de valeur centrale.

| Tâche | Description | État |
| :--- | :--- | :--- |
| **PWA Installable** | Permettre d'installer l'app sur iPad/Android depuis le navigateur (Vite PWA). Référence test : [briacl/app](https://github.com/briacl/app). | ⏳ À faire |
| **Ticket QR Code** | Page publique `/receipt/:id` pour que le client scanne son ticket numérique. | ⏳ À faire |
| **Logic de Rendu Monnaie** | Calculateur automatique dès qu'on sélectionne "Espèces". | ⏳ À faire |
| **Indicateur de Sync** | Icône visuelle (Vert/Orange/Rouge) pour rassurer sur l'état du Offline. | ⏳ À faire |
| **Alerte Stock Bas** | Notification visuelle simple quand `stock <= seuil`. | ⏳ À faire |

---

## 📈 Phase 2 : Le Sérieux Métier (Priorité P1)
Ce qui rend l'outil "professionnel" aux yeux du commerçant.

| Tâche | Description | État |
| :--- | :--- | :--- |
| **Z-Caisse (Clôture)** | Génération d'un récapitulatif journalier PDF (CA/TVA/Paiements). | ⏳ À faire |
| **Import CSV** | Module d'upload pour injecter un catalogue existant en 1 clic. | ⏳ À faire |
| **Caisse Rapide (Favoris)** | Grille personnalisable des 8 produits les plus vendus. Accessible via un bouton dédié dans la sidebar gauche. **Vue par défaut à l'ouverture de l'app.** | ⏳ À faire |
| **Caisse Complète** | Accès à l'intégralité du catalogue, situé sous la Caisse Rapide dans la navigation. | ⏳ À faire |

---

## 🎨 Phase 3 : Polissage final (UX "Apple-Grade")
- **Raccourcis Clavier** : `/` pour chercher, `Entrée` pour payer, `Esc` pour annuler.
- **Micro-animations de feedback** : Renforcer l'aspect tactique du bouton "Payer".
- **Responsive Tablette** : Vérification finale de l'affichage sur iPad (format portrait/paysage).

---

## 🧪 Critères de "Go" pour la Bêta
1. **Zéro bug bloquant au panier** : Impossible de perdre une vente.
2. **Synchronisation robuste** : Une vente faite en offline remonte bien en base dans les 5s après reconnexion.
3. **Smartphone-Scanner** : Test de 10 scans consécutifs sans latence.
4. **Export Comptable** : Le récapitulatif journalier est conforme aux calculs réels.

---

## 📋 Méthode d'onboarding Testeurs
1. Création d'une page de "Landing Bêta" simple.
2. Formulaire d'inscription récoltant le `Domaine métier` (pour pré-configurer le catalogue).
3. Envoi du lien PWA + Tutoriel vidéo de 3 minutes.

---
> [!IMPORTANT]
> **Focus Stratégique** : On ne développe *rien* des P2/P3 (Fidélité, Statistiques avancées) avant d'avoir les premiers retours utilisateurs réels sur le flux d'encaissement de base.
