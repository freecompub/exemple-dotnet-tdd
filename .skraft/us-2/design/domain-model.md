# Modèle de domaine — US-2

## Réutilisation

| Élément | Classement | Raison |
|---|---|---|
| `Quantite` (`src/Tarification.Domaine/Quantite.cs:4-12`) | Réutiliser tel quel | Sert de seuil de palier ; garde « au moins 1 » déjà présente. |
| `LigneDePanier` (`src/Tarification.Domaine/LigneDePanier.cs:4-6`) | Réutiliser tel quel | Fournit `Quantite` et `SousTotal` brut, assiette de la remise ; son sous-total n'est pas modifié. |
| `Facture` (`src/Tarification.Application/CalculDuPanier.cs:10-13`) | Étendre | Le champ `Remise` existe déjà ; `ATPayer` doit désormais le déduire (`.skraft/us-2/design/clarifications.md:5-7`). |
| `Montant` (`src/Tarification.Domaine/Montant.cs:7-25`) | Étendre | Manque l'application d'un taux décimal (`Multiplie` n'accepte qu'un entier, `:20-21`) et la soustraction nécessaire au nouveau calcul d'`ATPayer` (`.skraft/us-2/design/clarifications.md:5-7`). |
| `Panier` (`src/Tarification.Domaine/Panier.cs:5-16`) | Étendre | Obtient la somme des remises de ses lignes, évaluées une à une, à côté de `SommeDesLignes`. |
| `CalculDuPanier` (`src/Tarification.Application/CalculDuPanier.cs:19-22`) | Étendre | Reçoit le barème et alimente `Remise`. Sans barème, remise nulle ; `new CalculDuPanier().Chiffrer(panier)` des tests existants (`tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`) doit continuer à compiler. |
| `CalculDuPanierTests` (`tests/Tarification.Tests/CalculDuPanierTests.cs:12-50`) | Étendre | Y ajouter les tests des 5 critères avec le vrai domaine ; aucune doublure en usage. |
| `BaremeDeRemise`, `PalierDeRemise`, `TauxDeRemise` | **Créer** | N'existent pas ; la recherche recommande un barème explicite évalué par ligne (approche B, `.skraft/us-2/research/research.md`, « Recommandation »). |

## Agrégats

- Agrégat `Panier` : racine existante, contient des `LigneDePanier` (`src/Tarification.Domaine/Panier.cs:6-14`). Invariant touché par US-2 : la remise se calcule ligne par ligne, jamais sur l'ensemble (`stories/US-2.md:10`). Il ne référence aucun autre agrégat. Frontière justifiée par `docs/adr/adr-003-frontiere-du-panier.md`.
- Aucun nouvel agrégat : le barème est une valeur de configuration sans identité ni cycle de vie ; la recherche déconseille un agrégat pour une simple liste consultée (`.skraft/us-2/research/research.md`, approche B, limites).

## Objets-valeurs

Même style que l'existant : `readonly record struct`, constructeur privé, fabrique `De` (`src/Tarification.Domaine/Montant.cs:7-14`).

- objet-valeur `BaremeDeRemise` : ensemble de `PalierDeRemise`, commun à toutes les références. Remise d'une `LigneDePanier` : zéro si aucun palier atteint, sinon la plus forte parmi les paliers dont le seuil ≤ quantité, un seul appliqué (`stories/US-2.md:7-9`). Barème vide admis (`stories/US-2.md:11`). Seuils en double autorisés, sans cumul (`.skraft/us-2/design/clarifications.md:5-7`).
- objet-valeur `PalierDeRemise` : un `Seuil` (`Quantite`, inclus) et un `Taux` (`TauxDeRemise`) (`stories/US-2.md:7-9`).
- objet-valeur `TauxDeRemise` : pourcentage décimal compris entre 0 et 100 inclus, selon la clarification utilisateur (`.skraft/us-2/design/clarifications.md:5-7`). Hors bornes : `ArgumentOutOfRangeException`, comme `Quantite` et `Montant` (`src/Tarification.Domaine/Quantite.cs:10-12` ; `src/Tarification.Domaine/Montant.cs:13-14`).
- `LigneDePanier` porte `Reference`, `Quantite` et `PrixUnitaire` (`src/Tarification.Domaine/LigneDePanier.cs:4`) ; `Reference` ne sert pas au calcul de la remise, qui reste par ligne (`stories/US-2.md:10`).
- objet-valeur `Quantite` : nombre entier d'au moins 1, réutilisé pour la quantité de ligne et le seuil (`src/Tarification.Domaine/Quantite.cs:4-12`).
- objet-valeur `Montant` étendu : « appliquer un taux » (20,00 € × 5 % = 1,00 € ; 100,00 € × 12 % = 12,00 €, `stories/US-2.md:8-9`) et soustraire la remise du total (`.skraft/us-2/design/clarifications.md:5-7`). Aucun arrondi intermédiaire ajouté (`stories/US-5.md:7-9`).

