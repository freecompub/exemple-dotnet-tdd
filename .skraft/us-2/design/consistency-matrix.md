# Matrice de cohérence

Écrite par le code à chaque essai de DESIGN, d'après la catégorie donnée à chaque nom dans chaque document. Ne pas la modifier.

| Concept | event-model.md | domain-model.md | contracts.md | diagrams.md | Verdict |
|---|---|---|---|---|---|
| `AjouterUneLigne` | Commande | Commande | Commande | — | PASS |
| `LigneAjoutee` | Événement | Événement | Événement | — | PASS |
| `ChiffrerLePanier` | Requête | — | Requête | Requête | PASS |
| `Facture` | Vue | — | Vue | — | PASS |
| `Panier` | Agrégat | Agrégat | — | — | PASS |
| `Quantite` | — | — | Objet-valeur | — | PASS |
| `Montant` | — | — | Objet-valeur | — | PASS |
| `GrilleDePaliers` | — | — | Objet-valeur | — | PASS |
| `PalierDeQuantite` | — | — | Objet-valeur | — | PASS |
| `TauxDeRemise` | — | — | Objet-valeur | — | PASS |

consistency-gate: PASS
