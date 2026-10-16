# Plan de test — US-2

## Sources et conventions acquises

La recherche (`../research/research.md`, « Conventions du projet ») fait foi :
xUnit, `[Fact]`, noms français avec underscores, objets réels, helper de construction
des lignes, assertions sur `Montant`, aucune doublure. Le fichier dédié
`tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs` respecte l'emplacement
des tests d'acceptance imposé par la passation sans modifier les tests US-1.
Les marqueurs sont dans les noms des tests, pas dans leurs attributs ou commentaires.

Le point d'entrée de `ChiffrerLePanier` est `CalculDuPanier.Chiffrer`, nommé dans
`../design/contracts.md`. Les tests construisent les données de domaine, puis
entrent uniquement par ce cas d'usage et observent la `Facture` retournée.
La clarification `../design/clarifications.md` impose de déduire la remise du total :
les deux exemples avec remise vérifient aussi le brut, le port nul et le net.

## Matrice de couverture

| Scénario | Cas d'usage | Couche | Doublure | Walking skeleton |
|---|---|---|---|---|
| @ac-1 — sous le seuil | `CalculDuPanier.Chiffrer` | Application | aucune | non |
| @ac-2 — seuil exact et total net | `CalculDuPanier.Chiffrer` | Application | aucune | oui |
| @ac-3 — un seul palier, le plus avantageux | `CalculDuPanier.Chiffrer` | Application | aucune | non |
| @ac-4 — indépendance des deux lignes | `CalculDuPanier.Chiffrer` | Application | aucune | non |
| @ac-5 — barème explicitement vide et appel historique sans barème | `CalculDuPanier.Chiffrer` | Application | aucune | non |

Six scénarios Gherkin et six tests `[Fact]`, avec deux parcours pour le dernier
critère. Le walking skeleton est livré en premier : configuration, ligne réelle,
entrée Application, remise observable et total net. Pas de dépôt, de service
extérieur, de navigateur ni de framework Gherkin à ajouter.

## Données et assertions

| Critère | Nom du test | Assertions métier |
|---|---|---|
| 1 | `Ac1_Une_ligne_sous_le_seuil_ne_recoit_pas_de_remise` | remise 0,00 € |
| 2 | `Ac2_Une_ligne_au_seuil_recoit_la_remise_deduite_du_total` | remise 1,00 €, brut 20,00 €, port 0,00 €, net 19,00 € |
| 3 | `Ac3_Seul_le_palier_le_plus_avantageux_est_applique` | remise 12,00 €, brut 100,00 €, port 0,00 €, net 88,00 € |
| 4 | `Ac4_Deux_references_ne_cumulent_pas_leurs_quantites` | remise 0,00 € |
| 5 | `Ac5_Un_bareme_vide_ne_donne_aucune_remise` | remise 0,00 € |
| 5 | `Ac5_L_appel_sans_bareme_ne_donne_aucune_remise` | remise 0,00 € |

Chaque test cite littéralement les valeurs de son critère ; les décimaux C#
utilisent le point, les commentaires conservent donc aussi les virgules et les
libellés exacts. Les références des articles sont des données de construction.
Pour les critères 4 et 5, 2,00 € est un prix positif de fixture réutilisé des
exemples, pas une nouvelle règle métier. Le panier du critère 5 contient une
ligne atteignant 10 : l'absence de remise ne dépend pas d'un panier vide.

## État initial et régressions

Les signatures provisoires ne calculent rien : la nouvelle surcharge délègue
au chiffrage existant, qui retourne une remise nulle. Aucun bouchon ne lève
« non implémenté ». Les tests 2 et 3 doivent être rouges sur `Assert.Equal`
de la remise, et non sur une erreur de compilation ou de construction.

- @ac-1 : role: regression — justification : le chiffrage existant retourne déjà une remise nulle ; ce test empêchera une application prématurée du seuil.
- @ac-4 : role: regression — justification : le chiffrage existant retourne déjà zéro ; ce test détectera la mutualisation des quantités lors de l'ajout de la règle.
- @ac-5 : role: regression — justification : le chiffrage existant sans barème et la surcharge provisoire avec barème vide retournent déjà zéro ; les deux tests préservent ces parcours.

Mesure DISTILL via `run_tests` : 9 réussites, 2 échecs, aucun test ignoré.
Les deux échecs sont des assertions métier : `Ac2_Une_ligne_au_seuil_recoit_la_remise_deduite_du_total`
attend 1,00 € et reçoit 0,00 € ; `Ac3_Seul_le_palier_le_plus_avantageux_est_applique`
attend 12,00 € et reçoit 0,00 €. Les quatre nouveaux tests de régression et
les cinq tests existants passent. Aucune erreur de compilation ni exception
de bouchon ne masque les résultats.

## Limites et boucle interne

Les cinq critères sont tranchés ; aucune question bloquante n'est nécessaire.
Les bornes 0 % et 100 % et les doublons sont tranchés par DESIGN :
leur contrat reste à respecter pendant DELIVER, sans inventer de comportement.
L'arrondi et le cumul promotionnel ne sont pas testés dans US-2.

M4 negative — saturated by AC : les comportements ordinaires de sélection
(sous le seuil, seuil atteint, plusieurs candidats, lignes indépendantes,
barème vide) sont couverts par les parcours Application ; aucun test de domaine
dupliquant ces comportements n'est écrit.
Les gardes techniques des valeurs par défaut, seuils invalides et taux hors
bornes appartiennent à la boucle interne si une branche défensive les nécessite
(`branch_unreachable_via_AC`). Ne pas les encoder en scénarios supplémentaires.
La copie immuable du barème et les variantes de configuration clarifiées
(doublons, taux limites, ordre des paliers) devront être examinées à
l'implémentation ; aucun résultat métier non tranché n'est supposé ici.
