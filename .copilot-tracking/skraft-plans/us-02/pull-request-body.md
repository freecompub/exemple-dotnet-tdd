## What changes

Apply shared quantity tiers independently to each basket line, using only the highest eligible rate without combining lines or stacking tiers. Add validated discount-rate and tier values, calculate discounts and net payable amounts in the domain, and extend `Panier`, `LigneDePanier`, and `CalculDuPanier` while keeping the existing no-tier call available.

## Why

Customers buying more of the same reference need the automatic discount described by US-2. ADR-003 classifies basket pricing as a pure Query over the supplied basket and tiers, returning a `Facture` without mutation or events; ADR-001 keeps commercial rules in the domain.

## Decisions applied

- ADR-003 Classification du chiffrage du panier (`docs/adr/adr-003-classification-chiffrage-panier.md`), ratified in this run

<details><summary>Consistency matrix</summary>

From `details/2026-11-06/consistency-matrix-us-02.md` in the tracking folder:

#### Consistency matrix — US-02

#### Réutilisation

| Élément | Choix | Justification |
|---|---|---|
| Bounded context Tarification | Réutiliser tel quel | Recherche US-02, « Key discoveries » ; `docs/architecture/context-map.md`, « Contexte existant » : aucune frontière/intégration nouvelle. |
| Agrégat `Panier` et racine | Étendre | Recherche US-02, « Handoff to DESIGN » ; `docs/architecture/tarification.md`, « Agrégat existant : Panier » : conserver la root et les lignes distinctes, ajouter le calcul pur. |
| Valeurs `LigneDePanier`, `Quantite`, `Montant` | Réutiliser et étendre les opérations nécessaires | Recherche US-02, « Handoff to DESIGN » ; `docs/architecture/tarification.md`, « Valeurs et calcul ». |
| Cas d'usage `CalculDuPanier.Chiffrer` | Étendre | Recherche US-02, « Handoff to DESIGN » ; `docs/architecture/tarification.md`, « Entrée applicative et compatibilité » : accepter les paliers, garder la forme existante. |
| Patterns | Réutiliser Domain/Application et Query simple ; aucun bus, Event Sourcing, saga, repository ou intégration nouvelle | ADR-001/003 ; recherche US-02, « Key discoveries » ; scan : `cqrs-bus`, `event-sourcing` et `saga` détectés `false`. |

Les documents d'architecture et le modèle événementiel existants couvrent déjà le comportement US-02 ; ils sont conservés sans réécriture. Le contrat spécifique de cette story est consigné dans `contracts-us-02.md`.

#### Éligibilité ADR

- Classification du déclencheur : déjà décidée par ADR-003, Proposed, qui classe `CalculDuPanier.Chiffrer` en Query sans mutation ni événement. La décision et les artefacts descriptifs concordent ; aucun changement nécessaire.
- CQRS + dispatch bus, Event Sourcing, saga : candidats vérifiés par le structural scan, tous `detected: false`; aucune raison story-driven ne justifie de les adopter.
- ACL : aucune relation entre contextes à établir ; Tarification est le seul contexte concerné.
- Split/merge de contexte : non requis, aucun second contexte n'est impliqué.
- Agrégat traversant une frontière existante : non ; `Panier` reste dans Tarification.
- ADR-001 et ADR-002 Accepted : US-02 ne les contredit pas ; aucune supersession requise.

#### Matrice

| Concept | ADR (source of truth) | event-model | diagrams | contracts | Cause | Verdict |
|---|---|---|---|---|---|---|
| `CalculDuPanier.Chiffrer` — Query | ADR-003 : Query | Query | Query | Query | Classification du déclencheur (ADR-003) | PASS |
| `Panier` — Aggregate Root | ADR-003 : Aggregate Root | Aggregate Root | Aggregate Root | Panier (entrée de Query) | Racine existante réutilisée | PASS |
| `Facture` — Read Model | ADR-003 : Read Model | Read Model | Read Model | Facture (retour de Query) | Résultat visible de la slice | PASS |

#### Back-propagation journal

| Round | Concept | Artefact rewritten | Before → After | Trigger |
|---|---|---|---|---|

- docs-relied-on: docs/adr/adr-001-decoupage-domaine-application.md, docs/adr/adr-003-classification-chiffrage-panier.md, docs/adr/decisions-index.md, docs/architecture/context-map.md, docs/architecture/tarification.md, docs/domain/event-model/tarification.md

