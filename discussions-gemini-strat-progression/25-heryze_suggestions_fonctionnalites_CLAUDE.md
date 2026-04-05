# Heryze — Analyse Produit & Roadmap Fonctionnelle
> Document stratégique · Suggestions d'amélioration & nouvelles fonctionnalités
> Cible : TPE/PME françaises · Positionnement : 19–39 €/mois

---

## Préambule — Ce qui est déjà une vraie force

Avant de parler de ce qui manque, voici les trois arguments qui peuvent faire basculer un commerçant hésitant, classés par puissance de conviction :

**Argument 1 — Zéro douchette (économie immédiate de 150–300 €)**
C'est l'argument le plus concret et le plus fort. Un commerçant comprend immédiatement la valeur d'une économie en argent réel, sur un achat qu'il aurait été obligé de faire autrement. À mettre en avant dès la première phrase de toute communication commerciale.

**Argument 2 — Fonctionne sans internet**
C'est l'argument de la tranquillité d'esprit. Les commerces mobiles (marchés, food trucks, festivals), les zones à réseau instable, les caves et sous-sols — tous ont déjà vécu la panique d'une caisse qui ne répond plus. Heryze est la seule solution qui supprime cette anxiété structurellement.

**Argument 3 — Moitié prix des leaders**
19–39 €/mois contre 60–100 €/mois, c'est 480 à 720 € d'économie annuelle. Pour une boulangerie ou un salon de coiffure, c'est significatif. Mais cet argument arrive en troisième position car il peut être interprété comme "moins bien" si les deux premiers ne l'ont pas déjà convaincu.

---

## 1. Fonctionnalités à prioriser immédiatement (Impact fort, faisable rapidement)

### 1.1 Ticket de caisse numérique par QR Code

**Ce que c'est :** À la fin d'une vente, un QR code s'affiche à l'écran. Le client le scanne avec son téléphone et accède à son ticket sur une page web `receipt.heryze.com/{id}`. Pas d'impression, pas d'email, pas de friction.

**Pourquoi c'est prioritaire :** C'est le seul argument de vente qui touche directement le *client final du commerçant*, pas seulement le commerçant lui-même. Un client qui reçoit un ticket numérique élégant perçoit le commerce comme moderne. Le commerçant le voit et associe Heryze à cette modernité. C'est aussi un vecteur de visibilité naturel pour Heryze (le ticket peut porter une mention discrète "Propulsé par Heryze").

**Complexité technique :** Faible. La vente est déjà insérée en base avec un UUID. Il suffit d'une page publique qui lit la table `sales` par cet UUID (sans RLS car la lecture publique d'un ticket est intentionnelle).

**Différenciation marché :** Aucun concurrent direct dans la tranche 0–50 €/mois ne le propose nativement.

---

### 1.2 Alerte stock bas par notification

**Ce que c'est :** Quand le stock d'un produit passe sous un seuil configurable (ex : 5 unités), le commerçant reçoit une notification dans l'app et optionnellement un email.

**Pourquoi c'est prioritaire :** C'est la fonctionnalité que les commerçants citent le plus souvent comme manquante dans les solutions bas de gamme. La rupture de stock non anticipée est une source de perte directe et d'image négative auprès des clients.

**Complexité technique :** Faible côté client (déjà dans `useCatalogStore`). Les notifications in-app sont gérables en CSS pur. L'email peut se faire via Supabase Edge Functions ou Resend (plan gratuit : 3 000 emails/mois).

---

### 1.3 Mode "Caisse rapide" (Favoris)

**Ce que c'est :** Une page configurable de 8 à 12 grands boutons carrés, correspondant aux produits les plus vendus. Un seul tap pour ajouter au panier, sans passer par la grille complète ni par la recherche.

**Pourquoi c'est prioritaire :** Dans une boulangerie au rush du matin, le caissier vend 80 % de son CA sur 5 à 8 produits. La navigation dans un catalogue de 50 produits est une friction inutile. Cette vue réduit le temps de transaction de 30 à 40 % dans ces situations.

