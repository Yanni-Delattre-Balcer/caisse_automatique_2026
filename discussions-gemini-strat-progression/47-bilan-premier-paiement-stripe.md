# Bilan — Premier Paiement Stripe Validé
**Date : 16 avril 2026**
**Statut : ✅ SUCCÈS — Tunnel de paiement complet opérationnel**

---

## Contexte

Ce document retrace l'ensemble des actions réalisées lors de la session du 16 avril 2026 pour débloquer, stabiliser et valider le tunnel d'abonnement Stripe de bout en bout. À l'issue de cette session, un premier paiement test a été réalisé avec succès sur la plateforme Heryze, confirmant que l'infrastructure de monétisation est en place et fonctionnelle.

---

## 1. Diagnostic initial — Ce qui ne fonctionnait pas

### 1.1 Question `.env` vs `.env.example`
**Problème soulevé** : Gemini avait modifié `.env.example` et l'ambiguïté existait sur quel fichier était réellement utilisé.

**Réponse** : Vite charge **toujours `.env`** automatiquement. `.env.example` est un fichier de documentation pure, jamais interprété par le build. Les vraies clés dans `.env` étaient donc bien actives. Aucune action requise.

### 1.2 Connexion qui "chargeait indéfiniment"
**Cause réelle** : Gemini avait modifié `useAuthStore.ts` pour sélectionner deux nouvelles colonnes sur la table `businesses` :
```ts
.select('id, name, business_type, trial_ends_at, subscription_status')
```
Ces colonnes n'existaient pas encore en base. La query Supabase retournait un `bizError`, forçant `companyName: null` dans le store. Ensuite, `DashboardLayout.jsx` crashait silencieusement à la ligne :
```js
{user.companyName.substring(0,2).toUpperCase()}
// TypeError: Cannot read properties of null (reading 'substring')
```
L'écran blanc résultant était interprété comme un "chargement infini".

### 1.3 Navigation `/#pricing` sans scroll
**Cause** : `navigate('/#pricing')` dans React Router (SPA) ne déclenche pas le scroll natif du navigateur vers l'ancre — la page restait en haut du Hero banner.

