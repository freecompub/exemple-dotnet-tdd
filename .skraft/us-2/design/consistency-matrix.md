# Matrice de cohérence

Écrite par le code à chaque essai de DESIGN, d'après la catégorie donnée à chaque nom dans chaque document. Ne pas la modifier.

| Concept | event-model.md | domain-model.md | contracts.md | diagrams.md | ADR-003 | Verdict |
|---|---|---|---|---|---|---|
| `ChiffrerLePanier` | Requête | — | Requête | Requête | — | PASS |
| `Facture` | Vue | Vue | Vue | Vue | — | PASS |
| `Panier` | — | Agrégat | Agrégat | Agrégat | Agrégat | PASS |
| `BaremeDeRemise` | — | Objet-valeur | Objet-valeur | Objet-valeur | Objet-valeur + Agrégat | PASS |
| `PalierDeRemise` | — | Objet-valeur | Objet-valeur | Objet-valeur | — | PASS |
| `TauxDeRemise` | — | Objet-valeur | Objet-valeur | Objet-valeur | — | PASS |
| `Quantite` | — | Objet-valeur | Objet-valeur | Objet-valeur | — | PASS |
| `Montant` | — | Objet-valeur | Objet-valeur | Objet-valeur | — | PASS |

consistency-gate: PASS