**Différenciation marché :** Square POS l'a. Lightspeed l'a. Aucun concurrent cheap en France ne l'a bien implémenté.

---

### 1.4 Récapitulatif de clôture journalière (Z-caisse)

**Ce que c'est :** Un bouton "Clôturer la journée" qui génère un récapitulatif du chiffre d'affaires du jour, ventilé par catégorie, par mode de paiement (CB vs espèces), et par heure. Exportable en PDF.

**Pourquoi c'est prioritaire :** C'est une obligation légale en France pour les commerçants assujettis à la TVA. Tous les logiciels de caisse certifiés NF525 l'ont. En proposant cette fonctionnalité même avant la certification, vous répondez à un besoin réel tout en préparant la conformité légale future.

**Données déjà disponibles :** La table `sales` contient tout — `total_ttc`, `payment_method`, `created_at`, `items`. C'est un calcul CSR pur, sans aucun appel serveur supplémentaire.

---

## 2. Fonctionnalités différenciantes à moyen terme (1–3 mois)

### 2.1 Application mobile PWA installable

**Ce que c'est :** Permettre l'installation de Heryze sur l'écran d'accueil d'un iPad ou d'un Android comme une vraie application, via le mécanisme PWA (Progressive Web App) — sans passer par l'App Store ni le Play Store.

**Pourquoi c'est important :** La plupart des commerçants utilisent une tablette ou un iPad comme terminal de caisse. Une icône sur l'écran d'accueil est psychologiquement très différente d'un favori dans un navigateur. Ça rassure, ça professionnalise, ça réduit les erreurs de manipulation (ouverture du mauvais onglet).

**Complexité technique :** Faible. Vite + React = PWA avec l'ajout d'un `manifest.json` et d'un service worker. `vite-plugin-pwa` le fait en moins d'une heure.

**Argument commercial direct :** "Heryze s'installe en 30 secondes sur votre tablette, comme n'importe quelle application."

---

### 2.2 Gestion des remises et promotions

**Ce que c'est :**
- Remise en % ou en valeur fixe sur un article ou sur le total du panier.
- Codes promo (ex : `-10%` sur tout le catalogue le lundi).
- Prix spéciaux automatiques par quantité (ex : 3 croissants pour le prix de 2).

**Pourquoi c'est important :** C'est une demande quasi universelle des commerçants. Soldes, fidélisation, erreur de prix à corriger en caisse — les situations sont nombreuses. La structure `discounts` existe déjà dans `useCartStore`. C'est une extension naturelle.

---

### 2.3 Gestion des tables (mode Restauration)

**Ce que c'est :** Une vue spécifique au `business_type: 'restauration'` où le commerçant voit ses tables sous forme de plan visuel. Il peut ouvrir une commande par table, la modifier, la transférer à une autre table, et l'encaisser séparément ou globalement.

**Pourquoi c'est important :** Le marché de la restauration est le plus grand marché de logiciels de caisse en France. Planity, Lightspeed Restaurant, Zelty — tous facturent 80–150 €/mois minimum. Heryze à 39 €/mois avec une gestion des tables correcte est une proposition de valeur écrasante pour les petits restaurateurs et cafés.

**Note :** Le champ `Tables` est déjà dans la sidebar de l'interface actuelle — c'est une priorité implicite qui est déjà visible par les utilisateurs.

---

### 2.4 Import catalogue par CSV/Excel

**Ce que c'est :** Un commerçant qui migre depuis un concurrent (ou qui gère son catalogue dans Excel) peut uploader un fichier CSV et retrouver tous ses produits importés en quelques secondes.

**Pourquoi c'est important :** La friction d'onboarding est le principal frein à l'adoption. Si un commerçant doit saisir 200 produits à la main avant de pouvoir utiliser Heryze, il abandonne. Un import CSV supprime complètement cette barrière.

**Format minimal supporté :**
```
nom, prix_ht, tva, catégorie, stock, code-barre
Pain au Chocolat, 1.00, 5.5, Viennoiserie, 50, 3256780010012
```

---

