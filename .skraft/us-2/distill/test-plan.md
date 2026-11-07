# Plan de test — US-2

Fichier de tests : `tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs` (xUnit, aucune doublure en usage dans le projet).

| Scénario | Cas d'usage | Couche | Doublure | Walking skeleton |
|---|---|---|---|---|
| @ac-2 | `CalculDuPanier.Chiffrer` | Application | aucune | oui |
| @ac-3 | `CalculDuPanier.Chiffrer` | Application | aucune | non |
| @ac-1 | `CalculDuPanier.Chiffrer` | Application | aucune | non |
| @ac-4 | `CalculDuPanier.Chiffrer` | Application | aucune | non |
| @ac-5 | `CalculDuPanier.Chiffrer` | Application | aucune | non |

Les bouchons laissent `Remise` à zéro : ac-1, ac-4, ac-5 attendent 0,00 € et passent déjà.

- @ac-1 : role: regression — justification : garde-fou du seuil (9 < 10) ; la remise nulle est le comportement actuel, il ne doit pas régresser quand ac-2 sera implémenté.
- @ac-4 : role: regression — justification : remise nulle déjà obtenue ; verrouille le calcul par ligne contre une implémentation sur le panier entier.
- @ac-5 : role: regression — justification : remise nulle déjà obtenue ; verrouille la grille vide.

Cas limites non tranchés par les critères (hors scénarios) : arrondi des fractions de centime, paliers de même seuil ou de taux décroissant — options les plus simples retenues (passation) ; branches défensives (validation de `Pourcentage`) : boucle interne.
