# Modèle de domaine — US-2 Remise par palier de quantité

Contexte : `Tarification` (Core, voir `context-map.md`). Approche A de la recherche
(`.skraft/us-2/research/research.md:61-66,83`).

## Réutilisation

| Élément | Source | Classement | Raison |
|---|---|---|---|
| `Montant` | `src/Tarification.Domaine/Montant.cs:7-26` | Réutiliser tel quel | Le calcul de la remise passe par `Montant.De(decimal)` (`:13-14`) et la somme par `+` (`:18`) ; aucune opération nouvelle n'est requise sur `Montant` si `Pourcentage` porte l'application du taux (voir plus bas). Remise jamais négative, cohérent avec `:13-14`. |
| `Quantite` | `src/Tarification.Domaine/Quantite.cs:4-14` | Réutiliser tel quel | Sert de seuil d'un palier : un seuil vaut au moins 1, même invariant (`:10-11`). Comparaison via `Valeur` (`:6`). |
| `LigneDePanier` | `src/Tarification.Domaine/LigneDePanier.cs:4-7` | Réutiliser tel quel | Fournit `Quantite` et `SousTotal` (`:4,6`) : c'est l'assiette de la remise par ligne. |
| `Panier` | `src/Tarification.Domaine/Panier.cs:4-17` | Réutiliser tel quel | `Lignes` (`:8`) expose chaque ligne séparément : le calcul par ligne (ac-4) s'appuie dessus. `Ajoute` n'agrège pas deux lignes de même référence (`:10-14`). |
| `Facture` | `src/Tarification.Application/CalculDuPanier.cs:10-13` | Réutiliser tel quel | Le champ `Remise` existe déjà (`:10`). `ATPayer` inchangé (`:12`, voir `event-model.md`). |
| `CalculDuPanier` | `src/Tarification.Application/CalculDuPanier.cs:19-22` | Étendre | Reçoit une `GrilleDeRemise` à la construction (`adr-001:28-30`) ; garde un constructeur sans argument équivalant à une grille vide, utilisé par les tests existants (`tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`) ; `Chiffrer` remplit `Remise` au lieu de `Montant.Zero` (`CalculDuPanier.cs:21`). |
| `CalculDuPanierTests` | `tests/Tarification.Tests/CalculDuPanierTests.cs:11-50` | Réutiliser tel quel (ne pas y ajouter US-2) | Ses tags `// @ac-1..3` appartiennent à US-1 (`:8,16,24,32`) ; les critères US-2 relèvent du motif d'acceptance `tests/**/*AcceptanceTests.cs` (`.agent-studio/stack.yaml:29`). Le helper `Ligne` (`:13-14`) est un modèle à reprendre. |
| `Pourcentage` | — | Créer | Aucun type de taux n'existe (`research.md:32`). |
| `PalierDeQuantite` | — | Créer | Idem (`research.md:32`). |
| `GrilleDeRemise` | — | Créer | Idem (`research.md:32`). |

## Agrégats

### Agrégat `Panier` (existant, inchangé)

- Agrégat `Panier` : racine `Panier` (`Panier.cs:4`) ; entité interne `LigneDePanier` (`Panier.cs:6`).
- Invariants existants : quantité ≥ 1 par ligne (`Quantite.cs:10-11`), prix ≥ 0 (`Montant.cs:13-14`).
- US-2 n'ajoute aucun invariant à l'Agrégat `Panier` : la remise est une règle de tarification, pas
  une propriété du contenu (approche B écartée, `research.md:68-72`).
- Membres lus par US-2 : `Lignes` (`Panier.cs:8`), `Ajoute` (`Panier.cs:10-14`), `SommeDesLignes` (`Panier.cs:16`).

### Entité `LigneDePanier` (existante, inchangée, interne à l'Agrégat `Panier`)

Entité `LigneDePanier` (`LigneDePanier.cs:4-7`), champs :

