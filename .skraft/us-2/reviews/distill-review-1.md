# Revue DISTILL, essai 1

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.1` **minor** (deliverable) Le scénario ac-4 ne donne ni prix ni noms de référence : « deux lignes de 6 articles de références différentes ». Le test utilise MUG-01 et STY-07 à 2,00 €, que le lecteur du scénario ne voit pas. Le scénario ac-3 abrège les paliers en « 10 : 5 % » sans reprendre la formule « articles ou plus » des autres scénarios. (.skraft/us-2/distill/features/remise-par-palier.feature:27) — gravité : Le scénario reste compréhensible mais l'exemple concret est caché dans le test, ce qui nuit à la lecture par le métier. — aussi : .skraft/us-2/distill/features/remise-par-palier.feature:20
- `cold-reader#1.2` **minor** (test) Les tests sont dans l'ordre ac-2, ac-1, ac-3… alors que le fichier .feature suit ac-1, ac-2. Le test ac-5 construit la grille avec `GrilleDePaliers.De()` alors que `GrilleDePaliers.Vide` existe et correspond mieux à « aucun palier configuré ». Les références MUG-01/STY-07 ne sont pas expliquées. (tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:72) — gravité : Détail de lisibilité sans impact sur le comportement vérifié. — aussi : tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:16
- `cold-reader#1.3` **minor** (code) Le commentaire de `Facture` affirme que les remises restent à zéro tant que les stories ne sont pas livrées, et `Chiffrer` ignore la grille reçue (`Montant.Zero` en dur). `GrilleDePaliers` n'expose rien de ses paliers (`_paliers` jamais lu). Un lecteur ne voit pas si c'est voulu (squelette à compléter) ou un oubli ; aucun commentaire ne l'indique. (src/Tarification.Application/CalculDuPanier.cs:29) — gravité : Intention peu visible, mais le plan d'implémentation couvre probablement ce squelette ; pas de blocage de lecture du scénario. — aussi : src/Tarification.Domaine/GrilleDePaliers.cs:6

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

- `quality-gates#1.1` **minor** (deliverable) Le plan de test affirme que les cas limites non tranchés (arrondi des fractions de centime, paliers de même seuil ou de taux décroissant) ont reçu des « options les plus simples retenues (passation) », sans dire lesquelles. La décision est donc déclarée mais non traçable : un implémenteur ne sait pas quel comportement est attendu, et aucun test ne le verrouille. (.skraft/us-2/distill/test-plan.md:19) — gravité : Décision déclarée sans contenu : gêne la passation, mais rien n'est encore implémenté et les critères 1 à 5 sont couverts.
- `quality-gates#1.2` **minor** (deliverable) Le plan mentionne des « branches défensives (validation de Pourcentage) », alors que src/Tarification.Domaine/Pourcentage.cs (lignes 8 à 10) ne contient aucune validation : Pourcentage.De accepte n'importe quelle valeur. Le texte décrit un comportement qui n'existe pas dans le code. (.skraft/us-2/distill/test-plan.md:19) — gravité : Écart entre le livrable et le code, sans effet sur les tests actuels, mais de nature à induire en erreur sur ce qui est couvert.
- `quality-gates#1.3` **minor** (code) Le champ _grille est stocké (lignes 21 et 27) mais jamais lu : Chiffrer renvoie Montant.Zero pour la remise, quelle que soit la grille. Le test ac-5 passe donc sans que la logique de grille soit exercée ; c'est le bouchon attendu en DISTILL, mais le caractère volontaire de ce bouchon n'est signalé que par le commentaire de classe. (src/Tarification.Application/CalculDuPanier.cs:29) — gravité : Bouchon voulu et documenté pour la phase RED ; le risque est limité à la lecture du code, pas à un comportement livré.
