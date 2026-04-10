# 🛡️ Audit Technique — Implémentation Stripe V2 (OmniPOS)

> **Résumé** : L'implémentation globale est solide, mais un bug critique au niveau de la base de données empêche actuellement toute activation de souscription réelle. Une optimisation du store Auth est également recommandée.

---

## 🔴 BUG CRITIQUE — Contrainte SQL Incompatible
**Localisation** : `supabase/schema.sql` (Ligne 103)

### ❌ État Actuel (Incorrect)
```sql
plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'monthly', 'lifetime')),
```

### ✅ Correction Requise
```sql
plan TEXT NOT NULL DEFAULT 'monthly' CHECK (plan IN ('monthly'));
```
*(Note : Suite au pivot stratégique, seule la valeur 'monthly' doit être autorisée. Le freemium/trial étant refusé, nous simplifions la contrainte).*

### ⚠️ Impact
Dès qu'un utilisateur paie une offre, le webhook Stripe tente un `upsert` avec un plan spécifique (ex: 'annual' ou 'pro'). Supabase renvoie une erreur de contrainte → l'abonnement n'est jamais activé en base. Le paiement Stripe passe, mais le compte utilisateur reste bloqué.

---

## 🟡 BUG MOYEN — Requête DB Fantôme au Login
**Localisation** : `src/store/useAuthStore.ts` (Lignes 56–70)

### 🔍 Analyse
Un `Promise.all` tente de charger la souscription avec un **UUID fixe ("0000...")** avant même de connaître le `businessId`.
- La variable `sub` est immédiatement ignorée.
- Une deuxième requête correcte est refaite plus loin (Ligne 91).
- **Résultat** : 2 appels DB au lieu de 1 à chaque connexion, dont un qui échoue systématiquement.

---

## 🟢 OBSERVATION MINEURE — Dead Code
**Localisation** : `supabase/functions/stripe-checkout/index.ts` (Ligne 121)

```typescript
customer_email: !customerId ? user.email : undefined,
```
`customerId` est pratiquement toujours défini à ce point du code. Cette condition est inoffensive mais superflue.

---

## ✅ Points Forts de l'Implémentation

| Composant | Verdict | Détails |
| :--- | :--- | :--- |
| **Sécurité JWT** | 🔒 Excellent | Token validé via `supabase.auth.getUser()` dans les fonctions Edge. |
| **Intégrité Webhook** | 🛡️ Robuste | Signature HMAC vérifiée via `constructEventAsync`. |
| **Idempotence** | ⚙️ Correct | Pattern `upsert` gérant les répétitions d'événements Stripe. |
| **UX Paiement** | ✨ Fluide | Gestion propre des spinners et des erreurs dans `PricingPage.jsx`. |
| **Feature Gating** | 🏗️ Prêt | Hook `useSubscription.ts` modulaire et facile à activer. |

---

## 🚦 Verdict Global

**Peut-on lancer les tests pré-bêta ?**

- **Tests Métier** (Caisse, Stock, Offline) : **OUI** ✅
- **Tests Stripe / Paiement** : **NON** ❌ (Attendre correction SQL)

---

> [!TIP]
> **Action Prioritaire** : Exécuter la migration `ALTER TABLE subscriptions` pour mettre à jour la contrainte `plan`.