#### Final verdict
- consistency-gate: PASS

</details>

<details><summary>Tests</summary>

From `details/2026-11-06/test-plan-us-02.md` in the tracking folder:

#### Test plan — US-02 Remise par palier de quantité

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

</details>

<details><summary>RED evidence: 6 red commits</summary>

| Commit | Subject | Replay exit code |
| --- | --- | ---: |
| `1635055` | test(us-02): add failing acceptance test for quantity tier discount | 1 |
| `cad2afa` | test(us-02): keep first acceptance test red on empty skeleton | 1 |
| `67c0943` | test(us-02): demand net payable after the reached tier discount | 1 |
| `9d52b7f` | test(us-02): require only the most advantageous quantity tier | 1 |
| `168e5a0` | test(us-02): refuse a tier discount below its quantity threshold | 1 |
| `2ed4fb0` | test(us-02): reject rates outside the contracted percentage range | 1 |

Output excerpts of the replays are not recorded yet.

</details>

<details><summary>Quality gates: 4 passed</summary>

| Component | Gate | Command | Result | Time | Evidence |
| --- | --- | --- | --- | ---: | --- |
| exemple-dotnet-tdd | build | `dotnet build --nologo` | pass | 1 s | `gates/exemple-dotnet-tdd/build-2.log` |
| exemple-dotnet-tdd | format | `dotnet format --verify-no-changes` | pass | 3 s | `gates/exemple-dotnet-tdd/format-2.log` |
| exemple-dotnet-tdd | test | `dotnet test --nologo` | pass | 1 s | `gates/exemple-dotnet-tdd/test-2.log` |
| exemple-dotnet-tdd | mutation | `node "/Users/b283ko/.copilot/installed-plugins/freecompub-skraft-plugin/skraft/skills/quality-gates-dotnet/scripts/mutation-core.mjs" --root . --evidence .copilot-tracking/skraft-gates/mutation --since {baseSha}` | pass | 16 s | `gates/exemple-dotnet-tdd/mutation-1.log` |

</details>

<details open><summary>Review: 2 to decide, 7 notes, 1 refuted</summary>

**design_review** · 1 pass · lenses reviewer · refuter standard

| Status | Severity | Lens | Location | Finding | Why |
| --- | --- | --- | --- | --- | --- |
| To decide | blocker | consistency · G1 Every structural commitment has an ADR (F1) | `docs/architecture/context-map.md:14` | The diagram presents Tarification as a Core bounded context, but no ADR explicitly decides or justi… | one lens alone, against the lenses that passed; refuted: docs/architecture/context-map.md:9 décrit Core comme une responsabilité existante, sans nouvelle frontière ni service, fondée sur ADR-001. .copilot-tracking/skraft-plans/us-02/details/2026-11-06/consistency-matrix-us-02.md:7,13 confirme la réutilisation du contexte et la conservation des diagrammes sans réécriture. La lens limite leur examen aux ajouts ou modifications du patch ; design.patch est vide. Ce contexte inchangé ne justifie donc pas de renvoyer cette passe. |

**distill_review** · 2 passes · lenses reviewer · refuter standard

| Status | Severity | Lens | Location | Finding | Why |
| --- | --- | --- | --- | --- | --- |
| To decide | high | business-alignment · G3 Business vocabulary (F1) | `docs/features/tarification/remise-par-palier.feature:10` | The action « chiffre son panier » is not part of the story's domain vocabulary. | one lens alone, against the lenses that passed; refuted: tests/Tarification.UnitTests/Features/panier-chiffrage.feature:10 already uses « le client chiffre son panier »; contracts-us-02.md:7 names Chiffrer as the Query, so the action is established in the project documents. |
| Note | high | business-alignment · G3 Business vocabulary (F2) | `docs/features/tarification/remise-par-palier.feature:12` | « Montant à payer » is not part of the story's domain vocabulary. | new on a line unchanged since pass 1 |
| Note | high | business-alignment · B1 Story scope (F3) | `docs/features/tarification/remise-par-palier.feature:12` | Each scenario also specifies a « montant à payer », an outcome the story does not ask for. | new on a line unchanged since pass 1 |
| Note | blocker | boundary-enforcement · G7 Layer boundary compliance (F1) | `.copilot-tracking/skraft-plans/us-02/details/2026-11-06/test-plan-us-02.md:12` | The test-plan scenario for rejecting a discount rate outside 0–100 targets the Domain factory TauxD… | new on a line unchanged since pass 1 |

