# Heryze — Réflexion Pricing v2 : L'Alternative au Gratuit
> Document de réflexion stratégique · Avril 2026
> Basé sur l'analyse Claude (28-heryze_strategie_risques_prix), la liste des commerces cibles et la position réelle du projet

---

## Le Problème Central : Pourquoi le Gratuit Est Un Piège

La recommandation initiale de Claude (plan Solo gratuit permanent) est théoriquement solide — c'est le modèle de Notion, Slack, Linear. Mais elle repose sur une hypothèse fondamentale que votre situation ne valide pas :

> *"Un plan gratuit n'est viable que si votre CAC (coût d'acquisition client) est minimal et que votre LTV (valeur vie client) compense le poids des utilisateurs gratuits."*

Pour Notion ou Slack, des centaines d'employés développent, soutiennent et font croître le produit. Pour Heryze en phase de lancement, vous êtes **deux étudiants** — et chaque utilisateur gratuit représente :

- Du support à assurer
- De l'infrastructure Supabase à payer (certes faible, mais réelle)
- Du temps de développement sur des bugs qui ne génèrent aucun revenu

**Le vrai risque du gratuit au lancement :** attirer 500 utilisateurs "curieux" qui ne paieront jamais, pendant que vous n'avez aucun revenu pour vous améliorer et aucun signal de marché sur votre réelle valeur perçue.

---

## Un Contexte à Ne Pas Oublier

Avant de repenser les prix, voici ce qui rend Heryze **différent** de la plupart des SaaS :

1. **Une obligation légale tire la demande.** En France, tout commerce assujetti à la TVA doit utiliser un logiciel de caisse "sécurisé" depuis 2018. Ce n'est pas un "nice to have" — c'est une contrainte fiscale. Le commerçant *doit* payer quelque chose. La vraie compétition n'est pas "payer ou ne pas payer", c'est "payer Heryze ou payer quelqu'un d'autre".

2. **Votre cible paie déjà.** Un boulanger, un coiffeur, un restaurateur TPE paie déjà 30–80 €/mois pour un logiciel de caisse ou pour les heures d'un comptable. Vous n'avez pas à convaincre quelqu'un de payer pour la première fois.

3. **L'USP offline-first est rare et précieux.** Aucun concurrent direct n'occupe *simultanément* caisse physique + offline-first + export comptable simplifié. Vous avez un vrai angle — ne le bradez pas.

---

## Ma Position sur l'Analyse ChatGPT (commerces-list.md)

Le fichier est une bonne cartographie du terrain, et les recommandations de ciblage sont juste. En revanche, je veux challenger un point :

> *"Positionnement idéal : 'la caisse pour food trucks', 'le logiciel des coiffeurs'"*

Cette ultra-spécialisation **verticale** est une excellente stratégie *de distribution* (parler à un seul type de commerce pour le marketing), mais elle risque de vous enfermer dans un espace trop petit si elle devient aussi la limite de votre *produit*. La bonne approche :

- **Produit :** horizontal (fonctionne pour tous les commerces physiques indépendants)
- **Marketing :** vertical (vous parlez aux boulangeries, puis aux coiffeurs, puis aux food trucks — chacun leur tour)

Heryze est bien construit pour rester horizontal — gardez cette flexibilité.

---

## L'Alternative : Le Modèle "Paiement Dès Le Premier Jour"

### Principe fondateur

> Vous n'avez pas besoin d'un plan gratuit pour acquérir des clients. Vous avez besoin d'un **coût d'entrée assez bas pour lever l'hésitation, et assez haut pour signaler la valeur**.

La psychologie du prix dans le B2B TPE est contre-intuitive : un produit **trop bon marché ou gratuit** est souvent perçu comme **peu fiable ou peu sérieux** par un commerçant. Un coiffeur ou un boulanger ne confie pas sa compta légale à "un truc gratuit sur internet".

### L'Essai Gratuit vs. Le Plan Gratuit — Une Distinction Cruciale

Ce que vous devez éviter : un plan gratuit permanent.
Ce que vous pouvez proposer (et qui coûte moins cher à porter) : un **essai gratuit limité dans le temps, sans CB.**

