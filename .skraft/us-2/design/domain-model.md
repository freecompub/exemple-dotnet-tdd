# US-2 — Domain model

Sources : `.skraft/us-2/research/research.md`, `stories/US-2.md:3-11`, `.skraft/us-2/research/clarification.md:7`, code existant cité ci-dessous. Les noms sont en français comme dans le code (`src/Tarification.Domaine/Panier.cs:1-17`).

## Acquis de modélisation

- Les paliers sont communs à toutes les références (clarification). L'assiette du calcul est la ligne (`stories/US-2.md:10`).
- Un seul palier par ligne : celui qui donne la remise la plus élevée parmi les paliers atteints, sans supposer de croissance des taux avec les seuils (`stories/US-2.md:9` ; `research.md`, découverte 7 et approche D).
- Invariants de configuration : seuil ≥ 1 (même règle que `Quantite.De`, `src/Tarification.Domaine/Quantite.cs:10-11`) ; taux dans ]0 %, 100 %] ; deux paliers ne partagent pas le même seuil ; rejet explicite à la construction. Source : `.skraft/us-2/research/clarification.md:11-15`.
- Exceptions de rejet : `ArgumentOutOfRangeException` pour un seuil ou un taux hors intervalle (convention de `Quantite.cs:10-11` et `Montant.cs:13-14`), `ArgumentException` pour des seuils dupliqués, `ArgumentNullException` pour un panier ou une grille nuls au chiffrage (`src/Tarification.Application/CalculDuPanier.cs:19-21`). Voir `event-model.md`, section « Rejets et exceptions ».
- Liste vide valide : remise 0,00 € (`stories/US-2.md:11`).

## Agrégats

Aucun nouvel agrégat. `GrilleDePaliers` est un **objet-valeur composite immuable**, pas une racine d'agrégat : la configuration commune ne reçoit ni identité, ni cycle de vie, ni dépôt pour US-2. Elle valide la configuration à la construction et calcule la remise maximale de chaque ligne ; `Panier` cumule ces remises ; `CalculDuPanier` reçoit la grille en paramètre et construit `Facture`. Sources : `stories/US-2.md:7-11`, `.skraft/us-2/research/clarification.md:7,15`, `.skraft/us-2/design/contracts.md:7-9,15-19,25-26,38-41`, `docs/adr/adr-001-decoupage-domaine-application.md:15-21,28-30,40-43`.

### Agrégats existants

- `Panier` : collection de `LigneDePanier`, `Ajoute`, `SommeDesLignes` brute (`src/Tarification.Domaine/Panier.cs:6-16`). Pas de regroupement par référence. À étendre par un calcul de la remise totale = somme des remises de lignes, sans changer le sens de `SommeDesLignes` (`research.md`, passage de relais).
- `LigneDePanier` : record (`Reference`, `Quantite`, `PrixUnitaire`), `SousTotal` (`src/Tarification.Domaine/LigneDePanier.cs:4-6`). Rien n'est ajouté ; la sélection de palier reste dans `GrilleDePaliers` (approche A de `research.md`).

## Objets-valeurs

| Nom | Définition | Invariant | Source |
| --- | --- | --- | --- |
| `GrilleDePaliers` | ensemble immuable, éventuellement vide, de `PalierDeQuantite`, commun à toutes les références | seuils distincts, rejet à la construction ; `RemiseDe(LigneDePanier) → Montant` : parmi les paliers dont le seuil ≤ `Quantite.Valeur`, retient la remise maximale, `Montant.Zero` si aucun | `stories/US-2.md:7-11`, `.skraft/us-2/research/clarification.md:7,15` |
| `PalierDeQuantite` | (`Seuil`: `Quantite`, `Taux`: `TauxDeRemise`) | seuil ≥ 1 par réutilisation de `Quantite` | `Quantite.cs:10-11`, `stories/US-2.md:7` |
| `TauxDeRemise` | pourcentage décimal, valeur dans ]0, 100] (ex. 5, 12) | rejet hors intervalle | `.skraft/us-2/research/clarification.md:15` ; `docs/adr/adr-001-decoupage-domaine-application.md:32-33` (`decimal`, jamais `double`) |
| `Quantite` | existant | ≥ 1 | `src/Tarification.Domaine/Quantite.cs:10-11` |
| `Montant` | existant | ≥ 0 | `src/Tarification.Domaine/Montant.cs:13-14` |

