# 🚀 Bilan Complet des Fonctionnalités - Projet Heryze (Caisse Automatique 2026)

Ce document dresse l'inventaire exhaustif des fonctionnalités actuelles et prévues du projet **Heryze**, une solution SaaS de caisse automatique universelle. L'objectif est de fournir une base de réflexion pour l'amélioration du produit et l'attraction de nouveaux clients.

---

## 1. 🛒 Cœur de Vente (Point of Sale - POS)
L'interface de vente a été conçue pour être ultra-rapide et s'adapter à différents métiers.
- **Interface Adaptative (Universal UI)** : L'UI change selon le domaine (Retail, Restauration/Snack, Services/Beauté) pour afficher les contrôles les plus pertinents.
- **Smart Cards Produits** : Affichage moderne avec glassmorphism, prix XXL, et indicateur de stock visuel.
- **Panier Vivant** : 
    - Modification directe des quantités (+/-) sur chaque ligne.
    - Système anti-erreur pour l'annulation de commande (bouton isolé avec modale de confirmation).
- **Moteur de Recherche & Filtres** : Recherche instantanée par nom, catégorie ou code-barre.
- **Paiement Rapide** : Processus d'encaissement simplifié pour réduire le temps d'attente client.

## 2. 📦 Gestion de l'Inventaire & Catalogue
Un outil complet pour gérer l'offre commerciale du commerçant.
- **Gestion de Catalogue** : Ajout, édition et suppression simplifiée des produits.
- **Calculateur de Taxes** : Gestion des taux de TVA (2.1%, 5.5%, 10%, 20%) avec calcul automatique du prix TTC depuis le HT ou inversement.
- **Suivi des Stocks** : Mise à jour en temps réel lors des ventes et alertes visuelles sur les stocks bas.
- **Base de Données Multi-Catégories** : Organisation logique des produits pour une navigation fluide en caisse.

## 3. 📱 Innovation Hardware : Le "Smartphone-Scanner"
C'est le plus gros avantage concurrentiel du projet.
- **Zéro Matériel Propriétaire** : Pas besoin d'acheter une douchette code-barre coûteuse. 
- **Technologie WebRTC (PeerJS)** : Permet de connecter un smartphone au poste de caisse sans installation, transformant la caméra du téléphone en un scanner de code-barre sans fil ultra-réactif.

## 4. ⚡ Résilience & Cloud (L’Infrastructure)
Une architecture conçue pour la fiabilité et la mobilité.
- **Architecture Offline-First** : Utilisation de `IndexedDB` pour permettre l'encaissement même en cas de coupure internet totale. Les ventes sont stockées localement et synchronisées dès que la connexion revient.
- **Synchronisation Temps Réel (Supabase)** : Les modifications de stocks ou de prix effectuées sur un poste de gestion sont répercutées instantanément sur tous les postes de vente en magasin.
- **Sécurité Multi-Tenant** : Isolation stricte des données. Chaque commerçant ne peut voir et modifier que ses propres données (Row Level Security SQL).

## 5. 🏛️ Conformité Légale (Certification NF525)
Fonctionnalités critiques pour le marché français, garantissant la légalité du logiciel.
- **Inaltérabilité des Données** : Impossibilité de modifier ou supprimer une vente passée sans laisser de trace comptable (avoirs).
- **Chaînage Cryptographique** : Chaque transaction est liée à la précédente par un hash sécurisé, rendant toute tentative de falsification détectable par le fisc.
- **Archivage Fiscal** : Archivage sécurisé sur 10 ans des données de ventes.

## 6. 📊 Gestion, Dashboard & Comptabilité Automatisée
Plus qu'une simple caisse, Heryze devient un assistant de gestion.
- **Comptabilité Automatisée** : 
    - Le système adapte ses calculs selon le statut de l'entreprise (TPE, PME, micro-entreprise) et son chiffre d'affaires.
    - Déduction automatique des taxes et charges basées sur les ventes réelles.
- **Exports Experts-Comptables** : Génération en un clic d'un dossier complet, précis et normé, prêt à être envoyé à l'expert-comptable pour la clôture ou les déclarations de TVA.
- **Dashboard Commerçant** : Visualisation des performances en temps réel (CA, panier moyen, produits phares, évolution des stocks).
- **Configuration Entreprise** : Gestion du SIRET, adresse, coordonnées et paramètres fiscaux avancés.
- **Mode Démo** : Possibilité de basculer en mode démonstration avec des données fictives pour tester toutes les fonctionnalités sans affecter les données réelles.
- **Génération de Tickets** : Création de tickets de caisse au format PDF ou thermique avec mentions légales dynamiques.

## 🎨 Design & Expérience Utilisateur (UX)
- **Esthétique Premium** : Design "Apple-grade" utilisant Tailwind CSS 4 et HeroUI.
- **Dark Mode Natif** : Pour le confort visuel des commerçants travaillant en environnement sombre ou le soir.
- **Micro-Animations** : Feedbacks visuels au clic (effet de pression physique) pour une expérience plus tactile et rassurante.

---

### 🎯 Objectif Business :
Proposer une alternative à **19-39€/mois** contre les leaders actuels (60-100€/mois) en misant sur l'économie de matériel et la simplicité du SaaS.