| | Plan Gratuit Permanent | Essai 30 jours sans CB |
|---|---|---|
| Coût infrastructure | Croît à l'infini avec les users gratuits | Temporaire et maîtrisé |
| Signal de valeur | Dilue la perception de valeur | Crée de l'urgence naturelle |
| Conversion | 2–5% en SaaS mature | 15–30% si bien construit |
| Risque | Masse d'utilisateurs "zombies" | Pratiquement nul |
| Recommandation | ❌ À éviter au lancement | ✅ Idéal pour phase 1 |

---

## Proposition de Nouvelle Architecture Tarifaire

### Architecture recommandée — Phase Lancement (2026)

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                   HERYZE — Prix au Lancement                    │
 ├─────────────────┬──────────────────────┬────────────────────────┤
 │   LANCEMENT     │        PRO           │       BUSINESS         │
 │   19 €/mois     │      34 €/mois       │       59 €/mois        │
 │                 │                      │                        │
 │ (Prix fondateur │  (prix cible futur   │  (restaurateurs,       │
 │  limité dans    │   marché)            │   multi-postes)        │
 │  le temps)      │                      │                        │
 └─────────────────┴──────────────────────┴────────────────────────┘
      ↑
  Essai 30j
  sans CB requis
```

---

### Plan Lancement — 19 €/mois TTC *(Prix Fondateur, offre limitée)*

**Positionnement :** "Rejoignez les premiers. Débloquez le prix le plus bas à vie."

**Inclus :**
- Catalogue produits illimité
- Transactions illimitées
- Caisse complète offline-first + scanner mobile
- Z-caisse quotidien PDF
- Export CSV pour le comptable
- 1 terminal
- Support email sous 48h

**Ce qui est exclu (pour créer la montée de plan) :**
- Pas d'export FEC normalisé (format expert-comptable standard)
- Pas de multi-utilisateurs / gestion des rôles
- Pas de statistiques avancées (panier moyen, prédictions)
- Pas de programme de fidélité client
- Pas de gestion des tables (mode restauration)

**Mécanique de l'offre :**
> "Prix fondateur 19 €/mois garanti à vie pour les 100 premiers abonnés. Après, retour au prix normal de 34 €/mois."

Cette mécanique crée de l'urgence *sans* pression agressive. Le commerçant se sent privilégié, pas forcé.

---

### Plan Pro — 34 €/mois TTC

**Cible :** Boulangeries, épiceries, coiffeurs, commerces établis à 1 poste.

**Inclus :**
- Tout Plan Lancement +
- Export FEC normalisé (compatible tous logiciels comptables)
- Dashboard analytiques complet
- Alertes stock configurables
- Historique ventes 24 mois
- 2 terminaux

**Message :**
> "Le prix d'une heure de votre comptable. Tous les mois. Sauf que ça travaille 24h/24."

---

### Plan Business — 59 €/mois TTC

**Cible :** Restaurants, boutiques avec vendeurs, food trucks multi-emplacements.

**Inclus :**
- Tout Plan Pro +
- Terminaux illimités
- Multi-utilisateurs avec rôles (Gérant / Vendeur)
- Gestion des tables (mode Restauration)
- Programme de fidélité client
- Statistiques avancées + export comparatif
- Support prioritaire (réponse sous 24h)
- White-label tickets (votre logo, pas Heryze)

---

### Option Annuelle — Disponible sur tous les plans

| Plan | Mensuel | Annuel | Économie |
|---|---|---|---|
| Lancement | 19 €/mois | 190 €/an | 38 € (2 mois offerts) |
| Pro | 34 €/mois | 340 €/an | 68 € |
| Business | 59 €/mois | 590 €/an | 118 € |

> L'annuel améliore votre trésorerie immédiate et réduit le churn. Un commerçant qui a payé l'année ne se repose pas la question chaque mois.

---

## Tableau Comparatif Complet

| | Lancement | Pro | Business |
|---|---|---|---|
| Prix/mois | **19 €** *(fondateur)* | 34 € | 59 € |
| Transactions | Illimitées | Illimitées | Illimitées |
| Produits | Illimités | Illimités | Illimités |
| Terminaux | 1 | 2 | Illimités |
| Caisse offline | ✅ | ✅ | ✅ |
| Scanner mobile | ✅ | ✅ | ✅ |
| Z-caisse PDF | ✅ | ✅ | ✅ |
| Export CSV simple | ✅ | ✅ | ✅ |
| Export FEC normalisé | — | ✅ | ✅ |
| Dashboard analytics | Basique | Complet | Avancé |
| Alertes stock | — | ✅ | ✅ |
| Multi-utilisateurs | — | — | ✅ |
| Gestion tables | — | — | ✅ |
| Fidélité clients | — | — | ✅ |
| Support | Email 48h | Email 48h | Chat 24h |
| Durée garantie prix | À vie (fondateur) | Standard | Standard |

---

## La Mécanique de l'Essai

### Structure recommandée

```
Étape 1 : Inscription (30 secondes, aucune CB)
    ↓
