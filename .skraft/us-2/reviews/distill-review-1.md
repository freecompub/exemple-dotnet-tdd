# Revue DISTILL, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : CHANGES_REQUESTED

- `cold-reader#1.1` **major** (test) Le scénario AC-3 ne distingue pas la règle formulée comme « remise la plus avantageuse » du choix du palier au seuil le plus élevé : avec des taux croissants (5 % au seuil 10, 12 % au seuil 50), ces deux stratégies donnent toutes deux 12,00 €. Or le modèle de domaine et le plan d’implémentation précisent que les taux ne sont pas supposés croissants et que la remise maximale doit être retenue. Ajoutez une acceptation discriminante avec un taux plus élevé sur un seuil inférieur, afin que l’intention métier soit vérifiable sans déduire qu’un seuil supérieur est toujours préférable. (.skraft/us-2/distill/features/tarification-remise-quantite.feature:14)
- `cold-reader#1.2` **minor** (deliverable) La mention « M4 negative — saturated by AC » et la valeur « A » dans la colonne Walking Skeleton ne sont pas définies dans le livrable. Un lecteur découvrant le plan ne peut pas déterminer ce que ces étiquettes signifient ; les expliciter ou employer des libellés compréhensibles rendrait les décisions de test traçables sans contexte implicite. (.skraft/us-2/distill/test-plan.md)

## Lentille test-integrity : CHANGES_REQUESTED

- `test-integrity#1.1` **major** (test) Le test du « plus avantageux » utilise des seuils et taux croissants, avec le meilleur palier en dernière position. Toute la suite laisserait donc passer une sélection du plus grand seuil ou du dernier palier applicable, au lieu du montant maximal. Le DESIGN exige explicitement de vérifier un taux plus avantageux sur un seuil inférieur (consistency-matrix.md), mais cette vérification manque dans les acceptances ; la couverture annoncée comme saturée ne l'est pas sur cette règle. Ajouter une variante d'acceptance avec deux paliers atteints dont le seuil inférieur donne la meilleure remise, et vérifier l'indépendance du résultat à leur ordre. Il ne s'agit pas d'ajouter un test unitaire dupliquant une acceptance existante. (tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs:40)

## Lentille architecture : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

Aucun défaut.

