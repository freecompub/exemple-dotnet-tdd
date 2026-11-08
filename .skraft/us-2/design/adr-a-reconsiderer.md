# ADR existants à reconsidérer — US-2

ADR présents : `docs/adr/adr-001-decoupage-domaine-application.md`, `docs/adr/adr-002-format-de-rapport-de-tests.md`.

| ADR | À reconsidérer ? | Motif |
|---|---|---|
| ADR-001 — Découpage domaine / application | Non | Le modèle s'y conforme : `GrilleDePaliers`, `PalierDeQuantite`, `TauxDeRemise` et `Panier.SommeDesRemises` vont dans `Tarification.Domaine`, comme l'exige `adr-001:25-26` pour les paliers de remise (`adr-001:8-9`) ; `CalculDuPanier` reste dans l'application (`adr-001:20-21`). La liste des types du domaine (`adr-001:17-18`) s'enrichit sans changer la décision. Aucun stockage requis : la clause `adr-001:40-42` reste valable. |
| ADR-002 — JUnit XML | Non (hors périmètre de US-2) | Concerne le rapport de tests, pas le modèle. Signalement : il cite `tests/Dosage.Tests` (`adr-002:17-18`), projet absent du dépôt (les projets de tests sont `tests/Tarification.Tests` et `tests/Tarification.UnitTests`). |