### 2.5 Profil client et historique d'achats

**Ce que c'est :** La possibilité d'associer une vente à un client (nom + téléphone ou email, pas besoin de plus). L'historique des achats de ce client est ensuite consultable, et des statistiques simples sont disponibles (fréquence de visite, panier moyen, produits favoris).

**Pourquoi c'est important :** C'est la base de la fidélisation client, un sujet central pour les TPE/PME. Même sans programme de points ou de réductions automatiques, savoir qu'un client vient 3 fois par semaine et dépense en moyenne 12 € est une information précieuse pour le commerçant.

**Table Supabase à ajouter :**
```sql
CREATE TABLE customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now() NOT NULL
);
```
Le champ `client` existe déjà dans `useCartStore`. C'est une extension directe.

---

## 3. Fonctionnalités de fidélisation & croissance (3–6 mois)

### 3.1 Programme de fidélité simple

**Ce que c'est :** Un système de points configurable par le commerçant. Exemple : "1 point par euro dépensé, 10 points = 1 € de remise". Le client s'enregistre avec son numéro de téléphone. Pas d'application à télécharger, pas de carte physique à perdre.

**Pourquoi c'est différenciant :** Aucun logiciel de caisse sous 60 €/mois n'inclut un programme de fidélité natif. C'est généralement un service séparé (Sumeria, Loyoly) qui coûte 30–80 €/mois supplémentaires. L'inclure dans Heryze justifie à lui seul le passage au plan à 39 €/mois.

---

### 3.2 Statistiques avancées & prédictions

**Ce que c'est :** Au-delà du dashboard de base, des insights actionnables pour le commerçant :
- Heure de pointe du jour/semaine.
- Produits qui se vendent toujours ensemble (pairing — "les clients qui achètent des croissants achètent aussi du café").
- Prédiction de rupture de stock basée sur la vélocité de vente.
- Comparaison semaine/semaine et mois/mois.

**Pourquoi c'est important :** Ces informations transforment Heryze d'une "caisse" en un "assistant commercial". Le commerçant qui utilise ces données prend de meilleures décisions d'achat et optimise son CA — il a donc un ROI tangible sur son abonnement, ce qui réduit le churn.

**Complexité technique :** Tous les calculs se font côté client (CSR-First) sur les données déjà présentes dans la table `sales`. Pas de nouveau appel serveur.

---

### 3.3 Notifications push clients (future évolution PWA)

**Ce que c'est :** Une fois la PWA installée sur la tablette du commerçant, la possibilité d'envoyer des notifications push simples à ses clients abonnés. Exemple : "Arrivage de fraises ce matin !" ou "Fermeture exceptionnelle vendredi".

**Pourquoi c'est important :** C'est une fonctionnalité que les grandes enseignes ont via leurs apps dédiées. La proposer à une boulangerie de quartier à 39 €/mois est une rupture de valeur réelle.

---

## 4. Améliorations UX concrètes à intégrer maintenant

### 4.1 Raccourcis clavier

Pour les commerçants qui utilisent un clavier (point de vente avec écran externe), des raccourcis clavier accélèrent massivement le workflow :

| Raccourci | Action |
|---|---|
| `/` | Focus sur la barre de recherche |
| `Entrée` | Valider la vente (CB par défaut) |
| `Échap` | Fermer les modales |
| `F1`–`F8` | Ajouter les 8 produits favoris au panier |

---

### 4.2 Mode plein écran anti-distractions

Un bouton pour masquer la barre d'adresse du navigateur et toutes les notifications système, et passer en mode "caisse pure". Possible via l'API Fullscreen du navigateur. Idéal pour les tablettes partagées avec d'autres usages.

---

### 4.3 Indicateur de statut de synchronisation

Une icône discrète en haut de la sidebar (ou dans la topbar) qui indique l'état de la connexion et de la synchronisation :
- Vert = connecté, tout synchronisé.
- Orange = connecté, synchronisation en cours.
- Rouge = hors ligne, N ventes en attente de sync.

