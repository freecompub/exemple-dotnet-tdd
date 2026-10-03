# Revue DELIVER, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.1` **minor** (code) PalierApplicable trie par Taux.Valeur décroissant pour trouver le palier "le plus avantageux", ce qui suppose implicitement que taux plus élevé = plus avantageux parmi les seuils atteints. C'est vrai pour une remise, mais rien dans le nom de la méthode ni un commentaire n'explicite cette hypothèse de tri — un lecteur découvrant ce fichier seul doit déduire la logique en lisant le LINQ plutôt que de la voir nommée (ex. un helper ou un commentaire court sur le critère de comparaison). (src/Tarification.Domaine/GrilleDePaliers.cs:18)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : CHANGES_REQUESTED

- `quality-gates#1.1` **major** (test) L'opérateur `+` (ligne 17) et `Soustrait` (ligne 25) ne sont exercés par aucun test — ils ne servent qu'à `Facture.ATPayer` (Tarification.Application/CalculDuPanier.cs), dont l'impl-plan DISTILL reconnaît explicitement qu'« aucun AC ne porte de valeur explicite sur ATPayer » et que la correction « n'est exercée par aucun test d'acceptance gelé ». Ce n'est pas un cas de l'ADR 0045 (pas de duplication d'un test d'acceptance existant) : c'est un comportement livré sans aucune preuve rouge→vert, ce qui explique une partie du déficit de couverture mesuré sur Montant.cs (70 %, 7/10 lignes). (src/Tarification.Domaine/Montant.cs:17)
- `quality-gates#1.2` **minor** (code) `CompareTo` (ligne 27) et `ToString` (ligne 29) ne sont appelés par aucun test (ni acceptance ni unitaire), contribuant aussi aux lignes non couvertes signalées sur Montant.cs. À surveiller si ces membres prennent une rôle métier plus tard. (src/Tarification.Domaine/Montant.cs:27)