## Résultat du chiffrage

Vue `Facture` : conserve ses champs existants ; `ATPayer` devient `SommeDesArticles - Remise + FraisDePort`, conformément à la clarification (`src/Tarification.Application/CalculDuPanier.cs:10-12` ; `.skraft/us-2/design/clarifications.md:5-7`). Les règles de port ne sont pas modifiées : le cas d'usage le fournit actuellement à zéro (`src/Tarification.Application/CalculDuPanier.cs:21`).

## Champs et erreur de validation utilisés par les contrats

Ces noms désignent des champs ou une erreur technique, pas des agrégats, objets-valeurs, commandes ou événements supplémentaires.

| Nom | Définition et rattachement | Source |
|---|---|---|
| `Reference` | Champ de `LigneDePanier`, chaîne identifiant la référence de l'article ; aucun regroupement des quantités entre lignes pour calculer la remise. | `src/Tarification.Domaine/LigneDePanier.cs:4` ; `stories/US-2.md:10` |
| `PrixUnitaire` | Champ de `LigneDePanier`, de type objet-valeur `Montant` ; multiplié par la quantité pour obtenir le sous-total brut. | `src/Tarification.Domaine/LigneDePanier.cs:4-6` |
| `Seuil` | Champ proposé de l'objet-valeur `PalierDeRemise`, de type objet-valeur `Quantite` ; quantité minimale incluse pour rendre le palier éligible. | `stories/US-2.md:7-8` ; `src/Tarification.Domaine/Quantite.cs:10-12` |
| `Taux` | Champ proposé de l'objet-valeur `PalierDeRemise`, de type objet-valeur `TauxDeRemise` ; pourcentage appliqué au sous-total de la ligne éligible. | `stories/US-2.md:8-9` ; `.skraft/us-2/design/clarifications.md:5-7` |
| `Pourcentage` | Champ proposé de l'objet-valeur `TauxDeRemise`, décimal entre 0 et 100 inclus ; la valeur 5 représente 5 %. | `stories/US-2.md:8` ; `.skraft/us-2/design/clarifications.md:5-7` |
| `ArgumentOutOfRangeException` | Erreur technique de validation existante pour les valeurs hors domaine ; réutilisée pour les taux hors bornes et les seuils inférieurs à 1, sans introduire d'événement métier. | `src/Tarification.Domaine/Montant.cs:13-14` ; `src/Tarification.Domaine/Quantite.cs:10-12` ; `.skraft/us-2/design/clarifications.md:5-7` |

## Événements de domaine

Aucun : US-2 ne change aucun état (voir `event-model.md`).

## Interfaces de dépôt

Aucune : aucun agrégat n'est persisté et le projet n'a pas de stockage (`docs/adr/adr-001-decoupage-domaine-application.md:40-41`). Le barème est passé au cas d'usage, conformément à « il faut la lui passer » (`docs/adr/adr-001-decoupage-domaine-application.md:28-30`) ; les signatures proposées figurent dans `.skraft/us-2/design/contracts.md:5-14`.

## ADR existants à reconsidérer

- `docs/adr/adr-001-decoupage-domaine-application.md` (Accepted) : l'inventaire des types du domaine (`:17-18`) ne mentionne pas les nouveaux objets-valeurs, et la règle de passage de ce qui vient de l'extérieur (`:28-30`) gouverne la fourniture du barème. Aucune contradiction attendue : le barème reste dans le domaine, sans dépendance.
- `docs/adr/adr-002-format-de-rapport-de-tests.md` : non concerné par US-2.
