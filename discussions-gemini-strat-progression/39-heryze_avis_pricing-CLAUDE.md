# Heryze — Avis Stratégique sur le Pricing
> Opinion directe · Sans langue de bois · Avril 2026

---

## Le verdict en une phrase

La grille de Gemini est **techniquement correcte mais stratégiquement risquée** — elle optimise vos marges avant d'avoir validé que des clients veulent bien payer.

---

## Ce que Gemini a bien fait

L'analyse des frais invisibles est solide. ~0,70 à 1,00 € de coût réel par client à 20 €/mois, c'est honnête et bien calculé. La mécanique de l'abonnement annuel (réduction des frais Stripe fixes, trésorerie immédiate, churn réduit) est exacte et bien argumentée. Rien à redire là-dessus.

---

## Ce que je ferais différemment — et pourquoi

### Problème 1 — Vous n'avez pas encore de clients

C'est le point le plus important du document, et il n'est pas mentionné. Toute cette analyse suppose que des commerçants vont s'abonner. Avant d'avoir vos 10 premiers clients payants, la structure de prix n'a aucune importance réelle — ce qui compte c'est de lever les freins à l'adoption, pas d'optimiser vos marges à 9,50 € vs 11,50 €.

La vraie question n'est pas "quel palier tarifaire choisir ?" mais "comment faire passer quelqu'un de 0 € à 12 € ?"

Ce sont deux problèmes complètement différents.

---

### Problème 2 — Supprimer le plan gratuit est une erreur à ce stade

Gemini a mentionné "éliminer le freemium pour éviter les utilisateurs poids morts". C'est une logique valable pour une startup avec 500 clients payants qui cherche à optimiser ses coûts d'acquisition. À votre stade — deux étudiants, MVP à 70-80 %, zéro client — c'est la logique inverse qu'il faut appliquer.

**Coût réel d'un utilisateur Solo gratuit pour vous :** quelques kilo-octets de données Supabase par mois. Littéralement négligeable sur le plan gratuit Supabase actuel.

**Bénéfice d'un utilisateur Solo gratuit pour vous :** il utilise le produit, il forme ses habitudes, il parle d'Heryze à d'autres commerçants, et un jour il dépasse la limite des transactions et se convertit sans que vous ayez à l'appeler.

Notion, Linear, Slack — toutes ces boîtes ont construit leur base avec un plan gratuit généreux. Elles ont converti quand la valeur était prouvée. Vous êtes exactement dans cette situation.

**Ma proposition :** garder un plan gratuit avec des limites raisonnables (50 produits, 100 transactions/mois comme proposé dans le document précédent), et ne le supprimer que si vous observez que les utilisateurs gratuits ne convertissent jamais après 3 mois d'usage. Vous n'en êtes pas là.

---

### Problème 3 — La grille à 4 paliers est trop complexe pour le marché cible

Gemini propose Solo / Team 5 / Business 10 / Entreprise. C'est une grille adaptée à un SaaS B2B qui vend à des équipes. Le marché d'Heryze, c'est une boulangère qui encaisse des croissants seule derrière son comptoir.

Elle n'a pas de "team". Elle n'a pas de "10 accès". Elle a une caisse, un iPad, et 2 minutes pour comprendre ce qu'elle va payer.

**La règle Apple ici :** moins de choix = plus de conversions. Trois paliers maximum, idéalement deux pour commencer.

---

## Ma proposition de grille — Simple, honnête, testable

### Phase 1 — Lancement (maintenant → premiers 50 clients)

Deux plans seulement. Pas de complexité. Objectif : faire payer les premiers clients et valider que le produit vaut son prix.

| Plan | Prix | Pour qui |
|---|---|---|
| **Solo** | Gratuit pour toujours | 1 terminal, 50 produits, 100 transactions/mois |
| **Pro** | **19 €/mois** | Tout illimité, Z-caisse, exports, support email |

**Pourquoi 19 € et pas 12 € ?**

Trois raisons. D'abord, 12 € positionne Heryze comme un outil "pas cher" — ce qui dans l'esprit d'un commerçant signifie souvent "pas fiable" ou "qui va fermer dans 6 mois". 19 € reste accessible mais inspire plus confiance. Ensuite, la différence entre 12 € et 19 € sur votre part nette est significative : ~5,50 € chacun vs ~9 €, soit 60 % de revenus en plus pour le même nombre de clients. Enfin, 19 € c'est moins d'une heure de SMIC — un argument que vous pouvez utiliser en face d'un artisan qui rechigne.

**Pourquoi pas de plan Business à ce stade ?**

Parce que vous n'avez pas encore les fonctionnalités multi-utilisateurs et gestion des tables finalisées. Vendre un plan "Business" avant que ces features soient solides, c'est créer des attentes que vous ne pouvez pas honorer. Attendez d'avoir ces fonctionnalités stables pour ajouter ce palier.

---

### Phase 2 — Après vos 20 premiers clients payants

Vous aurez des retours réels sur ce que les commerçants utilisent vraiment et ce pour quoi ils seraient prêts à payer plus. C'est à ce moment-là, et seulement à ce moment-là, que vous affinez la grille.

