# Plan d'implémentation — US-2

Ordre de l'extérieur vers l'intérieur. Fichier de test commun :
`tests/Tarification.UnitTests/Features/panier-remise-par-palier.feature` (étapes : `tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs`).

## Étape 1 — ac-2
- Test : `panier-remise-par-palier.feature` (AC-2)
- Entre par : `CalculDuPanier`
- Dedans : `GrilleDePaliers.RemisePour`, `PalierDeQuantite.EstAtteintPar`, `Montant.Applique`, `Panier.SommeDesRemises`, renseigner `Facture.Remise`.

## Étape 2 — ac-1
- Test : `panier-remise-par-palier.feature` (AC-1)
- Entre par : `CalculDuPanier` — seuil « ou plus » : 9 n'atteint pas 10 (déjà vert, régression).

## Étape 3 — ac-3
- Test : `panier-remise-par-palier.feature` (AC-3)
- Entre par : `CalculDuPanier` — un seul palier, le taux le plus élevé parmi les atteints.

## Étape 4 — ac-4
- Test : `panier-remise-par-palier.feature` (AC-4)
- Entre par : `CalculDuPanier` — remise par ligne, jamais sur les quantités cumulées.

## Étape 5 — ac-5
- Test : `panier-remise-par-palier.feature` (AC-5)
- Entre par : `CalculDuPanier` — grille `Vide`, remise 0,00 €.
