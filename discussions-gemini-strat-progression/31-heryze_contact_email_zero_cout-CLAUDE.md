# Heryze — Formulaire de Contact à Coût Zéro
> Stratégie d'implémentation · Zéro serveur · Zéro coût
> Adaptation du système FastAPI/SMTP vers une architecture CSR-compatible

---

## Contexte & Problème

Le système de contact existant (autre projet) repose sur un backend **FastAPI + Python + SMTP Gmail**. Ce backend doit tourner en continu pour répondre aux requêtes POST du formulaire.

Pour Heryze, ce modèle est incompatible avec la stratégie actuelle pour trois raisons :

**Raison 1 — Coût.** Un serveur FastAPI nécessite un hébergement. Les plans gratuits de Render, Railway ou Fly.io sont limités dans le temps ou en ressources, et deviennent payants dès que le trafic augmente légèrement.

**Raison 2 — Cold start.** Sur les plans gratuits, le serveur s'endort après 15 minutes d'inactivité. Le premier visiteur qui soumet le formulaire attend 30 à 60 secondes sans retour visuel — une expérience catastrophique.

**Raison 3 — Maintenance.** Un backend Python séparé est un second projet à maintenir, déployer, surveiller. Pour deux étudiants avec un MVP à finir, c'est une charge injustifiée pour une fonctionnalité aussi simple.

---

## Les 4 Options à Coût Zéro — Analyse Comparative

### Option A — Resend (Recommandation principale)

**Ce que c'est :** Resend est un service d'envoi d'emails moderne, créé par d'anciens ingénieurs de Vercel. Il propose une API REST simple appelable directement depuis le navigateur, sans aucun serveur intermédiaire.

**Plan gratuit :** 3 000 emails/mois, 100/jour. Largement suffisant pour un formulaire de contact en phase MVP et bien au-delà.

**Comment ça fonctionne avec Heryze :**
Le formulaire React appelle l'API Resend directement depuis le navigateur, exactement comme il appelle l'API Supabase. Aucun serveur. Aucune fonction Edge. Juste un `fetch` vers `https://api.resend.com/emails`.

**Implémentation complète :**

```typescript
// src/components/ContactForm.tsx

import { useState } from 'react';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

interface FormData {
  name: string;
  email: string;
  message: string;
}

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'contact@heryze.com',        // Votre domaine vérifié dans Resend
          to: [ADMIN_EMAIL],
          reply_to: formData.email,           // Répondre directement à l'expéditeur
          subject: `Nouveau contact Heryze — ${formData.name}`,
          html: `
            <h2>Nouveau message de contact</h2>
            <p><strong>Nom :</strong> ${formData.name}</p>
            <p><strong>Email :</strong> ${formData.email}</p>
            <hr />
            <p><strong>Message :</strong></p>
            <p>${formData.message.replace(/\n/g, '<br />')}</p>
          `,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de l\'envoi');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (success) {
    return (
      <div>
        <p>Message envoyé ! Nous vous répondrons dans les 48h.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        type="text"
        placeholder="Votre nom"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Votre email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <textarea
        name="message"
        placeholder="Votre message"
        value={formData.message}
        onChange={handleChange}
        required
        rows={5}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Envoi...' : 'Envoyer'}
      </button>
    </form>
  );
}
```

**Variables `.env` à ajouter :**
```
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
VITE_CONTACT_EMAIL=contact@heryze.com
```

