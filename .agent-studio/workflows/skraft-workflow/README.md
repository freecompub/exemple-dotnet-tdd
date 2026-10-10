# Workflow skraft

Le pipeline skraft — recherche, conception avec ADR, scénarios d'acceptance, livraison en TDD,
revues — écrit en **workflow dynamique** (ADR 0055, `docs/11-workflows-dynamiques.md`). C'est le
modèle fourni avec agent-studio.

## Installer

Copier ce dossier, tel quel, à l'un de ces endroits :

- dans le projet : `.agent-studio/workflows/skraft-workflow/`, **et le commiter** — un fichier non
  suivi serait effacé par un rembobinage (`git clean`) ;
- pour tous ses projets : `~/.agent-studio/workflows/skraft-workflow/`.

À l'ouverture du projet, agent-studio le trouve ; la commande `/skraft-workflow <story> [--auto]`
est alors disponible, et l'agent principal peut proposer de le lancer. À la première exécution, et
après chaque modification du dossier, l'application montre ce qu'il peut faire et demande l'accord.

## Contenu

- `workflow.mjs` : le `meta` (lu sans exécuter le fichier) et le script.
- `conception.mjs`, `distillation.mjs`, `livraison.mjs`, `revue.mjs` : les phases et la revue.
- les contrôles et leurs données : `story.mjs`, `difficulty.mjs`, `research.mjs`, `design.mjs`,
  `adr.mjs`, `distill.mjs`, `gherkin.mjs`, `deliver.mjs`, `review.mjs`, `review-thread.mjs`,
  `review-brief.mjs`, `brief.mjs`, `preselect.mjs`, `text-analysis.mjs`, `support.mjs`.
- `agents/` : le contenu des rôles, partageable avec Copilot CLI et Claude Code (ADR 0024).
- `skills/` : les skills reprises de skraft-plugin `v1.6.1`.

Les tests de ce workflow sont dans `tests/workflow-skraft/` (ils ne sont pas copiés avec lui).

## Provenance et licence

GPL-3.0-or-later (voir `LICENSE`). Converti en JavaScript le 2026-10-10 depuis
`extensions/skraft-workflow/src/` (chaque fichier le dit en tête ; extension retirée le même jour,
lisible dans l'historique Git), lui-même repris de
`extensions/skraft` ; agents et skills repris de skraft-plugin (`docs/licences/autorisation-skraft.md`).

Différences avec l'extension skraft-workflow : plus d'outil `render_adr` — l'architecte écrit les
ADR au gabarit, le code y inscrit `Story : <slug>` et refuse toute modification d'un ADR d'une
autre story ou déjà décidé ; entrées `story` et `auto` au lieu de `storyPath` et
`confirmDifficulty`.
