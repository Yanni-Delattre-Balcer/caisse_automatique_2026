# 🛠️ Guide d'Installation et Développement Local

Ce document explique comment installer et lancer le projet **Caisse Automatique Universelle 2026** sur un nouvel ordinateur (Mac, Linux ou Windows) après avoir cloné le dépôt.

---

## 1. Prérequis
Avant de commencer, assurez-vous d'avoir installé :
- **Node.js** (Version 18 ou supérieure recommandée)
- **npm** (installé par défaut avec Node.js)

---

## 2. Installation du Projet

### Étape A : Cloner le dépôt
(Supposons que vous ayez déjà accès au repo git)
```bash
git clone [URL_DU_REPO]
cd caisse_automatique_2026
```

### Étape B : Installer les dépendances
Cette commande va lire le fichier `package.json` et installer toutes les bibliothèques nécessaires (React 19, HeroUI, Zustand, Tailwind 4, etc.).
```bash
npm install
```

---

## 3. Configuration de l'Environnement
Pour que la connexion à Supabase fonctionne (une fois implémentée), vous devrez créer un fichier `.env` à la racine du projet :

```bash
touch .env
```

Ajoutez-y vos clés API Supabase (disponibles dans votre tableau de bord Supabase) :
```text
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
```

---

## 4. Lancement du Serveur de Développement
Pour lancer le projet en local avec rechargement automatique au moindre changement de code :

```bash
npm run dev
```

Une fois la commande lancée, l'application sera accessible (généralement) sur :
- **http://localhost:5173**

---

## 5. Commandes Utiles
- `npm run build` : Génère la version de production (dossier `/dist`).
- `npm run lint` : Vérifie les erreurs de syntaxe dans le code.
- `npm run preview` : Lance une prévisualisation locale de la version buildée.

---
**Navigation :** [Bilan Complet](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/7-bilan-strategique-technique-complet.md) | [Stratégie SaaS](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/3-strat2.md)
