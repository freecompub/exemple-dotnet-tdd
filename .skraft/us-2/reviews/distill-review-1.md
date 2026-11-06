# Revue DISTILL, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.1` **minor** (deliverable) Le scénario ac-3 écrit « 10 : 5 % » et « 50 : 12 % » sans dire que ce sont des seuils en nombre d'articles (« 10 articles ou plus »), contrairement aux autres scénarios. Le scénario ac-4 ne donne pas le prix des lignes (la story non plus). « est chiffrée » est un terme technique pour le métier ; « calculée » ou « facturée » se lirait mieux. (.skraft/us-2/distill/features/remise-par-palier.feature:18) — gravité : Gêne de lecture légère ; le sens se déduit du reste du fichier.
- `cold-reader#1.2` **minor** (test) Le scénario ac-3 contient l'étape « Et un seul palier s'applique, le plus avantageux », mais le test ne vérifie que la remise de 12,00 €. Il ne contrôle pas ce qu'affirme cette étape. De même, l'étape « le palier de 10 n'est pas déclenché » (ac-4) n'a pas d'assertion propre. (tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:39) — gravité : Le test porte un nom qui promet plus qu'il ne vérifie, mais la remise attendue suffit à distinguer le cumul de la règle voulue. — aussi : tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:50

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : CHANGES_REQUESTED

- `quality-gates#1.1` **major** (deliverable) La ligne « Mandat 4 : GrilleDeRemise.RemisePour — M4 negative — saturated by AC (toutes les branches atteintes par ac-1..5) » présente une saturation de mutation et une couverture de branches comme acquises. Aucun outil de mutation ni de couverture n'a été exécuté, et aucun de leurs résultats ne figure dans les faits. De plus, RemisePour est un retour constant (Montant.Zero) : il n'a aucune branche, donc « toutes les branches atteintes » n'a pas de sens sur ce code. (.skraft/us-2/distill/test-plan.md:18) — gravité : Un livrable qui se prévaut d'une qualité non mesurée induit en erreur sur la solidité de la suite, ce qui est un défaut majeur.
- `quality-gates#1.2` **major** (test) Ac4 (et de même Ac1 ligne 17 et Ac5 ligne 62) passe déjà contre le bouchon GrilleDeRemise.RemisePour, qui renvoie zéro. Le test-plan (lignes 14 à 16) affirme qu'il « garde le calcul par ligne contre un cumul des quantités » ou « garde la frontière du seuil », mais rien n'établit que ces tests échouent sur une implémentation fautive. Trois critères sur cinq ne pilotent donc pas la phase RED. Le gel de l'empreinte limite la correction : l'arbitrage revient à l'humain. (tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:50) — gravité : Une protection de non-régression affirmée sans démonstration laisse trois critères d'acceptation sans valeur de détection vérifiée. — aussi : tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:17, tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:62
- `quality-gates#1.3` **minor** (test) Le scénario @ac-4 (.feature lignes 27-28) énonce deux étapes : « Alors le palier de 10 n'est pas déclenché » et « Et la remise est de 0,00 € ». Le test n'assert que le montant (0,00 €). L'étape sur le déclenchement du palier n'a pas d'assertion explicite. (tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs:58) — gravité : Une étape du scénario sans assertion laisse passer un déclenchement de palier qui donnerait un montant nul, défaut mineur de fidélité au scénario.
- `quality-gates#1.4` **minor** (test) La règle retenue pour deux lignes de même référence (elles restent distinctes) n'a ni scénario dans le .feature ni test d'acceptance. Elle n'est donc protégée par rien. (.skraft/us-2/distill/test-plan.md:22) — gravité : Une règle de calcul choisie sans test peut changer sans que la suite le détecte, défaut mineur.
- `quality-gates#1.5` **minor** (deliverable) Le libellé « Hors périmètre, non tranché » contredit le choix affiché dans la même phrase (« option la plus simple retenue »). Le lecteur ne sait pas si la question est tranchée ou non. (.skraft/us-2/distill/test-plan.md:22) — gravité : Une décision présentée comme non tranchée fausse la traçabilité des choix métier, défaut mineur.
- `quality-gates#1.6` **minor** (deliverable) Le plan ne rapporte pas le résultat DISTILL_RED (8 réussis, 2 en échec). Il ne dit ni quels tests échouent ni que ce sont vraisemblablement ac-2 et ac-3. Il n'explique pas non plus l'écart entre les 10 résultats rapportés et les 5 tests [Fact] du fichier. (.skraft/us-2/distill/test-plan.md:1) — gravité : Un livrable silencieux sur le résultat du gate RED empêche de rattacher l'état rouge aux scénarios visés, défaut mineur.
- `quality-gates#1.7` **minor** (deliverable) Le .feature n'est lié à aucune étape exécutable : le fichier de tests est en xUnit et ne référence ni Gherkin ni bindings. La traçabilité repose uniquement sur les tags @ac-N et les noms de méthodes, sans vérification automatique. (.skraft/us-2/distill/features/remise-par-palier.feature:1) — gravité : Une spécification d'acceptance non exécutée peut diverger des tests sans que rien ne le signale, défaut mineur.
