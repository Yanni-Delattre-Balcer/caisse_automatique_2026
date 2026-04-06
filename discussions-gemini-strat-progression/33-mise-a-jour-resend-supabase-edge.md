# Mise à jour de l'architecture d'e-mail (Avril 2026) : Transition de Mailgun vers Resend + Supabase

## 🚨 Contexte de la modification
L'offre Mailgun "Flex" historique (qui offrait systématiquement 3000 e-mails gratuits par mois sans carte bancaire) a récemment été dépréciée par Mailgun pour les nouveaux comptes. 

L'architecture basée sur Cloudflare Workers + Mailgun (similaire au projet Fufuni) devient donc invalide pour un projet respectant la contrainte du "zéro coût absolu".

## 🚀 La nouvelle solution : Resend + Supabase Edge Functions
**Resend** offre 3000 e-mails gratuits (100/jour) sans carte bleue requise. Puisque Resend s'intègre nativement à l'écosystème avec de simples `fetch`, la solution la plus élégante et sécurisée sans solliciter davantage Cloudflare consiste à utiliser les **Edge Functions de Supabase**.

### Pourquoi cette option coche toutes les cases :
1. **Sécurité :** La clé API de Resend n'est jamais exposée publiquement (le principal défaut de l'option A d'origine).
2. **Infrastructure unifiée :** Vous gérez déjà Supabase pour votre base de données (ce qui tranquillise votre ami concernant son compte Cloudflare).
3. **Zéro surcoût / Zéro CB :** Le plan gratuit de Supabase octroie 500 000 exécutions de Edge Functions par mois (inatteignable avec un formulaire de contact) et Resend octroie 3000 e-mails. Zéro carte bancaire nécessaire.

## Modfications effectuées sur le projet

1. **Suppression du Worker Cloudflare** : Le dossier `contact-worker/` ainsi que toutes ses configurations ont été retirés.
2. **Supabase Edge Function** : Création d'une fonction Deno dans `supabase/functions/send-contact/index.ts` qui appelle l'API Resend de manière sécurisée.
3. **Frontend React** : Le composant `ContactForm.jsx` utilise maintenant directement le client existant `supabase.functions.invoke('send-contact')`, garantissant que ça fonctionne parfaitement avec l'authentification et qu'on n'a pas besoin de variable d'environnement tierce comme le `CONTACT_WORKER_URL`.

## Ce que vous devez configurer (Étape Finale)

Au lieu de Cloudflare et Mailgun, vous n'avez besoin que d'une seule étape :

1. **Créer le compte Resend :** Allez sur [resend.com](https://resend.com) et créez un compte (gratuit, sans CB).
2. **Vérifier le domaine :** Ajoutez le domaine `heryze.com` et configurez les DNS sur Cloudflare comme le demandera l'interface Resend.
3. **Générer l'API Key :** Créez une nouvelle clé API Resend.
4. **Insérer le secret dans Supabase :** Ouvrez votre terminal, à la racine du projet, et lancez la commande suivante pour stocker la clé Resend et votre e-mail perso de manière sécurisée dans votre projet Supabase :
   ```bash
   supabase secrets set RESEND_API_KEY=re_votre_cle_secrete
   supabase secrets set ADMIN_EMAIL=votre_email_de_reception@gmail.com
   ```
5. **Déployer la fonction :**
   ```bash
   supabase functions deploy send-contact
   ```