Évolutions retenues de `Montant` : `Multiplie(TauxDeRemise)` et soustraction avec rejet du résultat négatif, en conservant `Multiplie(int)`. `Facture.ATPayer` soustrait la remise de la somme brute puis ajoute les frais de port ; le taux plafonné à 100 % garantit une remise de ligne au plus égale au sous-total. Aucun arrondi au centime n'est ajouté pour US-2. Sources : `.skraft/us-2/design/contracts.md:27-28,32,41-43`, `src/Tarification.Domaine/Montant.cs:13-24`, `.skraft/us-2/research/clarification.md:15`, `stories/US-5.md:6-13`.

Calcul de référence : remise = `SousTotal` × `Taux` / 100. Vérification : 10 × 2,00 € = 20,00 € × 5 % = 1,00 € ; 50 × 2,00 € = 100,00 € × 12 % = 12,00 € (`stories/US-2.md:8-9`).

## Événements de domaine

`PaliersConfigures`, `ConfigurationDePaliersRejetee`, `RemiseDeLigneCalculee`, `PanierChiffre` : charges utiles dans `event-model.md`.

## Services de domaine

Aucun nécessaire : la sélection du palier vit dans `GrilleDePaliers`, le cumul sur le panier dans `Panier` (règle simple, pas de logique multi-agrégats).

## Cas d'usage (couche application)

`CalculDuPanier.Chiffrer(Panier, GrilleDePaliers)` : la grille est passée en paramètre de méthode ; renseigne `Facture.Remise` avec la somme des remises de lignes (`src/Tarification.Application/CalculDuPanier.cs:19-21`). La surcharge existante `Chiffrer(Panier)` est conservée et équivaut à une grille vide → remise 0,00 €, somme des articles et panier vide inchangés (`tests/Tarification.Tests/CalculDuPanierTests.cs:15-46`). Le détail des signatures est dans `contracts.md`.

## Interfaces de dépôt

Aucune pour US-2 : la configuration est passée explicitement au chiffrage, sans chargement depuis un stockage. Sources : `.skraft/us-2/design/contracts.md:7,38-39`, `docs/adr/adr-001-decoupage-domaine-application.md:40-43`, `stories/US-2.md:3-11`.

## ADR existants applicables

| ADR | Pourquoi | Source |
| --- | --- | --- |
| ADR-001 — Découpage domaine / application | Applicable sans amendement : la grille, les paliers et les taux portent la règle dans le domaine ; le chiffrage reste dans l'application, avec configuration explicite et calculs en `decimal`. Aucun nouvel ADR ne redéclare ces frontières. | `docs/adr/adr-001-decoupage-domaine-application.md:8-21,28-33`, `.skraft/us-2/design/contracts.md:7-9` |
| ADR-002 — Format de rapport de tests | Rapport JUnit conservé. La coquille sur le projet de tests est confirmée par l'utilisateur : retenir le projet actuel sans modifier l'ADR accepté. | `docs/adr/adr-002-format-de-rapport-de-tests.md:17-18`, `.skraft/us-2/research/clarification.md:17-23` |

## Décisions de modélisation closes

1. Transmission de la grille : paramètre de `Chiffrer(Panier, GrilleDePaliers)` ; `Chiffrer(Panier)` conservée = grille vide. Sources : `.skraft/us-2/design/contracts.md:38-39`, `src/Tarification.Application/CalculDuPanier.cs:19-21`.
2. `Facture.ATPayer` = `SommeDesArticles − Remise + FraisDePort` : la remise s'applique effectivement. Sources : `.skraft/us-2/design/contracts.md:41`, `stories/US-2.md:3-4`.
3. `Montant` gagne `Multiplie(TauxDeRemise)` et une soustraction qui rejette un résultat négatif. Sources : `.skraft/us-2/design/contracts.md:27-28`, `src/Tarification.Domaine/Montant.cs:13-24`.
4. Taux : `decimal` en pourcentage (5 = 5 %), sans arrondi au centime dans US-2. Sources : `.skraft/us-2/design/contracts.md:15,32`, `stories/US-5.md:6-13`.
5. Tests d'acceptation : fichiers `tests/Tarification.Tests/*AcceptanceTests.cs` ; conserver les tests US-1 existants. Sources : `.agent-studio/stack.yaml:28-31`, `.skraft/us-2/design/consistency-matrix.md:38`, `tests/Tarification.Tests/CalculDuPanierTests.cs:10-46`.
