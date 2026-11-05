# Domain Model — US-2 — Remise par palier de quantité

## Réutilisation

| Élément | Chemin | Décision |
|---|---|---|
| `Montant` | `src/Tarification.Domaine/Montant.cs` | Étendre : nouvelle opération de pourcentage (voir ci-dessous), le reste réutilisé tel quel. |
| `Quantite` | `src/Tarification.Domaine/Quantite.cs` | Réutiliser tel quel — sert de type pour le seuil d'un palier. |
| `LigneDePanier` | `src/Tarification.Domaine/LigneDePanier.cs` | Étendre : nouvelle méthode qui calcule la remise de la ligne à partir d'une grille. |
| `Panier` | `src/Tarification.Domaine/Panier.cs` | Réutiliser tel quel — aucun invariant ni méthode à ajouter (la remise se calcule ligne par ligne, AC-4, pas au niveau du panier). |
| `CalculDuPanier` | `src/Tarification.Application/CalculDuPanier.cs` | Étendre : prend désormais une grille de paliers en entrée et somme les remises de chaque ligne au lieu d'écrire `Montant.Zero` en dur (ligne 20). |
| `Facture` | `src/Tarification.Application/CalculDuPanier.cs` | Réutiliser tel quel — le champ `Remise` existe déjà, seule sa valeur change. |

Rien à créer dans `Tarification.Application` hormis l'évolution de `CalculDuPanier` ci-dessus :
pas de nouveau cas d'usage, cette story prolonge le seul déclencheur existant (`event-model.md`).

## Agrégats

### `Panier` (inchangé)

Racine : `Panier`. Invariant inchangé : aucun (un panier vide est valide,
`src/Tarification.Domaine/Panier.cs:4`). US-2 n'ajoute aucun invariant au niveau du panier : AC-4
exige explicitement que la remise ne dépende que de la quantité de *chaque ligne*, jamais d'une
somme entre lignes — donc aucune règle transverse au panier n'est à construire.

`LigneDePanier` reste une entité interne au panier (pas de racine propre, pas de dépôt propre) :
elle gagne une méthode de calcul, pas d'identité ni de cycle de vie nouveaux.

```csharp
public sealed record LigneDePanier(string Reference, Quantite Quantite, Montant PrixUnitaire)
{
    public Montant SousTotal => PrixUnitaire.Multiplie(Quantite.Valeur);

    // Nouveau : remise de cette ligne seule, selon le palier le plus avantageux qu'elle atteint.
    public Montant Remise(GrilleDeRemise grille) => ...
}
```

## Objets-valeurs

### `PalierDeRemise` (nouveau)

Un seuil de quantité et un taux de remise associés. Suit le patron déjà en place pour `Montant` et
`Quantite` : constructeur privé, fabrique statique `De(...)` qui valide (architecture-patterns,
« Value Object … Self-validating — construction fails if invariants are violated » ; patron
observé dans `src/Tarification.Domaine/Montant.cs:12-16` et `Quantite.cs:8-9`).

```csharp
public readonly record struct PalierDeRemise
{
    public Quantite SeuilMinimal { get; }
    public decimal Taux { get; }

    public static PalierDeRemise De(Quantite seuilMinimal, decimal taux) => ...
}
```

Invariant à valider par `De(...)`, suivant exactement le patron déjà en place (fabrique qui lève
`ArgumentOutOfRangeException` quand l'invariant est violé — `Montant.cs:12-16`, `Quantite.cs:8-9`) :
un `Taux` en dehors de `]0, 1]` lève `ArgumentOutOfRangeException`. Borne basse : un taux nul ou
négatif n'a pas de sens, comme un montant négatif n'en a pas pour `Montant` (`Montant.cs:12-16`).
Borne haute : une remise ne peut pas dépasser le prix de la ligne qu'elle réduit, donc `Taux` ne
dépasse pas 1 (100 %). Aucun des 5 critères d'acceptation ne teste cette borne haute (tous les
taux donnés — 5 %, 12 % — en sont loin), mais la fabrique doit statuer sur une valeur plutôt que
laisser passer un taux absurde sans le rejeter, comme `Montant.De` et `Quantite.De` le font déjà
pour leurs propres invariants.

### `GrilleDeRemise` (nouveau)

