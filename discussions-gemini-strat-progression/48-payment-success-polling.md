# Proposition — Page `/payment-success` avec Polling de Statut

**Date : 16 avril 2026**
**Statut : PROPOSITION — à valider avant implémentation**

---

## Contexte

Après un paiement Stripe réussi, le navigateur est redirigé vers :
```
/payment-success?session_id=cs_test_xxxxx
```

Le webhook Supabase (`stripe-webhook`) met quelques secondes à se déclencher et mettre à jour la base de données. Sans polling, l'utilisateur arrive sur une page vide ou un spinner éternel.

**Bonne nouvelle** : `PaymentSuccessPage.jsx` existe déjà et a une logique de polling. **Problème** : la condition de polling est incorrecte.

---

## Bug actuel

```js
// ❌ Ce champ n'est PAS mis à jour par le webhook
if (!error && data?.stripe_subscription_id) { ... }
```

Le webhook ne touche **pas** `businesses.stripe_subscription_id`. Il met à jour :
```ts
await supabase.from('businesses').update({ subscription_status: 'active' })
```

Donc la condition ne sera jamais vraie → l'utilisateur attend 20s puis est redirigé sans confirmation réelle.

---

## Ce qui doit changer

### Condition de polling corrigée
```js
// ✅ Vérifier subscription_status dans businesses
if (!error && data?.subscription_status === 'active') { ... }
```

### Refresh du store auth après succès
Actuellement, après redirection vers `/dashboard`, l'app affiche encore le statut `trial` parce que le store Zustand n'a pas été rechargé. Il faut appeler `initialize()` avant la navigation.

```js
const { initialize } = useAuthStore();

// Dans le bloc succès :
setSuccess(true);
clearInterval(interval);
setTimeout(async () => {
  await initialize(); // Recharge user.subscriptionStatus = 'active'
  navigate('/dashboard');
}, 2000);
```

### Cas timeout (webhook lent)
Après 10 tentatives (20s), le webhook n'a pas encore répondu. Comportement actuel : redirection silencieuse. Comportement proposé : afficher un message rassurant + bouton manuel.

---

## UI proposée — 3 états

### État 1 : Attente (polling en cours)
- Spinner animé bleu
- Titre : "Activation en cours..."
- Sous-titre : "Synchronisation avec notre partenaire bancaire. Quelques secondes."
- Compteur discret : "Vérification X/10"

### État 2 : Succès (webhook reçu, `subscription_status = 'active'`)
- Icône ✅ verte animée (scale-in)
- Titre : "Compte activé !"
- Sous-titre : "Votre essai de 14 jours commence maintenant. Redirection..."
- Barre de progression 2s avant redirection

### État 3 : Timeout (20s écoulées, webhook pas encore arrivé)
- Icône ⚠️ ambrée
- Titre : "Paiement reçu, activation en cours"
- Sous-titre : "Stripe a bien validé votre paiement. Notre système finalise l'activation — cela peut prendre jusqu'à 1 minute."
- Bouton **"Accéder à mon espace"** (redirection manuelle vers `/dashboard`)
- Note rassurante : "Si vous ne voyez pas l'accès immédiatement, actualisez dans 1 minute."

---

## Logique de polling complète (pseudo-code)

```
MONTAGE :
  si user.businessId absent → rediriger vers /login
  
  lancer interval toutes les 2s :
    requête : SELECT subscription_status FROM businesses WHERE id = businessId
    
    si subscription_status = 'active' :
      → état SUCCÈS
      → stopper interval
      → attendre 2s → initialize() → navigate('/dashboard')
    
    sinon si tentatives >= 10 :
      → état TIMEOUT
      → stopper interval
    
    sinon :
      → incrémenter tentatives (affichage discret)

DÉMONTAGE : clearInterval
```

---

## Ce qu'on ne change PAS

- Le design glassmorphism/minimaliste déjà en place
- L'utilisation de `lucide-react` (Loader2, CheckCircle2)
- La structure générale du composant

---

## Résumé des modifications à apporter au fichier existant

| Ligne | Avant | Après |
|-------|-------|-------|
| Condition polling | `data?.stripe_subscription_id` | `data?.subscription_status === 'active'` |
| Après succès | `navigate('/dashboard')` | `await initialize()` puis `navigate('/dashboard')` |
| Après timeout | Redirection silencieuse | Affichage état TIMEOUT avec bouton manuel |
| Affichage | 2 états (loading / success) | 3 états (loading / success / timeout) |

---

## Implémentation — ✅ RÉALISÉE le 16 avril 2026

| # | Avant | Après |
|---|-------|-------|
| Condition polling | `data?.stripe_subscription_id` | `data?.subscription_status === 'active'` |
| Redirect sans businessId | rien (polling lancé quand même) | `navigate('/login')` immédiat |
| Après succès | `navigate('/dashboard')` | `await initialize()` → `navigate('/dashboard')` |
| Timeout | redirection silencieuse | état ⚠️ avec bouton manuel + message rassurant |
| Compteur | absent | "Vérification X/10" discret |
| Import | `Loader2, CheckCircle2` | + `AlertTriangle` |

Fichier modifié : `src/pages/PaymentSuccessPage.jsx`