**Configuration Resend (une seule fois) :**
1. Créer un compte sur [resend.com](https://resend.com) — gratuit
2. Vérifier le domaine `heryze.com` (ajouter 2 enregistrements DNS dans Cloudflare — 5 minutes)
3. Générer une clé API
4. L'ajouter dans `.env`

**Verdict : C'est l'option recommandée.** Simple, rapide, zéro serveur, zéro cold start, 3 000 emails gratuits par mois.

---

### Option B — Supabase Edge Functions (Si Resend pose problème)

**Ce que c'est :** Supabase propose des Edge Functions — des fonctions serverless qui s'exécutent en quelques millisecondes, sans serveur permanent, et uniquement quand elles sont appelées.

**Plan gratuit Supabase :** 500 000 invocations/mois. Un formulaire de contact ne dépassera jamais ça.

**Avantage vs Resend :** La clé API Resend n'est pas exposée dans le navigateur (elle reste côté Edge Function). C'est plus propre en termes de sécurité.

**Inconvénient vs Resend :** Nécessite d'écrire et déployer une Edge Function Deno — légèrement plus de setup.

**Implémentation :**

```typescript
// supabase/functions/send-contact/index.ts
// (déployée via : supabase functions deploy send-contact)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const { name, email, message } = await req.json();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'contact@heryze.com',
      to: [ADMIN_EMAIL],
      reply_to: email,
      subject: `Nouveau contact Heryze — ${name}`,
      html: `<p><strong>${name}</strong> (${email})</p><p>${message}</p>`,
    }),
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
```

**Appel depuis le frontend :**
```typescript
const { data, error } = await supabase.functions.invoke('send-contact', {
  body: { name, email, message },
});
```

**Verdict : Bonne option si vous voulez garder la clé Resend côté serveur.** Légèrement plus de setup, mais reste dans l'écosystème Supabase que vous maîtrisez déjà.

---

### Option C — Cloudflare Workers (Alternative pure Cloudflare)

**Ce que c'est :** Puisque votre domaine `heryze.com` est déjà sur Cloudflare, vous pouvez déployer une Worker — une fonction serverless qui tourne sur le réseau Cloudflare, ultra-rapide, sans cold start.

**Plan gratuit Cloudflare Workers :** 100 000 requêtes/jour. Impossible à dépasser pour un formulaire de contact.

**Avantage :** Intégration native avec Cloudflare, zéro latence (exécution au plus proche de l'utilisateur), clé API sécurisée côté Worker.

**Inconvénient :** Un outil de plus à apprendre (`wrangler` CLI). Et votre ami avait décidé de ne pas utiliser les Workers Cloudflare pour la DB — mais ici c'est pour de l'envoi d'email, pas de la DB, donc pas de conflit.

**Implémentation :**
```javascript
// worker.js (déployé avec : wrangler deploy)

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const { name, email, message } = await request.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'contact@heryze.com',
        to: [env.ADMIN_EMAIL],
        reply_to: email,
        subject: `Nouveau contact Heryze — ${name}`,
        html: `<p><strong>${name}</strong> (${email})</p><p>${message}</p>`,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
```

**Verdict : Excellente option si vous êtes à l'aise avec Cloudflare.** Mais ajoute une complexité de déploiement supplémentaire inutile si Resend direct suffit.

---

### Option D — Formspree / Web3Forms (Zéro code)

**Ce que c'est :** Des services tiers qui reçoivent les soumissions de formulaire et les redirigent par email. Votre formulaire HTML envoie directement vers leur endpoint. Vous ne gérez rien.

**Plan gratuit Formspree :** 50 soumissions/mois. **Web3Forms :** 250/mois.

**Exemple Web3Forms (le plus généreux en gratuit) :**
```typescript
const response = await fetch('https://api.web3forms.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    access_key: import.meta.env.VITE_WEB3FORMS_KEY, // Clé publique, pas de risque
    name: formData.name,
    email: formData.email,
    message: formData.message,
  }),
});
```

**Verdict : Acceptable pour un MVP rapide, mais 250 soumissions/mois est une limite basse.** À éviter si vous espérez une traction réelle sur le formulaire. Et vous perdez le contrôle total sur l'apparence et le contenu de l'email reçu.

---

## Comparatif Final

| Critère | FastAPI (actuel) | Resend direct | Supabase Edge | Cloudflare Worker | Formspree/Web3 |
|---|---|---|---|---|---|
| Coût mensuel | Variable (0-5 €) | **0 €** | **0 €** | **0 €** | **0 €** |
| Cold start | Oui (30-60s) | **Non** | **Non (<100ms)** | **Non (<10ms)** | **Non** |
| Setup | Élevé | **Très faible** | Moyen | Moyen | **Très faible** |
| Clé API exposée | Non | Oui (acceptable) | **Non** | **Non** | Non |
| Emails gratuits/mois | Illimité (SMTP) | **3 000** | **500k invocations** | **100k req/jour** | 250 |
| Maintenance | Élevée | **Nulle** | Faible | Faible | **Nulle** |
| Intégration Heryze | Rupture (backend séparé) | **Parfaite (CSR)** | **Parfaite (Supabase déjà en place)** | Bonne | Correcte |

---

### Option E — Mailgun via Cloudflare Worker (Pattern Fufuni — Recommandation de votre expert)

#### Comprendre le pattern de Fufuni

Après analyse du README et de l'architecture de Fufuni, voici exactement comment votre expert a construit son système d'emails. Ce n'est pas Mailgun appelé directement depuis le navigateur. Le schéma est le suivant :

```
Navigateur React
      |
      | POST JSON (nom, email, message)
      ↓
Cloudflare Worker  ← clé Mailgun stockée ici, jamais visible dans le navigateur
      |
      | POST form-data (API Mailgun)
      ↓
API Mailgun
      |
      | Envoi SMTP
      ↓
Boîte mail du destinataire
```

Le Worker Cloudflare joue le rôle de **proxy sécurisé**. Il reçoit la requête du navigateur, injecte la clé API Mailgun (stockée dans les secrets Cloudflare, jamais exposée), et transmet à Mailgun. C'est architecturalement identique à ce que fait Fufuni pour ses emails de confirmation de commande.

**Pourquoi ce pattern est supérieur à l'appel direct Mailgun depuis le navigateur :**
Mailgun, contrairement à Resend, **interdit explicitement** dans ses CGU l'usage de sa clé API privée côté client. Une clé Mailgun exposée dans le bundle JavaScript permet à n'importe qui d'envoyer des milliers d'emails depuis votre domaine, épuisant votre quota gratuit et potentiellement vous faisant basculer en payant.

---

#### Ce qu'est Mailgun

Mailgun est un service d'envoi d'emails transactionnel créé par Rackspace. Il est utilisé par des millions d'applications en production. Son plan gratuit (Flex) offre **3 000 emails gratuits par mois** — identique à Resend — mais son API est plus ancienne et son format d'envoi utilise `multipart/form-data` plutôt que JSON, ce qui change légèrement le code.

**Plan gratuit Mailgun :** 3 000 emails/mois, logs conservés 1 jour (suffisant pour un formulaire de contact MVP).

**Région :** Mailgun a deux régions : US (`api.mailgun.net`) et EU (`api.eu.mailgun.net`). Pour un projet français, préférer la région EU pour la conformité RGPD.

---

#### Configuration Mailgun (une seule fois)

**Étape 1 — Créer un compte sur [mailgun.com](https://mailgun.com)**
Choisir le plan Flex (gratuit). Pas de carte bancaire requise pour 3 000 emails/mois.

**Étape 2 — Ajouter le domaine `heryze.com`**
Dans le dashboard Mailgun → Sending → Domains → Add New Domain.
Recommandation : utiliser un sous-domaine dédié comme `mg.heryze.com` pour ne pas interférer avec votre email principal.

**Étape 3 — Configurer les DNS dans Cloudflare**
Mailgun vous donnera 4 enregistrements DNS à ajouter (2 TXT pour la vérification SPF/DKIM, 2 CNAME pour le tracking). Dans Cloudflare, les ajouter avec le proxy **désactivé** (nuage gris, pas orange) pour les enregistrements CNAME.

**Étape 4 — Récupérer la clé API privée**
Dans Mailgun → Account Settings → API Security → Private API Key. Cette clé commence par `key-`. **Ne jamais la mettre dans le frontend.**

---

#### Le Cloudflare Worker — Code complet

Créer un nouveau fichier `contact-worker/src/index.ts` dans votre repo (ou dans un repo séparé si vous préférez) :

```typescript
// contact-worker/src/index.ts
// Cloudflare Worker — Proxy sécurisé Mailgun pour le formulaire de contact Heryze
// Déployé via : wrangler deploy
// Variables secrètes : wrangler secret put MAILGUN_API_KEY
//                      wrangler secret put MAILGUN_DOMAIN
//                      wrangler secret put ADMIN_EMAIL

export interface Env {
  MAILGUN_API_KEY: string;   // Clé privée Mailgun — jamais exposée dans le front
  MAILGUN_DOMAIN: string;    // ex: mg.heryze.com
  ADMIN_EMAIL: string;       // Email de réception des messages de contact
  ALLOWED_ORIGIN: string;    // ex: https://heryze.com (sécurité CORS)
}

// Helpers CORS — nécessaires pour les requêtes cross-origin depuis le navigateur
function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';

    // Preflight OPTIONS — réponse immédiate pour les requêtes CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env.ALLOWED_ORIGIN),
      });
    }

    // Seules les requêtes POST sont acceptées
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env.ALLOWED_ORIGIN) },
      });
    }

    // Lire et valider le body JSON envoyé par le formulaire React
    let body: { name: string; email: string; message: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env.ALLOWED_ORIGIN) },
      });
    }

    const { name, email, message } = body;

    // Validation minimale des champs
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Champs manquants : name, email, message requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env.ALLOWED_ORIGIN) },
      });
    }

    // Validation format email (protection basique anti-bot)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Format email invalide' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env.ALLOWED_ORIGIN) },
      });
    }

    // Construction du payload Mailgun
    // IMPORTANT : Mailgun attend du multipart/form-data, PAS du JSON
    const formData = new FormData();
    formData.append('from', `Formulaire Heryze <contact@${env.MAILGUN_DOMAIN}>`);
    formData.append('to', env.ADMIN_EMAIL);
    formData.append('reply-to', email); // Permet de répondre directement à l'expéditeur
    formData.append('subject', `[Heryze] Nouveau message de ${name}`);
    formData.append('text', `Nom : ${name}\nEmail : ${email}\n\nMessage :\n${message}`);
    formData.append('html', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #378ADD; padding-bottom: 8px;">
          Nouveau message de contact — Heryze
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555; width: 80px;">Nom</td>
            <td style="padding: 8px;">${name}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold; color: #555;">Email</td>
            <td style="padding: 8px;">
              <a href="mailto:${email}" style="color: #378ADD;">${email}</a>
            </td>
          </tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
          <p style="font-weight: bold; color: #555; margin: 0 0 8px;">Message :</p>
          <p style="margin: 0; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #999;">
          Envoyé depuis le formulaire de contact de heryze.com
        </p>
      </div>
    `);

    // Appel à l'API Mailgun — région EU (api.eu.mailgun.net pour conformité RGPD)
    // Si vous utilisez la région US, remplacer par : https://api.mailgun.net/v3/
    const mailgunUrl = `https://api.eu.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;

    try {
      const mailgunResponse = await fetch(mailgunUrl, {
        method: 'POST',
        headers: {
          // Authentification Mailgun : Basic Auth avec "api" comme username
          Authorization: `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      });

      if (!mailgunResponse.ok) {
        const errorData = await mailgunResponse.text();
        console.error('Mailgun error:', mailgunResponse.status, errorData);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de l\'envoi de l\'email', details: errorData }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(env.ALLOWED_ORIGIN) },
          }
        );
      }

      const mailgunData = await mailgunResponse.json() as { id: string; message: string };

      return new Response(
        JSON.stringify({ success: true, messageId: mailgunData.id }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(env.ALLOWED_ORIGIN) },
        }
      );
    } catch (error) {
      console.error('Network error calling Mailgun:', error);
      return new Response(
        JSON.stringify({ error: 'Erreur réseau, veuillez réessayer' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(env.ALLOWED_ORIGIN) },
        }
      );
    }
  },
};
```

---

#### Configuration `wrangler.toml` du Worker

Créer `contact-worker/wrangler.toml` :

```toml
name = "heryze-contact"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Route : le Worker répond sur cette URL
# Remplacer heryze.com par votre domaine réel
[[routes]]
pattern = "heryze.com/api/contact"
zone_name = "heryze.com"

