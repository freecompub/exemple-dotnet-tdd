# Plan d'implémentation — US-2

Tous les tests : `tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs`. Entre par : `CalculDuPanier.Chiffrer`.

## Étape 1 — ac-2
- Test : `Ac2_Une_ligne_qui_atteint_le_seuil_obtient_la_remise_du_palier`
- Implémenter `Pourcentage.Applique`, `PalierDeQuantite.EstAtteintPar`, `GrilleDeRemise.RemisePour(LigneDePanier)` et `RemisePour(Panier)` (somme par ligne).

## Étape 2 — ac-3
- Test : `Ac3_Un_seul_palier_s_applique_le_plus_avantageux`
- Retenir, parmi les paliers atteints, celui au taux maximal.

## Étape 3 — ac-1
- Test : `Ac1_Une_ligne_sous_le_seuil_n_obtient_aucune_remise`
- Aucun palier retenu sous le seuil : remise zéro.

## Étape 4 — ac-4
- Test : `Ac4_La_remise_se_calcule_par_ligne_jamais_sur_le_panier_entier`
- Chaque ligne évaluée seule, sans cumul des quantités.

## Étape 5 — ac-5
- Test : `Ac5_Sans_palier_configure_aucune_remise`
- Boucle interne : invariants de `Pourcentage` (0 à 100) et de `PalierDeQuantite`.
