# Plan de tests — US-2

## Contrat et périmètre

Les cinq critères sont couverts par huit scénarios dans
`features/tarification-remise-quantite.feature`, chacun avec son tag de critère.
Ils sont exécutés par sept méthodes xUnit de
`tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs` (gelées, inchangées)
et une méthode de `tests/Tarification.Tests/RemisePlusieursLignesAcceptanceTests.cs`.
Le marqueur de critère figure dans chaque nom de méthode (`Ac1` à `Ac5`).
Les commentaires des tests recopient les valeurs littérales des critères, notamment
les virgules décimales et les libellés ; les assertions comparent des `Montant` en decimal,
sans dépendre du format d'affichage.

La frontière est `CalculDuPanier.Chiffrer(Panier, ConfigurationDePaliers)` ;
le résultat observable est `Facture.Remise`. Les lignes sont des données d'entrée,
pas des objets dont on teste directement les règles. Des fabriques de test traduisent
les exemples en panier et paliers. Chaque test prépare son propre panier et sa configuration.
Ni dépôt, ni service extérieur, ni moteur Gherkin supplémentaire n'est nécessaire.

Les contrats DESIGN sont explicitement candidats, pas des décisions acquises.
La surcharge et les supports de données concrétisent uniquement le minimum compilable
pour ces exemples. Ils ne réalisent ni validation, ni sélection, ni calcul de remise.
L'appel historique reste inchangé. La déduction de `ATPayer` et le détail public par ligne
restent à examiner ; aucun résultat non tranché n'est imposé par ces tests.

## Matrice de couverture

| Critère / scénario | Test (classe `RemiseParQuantiteAcceptanceTests`) | Use Case Boundary | Layer | Extraction Reason | Double Type | Walking Skeleton | Priorité |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 — sous le seuil | `Ac1_Le_client_ne_recoit_pas_de_remise_sous_le_seuil` | `CalculDuPanier.Chiffrer` | Application | — | Aucun I/O ; bouchon temporaire de l'entrée | A | P2 |
| 2 — au seuil | `Ac2_Le_client_obtient_la_remise_en_atteignant_le_seuil` | `CalculDuPanier.Chiffrer` | Application | — | Aucun I/O ; bouchon temporaire de l'entrée | A, smoke | P1 |
| 3 — meilleur palier, sans cumul | `Ac3_Le_client_beneficie_du_meilleur_palier_sans_cumul` | `CalculDuPanier.Chiffrer` | Application | — | Aucun I/O ; bouchon temporaire de l'entrée | A, smoke | P1 |
| 3 — ordre inversé | `Ac3_Le_meilleur_palier_ne_depend_pas_de_l_ordre` | `CalculDuPanier.Chiffrer` | Application | — | Aucun I/O ; bouchon temporaire de l'entrée | A | P2 |
| 3 — taux non croissants | `Ac3_Le_meilleur_palier_n_est_pas_necessairement_le_plus_grand_seuil` | `CalculDuPanier.Chiffrer` | Application | — | Aucun I/O ; bouchon temporaire de l'entrée | A | P2 |
| 4 — deux références, quantités séparées | `Ac4_Les_quantites_de_references_differentes_ne_se_cumulent_pas` | `CalculDuPanier.Chiffrer` | Application | — | Aucun I/O ; bouchon temporaire de l'entrée | A | P2 |
| 4 — addition des remises de deux lignes éligibles | `RemisePlusieursLignesAcceptanceTests.Ac4_Le_client_recoit_la_somme_des_remises_de_chaque_ligne_eligible` | `CalculDuPanier.Chiffrer` | Application | — | Aucun I/O ; bouchon temporaire de l'entrée | A, smoke | P1 |
| 5 — aucun palier | `Ac5_Le_client_ne_recoit_pas_de_remise_sans_palier_configure` | `CalculDuPanier.Chiffrer` | Application | — | Aucun I/O ; entrée historique sans remise | A | P2 |

Les variantes du critère 3 découlent de « le plus avantageux », sans ajouter de règle :
l'ordre des paliers et le seuil le plus élevé ne remplacent pas la comparaison des avantages.
Le montant 12,00 € exclut aussi un cumul des deux remises.
Le prix 2,00 € du critère 4 et la ligne du critère 5 sont des données de mise en situation,
pas des restrictions supplémentaires du métier.

Le scénario multi-ligne positif reprend la vérification de `consistency-matrix.md` :
deux références différentes, chacune avec 10 articles à 2,00 €, et le palier 10 / 5 %
donnent une remise totale de 2,00 €. Une évaluation limitée à la première ligne rendrait
1,00 € et échouerait. Le contexte à 6 articles rappelle les valeurs du critère 4 ;
le panier effectivement chiffré contient les deux lignes éligibles de 10 articles.

## Rouge attendu et régressions

Le bouchon ignore provisoirement les paliers et rend la remise historique nulle.
Les tests du critère 2, les trois tests du critère 3 et le nouveau test multi-ligne
du critère 4 doivent échouer sur `Assert.Equal` :
1,00 € attendu contre zéro ; 12,00 € attendu contre zéro ; 2,00 € attendu contre zéro.
Une exception « non implémenté », une erreur de compilation ou une assertion de montage
ne seraient pas des preuves acceptables.

