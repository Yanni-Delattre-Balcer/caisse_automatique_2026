# 🛠️ Roadmap Fonctionnelle et Expérience Utilisateur (UX)

Pour que Heryze soit "utilisable demain", il doit passer du statut d'outil de saisie à celui d'**assistant de gestion**. Un commerçant veut que l'outil travaille pour lui.

---

## 1. Pour l'Auto-Entrepreneur (Le "Starter") 👤
*L'objectif : Clarté et Éducation.*

### 👨‍🏫 Le "Coach Compta" intégré
Intégration de Tooltips (bulles d'aide) pédagogiques.
*   **Calcul des cotisations :** Affichage en temps réel de ce qu'il faut mettre de côté pour l'URSSAF à chaque vente.
*   **Bénéfice Net :** "Votre CA est de 2000€. Après charges, votre bénéfice net estimé est de X€."

### 📄 Facturation agile
Génération immédiate de factures PDF propres et légales pour les clients.

---

## 2. Pour le Petit Commerce & Équipe (Le "Business") 👥
*L'objectif : Sécurité et Collaboration.*

### 🏁 Gestion des "Z-Caisse"
Clôture de caisse quotidienne récapitulant les espèces, cartes et chèques.

### 📦 Gestion de Stock Visuelle
*   **Alertes critiques :** Animation visuelle (clignotement doux) pour les produits < 2 unités.
*   **Liste de courses :** Génération automatique de la liste de réapprovisionnement pour les fournisseurs.

---

## 3. Pour le Gros Commerce (L' "Expert") 🏢
*L'objectif : Analyse Stratégique et Automatisation.*

### 🔄 Multi-terminaux Synchronisés
Une vente commencée sur la tablette A peut être clôturée sur la tablette B (crucial pour la restauration).

### 🧠 IA Advisor & Compta Expert
*   **IA Advisor :** "Vos ventes de boissons baissent le samedi, envisagez un Happy Hour."
*   **Exports Normés :** Fichiers compatibles avec les logiciels comptables (FEC, .csv spécifiques).

---

## 4. Checklist "Demain" : Les Incontournables 📋

> [!IMPORTANT]
> **Le Mode Hors-Ligne (Offline First) :** Enregistrement local via IndexedDB et synchronisation automatique avec Supabase dès le retour du Wi-Fi.

- [ ] **Gestion des remises :** Bouton rapide sur l'interface (-10% ou montant fixe).
- [ ] **Ticket dématérialisé :** Envoi automatique par mail via Resend (écolo + construction de base mail).
- [ ] **Optimisation Tactile :** Gros boutons pour les best-sellers et Drag & Drop pour les catégories.

---

## 💡 Le "Petit Plus" Heryze

Au lieu de colonnes de chiffres froides, misez sur la **Visualisation**.

> [!TIP]
> **Micro-animations WOW :** Un graphique circulaire qui affiche le "produit star" au survol, avec une animation de confettis si le record de vente de la journée est battu.