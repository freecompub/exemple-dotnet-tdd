# Modèle de domaine — US-2 Remise par palier de quantité

## Réutilisation

Je pars de l'existant relevé par la recherche (`.skraft/us-2/research/research.md:107-114`).

| Élément | Fichier | Classement | Raison |
|---|---|---|---|
| `Montant` | `src/Tarification.Domaine/Montant.cs` | Réutiliser tel quel | `+` suffit pour additionner les remises (`Montant.cs:18`). `Montant.De` construit la part remisée (`Montant.cs:13-14`). Il n'y a pas de soustraction à ajouter, puisque `ATPayer` ne change pas (voir plus bas). |
| `Quantite` | `src/Tarification.Domaine/Quantite.cs` | Réutiliser tel quel | Elle sert de seuil d'un palier. Son invariant ≥ 1 (`Quantite.cs:10-11`) donne la validation du seuil sans règle de plus. |
| `LigneDePanier` | `src/Tarification.Domaine/LigneDePanier.cs` | Réutiliser tel quel | `Quantite` et `SousTotal` (`LigneDePanier.cs:4-6`) sont l'entrée et l'assiette de la remise d'une ligne. |
| `Panier` | `src/Tarification.Domaine/Panier.cs` | Étendre | Ajouter `RemiseDesLignes(BaremeDeRemises)`, sur le modèle de `SommeDesLignes` (`Panier.cs:16`). La règle « par ligne, jamais sur le panier entier » (`stories/US-2.md:10`) reste ainsi dans le domaine (`adr-001:25-26`). |
| `Facture` | `src/Tarification.Application/CalculDuPanier.cs:10-13` | Réutiliser tel quel | Le champ `Remise` existe déjà et attend cette story (`CalculDuPanier.cs:5-9`). |
| `CalculDuPanier` | `src/Tarification.Application/CalculDuPanier.cs:19-22` | Étendre | Il reçoit un `BaremeDeRemises` et remplit `Facture.Remise` avec `panier.RemiseDesLignes(bareme)` au lieu de `Montant.Zero` (`CalculDuPanier.cs:21`). Il garde un constructeur sans argument équivalent à `BaremeDeRemises.Aucun`, pour que `new CalculDuPanier()` (`ChiffrageDuPanierSteps.cs:26`) et les scénarios US-1 continuent de fonctionner. Ce cas est aussi celui d'ac-5. |
| `ChiffrageDuPanierSteps` | `tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs` | Étendre | Ajouter un step « Soit » pour déclarer un palier et un step « Alors » pour lire la remise. Le step « Quand » (`:25-26`) passe le barème accumulé à `CalculDuPanier`. |
| `PalierDeRemise` | — | Créer | Aucun type existant ne porte un seuil et un pourcentage. |
| `Pourcentage` | — | Créer | `Montant` ne connaît que `Multiplie(int)` (`Montant.cs:20-21`). Un taux comme 5 % n'a pas de type. |
| `BaremeDeRemises` | — | Créer | La liste unique des paliers (`passation.md:5`, `:10`) n'existe pas encore. |

## Agrégats

### `Panier` (racine, existant)

- Contient des `LigneDePanier` (`Panier.cs:6-8`). C'est déjà le point d'entrée des règles de chiffrage (`adr-001:17-18`).
- Ne référence aucun autre agrégat. `BaremeDeRemises` est un objet-valeur passé en argument, pas un agrégat (voir plus bas).
- Invariants :
  - existant : un panier vide vaut zéro (`Panier.cs:3`) ;
  - **nouveau (ac-4)** : la remise du panier est la somme des remises de ses lignes, et chaque ligne est évaluée sur sa seule quantité. On ne cumule jamais les quantités de lignes différentes (`stories/US-2.md:10`). Panier vide ou barème vide : la remise vaut `Montant.Zero`.
- Nouvelle opération : `RemiseDesLignes(BaremeDeRemises bareme) : Montant` = somme de `bareme.RemiseDe(ligne)` sur `Lignes`.

`LigneDePanier` reste un `sealed record` interne à l'agrégat (`LigneDePanier.cs:4`). Il n'est pas modifié.

## Objets-valeurs

Tous suivent la convention du projet : `readonly record struct` ou `sealed record`, constructeur privé, fabrique `De(...)` qui lève `ArgumentOutOfRangeException` (`Montant.cs:7-14`, `Quantite.cs:4-11`). Les noms sont en français.

### `Pourcentage` (nouveau)

- Valeur : `decimal` (`adr-001:32-33`).
- Invariant : entre 0 et 100 inclus. La borne basse est nécessaire, car un montant négatif n'existe pas (`Montant.cs:4-5`, `:13-14`). La borne haute est la règle la plus simple pour qu'une remise ne dépasse pas l'assiette, faute de règle donnée (`passation.md:8`).
- Opération : `Applique(Montant assiette) : Montant` = `Montant.De(assiette.Euros × valeur / 100)`.
- **Arrondi : aucun.** Le résultat `decimal` est gardé tel quel. Tous les critères tombent juste au centime (1,00 € et 12,00 €, `stories/US-2.md:8-9`). L'utilisateur demande l'option la plus simple qui respecte les critères (`passation.md:6`).

