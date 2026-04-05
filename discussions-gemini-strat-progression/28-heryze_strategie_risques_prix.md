# Heryze — Stratégie de Réponse aux Risques
> Document stratégique · Pricing, positionnement concurrentiel, rétention UX
> Basé sur l'analyse de viabilité · Avril 2026

---

## 1. Stratégie de Prix — Remplacer le "40 €" par une architecture tarifaire

### Le problème du prix unique

Un prix unique à 39 €/mois crée deux problèmes simultanés : il est trop cher pour l'artisan seul qui démarre, et il est trop bas pour un restaurateur avec 3 terminaux qui pourrait payer 80 €. Vous laissez de l'argent sur la table en haut, et vous perdez des clients en bas.

La solution est une architecture à trois niveaux, avec un niveau gratuit réel — pas un "essai 14 jours", mais un plan gratuit permanent avec des limites raisonnables.

---

### Architecture tarifaire recommandée

#### Plan Solo — Gratuit pour toujours

**Cible :** Auto-entrepreneurs, artisans, vendeurs sur marchés, testeurs.

**Inclus :**
- 1 utilisateur, 1 commerce
- Jusqu'à 50 produits au catalogue
- Jusqu'à 100 transactions/mois
- Caisse complète (offline-first, scanner mobile)
- Exports CSV basiques (ventes du mois)
- Ticket numérique QR code

**Ce qui est exclu (pour inciter à monter) :**
- Pas de Z-caisse PDF
- Pas de dashboard analytiques
- Pas d'alertes stock
- Pas d'import CSV catalogue
- Pas de support prioritaire

**Pourquoi un plan gratuit permanent et non un essai ?**
Un essai 14 jours crée une pression immédiate — le commerçant doit décider vite, sans avoir vraiment testé en conditions réelles. Un plan gratuit permanent lui laisse le temps de s'habituer, de créer ses habitudes, et de ressentir lui-même les limitations. Il se convertit naturellement quand il a besoin de plus, pas quand vous le forcez. C'est exactement la stratégie de Notion, Slack et Linear.

Le coût réel d'un utilisateur Solo pour vous : quelques ko de données Supabase par mois. Marginal.

---

#### Plan Pro — 19 €/mois

**Cible :** Boulangeries, épiceries, salons, coiffeurs, commerces solo établis.

**Inclus (tout Solo +) :**
- Produits illimités
- Transactions illimitées
- Z-caisse PDF quotidien
- Dashboard analytiques complet
- Alertes stock bas configurables
- Import catalogue CSV
- Tickets numériques avec logo du commerce
- Historique ventes 12 mois
- 1 terminal supplémentaire (2 au total)
- Support par email (réponse sous 48h)

**Positionnement du message :**
> "Moins cher qu'un abonnement Netflix. Moins cher qu'une heure de comptable."

---

#### Plan Business — 39 €/mois

**Cible :** Restaurants, boutiques avec plusieurs vendeurs, commerces à plusieurs postes.

**Inclus (tout Pro +) :**
- Terminaux illimités
- Gestion des tables (mode Restauration)
- Multi-utilisateurs avec rôles (Gérant / Vendeur)
- Export comptable normé (FEC, format expert-comptable)
- Programme de fidélité client
- Statistiques avancées + prédictions
- Support prioritaire (réponse sous 24h, chat)
- White-label tickets (votre marque, pas Heryze)

---

#### Plan Annuel — 2 mois offerts sur Pro et Business

Proposer systématiquement l'option annuelle sur la page de pricing :
- Pro Annuel : **159 €/an** (soit 13,25 €/mois — économie de 69 €)
- Business Annuel : **319 €/an** (soit 26,58 €/mois — économie de 149 €)

L'annuel améliore votre trésorerie et réduit le churn — un commerçant qui a payé l'année ne se pose pas la question chaque mois.

---

### Tableau récapitulatif

| | Solo | Pro | Business |
|---|---|---|---|
| Prix | Gratuit | 19 €/mois | 39 €/mois |
| Produits | 50 | Illimités | Illimités |
| Transactions/mois | 100 | Illimitées | Illimitées |
| Terminaux | 1 | 2 | Illimités |
| Z-caisse PDF | — | ✅ | ✅ |
| Export comptable normé | — | — | ✅ |
| Multi-utilisateurs | — | — | ✅ |
| Gestion tables | — | — | ✅ |
| Programme fidélité | — | — | ✅ |
| Support | — | Email 48h | Chat 24h |

