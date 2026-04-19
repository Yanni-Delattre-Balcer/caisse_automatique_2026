Objet : Refonte architecturale de LandingPage.jsx vers une structure "Apple Product Page"

"Tu es un expert en UI/UX Senior spécialisé dans le design épuré et le marketing narratif d'Apple. Ta mission est de réécrire le composant LandingPage.jsx pour en faire une LandingPageV2.jsx.

Directives de Design & Philosophie :

Structure Narrative : Abandonne les sections en grille classiques. Utilise une structure de 'scrolling narratif' où chaque section occupe tout l'écran (viewport) ou presque, centrée sur un seul bénéfice majeur à la fois.

Minimalisme & Chaleur : Garde les couleurs (bleus, blancs, dégradés) et les effets de lumière (flous, verres) actuels, mais augmente les espaces blancs (padding/margin). Le design doit respirer.

Le Texte : Applique la règle : Titre = Bénéfice Tangible (Pourquoi), Sous-titre = Fonctionnalité (Comment).

Exemple : Au lieu de 'Caisse Offline', utilise 'Encaissez même quand le monde s'arrête.'

Typographie Apple : Utilise des graisses contrastées (font-black pour les titres, font-medium pour le corps).

Restructuration de la Page (Sections à créer) :

Navbar Minimaliste :

À gauche : 'Heryze' (gras).

Au centre : Liens discrets (Présentation, Pourquoi Heryze).

À droite : Un bouton 'Essai Gratuit' ou 'Acheter' très démarqué.

Le Hero (La Promesse) :

Un titre monumental au centre.

Une phrase simple et puissante en dessous.

Un visuel produit (mockup smartphone ou tablette) juste en dessous.

Le Manifeste (Le 'Partner' de Business) :

Une section de transition avec un texte centré, taille standard, qui explique que Heryze n'est pas qu'un logiciel, mais un partenaire qui libère des contraintes techniques et comptables.

Les "Grandes Histoires" (Bénéfices immersifs) :

Créer des sections alternées (Texte à gauche / Image à droite, puis inversement).

Chaque section doit suivre le schéma Apple :

Grand Titre de résultat (ex: 'Votre comptabilité se fait pendant que vous dormez.')

Phrase d'accroche en gras.

Paragraphe explicatif normal.

Lien "En savoir plus >" en bleu.

L'Effet 3-en-1 (L'Identité) :

Une section qui présente Heryze comme la fusion de 3 outils : Une Caisse + Un Scanner + Un Comptable.

Le Choix Intelligent (Pricing) :

Présente les deux plans (Starter et Business) non pas comme des prix, mais comme des investissements. Mets en avant le plan Business (le milieu de gamme/haut de gamme) comme le choix optimal pour la croissance.

CTA Final :

Un message puissant sur l'expérience et le futur du commerce.

Contraintes Techniques :

Utilise framer-motion pour des apparitions fluides au scroll (FadeIn).

Utilise lucide-react pour les icônes.

Garde l'intégration avec useAuthStore et redirectToCheckout.

Le code doit être propre, modulaire et réutilisable.

Réécris maintenant LandingPageV2.jsx en suivant cette structure narrative Apple."

Conseils supplémentaires pour ta V2 :
Le visuel est roi : Apple utilise des images énormes de haute qualité. Pour ton test, demande à Gemini d'utiliser des div avec des dégradés élégants ou des icônes XXL là où tu mettras tes futurs screenshots.

L'Espace : N'aie pas peur du vide. Dans le style Apple, si un utilisateur doit scroller pour voir la suite, c'est une bonne chose, car cela signifie qu'il se concentre sur une seule idée à la fois.

Les Verbes : Utilise des verbes d'action. "Encaissez", "Vendez", "Gérez", "Respirez".