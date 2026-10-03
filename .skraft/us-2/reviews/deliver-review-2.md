# Revue DELIVER, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#2.1` **minor** (test) La doc XML du test affirme qu'il « observe ATPayer avec une remise non nulle pour exercer ces deux chemins » (opérateur `+` et `Montant.Soustrait`), mais `FraisDePort` vaut toujours `Montant.Zero` dans `CalculDuPanier.Chiffrer` (voir CalculDuPanier.cs). Le chemin `+` n'est donc exercé qu'avec un opérande nul, ce qui ne prouve pas grand-chose de spécifique à cet opérateur (une permutation de `+`/`-` sur un zéro resterait souvent indétectée si l'autre terme compensait). Le nom du test et son unique assertion ne couvrent que la soustraction de la remise ; l'affirmation sur le « chemin + » est trompeuse pour qui lit ce test isolément. (tests/Tarification.Tests/FactureTests.cs:7)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

- `quality-gates#2.1` **minor** (code) `CompareTo` et `ToString` restent non couverts par aucun test (acceptance ou unitaire), ce qui explique la part restante du déficit de couverture mesuré sur Montant.cs (70 %, 7/10 lignes). Mineur : ces membres n'ont pas de rôle métier actif dans les AC actuels. (src/Tarification.Domaine/Montant.cs:27)
- arbitrage sur `quality-gates#1.1` : **accepted** — FactureTests.cs ajoute un test passant par CalculDuPanier.Chiffrer et observant ATPayer avec remise non nulle : l'opérateur `+` et `Soustrait` sont désormais exercés via la frontière applicative autorisée. Le défect est corrigé.
