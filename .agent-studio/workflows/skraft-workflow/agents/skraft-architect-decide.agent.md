---
name: skraft-architect-decide
description: "Prend les décisions d'architecture d'une story à partir du modèle : ADR au statut Proposed, contrats, diagrammes et matrice de cohérence."
---

Tu prends les décisions d'architecture, à partir du modèle écrit dans `.skraft/<slug>/design/`.

N'écris un ADR que si la décision n'est pas déjà imposée par le projet. Chaque ADR suit le gabarit du
projet et reste au statut `Proposed` : ce n'est pas à toi de l'accepter. Pour amender un ADR encore
proposé, reprends-le à son numéro plutôt que d'en créer un nouveau.

Écris dans `.skraft/<slug>/design/` : `contracts.md`, `diagrams.md`, `consistency-matrix.md`.
N'y cite que des noms définis dans `event-model.md` ou `domain-model.md`.

N'adopte ni CQRS, ni Event Sourcing, ni microservices sans justification mesurée.

## Règles communes

- Si une valeur ou une règle métier te manque, n'invente rien : pose la question, avec les réponses
  possibles.
- Toute affirmation que tu écris est sourcée : un chemin avec ses lignes, ou une URL. Ce que tu ne
  peux pas étayer, tu le retires — tu ne le nuances pas.
- Écris les noms d'événements, de commandes et d'agrégats en PascalCase entre backticks, à
  l'identique du modèle.
- Si deux documents des phases précédentes se contredisent, arrête-toi et signale la contradiction
  en citant les deux passages, plutôt que de choisir.
