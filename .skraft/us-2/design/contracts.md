# Contrats — US-2 : Remise par palier de quantité

Toutes les signatures ci-dessous respectent `docs/adr/adr-001-decoupage-domaine-application.md` :
aucune dépendance externe dans `Tarification.Domaine` ; `Tarification.Application` dépend du
domaine seul. Seuls des noms définis dans `domain-model.md` / `event-model.md` sont cités.

## Gate ADR (pré-draft)

Candidats évalués avec le gate `adr-eligibility-gate` avant toute rédaction d'ADR :

| Candidat | Verdict | Raison |
|---|---|---|
| `Taux`, `Palier`, `GrilleDePaliers` : value-objects à fabrique validante | NOT ELIGIBLE | Q1 YES — `docs/adr/adr-001-decoupage-domaine-application.md` (section Décision) impose déjà que les règles commerciales et types-valeurs vivent dans le domaine, sans dépendance externe ; le style constructeur privé + fabrique `De(...)` est déjà établi par `Montant.De` / `Quantite.De` |
| Nouvelles opérations sur `Montant` (`Multiplie(Taux)`, `Soustrait(Montant)`) | NOT ELIGIBLE | Q1 YES — extension d'un type-valeur existant dans les limites déjà actées par ADR-001 (montants en `decimal`, jamais négatifs), pas une nouvelle frontière architecturale |
| Emplacement de la somme des remises (`Panier` vs `CalculDuPanier`) | NOT ELIGIBLE | Q3 NO — ne change aucune frontière de couche ni n'adopte de pattern au-delà du baseline ; c'est un choix de positionnement de méthode, symétrique à `Panier.SommeDesLignes()` déjà en place |
| Correction de `Facture.ATPayer` (soustraction manquante) | NOT ELIGIBLE | Q3 NO — correction d'un comportement déjà spécifié par la forme de `Facture`, pas une décision structurante |

Conclusion : **aucune ADR n'est rédigée pour US-2** — toutes les décisions relèvent du baseline déjà
acté par ADR-001.

## `Tarification.Domaine`

### `Taux` (nouveau, `readonly record struct`)

```
public readonly record struct Taux
{
    public decimal Valeur { get; }
    public static Taux De(decimal valeur); // lève ArgumentOutOfRangeException si valeur < 0 ou > 1
}
```

- Style identique à `Montant.De` / `Quantite.De` (constructeur privé, fabrique validante) —
  `src/Tarification.Domaine/Montant.cs:7-15`, `src/Tarification.Domaine/Quantite.cs:5-9`.
- Borne `[0, 1]` : seules les valeurs 5 % (`0.05m`) et 12 % (`0.12m`) sont attestées par la story ;
  aucune story consultée n'évoque de remise > 100 % ou négative.

### `Palier` (nouveau, `readonly record struct`)

```
public readonly record struct Palier(Quantite Seuil, Taux Taux);
```

- Positional record simple, sans fabrique validante : aucun invariant croisé entre `Seuil` et
  `Taux` n'est requis par les critères d'acceptation — même style que `LigneDePanier`
  (`src/Tarification.Domaine/LigneDePanier.cs:4`, positional record public sans fabrique).

### `GrilleDePaliers` (nouveau)

```
public sealed class GrilleDePaliers
{
    public static GrilleDePaliers De(IEnumerable<Palier> paliers);
    public static GrilleDePaliers Vide { get; }
    public Palier? PalierApplicable(Quantite quantite);
}
```

- `PalierApplicable` : parmi les `Palier` dont `Seuil.Valeur <= quantite.Valeur`, retourne celui
  dont `Taux.Valeur` est maximal ; `null` si la grille est vide ou si aucun seuil n'est atteint.