# Variables non-secrètes (peuvent être publiques)
[vars]
ALLOWED_ORIGIN = "https://heryze.com"

# Les secrets (MAILGUN_API_KEY, MAILGUN_DOMAIN, ADMIN_EMAIL)
# sont injectés via la commande : wrangler secret put NOM_VARIABLE
# Ils ne doivent JAMAIS être dans ce fichier
```

---

#### Déploiement du Worker (commandes)

```bash
# 1. Installer Wrangler CLI (une seule fois)
npm install -g wrangler

# 2. S'authentifier sur Cloudflare
wrangler login

# 3. Aller dans le dossier du worker
cd contact-worker

# 4. Installer les dépendances
npm install

# 5. Ajouter les secrets (chaque commande vous demandera la valeur en prompt sécurisé)
wrangler secret put MAILGUN_API_KEY
# → Entrer votre clé Mailgun (ex: key-abc123...)

wrangler secret put MAILGUN_DOMAIN
# → Entrer votre domaine (ex: mg.heryze.com)

wrangler secret put ADMIN_EMAIL
# → Entrer votre email de réception (ex: contact@heryze.com)

# 6. Tester localement avant de déployer
wrangler dev

# 7. Déployer en production
wrangler deploy
```

---

#### Le composant React — Côté frontend Heryze

Le formulaire React est très simple car il n'a aucune logique d'authentification ni de clé à gérer. Il envoie juste un POST JSON vers l'URL du Worker :

```typescript
// src/components/ContactForm.tsx

