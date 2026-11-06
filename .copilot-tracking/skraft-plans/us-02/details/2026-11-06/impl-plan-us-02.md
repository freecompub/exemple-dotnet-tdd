# Implementation plan — US-02 Remise par palier de quantité

Ordre extérieur-intérieur, une tranche par étape. Le squelette (signatures vides) existe déjà : `PaliersDeRemise`, `PalierDeRemise`, `TauxDeRemise`, `CalculDuPanier.Chiffrer(Panier, PaliersDeRemise)`. Règle de calcul dans Domain (`Panier`, `LigneDePanier`, `ChiffrageDuPanier`…), Application ne fait que mapper vers `Facture`.

| Étape | Scénario (ligne du plan de test) | Fichier | Test / classe | Frontière | Double |
|---|---|---|---|---|---|
| 1 | AC-2 palier atteint (P1) — déjà écrit, rouge | tests/Tarification.UnitTests/Features/RemiseParPalier/RemiseParPalierAcceptanceTests.cs | `Le_client_obtient_la_remise_quand_sa_ligne_atteint_le_palier` | `CalculDuPanier.Chiffrer(Panier, PaliersDeRemise)` | aucun |
| 2 | AC-3 palier le plus avantageux (P2) | même fichier | `Le_client_obtient_seulement_le_palier_le_plus_avantageux` | idem | aucun |
| 3 | AC-1 sous le seuil (P2) | même fichier | `Le_client_n_obtient_aucune_remise_sous_le_seuil_du_palier` | idem | aucun |
| 4 | AC-4 deux lignes de 6 (P2) | même fichier | `Le_client_n_obtient_aucune_remise_quand_ses_references_n_atteignent_pas_le_palier_chacune` | idem | aucun |
| 5 | AC-5 aucun palier (P2) | même fichier | `Le_client_n_obtient_aucune_remise_quand_aucun_palier_n_est_configure` | idem | aucun |
| 6 | Taux hors 0–100 (P3, `branch_unreachable_via_AC`) | tests/Tarification.UnitTests/Domaine/TauxDeRemiseTests.cs | `Un_taux_hors_de_0_a_100_est_refuse` | `TauxDeRemise.De` | aucun |

Compatibilité : `Chiffrer(Panier)` équivaut à des paliers vides (couvert par l'étape 5 et les scénarios US-1 existants).