Ce petit détail rassure énormément les commerçants non-techniciens qui ne comprennent pas le mode offline-first et peuvent paniquer en voyant leur Wi-Fi coupé.

---

### 4.4 Calculateur de rendu monnaie

**Ce que c'est :** Après avoir sélectionné "Espèces" comme moyen de paiement, un champ apparaît où le caissier entre le montant remis par le client. Heryze affiche immédiatement la monnaie à rendre.

**Exemple :** Total 7,30 € → Client donne 10 € → "Rendre 2,70 €" s'affiche en grand.

**Pourquoi :** C'est basique, mais c'est une fonctionnalité que 100 % des commerçants qui font des transactions en espèces apprécient immédiatement. Zéro complexité technique, impact perçu très fort.

---

## 5. Ce qu'il ne faut pas faire (les pièges à éviter)

### Ne pas ajouter trop de fonctionnalités en même temps

Le risque de la liste ci-dessus est de vouloir tout implémenter. La règle d'Apple s'applique ici : chaque fonctionnalité ajoutée est aussi une fonctionnalité qui peut se casser, créer une confusion, ou ralentir le développement des fonctionnalités qui comptent vraiment. Prioriser sévèrement.

### Ne pas proposer trop d'options de personnalisation

"Vous pouvez choisir votre couleur de thème, votre disposition de grille, votre police…" — c'est une fausse bonne idée. Cela fragmente l'expérience, multiplie les bugs, et donne une impression d'application peu finie. Deux thèmes maximum (Light et Dark). Zéro option de disposition. L'interface s'adapte au `business_type`, pas aux goûts personnels.

### Ne pas négliger la documentation commerçant

Un commerçant de 55 ans qui installe Heryze doit pouvoir s'en sortir seul. Une vidéo de 3 minutes sur YouTube ("Configurer votre caisse en 3 étapes") et un guide de démarrage rapide PDF téléchargeable depuis l'app valent plus que 10 fonctionnalités supplémentaires pour réduire le support et les désabonnements.

---

## 6. Synthèse — Roadmap recommandée

| Priorité | Fonctionnalité | Effort estimé | Impact business |
|---|---|---|---|
| 🔴 P0 | Ticket numérique QR code | Faible | Très fort (viral, différenciant) |
| 🔴 P0 | Alerte stock bas | Faible | Fort (rétention) |
| 🔴 P0 | PWA installable | Très faible | Fort (perception produit) |
| 🔴 P0 | Calculateur rendu monnaie | Très faible | Fort (adoption espèces) |
| 🟠 P1 | Z-caisse / clôture journalière | Faible | Très fort (légal + comptable) |
| 🟠 P1 | Mode caisse rapide (favoris) | Moyen | Fort (efficacité) |
| 🟠 P1 | Import catalogue CSV | Faible | Très fort (onboarding) |
| 🟡 P2 | Gestion des tables (restauration) | Élevé | Très fort (nouveau marché) |
| 🟡 P2 | Remises & codes promo | Moyen | Fort (polyvalence) |
| 🟡 P2 | Profil client & historique | Moyen | Fort (fidélisation) |
| 🟢 P3 | Programme de fidélité | Élevé | Très fort (différenciation premium) |
| 🟢 P3 | Statistiques avancées | Moyen | Fort (rétention, ROI perçu) |

---

## 7. Positionnement final — Ce que Heryze doit dire de lui-même

> "Heryze, c'est la caisse qui marche avec votre téléphone, fonctionne sans internet, et coûte deux fois moins cher que les autres. Pas d'installation, pas de matériel, pas de contrat annuel."

Ces quatre propositions de valeur, dans cet ordre, couvrent les quatre objections principales d'un commerçant TPE/PME :
1. "Je n'ai pas le temps d'apprendre un nouveau logiciel." → Votre téléphone suffit.
2. "Et si mon internet tombe ?" → Ça marche quand même.
3. "C'est sûrement trop cher." → Deux fois moins cher.
4. "Je ne veux pas être piégé." → Pas de contrat annuel.

---

*Document généré le 04/04/2026 · Projet Heryze · Version 1.0*
