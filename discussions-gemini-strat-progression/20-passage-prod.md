# 📑 Fiche Mémo : Passage en Production (Heryze)

Cette liste répertorie les actions critiques à effectuer sur le dashboard Supabase et votre hébergeur le jour du lancement public.

---

## 1️⃣ Configuration de l'Authentification (Supabase)

*   **Désactiver la confirmation d'email** : `Authentication > Providers > Email` -> décochez **"Confirm email"** pour permettre une inscription fluide.
*   **URL du site** : `Authentication > URL Configuration` -> remplacez `localhost` par votre domaine de production dans le champ **"Site URL"**.
*   **Redirections** : Dans **"Redirect URLs"**, gardez `http://localhost:5173` pour le dev et ajoutez votre URL réelle.

---

## 2️⃣ Activation du Realtime (Base de Données)

Le Realtime doit être activé manuellement par table dans l'interface Supabase :
1. Allez dans **Table Editor**.
2. Pour la table `products` : Cliquez sur **Edit Table** -> cochez **"Enable Realtime"**.
3. Pour la table `sales` : Idem.

> [!IMPORTANT]
> Cela permet aux stocks de se mettre à jour instantanément sur tous les iPads de la boutique dès qu'un article est bipé.

---

## 3️⃣ Sécurisation des Clés (GitHub/Cloudflare)

Ne poussez **jamais** votre fichier `.env` sur le dépôt Git.
*   Allez dans `Settings > Secrets and variables > Actions`.
*   Créez deux nouveaux **Repository Secrets** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

---

## 4️⃣ Validation du Schéma & Test Final

*   **Sync SQL** : Vérifiez que vous avez exécuté le `schema.sql` final (incluant `subscriptions` et les triggers).
*   **Test d'Étanchéité** : Créez deux comptes ("Client A" et "Client B"). Vérifiez que A ne voit **jamais** les produits de B (Preuve que le RLS fonctionne).