### `PalierDeRemise` (nouveau)

- Composants : `Seuil : Quantite`, `Taux : Pourcentage`.
- Sens : « `Seuil` articles ou plus sur une même ligne : `Taux` » (`stories/US-2.md:7`).
- Opération : `EstAtteintPar(Quantite quantite) : bool` = `quantite.Valeur >= Seuil.Valeur`. Le seuil est inclusif : 10 déclenche le palier de 10 (ac-2), 9 ne le déclenche pas (ac-1).
- Pas de validation propre : celles de `Quantite` (seuil ≥ 1) et de `Pourcentage` suffisent. C'est l'option la plus simple (`passation.md:8`).

### `BaremeDeRemises` (nouveau)

- Composant : une liste de `PalierDeRemise`, globale et la même pour toutes les références (`passation.md:5`, `:10`).
- `BaremeDeRemises.Aucun` : la liste vide (ac-5).
- Opération : `RemiseDe(LigneDePanier ligne) : Montant`.
  - Parmi les paliers atteints par `ligne.Quantite`, on retient **celui qui a le plus grand `Taux`** et on l'applique à `ligne.SousTotal`. Un seul palier s'applique, sans cumul (ac-3).
  - Si aucun palier n'est atteint, ou si le barème est vide, le résultat est `Montant.Zero` (ac-1, ac-4, ac-5).
  - Pourquoi « le plus grand taux » : comme l'assiette est la même, le plus grand taux donne la plus grande remise, ce qui est la définition littérale de « le plus avantageux » (`stories/US-2.md:9`). Sur ac-3, il coïncide avec « le plus grand seuil atteint » (`research.md:59`). L'utilisateur a demandé l'option la plus simple (`passation.md:7`). Cette règle ne suppose aucun ordre des paliers.
- Doublons de seuil : aucun contrôle. La règle du plus grand taux les traite sans ambiguïté (`passation.md:8`).
- `BaremeDeRemises` est un objet-valeur, pas un agrégat. Il n'a ni identité ni cycle de vie dans US-2 : c'est une donnée fournie au cas d'usage (`adr-001:28-30` : passer plutôt qu'appeler).

## Arguments nuls

Le modèle **ne prévoit aucune garde contre `null` à l'exécution**, et donc aucune `ArgumentNullException`. C'est valable pour `BaremeDeRemises` (paliers), `Panier.RemiseDesLignes(BaremeDeRemises)`, `CalculDuPanier(BaremeDeRemises)` et `CalculDuPanier.Chiffrer(Panier)`.

Les sources :
- le projet active les types référence non nullables (`Directory.Build.props:4`) et traite tout avertissement comme une erreur (`Directory.Build.props:7-8`). Passer `null` à un paramètre non nullable est donc refusé dès la compilation ;
- le code existant ne pose aucune garde de ce genre : `Panier.Ajoute(LigneDePanier)` (`Panier.cs:10-14`), `CalculDuPanier.Chiffrer(Panier)` (`CalculDuPanier.cs:21`). Les seules erreurs levées à l'exécution sont les `ArgumentOutOfRangeException` des fabriques `De` (`Montant.cs:13-14`, `:20-21`, `Quantite.cs:10-11`) ;
- aucun critère ne porte sur un argument absent (`stories/US-2.md:7-11`), et l'utilisateur demande l'option la plus simple qui respecte les critères (`passation.md:8`).

Les seules erreurs de domaine qu'introduit US-2 sont donc l'`ArgumentOutOfRangeException` de `Pourcentage.De` (valeur hors de [0 ; 100]) et celle, existante, de `Quantite.De` pour un seuil inférieur à 1.

## Événements de domaine

Aucun. Le chiffrage est un calcul sans changement d'état (`CalculDuPanier.cs:21`). Le skill réserve l'événement à l'enregistrement d'un changement d'état. Voir `event-model.md`.

## Interfaces de dépôt

Aucune n'est créée.
- `Panier` n'est pas chargé : l'appelant le construit et le passe à `CalculDuPanier.Chiffrer` (`CalculDuPanier.cs:21`). Aucun dépôt n'existe aujourd'hui pour cet agrégat.
- Le projet n'a pas de stockage. ADR-001 juge prématurée une couche d'infrastructure tant qu'aucun besoin réel ne la réclame (`adr-001:40-42`). US-2 n'en crée pas : le barème arrive par le constructeur de `CalculDuPanier`.

Si un jour le barème vient d'un stockage, son interface (par exemple un fournisseur de `BaremeDeRemises`) ira dans `Tarification.Application`, jamais dans une infrastructure (skill architecture-patterns, « Repository » / « Application Interface »).

## Hors critères : `Facture.ATPayer`

`ATPayer = SommeDesArticles + FraisDePort` ne déduit pas la remise (`CalculDuPanier.cs:12`). Aucun critère d'US-2 ne parle du montant à payer (`stories/US-2.md:7-11`). En suivant l'option la plus simple qui respecte les critères (`passation.md:6-9`), ce modèle **ne modifie pas** `ATPayer` et n'ajoute pas de soustraction à `Montant`. L'étape d'architecture doit valider ce point explicitement (`research.md:99`).
