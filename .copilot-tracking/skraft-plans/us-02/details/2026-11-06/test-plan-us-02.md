# Test plan — US-02 Remise par palier de quantité

Feature : `docs/features/tarification/remise-par-palier.feature`. Walking Skeleton : stratégie A (tout en mémoire, aucun stockage). Aucun test existant ne couvre une remise (research, « Existing tests ») : aucune ligne `existing`.

| Scenario | Use Case Boundary | Layer | Double Type | Walking Skeleton | Extraction Reason | Priority |
|---|---|---|---|---|---|---|
| Le client obtient la remise quand sa ligne atteint le palier (AC-2) | `CalculDuPanier.Chiffrer(Panier, PaliersDeRemise)` | Application | none (calcul pur, objets réels) | A | — | P1 |
| Le client obtient seulement le palier le plus avantageux (AC-3) | `CalculDuPanier.Chiffrer(Panier, PaliersDeRemise)` | Application | none | A | — | P2 |
| Le client n'obtient aucune remise sous le seuil du palier (AC-1) | `CalculDuPanier.Chiffrer(Panier, PaliersDeRemise)` | Application | none | — | — | P2 |
| Le client n'obtient aucune remise quand ses références différentes n'atteignent pas le palier chacune (AC-4) | `CalculDuPanier.Chiffrer(Panier, PaliersDeRemise)` | Application | none | — | — | P2 |
| Le client n'obtient aucune remise quand aucun palier n'est configuré (AC-5) | `CalculDuPanier.Chiffrer(Panier, PaliersDeRemise)` | Application | none | — | — | P2 |
| Taux de remise hors de 0–100 refusé (valeur technique, contrat `TauxDeRemise`) | `TauxDeRemise.De` | Domain | none | — | branch_unreachable_via_AC | P3 |

M4 negative — saturated by AC : sélection du taux maximal, seuil atteint ou non, absence de palier (aucun test de domaine pour ces branches).

Question ouverte pour le métier : aucune. Cas non décidés par les critères (taux 0 %, seuils répétés) : aucun scénario, rien inventé.