### 1.4 Checkout Stripe — loading infini
**Causes cumulées (dans l'ordre de découverte)** :
1. `setIsLoading(false)` absent du chemin succès → spinner bloqué à vie
2. `window.open(url, '_blank')` bloqué par les popup blockers → Stripe n'ouvrait pas
3. Edge Function `stripe-checkout` non déployée → fetch sans réponse
4. `fetch` sans timeout → attente navigateur infinie (jusqu'à ~5 min)
5. Import Stripe via `esm.sh/stripe@16?target=deno` incompatible Deno v2 → `Deno.core.runMicrotasks() is not supported`
6. JWT ES256 rejeté par le runtime Supabase → `Unsupported JWT algorithm ES256`
7. Fichier `.env` contenant du texte brut sans `=` en fin de fichier → bloquait le parser de la CLI Supabase

---

## 2. Corrections appliquées — Code frontend

### 2.1 `src/pages/LandingPage.jsx` — Scroll vers les ancres hash
Ajout de `useEffect` + `useLocation` pour scroller automatiquement vers l'élément correspondant au hash après montage du composant :
```js
useEffect(() => {
  if (location.hash) {
    const id = location.hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 80);
  }
}, [location.hash]);
```
**Résultat** : "Changer de plan" depuis `/checkout-summary` scrolle bien vers la section `#pricing`.

### 2.2 `src/layouts/DashboardLayout.jsx` — Protection null sur `companyName`
```js
// Avant (crash si companyName est null)
{user.companyName.substring(0,2).toUpperCase()}

// Après (null-safe)
{(user.companyName ?? user.email ?? 'US').substring(0, 2).toUpperCase()}
```
Également : le bouton "S'abonner" redirigait vers `/` — corrigé en `to="/#pricing"`.

### 2.3 `src/layouts/LandingLayout.jsx` — Badge profil dans la navbar
Quand l'utilisateur est connecté et revient sur la landing page, la navbar affiche désormais :
- Un avatar avec les initiales du commerce
- Le nom du commerce
- Un bouton "Mon espace" → `/pos`

Au lieu des boutons Connexion/Inscription habituels.

### 2.4 `src/lib/stripe.ts` — Fetch robuste avec timeout + headers corrects
Trois corrections majeures :
```ts
// 1. Timeout 15s via AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15_000);

// 2. Headers corrects pour le runtime Supabase (contournement ES256)
headers: {
  'Content-Type': 'application/json',
  'apikey': anonKey,               // Runtime authentifié via anon key (HS256)
  'Authorization': `Bearer ${anonKey}`,
  'x-user-token': token,           // JWT utilisateur dans header custom
},

// 3. Redirection même onglet (évite popup blockers)
window.location.href = url;

// 4. Lecture robuste du message d'erreur
const message = body?.error || body?.message || `Erreur HTTP ${response.status}`;
```

### 2.5 `src/pages/CheckoutSummaryPage.jsx` — `setIsLoading(false)` sur succès
```js
await redirectToCheckout(plan.priceId, planType);
setIsLoading(false); // ← manquait — spinner restait bloqué après redirection Stripe
```

---

## 3. Corrections appliquées — Edge Functions Supabase

### 3.1 `stripe-checkout`
La Edge Function n'était pas déployée. Déploiement réalisé via le dashboard Supabase (Docker non disponible sur WSL2, CLI Supabase non installée via npm).

**Corrections apportées au code** :
- Import Stripe : `esm.sh/stripe@16?target=deno` → `npm:stripe@17` (compatible Deno v2)
- Suppression du `httpClient: Stripe.createFetchHttpClient()` (non nécessaire avec `npm:`)
- Lecture du JWT utilisateur depuis `x-user-token` au lieu de `Authorization` (contournement rejet ES256 par le runtime)
- Header CORS mis à jour : `x-user-token` ajouté aux headers autorisés
- Fix TypeScript : `error instanceof Error ? error.message : 'Erreur inconnue'`

**Secrets configurés dans Supabase** :
| Secret | Description |
|--------|-------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe `sk_test_...` |
| `APP_URL` | URL du frontend (port corrigé après 1er test) |

> `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement — pas à configurer manuellement.

### 3.2 `stripe-webhook`
Mêmes corrections d'import Stripe. Corrections supplémentaires :
- Mise à jour de `businesses.subscription_status = 'active'` après `checkout.session.completed`
- Mise à jour de `businesses.subscription_status = 'canceled'` après `customer.subscription.deleted`
- Fix TypeScript sur les blocs `catch`
- **JWT verification désactivée** : webhook public, sécurisé uniquement par signature HMAC Stripe

**Secrets supplémentaires configurés** :
| Secret | Description |
|--------|-------------|
| `STRIPE_WEBHOOK_SECRET` | Signing secret Stripe `whsec_...` |
| `STRIPE_PRICE_STARTER` | `price_1TL6MMDvxxawsfRr60XoM7aN` |
| `STRIPE_PRICE_BUSINESS` | `price_1TL6QPDvxxawsfRrGYMwOlby` |

---

## 4. Migrations SQL exécutées dans Supabase

### 4.1 `supabase/trial_setup.sql`
Colonnes ajoutées sur la table `businesses` :
```sql
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
```
Trigger automatique : `trial_ends_at` = J+14 à 23:59:59 à chaque création de business.

### 4.2 Création de la table `subscriptions`
```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'trialing',
  current_period_end timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (business_id)
);
```

### 4.3 Webhook enregistré dans Stripe Dashboard
- **Endpoint** : `https://rpicltcelohvqfnrnzjh.supabase.co/functions/v1/stripe-webhook`
- **Événements écoutés** :
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

---

## 5. Résultat du premier test de paiement

### Flux exécuté
1. Connexion au compte → dashboard accessible ✅
2. Clic "S'abonner" → landing page section `#pricing` (scroll correct) ✅
3. Clic "Souscrire" plan Starter → `/checkout-summary?plan=starter` ✅
4. Clic "Sécuriser mon compte (0€)" → redirection vers Stripe Checkout ✅
5. Page Stripe : "Essayez Heryze Starter — 14 jours gratuits, puis 19€/mois à partir du 30 avril 2026" ✅
6. Email pré-rempli avec le bon compte ✅
7. Saisie carte de test → validation ✅
8. Webhook reçu et traité par Supabase ✅

### Preuve en base de données — table `subscriptions`
| stripe_subscription_id | plan | status |
|------------------------|------|--------|
| `sub_1TMpwEDvxxawsfRr6v9lwuEY` | monthly* | active |

*Note mineure : le champ `plan` affiche `monthly` au lieu de `starter` — bug de mapping dans `getPlanFromPriceId` à corriger (voir points ouverts).

### Preuve Stripe — Webhooks reçus (200 OK)
- `checkout.session.completed` → **200 OK** ✅
- `invoice.payment_succeeded` → **200 OK** ✅

---

## 6. Architecture finale du tunnel de paiement

```
[LandingPage #pricing]
        ↓ clic "Souscrire"
[/checkout-summary?plan=starter]
        ↓ clic "Sécuriser mon compte (0€)"
[src/lib/stripe.ts → redirectToCheckout()]
        ↓ fetch POST (apikey + x-user-token)
[Supabase Edge Function: stripe-checkout]
        ↓ vérifie JWT via supabase.auth.getUser(x-user-token)
        ↓ crée session Stripe Checkout (trial 14j)
        ↓ retourne { url }
[window.location.href = url]
        ↓
[checkout.stripe.com]
        ↓ utilisateur saisit sa carte
        ↓ paiement validé par Stripe
[Stripe → POST webhook]
        ↓
[Supabase Edge Function: stripe-webhook]
        ↓ vérifie signature HMAC (stripe-signature)
        ↓ upsert table subscriptions (status: active)
        ↓ update businesses.subscription_status = 'active'
[/payment-success?session_id=...]
```

---

## 7. Points ouverts — Prochaine session

| # | Sujet | Priorité |
|---|-------|----------|
| 1 | Fix mapping `plan` dans `stripe-webhook` (`monthly` au lieu de `starter`) | Moyenne |
| 2 | Implémenter `/payment-success` avec polling de statut (recommandation doc 45) | Haute |
| 3 | Nettoyer le texte brut en fin de `.env` (cause erreur CLI Supabase) | Basse |
| 4 | Procédure de reset documentée pour les tests (SQL + annulation Stripe) | Basse |
| 5 | Passer en production Stripe (basculer les clés `pk_live_` / `sk_live_`) | Future |

---

> **Conclusion** : Le **16 avril 2026**, le premier paiement test Stripe a été validé avec succès sur la plateforme Heryze. L'infrastructure de monétisation complète — checkout sécurisé, webhook HMAC, synchronisation Supabase — est désormais opérationnelle en mode test. C'est une étape majeure : la plateforme peut officiellement encaisser des abonnements.
