# 43 — Refonte section Pricing landing page + branchement Stripe

**Date :** 2026-04-11

---

## Ce qui a été fait

### 1. Remplacement de la grille tarifaire (4 → 2 cartes)

La section `#pricing` de la landing page affichait 4 plans (Solo 12€, Team 24€, Business 39€, Entreprise 49€) avec un toggle mensuel/annuel. Elle a été remplacée par **2 cartes uniquement**, reprenant le contenu de la section "Grille Heryze Hybrid" de `/pricing` :

| Plan | Prix | Inclus | Price ID Stripe |
|---|---|---|---|
| Starter (Solo) | 19€/mois | 1 accès, Inventaire, Exports | `VITE_STRIPE_PRICE_STARTER` |
| Business (Multi) | 39€/mois | 5 accès, Gestion des stocks, Dashboard | `VITE_STRIPE_PRICE_BUSINESS` |

Le toggle mensuel/annuel a été supprimé — les prix affichés sont mensuels, sans ambiguïté.

---

### 2. Effet visuel "luxe" sur la card Business (highlight)

- **Contour bleu** `#0099ff` : technique wrapper `p-[2px]` avec fond bleu + inner card blanche (`rounded-[14px]`)
- **Badge "Populaire"** : bulle bleue positionnée au sommet (`absolute -top-5`)
- **Hover — glow bleu diffus** : `box-shadow 0 0 60px rgba(0,153,255,0.4)` via Tailwind `hover:shadow-[...]`
- **Hover — rayon de lumière blanche** : animation CSS `border-sweep` qui fait tourner un `conic-gradient` (spot blanc étroit) autour du contour en **1.2s, une seule fois** (`animation-iteration-count: 1`). Technique : div `300% × 300%` centré sur la card, clip par `overflow: hidden` du wrapper.

```css
@keyframes border-sweep {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
.card-pro-wrapper:hover .card-sweep-ray {
  animation: border-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) 1 forwards;
}
```

---

### 3. Branchement Stripe Checkout

Les boutons "Choisir ce plan" appellent désormais `redirectToCheckout` de `src/lib/stripe.ts`.

**Flux :**
1. **Non connecté** → redirect `/register`
2. **Connecté** → spinner sur le bouton → POST vers la Supabase Edge Function (`VITE_STRIPE_CHECKOUT_URL`) avec le JWT + `priceId` + `planType`
3. **Succès** → `window.location.href = url` (page de paiement Stripe)
4. **Erreur** → bandeau rouge sous le header de la section avec le message d'erreur

**Variables .env utilisées :**
```
VITE_STRIPE_PRICE_STARTER=price_1TL6MMDvxxawsfRr60XoM7aN
VITE_STRIPE_PRICE_BUSINESS=price_1TL6QPDvxxawsfRrGYMwOlby
VITE_STRIPE_CHECKOUT_URL=https://rpicltcelohvqfnrnzjh.supabase.co/functions/v1/stripe-checkout
```

---

### 4. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/pages/LandingPage.jsx` | Remplacement grille 4 plans → 2 plans Hybrid, suppression toggle, effet luxe, branchement Stripe |

---

## Points d'attention pour les tests

- Se connecter avant de cliquer (sinon redirect `/register`, comportement voulu)
- Vérifier que les deux `price_id` sont bien actifs dans le Stripe Dashboard (mode test)
- La Supabase Edge Function `stripe-checkout` doit être déployée et opérationnelle
- En cas d'erreur "JWT manquant" : vérifier que `supabase.auth.getSession()` retourne bien un token actif
