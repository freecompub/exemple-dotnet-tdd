# Revue DISTILL, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#2.1` **minor** (deliverable) Le scénario ac-3 écrit « 10 : 5 % » et « 50 : 12 % » sans dire que ce sont des seuils en articles, contrairement aux autres scénarios. « est chiffrée » est un terme technique : « calculée » se lirait mieux pour le métier. (.skraft/us-2/distill/features/remise-par-palier.feature:18) — gravité : Gêne de lecture légère ; le sens se déduit du reste du fichier.
- `cold-reader#2.2` **minor** (test) Le scénario ac-3 contient l'étape « un seul palier s'applique, le plus avantageux », et ac-4 l'étape « le palier de 10 n'est pas déclenché ». Les tests ne vérifient que la remise finale, sans assertion propre à ces étapes. (tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:39) — gravité : La remise attendue suffit à distinguer le cumul de la règle voulue ; l'écart est de lisibilité. — aussi : tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:50

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

Aucun défaut.

- réfuté : `quality-gates#2.1` **major** Le plan affirme que « les cinq tests sont rouges » contre le bouchon, chacun sur son assertion de remise. Or le dernier DISTILL_RED rapporte 5 réussis et 5 en échec, sans dire lesquels. Avec le bouchon à 0,01 €, les cinq tests d'acceptance doivent échouer : le plan ne réconcilie donc pas sa propre affirmation avec le résultat mesuré. Le plan doit soit citer la liste des tests en échec du dernier run, soit corriger l'affirmation. — Le résultat mesuré ne contredit pas le plan, il le confirme. La suite compte 10 tests. `tests/Tarification.Tests/CalculDuPanierTests.cs:16-49` contient les 5 tests de l'US-1 : ils vérifient SommeDesArticles ou les contrats de Quantite et de Montant, jamais la remise, et passent donc quel que soit le bouchon. Les 5 tests d'acceptance attendent une remise de 0,00 €, 1,00 € ou 12,00 € (`tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:24,35,46,58,69`). Or `src/Tarification.Domaine/GrilleDeRemise.cs:16` renvoie 0,01 €, valeur transmise telle quelle par `src/Tarification.Application/CalculDuPanier.cs:29`. Les 5 tests d'acceptance échouent donc forcément, et les 5 réussites sont exactement les tests de l'US-1. L'affirmation de `.skraft/us-2/distill/test-plan.md:14` est donc fidèle au run « 5 réussis, 5 en échec ».
