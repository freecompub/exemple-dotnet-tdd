# Matrice de cohérence

Écrite par le code à chaque essai de DESIGN, d'après la catégorie donnée à chaque nom dans chaque document. Ne pas la modifier.

| Concept | event-model.md | domain-model.md | contracts.md | diagrams.md | ADR-003 | Verdict |
|---|---|---|---|---|---|---|
| `AjouterLigneAuPanier` | Commande | Commande | Commande | — | — | PASS |
| `LigneAjouteeAuPanier` | Événement | Événement | Événement | — | — | PASS |
| `ConfigurerGrilleDeRemise` | Commande | Commande | Commande | — | — | PASS |
| `GrilleDeRemiseConfiguree` | Événement | Événement | Événement | — | — | PASS |
| `Panier` | Agrégat | Agrégat | — | — | — | PASS |
| `GrilleDeRemise` | Objet-valeur | Objet-valeur | Objet-valeur | Objet-valeur | Objet-valeur | PASS |
| `ChiffrerPanier` | Requête | Requête | Requête | Requête | — | PASS |
| `Facture` | Vue | Vue | Vue | — | — | PASS |
| `LigneDePanier` | — | Entité | — | — | — | PASS |
| `Montant` | — | Objet-valeur | — | — | — | PASS |
| `Quantite` | — | Objet-valeur | — | — | — | PASS |
| `Pourcentage` | — | Objet-valeur | — | — | — | PASS |
| `PalierDeQuantite` | — | Objet-valeur | — | — | — | PASS |

consistency-gate: PASS
