# 💸 Réflexions Stratégiques : Pricing Heryze

C'est une approche très saine. En éliminant le freemium, vous vous épargnez la gestion d'utilisateurs "poids morts" qui coûtent de l'argent sans en rapporter.

Pour que votre répartition **50/50** soit réelle, vous ne devez pas diviser le Chiffre d'Affaires (les 20€), mais le **Bénéfice Net** (ce qu'il reste après les frais).

Voici l'analyse de vos coûts et une proposition de structure de prix "blindée" pour les TPE/PME.

---

## 1. Analyse des "Frais Invisibles" par abonnement

Pour chaque transaction, plusieurs acteurs se servent avant vous. Prenons votre exemple à 20€ HT/mois :

| Poste de dépense | Coût estimé (par mois/client) | Note |
| :--- | :--- | :--- |
| **Frais Stripe** | ~0,55€ (1,5% + 0,25€) | Incontournable. |
| **Frais Stripe Billing** | 0€ (puis 0,5%) | Gratuit pour vos premiers 10k€. |
| **Base de données (Supabase)** | ~0,10€ (amorti) | Le plan Free suffit au début, le plan Pro à 25$/mois couvre des milliers d'utilisateurs. |
| **Mails (Resend)** | ~0,05€ (amorti) | 3000 mails offerts, puis très peu cher. |
| **PostHog** | 0€ | Le million d'événements gratuit est énorme. |
| **TOTAL FRAIS** | **~0,70€ à 1,00€** | C'est votre "coût de revient" par client. |

> [!IMPORTANT]
> **Calcul du bénéfice :** Sur 20€, il reste environ 19€ nets. En divisant par deux, vous touchez 9,50€ chacun. C'est très proche de votre objectif de 10€ !

---

## 2. Proposition de Grille Tarifaire "Heryze"

Pour séduire les TPE/PME tout en restant simples, je vous suggère d'ajuster légèrement vos paliers pour qu'ils paraissent plus "pro" et couvrent mieux la montée en charge de la base de données.

| Offre | Cible | Prix Conseillé | Votre part (estimée) |
| :--- | :--- | :--- | :--- |
| **Solo** | Indépendant (1 accès) | **12€ / mois** | ~5,50€ chacun |
| **Team 5** | Petite équipe (2-5 accès) | **24€ / mois** | ~11,50€ chacun |
| **Business 10** | PME (6-10 accès) | **39€ / mois** | ~19,00€ chacun |
| **Entreprise** | Illimité (+10 accès) | **49€ / mois** | ~24,00€ chacun |

### Pourquoi ces prix ?
- **Psychologie :** Le passage de 10€ à 12€ ne change rien pour un pro, mais pour vous, ces 2€ de plus couvrent largement TOUS les frais techniques cités plus haut.
- **Simplicité :** On évite les chiffres trop ronds qui font "amateur". 24€ ou 39€ font plus sérieux.

---

## 3. Les 3 "Checkpoints" pour protéger vos marges

### 🗓️ L'abonnement annuel
Proposez **2 mois gratuits** pour un paiement à l'année (ex: 120€/an au lieu de 144€).
*   **Avantage :** Vous encaissez la trésorerie tout de suite et Stripe ne prend ses frais fixes (0,25€) qu'une seule fois au lieu de 12.

### 🗄️ Le coût Supabase
Tant que vous êtes sous les 500MB de base de données, c'est 0€. Surveillez bien le stockage des images (les photos de produits). Si vous en avez beaucoup, utilisez le stockage compressé pour ne pas payer de supplément.

### 🧾 La TVA
Attention, si vous vendez à des entreprises françaises, vous devrez peut-être gérer la TVA (20%). Si vous êtes en auto-entrepreneur avec franchise de TVA, précisez bien "TVA non applicable". Stripe gère ça très bien.

---

## 💡 Mon conseil pour "s'y retrouver"

Créez un compte bancaire commun ou utilisez un outil comme **Stripe Connect** (plus complexe) pour automatiser les virements vers vos deux comptes respectifs.

Mais au début, le plus simple est de laisser l'argent s'accumuler sur Stripe et de faire un virement manuel 50/50 chaque mois après avoir déduit l'éventuel abonnement Supabase Pro (25$).

---

## 4. L'Abonnement Annuel : Le "Saint Graal" du Cashflow

L'abonnement annuel est stratégique pour un projet comme Heryze : il apporte de la trésorerie immédiatement (le cashflow) et fidélise le client sur le long terme.

Pour rester en dessous de solutions comme Merlin (souvent très chères et complexes), il faut jouer sur la **simplicité**.

### 🎯 Quelles entreprises ciblent l'annuel ?

Les entreprises qui préfèrent payer à l'année sont celles qui veulent simplifier leur comptabilité (une seule facture à traiter au lieu de 12).

*   **Profil type :** TPE de 1 à 10 salariés (artisans, petits commerçants, agences locales).
*   **Leur motivation :** Absence de service comptable dédié. Une facture unique de 120€ ou 300€ est plus simple à gérer que 12 petits prélèvements.
*   **Leur crainte :** S'engager sur un outil complexe. Heryze gagne ici par sa légèreté.

### 💰 Stratégie de Prix Annuelle (Heryze vs Merlin & Co)

La règle d'or : offrir **2 mois gratuits**. Cela élimine le risque de résiliation (churn) pendant 12 mois.

| Offre | Prix Mensuel | Prix Annuel (Cible) | Économie Client | Votre part (50/50 net) |
| :--- | :--- | :--- | :--- | :--- |
| **Solo** | 12€ | **120€ / an** | 24€ offerts | ~58€ chacun |
| **Team (2-5)** | 24€ | **240€ / an** | 48€ offerts | ~115€ chacun |
| **Business (6-10)** | 39€ | **390€ / an** | 78€ offerts | ~185€ chacun |

> [!TIP]
> **Pourquoi ces prix vous placent en "tueurs" ?**
> Les concurrents comme Merlin ou les gros ERP tournent souvent autour de 50€ à 100€ par mois minimum. Proposer une solution complète à 120€ pour **l'année entière** est un argument de vente massif. Le commerçant ne prend aucun risque.

### 💎 Les avantages "cachés" de l'annuel pour vous

1.  **Réduction des frais Stripe :** Sur 12 paiements de 12€, Stripe prend $12 \times 0,25€ = 3€$ de frais fixes. Sur un paiement annuel de 120€, Stripe ne prend qu'une seule fois 0,25€. Vous gagnez **2,75€ de marge pure** par client.
2.  **Sécurité technique :** Avec 5 clients annuels (~600€), vous payez l'abonnement Supabase Pro pour toute l'année d'un coup. Fini le stress des frais mensuels.
3.  **Vitesse de développement :** Ce cashflow immédiat permet de financer des services premium ou des domaines sans toucher à votre poche personnelle.

---

## 💡 Le conseil "Positionnement"

Pour être en bonne position face aux gros concurrents, ne dites pas *"On est moins chers"*.
Dites : **"On est l'alternative légère pour ceux qui n'ont pas besoin d'un avion de chasse pour gérer un inventaire"**.

Les PME détestent payer pour des fonctionnalités qu'elles n'utilisent jamais (le fameux *"bloatware"*). **Heryze, c'est l'outil qui va droit au but.**