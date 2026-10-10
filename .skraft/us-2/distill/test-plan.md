# US-2 — Plan de tests d'acceptance

## Traçabilité et frontière

Chaque scénario de `features/tarification-remise-quantite.feature` est piloté par un test xUnit dans
`tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs`. Le marqueur du critère figure dans
le nom de la méthode (`Ac1` à `Ac5`), jamais dans un attribut ou un commentaire de liaison.
Les commentaires des tests citent les critères pour conserver leurs valeurs exactes, notamment
les virgules décimales et les libellés de palier.

Les tests entrent exclusivement par `CalculDuPanier.Chiffrer` et observent `Facture.Remise`.
Pour les remises positives, ils vérifient aussi `Facture.ATPayer` selon `design/contracts.md` :
19,00 € pour le critère 2 et 88,00 € pour le critère 3. Les fabriques privées construisent
uniquement les données d'entrée ; elles ne calculent aucune remise ni aucun résultat attendu.

| Scénario / critère | Test | Use Case Boundary | Layer | Extraction Reason | Double Type | Walking Skeleton | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Seuil atteint / 2 | `Ac2_Une_ligne_au_seuil_obtient_la_remise` | `CalculDuPanier.Chiffrer` | Application | — | Aucun service externe ; valeurs en mémoire | A | P1 |
| Meilleur palier sans cumul / 3 | `Ac3_Un_seul_palier_le_plus_avantageux_s_applique` | `CalculDuPanier.Chiffrer` | Application | — | Aucun service externe ; valeurs en mémoire | A | P1 |
| Seuil inférieur plus avantageux, deux ordres / 3 | `Ac3_Le_seuil_inferieur_plus_avantageux_gagne_dans_les_deux_ordres(false / true)` | `CalculDuPanier.Chiffrer` | Application | — | Aucun service externe ; valeurs en mémoire | A | P2 |
| Sous le seuil / 1 | `Ac1_Une_ligne_sous_le_seuil_ne_recoit_pas_de_remise` | `CalculDuPanier.Chiffrer` | Application | — | Aucun service externe ; valeurs en mémoire | A | P2 |
| Références différentes / 4 | `Ac4_Deux_references_ne_cumulent_pas_leurs_quantites` | `CalculDuPanier.Chiffrer` | Application | — | Aucun service externe ; valeurs en mémoire | A | P2 |
| Aucun palier / 5 | `Ac5_Aucun_palier_configure_ne_donne_de_remise` | `CalculDuPanier.Chiffrer` | Application | — | Aucun service externe ; valeurs en mémoire | A | P2 |

Les deux scénarios `@smoke` constituent les variantes du squelette : un palier atteint et plusieurs
paliers atteints. Aucun scénario visuel, aucune infrastructure, aucun dépôt ni mock requis.

## Données et discrimination

- Critère 1 : `10 articles ou plus : 5 %`, 9 articles à 2,00 €, remise 0,00 €.
- Critère 2 : `10 articles ou plus : 5 %`, 10 articles à 2,00 €, remise 1,00 €.
- Critère 3 : `10 : 5 %` et `50 : 12 %`, 50 articles à 2,00 €, remise 12,00 €.
  L'égalité exacte distingue le meilleur palier du premier applicable et du cumul.
  La variante ajoute le palier `5 : 15 %` aux deux paliers du critère : pour 50 articles à
  2,00 €, elle attend 15,00 € de remise et 85,00 € à payer. Le meilleur seuil est inférieur
  aux deux autres. Les deux exemples inversent l'ordre de configuration et sont exécutés
  par les deux lignes de la théorie xUnit : une sélection du plus grand seuil échouerait
  dans les deux cas ; une sélection du premier ou du dernier applicable échouerait dans
  l'un des deux cas. L'égalité exacte exclut aussi le cumul (32,00 €).
  Les valeurs du critère d'origine restent citées dans la variante et son test ; 12,00 €
  est le résultat d'origine, pas le résultat attendu après ajout du palier plus avantageux.
- Critère 4 : deux lignes de 6 articles, références différentes, palier de 10.
  Le prix 2,00 € et le taux 5 % sont des données de montage réutilisées des critères précédents,
  pas une nouvelle règle ; la remise attendue est nulle puisque chaque ligne reste sous le seuil.