import { useState } from 'react';

// URL du Worker Cloudflare déployé
// En développement local, pointer vers : http://localhost:8787/api/contact
// En production : https://heryze.com/api/contact
const CONTACT_WORKER_URL = import.meta.env.VITE_CONTACT_WORKER_URL ?? 'https://heryze.com/api/contact';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

export function ContactForm() {
  const [state, setState] = useState<FormState>({
    loading: false,
    success: false,
    error: null,
  });

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setState((prev) => ({ ...prev, error: null })); // Effacer l'erreur au retape
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ loading: true, success: false, error: null });

    try {
      const response = await fetch(CONTACT_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur inconnue lors de l\'envoi');
      }

      setState({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', message: '' });

      // Retour au formulaire après 5 secondes
      setTimeout(() => setState((prev) => ({ ...prev, success: false })), 5000);

    } catch (err) {
      const error = err as Error;
      setState({ loading: false, success: false, error: error.message });
    }
  };

  // État de succès — affiché pendant 5 secondes
  if (state.success) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <p style={{ color: '#639922', fontWeight: 500, fontSize: '18px' }}>
          ✓ Message envoyé avec succès !
        </p>
        <p style={{ color: '#888', fontSize: '14px' }}>
          Nous vous répondrons dans les 48h.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="name">Nom *</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Votre nom ou nom de commerce"
          disabled={state.loading}
        />
      </div>

      <div>
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="votre@email.com"
          disabled={state.loading}
        />
      </div>

      <div>
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          placeholder="Décrivez votre besoin ou posez votre question..."
          disabled={state.loading}
        />
      </div>

      {state.error && (
        <p style={{ color: '#A32D2D', fontSize: '14px', marginTop: '8px' }}>
          ⚠ {state.error}
        </p>
      )}

      <button type="submit" disabled={state.loading}>
        {state.loading ? 'Envoi en cours...' : 'Envoyer le message'}
      </button>
    </form>
  );
}
```

**Variable `.env` à ajouter :**
```
# Optionnel — par défaut utilise l'URL de production
VITE_CONTACT_WORKER_URL=https://heryze.com/api/contact
```

---

#### Flux complet expliqué étape par étape

```
1. L'utilisateur remplit le formulaire et clique "Envoyer"
   └── React appelle handleSubmit()

