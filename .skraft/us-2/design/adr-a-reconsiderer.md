# ADR existants à reconsidérer — US-2

ADR présents dans le dépôt : `docs/adr/adr-001-decoupage-domaine-application.md`,
`docs/adr/adr-002-format-de-rapport-de-tests.md`. Aucun autre fichier sous `docs/adr/`.

| ADR | À reconsidérer ? | Motif |
|---|---|---|
| ADR-001 — Découpage domaine / application | **Non**, à appliquer | Le modèle le respecte : règles (`GrilleDePaliers`, `PalierDeQuantite`, `Pourcentage`, `Panier.SommeDesRemises`) dans le domaine (`adr-001:25-26`), grille passée en paramètre (`adr-001:28-30`), montants en `decimal` (`adr-001:32-34`). Sa liste de types du domaine (`adr-001:17-18`) s'allongera, sans changer la décision. |
| ADR-002 — Format de rapport de tests | **Non** pour US-2 | Décision sans lien avec le modèle. Le nom de projet `tests/Dosage.Tests` (`adr-002:18`) est un reliquat ; le projet réel est `Tarification.Tests` (`.agent-studio/stack.yaml:10`) — correction documentaire possible, sans effet sur US-2 (`research.md:47`). |

Un futur ADR qui décrit le modèle d'US-2 doit reprendre `Panier` comme seul agrégat, à l'identique
de `event-model.md` et `domain-model.md`.
