---
adr: 003
title: Classification du chiffrage du panier
status: Accepted
chosen: Query
decision: >
  Nous classons le chiffrage du panier comme une Query pure sur le panier et les paliers fournis, sans mutation ni événement, retournant une Facture.
supersedes: null
date: 2026-11-06
ratified_by: "human 2026-11-06"
---

# ADR-003: Classification du chiffrage du panier

**Status:** Accepted
**Date:** 2026-11-06

## Context

US-2 demande de calculer une remise par ligne selon des paliers communs et de choisir la remise admissible la plus avantageuse. La clarification humaine exige de soustraire cette remise du montant à payer. Ni l'histoire ni sa clarification ne demandent d'enregistrer une commande, une facture ou une modification du panier.

La recherche, sections « Key discoveries » et « Handoff to DESIGN », établit que le cas d'usage existant reçoit déjà le panier et retourne un résultat de calcul. ADR-001 attribue les règles commerciales au domaine et leur orchestration à l'application. La classification doit distinguer un résultat commercial observable d'un changement d'état durable : produire un résultat n'est pas enregistrer une vente.

## Decision

Nous classons `CalculDuPanier.Chiffrer` comme une **Query**, opérant sans mutation sur le `Panier` existant (Aggregate Root) et les paliers fournis, et retournant `Facture` (Read Model) ; elle ne produit aucun Domain Event, y compris lorsqu'une remise est non nulle.

## Consequences

**Positive:**
- Les scénarios US-2 obtiennent directement leur chiffrage, sans stockage ou publication.
- Plusieurs appels sur les mêmes entrées donnent le même résultat et ne modifient pas le panier.
- La frontière commerciale d'ADR-001 reste inchangée.

**Negative / trade-offs:**
- Le calcul ne réserve ni ne fige les paliers pour une commande ultérieure.
- Il ne fournit pas d'historique des chiffrages ; une future exigence d'enregistrement nécessitera une décision distincte.

**Neutral:**
- Cette classification n'introduit aucun bus : l'appel direct du cas d'usage demeure la baseline.

## Alternatives Rejected

| Alternative | Reason rejected |
|---|---|
| Command enregistrant un chiffrage | Apporterait identité, durée de vie et stockage d'un fait que les critères ne demandent pas ; la réponse de calcul actuelle suffit. |
| Command modifiant les prix ou les lignes du panier | Rendrait les appels successifs dépendants des calculs précédents et changerait les entrées, alors que les critères demandent une remise calculée séparément. |
