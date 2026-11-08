# Contrats — US-2 Remise par palier de quantité

Décision d'architecture : `docs/adr/adr-003-remise-par-palier-dans-l-agregat-panier.md` (Proposed).
ADR-001 reste en vigueur sans changement (`.skraft/us-2/design/adr-a-reconsiderer.md:5`).

## Inventaire

- Commandes : aucune. US-2 n'en ajoute pas (`.skraft/us-2/design/event-model.md:11-12`).
- Événements : aucun (`event-model.md:11-12`, `.skraft/us-2/design/domain-model.md:64`).
- Dépôts : aucun (`domain-model.md:66-70`). Le panier et le barème sont fournis par l'appelant.
- Requêtes : une seule, Requête `ChiffrerLePanier` (`event-model.md:20-27`).

## Requête `ChiffrerLePanier`

Point d'entrée : `CalculDuPanier.Chiffrer(Panier)`, dans la couche Application
(`src/Tarification.Application/CalculDuPanier.cs:19-22`, `event-model.md:22-27`). La signature
de `Chiffrer` reste inchangée (`CalculDuPanier.cs:21`).

### Construction de `CalculDuPanier`

| Constructeur | Règle |
|---|---|
| `new CalculDuPanier()` | Équivaut à un barème `BaremeDeRemises.Aucun`. Il est conservé pour `ChiffrageDuPanierSteps` (`ChiffrageDuPanierSteps.cs:26`) et les scénarios US-1. C'est le cas d'ac-5 (`domain-model.md:14`). |
| constructeur recevant un `BaremeDeRemises` | Le barème global, le même pour toutes les références (`.skraft/us-2/passation.md:5`, `:10`). |

### Paramètres

| Paramètre | Type | Règle de validation |
|---|---|---|
| panier | Agrégat `Panier` | Peut être vide : sa remise vaut alors `Montant.Zero` (`domain-model.md:28`). |
| barème (fourni au constructeur) | objet-valeur `BaremeDeRemises` | Valide par construction : ses paliers ont été validés par `Quantite` et `Pourcentage` (voir plus bas). Peut être `BaremeDeRemises.Aucun`. |

### Retour : vue `Facture`

La vue `Facture` existe déjà (`CalculDuPanier.cs:10`).

| Champ | Valeur après US-2 |
|---|---|
| `SommeDesArticles` | `SommeDesLignes` du panier. Inchangé. |
| `Remise` | `panier.RemiseDesLignes(bareme)`. Il remplace `Montant.Zero` (`CalculDuPanier.cs:21`, `domain-model.md:14`). |
| `FraisDePort` | `Montant.Zero`. Inchangé, hors périmètre. |
| `ATPayer` | `ATPayer = SommeDesArticles + FraisDePort`. **Inchangé** : la remise n'en est pas déduite. Aucun critère d'US-2 ne porte sur le montant à payer (`stories/US-2.md:7-11`), et l'utilisateur demande l'option la plus simple qui respecte les critères (`passation.md:6-9`). Cela valide le point soulevé par `domain-model.md:76`. |

### Résultats attendus (critères)

| Critère | Barème | Panier | `Remise` |
|---|---|---|---|
| ac-1 | [10 → 5 %] | 9 × 2,00 € | 0,00 € |
| ac-2 | [10 → 5 %] | 10 × 2,00 € | 1,00 € |
| ac-3 | [10 → 5 %, 50 → 12 %] | 50 × 2,00 € | 12,00 € |
| ac-4 | [10 → 5 %] | 6 articles d'une référence, 6 d'une autre | 0,00 € |
| ac-5 | `BaremeDeRemises.Aucun` | quelconque | 0,00 € |

Source : `stories/US-2.md:7-11`, `event-model.md:31-37`.

## Contrats du domaine (couche Domaine)

Ils suivent la convention du projet : `readonly record struct` ou `sealed record`, constructeur
privé, fabrique `De(...)` qui lève `ArgumentOutOfRangeException` (`domain-model.md:35`,
`src/Tarification.Domaine/Montant.cs:11-14`, `src/Tarification.Domaine/Quantite.cs:8-11`). Les
calculs se font en `decimal` (`docs/adr/adr-001-decoupage-domaine-application.md:32-33`).

### objet-valeur `Pourcentage`

| Membre | Contrat |
|---|---|
| `De(...)` | Reçoit un `decimal`. Lève `ArgumentOutOfRangeException` si la valeur est inférieure à 0 ou supérieure à 100 (`domain-model.md:39-40`). |
| `Applique(Montant assiette) : Montant` | `Montant.De(assiette.Euros × valeur / 100)`, **sans arrondi** (`domain-model.md:41-42`, `passation.md:6`). |

### objet-valeur `PalierDeRemise`

| Membre | Contrat |
|---|---|
| `De(...)` | Reçoit `Seuil : Quantite` et `Taux : Pourcentage`. Pas de validation propre : celles de `Quantite` (≥ 1) et de `Pourcentage` suffisent (`domain-model.md:46`, `:49`). |
| `EstAtteintPar(Quantite quantite) : bool` | `quantite.Valeur >= Seuil.Valeur`. Seuil inclusif (ac-1, ac-2 ; `domain-model.md:48`). |

### objet-valeur `BaremeDeRemises`

| Membre | Contrat |
|---|---|
| `De(...)` | Reçoit une liste de `PalierDeRemise`. Ordre quelconque et doublons de seuil acceptés (`domain-model.md:53`, `:58-59`). |
| `BaremeDeRemises.Aucun` | La liste vide (`domain-model.md:54`). |
| `RemiseDe(LigneDePanier ligne) : Montant` | Parmi les paliers atteints par `ligne.Quantite`, on retient celui de plus grand `Taux` et on l'applique à `ligne.SousTotal`. Si aucun palier n'est atteint, ou si le barème est vide, le résultat est `Montant.Zero` (`domain-model.md:55-57`). |

### Agrégat `Panier` : opération ajoutée

| Membre | Contrat |
|---|---|
| `RemiseDesLignes(BaremeDeRemises)` | Retourne un `Montant` : la somme de `bareme.RemiseDe(ligne)` sur `Lignes`, sur le modèle de `SommeDesLignes` (`Panier.cs:16`). Chaque ligne est évaluée seule et les quantités ne sont jamais cumulées entre lignes (ac-4). Un panier vide donne `Montant.Zero` (`domain-model.md:28-29`). |

`Montant`, `Quantite` et `LigneDePanier` ne changent pas (`domain-model.md:9-11`).
