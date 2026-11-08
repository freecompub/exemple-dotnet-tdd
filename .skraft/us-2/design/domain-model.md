# Domain Model — US-2 Remise par palier de quantité

Contexte : `Tarification` (Core, voir `context-map.md`).

## Réutilisation

Point de départ : `.skraft/us-2/research/research.md:117-125`.

| Élément | Fichier | Classement | Ce qui change |
|---|---|---|---|
| `Panier` | `src/Tarification.Domaine/Panier.cs:4-17` | **Étendre** | Ajout de `SommeDesRemises(GrilleDePaliers)`, sur le patron `Aggregate(Montant.Zero, …)` de `SommeDesLignes` (`Panier.cs:16`) |
| `LigneDePanier` | `src/Tarification.Domaine/LigneDePanier.cs:4-7` | **Réutiliser tel quel** | Expose déjà `Quantite` et `SousTotal`, suffisants pour la remise d'une ligne (`research.md:67-69`) |
| `Montant` | `src/Tarification.Domaine/Montant.cs:7-26` | **Étendre** | Ajout d'une opération d'application d'un taux ; aujourd'hui seuls `+`, `Multiplie(int)` et `CompareTo` existent (`Montant.cs:18-23`, `research.md:70-72`) |
| `Quantite` | `src/Tarification.Domaine/Quantite.cs:4-14` | **Réutiliser tel quel** | Sert de seuil d'un palier : son invariant « au moins 1 » (`Quantite.cs:10-11`) couvre la validation du seuil |
| `CalculDuPanier` | `src/Tarification.Application/CalculDuPanier.cs:19-22` | **Étendre** | Reçoit une `GrilleDePaliers` (vide par défaut, pour garder `new CalculDuPanier()`, `ChiffrageDuPanierSteps.cs:26`, `research.md:64-66`) et renseigne `Facture.Remise` |
| `Facture` | `src/Tarification.Application/CalculDuPanier.cs:10-13` | **Réutiliser tel quel** | Le champ `Remise` existe déjà (`CalculDuPanier.cs:10`) ; `ATPayer` inchangé (`passation.md:9`) |
| `ChiffrageDuPanierSteps` | `tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs:9-34` | **Étendre** | Étapes « Soit » de paliers et « Alors » de remise à ajouter ; les étapes de panier et de ligne (`:15-23`) se réutilisent |
| `PalierDeQuantite` | — | **Créer** | Objet-valeur (absent du code : `src/Tarification.Domaine/` ne contient que `Panier`, `LigneDePanier`, `Montant`, `Quantite`) |
| `TauxDeRemise` | — | **Créer** | Objet-valeur |
| `GrilleDePaliers` | — | **Créer** | Objet-valeur |

## Agrégats

### `Panier` (racine : `Panier`, existant)

- Contenu : la liste ordonnée des `LigneDePanier` (`Panier.cs:6-8`).
- Comportements :
  - `Ajoute(LigneDePanier)` — existant (`Panier.cs:10-14`), commande `AjouterUneLigne`.
  - `SommeDesLignes()` — existant (`Panier.cs:16`).
  - `SommeDesRemises(GrilleDePaliers)` — **nouveau** : somme, pour chaque ligne, de
    `GrilleDePaliers.RemisePour(ligne)`.
- Invariants :
  - Un panier peut être vide : ses sommes valent zéro (`Panier.cs:3`).
  - **La remise se calcule par ligne, jamais sur le panier entier** (`stories/US-2.md:10`) : les quantités
    de deux lignes ne s'additionnent jamais pour atteindre un seuil. Pas de regroupement par référence
    (`research.md:104-107`).
- Références externes : aucune ; la `GrilleDePaliers` est un objet-valeur passé en argument, pas un agrégat.

`LigneDePanier` (`sealed record`, `LigneDePanier.cs:4`) reste une entité interne à l'agrégat `Panier`.

## Objets-valeurs

