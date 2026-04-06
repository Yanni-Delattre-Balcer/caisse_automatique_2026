# Implémentation du Formulaire de Contact (Option E : Mailgun + Cloudflare Worker)

Ce plan détaille la mise en place du système d'envoi d'e-mail "zéro coût" en utilisant Mailgun et un Worker Cloudflare, calqué sur l'architecture robuste de Fufuni.

## ⚠️ Point crucial : Le compte Cloudflare de l'ami (Zéro Coût & Zéro Risque)

Avant toute chose, voici de quoi rassurer de manière stricte par rapport aux limites du compte Cloudflare gratuit et de la règle imposée :

1. **La base de données reste sur Supabase.** La règle d'or pour ne rien payer sur Cloudflare, c'est d'éviter d'utiliser leurs bases de données (Cloudflare D1, KV, Vectorize, etc.). Dans l'option E, le Worker Cloudflare n'est **PAS** une base de données. C'est juste un bout de code "fantôme" (un relais ou "proxy") qui s'allume pendant 10 millisecondes, prend le message, l'envoie à Mailgun, et s'éteint. Il ne stocke absolument **aucune donnée**, respectant à 100% la consigne : "il faudra juste pas utiliser la base de données de cloudflare".
2. **Quota ultra-large.** Le plan gratuit des Cloudflare Workers autorise **100 000 exécutions par jour**. Même si le formulaire de contact est utilisé 50 fois par jour, ça représentera seulement 0.05% de son quota quotidien. Cela n'affectera en rien ses limites globales ou ses autres sites (comme son site de foot) hébergés sur le même compte.
3. **Multi-domaines autorisé et encouragé.** Cloudflare encourage l'hébergement de dizaines de domaines sur le même compte gratuit. Il n'y a aucun risque de bannissement ou de blocage du compte gratuit pour avoir ajouté `heryze.com` et opéré un Worker dessus à côté de ses autres projets.

**Conclusion :** L'Option E peut être appliquée avec 100% de certitude. Le coût sera strictement de 0,00€, et le compte restera 100% fonctionnel et sûr.

---

## Ce qui sera fait côté Code (Par l'Agent)

### 1. Le Proxy Sécurisé (Cloudflare Worker)
Création d'un dossier séparé dans le projet qui contiendra le code du mini-serveur Cloudflare. Ce code restera sur votre ordinateur jusqu'à ce que vous le déployiez chez Cloudflare.
* **Fichier : `contact-worker/src/index.ts`**
  Le code exact détaillé dans l'option E de discussions-gemini-strat-progression/31-heryze_contact_email_zero_cout-CLAUDE.md, qui réceptionne le POST JSON du navigateur, valide l'e-mail, prépare un e-mail HTML propre en injectant la clé Mailgun secrète de manière cachée (invisible dans le front), et envoie le tout à l'API de Mailgun.
* **Fichier : `contact-worker/wrangler.toml`**
  Le fichier de configuration de Cloudflare disant au Worker de se placer sur l'url `heryze.com/api/contact`.

### 2. Le Frontend Heryze (Interface Utilisateur React)
* **Fichier : `src/components/ContactForm.jsx`**
  Le formulaire de contact moderne, propre, qui communique directement avec le Worker Cloudflare en lui envoyant juste les données saisies (sans divulguer de clé API privée dans le code source de la page !).
* **Fichiers : `.env` et `.env.example`**
  Ajout de la variable `VITE_CONTACT_WORKER_URL=https://heryze.com/api/contact` pour que l'interface Heryze sache à qui envoyer son message.

---

## Ce qui nécessitera une action manuelle de votre part

Puisque ce système manipule des accès sécurité externes (mots de passe, comptes cloud), vous devrez appliquer les manipulations suivantes vous-même, **mais je vous guiderai étape par étape au moment de le faire !**

1. **Compte Mailgun** : Créer le compte gratuit (Flex) sur Mailgun, lier le nom de domaine, et copier la Clé API.
2. **DNS Cloudflare** : Depuis le compte Cloudflare, ajouter les 4 lignes DNS (données par Mailgun) pour prouver au monde que vous possédez le site (ce qui empêchera les e-mails d'aller dans les spams).
3. **Déploiement du Worker** : Ouvrir un terminal et taper `wrangler deploy` pour envoyer le "code fantôme" chez Cloudflare en se connectant via une fenêtre navigateur au compte Cloudflare.
4. **Mise en place des secrets** : Passer la clé secrète Mailgun de manière sécurisée via la commande `wrangler secret put...` pour que personne ne puisse jamais la lire, mais que le Worker puisse l'utiliser.

---

## Question ouverte 

**À quel endroit du site web Heryze souhaitez-vous que ce formulaire apparaisse ?**
* Sur une page dédiée (ex: `heryze.com/contact`) ? 
* Tout en bas de la `LandingPageV2` (la page vitrine actuelle, section footer) ? 
* Accessible via un bouton global qui ouvre un modal ? 

*(Réfléchissez à cet emplacement et indiquez-le lorsque vous serez prêt à me donner le feu vert).*