---

### Message prix face aux artisans réticents

Pour l'artisan qui "n'a pas l'habitude de payer pour du logiciel", trois reformulations à tester :

**Reformulation 1 — Comparaison temps :**
> "19 €/mois, c'est moins que 15 minutes de votre temps à la fin du mois pour refaire vos calculs à la main."

**Reformulation 2 — Comparaison matériel :**
> "Une douchette code-barre coûte 150 €. Avec Heryze, vous économisez ça dès le premier mois — et vous n'avez rien à acheter."

**Reformulation 3 — Comparaison comptable :**
> "Une heure chez votre expert-comptable coûte 80–120 €. Heryze vous prépare son dossier automatiquement. À vous de voir."

---

## 2. Positionnement Concurrentiel — Peser face aux rivaux

### La carte des rivaux

| Rival | Positionnement réel | Faiblesse exploitable |
|---|---|---|
| **Merlin** | Caisse POS mid-market | Cher (60 €+), interface datée, pas d'offline |
| **Pennylane** | Comptabilité pure, pas POS | Ne gère pas la caisse physique |
| **QuickBooks** | Comptabilité Anglo-saxonne | Inadapté au contexte fiscal français (TVA, NF525) |
| **Shine / Qonto** | Banque pro avec exports | Export bancaire ≠ comptabilité de caisse, pas de POS |

### Ce que personne d'autre ne fait simultanément

La clé de votre positionnement n'est pas d'être meilleur qu'eux sur leur terrain — c'est d'être le seul à occuper l'intersection de trois terrains à la fois :

```
        Caisse physique
              |
    Heryze (l'intersection)
       /              \
Offline-First    Comptabilité auto
```

Ni Pennylane ni QuickBooks ne font de caisse physique offline. Ni Merlin ni les banques ne génèrent une comptabilité exploitable par un expert-comptable directement depuis les ventes. Heryze est seul à faire les trois.

**Phrase de positionnement à utiliser :**
> "Heryze est le seul logiciel qui encaisse vos clients sans internet, et envoie la comptabilité à votre expert-comptable sans que vous touchiez à rien."

---

### Arguments spécifiques contre chaque rival

**Contre Merlin / Lightspeed :**
> "Même fonctionnalités, deux fois moins cher, et ça marche quand votre box tombe en panne."

**Contre Pennylane / QuickBooks :**
> "Pennylane vous donne une belle comptabilité. Mais il ne sait pas que vous avez vendu 47 croissants ce matin. Heryze si."

**Contre Shine / Qonto :**
> "Votre banque vous donne vos relevés. Heryze vous donne votre comptabilité. Ce n'est pas la même chose — demandez à votre comptable."

---

### Stratégie de distribution — Atteindre les TPE sans budget marketing

Les TPE/PME ne cherchent pas leur logiciel de caisse sur Google. Elles en parlent avec :
1. Leur expert-comptable
2. Leur chambre de commerce (CCI)
3. D'autres commerçants de la même rue

**Action 1 — Programme partenaire expert-comptable**
Proposer aux cabinets comptables un tableau de bord spécial où ils voient les exports de leurs clients Heryze directement. Pas de frais supplémentaires pour eux. En échange, ils recommandent Heryze à leurs clients commerçants. C'est le canal de distribution numéro un des logiciels comptables en France — Pennylane a bâti sa croissance presque entièrement dessus.

**Action 2 — Présence sur les marchés physiques**
Un stand sur un marché de commerçants ou une démonstration dans une chambre de commerce coûte quelques dizaines d'euros et touche directement la cible. Montrez le scanner mobile en live — c'est l'argument qui fait "wow" systématiquement.

**Action 3 — Parrainage commerçant**
Un commerçant qui parraine un autre commerçant reçoit un mois gratuit. Le parrain aussi. Les commerçants se parlent — c'est une des rares cibles B2B où le bouche-à-oreille fonctionne encore vraiment.

---

## 3. UX Comptabilité — Mieux qu'Excel sans être intimidant

### Le vrai problème avec la comptabilité dans les logiciels actuels

