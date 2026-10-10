# Plan de tests d'acceptance — US-2

## Périmètre et décisions

Sources : `stories/US-2.md`, `design/contracts.md`, `design/consistency-matrix.md`,
`design/clarifications.md` et réponse de RESEARCH sur les paliers communs.
Les questions historiques de RESEARCH sont résolues par les clarifications de DESIGN.
Aucune contradiction active n'a été identifiée.

Les cinq critères sont couverts. Les variantes supplémentaires sont des conséquences
des critères ou des réponses utilisateur, pas de nouvelles règles : ordre des paliers,
taux maximal plutôt que seuil maximal, addition des remises de lignes, déduction du
montant à payer, seuil minimal positif, bornes des taux et rejets explicites.
Les montants à payer sont déduits arithmétiquement des données, avec frais de port nuls.

Les valeurs originales figurent dans chaque scénario et chaque méthode correspondante ;
les variantes citent le critère source en commentaire quand leurs données diffèrent.
Le numéro est dans le nom de chaque test (`Ac1_` à `Ac5_`), jamais dans ses attributs
ou dans un commentaire servant de marqueur. Les tags Gherkin portent `@ac-<n>`.

## Matrice de couverture

Toutes les lignes entrent par `CalculDuPanier.Chiffrer` (commande métier
`ChiffrerPanier`) et observent `Facture` ou le rejet explicite sans facture.
La construction des valeurs d'entrée fait partie de cette frontière : pour les rejets,
le builder conserve les données brutes jusqu'à l'action, afin d'observer aussi une
exception de construction sans appeler directement une politique interne.

| Scénario / exemples | Critère | Test dans `RemiseQuantiteAcceptanceTests` | Use Case Boundary | Layer | Extraction Reason | Double Type | Walking Skeleton | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Seuil atteint | 2 | `Ac2_Le_client_atteint_le_seuil_et_paie_le_montant_remise` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A, smoke | P1 |
| Un seul palier, deux ordres | 3 | `Ac3_Le_client_obtient_un_seul_palier_independamment_de_l_ordre` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A, smoke | P1 |
| Deux lignes éligibles | 4 | `Ac4_Le_client_cumule_les_remises_de_lignes_eligibles_avec_le_meme_bareme` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A | P2 |
| Sous le seuil | 1 | `Ac1_Le_client_reste_sous_le_seuil` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A | P2 |
| Taux supérieur au seuil inférieur | 3 | `Ac3_Le_client_obtient_le_meilleur_taux_et_non_le_plus_grand_seuil` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A | P2 |
| Deux lignes de 6 | 4 | `Ac4_Le_client_ne_cumule_pas_les_quantites_des_references` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A, smoke | P2 |
| Barème vide / non fourni | 5 | `Ac5_Le_client_ne_recoit_pas_de_remise_sans_palier` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A | P2 |
| Panier vide, avec / sans paliers | 5 | `Ac5_Le_client_obtient_une_facture_nulle_pour_un_panier_vide` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A | P2 |
| Seuil 1, taux 0 / 100 | 2 + clarification | `Ac2_Le_client_utilise_les_taux_limites_des_le_premier_article` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A | P2 |
| Seuil 0 / -1 | 3 + clarification | `Ac3_Le_client_ne_peut_pas_chiffrer_avec_un_seuil_invalide` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A | P2 |
| Taux -1 / 101 | 3 + clarification | `Ac3_Le_client_ne_peut_pas_chiffrer_avec_un_taux_hors_bornes` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A | P2 |
| Doublon, taux 5 / 12 | 3 + clarification | `Ac3_Le_client_ne_peut_pas_chiffrer_avec_un_seuil_duplique` | `CalculDuPanier.Chiffrer` | Application | — | Aucun, vrais objets en mémoire | A | P2 |

Deux fichiers Gherkin, 12 scénarios ou plans de scénario, 19 exemples exécutables.
Chaque ligne d'exemples a son cas xUnit ; aucun scénario ne reste documentaire.
Les trois tags smoke représentent les variantes principales. Pas de persistance,
de mocks, d'accès extérieur ou de critère visuel : stratégie A, sans dépôt nécessaire.
Le builder ne calcule ni remise ni facture, ne valide pas les paliers et ne remplace
pas le cas d'usage.

## Assertions et discrimination

Les factures sont comparées par valeurs `Montant`, jamais par affichage ou arrondi.
Chaque facture vérifie remise, somme brute inchangée, frais de port nuls et montant
à payer. Une remise de 12,00 € exclut notamment le cumul de 17,00 € ; les deux ordres
et les taux inversés excluent une sélection fondée sur l'ordre ou sur le seuil seul.
La paire de scénarios à deux références exclut l'agrégation des quantités et vérifie
que le barème commun atteint aussi la seconde référence.

Les rejets attendent `ArgumentOutOfRangeException` pour seuil/taux et
`ArgumentException` pour doublon, suivant les conventions et le contrat DESIGN.
Ils ne prescrivent pas un texte d'erreur absent des décisions métier.
Une facture retournée au lieu du rejet fait échouer l'assertion d'exception.