2. handleSubmit() envoie un POST JSON vers le Worker Cloudflare
   └── Body : { name: "Jean", email: "jean@example.com", message: "Bonjour..." }
   └── Aucune clé API dans cette requête — le navigateur ne connaît pas Mailgun

3. Le Worker Cloudflare reçoit la requête
   └── Valide les champs (pas vide, format email correct)
   └── Récupère MAILGUN_API_KEY depuis les secrets Cloudflare (jamais dans le code)
   └── Construit un FormData multipart pour l'API Mailgun
   └── Envoie à https://api.eu.mailgun.net/v3/mg.heryze.com/messages

4. Mailgun reçoit la requête
   └── Vérifie que le domaine mg.heryze.com est bien vérifié (DNS SPF/DKIM)
   └── Envoie l'email vers contact@heryze.com
   └── Retourne { id: "<xxx@mg.heryze.com>", message: "Queued. Thank you." }

5. Le Worker renvoie { success: true } au navigateur

6. React affiche le message de confirmation pendant 5 secondes
```

---

#### Comparaison avec le système FastAPI original

| Aspect | FastAPI + Gmail SMTP | Worker + Mailgun |
|---|---|---|
| Serveur permanent | Oui (tourne 24h/24) | Non (serverless, instancié à la demande) |
| Cold start | 30-60s (plan gratuit Render) | < 5ms (Cloudflare edge) |
| Clé exposée dans le front | Possible si mal configuré | Impossible (secrets Cloudflare) |
| Coût | Variable (0-5 €/mois) | 0 € |
| Quota emails/mois | Illimité (SMTP Gmail) | 3 000 (Mailgun gratuit) |
| Réputation email | Faible (Gmail SMTP = spam souvent) | Excellente (Mailgun = délivrabilité pro) |
| DKIM / SPF | Non configuré | Automatique via DNS Mailgun |
| Maintenance | Élevée | Quasi nulle |

---

#### Pourquoi la délivrabilité de Mailgun est meilleure que Gmail SMTP

Quand vous envoyez via `smtplib` Python avec un compte Gmail, vos emails arrivent souvent en spam chez les destinataires car Gmail voit ça comme une connexion suspecte (un script automatisé qui se connecte à votre compte). Mailgun en revanche est un service d'envoi professionnel avec des IPs dédiées et une réputation établie. Vos emails arriveront en boîte de réception.

---

#### Checklist d'implémentation complète (Option E — ~1h30)

```
□ MAILGUN (30 min)
  □ Créer un compte sur mailgun.com (plan Flex gratuit)
  □ Ajouter le domaine mg.heryze.com
  □ Ajouter les 4 enregistrements DNS dans Cloudflare (proxy désactivé pour CNAME)
  □ Attendre la vérification Mailgun (souvent < 10 minutes)
  □ Copier la clé API privée