Les trois tests déjà verts sont requalifiés en tests de non-régression.
Le rôle `regression` ci-dessous désigne cette protection d'un comportement déjà satisfait,
pas un nouveau comportement à rendre rouge. Les tests restent gelés et inchangés.

- @ac-1 : role: regression — justification : `Tarification.Tests.RemiseParQuantiteAcceptanceTests.Ac1_Le_client_ne_recoit_pas_de_remise_sous_le_seuil` passe déjà car la remise historique vaut 0,00 € ; il protège l'absence de remise pour 9 articles sous le palier « 10 articles ou plus : 5 % ».
- @ac-4 : role: regression — justification : `Tarification.Tests.RemiseParQuantiteAcceptanceTests.Ac4_Les_quantites_de_references_differentes_ne_se_cumulent_pas` passe déjà car la remise historique est nulle ; il protège le non-déclenchement du palier de 10 pour deux lignes de 6 articles de références différentes. Cette requalification ne concerne pas le nouveau test multi-ligne éligible, qui reste rouge.
- @ac-5 : role: regression — justification : `Tarification.Tests.RemiseParQuantiteAcceptanceTests.Ac5_Le_client_ne_recoit_pas_de_remise_sans_palier_configure` passe déjà car aucun palier configuré laisse la remise à 0,00 € ; il protège ce comportement lors du raccordement des paliers.

Ces verts ne prouvent pas à eux seuls le raccordement des paliers. Les cinq rouges positifs
partagent la même frontière ; ils devront devenir verts avec une vraie évaluation des entrées.
Les cinq tests existants de `CalculDuPanierTests` restent inchangés et protègent l'US-1.

## Limites et boucle interne

M4 negative — saturated by AC : éligibilité locale, absence de palier,
sélection du meilleur avantage, absence de cumul et addition des remises de toutes
les lignes sont atteintes par ces scénarios.
Aucun test unitaire de ces règles n'est ajouté.

Les bornes clarifiées (seuil entier >= 1, taux decimal entre 0 % et 100 % inclus,
rejet explicite d'une configuration invalide) restent obligatoires pour l'implémentation.
Leur surface de validation n'étant pas arrêtée par DESIGN, ne pas inventer ici une
exception, un message ou un second cas d'usage public. Les gardes techniques contre
les entrées absentes, les valeurs par défaut et les mutations des collections appartiennent
à la boucle interne après choix de représentation ; aucune branche défensive n'est testée ici.

Ne pas deviner la politique d'arrondi ou le cumul promotionnel : ils relèvent des
questions des stories US-5 et US-3, sans incidence sur les exemples présents.
Aucun critère visuel : aucun scénario `@visual` ni test navigateur.

## Preuve d'exécution

Première exécution par `run_tests` : **8 réussis, 4 en échec, 0 ignoré**.
La compilation a abouti ; les quatre échecs sont classés `assertion`.

| Test | Attendu | Observé | Diagnostic |
| --- | --- | --- | --- |
| `Ac2_Le_client_obtient_la_remise_en_atteignant_le_seuil` | 1,00 € | 0,00 € | Remise au seuil absente |
| `Ac3_Le_client_beneficie_du_meilleur_palier_sans_cumul` | 12,00 € | 0,00 € | Meilleur avantage absent |
| `Ac3_Le_meilleur_palier_ne_depend_pas_de_l_ordre` | 12,00 € | 0,00 € | Meilleur avantage absent avec ordre inversé |
| `Ac3_Le_meilleur_palier_n_est_pas_necessairement_le_plus_grand_seuil` | 12,00 € | 0,00 € | Meilleur avantage absent avec taux non croissants |

Les trois autres tests d'acceptance sont verts ; leur requalification individuelle
en non-régression, avec le rôle `regression` et sa justification, est consignée ci-dessus.
Les cinq tests existants restent verts. Aucun échec de montage, aucune exception
« non implémenté », aucun test ignoré : le rouge provient du montant métier rendu.

Contrôle Gherkin effectué sur tous les tags et étapes : vocabulaire métier,
un seul chiffrage par scénario, aucune route, classe, couche technique ou tag interdit.
Chaque scénario a sa méthode d'acceptance dédiée et recopie les valeurs de son critère.

Exécution de reprise par `run_tests` : **8 réussis, 5 en échec, 0 ignoré**.
Le nouveau test
`Tarification.Tests.RemisePlusieursLignesAcceptanceTests.Ac4_Le_client_recoit_la_somme_des_remises_de_chaque_ligne_eligible`
échoue sur son assertion métier : **2,00 € attendu, 0,00 € observé**.
Les quatre rouges précédents restent identiques. Les tests gelés n'ont pas été modifiés,
aucune source n'a été modifiée, aucun test unitaire n'a été ajouté.
Le défaut `test-integrity#1.1` est couvert par ce nouveau scénario et son test dédié.