Étape 2 : Essai 30 jours — accès au Plan Pro complet
    ↓
Étape 3 : À J+25, email "Votre essai se termine dans 5 jours"
    ↓
Étape 4 : Choix du plan ou fin d'accès
          (données conservées 90 jours en cas de retour)
```

**Pourquoi 30 jours et pas 14 ?**

Un commerçant a des cycles mensuels. Il doit vivre au moins un cycle complet (fin de mois → Z-caisse → export comptable) pour voir la vraie valeur de Heryze. 14 jours, c'est trop court pour ça.

**Pourquoi donner accès au Plan Pro et pas au Plan Lancement ?**

L'essai doit montrer la valeur maximale du produit. Si vous montrez un plan castré, le commerçant ne ressent jamais la valeur différenciante (export FEC, analytics) — et il n'a aucune raison de payer.

---

## Stratégie de Ciblage Progressive

En combinant les recommandations de ChatGPT et l'analyse concurrentielle, voici le séquençage recommandé :

### Phase 1 — Les "Quick Wins" (Mois 1–3)
**Cibles :** Food trucks, marchés ambulants, petits artisans indépendants

**Pourquoi en premier :**
- Fortement impactés par l'offline (votre USP #1)
- Peu fidèles à leurs outils actuels (remplacent facilement)
- Bouche-à-oreille fort entre eux sur les marchés

**Canal d'acquisition :** présence physique sur les marchés, démonstration du scanner mobile en live

---

### Phase 2 — Le Volume (Mois 3–12)
**Cibles :** Boulangeries, épiceries, coiffeurs, barbiers

**Pourquoi ensuite :**
- Volume énorme (plusieurs centaines de milliers en France)
- Besoins simples → Plan Lancement ou Pro parfaitement adapté
- Obligations fiscales fortes = motivation naturelle à payer

**Canal d'acquisition :** partenariat expert-comptable (le canal le plus efficient en B2B TPE francophone)

---

### Phase 3 — La Montée en Gamme (Mois 6–18)
**Cibles :** Restaurateurs, boutiques multi-postes

**Pourquoi en dernier :**
- Ticket moyen plus élevé (Plan Business)
- Mais cycle de vente plus long (plus de décision)
- Nécessite que le produit soit mature (gestion tables, multi-users)

---

## Synthèse et Recommandations Clés

| Question | Réponse recommandée |
|---|---|
| Plan gratuit permanent ? | ❌ Non — crée de faux signaux et dilue la valeur |
| Essai gratuit ? | ✅ Oui, 30 jours, sans CB, accès Pro complet |
| Prix d'entrée ? | 19 €/mois (Prix Fondateur, 100 premiers abonnés) |
| Prix cible long terme ? | 34 €/mois (Plan Pro standard) |
| Premier segment cible ? | Food trucks + marchés (offline USP fort) |
| Canal de distribution prioritaire ? | Expert-comptable (partenariat B2B) |
| Argument pricing face à la concurrence ? | "Moins cher que Merlin, plus simple que Pennylane, seul à fonctionner sans internet" |

---

## Un Dernier Mot sur la Psychologie du Prix

> **Un commerçant qui paye est un commerçant qui s'investit.**

L'un des effets peu connus d'un plan gratuit permanent : les utilisateurs qui ne paient pas **n'utilisent pas sérieusement** le produit, ne remontent pas de vrais bugs de terrain, et ne deviennent jamais ambassadeurs du produit.

Au contraire, un utilisateur qui a sorti sa CB, même pour 19 €, va :
- Utiliser le produit sérieusement (il a payé)
- Vous remonter des retours réels (il veut que ça marche)
- En parler autour de lui si ça fonctionne (il a fait le bon choix)

**Vos 100 premiers clients payants valent infiniment plus que 1 000 utilisateurs gratuits.**

---

*Document de réflexion Heryze · Pricing v2 · Avril 2026*
*Basé sur : 28-heryze_strategie_risques_prix-CLAUDE.md + commerces-list.md + contexte projet réel*