La comptabilité fait peur. Pas parce que c'est compliqué, mais parce que les logiciels la présentent comme telle. QuickBooks et Pennylane utilisent le vocabulaire des comptables (journaux, grand livre, solde débiteur) alors que le commerçant veut savoir une seule chose : "Est-ce que j'ai bien gagné ma vie ce mois-ci ?"

La règle d'or pour Heryze : **ne jamais utiliser le mot "comptabilité" dans l'interface.** Utiliser "vos chiffres", "votre mois", "ce qu'il faut envoyer au comptable".

---

### Architecture UX de la section "Mes Chiffres"

#### Vue 1 — "Mon mois en un coup d'œil"

Accessible depuis la sidebar, c'est la première chose visible. Trois chiffres, gros, sans jargon :

```
┌─────────────────────────────────────────────┐
│                                              │
│   Vous avez encaissé   Nombre de ventes   Panier moyen  │
│      1 204,50 €              42              28,67 €     │
│                                              │
│   ↑ +12% vs le mois dernier                 │
│                                              │
│   [Voir le détail]  [Préparer pour le comptable ↓]      │
│                                              │
└─────────────────────────────────────────────┘
```

Pas de graphiques complexes sur cette page. Juste les trois chiffres que le commerçant regarde en premier.

---

#### Vue 2 — "Préparer pour le comptable"

Un wizard en 3 étapes, pas une page de paramètres :

**Étape 1 — Choisir la période**
```
Quelle période voulez-vous exporter ?
○ Ce mois-ci (mars 2026)
○ Le mois dernier (février 2026)
○ Ce trimestre
○ Choisir des dates...
```

**Étape 2 — Vérification visuelle**
Avant le téléchargement, afficher un résumé lisible de ce qui va être exporté :
```
Période : Mars 2026

Chiffre d'affaires HT    987,25 €
TVA collectée 5,5 %      54,30 €
TVA collectée 20 %       32,60 €
Total TTC encaissé     1 074,15 €

Paiements CB :           834,15 €
Paiements espèces :      240,00 €

42 ventes · 8 catégories
```

Si quelque chose semble anormal (ex : un jour sans aucune vente), un avertissement discret apparaît : "Aucune vente le 15 mars — jour férié ou fermeture ?"

**Étape 3 — Téléchargement**
Deux boutons :
- **"Pour mon comptable (Excel normé)"** — génère un fichier au format FEC (Fichier des Écritures Comptables), le standard légal français que tout expert-comptable peut importer directement dans son logiciel.
- **"Pour moi (résumé PDF)"** — génère un document lisible, avec logo du commerce, à conserver dans ses archives.

---

#### Vue 3 — Déclaration TVA assistée

Pour les commerçants assujettis à la TVA, l'interface calcule automatiquement les montants à reporter sur la déclaration CA3 ou CA12 :

```
Votre prochaine déclaration TVA
Période : T1 2026 (janvier – mars)

TVA à déclarer (case 08) :    86,90 €
TVA déductible (case 20) :     0,00 €
Montant à payer au Trésor :   86,90 €

[Copier les montants]  [Télécharger le justificatif]
```

