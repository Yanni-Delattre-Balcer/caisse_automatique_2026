# Stratégie Fonctionnelle et UX : Tunnel d'Abonnement & Essai 7 Jours

Ce document formalise la refonte de la stratégie d'acquisition, du tunnel de paiement et de la rétention pour le SaaS Heryze. L'objectif est de sécuriser le client avec une approche extrêmement transparente tout en garantissant des conversions élevées à l'échéance d'une période d'essai de 7 jours.

---

## 1. Landing Page : Acquisition Neutre & Incitative

L'enjeu est de ne plus dévaloriser le produit en utilisant les termes "Essayer gratuitement" comme appel à l'action primaire, tout en informant les visiteurs qualifiés qu'une période d'essai les attend pour limiter tout frein financier.

*   **Remplacement sémantique global :**
    *   Bouton "Essayer gratuitement" -> **"Inscription"**
    *   Bouton "Se connecter" -> **"Connexion"**
*   **Grille Tarifaire (Section) :**
    *   Mise en avant discrète mais claire de la mention **"7 jours offerts"** (badge ou texte vert rassurant) intégrée aux tarifs.
    *   C'est ici seulement que l'utilisateur prend conscience qu'il bénéficie d'une semaine de test.

---

## 2. Le SAS de Transparence (La page intermédiaire d'Abonnement)

Plutôt que d'envoyer l'utilisateur directement et violemment vers la page du processeur de paiement (Stripe) dès son clic sur la landing page, une étape intermédiaire (un sas) a été pensée. Le but de cette page est la **clarté absolue**. 

Lorsqu'il choisit un plan, il est redirigé vers ce composant qui :
*   **Récapitule le produit attendu :** Affiche de façon proéminente la carte principale du plan sélectionné (Starter ou Business) et ses avantages métier.
*   **Explique la promesse "Zero Risque" :** Un bloc textuel très clair informe l'utilisateur que :
    *   *"Vous bénéficiez de 7 jours offerts pour tester l'intégralité du produit en conditions réelles."*
    *   *"Vous ne paierez rien aujourd'hui."* (Si mise en place du free-trial Stripe)
    *   *"Garantie de récupération : Si, à l'issue de ces 7 jours, vous ne souhaitez pas vous abonner, un bouton sera mis à votre disposition pour télécharger localement tout le travail accompli (inventaires, paramètres) avant de résilier sans aucun frais."*
*   **Offre des alternatives :** Présente sous ce bloc les autres plans disponibles, s'il se rend compte de son erreur.
*   **Finalise :** Un bouton "Choisir ce plan" qui déclenchera, cette fois-ci, une redirection dans un nouvel onglet vers Stripe.

---

## 3. L'Espace Utilisateur & Le Compteur (J0 à J+7)

Une fois l'utilisateur inscrit et dans l'application métier (Dashboard) :

*   **Le Compteur discret :** En haut de l'interface, un bandeau non-invasif annonce : *"Il vous reste X jours offerts sur votre période de découverte. [Gérer mon abonnement]"*
*   Le bouton redirige l'utilisateur vers une page interne `/upgrade` reprenant les informations du SAS de transparence, s'il souhaite valider son paiement avant échéance.
*   L'interface est 100% libre et fonctionnelle.

---

## 4. L'Échéance : Le Hard Wall ("Le Soft-Lock Éthique")

Au-delà des 7 jours, si Stripe n'indique aucun abonnement actif, l'application bascule dans un mode de verrouillage intégral.

*   **Design du mur :** L'approche est volontairement **"sobre, élégante et minimaliste"**. Il ne s'agit pas d'un popup rouge agressif "PAYEZ MAINTENANT", mais d'un écran plein de qualité, très propre, signalant poliment la fin de l'essai.
*   **Blocage des routes :** L'utilisateur est expulsé de son accès aux actions habituelles (/pos, /inventory, etc).
*   **L'Éthique :** Seuls trois boutons sont disponibles sur ce mur :
    1.  **[Primaire] Action Requise :** "Débloquer mon espace" -> Ouvre le tunnel ou modal d'abonnement final.
    2.  **[Secondaire] La Promesse Tenue :** "Récupérer mon travail" -> Exécute un job d'export (Excel/CSV) envoyant tout l'inventaire et les ventes de l'utilisateur sur sa machine locale, en cas d'abandon de l'application. 
    3.  **[Tertiaire] RGPD :** "Supprimer mon compte" (En toute discrétion).

---

## 💡 Notes pour la 2ème IA

L'équipe cherche ton regard expert sur cette stratégie globale :
1.  **Sur l'UX :** Cette séquence (Landing => SAS explicatif => Stripe, puis J+7 Hard Wall avec Option d'Export) te paraît-elle fluide et conforme aux meilleurs standards B2B émergents ? Y vois-tu des frictions indues ?
2.  **Sur le plan Légal et Éthique :** Comment perçois-tu la balance entre l'incitation forte au paiement (blocage) et l'échappatoire d'exportation libre des données ?
3.  **Sur l'implémentation (Tech) :** Vois-tu des écueils potentiels à gérer en React/Node/Supabase (par ex : persistance du cache pour le JWT auth lors du retour de Stripe, calcul des 7 jours vs Fuseaux horaires, etc.) ?
