# Revue DISTILL, essai 4

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#2.1` **minor** (test) Le scénario AC-3 écrit les paliers sous la forme abrégée « 10 : 5 % » et « 50 : 12 % », alors qu'AC-1 et AC-2 disent « 10 articles ou plus : 5 % ». Une personne du métier doit deviner que 10 est un nombre d'articles. (tests/Tarification.UnitTests/Features/panier-remise-par-palier.feature:26) — gravité : Le sens reste déductible du titre du scénario et des autres scénarios ; c'est une question de formulation.
- `cold-reader#2.2` **minor** (test) Le scénario AC-4 ne donne pas le prix des deux lignes de 6 articles (un prix caché de 1 € est fixé dans les étapes). AC-5 utilise de même « une ligne quelconque ». Le lecteur ne voit pas les valeurs du calcul. (tests/Tarification.UnitTests/Features/panier-remise-par-palier.feature:36) — gravité : La remise attendue est zéro quel que soit le prix, donc l'omission ne fausse pas la lecture.

## Lentille test-integrity : APPROVED

- `test-integrity#2.1` **minor** (deliverable) test-plan.md ne justifie toujours pas individuellement la requalification en non-régression du test hérité AC_1LeClientChiffreUneLigneDePlusieursArticles (US-1). Seuls AC_2 et AC_3 de US-1 le sont (lignes 22-23). (.skraft/us-2/distill/test-plan.md:21) — gravité : Le test est vert et ne pilote rien de US-2 : il n'y a pas de théâtre de test, seulement une justification manquante dans la documentation.

## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

- `quality-gates#2.1` **minor** (deliverable) Non corrigé, noté pour l'humain : l'étape 3 pose « le taux le plus élevé parmi les atteints » comme règle, alors que test-plan.md:35 déclare les grilles non monotones non spécifiées. Le choix entre plus haut taux et plus haut seuil n'est ni consigné comme décision ni couvert par un test. (.skraft/us-2/distill/impl-plan.md:17) — gravité : Une règle appliquée sans décision explicite peut diverger de l'attendu métier, sans effet sur les scénarios actuels.
- `quality-gates#2.2` **minor** (deliverable) Non corrigé, noté pour l'humain : la liste des points non spécifiés omet la validation de la grille que l'utilisateur a laissée ouverte (seuil < 1, taux > 100 %). TauxDeRemise.De (src/Tarification.Domaine/TauxDeRemise.cs:11) ne rejette que les taux négatifs, donc un taux de 150 % passe sans erreur sans que le plan le dise. (.skraft/us-2/distill/test-plan.md:35) — gravité : Une validation silencieuse non documentée reste un angle mort, sans conséquence sur les tests actuels.
- `quality-gates#2.3` **minor** (deliverable) Non corrigé, noté pour l'humain : les décisions de l'utilisateur (grille unique pour toutes les références, remise seulement renseignée dans Facture.Remise) ne sont pas consignées dans le plan. Aucun scénario ni mention ne couvre le fait que Facture.ATPayer (src/Tarification.Application/CalculDuPanier.cs:12) ne déduit pas la remise. (.skraft/us-2/distill/test-plan.md:35) — gravité : Une conséquence métier visible pour le client n'est couverte par aucun test ni notée dans le plan ; décision déjà prise, sans retour de travail.
