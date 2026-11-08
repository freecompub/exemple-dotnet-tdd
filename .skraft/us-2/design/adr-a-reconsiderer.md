# ADR existants à reconsidérer — US-2

| ADR | À reconsidérer ? | Raison |
|---|---|---|
| `docs/adr/adr-001-decoupage-domaine-application.md` | Non, confirmé | Le modèle le respecte. Les nouvelles règles (`PalierDeRemise`, `BaremeDeRemises`, `Pourcentage`, `Panier.RemiseDesLignes`) vont dans `Tarification.Domaine` (`adr-001:17-18`, `:25-26`). Le barème est passé au cas d'usage plutôt qu'appelé (`adr-001:28-30`). Les taux et montants sont des `decimal` (`adr-001:32-33`). Pas de couche infrastructure (`adr-001:40-42`). |
| `docs/adr/adr-002-format-de-rapport-de-tests.md` | Non | Il porte sur le format du rapport de tests, sans lien avec le modèle d'US-2. Remarque hors périmètre : il cite `tests/Dosage.Tests` (`adr-002:17-18`), un projet absent de l'arborescence (seuls `tests/Tarification.Tests` et `tests/Tarification.UnitTests` existent). |

Points que la décision d'architecture suivante doit trancher, sans remettre en cause un ADR :
- comment `CalculDuPanier` reçoit le barème, en gardant un constructeur sans argument (`ChiffrageDuPanierSteps.cs:26`) ;
- `contracts.md` doit retirer les `ArgumentNullException` (`contracts.md:23`, `:85`, `:94`). Le modèle n'en prévoit aucune (`domain-model.md`, section « Arguments nuls ») ;
- `ATPayer` laissé sans déduction de la remise (`CalculDuPanier.cs:12`, voir `domain-model.md`).
