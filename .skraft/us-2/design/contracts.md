# Contracts — US-2 — Remise par palier de quantité

Sources des noms : `.skraft/us-2/design/domain-model.md` (objets-valeurs `PalierDeRemise`,
`GrilleDeRemise`, agrégat `Panier`, extension de `Montant`) et `.skraft/us-2/design/event-model.md`
(requête `Chiffrer`). Aucun nouveau dépôt, aucune nouvelle commande, aucun nouvel événement
(`event-model.md`, sections « Dépôts » et « Événements »).

## Requête `Chiffrer`

Portée par le cas d'usage `CalculDuPanier` (`src/Tarification.Application/CalculDuPanier.cs`,
réutilisé — `domain-model.md`, section Réutilisation).

**Paramètres :**

| Paramètre | Type | Règle |
|---|---|---|
| `panier` | Agrégat `Panier` | Déjà validé à la construction (chaque `LigneDePanier` valide `Quantite` et `Montant` à la fabrique `De(...)`) ; aucune règle supplémentaire introduite par US-2. |
| `grille` | objet-valeur `GrilleDeRemise` | Nouveau paramètre. Si absent de l'appel, vaut `GrilleDeRemise.Vide` — couvre AC-5 sans branche particulière dans le calcul (`domain-model.md`, section « `GrilleDeRemise` »). |

Signature : `Chiffrer(Panier panier, GrilleDeRemise grille) → Facture` (l'ancienne signature
`Chiffrer(Panier panier)` disparaît ; aucun test existant ne l'appelle autrement qu'avec un seul
`Panier` — `tests/Tarification.Tests/CalculDuPanierTests.cs:17,24,32` — ces trois appels seront
mis à jour pour passer `GrilleDeRemise.Vide`, ce qui préserve leur résultat actuel `Remise =
Montant.Zero` par construction).

**Forme du retour :** vue `Facture` (`SommeDesArticles`, `Remise`, `FraisDePort`), inchangée dans
sa forme (`event-model.md`, section Vue). `SommeDesArticles` reste la somme brute des sous-totaux
de ligne (`Panier.SommeDesLignes()`, inchangé — `domain-model.md`, section Agrégats). `Remise` vaut
désormais la somme, sur toutes les lignes du panier, de la remise de chaque ligne prise
isolément :

```
Facture.Remise = Σ (ligne.Remise(grille)) pour chaque ligne de panier.Lignes
```

— jamais un pourcentage calculé sur la somme du panier (AC-4 : la remise se calcule par ligne,
jamais sur le panier entier).

`Facture.ATPayer` n'est pas modifié par cette story : il continue à ne pas soustraire `Remise`
(`CalculDuPanier.cs:11`). Ce point reste un défaut pré-existant hors périmètre, déjà signalé dans
`event-model.md` (section « Point laissé à l'architecture ») et `domain-model.md` (section
« Questions ouvertes pour l'architecture ») : aucun des 5 critères d'acceptation ne teste
`ATPayer`, il n'est donc pas corrigé ici.

## Objet-valeur `PalierDeRemise`

`src/Tarification.Domaine/PalierDeRemise.cs` (nouveau). Suit le patron fabrique validante déjà en
place pour `Montant` et `Quantite` (`domain-model.md`, section « `PalierDeRemise` (nouveau) »).

**Champs :**

| Champ | Type | Règle de validation |
|---|---|---|
| `SeuilMinimal` | `Quantite` | Déjà validé par `Quantite.De(...)` (≥ 1) — aucune règle propre à ajouter. |
| `Taux` | `decimal` | Fabrique `De(...)` lève `ArgumentOutOfRangeException` si `Taux <= 0m` ou `Taux > 1m`. Borne haute retenue : 1 (100 %), une remise ne peut pas dépasser le prix de la ligne — répond à la question ouverte de `domain-model.md` (« Borne haute du taux … à plafonner ou non ? »). |

Fabrique : `PalierDeRemise.De(Quantite seuilMinimal, decimal taux) → PalierDeRemise`.

## Objet-valeur `GrilleDeRemise`

`src/Tarification.Domaine/GrilleDeRemise.cs` (nouveau). Un ensemble de `PalierDeRemise`, unique
pour tout le panier (réponse utilisateur : « Les mêmes paliers s'appliquent à toutes les
références » — `domain-model.md`, section « `GrilleDeRemise` (nouveau) »).

**Construction :**

| Fabrique | Règle de validation |
|---|---|
| `GrilleDeRemise.Vide` | Grille sans aucun palier ; couvre AC-5. |
| `GrilleDeRemise.De(IEnumerable<PalierDeRemise> paliers)` | Aucune règle de validation propre à la collection (une grille vide est déjà couverte par `Vide` ; une grille à un seul palier ou à plusieurs seuils égaux reste valide — aucun critère d'acceptation ne l'interdit). |

**Opération :**

`PalierLePlusAvantageux(Quantite quantite) → PalierDeRemise?` — parmi les paliers dont
`SeuilMinimal.Valeur <= quantite.Valeur`, retourne celui dont `Taux` est le plus élevé, ou `null`
si aucun seuil n'est atteint (AC-1, AC-5). AC-3 : avec les paliers « 10 : 5 % » et « 50 : 12 % »
tous deux atteints par 50 articles, retourne le palier à 12 %, jamais celui au seuil le plus haut
pris par défaut si deux paliers atteints ont le même taux maximal — règle explicite : le taux le
plus élevé gagne, pas le seuil le plus élevé.

## Extension de l'objet-valeur `Montant`

Nouvelle opération sur `src/Tarification.Domaine/Montant.cs` (réutilisé, étendu —
`domain-model.md`, section « Extension de `Montant` »).

`Montant.Pourcentage(decimal taux) → Montant` :

- Précondition : `taux` provient toujours d'un `PalierDeRemise.Taux` déjà validé (`]0, 1]`) ;
  `Pourcentage` ne revalide pas `taux` lui-même (pas de double validation du même invariant),
  mais retourne `Montant.Zero` si `Euros` vaut 0, et lève `ArgumentOutOfRangeException` si `taux`
  est négatif, par cohérence avec `Multiplie(int)` qui rejette déjà un facteur négatif
  (`Montant.cs:20-21`).
- Calcul : `Euros * taux`, arrondi à 2 décimales avec `MidpointRounding.AwayFromZero` (arrondi
  commercial standard — aucun des 5 critères d'acceptation ne tombe sur un cas à arrondir, mais
  l'opération doit en choisir une pour tout taux futur ; `domain-model.md`, question ouverte
  « Règle d'arrondi de `Montant.Pourcentage` »).

## Méthode `LigneDePanier.Remise`

Extension de l'agrégat interne `LigneDePanier` (`src/Tarification.Domaine/LigneDePanier.cs`,
réutilisé, étendu — `domain-model.md`, section Agrégats).

`Remise(GrilleDeRemise grille) → Montant` :

```
palier = grille.PalierLePlusAvantageux(Quantite)
retourne palier is null ? Montant.Zero : SousTotal.Pourcentage(palier.Valeur.Taux)
```

— calculée uniquement à partir de `Quantite` et `SousTotal` de cette ligne, jamais à partir
d'une autre ligne du panier (AC-4).

## Aucun dépôt, aucune commande, aucun événement

Confirmé par `event-model.md` (section Événements : « Aucun ») et `domain-model.md` (section
Dépôts : « Aucun nouveau dépôt ») : `GrilleDeRemise` est une donnée de configuration passée en
paramètre, pas un agrégat persisté, donc aucune section « Dépôt » n'est ouverte ici.
