# Plan d'implémentation — US-2

## Étape 1 — ac-2
- Test : `tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs` (`Ac2_…`)
- Entre par : `CalculDuPanier.Chiffrer`
- Fait émerger : `Montant.Applique`, `GrilleDePaliers.RemisePour`, `Panier.SommeDesRemises`, `Remise` de la facture.

## Étape 2 — ac-3
- Test : `tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs` (`Ac3_…`)
- Entre par : `CalculDuPanier.Chiffrer` — palier au taux le plus élevé parmi les atteints.

## Étape 3 — ac-1
- Test : `tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs` (`Ac1_…`)
- Entre par : `CalculDuPanier.Chiffrer` — régression, seuil non atteint.

## Étape 4 — ac-4
- Test : `tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs` (`Ac4_…`)
- Entre par : `CalculDuPanier.Chiffrer` — régression, calcul par ligne.

## Étape 5 — ac-5
- Test : `tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs` (`Ac5_…`)
- Entre par : `CalculDuPanier.Chiffrer` — régression, grille vide.
