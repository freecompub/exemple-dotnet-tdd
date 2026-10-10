# Revue DISTILL, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.3 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

Aucun défaut.


## Lentille test-integrity : CHANGES_REQUESTED

- `test-integrity#1.1` **major** (test) Le seul scénario multi-ligne attend zéro pour deux lignes inéligibles. Tous les cas de remise positive portent sur une seule ligne : un mutant qui évalue uniquement la première ligne et ignore les suivantes satisfait donc les sept tests. La séparation des quantités est vérifiée, mais pas le calcul et l'addition des remises de chaque ligne, pourtant prévus dans consistency-matrix.md. Ajouter un test d'acceptance passant par Chiffrer avec deux références différentes de 10 articles à 2,00 € et le palier 10 / 5 %, puis assertant Facture.Remise = 2,00 €. Ce test distingue une véritable évaluation par ligne d'une implémentation limitée à la première ligne, sans dupliquer une couverture existante. (tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs:69)

## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

Aucun défaut.