**Note légale importante (à afficher dans l'interface) :**
> "Ces montants sont calculés à titre indicatif à partir de vos ventes enregistrées. Ils ne constituent pas un conseil fiscal. Vérifiez toujours avec votre expert-comptable avant de déposer votre déclaration."

Cette mention protège Heryze légalement tout en restant utile.

---

### Ce qui différencie cette UX d'Excel

| Excel | Heryze "Mes Chiffres" |
|---|---|
| Saisie manuelle ligne par ligne | Données générées automatiquement depuis les ventes |
| Formules à ne pas casser | Aucune formule visible |
| Erreurs de saisie fréquentes | Zéro saisie = zéro erreur |
| Mise en forme à refaire chaque mois | Template toujours identique |
| Vocabulaire comptable brut | Langage du commerçant |
| 1 à 3 heures par mois | 2 minutes par mois |

Le positionnement à marteler : **"Heryze ne remplace pas votre comptable. Il lui mâche le travail — et vous fait économiser des heures."**

---

### Ce qui différencie cette UX de Pennylane / QuickBooks

Pennylane est fait pour les comptables. Son interface est pensée par des comptables, pour des comptables. QuickBooks pareil. Le commerçant qui ouvre ces logiciels se retrouve face à des menus comme "Plan comptable", "Écritures de journal", "Rapprochement bancaire" — et ferme l'onglet en moins de 30 secondes.

Heryze ne montre jamais ces termes dans l'interface principale. Ils apparaissent uniquement dans les exports (car le comptable en a besoin), pas dans l'expérience quotidienne du commerçant.

---

## 4. Réduire le risque réglementaire

### Ce que vous pouvez promettre sans risque légal

✅ "Heryze calcule votre TVA automatiquement depuis vos ventes."
✅ "Heryze génère un export au format FEC, compatible avec tous les logiciels comptables."
✅ "Heryze vous aide à préparer les éléments pour votre déclaration TVA."
✅ "Heryze génère votre Z-caisse quotidien conforme aux exigences fiscales."

### Ce que vous ne devez jamais promettre

❌ "Heryze remplace votre expert-comptable."
❌ "Heryze est certifié pour votre déclaration fiscale."
❌ "Vos chiffres Heryze sont valables tels quels pour l'administration fiscale."

### La certification NF525 comme argument de confiance

La certification NF525 n'est pas obligatoire pour utiliser un logiciel de caisse, mais les commerçants assujettis à la TVA doivent pouvoir prouver que leur logiciel est "sécurisé" (inaltérabilité des données). La certification est la preuve la plus simple à présenter en cas de contrôle fiscal.

**Stratégie recommandée :** Ne pas promettre la certification aujourd'hui. En revanche, communiquer :
> "Heryze est conçu pour la conformité NF525. Le chaînage cryptographique de chaque vente est déjà en place. La certification formelle est en cours."

Cela rassure sans surpromesse.

---

## 5. Stratégie de rétention — Empêcher le départ vers Excel

### Pourquoi les gens partent vers Excel

Ils partent quand :
1. L'interface leur prend plus de temps qu'Excel (friction UX).
2. Ils ne voient pas de valeur supplémentaire à payer.
3. Ils ont une mauvaise expérience lors d'un moment critique (panne, bug au mauvais moment).

### Les trois gardes-fous

**Garde-fou 1 — Le "moment de valeur" hebdomadaire**
Envoyer un email automatique chaque lundi matin avec le résumé de la semaine écoulée. Pas de marketing, juste les chiffres :
> "Bonjour [Prénom], la semaine dernière votre boulangerie a encaissé 847 € (+8% vs la semaine précédente). Vos 3 produits stars : Baguette Tradition, Pain au Chocolat, Café Expresso."

Ce rappel hebdomadaire crée une habitude et une association positive : Heryze = information utile.

**Garde-fou 2 — Le "coût du départ" perceptible**
Plus les données du commerçant sont dans Heryze (historique ventes, catalogue produits, profils clients), plus partir représente une perte réelle. L'historique de 12 mois de ventes n'existe nulle part ailleurs que dans Heryze — c'est un actif. Communiquer clairement sur cet actif.

**Garde-fou 3 — L'export toujours disponible**
Paradoxalement, permettre l'export complet des données à tout moment (CSV de toutes les ventes, catalogue produits) réduit la peur de "se faire piéger" et augmente la confiance. Les commerçants restent plus longtemps chez les plateformes qui leur permettent de partir facilement — parce qu'ils n'ont pas peur de rester.

---

## Synthèse des priorités

| Action | Impact | Effort | À faire quand |
|---|---|---|---|
| Créer le plan gratuit Solo | Très fort (acquisition) | Faible | Maintenant |
| Définir les 3 niveaux de prix | Fort (conversion) | Nul (décision) | Maintenant |
| Ajouter la mention légale TVA | Critique (protection) | Très faible | Maintenant |
| UX "Mes Chiffres" (3 écrans) | Très fort (rétention) | Moyen | Sprint suivant |
| Email récap hebdomadaire | Fort (rétention) | Faible | Sprint suivant |
| Export FEC normé | Fort (crédibilité) | Moyen | Avant commercialisation |
| Programme partenaire comptable | Très fort (distribution) | Moyen | Dès 10 clients |

---

*Document généré le 05/04/2026 · Projet Heryze · Stratégie & Risques v1.0*
