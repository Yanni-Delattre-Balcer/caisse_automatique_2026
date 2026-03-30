# 💻 Guide d'Installation Local (Pour les Collaborateurs)

Ce fichier détaille **très précisément** la marche à suivre pour installer le projet sur ta machine.
En suivant ces étapes, tu seras assuré(e) d'avoir **exactement** la même base de code et la même configuration que le reste de l'équipe.

## Prérequis

1. **Node.js** : Assure-toi d'avoir Node.js installé (idéalement la version LTS actuelle, v20 ou supérieure). Tu peux vérifier avec :
   ```bash
   node -v
   ```
2. **Git** : Pour cloner et gérer les versions du projet.

---

## Étape 1 : Récupérer le Projet

Clone le dépôt Git sur ta machine si ce n'est pas déjà fait :
```bash
git clone <URL_DU_DEPOT>
cd caisse_automatique_2026
```
*(Remplace `<URL_DU_DEPOT>` par l'URL exacte du repo GitHub/GitLab).*

---

## Étape 2 : Installer les Dépendances

Nous utilisons `npm` (installé par défaut avec Node.js). Dans le dossier du projet (`caisse_automatique_2026`), exécute :

```bash
npm install
```
Cela va lire le fichier `package.json` ainsi que le `package-lock.json` pour installer **les versions exactes** de toutes nos dépendances (React 19, Vite, Tailwind v4, HeroUI, Supabase, etc.).

---

## Étape 3 : Configurer les Variables d'Environnement

Le projet communique avec **Supabase** (notre backend/base de données). Pour des raisons de sécurité, ces clés ne sont pas sur Git.

1. À la racine du projet, crée un fichier nommé **exactement** `.env` (si tu es sur Mac, assure-toi qu'il ne soit pas nommé `.env.txt`).
2. Demande-moi les clés (URL et clé publique "anon") et colle-les dans le fichier sous ce format :

```env
VITE_SUPABASE_URL=https://ton-url-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta-clef-publique-longue
```
*(Ces variables commencent par `VITE_` pour être lisibles par l'application React).*

---

## Étape 4 : Lancer le Serveur de Développement

Une fois les dépendances installées et les variables d'environnement configurées, lance le serveur local :

```bash
npm run dev
```

- Le terminal t'affichera une URL locale de type : `http://localhost:5173/`
- Ouvre cette URL dans ton navigateur pour voir l'application (idéalement Chrome ou Firefox).
- Le serveur inclut le **Hot Module Replacement (HMR)** : dès que tu sauvegarderas une modification dans le code (ex: dans le dossier `src/`), le navigateur se mettra à jour instantanément sans recharger la page.

---

## 💡 Astuces & Dépannage

- **Mode Démo** : Si tu n'as pas encore accès à la base de données Supabase ou pas de connexion internet, tu peux activer le mode démo dans l'application pour avoir un catalogue factice et tester l'UI.
- **Dépendances désynchronisées** : Si jamais le projet ne se lance plus suite à un "pull" (récupération des modifications), supprime le dossier `node_modules` et relance `npm install`.
