# US-2 — Matrice de cohérence

## Critères et contrats cibles

Les cas ci-dessous sont des vérifications à réaliser, pas des tests déjà présents : la suite existante couvre la somme brute, le panier vide et les validations initiales. Sources : `stories/US-2.md:6-11`, `tests/Tarification.Tests/CalculDuPanierTests.cs:15-46`.

| Critère | Commandes et faits | Responsabilités | Vérification via `CalculDuPanier.Chiffrer` | Sources |
| --- | --- | --- | --- | --- |
| 1 | `ConfigurerPaliers`, `PaliersConfigures`, `ChiffrerPanier`, `RemiseDeLigneCalculee`, `PanierChiffre` | `GrilleDePaliers` : aucun seuil atteint ; `Panier` : cumul | 10 : 5 %, ligne 9 x 2,00 : `SommeDesArticles` 18,00 ; `Remise` 0,00 ; `ATPayer` 18,00. | `stories/US-2.md:7`, `.skraft/us-2/design/contracts.md:25-26,41` |
| 2 | `ConfigurerPaliers`, `PaliersConfigures`, `ChiffrerPanier`, `RemiseDeLigneCalculee`, `PanierChiffre` | `GrilleDePaliers` : seuil inclusif | 10 : 5 %, ligne 10 x 2,00 : `SommeDesArticles` 20,00 ; `Remise` 1,00 ; `ATPayer` 19,00. | `stories/US-2.md:8`, `.skraft/us-2/design/contracts.md:25-26,41` |
| 3 | `ConfigurerPaliers`, `PaliersConfigures`, `ChiffrerPanier`, `RemiseDeLigneCalculee`, `PanierChiffre` | `GrilleDePaliers` : maximum unique, pas de cumul | 10 : 5 % et 50 : 12 %, ligne 50 x 2,00 : `SommeDesArticles` 100,00 ; `Remise` 12,00 ; `ATPayer` 88,00. | `stories/US-2.md:9`, `.skraft/us-2/design/contracts.md:25,30,41` |
| 4 | `ChiffrerPanier`, `RemiseDeLigneCalculee`, `PanierChiffre` | `Panier` : évaluation de chaque ligne séparément | 10 : 5 %, deux références de 6 x 2,00 : `SommeDesArticles` 24,00 ; `Remise` 0,00 ; `ATPayer` 24,00. | `stories/US-2.md:10`, `.skraft/us-2/design/contracts.md:26,41` |
| 5 | `ChiffrerPanier`, `RemiseDeLigneCalculee`, `PanierChiffre` | `GrilleDePaliers` vide ; appel historique conservé | Ligne 10 x 2,00 : sans grille dans l'appel historique et avec grille explicitement vide, `Remise` 0,00 et `ATPayer` 20,00. | `stories/US-2.md:11`, `.skraft/us-2/design/event-model.md:43`, `.skraft/us-2/design/contracts.md:38-41` |

Les montants à payer de ces cas sont déduits de la formule cible, avec frais de port à zéro ; les scénarios de saisie de la grille correspondent aux slices du modèle. Sources : `.skraft/us-2/design/contracts.md:41`, `.skraft/us-2/design/event-model.md:38-44`.

## Invariants et non-régressions

| Obligation | Vérification à réaliser | Sources |
| --- | --- | --- |
| Configuration valide uniquement | Rejet des seuils 0 et négatifs, du seuil porté par `Quantite` par défaut, des taux 0, négatifs et > 100, et des doublons ; 100 % accepté ; ensemble vide accepté. | `.skraft/us-2/research/clarification.md:15`, `src/Tarification.Domaine/Quantite.cs:4-11`, `.skraft/us-2/design/contracts.md:15-19` |
| Rejet observable | Exceptions de construction, sans grille partielle ni conversion en remise nulle ; correspondance avec `ConfigurationDePaliersRejetee`. | `.skraft/us-2/design/event-model.md:21`, `.skraft/us-2/design/contracts.md:19` |
| Configuration immuable | Modifier la collection d'origine après construction ne modifie pas le résultat ; utiliser deux grilles dans deux appels ne partage pas d'état de configuration. | `.skraft/us-2/design/domain-model.md:15,26`, `.skraft/us-2/design/contracts.md:7,17` |
| Meilleur avantage | Avec 10 : 12 % et 50 : 5 %, une ligne 50 x 2,00 donne 12,00 de remise dans les deux ordres de configuration ; vérifier aussi des taux égaux sans cumul. | `stories/US-2.md:9`, `.skraft/us-2/design/contracts.md:25,30` |
| Assiette par ligne | Deux lignes de 6 articles restent indépendantes, même avec la même référence ; aucune fusion ajoutée. | `stories/US-2.md:10`, `src/Tarification.Domaine/Panier.cs:10-16`, `.skraft/us-2/design/contracts.md:26` |
| Facture cohérente | Taux 100 % : remise égale à la somme brute et montant à payer zéro ; prix zéro : remise zéro ; soustraction négative isolée rejetée. | `.skraft/us-2/research/clarification.md:15`, `src/Tarification.Domaine/Montant.cs:13-16`, `.skraft/us-2/design/contracts.md:28,41-43` |
| Entrées explicites | Entrée nulle refusée, non assimilée à une grille vide ; panier et grille inchangés après chiffrage. | `.skraft/us-2/design/contracts.md:39` |
| Panier vide et somme brute | Panier vide avec grille non vide : tous les montants zéro ; préserver les résultats bruts 13,50 et 15,90 ainsi que les validations existantes. | `tests/Tarification.Tests/CalculDuPanierTests.cs:15-46`, `.skraft/us-2/design/contracts.md:26,41` |
| Pas d'arrondi intermédiaire | Sur 33,33 avec 5 %, le calcul US-2 conserve 1,6665 ; ne pas introduire ici l'arrondi de restitution de l'US-5. | `.skraft/us-2/design/contracts.md:27,32`, `stories/US-5.md:8-13` |

## Cohérence de l'architecture et de la mesure

| Sujet | Raccord retenu | Sources |
| --- | --- | --- |
| Frontières | Règles dans le domaine, orchestration dans l'application ; l'ADR accepté reste applicable sans amendement. | `docs/adr/adr-001-decoupage-domaine-application.md:15-21`, `.skraft/us-2/design/contracts.md:9` |
| Configuration | `GrilleDePaliers` est un objet-valeur composite immuable ; aucune persistance, identité ou nouvelle frontière d'agrégat n'est ajoutée. | `.skraft/us-2/design/domain-model.md:15,26,50`, `.skraft/us-2/design/contracts.md:7` |
| Événements | Faits du modèle, raccordés au calcul et aux exceptions ; retour direct de `Facture`, sans protocole de publication imposé. | `.skraft/us-2/design/event-model.md:5,19-35`, `.skraft/us-2/design/contracts.md:47` |
| Mesure | Prévoir les nouveaux scénarios d'acceptation dans des fichiers `*AcceptanceTests.cs` et les invariants dans les tests unitaires ; conserver les tests existants. | `.agent-studio/stack.yaml:28-31`, `tests/Tarification.Tests/CalculDuPanierTests.cs:15-46` |
| Contradiction documentaire résolue | Retenir le projet de tests confirmé par l'utilisateur ; ne pas modifier l'ADR accepté. | `.skraft/us-2/research/clarification.md:17-23`, `tests/Tarification.Tests/Tarification.Tests.csproj:11` |