**deliver_review** · 2 passes · lenses reviewer · refuter standard

| Status | Severity | Lens | Location | Finding | Why |
| --- | --- | --- | --- | --- | --- |
| Note | medium | architecture-boundaries · G10 Object Calisthenics on Domain (F1) | `src/Tarification.Domaine/Panier.cs:8` | L’agrégat Panier expose sa collection par un getter public, contrairement à la règle qui interdit l… | new on a line unchanged since pass 1 |
| Note | medium | architecture-boundaries · G10 Object Calisthenics on Domain (F2) | `src/Tarification.Domaine/LigneDePanier.cs:4` | LigneDePanier a trois attributs d’instance, au-delà du maximum de deux. | new on a line unchanged since pass 1 |
| Note | medium | architecture-boundaries · G10 Object Calisthenics on Domain (F3) | `src/Tarification.Domaine/LigneDePanier.cs:4` | La référence métier est représentée par le type primitif string au lieu d’un type enveloppe. | new on a line unchanged since pass 1 |
| Note | medium | architecture-boundaries · G10 Object Calisthenics on Domain (F4) | `src/Tarification.Domaine/ChiffrageDuPanier.cs:6` | Le nom ATPayer est une abréviation dans le domaine. | new on a line unchanged since pass 1 |

<details><summary>1 refuted</summary>

| Status | Severity | Lens | Location | Finding | Why |
| --- | --- | --- | --- | --- | --- |
| Refuted | medium | test-integrity · G7 No test theater (F1) | `tests/Tarification.UnitTests/Features/RemiseParPalier/ChiffrageNetTests.cs:10` | Unplanned test (C12): this standalone Application test is not a row in the test plan or a step in t… | The ordered test plan at .copilot-tracking/skraft-plans/us-02/details/2026-11-06/ordered-tests-us-02.md:9 explicitly plans a unit Application test for AC-2 net payable after discount, matching ChiffrageNetTests. (refuted on pass 1) |

</details>

</details>

<details><summary>Screenshots</summary>

None recorded: this run took no screenshots (no visuals step, or no front end in skraft-config.json).

</details>

## Out of scope and limitations

The query does not persist a sale, reserve or freeze tiers for a later order, or retain pricing history (ADR-003). It introduces no new rounding rule.

<details><summary>Run summary</summary>

running

| Step | Phase | Visits | Attempts | Retries | Time | Cost | Outcome |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| research | RESEARCH | 1 | 2 | 1 | 4 min 46 s | - | done |
| design | DESIGN | 1 | 1 | 0 | 41 s | - | done |
| design_review | DESIGN | 1 | 1 | 0 | 1 min 15 s | - | approved |
| adr | DESIGN | 1 | 1 | 0 | 0 s | - | answered |
| distill | DISTILL | 2 | 2 | 1 | 3 min 06 s | - | done |
| distill_review | DISTILL | 2 | 2 | 1 | 3 min 13 s | - | approved |
| deliver | DELIVER | 2 | 2 | 1 | 9 min 19 s | - | done |
| gates | DELIVER | 2 | 2 | 1 | 10 s | - | pass |
| deliver_review | DELIVER | 2 | 2 | 1 | 3 min 17 s | - | approved |
| mutation | DELIVER | 1 | 1 | 0 | 16 s | - | pass |
| visuals | DELIVER | 1 | 1 | 0 | 0 s | - | skipped |
| pr_writer | PUBLISH | 1 | 1 | 0 | 49 s | - | done |
| publish | PUBLISH | 1 | 1 | 0 | 0 s | - | in progress |
| Total | | | 19 | 6 | 26 min 53 s | - | |

To find the tests that kill no mutant on their own, the developer runs `/skraft:prune-tests` on a component; it proposes, the developer decides each test.

</details>

<details><summary>AI disclosure</summary>

This pull request was prepared by skraft with AI agents on the model families economy, implementer, planner, researcher, reviewer, standard (the host named no model). What changes, Why and Out of scope were written by the pr-writer agent; every other section is rendered by the engine from the run's journal. A human reviews it before it merges.

</details>
