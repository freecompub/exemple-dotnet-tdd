---
name: skraft-architect-decide
description: "Prend les décisions d'architecture d'une story à partir du modèle : ADR au statut Proposed, contrats et diagrammes."
---

Tu prends les décisions d'architecture, à partir du modèle écrit dans `.skraft/<slug>/design/`.

N'écris un ADR que si la décision n'est pas déjà imposée par le projet. Chaque ADR suit le gabarit du
projet et reste au statut `Proposed` : ce n'est pas à toi de l'accepter. Pour amender un ADR encore
proposé, reprends-le à son numéro plutôt que d'en créer un nouveau.

Écris dans `.skraft/<slug>/design/` : `contracts.md` et `diagrams.md`. N'y cite que des noms
définis dans `event-model.md` ou `domain-model.md`, et donne à chacun la même catégorie partout
(« Commande `X` », « Requête `Q` », « Agrégat `A` », « objet-valeur `V` »…) : la matrice de
cohérence (`consistency-matrix.md`) est construite par le code à partir de ces catégories, et un
même nom classé différemment d'un document à l'autre est refusé.
Un concept que tu classes dans un ADR (« Agrégat `X` »…) existe dans `event-model.md` ou
`domain-model.md`, sauf dans la section « Alternatives », qui cite ce que tu écartes. Chaque agrégat
du modèle est nommé par un ADR, nouveau ou existant, qui le justifie.

Dans `contracts.md`, chaque commande, requête et événement du modèle a sa section :
« ## Commande `X` » avec ses champs et leurs règles de validation, « ## Requête `Q` » avec ses
paramètres et la forme de son retour, « ## Événement `Y` » avec sa charge utile. Chaque dépôt a la
sienne, « ## Dépôt `R` », avec ses signatures et une ligne « Couche : Domaine » ou
« Couche : Application » : jamais l'infrastructure, qui ne fait que l'implémenter.

Un ADR est obligatoire pour chacun de ces engagements, qu'il soit introduit par la story ou déjà
présent dans le code sans ADR (écris alors un ADR de rattrapage) : CQRS avec bus, Event Sourcing,
saga, agrégat qui franchit une frontière existante, découpage ou fusion de contextes, couche
anticorruption, changement transverse (erreurs, validation, transactions). Ce qu'une skill, le
linter ou un test d'architecture impose déjà n'en demande pas. Un patron coûteux cite une force
mesurée, et ses alternatives évaluent l'option « faire sans le patron ».

## Règles communes

- Si une valeur ou une règle métier te manque, n'invente rien : pose la question, avec les réponses
  possibles.
- Toute affirmation que tu écris est sourcée : un chemin avec ses lignes, ou une URL. Ce que tu ne
  peux pas étayer, tu le retires — tu ne le nuances pas.
- Écris les noms d'événements, de commandes et d'agrégats en PascalCase entre backticks, à
  l'identique du modèle.
- Si deux documents des phases précédentes se contredisent, arrête-toi et signale la contradiction
  en citant les deux passages, plutôt que de choisir.
