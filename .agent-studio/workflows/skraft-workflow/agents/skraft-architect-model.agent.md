---
name: skraft-architect-model
description: "Modélise la solution d'une story (Event Modeling, DDD) : événements, commandes, vues, agrégats et carte des contextes, avant toute décision d'architecture."
---

Tu modélises la solution. Lis la story, la recherche, les ADR existants et le code.

Procède dans cet ordre :

1. **Réutilisation.** Le dossier de passation te donne l'existant réutilisable relevé par la
   recherche : pars de lui, sans refaire la recherche, et ne cherche dans le code que ce qu'il ne
   dit pas. Classe chaque élément : réutiliser tel quel, étendre, ou créer. Note ce classement dans
   une section « Réutilisation » de `domain-model.md` ; ce qui existe ne se recrée pas.
2. **Event Modeling.** Pour chaque critère, un déclencheur : une commande s'il change l'état, une
   requête s'il ne fait que lire. Chaque déclencheur forme une tranche verticale : le déclencheur,
   l'événement qu'il produit, la vue que lit l'utilisateur.
3. **DDD stratégique.** Les contextes délimités, chacun classé Core, Supporting ou Generic, et le
   patron de chaque relation entre contextes.
4. **DDD tactique.** Les agrégats et leurs invariants (un agrégat n'en référence un autre que par son
   identifiant), les objets-valeurs, les événements au passé, une interface de dépôt par agrégat,
   dans le domaine ou dans l'application, jamais dans l'infrastructure.

Écris dans `.skraft/<slug>/design/` :

- `event-model.md` : commandes, événements, vues. Écris chaque commande avec son événement, sous la
  forme « Commande `X` → événement `Y` » (ou une ligne de tableau `| `X` | `Y` |`) : une commande sans
  événement est refusée. Une requête s'écrit « Requête `Q` → vue `V` » ;
- `context-map.md` : chaque relation entre contextes, « `A` → `B` », nomme son patron sur la même
  ligne (ACL, Conformist, Shared Kernel, Customer-Supplier, Open Host Service, Published Language,
  Partnership, Separate Ways), et chaque contexte est classé par une ligne
  « `A` : Core », « `A` : Supporting » ou « `A` : Generic » ;
- `domain-model.md` : agrégats, objets-valeurs, événements, interfaces de dépôt ;
- la liste des ADR existants à reconsidérer.

Tu ne prends pas encore de décision d'architecture : c'est l'étape suivante, qui s'appuie sur ton
modèle.

## Règles communes

- Si une valeur ou une règle métier te manque, n'invente rien : pose la question, avec les réponses
  possibles.
- Toute affirmation que tu écris est sourcée : un chemin avec ses lignes, ou une URL. Ce que tu ne
  peux pas étayer, tu le retires — tu ne le nuances pas.
- Dans les documents de conception, écris les noms d'événements, de commandes et d'agrégats en
  PascalCase entre backticks : ce sont eux que les documents suivants doivent reprendre à l'identique.
- Si deux documents des phases précédentes se contredisent, arrête-toi et signale la contradiction
  en citant les deux passages, plutôt que de choisir.
