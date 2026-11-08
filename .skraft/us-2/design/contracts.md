# Contracts — US-2 Remise par palier de quantité

Sources : `event-model.md` (commande, événement, requête, vue), `domain-model.md` (objets-valeurs,
comportements), code existant cité ligne à ligne. Couches selon
`docs/adr/adr-001-decoupage-domaine-application.md:17-21`.

## Décisions d'architecture (porte d'éligibilité)

| Candidat | Verdict | Motif |
|---|---|---|
| `Panier` porte la somme des remises de ses lignes | Pas d'ADR | `Panier` existe déjà et ADR-001 le nomme parmi les règles du domaine (`adr-001:17-18`) ; US-2 ajoute un comportement sans déplacer de frontière (`domain-model.md:30-31`). |
| `GrilleDePaliers` transmise au cas d'usage plutôt que lue dans un stockage | Pas d'ADR (Q1) | Déjà imposé par `adr-001:28-30` (« il faut la lui passer ») et `adr-001:40-42` (pas de stockage). |
| Paliers, taux et calcul de remise dans le domaine | Pas d'ADR (Q1) | Déjà imposé par `adr-001:8-9, 25-26`. |
| Pas d'arrondi, taux maximal, pas de contrôle des doublons | Pas d'ADR (Q3) | Règles métier simplifiées (`passation.md:6-8`), pas des choix structurels. |

Aucun CQRS avec bus, aucun Event Sourcing, aucune saga ni couche anticorruption, aucun changement
transverse : `CalculDuPanier` reste appelé directement (`CalculDuPanier.cs:19-22`).

## Commande `AjouterUneLigne`

Commande existante, réutilisée sans changement (`event-model.md:15`), implémentée par `Panier.Ajoute`
(`src/Tarification.Domaine/Panier.cs:10-14`). Couche : Domaine.

Champ unique : une `LigneDePanier` (`LigneDePanier.cs:4`). Validation, portée par ses composants :

| Composant de la ligne | Type | Validation |
|---|---|---|
| référence | chaîne | Aucune règle existante (`LigneDePanier.cs:4`) ; US-2 n'en ajoute pas. |
| quantité | objet-valeur `Quantite` | Au moins 1, sinon `ArgumentOutOfRangeException` (`Quantite.cs:10-11`). |
| prix unitaire | objet-valeur `Montant` | Non négatif, sinon `ArgumentOutOfRangeException` (`Montant.cs:13-14`). |

Effet : la ligne est ajoutée à la suite des lignes du `Panier` (`Panier.cs:10-14`). Les lignes ne sont
jamais regroupées par référence (`domain-model.md:34-36`). Produit l'événement `LigneAjoutee`.

## Événement `LigneAjoutee`

Conceptuel : il n'est pas publié dans le code et US-2 ne le matérialise pas (`event-model.md:19-22`,
`domain-model.md:83`). Il sert d'état préalable (« Soit ») aux critères (`event-model.md:37-43`).

Charge utile : la `LigneDePanier` ajoutée, avec sa référence, sa quantité (objet-valeur `Quantite`) et son
prix unitaire (objet-valeur `Montant`) (`LigneDePanier.cs:4`).

## Requête `ChiffrerLePanier`

Point d'entrée : `CalculDuPanier.Chiffrer(Panier)` (`CalculDuPanier.cs:19-21`, `event-model.md:26-28`).
Couche : Application.

Paramètres :

| Paramètre | Type | Origine | Règle |
|---|---|---|---|
| panier | `Panier` | argument de la méthode | Peut être vide : ses sommes valent alors zéro (`Panier.cs:3`). |
| grille | objet-valeur `GrilleDePaliers` | constructeur de `CalculDuPanier` | Vaut `Vide` par défaut, pour que `new CalculDuPanier()` reste valide (`domain-model.md:15, 61`, `ChiffrageDuPanierSteps.cs:26`). Une seule grille, la même pour toutes les références (`passation.md:5, 9`). |

Signatures visées pour `CalculDuPanier` :
- constructeur sans argument, qui utilise la grille `Vide` ;
- constructeur recevant une `GrilleDePaliers` ;
- `CalculDuPanier.Chiffrer(Panier)`, qui renvoie une `Facture`.

Retour : vue `Facture` (`CalculDuPanier.cs:10-13`), forme inchangée :

