# Consistency matrix — US-02

## Réutilisation

| Élément | Choix | Justification |
|---|---|---|
| Bounded context Tarification | Réutiliser tel quel | Recherche US-02, « Key discoveries » ; `docs/architecture/context-map.md`, « Contexte existant » : aucune frontière/intégration nouvelle. |
| Agrégat `Panier` et racine | Étendre | Recherche US-02, « Handoff to DESIGN » ; `docs/architecture/tarification.md`, « Agrégat existant : Panier » : conserver la root et les lignes distinctes, ajouter le calcul pur. |
| Valeurs `LigneDePanier`, `Quantite`, `Montant` | Réutiliser et étendre les opérations nécessaires | Recherche US-02, « Handoff to DESIGN » ; `docs/architecture/tarification.md`, « Valeurs et calcul ». |
| Cas d'usage `CalculDuPanier.Chiffrer` | Étendre | Recherche US-02, « Handoff to DESIGN » ; `docs/architecture/tarification.md`, « Entrée applicative et compatibilité » : accepter les paliers, garder la forme existante. |
| Patterns | Réutiliser Domain/Application et Query simple ; aucun bus, Event Sourcing, saga, repository ou intégration nouvelle | ADR-001/003 ; recherche US-02, « Key discoveries » ; scan : `cqrs-bus`, `event-sourcing` et `saga` détectés `false`. |

Les documents d'architecture et le modèle événementiel existants couvrent déjà le comportement US-02 ; ils sont conservés sans réécriture. Le contrat spécifique de cette story est consigné dans `contracts-us-02.md`.

## Éligibilité ADR

- Classification du déclencheur : déjà décidée par ADR-003, Proposed, qui classe `CalculDuPanier.Chiffrer` en Query sans mutation ni événement. La décision et les artefacts descriptifs concordent ; aucun changement nécessaire.
- CQRS + dispatch bus, Event Sourcing, saga : candidats vérifiés par le structural scan, tous `detected: false`; aucune raison story-driven ne justifie de les adopter.
- ACL : aucune relation entre contextes à établir ; Tarification est le seul contexte concerné.
- Split/merge de contexte : non requis, aucun second contexte n'est impliqué.
- Agrégat traversant une frontière existante : non ; `Panier` reste dans Tarification.
- ADR-001 et ADR-002 Accepted : US-02 ne les contredit pas ; aucune supersession requise.

## Matrice

| Concept | ADR (source of truth) | event-model | diagrams | contracts | Cause | Verdict |
|---|---|---|---|---|---|---|
| `CalculDuPanier.Chiffrer` — Query | ADR-003 : Query | Query | Query | Query | Classification du déclencheur (ADR-003) | PASS |
| `Panier` — Aggregate Root | ADR-003 : Aggregate Root | Aggregate Root | Aggregate Root | Panier (entrée de Query) | Racine existante réutilisée | PASS |
| `Facture` — Read Model | ADR-003 : Read Model | Read Model | Read Model | Facture (retour de Query) | Résultat visible de la slice | PASS |

## Back-propagation journal

| Round | Concept | Artefact rewritten | Before → After | Trigger |
|---|---|---|---|---|

- docs-relied-on: docs/adr/adr-001-decoupage-domaine-application.md, docs/adr/adr-003-classification-chiffrage-panier.md, docs/adr/decisions-index.md, docs/architecture/context-map.md, docs/architecture/tarification.md, docs/domain/event-model/tarification.md

## Final verdict
- consistency-gate: PASS
