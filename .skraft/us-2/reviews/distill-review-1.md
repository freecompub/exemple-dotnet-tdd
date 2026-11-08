# Revue DISTILL, essai 3

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.1` **minor** (test) Le scénario AC-3 écrit les paliers sous la forme abrégée « 10 : 5 % » et « 50 : 12 % », alors qu'AC-1 et AC-2 disent « 10 articles ou plus : 5 % ». Une personne du métier doit deviner que 10 est un nombre d'articles. Cette forme est reprise telle quelle de l'énoncé de la story. (tests/Tarification.UnitTests/Features/panier-remise-par-palier.feature:26) — gravité : Le sens reste déductible du titre du scénario et des autres scénarios ; c'est une simple question de formulation.
- `cold-reader#1.2` **minor** (test) Le scénario AC-4 ne donne pas le prix des deux lignes de 6 articles. Un prix caché de 1 € est fixé dans les étapes (`PrixParDefaut`). Le scénario AC-5 utilise de la même façon « une ligne quelconque ». Dans les deux cas, le lecteur ne voit pas les valeurs qui servent au calcul. (tests/Tarification.UnitTests/Features/panier-remise-par-palier.feature:36) — gravité : La remise attendue est zéro quel que soit le prix, donc l'oubli ne fausse pas la lecture du scénario.

## Lentille test-integrity : APPROVED

- `test-integrity#1.1` **minor** (deliverable) test-plan.md requalifie en non-régression le test hérité AC_1LeClientChiffreUneLigneDePlusieursArticles (US-1), mais ne le justifie nulle part. Les lignes 22-23 ne couvrent que AC_2 et AC_3 de US-1. Le fait établi annonce pourtant une justification pour ce test. (.skraft/us-2/distill/test-plan.md:21) — gravité : Documentation incomplète d'une requalification. Le test est réellement vert dès maintenant et ne cache aucun comportement de US-2 : le risque de théâtre de test est nul.

## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : CHANGES_REQUESTED

- `quality-gates#1.2` **major** (deliverable) « Mandat 4 : GrilleDePaliers.RemisePour — M4 negative, saturé par les AC » affirme une saturation de mutation : aucun résultat de mutation n'est établi par les faits, et la méthode RemisePour n'existe pas dans src/Tarification.Domaine/GrilleDePaliers.cs (seuls Vide et De y figurent). Cette qualité est revendiquée sans avoir été mesurée. (.skraft/us-2/distill/test-plan.md:28) — gravité : Un livrable qui se prévaut d'une qualité non mesurée donne un faux gage de qualité, ce qui est un défaut selon la règle de la lentille.
- `quality-gates#1.3` **major** (deliverable) Le plan ne rend pas compte des 10 tests exécutés (8 réussis, 2 en échec). Les fichiers .feature ne contiennent que 8 scénarios (5 US-2 dans panier-remise-par-palier.feature, 3 US-1 dans panier-chiffrage.feature) et le plan ne dit pas ce qui explique les deux autres. La cohérence entre le rapport d'exécution et le plan ne peut donc pas être vérifiée. (.skraft/us-2/distill/test-plan.md:25) — gravité : Un écart non expliqué entre le nombre de tests exécutés et le plan de test rend le compte rendu rouge/vert non traçable.
- `quality-gates#1.4` **minor** (deliverable) L'étape 3 pose comme règle « le taux le plus élevé parmi les atteints », alors que test-plan.md l.30 déclare les grilles non monotones non spécifiées (option la plus simple, aucun scénario). Le choix entre plus haut taux et plus haut seuil est donc pris sans être noté comme décision ni testé. (.skraft/us-2/distill/impl-plan.md:17) — gravité : Une règle implémentée sans être décidée ni couverte peut diverger silencieusement de l'attendu métier, mais elle n'a pas d'effet sur les scénarios actuels.
- `quality-gates#1.5` **minor** (deliverable) Le plan liste comme non spécifiés l'arrondi, les grilles non monotones et les seuils en double, mais omet la validation de la grille que l'utilisateur a aussi laissée ouverte : seuil < 1 et taux > 100 %. TauxDeRemise.De (src/Tarification.Domaine/TauxDeRemise.cs:11) ne rejette que les taux négatifs, donc un taux de 150 % passe sans erreur sans que le plan le dise. (.skraft/us-2/distill/test-plan.md:30) — gravité : Une règle de validation silencieuse est un angle mort documenté à moitié, sans conséquence sur les tests actuels.
- `quality-gates#1.6` **minor** (deliverable) Les décisions de l'utilisateur (grille unique identique pour toutes les références, remise seulement renseignée dans Facture.Remise) ne sont pas consignées dans le plan. Aucun scénario ni mention ne couvre le fait que Facture.ATPayer (src/Tarification.Application/CalculDuPanier.cs:12) ne déduit pas la remise. Décision métier déjà prise, à signaler à l'humain, sans retour de travail. (.skraft/us-2/distill/test-plan.md:30) — gravité : Une conséquence métier visible pour le client (montant à payer inchangé malgré la remise) n'est couverte par aucun test ni noté dans le plan.
- réfuté : `quality-gates#1.1` **major** Le libellé @ac-2 et @ac-3 désigne deux choses différentes : les scénarios US-2 (tableau l.10-11, rouges attendus l.25) et les tests US-1 ChiffrerUnPanierLigneALigneFeature.AC_2/AC_3 (l.22-23, marqués « role: regression »). Un lecteur peut croire que le scénario US-2 rouge AC-2 ou AC-3 a été requalifié en non-régression, ce que le fait « 2 en échec » contredit. — L'ambiguïté décrite est levée dans le texte même du plan. `.skraft/us-2/distill/test-plan.md:21` annonce que ces entrées sont des « Tests hérités de US-1 (`panier-chiffrage.feature`, `ChiffrerUnPanierLigneALigneFeature`), dont les titres portent AC-1 à AC-3 propres à US-1 ». `.skraft/us-2/distill/test-plan.md:22` précise « Le critère 2 de US-2 est piloté par `RemiseParPalierDeQuantiteFeature.AC_2…` » et `.skraft/us-2/distill/test-plan.md:23` dit la même chose pour le critère 3. Chaque ligne donne le nom de test complet, ce qui distingue ces tests US-1 des scénarios US-2 qui restent rouges (l.25). Un lecteur ne peut donc pas croire qu'un scénario US-2 a été requalifié.
