# US-2 — Event model

Sources de base : `stories/US-2.md:3-11`, `.skraft/us-2/research/research.md` (« Découvertes »), `.skraft/us-2/research/clarification.md:7` (paliers communs à toutes les références).

Précision : le projet n'a ni stockage ni interface (`docs/adr/adr-001-decoupage-domaine-application.md:40-41`). Les événements ci-dessous sont des faits de domaine produits par le calcul ; ce document ne dit pas s'ils sont persistés ou publiés — c'est une décision d'architecture, étape suivante.

## Commandes

| Commande | Intention | Données | Rejet possible | Source |
| --- | --- | --- | --- | --- |
| `ConfigurerPaliers` | Définir la grille de paliers commune à toutes les références | liste de (seuil de quantité, taux) ; liste vide admise | oui, voir `ConfigurationDePaliersRejetee` | `stories/US-2.md:7-11`, `.skraft/us-2/research/clarification.md:7` |
| `ChiffrerPanier` | Chiffrer un panier avec la grille courante | `Panier` (lignes : référence, quantité, prix unitaire) | invariants existants de `Quantite` et `Montant` (voir `Quantite.cs:10-11`, `Montant.cs:13-14`) | `src/Tarification.Application/CalculDuPanier.cs:19-21`, `src/Tarification.Domaine/LigneDePanier.cs:4-6` |

`ChiffrerPanier` est le cas d'usage existant `CalculDuPanier.Chiffrer` (`src/Tarification.Application/CalculDuPanier.cs:19-21`), point d'entrée piloté par les tests (`CalculDuPanier.cs:14-17`).

## Événements

| Événement | Raised par | Contenu minimal | Source |
| --- | --- | --- | --- |
| `PaliersConfigures` | `ConfigurerPaliers` accepté | les paliers (éventuellement aucun) | `stories/US-2.md:11` |
| `ConfigurationDePaliersRejetee` | `ConfigurerPaliers` refusé | motif : seuil < 1 ; taux hors ]0 %, 100 %] ; seuil dupliqué | réponse utilisateur (invariants de la configuration) ; `src/Tarification.Domaine/Quantite.cs:10-11` pour le seuil |
| `RemiseDeLigneCalculee` | `ChiffrerPanier`, une par ligne | référence, palier retenu (ou aucun), montant de remise | `stories/US-2.md:7-10` |
| `PanierChiffre` | `ChiffrerPanier` | somme des articles, remise totale (somme des remises de lignes), frais de port | `src/Tarification.Application/CalculDuPanier.cs:9-12` |

Un panier chiffré sans palier produit `RemiseDeLigneCalculee` avec remise 0,00 € (critère 5, `stories/US-2.md:11`).

## Rejets et exceptions

`ConfigurationDePaliersRejetee` se matérialise par une exception levée à la construction, jamais par une grille vide ou une remise nulle :

| Cause | Exception | Source |
| --- | --- | --- |
| seuil < 1 ; taux hors ]0 %, 100 % | `ArgumentOutOfRangeException` (même convention que les validations existantes) | `src/Tarification.Domaine/Quantite.cs:10-11`, `src/Tarification.Domaine/Montant.cs:13-14`, réponse utilisateur |
| deux paliers de même seuil | `ArgumentException` | réponse utilisateur (seuils dupliqués rejetés) |
| panier ou grille nuls passés à `ChiffrerPanier` | `ArgumentNullException` : une entrée nulle n'est pas assimilée à « aucun palier » | `src/Tarification.Application/CalculDuPanier.cs:19-21` |

## Vues (read models)

| Vue | Contenu | Source |
| --- | --- | --- |
| `Facture` | `SommeDesArticles`, `Remise`, `FraisDePort`, `ATPayer` | `src/Tarification.Application/CalculDuPanier.cs:9-12` |
| `GrilleDePaliers` | paliers courants, communs à toutes les références | `.skraft/us-2/research/clarification.md:7` |

Point d'attention : aujourd'hui `Facture.ATPayer` n'intègre pas `Remise` (`CalculDuPanier.cs:11`) et `Chiffrer` fixe `Remise` à zéro (`CalculDuPanier.cs:21`). La story dit que la remise « s'applique » (`stories/US-2.md:3-4`) ; le raccord de `ATPayer` à la remise est à traiter par les étapes suivantes (signalé dans `research.md`, « Découvertes » 5). Aucune règle sur l'ordre avec les frais de port ou promotions n'est posée ici (`stories/US-3.md:12-14`, `stories/US-4.md:10`).

## Slices

| Slice | Commande → Événements → Vue | Critères Gherkin couverts |
| --- | --- | --- |
| S1 — Remise de palier sur une ligne | `ConfigurerPaliers` → `PaliersConfigures` ; `ChiffrerPanier` → `RemiseDeLigneCalculee`, `PanierChiffre` → `Facture` | 1, 2 (`stories/US-2.md:7-8`) |
| S2 — Meilleur palier unique | idem avec deux paliers | 3 (`stories/US-2.md:9`) |
| S3 — Portée par ligne | `ChiffrerPanier` avec deux lignes de références différentes | 4 (`stories/US-2.md:10`) |
| S4 — Sans palier | `ChiffrerPanier` sans `ConfigurerPaliers` ou liste vide | 5 (`stories/US-2.md:11`) |
| S5 — Rejet de configuration | `ConfigurerPaliers` → `ConfigurationDePaliersRejetee` | invariants décidés par l'utilisateur ; hors critères US-2 |

## Scénarios (Given / When / Then)

| Cas | Given | When | Then |
| --- | --- | --- | --- |
| 1 | `PaliersConfigures` {10 : 5 %} | `ChiffrerPanier` ligne 9 × 2,00 € | remise 0,00 € |
| 2 | `PaliersConfigures` {10 : 5 %} | `ChiffrerPanier` ligne 10 × 2,00 € | remise 1,00 € (5 % de 20,00 €) |
| 3 | `PaliersConfigures` {10 : 5 %, 50 : 12 %} | `ChiffrerPanier` ligne 50 × 2,00 € | remise 12,00 € (12 % de 100,00 €), un seul palier |
| 4 | `PaliersConfigures` {10 : 5 %} | `ChiffrerPanier` deux lignes 6 × refs différentes | remise 0,00 € |
| 5 | aucun palier | `ChiffrerPanier` | remise 0,00 € |
| 6 | `ConfigurerPaliers` avec seuil 0, ou taux 0 % / > 100 %, ou deux seuils égaux | — | `ConfigurationDePaliersRejetee` |

## Questions non tranchées (non résolues ici)

- Deux lignes de même référence : pas de regroupement, calcul par ligne, cohérent avec `Panier.Ajoute` (`src/Tarification.Domaine/Panier.cs:10-14`) ; aucun exemple ne contredit (`research.md`, « Questions ouvertes »).
- Arrondi du montant de remise : US-5, ouverte (`stories/US-5.md:12-13`). Les critères US-2 n'en exigent pas (résultats exacts).
- Cumul avec code promotionnel : US-3 (`stories/US-3.md:12-14`).