### `PalierDeQuantite` (nouveau)

- `Seuil : Quantite` — « N articles ou plus » (`stories/US-2.md:7`) ; validation « au moins 1 » héritée
  de `Quantite.De` (`Quantite.cs:10-11`).
- `Taux : TauxDeRemise`.
- `EstAtteintPar(Quantite)` : vrai si la quantité est supérieure ou égale au seuil (ac-1 : 9 < 10 ; ac-2 : 10 ≥ 10).

### `TauxDeRemise` (nouveau)

- Pourcentage en `decimal` (`adr-001:32-33`), fabrique `De(decimal)` sur le patron de `Montant.De`
  (`Montant.cs:11-14`).
- Validation : un taux négatif lève `ArgumentOutOfRangeException`, seule règle retenue — elle découle de
  l'interdiction des montants négatifs (`Montant.cs:5-6, 13-14`) ; aucune autre borne, la validation de la
  grille n'étant pas spécifiée (`passation.md:8` : option la plus simple).

### `GrilleDePaliers` (nouveau)

- Ensemble de `PalierDeQuantite`, unique et identique pour toutes les références (`passation.md:5,9`).
- `Vide` : grille sans palier (ac-5, `stories/US-2.md:11`) ; valeur par défaut de `CalculDuPanier`.
- `RemisePour(LigneDePanier) : Montant` :
  - parmi les paliers atteints par `ligne.Quantite`, un seul s'applique : celui au taux le plus élevé
    (« le plus avantageux », `stories/US-2.md:9`) ;
  - remise = `ligne.SousTotal` × taux / 100 ;
  - aucun palier atteint ou grille vide : `Montant.Zero` (ac-1, ac-4, ac-5).
- Règles volontairement simples (`passation.md:6-8`) :
  - pas d'arrondi : le `decimal` est conservé exact ; aucun critère n'en exige (`research.md:75`) ;
  - « le plus avantageux » = taux maximal parmi les paliers atteints, lecture littérale de `US-2.md:9` ;
  - pas de contrôle des seuils en double : la sélection du taux maximal les absorbe.

### `Montant` (existant, étendu)

- Nouvelle opération `Applique(TauxDeRemise)`, qui applique un taux au montant, restant
  non négative et en `decimal` (`Montant.cs:5-14`, `adr-001:32-33`).
- Vérification des exemples : 10 × 2,00 = 20,00, × 5 % = 1,00 (ac-2) ; 50 × 2,00 = 100,00, × 12 % = 12,00
  (ac-3) (`research.md:75`).

## Événements du domaine

| Événement | Émis par | Commande | Statut |
|---|---|---|---|
| `LigneAjoutee` | `Panier` | `AjouterUneLigne` | Existant conceptuellement (`Panier.cs:10-14`), non matérialisé dans le code ; US-2 n'en ajoute pas |

Aucun nouvel événement : le chiffrage est une requête (`event-model.md`), il ne modifie pas l'état.

## Interfaces de dépôt

| Agrégat | Interface | Couche | Décision US-2 |
|---|---|---|---|
| `Panier` | aucune créée | — | Le cas d'usage reçoit le `Panier` en argument (`CalculDuPanier.cs:21`) et le projet n'a aucun stockage (`adr-001:40-42`) : aucun critère de US-2 ne charge ni n'enregistre de panier. Si un stockage apparaît, l'interface ira dans `Tarification.Domaine` (règle Repository de la skill `architecture-patterns`). |

`GrilleDePaliers` est un objet-valeur, sans dépôt : elle est transmise à `CalculDuPanier` (`research.md:86`).

## Questions ouvertes

Aucune : les trois points laissés ouverts par la recherche (`research.md:135-138`) sont tranchés par
`passation.md:6-8` (option la plus simple), appliquée ci-dessus.

## Attributs et membres nommés

Section ajoutée en fin de document pour ne pas décaler les lignes citées ailleurs. Elle nomme tous les
membres que les documents suivants reprennent.