□ CLOUDFLARE WORKER (45 min)
  □ Installer wrangler : npm install -g wrangler
  □ Se connecter : wrangler login
  □ Créer le dossier contact-worker/ avec src/index.ts (code ci-dessus)
  □ Créer wrangler.toml (code ci-dessus)
  □ Ajouter les secrets :
        wrangler secret put MAILGUN_API_KEY
        wrangler secret put MAILGUN_DOMAIN
        wrangler secret put ADMIN_EMAIL
  □ Tester en local : wrangler dev
  □ Tester manuellement avec curl :
        curl -X POST http://localhost:8787/api/contact \
          -H "Content-Type: application/json" \
          -d '{"name":"Test","email":"test@example.com","message":"Bonjour"}'
  □ Déployer : wrangler deploy

□ FRONTEND HERYZE (15 min)
  □ Créer src/components/ContactForm.tsx (code ci-dessus)
  □ Intégrer dans la landing page ou la page appropriée
  □ Tester le formulaire complet en production
```

---

## Recommandation Finale — Ce que vous devez faire

### Maintenant (MVP, phase pré-bêta) → Option E : Mailgun + Cloudflare Worker

C'est la solution recommandée par votre expert, et c'est la bonne décision pour trois raisons : la clé API n'est jamais exposée dans le navigateur (contrairement à Resend direct), la délivrabilité est professionnelle (vos emails n'iront pas en spam), et le coût est 0 € comme tout le reste de votre stack.

Le setup prend environ 1h30 la première fois, mais c'est un investissement unique. Une fois déployé, vous n'y retouchez plus.

### Si vous voulez quelque chose de plus rapide ce soir → Option A : Resend direct

Si vous êtes pressés et voulez juste que le formulaire marche maintenant, Resend direct prend 30 minutes. Vous migrerez vers Mailgun + Worker plus tard. Les deux options ont le même quota gratuit (3 000 emails/mois).

### Quand vous aurez vos premiers revenus → Aucun changement nécessaire

Le pattern Mailgun + Worker est déjà la solution la plus propre et la plus scalable. Vous n'avez pas besoin de migrer vers quoi que ce soit d'autre, même avec 10 000 clients.

---

## Comparatif Final (mis à jour)

| Critère | FastAPI/Gmail | Resend direct | Supabase Edge | Cloudflare Worker + Mailgun | Web3Forms |
|---|---|---|---|---|---|
| Coût | Variable | **0 €** | **0 €** | **0 €** | **0 €** |
| Cold start | Oui (30-60s) | **Non** | **Non** | **Non (<5ms)** | **Non** |
| Clé exposée | Non | Oui (acceptable) | **Non** | **Non (secrets CF)** | Non |
| Délivrabilité | Faible (spam) | Bonne | Bonne | **Excellente (DKIM/SPF)** | Moyenne |
| Emails gratuits/mois | Illimité | 3 000 | 500k invocations | **3 000** | 250 |
| Setup | Élevé | **30 min** | 45 min | **~1h30** | **15 min** |
| Maintenance | Élevée | **Nulle** | Faible | **Quasi nulle** | **Nulle** |
| Pattern Fufuni | Non | Non | Non | **✅ Oui** | Non |

---

## Note sur la sécurité de la clé API Resend en CSR

La question légitime est : "Exposer une clé API dans le navigateur, c'est un risque ?"

Pour une clé SMTP (comme dans le projet FastAPI original), **oui, c'est un risque énorme** — quelqu'un qui récupère votre mot de passe Gmail peut envoyer des emails depuis votre compte à n'importe qui.

Pour une clé Resend **configurée correctement**, le risque est limité et gérable :
- Dans le dashboard Resend, créer une clé API avec uniquement la permission `emails:send`
- Vérifier le domaine `heryze.com` — Resend ne permet d'envoyer qu'avec ce domaine comme expéditeur
- Un attaquant qui récupère la clé peut au maximum vous envoyer des emails à vous-mêmes (vous êtes le seul destinataire configuré)

Ce niveau de risque est identique à celui d'une clé Supabase `anon` exposée dans le navigateur — que vous faites déjà depuis le début du projet.

---

## Checklist d'implémentation (Option A — 30 minutes)

```
□ 1. Créer un compte sur resend.com (2 min)
□ 2. Vérifier le domaine heryze.com dans Resend
      → Ajouter 2 enregistrements DNS dans Cloudflare (5 min)
      → Attendre la validation (jusqu'à 24h, souvent instantané)
□ 3. Générer une clé API Resend (permission: emails:send uniquement)
□ 4. Ajouter dans .env :
      VITE_RESEND_API_KEY=re_xxxx
      VITE_CONTACT_EMAIL=votre@email.com
□ 5. Créer src/components/ContactForm.tsx (code ci-dessus)
□ 6. Intégrer dans la landing page ou la page Paramètres
□ 7. Tester en local avec un vrai envoi
□ 8. Vérifier que les variables sont bien configurées sur
      GitHub Pages / Cloudflare Pages (secrets du repo)
```

---

*Document généré le 06/04/2026 · Projet Heryze · Système de contact v2.0 — Ajout Option E : Mailgun + Cloudflare Worker (pattern Fufuni)*
