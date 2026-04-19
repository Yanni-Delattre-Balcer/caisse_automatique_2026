# Doc 50 — Suivi Roadmap · Sprint du 16 avril 2026
**Date : 16 avril 2026**
**Statut : DOCUMENT DE SUIVI — mise à jour du doc 49**

---

## Avancement des 6 problèmes prioritaires (doc 49)

| # | Problème | Priorité | Statut | Notes |
|---|---------|----------|--------|-------|
| 1 | Price IDs mock dans PricingPage | 🔴 Bloquant | ✅ Réglé | `import.meta.env.VITE_STRIPE_PRICE_*` — `.env` avait déjà les vrais IDs |
| 2 | Feature gating non câblé | 🔴 Bloquant | ✅ Réglé | `useSubscription.ts` activé avec vraie logique par niveaux (starter=1, business=2, expert=3) |
| 3 | Mapping plan webhook (`monthly` → `starter`) | 🟠 Moyen | ✅ Réglé | `getPlanFromPriceId` réécrit, redéployé |
| 4 | Mode hors-ligne | 🟠 Moyen | ✅ Réglé | `offlineSalesCount` dans le store, badge amber sur l'icône réseau, toast au retour du réseau |
| 5 | Ticket dématérialisé (email) | 🟠 Moyen | ✅ Réglé | Edge Function `send-receipt` déployée, secrets configurés |
| 6 | Remises rapides | 🟠 Moyen | ✅ Réglé | `discount_amount` dans `SalePayload`, affiché dans le reçu — SQL à exécuter |

### Actions infra
- [x] SQL : `ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;`
- [x] Redéployer `stripe-webhook` (fix mapping plan)
- [x] Déployer `send-receipt` (nouvelle Edge Function)

---

## Fichiers modifiés dans ce sprint

| Fichier | Nature | Ce qui a changé |
|---------|--------|----------------|
| `src/pages/PricingPage.jsx` | Fix | Price IDs depuis `import.meta.env` |
| `src/hooks/useSubscription.ts` | Refactor | Logique réelle activée, niveaux de plans |
| `src/types/index.ts` | Fix | `discount_amount` ajouté à `SalePayload` |
| `src/store/useCartStore.ts` | Feature | `offlineSalesCount`, `discount_amount` dans checkout, `syncOfflineQueue` retourne le nb synchro |
| `src/layouts/DashboardLayout.jsx` | Feature | Badge offline + toast de sync + import `useToastStore` |
| `src/features/pos/CheckoutCart.jsx` | Feature | Remise dans reçu, champ email, `handleSendEmail` |
| `src/pages/PaymentSuccessPage.jsx` | Fix | Polling `subscription_status`, `initialize()` avant navigate, état timeout |
| `supabase/functions/stripe-webhook/index.ts` | Fix | `getPlanFromPriceId` réécrit, fallback `'starter'` |
| `supabase/functions/send-receipt/index.ts` | Nouveau | Edge Function email via Resend |
| `discussions-gemini-strat-progression/48-payment-success-polling.md` | Doc | Statut ✅ + tableau récapitulatif |

---

## Ce qui reste ouvert du doc 49

### Sprint B — Rétention Starter (prochaine session prioritaire)
| # | Feature | Effort | Statut |
|---|---------|--------|--------|
| QW-4 | Alertes stock critique (seuil configurable) | Faible | ⬜ À faire |
| QW-5 | Historique Z-Caisse (clôtures passées) | Faible | ⬜ À faire |
| QW-6 | Widget URSSAF / Prévisionnel mensuel | Moyen | ⬜ À faire |

### Sprint C — Rétention Business
| # | Feature | Effort | Statut |
|---|---------|--------|--------|
| MT-2 | Remboursement / avoir | Moyen | ⬜ À faire |
| MT-3 | Gestion employés (PIN + session caissier) | Élevé | ⬜ À faire |
| MT-4 | Dashboard période personnalisable | Moyen | ⬜ À faire |
| MT-5 | Rapport par caissier | Moyen | ⬜ À faire |

### Sprint D — Conversion Expert
| # | Feature | Effort | Statut |
|---|---------|--------|--------|
| MT-6 | Export FEC normé | Moyen | ⬜ À faire |
| MT-7 | Plan de salle interactif | Élevé | ⬜ À faire |
| MT-8 | Bon de commande cuisine | Élevé | ⬜ À faire |
| MT-9 | Impression ticket thermique | Élevé | ⬜ À faire |

---

## Bilan de la session du 16 avril 2026

**Ce qui a été accompli :**
- Premier paiement Stripe validé (doc 47)
- Tunnel de paiement complet opérationnel (checkout → webhook → activation)
- Fix `PaymentSuccessPage` avec polling correct et 3 états UI (doc 48)
- Les 6 problèmes prioritaires du doc 49 réglés côté code

**État de l'app :**
- Monétisation : infrastructure complète en mode test, prête pour le passage en prod Stripe
- Profil Starter : caisse, inventaire, Z-Caisse, mode offline, remises, ticket email — tout est en place
- Feature gating : infrastructure réelle activée, prête à être utilisée pour verrouiller les futures features Business+

> Prochaine session : Sprint B (Starter) — alertes stock, historique Z-Caisse, widget URSSAF.
