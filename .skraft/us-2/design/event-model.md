# Event Model — US-2 : remise par palier de quantité

Source des critères : `stories/US-2.md:7-11`. Portée des paliers (communs à toutes les références,
calcul indépendant par ligne) : `.skraft/us-2/research/research.md:9-11`.

## Constat

Les cinq critères ne font que **lire** : ils chiffrent un panier sans rien enregistrer. Le projet n'a
ni stockage ni interface (`docs/adr/adr-001-decoupage-domaine-application.md:40-41`) et le cas d'usage
existant ne retourne qu'une valeur (`src/Tarification.Application/CalculDuPanier.cs:21`). Il n'y a donc
aucune commande et aucun événement de domaine : chaque déclencheur est une **requête**.

## Tranches verticales

Requête `ChiffrerLePanier` → vue `Facture`

| Critère | Déclencheur | Événement | Vue lue |
|---|---|---|---|
| ac-1 | Requête `ChiffrerLePanier` (barème 10 → 5 %, une ligne de 9 × 2,00 €) | aucun (lecture) | `Facture` : `Remise` = 0,00 € |
| ac-2 | Requête `ChiffrerLePanier` (barème 10 → 5 %, une ligne de 10 × 2,00 €) | aucun (lecture) | `Facture` : `Remise` = 1,00 € |
| ac-3 | Requête `ChiffrerLePanier` (barème 10 → 5 % et 50 → 12 %, une ligne de 50 × 2,00 €) | aucun (lecture) | `Facture` : `Remise` = 12,00 €, un seul palier, le plus avantageux |
| ac-4 | Requête `ChiffrerLePanier` (barème 10 → 5 %, deux lignes de 6 articles de références différentes) | aucun (lecture) | `Facture` : `Remise` nulle, aucune ligne n'atteint 10 |
| ac-5 | Requête `ChiffrerLePanier` (barème vide) | aucun (lecture) | `Facture` : `Remise` = 0,00 € |

(`stories/US-2.md:7-11`.) La story ne donne pas de prix pour ac-4 : seule une remise nulle est affirmée.

## Vue `Facture`

- Existante : `SommeDesArticles`, `Remise`, `FraisDePort`, `ATPayer` (`src/Tarification.Application/CalculDuPanier.cs:10-13`).
- Alimentée par US-2 : `Remise`, aujourd'hui toujours `Montant.Zero` (`src/Tarification.Application/CalculDuPanier.cs:21`).
- `SommeDesArticles` reste la somme des sous-totaux **bruts** (`src/Tarification.Domaine/LigneDePanier.cs:6` ; `src/Tarification.Domaine/Panier.cs:16`).

## Règle de la requête (par ligne)

1. Pour chaque ligne, retenir les paliers dont le seuil est ≤ quantité de la ligne : 9 exclu, 10 inclus (`stories/US-2.md:7-8`).
2. Parmi eux, appliquer **un seul** palier, celui qui donne la remise la plus forte (`stories/US-2.md:9`).
3. Aucun palier atteint ou configuré : remise nulle (`stories/US-2.md:7,11`).
4. `Remise` de la facture = somme des remises de chaque ligne ; aucun regroupement de lignes (`stories/US-2.md:10` ; `src/Tarification.Domaine/Panier.cs:10-14`).

## Entrées de la requête

- Le panier : des `LigneDePanier`, chacune avec sa `Reference`, sa `Quantite` et son `PrixUnitaire` (`src/Tarification.Domaine/LigneDePanier.cs:4`). `Reference` n'entre pas dans le calcul : la remise se calcule par ligne, sans regroupement par référence (`stories/US-2.md:10`).
- Le barème `BaremeDeRemise` : des `PalierDeRemise`, chacun avec un `Seuil` (quantité, inclus) et un `Taux` (`TauxDeRemise`), les mêmes pour toutes les références (`.skraft/us-2/research/research.md:9-11`).
- Une valeur hors domaine (taux hors 0–100, seuil inférieur à 1) est rejetée par `ArgumentOutOfRangeException`, comme les fabriques existantes (`src/Tarification.Domaine/Montant.cs:13-14` ; `src/Tarification.Domaine/Quantite.cs:10-12`).

## Clarifications reçues pendant DESIGN

- **`ATPayer`** : déduit `Remise` dès US-2 ; la formule devient `SommeDesArticles - Remise + FraisDePort` (`.skraft/us-2/design/clarifications.md:5-7`).
- **Taux et doublons** : taux entre 0 % et 100 % inclus ; les seuils en double sont autorisés, avec sélection de la remise maximale (`.skraft/us-2/design/clarifications.md:5-7`). Les seuils réutilisent la garde existante d'au moins 1 (`src/Tarification.Domaine/Quantite.cs:10-12`).
- **Arrondi** : aucun arrondi intermédiaire ajouté ; la politique des montants rendus au client relève d'US-5 (`stories/US-5.md:7-9`).
