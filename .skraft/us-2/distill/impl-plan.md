# Plan d'implémentation — US-2

## Étape 1 — ac-2
- Test : `tests/Tarification.UnitTests/Features/remise-par-palier.feature` (AC-2), étapes `tests/Tarification.UnitTests/Steps/RemiseParPalierSteps.cs`
- Entre par : `CalculDuPanier`
- Intérieur : `Pourcentage.Applique`, `BaremeDeRemises.RemiseDe`, `Panier.RemiseDesLignes`

## Étape 2 — ac-1
- Test : même feuille de scénarios (AC-1)
- Entre par : `CalculDuPanier` (seuil inclusif : 9 reste sous le palier)

## Étape 3 — ac-3
- Test : même feuille de scénarios (AC-3)
- Entre par : `CalculDuPanier` (palier le plus avantageux, un seul)

## Étape 4 — ac-4
- Test : même feuille de scénarios (AC-4)
- Entre par : `CalculDuPanier` (évaluation ligne par ligne)

## Étape 5 — ac-5
- Test : même feuille de scénarios (AC-5)
- Entre par : `CalculDuPanier` (barème `Aucun`)