| Champ | Type | Source |
|---|---|---|
| `Reference` | `string` | `LigneDePanier.cs:4` |
| `Quantite` | `Quantite` | `LigneDePanier.cs:4` |
| `PrixUnitaire` | `Montant` | `LigneDePanier.cs:4` |
| `SousTotal` | `Montant` = `PrixUnitaire` × `Quantite` | `LigneDePanier.cs:6` |

`SousTotal` est l'assiette de la remise de la ligne.

### Objet-valeur `GrilleDeRemise`, pas un agrégat

La grille n'a pas d'identité ni de cycle de vie dans cette story : elle est construite une fois,
passée au cas d'usage (`adr-001:28-30`) et jamais modifiée ensuite. Deux grilles aux mêmes paliers
sont interchangeables. Elle est donc modélisée comme Objet-valeur `GrilleDeRemise` immuable, pas en agrégat.

## Objets-valeurs

### Objet-valeur `Montant` (existant, inchangé)

Objet-valeur `Montant` (`Montant.cs:7-26`) : `Euros` (`:9`), `De` (`:13-14`), `Zero` (`:16`), `+` (`:18`).

### Objet-valeur `Quantite` (existant, inchangé)

Objet-valeur `Quantite` (`Quantite.cs:4-14`) : `Valeur` (`:6`), `De` (`:10-11`).

### Objet-valeur `Pourcentage` (nouveau)

- Forme : `readonly record struct`, constructeur privé, fabrique `Pourcentage.De(decimal valeur)`
  (convention `Montant.cs:7-14`, `Quantite.cs:4-11`). `valeur` est exprimée en pour-cent, comme dans
  la story (« 5 % », `US-2.md:7`) : `Pourcentage.De(5m)`.
- Invariant : 0 ≤ valeur ≤ 100, sinon `ArgumentOutOfRangeException`. Borne basse : une remise
  négative produirait un `Montant` négatif, qui n'existe pas (`Montant.cs:4-5,13-14`). Borne haute :
  au-delà de 100 %, la remise dépasserait le sous-total de la ligne.
- Opération : `Montant Applique(Montant assiette)` → `Montant.De(assiette.Euros * valeur / 100m)`, en
  `decimal` (`adr-001:32-33`), **sans arrondi** (US-5, `stories/US-5.md:9`).
  Vérification : 20,00 × 5 / 100 = 1,00 (ac-2) ; 100,00 × 12 / 100 = 12,00 (ac-3).

### Objet-valeur `PalierDeQuantite` (nouveau)

- Forme : `readonly record struct PalierDeQuantite`, fabrique `PalierDeQuantite.De(Quantite seuil, Pourcentage taux)`.
- Champs : `Seuil` (`Quantite`), `Taux` (`Pourcentage`). Les invariants sont portés par les deux
  types-valeurs (seuil ≥ 1 par `Quantite.cs:10-11`).
- Opération : `bool EstAtteintPar(Quantite quantite)` → `quantite.Valeur >= Seuil.Valeur`
  (« 10 articles ou plus », `US-2.md:7` : 10 atteint, 9 non — ac-1, ac-2).

### Objet-valeur `GrilleDeRemise` (nouveau)

- Forme : `sealed class` immuable (ou `sealed record`), champ `Paliers` : liste en lecture seule de `PalierDeQuantite`.
  Fabriques : `GrilleDeRemise.De(params PalierDeQuantite[] paliers)` et `GrilleDeRemise.Vide`.
- Invariant : aucun au-delà de ceux des paliers. Grille vide admise (ac-5, `US-2.md:11`). Une grille
  « incohérente » (taux décroissant avec le seuil) ou à seuils répétés n'est pas refusée : option la
  plus simple, la règle du taux maximal la traite sans ambiguïté (`research.md:53,99`).
- Règle par ligne : `Montant RemisePour(LigneDePanier ligne)`
  1. retenir les paliers `EstAtteintPar(ligne.Quantite)` ;
  2. aucun → `Montant.Zero` (ac-1, ac-4, ac-5) ;
  3. sinon un seul palier s'applique, celui au `Taux` maximal — « le plus avantageux » (ac-3,
     `US-2.md:9` ; `research.md:53`) → `Taux.Applique(ligne.SousTotal)`.
