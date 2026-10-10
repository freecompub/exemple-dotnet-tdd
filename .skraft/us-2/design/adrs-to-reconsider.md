# ADR existants a reexaminer — US-2

| ADR existant | Reexamen pour la prochaine phase | Motif source |
| --- | --- | --- |
| ADR-001 — Decoupage domaine / application, Accepted | Verifier comment transmettre la configuration commune, placer validation et calcul, et completer les operations de `Montant` tout en respectant les frontieres. Aucune revision de statut ni nouvelle decision ici. | `docs/adr/adr-001-decoupage-domaine-application.md:3-4,17-33` ; `.skraft/us-2/research/clarifications.md:5-6` ; `.skraft/us-2/design/clarifications.md:5-6` ; `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `src/Tarification.Domaine/Montant.cs:18-25` |
| ADR-002 — Produire du JUnit XML pour les portes d'agent-studio, Accepted | Pas de reexamen motive par le modele metier US-2 ; conserver la decision de rapport de tests dans son perimetre. | `docs/adr/adr-002-format-de-rapport-de-tests.md:3-4,8-17` ; `stories/US-2.md:7-11` |

## Questions d'architecture transmises, non tranchees

- Representation des objets-valeurs de seuil, taux et configuration ; surface de rejet explicite d'une configuration invalide. Sources : `.skraft/us-2/design/clarifications.md:5-6` ; `src/Tarification.Domaine/Quantite.cs:4-12` ; `src/Tarification.Application/CalculDuPanier.cs:20-22`.
- Transmission de la configuration commune et emplacement precis de la selection dans le domaine, sans nouvelle infrastructure imposee. Sources : `.skraft/us-2/research/clarifications.md:5-6` ; `docs/adr/adr-001-decoupage-domaine-application.md:17-30,39-41`.
- Contrat des vues : conserver le brut de `SommeDesArticles`, renseigner `Remise`, examiner la deduction dans `ATPayer` et l'exposition du detail par ligne. Sources : `stories/US-1.md:7-9` ; `stories/US-2.md:7-11` ; `src/Tarification.Application/CalculDuPanier.cs:10-13` ; `stories/US-3.md:11` ; `stories/US-4.md:10`.

Le cumul promotionnel et l'arrondi restent dans les stories qui les portent ; aucune politique supplementaire n'est fixee par ce modele. Sources : `stories/US-3.md:13-15` ; `stories/US-5.md:7-13`.