## Régressions déjà satisfaites

Le calcul existant retourne une remise nulle. Ces cas doivent rester verts, pas être
artificiellement rendus rouges. Leur réussite initiale ne prouve pas la sélection
des paliers ; les scénarios à remise positive et les rejets portent le nouveau rouge.

- @ac-1 : role: regression — justification : `Ac1_Le_client_reste_sous_le_seuil` conserve la remise 0,00 € et le montant à payer 18,00 € déjà obtenus.
- @ac-4 : role: regression — justification : `Ac4_Le_client_ne_cumule_pas_les_quantites_des_references` conserve l'absence de remise pour deux lignes de 6 ; la variante éligible reste à implémenter.
- @ac-5 : role: regression — justification : les deux exemples de `Ac5_Le_client_ne_recoit_pas_de_remise_sans_palier` conservent la remise 0,00 € avec barème vide ou non fourni.
- @ac-5 : role: regression — justification : les deux exemples de `Ac5_Le_client_obtient_une_facture_nulle_pour_un_panier_vide` conservent une facture nulle.
- @ac-2 : role: regression — justification : l'exemple à 0 % de `Ac2_Le_client_utilise_les_taux_limites_des_le_premier_article` donne déjà une remise 0,00 € ; l'exemple à 100 % doit rester rouge.

Les cinq tests existants de `CalculDuPanierTests` restent inchangés : trois sommes
brutes US-1 et deux rejets de quantité/montant. Aucun test unitaire n'est ajouté.

## Discipline M4 et limites

Sélection/calcul : branches observables « aucun palier », « seuil atteint »,
« plusieurs éligibles », « maximum indépendant de l'ordre », « taux nul/plein »,
addition de lignes et barème vide toutes atteintes par l'acceptance.
M4 negative — saturated by AC. Aucune extraction de test de domaine autorisée ici.

Cas nés de l'implémentation, à noter seulement pour la boucle interne : protection
contre une collection modifiée après construction, contournement des invariants par
une valeur par défaut si des structs sont retenues, soustraction monétaire négative,
gardes techniques et éventuels cas d'énumération. Gate `branch_unreachable_via_AC`
à réévaluer sur le code réel ; aucun test de ce type n'est écrit en DISTILL.

Arrondis produisant des fractions de centime, cumul promotionnel et frais de port
relèvent des stories suivantes : aucune valeur ni politique n'est inventée.

## Preuve du rouge

Exécution exclusivement par `run_tests`, réalisée en DISTILL : **12 réussis,
12 en échec, 0 ignoré**, sur 24 tests au total. La compilation a réussi.
Les 19 exemples d'acceptance donnent 12 rouges et 7 verts ; les 5 tests existants
restent verts. Tous les échecs sont classés `[assertion]` par l'outil.

| Tests rouges | Exemples | Assertion métier effectivement en échec |
| --- | --- | --- |
| `Ac2_Le_client_atteint_le_seuil_et_paie_le_montant_remise` | 1 | Remise attendue 1,00 €, obtenue 0,00 € |
| `Ac3_Le_client_obtient_un_seul_palier_independamment_de_l_ordre` | 2 | Remise attendue 12,00 €, obtenue 0,00 € dans les deux ordres |
| `Ac3_Le_client_obtient_le_meilleur_taux_et_non_le_plus_grand_seuil` | 1 | Remise attendue 12,00 €, obtenue 0,00 € |
| `Ac4_Le_client_cumule_les_remises_de_lignes_eligibles_avec_le_meme_bareme` | 1 | Remise attendue 2,00 €, obtenue 0,00 € |
| `Ac2_Le_client_utilise_les_taux_limites_des_le_premier_article` à 100 % | 1 | Remise attendue 2,00 €, obtenue 0,00 € |
| `Ac3_Le_client_ne_peut_pas_chiffrer_avec_un_seuil_invalide` | 2 | `Assert.Throws` : aucune exception ; `ArgumentOutOfRangeException` attendue |
| `Ac3_Le_client_ne_peut_pas_chiffrer_avec_un_taux_hors_bornes` | 2 | `Assert.Throws` : aucune exception ; `ArgumentOutOfRangeException` attendue |
| `Ac3_Le_client_ne_peut_pas_chiffrer_avec_un_seuil_duplique` | 2 | `Assert.Throws` : aucune exception ; `ArgumentException` attendue |

Les assertions sur le montant à payer suivent celle sur la remise : elles seront
exercées dès que cette dernière sera satisfaite, sans prétendre qu'elles sont déjà
vertes pour les exemples rouges. Aucun `NotImplementedException`, aucune
exception artificielle ni calcul attendu reproduit dans le bouchon.

Relecture de conformité Gherkin effectuée sur tous les tags et étapes des deux
fichiers : un déclencheur métier par scénario, résultats visibles, aucune route,
verbe HTTP, classe/service ou notion d'infrastructure dans les étapes, aucun
tag de couche interdit. Aucun scénario visuel à fermer par un navigateur réel.
