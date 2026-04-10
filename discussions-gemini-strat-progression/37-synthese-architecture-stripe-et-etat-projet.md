# Synthèse technique : État d'avancement du projet Heryze (Avril 2026)

Ce document résume les dernières étapes d'implémentation réalisées, principalement axées sur la monétisation SaaS et le polissage du design. Il est conçu pour servir de base de connaissance à tout intervenant (Humain ou IA) souhaitant comprendre l'architecture actuelle du système de paiement.

## 1. Moteur de Paiement & Abonnements (Stripe V2)
L'architecture s'inspire de `fufuni` (Edge-native) adaptée à l'écosystème Supabase.

### Composants Backend (Supabase Edge Functions)
- **`stripe-checkout`** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/supabase/functions/stripe-checkout/index.ts)) : 
  - Crée une session Stripe hébergée. 
  - Sécurisée par JWT (Authorization header).
  - Associe le `businessId` via les métadonnées pour la réconciliation.
- **`stripe-webhook`** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/supabase/functions/stripe-webhook/index.ts)) : 
  - Point d'entrée public vérifié par signature HMAC.
  - Gère les événements : `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated/deleted`.
  - Effectue des `upsert` dans la table SQL locale.

### Composants Frontend
- **Client Stripe** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/src/lib/stripe.ts)) : Centralise les appels vers les Edge Functions.
- **Store Auth** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/src/store/useAuthStore.ts)) : Hydrate les données de souscription (`plan`, `status`, `expiresAt`) lors du login, permettant un accès immédiat aux droits sans appel API supplémentaire.

## 2. Feature Gating & Restriction (Prêt mais Inactif)
Un système de contrôle d'accès modulaire a été mis en place.
- **Hook `useSubscription`** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/src/hooks/useSubscription.ts)) : 
  - Définit les droits comme `canAccessAnalytics`, `canAccessInventory`, etc.
  - **Note** : Actuellement, toutes les fonctions retournent `true` par défaut pour ne pas bloquer les tests utilisateur en attendant la décision finale sur les limitations par plan.

## 3. Refonte Visuelle (Landing Page V2)
- **Landing Page Officielle** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/src/pages/LandingPage.jsx)) : La version V1 simpliste a été remplacée par une V2 "premium" (typographie Inter, micro-animations Framer Motion, design Apple-like).
- **Pricing Page** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/src/pages/PricingPage.jsx)) : Intégration complète des CTA vers Stripe Checkout avec feedback de chargement (spinner) et gestion d'erreurs.

## 4. Infrastructure & Stabilité
- **Build PWA** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/vite.config.js)) : Correction d'une erreur critique de build liée à la taille de cache Workbox (limitée à 2Mo par défaut, augmentée à 10Mo pour supporter les assets images haute résolution).
- **Configuration .env** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/.env)) : Structure mise à jour pour supporter les 3 types de plans (Monthly, Annual, Pro).

## 5. État de la Base de Données
- **Table `subscriptions`** ([voir fichier](file:///home/briacl/Development/caisse_automatique_2026/supabase/schema.sql)) : Table pivot entre Stripe (`stripe_customer_id`) et le commerce local (`business_id`).

---
**Guide pas-à-pas pour la configuration humaine/IA :** [STRIPE_SETUP.md](file:///home/briacl/Development/caisse_automatique_2026/docs/STRIPE_SETUP.md)