| Composant | Valeur après US-2 |
|---|---|
| somme des articles | `SommeDesLignes` du `Panier`, inchangée (`CalculDuPanier.cs:21`) |
| `Facture.Remise` | `SommeDesRemises` du `Panier` avec la grille ; vaut aujourd'hui `Montant.Zero` (`CalculDuPanier.cs:21`) |
| frais de port | `Montant.Zero`, inchangés |
| `ATPayer` | inchangé : la remise n'en est **pas** déduite (`CalculDuPanier.cs:12`, `passation.md:9`) |

Lecture seule : la requête ne modifie ni le `Panier` ni la grille (`domain-model.md:85`).

## Contrats du domaine (Couche : Domaine)

### `SommeDesRemises` sur `Panier`

- Signature : `SommeDesRemises(GrilleDePaliers)`, qui renvoie un `Montant`.
- Calcul : somme de `RemisePour` pour chaque `LigneDePanier`, à partir de `Montant.Zero`, sur le patron de
  `SommeDesLignes` (`Panier.cs:16`, `domain-model.md:30-31`).
- Les quantités de deux lignes ne s'additionnent jamais pour atteindre un seuil (ac-4,
  `stories/US-2.md:10`).

### Objet-valeur `GrilleDePaliers`

- Ensemble de `PalierDeQuantite`. Valeur `Vide` sans palier (ac-5) ; fabrique `De` à partir d'une liste
  de paliers, sans règle sur leur ordre ni sur les doublons (`domain-model.md:60-61, 67-70`, `passation.md:8`).
- `RemisePour(LigneDePanier)` renvoie un `Montant` (`domain-model.md:62-66`) :
  - parmi les paliers dont `EstAtteintPar` est vrai pour `ligne.Quantite`, seul celui au taux le plus élevé s'applique ;
  - remise = `ligne.SousTotal` × taux / 100 ;
  - si aucun palier n'est atteint, ou si la grille est vide, la remise vaut `Montant.Zero`.
- Pas d'arrondi : le `decimal` est conservé exact (`domain-model.md:68`, `passation.md:6`).

### Objet-valeur `PalierDeQuantite`

- `Seuil` : objet-valeur `Quantite`, donc au moins 1 (`Quantite.cs:10-11`, `domain-model.md:45-46`).
- `Taux` : objet-valeur `TauxDeRemise`.
- `EstAtteintPar(Quantite)` : vrai si la quantité est supérieure ou égale au `Seuil` (ac-1 : 9 → faux ;
  ac-2 : 10 → vrai, `domain-model.md:48`).

### Objet-valeur `TauxDeRemise`

- Pourcentage en `decimal`, constructeur privé et fabrique `De`, sur le patron de `Montant`
  (`Montant.cs:11-14`, `domain-model.md:52-53`).
- Seule règle : un taux négatif lève `ArgumentOutOfRangeException` ; pas de borne haute
  (`domain-model.md:54-56`, `passation.md:8`).

### Objet-valeur `Montant` (extension)

- Nouvelle opération qui applique un `TauxDeRemise` : montant × taux / 100, en `decimal`. Son nom est
  laissé à l'implémentation (`domain-model.md:74-75`).
- Le résultat n'est jamais négatif, puisque ni le montant ni le taux ne peuvent l'être (`Montant.cs:5-6, 13-14`).
- Exemples : 20,00 € × 5 % = 1,00 € (ac-2) ; 100,00 € × 12 % = 12,00 € (ac-3) (`domain-model.md:76-77`).

## Dépôts

Aucun. `domain-model.md:89-93` n'en crée pas : le `Panier` arrive en argument (`CalculDuPanier.cs:21`),
la grille par le constructeur, et le projet n'a pas de stockage (`adr-001:40-42`).

## Correspondance avec les critères

| Critère | Grille | Lignes | `Facture.Remise` attendue |
|---|---|---|---|
| ac-1 | un palier 10 : 5 % | 9 × 2,00 € | 0,00 € (`US-2.md:7`) |
| ac-2 | un palier 10 : 5 % | 10 × 2,00 € | 1,00 € (`US-2.md:8`) |
| ac-3 | paliers 10 : 5 % et 50 : 12 % | 50 × 2,00 € | 12,00 € (`US-2.md:9`) |
| ac-4 | un palier 10 : 5 % | 6 articles de la réf. A + 6 de la réf. B | 0,00 € (`US-2.md:10`) |
| ac-5 | `Vide` | une ligne quelconque | 0,00 € (`US-2.md:11`) |
