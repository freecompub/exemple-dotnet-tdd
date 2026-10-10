# US-2 — Plan de tests d'acceptance

## Sources et périmètre

Les cinq critères sont ceux du dossier de passation et de `stories/US-2.md`.
Les contrats validés dans `design/contracts.md` imposent le passage explicite de la grille,
la conservation de la somme brute et la déduction de la remise du montant à payer.
`research/clarification.md` ferme la portée commune des paliers et les invariants de construction.
La coquille d'ADR-002 a été explicitement résolue : projet `tests/Tarification.Tests`, ADR inchangé.

Six scénarios dans `features/remise-par-quantite.feature`, six tests xUnit dans
`tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs`. Aucun test unitaire ajouté.
Les noms `Ac1_` à `Ac5_` relient les résultats aux critères ; les commentaires recopient les
valeurs littérales françaises que les nombres `decimal` du code ne peuvent représenter textuellement.
Chaque test construit son propre panier et sa propre grille via des fabriques de test.
Il appelle le vrai cas d'usage et vérifie la facture retournée, jamais une politique interne isolée.

## Matrice de couverture

| Scénario / critère | Nom du test | Use Case Boundary | Layer | Extraction Reason | Double Type | Walking Skeleton | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Seuil atteint / 2 | `Ac2_Le_client_atteint_le_seuil_de_remise` | `CalculDuPanier.Chiffrer(Panier, GrilleDePaliers)` | Application | — | Aucun I/O ; signatures provisoires des paliers | A, smoke | P1 |
| Meilleur palier unique / 3 | `Ac3_Le_client_beneficie_du_seul_palier_le_plus_avantageux` | `CalculDuPanier.Chiffrer(Panier, GrilleDePaliers)` | Application | — | Aucun I/O ; signatures provisoires des paliers | A, smoke | P1 |
| Juste sous le seuil / 1 | `Ac1_Le_client_reste_juste_en_dessous_du_seuil` | `CalculDuPanier.Chiffrer(Panier, GrilleDePaliers)` | Application | — | Aucun I/O ; signatures provisoires des paliers | A | P2 |
| Références distinctes / 4 | `Ac4_Le_client_ne_cumule_pas_les_quantites_de_references_differentes` | `CalculDuPanier.Chiffrer(Panier, GrilleDePaliers)` | Application | — | Aucun I/O ; signatures provisoires des paliers | A | P2 |
| Grille vide / 5 | `Ac5_Le_client_ne_recoit_pas_de_remise_avec_une_grille_vide` | `CalculDuPanier.Chiffrer(Panier, GrilleDePaliers)` | Application | — | Aucun I/O ; signature provisoire de grille | A | P2 |
| Appel historique / 5 | `Ac5_Le_client_conserve_le_chiffrage_sans_configuration_de_paliers` | `CalculDuPanier.Chiffrer(Panier)` | Application | — | Aucun | A | P2 |

La stratégie A est entièrement en mémoire, sans dépôt à doubler. Les deux smoke sont les
tranches minimales de raccord, non la preuve que le raccord est déjà livré.
Chaque scénario vérifie aussi la somme brute, le montant à payer et les frais de port nuls.
Le montant exact 12,00 € exclut le cumul des deux paliers (qui donnerait 17,00 €).
Les montants complémentaires sont déduits des exemples et de la formule validée, pas d'une règle inventée.
Aucun critère visuel : pas de scénario `@visual`, pas de mesure navigateur nécessaire.

## Rouge attendu et régressions

La surcharge provisoire délègue au comportement existant, sans calcul ni exception « non implémenté ».
Les fabriques passent réellement la configuration à la frontière applicative ; aucun résultat attendu
n'est injecté par un double. Les critères 2 et 3 doivent échouer sur `Facture.Remise` :
respectivement 1,00 € et 12,00 € attendus contre zéro obtenu.
Une erreur de compilation ou une exception de bouchon n'est pas un rouge recevable.

- @ac-1 : role: regression — justification : le chiffrage actuel retourne déjà 0,00 € sous le seuil ; ce cas protège la frontière 9/10 lorsque les remises seront réalisées.
- @ac-4 : role: regression — justification : le chiffrage actuel retourne déjà zéro pour deux lignes de 6 ; ce cas empêchera une future éligibilité fondée sur la quantité totale du panier.
- @ac-5 : role: regression — justification : les deux variantes sans paliers ont déjà une remise 0,00 € ; elles protègent la grille explicitement vide et l'appel historique.

Un vert sous bouchon n'est pas une preuve de réalisation des paliers.
Les cinq tests US-1 de `CalculDuPanierTests` sont conservés sans modification.
Preuve mesurée par `run_tests` : 9 réussis, 2 échecs, 0 ignoré.
Les cinq tests existants et les quatre acceptances de régression passent.
Les deux échecs sont des assertions métier `Assert.Equal`, pas des erreurs de compilation :

| Test | Attendu | Obtenu | Raison du rouge |
| --- | --- | --- | --- |
| `Ac2_Le_client_atteint_le_seuil_de_remise` | 1,00 € | 0,00 € | La remise du seuil atteint n'est pas encore calculée. |
| `Ac3_Le_client_beneficie_du_seul_palier_le_plus_avantageux` | 12,00 € | 0,00 € | La remise du meilleur palier n'est pas encore calculée. |

Les assertions de montant à payer sont présentes mais suivent l'assertion de remise :
elles seront atteintes quand le calcul de remise sera réalisé.

## Limites et boucle interne

M4 negative — saturated by AC pour les branches illustrées : aucun palier atteint,
seuil atteint, plusieurs paliers atteints sans cumul, séparation des lignes, grille vide.
Pas de test de domaine dupliquant ces résultats.

Les invariants clarifiés de construction restent à réaliser dans la boucle interne :
seuil < 1, taux hors ]0 %, 100 %], seuils dupliqués. Les branches défensives (valeurs
par défaut contournant les fabriques, entrées nulles, soustraction négative isolée)
peuvent ouvrir `branch_unreachable_via_AC` : noter et justifier chaque extraction,
ne pas écrire ces tests pendant DISTILL.
La copie immuable et l'absence de mutation sont des obligations du contrat à traiter lors du raccord.
La sélection au maximum, indépendante de l'ordre et de la croissance des taux, demeure obligatoire ;
ne pas remplacer cette règle par « le plus grand seuil » sous prétexte que l'exemple croît.

L'arrondi de restitution et le cumul promotionnel restent des questions des US-5 et US-3 :
aucune valeur devinée ni comportement ajouté ici. Aucun blocage pour les cinq exemples exacts d'US-2.