| Plan | Prix | Pour qui |
|---|---|---|
| **Solo** | Gratuit | 1 terminal, limites raisonnables |
| **Pro** | **19 €/mois** | Commerçant solo, fonctionnalités complètes |
| **Business** | **39 €/mois** | Multi-terminaux, gestion tables, multi-users |

Le plan Business à 39 € s'adresse aux restaurateurs et aux boutiques avec plusieurs vendeurs. C'est un marché différent avec une capacité à payer différente — ils comparent à Zelty ou Lightspeed Restaurant qui facturent 80-150 €/mois.

---

### Sur l'annuel — Oui, mais pas maintenant

Gemini a raison sur la mécanique. L'annuel est excellent pour la trésorerie et réduit le churn. Mais le proposer dès le lancement pose un problème psychologique : un commerçant qui ne connaît pas encore Heryze ne va pas s'engager sur 120 € d'un coup. Il veut d'abord tester, voir si ça marche dans son commerce, si ses employés arrivent à l'utiliser.

**Stratégie recommandée :** ne proposer l'annuel qu'après 3 mois d'abonnement mensuel. Un email automatique (via Resend ou Mailgun que vous venez de mettre en place) envoyé au 91ème jour : "Vous utilisez Heryze depuis 3 mois — passez à l'annuel et économisez 38 €." À ce stade, le commerçant est convaincu. Le taux de conversion vers l'annuel sera bien plus élevé qu'en page d'accueil.

---

## La question que personne ne pose : Stripe ou pas Stripe ?

Gemini mentionne Stripe comme une évidence. C'est probablement le bon choix, mais voici ce qu'il faut savoir avant de décider.

**Stripe :** 1,5 % + 0,25 € par transaction en Europe (cartes européennes). Excellent dashboard, intégration React très simple, références solides. Sur 19 €/mois, ça vous coûte ~0,54 €.

**Stripe Billing :** gratuit jusqu'à 10 000 € de MRR (Monthly Recurring Revenue), puis 0,5 % au-delà. À votre stade, c'est donc 0 € de frais de gestion des abonnements — c'est une très bonne nouvelle.

**Lemonsqueezy (alternative à considérer) :** 5 % + 0,50 € par transaction, mais il gère la TVA européenne (OSS) à votre place. Pour deux étudiants qui ne veulent pas s'embêter avec la déclaration de TVA intracommunautaire dès que vous aurez des clients dans d'autres pays UE, c'est un atout réel. À peser quand vous aurez vos premiers clients étrangers.

**Conseil immédiat :** commencer avec Stripe. C'est le standard, c'est bien documenté, et vous avez probablement déjà vu comment l'intégrer. Lemonsqueezy peut venir plus tard si la TVA devient un problème.

---

## Sur la question du partage 50/50

Gemini propose un virement manuel mensuel. C'est fonctionnel mais il y a une option plus propre dès le départ : **Stripe Connect Express**.

Stripe Connect permet de créer deux comptes "liés" à un compte principal Heryze. Les revenus arrivent sur le compte Heryze et Stripe peut automatiquement dispatcher les fonds selon les règles que vous définissez. Ce n'est pas instantané à mettre en place, mais ça évite les frictions humaines (qui fait le virement ? quand ? combien exactement après déduction des frais ?).

Cela dit, pour vos 10 premiers clients, le virement manuel mensuel est largement suffisant. Ne sur-ingéniez pas ça maintenant.

---

## Ce que je ferais si j'étais à votre place — Plan d'action

**Ce mois-ci :** lancer avec deux plans (Solo gratuit + Pro à 19 €/mois). Pas d'annuel, pas de Business, pas de complexité.

**Dans 2 mois :** regarder les données. Est-ce que les utilisateurs Solo atteignent les limites ? Est-ce qu'ils convertissent ? Est-ce que les Pro restent ? Ces réponses valent plus que n'importe quelle grille tarifaire théorique.

**Dans 4-6 mois :** ajouter le plan Business à 39 €/mois quand les fonctionnalités multi-utilisateurs sont solides, et proposer l'annuel aux clients qui ont déjà 3 mois d'historique.

**Ne jamais faire :** changer les prix en baisse pour attirer des clients hésitants. Si quelqu'un hésite à 19 €, le problème n'est pas le prix — c'est que la valeur n'est pas encore évidente pour lui. La solution c'est de mieux démontrer la valeur, pas de baisser le prix.

---

## Résumé — Ce qu'on garde de Gemini, ce qu'on ajuste

| Point | Gemini | Mon avis |
|---|---|---|
| Analyse des coûts Stripe/Supabase | ✅ Correct et utile | Garder tel quel |
| Supprimer le freemium | ❌ Trop tôt | Plan gratuit limité jusqu'à 50 clients payants |
| 4 paliers dès le départ | ❌ Trop complexe | 2 paliers au lancement, 3 après validation |
| Prix 12/24/39/49 € | ⚠️ Discutable | Préférer 19/39 € — plus clair, meilleure marge |
| Annuel avec 2 mois offerts | ✅ Bonne mécanique | Mais proposer après 3 mois d'abonnement seulement |
| Stripe recommandé | ✅ | Oui, mais noter Lemonsqueezy pour TVA UE plus tard |
| Virement 50/50 manuel | ✅ Pour l'instant | Stripe Connect quand vous aurez 20+ clients |

---

*Document généré le 08/04/2026 · Projet Heryze · Avis Pricing v1.0*
