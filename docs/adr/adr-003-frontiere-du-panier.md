---
adr: 003
title: Frontière du panier
status: Proposed
chosen: Panier-et-bareme-valeur
decision: >
  Nous conservons les lignes dans le panier et évaluons leur remise avec un barème valeur fourni au chiffrage, sans nouvel agrégat.
supersedes: null
date: 2026-10-16
ratified_by: null
---

# ADR-003 — Frontière du panier

- Statut : Accepted
- Date : 2026-10-16
- Story : us-2

## Contexte

L'Agrégat `Panier` contient déjà les lignes et additionne leurs sous-totaux ; l'ADR-001 impose le domaine pour les règles mais ne justifie pas cette frontière d'agrégat (`src/Tarification.Domaine/Panier.cs:4-16` ; `docs/adr/adr-001-decoupage-domaine-application.md:14-21`). Cet ADR complète cette justification sans remplacer l'ADR-001.

US-2 exige une remise indépendante par ligne et un seul palier, le plus avantageux (`stories/US-2.md:9-10`). Les paliers sont communs à toutes les références (`.skraft/us-2/research/research.md:9-11`). La recherche compare une règle portée par la ligne et un barème dédié ; la liste consultée ne justifie pas un agrégat supplémentaire (`.skraft/us-2/research/research.md:83-97` ; `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:30-34`).

## Décision

Nous conservons l'Agrégat `Panier` comme frontière des lignes et de la somme de leurs remises, en lui passant l'objet-valeur `BaremeDeRemise`, qui évalue chaque ligne indépendamment ; le barème reste extérieur à son état, sans nouvel agrégat ni persistance (`stories/US-2.md:9-11` ; `.skraft/us-2/research/research.md:9-11` ; `docs/adr/adr-001-decoupage-domaine-application.md:28-30,40-42`).

## Conséquences

- **Positive :** le sous-total brut reste distinct de la remise ; la somme des articles conserve son assiette existante (`src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Domaine/Panier.cs:16`).
- **Positive :** l'évaluation commune n'agrège pas les quantités des lignes ; c'est la frontière demandée par ac-4 (`stories/US-2.md:10`).
- **Contrepartie :** le chiffrage doit recevoir et transmettre le barème ; l'appel historique sans configuration doit rester disponible (`docs/adr/adr-001-decoupage-domaine-application.md:28-30` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35` ; `stories/US-2.md:11`).
- **Contrepartie :** le barème dédié ajoute un objet et un échange avec le panier par rapport à une sélection locale dans la ligne ; c'est le coût identifié dans la comparaison des approches A et B (`.skraft/us-2/research/research.md:83-97`).
- **Neutre :** cette frontière ne crée ni identité persistante ni événements pour le calcul, qui demeure une lecture (`.skraft/us-2/design/event-model.md:6-11`).

## Alternatives

| Alternative | Motif de non-sélection |
|---|---|
| Faire sans barème dédié, sélectionner les paliers dans la ligne | Option recevable, mais couple la ligne au parcours de la configuration commune ; le barème dédié sépare cette responsabilité du sous-total brut (`.skraft/us-2/research/research.md:83-97`). |
| Agrégat `BaremeDeRemise` indépendant | Aucune mutation ni identité métier du barème n'est demandée par les cinq critères ; un agrégat pour une liste seulement consultée est déconseillé (`stories/US-2.md:7-11` ; `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:30-34`). |
| Faire sans agrégation dans le panier et calculer la remise dans l'application | Place la règle commerciale dans la couche réservée à l'orchestration, contrairement au découpage accepté (`docs/adr/adr-001-decoupage-domaine-application.md:16-25`). |
