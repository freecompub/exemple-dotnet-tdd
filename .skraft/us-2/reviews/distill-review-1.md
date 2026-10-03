# Revue DISTILL, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, quality-gates | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- **minor** `GrilleDePaliers.De(IEnumerable<Palier> paliers)` ignore complètement son paramètre (`new()` sans jamais lire `paliers`). Sans le commentaire du fichier et `impl-plan.md`, un lecteur ne devinerait pas qu'il s'agit d'un bouchon volontaire plutôt que d'un oubli ou d'un bug : le nom de la méthode et la signature publique laissent croire qu'elle construit réellement une grille à partir des paliers fournis. (src/Tarification.Domaine/GrilleDePaliers.cs:13)
- **minor** `Taux.De(decimal valeur)` ne valide aucune borne, contrairement au précédent établi par `Montant.De` et la convention « constructeur privé + fabrique validante » mentionnée dans les docs de conception. Le nom `De` suggère une fabrique avec garde, ce qui n'est pas le cas ici — incohérence de vocabulaire/attente entre les types du même domaine, documentée comme bouchon mais susceptible de tromper un lecteur qui ne consulte pas `impl-plan.md`. (src/Tarification.Domaine/Taux.cs:13)
- **major** `Facture.ATPayer` ne soustrait toujours pas `Remise` (`SommeDesArticles + FraisDePort`), alors que `Facture.Remise` peut désormais être non nulle via `CalculDuPanier.Chiffrer(Panier, GrilleDePaliers)`. Un lecteur qui découvre uniquement le code (sans le journal de phase) y verra un total facturé incohérent avec le champ `Remise` qu'il expose juste à côté — le commentaire XML de `Facture` (« les remises... restent à zéro tant que les stories correspondantes ne sont pas livrées ») est maintenant obsolète puisque cette story livre justement le calcul de `Remise`. (src/Tarification.Application/CalculDuPanier.cs:10)
- **minor** Les noms de méthodes de test (ex. `Ac3_Un_seul_palier_le_plus_avantageux_s_applique_parmi_10_5_pct_et_50_12_pct`) sont très longs et mélangent chiffres, pourcentages et mots clés du scénario Gherkin ; lisibles en contexte grâce au commentaire du tag @ac-n, mais difficiles à scanner rapidement dans un rapport de tests ou une liste d'erreurs de build. (tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture-compliance-lens : APPROVED

Aucun défaut.


## Lentille quality-gates : APPROVED

Aucun défaut.

