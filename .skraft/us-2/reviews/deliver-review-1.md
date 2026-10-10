# Revue DELIVER, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : CHANGES_REQUESTED

- `cold-reader#1.1` **major** (code) Le calcul choisit le taux maximal mais le type ne borne ni ne valide `Pourcentage`. Or `Montant` interdit les valeurs négatives et `Facture.ATPayer` soustrait la remise du total : un taux négatif échoue lors de `Montant.De`, tandis qu'un taux supérieur à 100 % peut faire échouer le calcul du montant payable. La règle métier sur les taux admissibles n'est pas visible dans ces fichiers, ce qui laisse l'appelant face à une entrée apparemment permise mais à un échec tardif. Rendre l'invariant explicite et rejeter une configuration invalide à sa création, ou exprimer autrement la politique autorisée. (src/Tarification.Domaine/PaliersDeQuantite.cs:7)

## Lentille test-integrity : CHANGES_REQUESTED

- `test-integrity#1.1` **major** (test) L'addition des remises de plusieurs lignes n'est discriminée par aucune acceptance du projet : tous les cas positifs ont une seule ligne, et le seul cas à deux lignes attend zéro. Dans Panier.SommeDesRemises, remplacer `total + paliers.RemisePour(ligne)` par `paliers.RemisePour(ligne)` laisserait donc toute la suite verte tout en ne conservant que la remise de la dernière ligne. La couverture de lignes à 100 % ne protège pas cette règle du DESIGN. Ajouter une acceptance à la frontière Chiffrer avec deux références bénéficiant chacune d'une remise positive différente, et affirmer leur somme dans Facture.Remise ainsi que le montant payable ; par exemple 10 × 2,00 € et 20 × 2,00 €, palier 10 / 5 %, remise totale 3,00 € et montant payable 57,00 €. Aucun test unitaire dupliqué n'est demandé. (tests/Tarification.Tests/RemiseParQuantiteAcceptanceTests.cs:67)

## Lentille architecture : CHANGES_REQUESTED

- `architecture#1.1` **major** (code) La responsabilité du calcul de remise a été déplacée par rapport au DESIGN approuvé : contracts.md attribue explicitement le calcul indépendant à LigneDePanier et la somme à Panier. Ici, PaliersDeQuantite.RemisePour inspecte la quantité et le sous-total de la ligne et effectue tout le calcul ; LigneDePanier reste dépourvue de ce comportement et Panier appelle directement la collection de paliers. Les couches restent conformes à ADR-001, mais la répartition des responsabilités ne respecte pas le modèle retenu. Porter le calcul de remise sur LigneDePanier et faire sommer ces résultats par Panier ; PaliersDeQuantite peut conserver la sélection du palier applicable. (src/Tarification.Domaine/PaliersDeQuantite.cs:5)

## Lentille quality-gates : APPROVED

Aucun défaut.

