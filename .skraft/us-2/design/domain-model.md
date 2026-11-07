# Domain Model — US-2 : Remise par palier de quantité

Contexte : `Tarification` (Core, voir `context-map.md`). Couches : `Tarification.Domaine` ne dépend
de rien, `Tarification.Application` dépend du domaine seul
(`docs/adr/adr-001-decoupage-domaine-application.md:15-21`) ; les règles commerciales vivent dans le
domaine (`:25-26`).

## Réutilisation

Point de départ : l'existant relevé par la recherche (`.skraft/us-2/research/research.md:104-110`).

| Élément | Fichier | Classement | Raison |
|---|---|---|---|
| `Panier` | `src/Tarification.Domaine/Panier.cs` | **Étendre** | Agrégat existant ; reçoit `SommeDesRemises(GrilleDePaliers)`, sur le patron de `SommeDesLignes` (`Panier.cs:16`). `Ajoute` et `Lignes` inchangés (`:8-14`). |
| `LigneDePanier` | `src/Tarification.Domaine/LigneDePanier.cs` | **Réutiliser tel quel** | Porte déjà `Reference`, `Quantite`, `PrixUnitaire` et `SousTotal` = `PrixUnitaire` × `Quantite` (`LigneDePanier.cs:4-6`), base de la remise par ligne. |
| `Montant` | `src/Tarification.Domaine/Montant.cs` | **Étendre** | N'a que `+`, `Multiplie(int)`, `CompareTo` (`Montant.cs:18-23`) : il manque l'opération « appliquer un pourcentage » (`research.md:55`). |
| `Quantite` | `src/Tarification.Domaine/Quantite.cs` | **Réutiliser tel quel** | Sert de seuil de palier ; `Valeur` est un `int` ≥ 1 comparable directement (`Quantite.cs:6,10-11`, `research.md:57`). |
| `CalculDuPanier` | `src/Tarification.Application/CalculDuPanier.cs` | **Étendre** | Doit recevoir la `GrilleDePaliers` et renseigner `Remise` au lieu de `Montant.Zero` (`CalculDuPanier.cs:21`). `new CalculDuPanier()` sans argument doit continuer de marcher, avec grille vide (`tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`, `research.md:95`). |
| `Facture` | `src/Tarification.Application/CalculDuPanier.cs` | **Réutiliser tel quel** | `Facture(SommeDesArticles, Remise, FraisDePort)` : le champ `Remise` existe déjà (`CalculDuPanier.cs:10`) ; `SommeDesArticles` et `FraisDePort` restent alimentés comme aujourd'hui (`CalculDuPanier.cs:21`). `ATPayer` (`:12`) n'est pas modifié : aucun critère US-2 ne porte sur le total (`research.md:52`). |
| `Pourcentage` | — | **Créer** | Aucun type « pourcentage » dans `src/` (`research.md:34`). |
| `PalierDeQuantite` | — | **Créer** | Aucun type « palier » dans `src/` (`research.md:34`). |
| `GrilleDePaliers` | — | **Créer** | Idem ; grille unique commune à toutes les références (`.skraft/us-2/passation.md:9`). |

## Agrégats

### `Panier` (existant, étendu)

- Racine : `Panier` (`src/Tarification.Domaine/Panier.cs:4`), `sealed class` à API fluide `Ajoute`.
- Contenu : une liste de `LigneDePanier` (`Panier.cs:6-8`).
- Références externes : aucune. La `GrilleDePaliers` n'est pas tenue par le panier : elle lui est
  passée en paramètre au moment du calcul (`docs/adr/adr-001-decoupage-domaine-application.md:28-30`).
- Invariants :
  - un panier peut être vide, son total vaut zéro (`Panier.cs:3`) ;
  - chaque ligne a une quantité ≥ 1 et un prix non négatif (`Quantite.cs:10-11`, `Montant.cs:13-14`) ;
  - **nouveau** : la remise du panier est la somme des remises calculées **ligne par ligne**, chaque
    ligne indépendamment des autres ; les quantités de lignes différentes ne s'additionnent jamais
    (`stories/US-2.md:10`, ac-4).
- Comportements :
  - `Ajoute(LigneDePanier)` → événement `LigneAjoutee` (existant, `Panier.cs:10-14`) ;
  - `SommeDesLignes()` (existant, `Panier.cs:16`) ;
  - `SommeDesRemises(GrilleDePaliers)` → `Montant` (**nouveau**) : somme de
    `GrilleDePaliers.RemisePour(ligne)` sur `Lignes`.

`Panier` est le seul agrégat de US-2.

## Objets-valeurs

