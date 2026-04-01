# 🌐 Gestion des Environnements (Local vs Production)

Pour qu'Heryze devienne un SaaS professionnel, il est crucial de séparer proprement les environnements de test et de mise en ligne réelle.

---

## 🛠️ 1. Configuration des fichiers `.env`

Ne mélangez pas vos clés de développement et de production. Voici la règle d'or avec Vite :

### 💻 Local (Développement)
Utilisez votre fichier `.env` habituel.
- **URL** : `http://localhost:5173`
- **Clés** : Vos clés Supabase de test.

### 🚀 Production (GitHub Pages / Cloudflare)
Sur votre hébergeur (GitHub ou Cloudflare), **n'uploadez jamais le fichier .env**.
- **Action** : Ajoutez vos variables (`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`) directement dans les **Secrets** de votre dépôt (Settings > Secrets and variables > Actions).
- **Bénéfice** : Le script de déploiement les injectera de manière sécurisée sans qu'elles apparaissent dans votre code source public.
