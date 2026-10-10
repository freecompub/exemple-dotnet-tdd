# US-2 - ADR existants a reexaminer

## Liste pour la phase de decision

| ADR existant | Statut constate | Reexamen pertinent pour US-2 | Sources |
| --- | --- | --- | --- |
| ADR-001 - Decoupage domaine / application | Accepted | Verifier comment le calcul de palier et la fourniture des paliers communs s'inscrivent dans les responsabilites existantes. La regle est commerciale ; le domaine ne peut pas appeler un service exterieur directement. Ce reexamen n'implique pas de remplacer l'ADR. | `docs/adr/adr-001-decoupage-domaine-application.md:3,15-30` ; `stories/US-2.md:7-11` ; `.skraft/us-2/research/research.md:10-11` |

Le besoin de paliers configures ne suffit pas a etablir un besoin de stockage : US-2 ne decrit ni administration ni persistance des paliers, et ADR-001 differe l'infrastructure jusqu'a un besoin reel. La phase de decision devra distinguer le mode de fourniture des valeurs d'un eventuel besoin de depot. Sources : `stories/US-2.md:6-14` ; `docs/adr/adr-001-decoupage-domaine-application.md:40-42`.

## ADR examine sans remise en cause par US-2

ADR-002 est Accepted et porte sur le format JUnit XML du rapport de tests, pas sur le calcul des remises. La configuration et le projet de tests utilisent deja le logger JUnit ; les criteres US-2 n'introduisent pas de changement de format de rapport. Sources : `docs/adr/adr-002-format-de-rapport-de-tests.md:1-18` ; `.agent-studio/stack.yaml:9-26` ; `tests/Tarification.Tests/Tarification.Tests.csproj:9-11` ; `stories/US-2.md:6-11`.

Le texte d'ADR-002 cite `tests/Dosage.Tests`, alors que le profil et la reference du paquet concernent `tests/Tarification.Tests`. Cet ecart de chemin est documentaire et ne justifie pas un choix architectural pour US-2. Sources : `docs/adr/adr-002-format-de-rapport-de-tests.md:17-18` ; `.agent-studio/stack.yaml:9-10` ; `tests/Tarification.Tests/Tarification.Tests.csproj:9-11`.

## Sortie de cette etape

Cette liste transmet un sujet de reexamen, sans nouvel ADR, changement de statut ou choix de mecanisme technique. Le comportement a couvrir est celui des cinq criteres US-2 ; les contraintes de couches restent celles de l'ADR accepte. Sources : `stories/US-2.md:7-11` ; `docs/adr/adr-001-decoupage-domaine-application.md:3,15-21`.