### `Pourcentage` (nouveau)
- `readonly record struct`, constructeur privé, fabrique `Pourcentage.De(decimal)` qui lève
  `ArgumentOutOfRangeException` si la valeur est invalide — patron de `Montant.cs:7-14` et `Quantite.cs:4-11`.
- Invariant : jamais négatif. Raison : une remise négative serait un montant négatif, qui n'existe pas
  dans ce domaine (`Montant.cs:4-5,13-14`).
- Valeur en `decimal` (`docs/adr/adr-001-decoupage-domaine-application.md:32-34`).

### `PalierDeQuantite` (nouveau)
- `sealed record PalierDeQuantite(Quantite Seuil, Pourcentage Taux)` — patron des valeurs composites
  (`LigneDePanier.cs:4`).
- Règle : un palier est **atteint** par une ligne dont `Quantite.Valeur` ≥ `Seuil.Valeur`
  (« 10 articles ou plus », `stories/US-2.md:7-8`).

### `GrilleDePaliers` (nouveau)
- Valeur composite immuable : une collection de `PalierDeQuantite`, **vide autorisée** (ac-5,
  `stories/US-2.md:11`). Une seule grille pour toutes les références (`.skraft/us-2/passation.md:9`).
- `GrilleDePaliers.Vide` : grille sans palier, valeur par défaut du cas d'usage.
- `RemisePour(LigneDePanier)` → `Montant` :
  - parmi les paliers atteints par la ligne, retient **un seul** palier, celui au `Taux` le plus élevé
    (le plus avantageux, `stories/US-2.md:9`) ;
  - remise = `LigneDePanier.SousTotal` × `Taux` ;
  - aucun palier atteint, ou grille vide → `Montant.Zero` (ac-1, ac-5).
- Cas non précisés, tranchés par l'option la plus simple qui respecte les critères
  (`.skraft/us-2/passation.md:7`) : deux paliers de même seuil, ou un palier plus haut au taux plus
  faible, ne sont pas refusés à la construction ; la règle « taux le plus élevé parmi les paliers atteints »
  donne directement le plus avantageux.

### `Montant` (existant, étendu)
- Nouvelle opération : `Applique(Pourcentage)` → `Montant` = `Euros × Taux / 100`, en `decimal`.
- **Pas d'arrondi** : option la plus simple (`.skraft/us-2/passation.md:6`) ; les critères chiffrés
  tombent juste (1,00 € et 12,00 €, `research.md:58`).

### Existants réutilisés tels quels
- `Quantite` (`src/Tarification.Domaine/Quantite.cs:4-14`), `LigneDePanier` (`src/Tarification.Domaine/LigneDePanier.cs:4-7`).

## Événements du domaine

| Événement | Levé par | Données | Remarque |
|---|---|---|---|
| `LigneAjoutee` | `Panier` (via `Ajoute`) | `Reference`, `Quantite`, `PrixUnitaire` | Événement de modèle : aucun mécanisme d'événement dans le code (`Panier.cs:10-14`), US-2 n'en demande pas. |

`ChiffrerPanier` est une requête (voir `event-model.md`) : elle ne produit pas d'événement.

## Interfaces de dépôt

**Aucune pour US-2.** Aucun critère ne charge ni ne conserve un panier (`stories/US-2.md:7-11`). Le
cas d'usage reçoit le `Panier` en paramètre (`src/Tarification.Application/CalculDuPanier.cs:21`). Le
projet n'a pas de stockage, et cette couche sera ajoutée quand un besoin réel la réclamera
(`docs/adr/adr-001-decoupage-domaine-application.md:40-42`). Déclarer un dépôt maintenant serait un
patron sans critère qui le justifie. `GrilleDePaliers` est un objet-valeur de configuration passé en
paramètre (`docs/adr/adr-001-decoupage-domaine-application.md:28-30`) : elle n'a pas de dépôt non plus.

## Cas d'usage (couche application)

- `CalculDuPanier` (étendu) : reçoit une `GrilleDePaliers` (vide par défaut) et produit
  `Facture(panier.SommeDesLignes(), panier.SommeDesRemises(grille), Montant.Zero)`, soit
  `SommeDesArticles` = `SommeDesLignes()`, `Remise` = `SommeDesRemises(grille)`, `FraisDePort` = `Montant.Zero`
  (`FraisDePort` hors US-2, inchangé par rapport à `src/Tarification.Application/CalculDuPanier.cs:21`).
- Le mode d'injection (constructeur ou paramètre de `Chiffrer`) est une décision d'architecture,
  laissée à l'étape suivante (`research.md:95`).

## ADR existants à reconsidérer

Voir `adr-a-reconsiderer.md`.