- **Règle de sélection (résout le point 3 du passage de relais de `domain-model.md`)** : le
  critère d'acceptation 3 dit littéralement « un seul palier s'applique, le plus avantageux » —
  la remise ne dépend que du taux retenu (`SousTotal` est fixe pour une ligne donnée, quel que
  soit le palier choisi), donc « le plus avantageux » équivaut exactement à « le taux le plus
  élevé parmi les paliers atteints ». Ce n'est pas une règle métier inventée : c'est la lecture
  directe du mot « avantageux » du critère 3, appliquée au cas général (y compris une grille non
  monotone). Aucune question métier supplémentaire n'est donc transmise en aval.
- `Vide` satisfait le critère 5 par construction (`PalierApplicable` renvoie toujours `null`).

### `Montant` — opérations ajoutées

```
public Montant Multiplie(Taux taux);   // Euros * taux.Valeur — toujours >= 0, Taux borné à [0,1]
public Montant Soustrait(Montant autre); // Montant.De(Euros - autre.Euros)
```

- `Multiplie(Taux)` : s'ajoute à `Multiplie(int)` déjà existant
  (`src/Tarification.Domaine/Montant.cs:17-18`), ne le remplace pas (US-1 continue de fonctionner
  avec `SousTotal` qui utilise `Multiplie(int)`).
- `Soustrait(Montant)` : repasse par `Montant.De`, donc lève `ArgumentOutOfRangeException` si le
  résultat est négatif — l'invariant « jamais négatif » n'est pas assoupli. Dans l'usage prévu
  (`Facture.ATPayer`), le résultat ne peut jamais être négatif car une remise de ligne est bornée
  par construction au `SousTotal` de cette même ligne (`Taux` ∈ [0, 1]), donc la somme des remises
  ne peut jamais dépasser `SommeDesArticles`.

### `LigneDePanier` — opération ajoutée

```
public Montant Remise(GrilleDePaliers grille) =>
    grille.PalierApplicable(Quantite) is { } palier ? SousTotal.Multiplie(palier.Taux) : Montant.Zero;
```

- Ne lit que ses propres champs (`Quantite`, `SousTotal`) et la grille reçue en paramètre : aucune
  autre ligne n'intervient — satisfait structurellement le critère 4, dans le même esprit que
  `SousTotal` (`src/Tarification.Domaine/LigneDePanier.cs:6`).

### `Panier` — opération ajoutée

```
public Montant SommeDesRemises(GrilleDePaliers grille) =>
    _lignes.Aggregate(Montant.Zero, (total, l) => total + l.Remise(grille));
```

- Symétrique à `SommeDesLignes()` (`src/Tarification.Domaine/Panier.cs:16`) : même style
  d'agrégation, même visibilité. Chaque terme de la somme est calculé indépendamment par
  `LigneDePanier.Remise`, donc le critère 4 reste respecté (pas d'agrégation de quantités avant
  calcul).

## `Tarification.Application`

### `CalculDuPanier.Chiffrer` — signature modifiée

```
public Facture Chiffrer(Panier panier, GrilleDePaliers grille) =>
    new(panier.SommeDesLignes(), panier.SommeDesRemises(grille), Montant.Zero);
```

- Ajoute le paramètre `GrilleDePaliers grille`, conforme à la commande `ChiffrerPanier` du modèle
  d'événements (« Soumise par le Client, avec le Panier et la GrilleDePaliers en vigueur », voir
  `event-model.md`). C'est un changement de signature : tout appelant existant (tests US-1) doit
  passer `GrilleDePaliers.Vide` pour conserver un comportement de remise nulle.

### `Facture.ATPayer` — correction du calcul

```
public Montant ATPayer => SommeDesArticles.Soustrait(Remise) + FraisDePort;
```

- Corrige le bug signalé en recherche (`research.md`, section Découvertes ;
  `src/Tarification.Application/CalculDuPanier.cs:12` actuel : `SommeDesArticles + FraisDePort`,
  sans soustraire `Remise`). Ce bug devient observable dès qu'US-2 rend `Remise` non nulle ; la
  conception retient de le corriger dans cette même story (voir `consistency-matrix.md`).
