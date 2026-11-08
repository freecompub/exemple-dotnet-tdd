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

- `cold-reader#1.1` **minor** (test) Le vocabulaire flotte entre « commande » (étapes Soit/Quand) et « panier » (titre d'AC-4 : « sur le panier entier »). Une personne du métier peut se demander s'il s'agit de deux notions. Le scénario AC-4 ne dit pas non plus que les deux références sont différentes mais à prix inconnu : le prix de 1,00 € est caché dans le code des étapes. (tests/Tarification.UnitTests/Features/remise-par-palier.feature:29) — gravité : Léger flottement de langage ; chaque scénario reste compréhensible sans connaissance technique. — aussi : tests/Tarification.UnitTests/Features/remise-par-palier.feature:31
- `cold-reader#1.2` **minor** (test) La forme abrégée « 10 : 5 % » et « 50 : 12 % » est moins parlante que la forme complète utilisée ailleurs (« 10 articles ou plus : 5 % »). Le sens du premier nombre n'apparaît pas. (tests/Tarification.UnitTests/Features/remise-par-palier.feature:23) — gravité : Lisibilité légèrement réduite sur un seul scénario.

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

- `quality-gates#1.1` **minor** (deliverable) Le plan qualifie AC-1, AC-4 et AC-5 de « role: regression », mais le .feature ne porte aucun marqueur de rôle : les scénarios n'ont que @ac-N et @edge-case. La requalification n'est donc pas traçable dans le fichier de scénarios. (.skraft/us-2/distill/test-plan.md:14) — gravité : Le fait de requalification est documenté dans le plan seulement ; un lecteur du .feature voit des critères d'acceptance ordinaires. — aussi : tests/Tarification.UnitTests/Features/remise-par-palier.feature:7, tests/Tarification.UnitTests/Features/remise-par-palier.feature:28, tests/Tarification.UnitTests/Features/remise-par-palier.feature:35
- `quality-gates#1.2` **minor** (deliverable) Le plan ne rend pas compte de l'exécution DISTILL_RED (8 réussis, 2 en échec, 0 ignoré) et ne dit pas quels scénarios doivent être rouges (attendus : AC-2 et AC-3). Le nombre de résultats (10) ne se rapproche pas des 5 scénarios du .feature, et le plan ne l'explique pas. (.skraft/us-2/distill/test-plan.md:1) — gravité : Le fait rouge est établi par le code ; son absence du plan laisse le lecteur sans lien entre rouge attendu et résultat observé.
- `quality-gates#1.3` **minor** (deliverable) Le plan cite Pourcentage.Applique, BaremeDeRemises.RemiseDe et Panier.RemiseDesLignes comme intérieur à construire ou utiliser, mais ces méthodes n'existent pas dans Pourcentage.cs ni BaremeDeRemises.cs. La liste des bouchons de test-plan.md (ligne 20) ne les mentionne pas non plus. (.skraft/us-2/distill/impl-plan.md:6) — gravité : Le plan et la liste des bouchons se contredisent sur les points d'entrée internes ; l'étape d'implémentation partira d'une référence fausse.
- `quality-gates#1.4` **minor** (deliverable) « validation de Pourcentage (0–100) » est présentée comme cas à écrire, alors que la réponse de l'utilisateur dit que la validation d'un palier est non spécifiée. La borne 0–100 n'apparaît dans aucun critère d'acceptation. (.skraft/us-2/distill/test-plan.md:18) — gravité : Une règle non tranchée est présentée comme cas de test, ce qui l'installe comme règle métier sans décision.
- `quality-gates#1.5` **minor** (deliverable) La décision « sans arrondi » est présentée comme issue, avec renvoi à contracts.md. Ce fichier n'est pas dans le périmètre revu et ne peut pas être vérifié ; la question d'arrondi est signalée dans les faits comme règle métier à demander avant implémentation. (.skraft/us-2/distill/test-plan.md:19) — gravité : Une décision métier est attribuée à un document non vérifiable ; le plan devrait dire que ce cas est non testé et non tranché.
- `quality-gates#1.6` **minor** (test) Le scénario AC-4 ne donne ni les références ni les prix : « MUG-01 » et « STY-07 » à 1,00 € sont codés en dur dans RemiseParPalierSteps.cs (lignes 37, 63-64). Le scénario n'est pas lisible seul et son prix implicite n'apparaît pas dans le texte. (tests/Tarification.UnitTests/Features/remise-par-palier.feature:31) — gravité : Un scénario qui cache ses données ne se vérifie pas à la lecture ; le défaut reste sans conséquence sur le résultat du test.