| Type | Membre | Type du membre | Statut | Source |
|---|---|---|---|---|
| `LigneDePanier` | `Reference` | `string` | existant | `LigneDePanier.cs:4` |
| `LigneDePanier` | `Quantite` | `Quantite` | existant | `LigneDePanier.cs:4` |
| `LigneDePanier` | `PrixUnitaire` | `Montant` | existant | `LigneDePanier.cs:4` |
| `LigneDePanier` | `SousTotal` | `Montant` (= `PrixUnitaire.Multiplie(Quantite.Valeur)`) | existant | `LigneDePanier.cs:6` |
| `Panier` | `Lignes` | `IReadOnlyList<LigneDePanier>` | existant | `Panier.cs:8` |
| `Panier` | `Ajoute` | `LigneDePanier` → `Panier` | existant | `Panier.cs:10-14` |
| `Panier` | `SommeDesLignes` | → `Montant` | existant | `Panier.cs:16` |
| `Panier` | `SommeDesRemises` | `GrilleDePaliers` → `Montant` | nouveau | voir « Agrégats » |
| `PalierDeQuantite` | `Seuil` | `Quantite` | nouveau | voir « Objets-valeurs » |
| `PalierDeQuantite` | `Taux` | `TauxDeRemise` | nouveau | voir « Objets-valeurs » |
| `PalierDeQuantite` | `De` | `Quantite`, `TauxDeRemise` → `PalierDeQuantite` | nouveau | patron `Montant.De` (`Montant.cs:13-14`) |
| `PalierDeQuantite` | `EstAtteintPar` | `Quantite` → `bool` | nouveau | voir « Objets-valeurs » |
| `TauxDeRemise` | `Pourcentage` | `decimal` | nouveau | `adr-001:32-33` |
| `TauxDeRemise` | `De` | `decimal` → `TauxDeRemise` | nouveau | patron `Montant.De` (`Montant.cs:13-14`) |
| `GrilleDePaliers` | `Vide` | `GrilleDePaliers` | nouveau | ac-5 (`stories/US-2.md:11`) |
| `GrilleDePaliers` | `De` | `PalierDeQuantite[]` → `GrilleDePaliers` | nouveau | patron `Montant.De` (`Montant.cs:13-14`) |
| `GrilleDePaliers` | `RemisePour` | `LigneDePanier` → `Montant` | nouveau | voir « Objets-valeurs » |
| `Montant` | `Euros` | `decimal` | existant | `Montant.cs:9` |
| `Montant` | `Zero` | `Montant` | existant | `Montant.cs:16` |
| `Montant` | `Multiplie` | `int` → `Montant` | existant | `Montant.cs:20-21` |
| `Montant` | `Applique` | `TauxDeRemise` → `Montant` (`Euros` × `Pourcentage` / 100) | nouveau | nom retenu pour l'opération d'application d'un taux |
| `Facture` | `SommeDesArticles` | `Montant` | existant | `CalculDuPanier.cs:10` |
| `Facture` | `Remise` | `Montant` | existant, renseigné par US-2 | `CalculDuPanier.cs:10`, `passation.md:9` |
| `Facture` | `FraisDePort` | `Montant` | existant | `CalculDuPanier.cs:10` |
| `Facture` | `ATPayer` | `Montant` (= `SommeDesArticles` + `FraisDePort`) | existant, inchangé | `CalculDuPanier.cs:12`, `passation.md:9` |
| `CalculDuPanier` | `Chiffrer` | `Panier` → `Facture` | existant | `CalculDuPanier.cs:21` |
| `CalculDuPanier` | constructeur | `GrilleDePaliers` (défaut `GrilleDePaliers.Vide`) | nouveau | `research.md:86, 112` |

Charge utile de l'événement `LigneAjoutee` : `Reference`, `Quantite`, `PrixUnitaire` de la ligne ajoutée
(`LigneDePanier.cs:4`).