- Critère 5 : aucun palier, remise 0,00 €. La ligne de 10 articles à 2,00 € réutilise le montage
  du critère 2 pour ne pas confondre absence de paliers et quantité sous le seuil.

## Rouge attendu et régressions

Le bouchon de la nouvelle surcharge appelle le chiffrage existant, qui rend une remise nulle.
Il n'a ni règle de seuil, ni calcul de remise, ni exception « non implémenté ».
Les critères 2 et 3 doivent échouer sur `Assert.Equal` : respectivement 1,00 € et 12,00 €
attendus, 0,00 € obtenu. Les deux exemples supplémentaires du critère 3 attendent 15,00 €
et obtiennent 0,00 €. Les assertions de montant payable restent actives mais suivent celle
de remise ; elles protégeront le raccordement net après implémentation.

Résultat mesuré par `run_tests` après correction de la revue : 8 réussites, 4 échecs,
aucun test ignoré. La compilation aboutit ; les quatre échecs sont classés `assertion` :

| Test rouge | Attendu | Obtenu | Cause |
| --- | --- | --- | --- |
| `Ac2_Une_ligne_au_seuil_obtient_la_remise` | 1,00 € | 0,00 € | Remise au seuil absente |
| `Ac3_Un_seul_palier_le_plus_avantageux_s_applique` | 12,00 € | 0,00 € | Remise du meilleur palier absente |
| `Ac3_Le_seuil_inferieur_plus_avantageux_gagne_dans_les_deux_ordres(false)` | 15,00 € | 0,00 € | Remise du seuil inférieur plus avantageux absente, meilleur palier en premier |
| `Ac3_Le_seuil_inferieur_plus_avantageux_gagne_dans_les_deux_ordres(true)` | 15,00 € | 0,00 € | Même remise absente, meilleur palier en dernier |

- @ac-1 : role: regression — justification : le calcul existant rend déjà 0,00 € pour la ligne de 9 articles ; garde contre une remise indue sous le seuil lorsque le calcul positif sera raccordé.
- @ac-4 : role: regression — justification : le calcul existant rend déjà une remise nulle pour les deux lignes de 6 articles ; garde contre une agrégation indue des quantités de références différentes.
- @ac-5 : role: regression — justification : le calcul existant rend déjà 0,00 € sans palier ; garde du contrat de l'ensemble vide lors du raccordement des paliers.

Une régression verte sur le bouchon nul ne démontre pas à elle seule l'évaluation des paliers :
les tests rouges positifs doivent rester présents pour empêcher une implémentation toujours nulle.
Les cinq tests US-1 existants sont conservés sans modification.

## Limites et boucle interne

M4 negative — saturated by AC : sous le seuil, seuil inclusif, plusieurs candidats dont
un seuil inférieur plus avantageux dans les deux ordres, lignes
indépendantes et ensemble vide sont couverts par les acceptances. Aucun test unitaire ajouté.
La sélection doit maximiser la remise, pas le seuil ni l'ordre de configuration, conformément
au contrat ; le développeur conserve cette règle lors de la boucle interne.

Les branches défensives éventuellement introduites relèvent de la boucle interne, pas de nouveaux
scénarios : valeurs invalides, garde technique, choix de représentation de l'ensemble vide.
Aucune borne de taux, règle de doublon ou politique de rejet n'est inventée.
Le cumul promotionnel reste dans US-3 ; les exemples ici sont exacts au centime et ne fixent
aucune politique générale d'arrondi (US-5). La portée commune des paliers est confirmée par
l'utilisateur. Aucune question métier non résolue n'est nécessaire pour ces scénarios. Le palier supplémentaire
est une donnée d'exemple de la règle « le plus avantageux » déjà définie par DESIGN, pas une
nouvelle règle métier.

## Conformité Gherkin

Chaque scénario a une préparation, un seul chiffrage et un résultat visible. Tous les tags et
étapes sont métier : aucun chemin, verbe HTTP, service, dépôt ou vocabulaire d'infrastructure.
Chaque critère conserve ses valeurs exactes dans son scénario et dans son test.
