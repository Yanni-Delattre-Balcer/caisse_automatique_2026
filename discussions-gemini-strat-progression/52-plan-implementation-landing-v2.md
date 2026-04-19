# Plan d'implémentation : Landing Page V2 (Style Apple Product Page)

Ce plan détaille la création d'une nouvelle version de la Landing Page d'Heryze, adoptant les codes du design premium d'Apple : minimalisme, typographie contrastée, et narration visuelle immersive.

## Décisions Validées

> [!IMPORTANT]
> - **Route dédiée** : L'implémentation se fera sur `/landing-v2` pour permettre une revue côte à côte avec la V1.
> - **FAQ incluse** : La section FAQ sera intégrée pour maximiser le taux de conversion.
> - **Imagerie premium** : Utilisation de quatre mockups haute définition générés spécifiquement pour Heryze (Hero, Offline, Scanner, Comptabilité).

## Graphisme & Assets

Les fichiers ont été préparés dans `src/assets/landing-v2/` :
- `hero-mockup.png` : Mockup multi-device (Tablette/Smartphone).
- `offline-story.png` : Scène d'encaissement sans connexion.
- `scanner-story.png` : Scan de produit via smartphone.
- `accounting-story.png` : Dashboard comptable épuré.

## Modifications Proposées

### Structure & Layout

#### [NOUVEAU] LandingV2Layout.jsx
- **Navbar Apple-style** : Fixe, flou d'arrière-plan (glassmorphism), logo "Heryze" à gauche, liens horizontaux discrets au centre, bouton "Essai Gratuit" à droite.
- **Footer Minimaliste** : Liens essentiels sur fond blanc.

### Composants & Pages

#### [NOUVEAU] LandingPageV2.jsx
Implémentation des sections narratives (une idée majeure par écran) :
1. **Hero (La Promesse)** : Titre en grand "Encaissez même quand le monde s'arrête", Mockup Hero.
2. **Manifeste (Le Partenaire)** : Texte centré expliquant la mission d'Heryze.
3. **Grandes Histoires (Bénéfices)** :
   - **Offline** : Focus sur la résilience réseau (Image Offline).
   - **Scanner** : Focus sur l'économie de matériel (Image Scanner).
   - **Compta** : Focus sur la tranquillité d'esprit (Image Accounting).
4. **L'Identité (3-en-1)** : Vision synthétique Caisse + Scanner + Comptable.
5. **Le Choix Intelligent (Pricing)** : Grille de tarifs présentée comme un investissement.
6. **FAQ** : Accordéons minimalistes.
7. **CTA Final** : Conclusion puissante.

### Routage

#### [MODIFIER] App.tsx
- Ajout de la route `/landing-v2` utilisant le nouveau layout et la nouvelle page.

## Phase de Vérification

### Tests Automatisés
- Vérification du déclenchement de `redirectToCheckout` sur les boutons de tarifs.
- Vérification de l'état d'authentification via `useAuthStore`.

### Vérification Manuelle
- Navigation fluide entre les sections avec `framer-motion`.
- Rendu responsive sur mobile (iPhone vs Android).
- Lisibilité des contrastes typographiques (High Contrast Apple style).