Un ensemble de `PalierDeRemise`, propre à tout le panier (réponse utilisateur : « Les mêmes
paliers s'appliquent à toutes les références » — une seule grille, pas une par référence). Expose
la sélection du palier le plus avantageux pour une quantité donnée :

```csharp
public sealed class GrilleDeRemise
{
    public static GrilleDeRemise Vide { get; } = new([]);

    public static GrilleDeRemise De(IEnumerable<PalierDeRemise> paliers) => ...

    // Parmi les paliers dont le seuil est atteint, celui au taux le plus élevé (AC-3 : « un seul
    // palier s'applique, le plus avantageux » — pas nécessairement celui au seuil le plus haut).
    public PalierDeRemise? PalierLePlusAvantageux(Quantite quantite) => ...
}
```

`GrilleDeRemise.Vide` couvre AC-5 (« aucun palier configuré ») sans cas particulier dans
`LigneDePanier.Remise` : aucun palier n'est jamais atteint, la méthode retourne `Montant.Zero`.

### Extension de `Montant` : nouvelle opération

`Montant` n'a aujourd'hui ni pourcentage ni soustraction (`Montant.cs:1-25`, confirmé par la
recherche). Calculer 5 % de 20,00 € exige une opération sur `Montant` lui-même, pour ne pas
rompre l'encapsulation (sortir `Euros`, calculer dehors, puis `Montant.De(...)` — écarté, cf.
recherche, section Découvertes).

```csharp
public Montant Pourcentage(decimal taux) => ...
```

Suivant le même patron que `Multiplie(int)`, qui rejette déjà un facteur négatif par
`ArgumentOutOfRangeException` (`Montant.cs:20-21`) : `Pourcentage` lève
`ArgumentOutOfRangeException` si `taux` est négatif. Le `taux` provient en pratique toujours d'un
`PalierDeRemise.Taux` déjà validé dans `]0, 1]` par sa propre fabrique (voir ci-dessus), donc ce
cas n'est atteint par aucun des 5 critères d'acceptation — mais l'opération doit rejeter une
entrée hors invariant plutôt que produire un montant absurde, par cohérence avec le reste du type.

Reste à l'architecture : règle d'arrondi si le taux produit plus de deux décimales (aucun des 5
critères ne le teste — tous les exemples donnés tombent juste : 5 % de 20,00 € = 1,00 €, 12 % de
100,00 € = 12,00 €).

## Événements

Aucun. `Chiffrer` est une requête, pas une commande (`event-model.md`, section Déclencheur) : ni
`Panier`, ni `LigneDePanier`, ni la nouvelle `GrilleDeRemise` ne changent d'état persistant, donc
aucun fait au passé n'est à nommer pour cette story.

## Dépôts

Aucun nouveau dépôt. Le projet n'a pas de couche infrastructure et n'en a pas besoin ici
(`docs/adr/adr-001-decoupage-domaine-application.md`, Alternatives : « une couche infrastructure
dès maintenant… sera ajoutée quand un besoin réel la réclamera »). `GrilleDeRemise` est une donnée
de configuration passée à `CalculDuPanier`, exactement comme `Panier` est construit et passé
directement par l'appelant (test d'acceptance ou composition root) — pas un agrégat persisté,
donc pas de `IGrilleDeRemiseRepository`.

## ADR existants à reconsidérer

- `docs/adr/adr-001-decoupage-domaine-application.md` : nomme déjà « paliers de remise » comme
  règle commerciale du domaine (section Contexte) — la décision tactique ci-dessus (nouveau type
  `PalierDeRemise`/`GrilleDeRemise` dans `Tarification.Domaine`, nouvelle opération sur `Montant`)
  en est une application directe, à confirmer en phase d'architecture plutôt qu'à rouvrir.
- `docs/adr/adr-002-format-de-rapport-de-tests.md` : aucun impact, rien à reconsidérer (porte sur
  le format de rapport de tests, pas sur le modèle de domaine).

## Questions ouvertes pour l'architecture

- Règle d'arrondi de `Montant.Pourcentage` quand le résultat a plus de deux décimales (le taux
  valide — `]0, 1]`, `ArgumentOutOfRangeException` sinon — est tranché ci-dessus ; seul l'arrondi
  d'un résultat non entier de centimes reste ouvert).
- `Facture.ATPayer` ne soustrait pas `Remise` (`CalculDuPanier.cs:11`) : défaut pré-existant, hors
  AC d'US-2, signalé mais non résolu ici (voir `event-model.md`, section « Point laissé à
  l'architecture »).