- Règle par panier : `Montant RemisePour(Panier panier)` = somme de `RemisePour(ligne)` sur
  `panier.Lignes` (`Panier.cs:8`). Chaque ligne est évaluée seule, jamais la quantité cumulée du
  panier ni par référence (ac-4, `US-2.md:10`). Cette somme reste dans le domaine : la règle « par
  ligne » est commerciale (`adr-001:25-26`), l'approche C qui la mettrait dans l'application est
  écartée (`research.md:74-76`).

## Cas d'usage (application, étendu)

Cas d'usage `CalculDuPanier` (`CalculDuPanier.cs:19-22`), qui réalise la Requête `ChiffrerPanier` :
- `CalculDuPanier(GrilleDeRemise grille)` et `CalculDuPanier()` ≡ `GrilleDeRemise.Vide`.
- `Chiffrer(Panier panier)` → `new Facture(panier.SommeDesLignes(), grille.RemisePour(panier), Montant.Zero)`.

### Vue `Facture` (existante, forme inchangée)

Vue `Facture` (`CalculDuPanier.cs:10-13`), champs :

| Champ | Type | Valeur après US-2 | Source |
|---|---|---|---|
| `SommeDesArticles` | `Montant` | `panier.SommeDesLignes()` — inchangé | `CalculDuPanier.cs:10,21` ; `Panier.cs:16` |
| `Remise` | `Montant` | `grille.RemisePour(panier)` — était `Montant.Zero` | `CalculDuPanier.cs:10,21` |
| `FraisDePort` | `Montant` | `Montant.Zero` — inchangé | `CalculDuPanier.cs:10,21` |
| `ATPayer` | `Montant` | `SommeDesArticles` + `FraisDePort` — inchangé | `CalculDuPanier.cs:12` |

## Événements

Faits de la timeline (voir `event-model.md`), sans classe d'événement à créer : le projet n'a ni
type d'événement ni stockage (`adr-001:40-42`).
- Événement `LigneAjouteeAuPanier` — produit par la Commande `AjouterLigneAuPanier`, réalisée par
  `Panier.Ajoute` (`Panier.cs:10-14`) ; charge utile : `Reference`, `Quantite`, `PrixUnitaire` (`LigneDePanier.cs:4`).
- Événement `GrilleDeRemiseConfiguree` — produit par la Commande `ConfigurerGrilleDeRemise`, réalisée
  par les fabriques de l'Objet-valeur `GrilleDeRemise` ; charge utile : `Paliers` (chacun `Seuil`, `Taux`).

## Interfaces de dépôt

Aucune. L'Agrégat `Panier` n'est pas persisté : le cas d'usage le reçoit en argument (`CalculDuPanier.cs:21`),
et l'ADR-001 juge une couche d'infrastructure prématurée tant qu'aucun stockage n'existe
(`adr-001:40-42`). `GrilleDeRemise` est un objet-valeur passé au constructeur du cas d'usage
(`adr-001:28-30`), pas un agrégat. Une interface (dans le domaine) ne deviendra nécessaire que si la
grille doit être lue depuis une source extérieure — non demandé par US-2.

## ADR existants à reconsidérer

- `docs/adr/adr-001-decoupage-domaine-application.md` — **maintenu**, aucune reconsidération : le modèle
  reste dans ses deux couches (`:15-21`), la règle est dans le domaine (`:25-26`), la grille est passée
  au cas d'usage (`:28-30`), montants en `decimal` (`:32-33`). La liste des règles du domaine (`:17-18`)
  ne cite pas `GrilleDeRemise` ; c'est descriptif, pas une contrainte.
- `docs/adr/adr-002-format-de-rapport-de-tests.md` — **à corriger (hors décision US-2)** : il désigne
  `tests/Dosage.Tests` (`:17-18`) alors que le projet de tests est `tests/Tarification.Tests`
  (`.agent-studio/stack.yaml:10`, `tests/Tarification.Tests/Tarification.Tests.csproj`). Référence
  périmée ; la décision elle-même n'est pas en cause.
