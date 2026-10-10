// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/workflow.ts (ADR 0055).
/**
 * skraft en workflow (ADR 0055) : la description qui suit est lue par la plateforme SANS exécuter
 * ce fichier ; elle doit rester une valeur littérale (ni variable, ni appel, ni calcul). C'est
 * aussi ce que l'utilisateur voit avant de donner son accord.
 */
export const meta = {
  name: "skraft-workflow",
  description: "Livre une user story : recherche, conception avec ADR, scénarios d'acceptance, TDD, revues.",
  commande: "skraft-workflow",
  entrees: {
    story: { type: "fichier", obligatoire: true, aide: "La user story (« # US-2 — Titre », critères numérotés)." },
    auto: { type: "booleen", defaut: false, aide: "Retenir la difficulté proposée sans la faire confirmer." },
  },
  phases: {
    "DÉBUT": "Préparation et difficulté",
    INIT: "Lecture de la story",
    CLASSIFY: "Évaluation de la difficulté",
    CONFIRM_DIFFICULTY: "Difficulté à confirmer",
    ROUTE: "Questions ouvertes",
    REVIEW: "Revue",
    ARBITRATION: "Arbitrage à rendre",
    RATIFICATION: "ADR à ratifier",
    BLOCKED: "Question d'un agent",
    ESCALATED: "Escalade",
    DONE: "Terminé",
    RESEARCH: "Enquête sur le code existant",
    DESIGN: "Conception",
    DISTILL: "Scénarios d'acceptance",
    DELIVER: "Implémentation en TDD",
  },
  humains: {
    "confirmer-difficulte": [],
    "question-ouverte": ["po", "developpeur", "architecte", "administrateur"],
    blocage: ["po", "developpeur", "architecte", "administrateur"],
    escalade: ["developpeur", "architecte", "administrateur"],
    arbitrer: ["developpeur", "architecte", "administrateur"],
    "ratifier-adr": ["architecte"],
  },
  // Tout ce que le script et ses agents peuvent écrire. `revert` : les phases rembobinent à l'escalade.
  permissions: {
    ecriture: [".skraft/**", "docs/adr/**", "@stack:acceptanceTests", "@stack:unitTests", "@stack:sources"],
    tests: true,
    git: ["branche", "commit", "revert"],
  },
  agents: {
    "skraft-classifier": {
      prompt: "agents/skraft-classifier.agent.md",
      consignes: "Le dossier de passation, construit par l'orchestrateur, donne la story, le dossier de travail (`.skraft/<slug>/`) et le résultat des phases précédentes.\nRends le niveau et sa justification avec l'outil submit_difficulty.",
      classe: "light",
      sortie: "submit_difficulty",
    },
    "skraft-researcher": {
      prompt: "agents/skraft-researcher.agent.md",
      consignes: "Le dossier de passation, construit par l'orchestrateur, donne la story, le dossier de travail (`.skraft/<slug>/`) et le résultat des phases précédentes.",
      classe: "standard",
      sortie: "report_phase",
      ecriture: [".skraft/**"],
      outils: ["list_files", "report_blocker"],
    },
    "skraft-architect-model": {
      prompt: "agents/skraft-architect-model.agent.md",
      consignes: "Le dossier de passation, construit par l'orchestrateur, donne la story, le dossier de travail (`.skraft/<slug>/`) et le résultat des phases précédentes.",
      classe: "strong",
      sortie: "report_phase",
      ecriture: [".skraft/**"],
      outils: ["list_files", "report_blocker"],
      skills: { obligatoires: ["architecture-patterns"], aLaDemande: ["architecture-decisions"] },
    },
    "skraft-architect-decide": {
      prompt: "agents/skraft-architect-decide.agent.md",
      consignes: "Le dossier de passation, construit par l'orchestrateur, donne la story, le dossier de travail (`.skraft/<slug>/`) et le résultat des phases précédentes.\nRédige chaque ADR dans docs/adr/, un fichier par décision, nommé adr-NNN-titre.md (NNN : numéro suivant, sur trois chiffres ; titre en minuscules, mots séparés par des tirets), avec ce gabarit :\n# ADR-NNN — Titre\n\n- Statut : Proposed\n- Date : AAAA-MM-JJ\n\n## Contexte\n\n…\n\n## Décision\n\n…\n\n## Conséquences\n\n…\n\n## Alternatives\n\n…\nS'il en remplace un autre, ajoute « - Remplace : ADR-NNN » sous la date, et la ligne « - ADR-XXX remplace ADR-NNN » dans docs/adr/supersessions.md.\nPour amender un ADR que tu as proposé pour cette story, modifie son fichier. Ne modifie jamais un ADR décidé ni celui d'une autre story, et ne touche pas à la ligne « Story », que l'orchestrateur ajoute lui-même.",
      classe: "strong",
      sortie: "report_phase",
      ecriture: [".skraft/**", "docs/adr/**"],
      outils: ["list_files", "report_blocker"],
      skills: { obligatoires: ["architecture-decisions", "adr-eligibility-gate"], aLaDemande: ["architecture-patterns"] },
    },
    "skraft-acceptance": {
      prompt: "agents/skraft-acceptance.agent.md",
      consignes: "Le dossier de passation, construit par l'orchestrateur, donne la story, le dossier de travail (`.skraft/<slug>/`) et le résultat des phases précédentes.\nLes skills décrivent aussi des étapes que l'orchestrateur exécute lui-même (commits, portes, mutation) : ne les fais pas.\nPour la forme du code, le linter du projet fait foi : en cas d'écart avec les seuils d'une skill (Object Calisthenics), suis le linter.\nL'emplacement des tests d'acceptance du projet est indiqué dans le dossier de passation. Le code vérifie ensuite chaque valeur\nrecopiée et la raison de chaque rouge : un écart est rejeté avec son motif.",
      classe: "standard",
      sortie: "report_phase",
      ecriture: [".skraft/**", "@stack:acceptanceTests", "@stack:sources"],
      outils: ["list_files", "run_tests", "report_blocker"],
      skills: { obligatoires: ["bdd-methodology", "test-design-mandates"], aLaDemande: ["outside-in-tdd", "craft-discipline"] },
    },
    "skraft-test": {
      prompt: "agents/skraft-test.agent.md",
      consignes: "Le dossier de passation, construit par l'orchestrateur, donne la story, le dossier de travail (`.skraft/<slug>/`) et le résultat des phases précédentes.\nLes skills décrivent aussi des étapes que l'orchestrateur exécute lui-même (commits, portes, mutation) : ne les fais pas.\nPour la forme du code, le linter du projet fait foi : en cas d'écart avec les seuils d'une skill (Object Calisthenics), suis le linter.\nLe scénario en cours, son test d'acceptance et les tests déjà écrits sont dans le dossier de passation. Les tests d'acceptance\nsont gelés : toute écriture y est refusée.",
      classe: "standard",
      sortie: "report_phase",
      ecriture: ["@stack:unitTests"],
      outils: ["list_files", "run_tests", "run_lint", "report_blocker"],
      skills: { obligatoires: ["test-design-mandates", "outside-in-tdd#RED"], aLaDemande: ["test-refactoring-catalog", "clean-architecture-testing"] },
    },
    "skraft-dev": {
      prompt: "agents/skraft-dev.agent.md",
      consignes: "Le dossier de passation, construit par l'orchestrateur, donne la story, le dossier de travail (`.skraft/<slug>/`) et le résultat des phases précédentes.\nLes skills décrivent aussi des étapes que l'orchestrateur exécute lui-même (commits, portes, mutation) : ne les fais pas.\nPour la forme du code, le linter du projet fait foi : en cas d'écart avec les seuils d'une skill (Object Calisthenics), suis le linter.\nLe test à faire passer est indiqué dans le dossier de passation. Tous les tests sont gelés pendant ton tour : une modification,\nmême hors des outils d'écriture, est détectée par empreinte et annule le tour.",
      classe: "standard",
      sortie: "report_phase",
      ecriture: ["@stack:sources"],
      outils: ["list_files", "run_tests", "run_lint", "report_blocker"],
      skills: { obligatoires: ["craft-discipline", "outside-in-tdd#SYNTHESIZE-GREEN"], aLaDemande: ["clean-architecture-testing", "test-refactoring-catalog"] },
    },
    "skraft-lens-cold-reader": {
      prompt: "agents/skraft-lens-cold-reader.agent.md",
      consignes: "Tu fais partie d'une revue à plusieurs lentilles ; chacune travaille isolée et la synthèse est calculée par le code.\nRends ton verdict avec l'outil submit_lens_verdict.\nUn comportement vérifié par un test d'acceptance n'appelle pas de test unitaire qui le duplique : avant de signaler un test\nmanquant, cherche-le dans les tests d'acceptance du projet. S'il y est, ce n'est pas un défaut (choix du projet, ADR 0045).\nDonne à chaque défaut sa cible (target) : test, code ou deliverable. Un défaut, un seul sujet : scinde celui qui touche à la fois\nun test et le code. Si le dossier liste tes défauts précédents contestés par l'agent, rends pour chacun un arbitrage (rulings) :\naccepted si sa raison te convainc, maintained sinon, avec ta raison ; ne les relance pas dans tes défauts.",
      classe: "standard",
      sortie: "submit_lens_verdict",
      skills: { aLaDemande: ["adversarial-review-lenses", "acceptance-review-criteria", "architecture-review-criteria"] },
    },
    "skraft-lens-test-integrity": {
      prompt: "agents/skraft-lens-test-integrity.agent.md",
      consignes: "Tu fais partie d'une revue à plusieurs lentilles ; chacune travaille isolée et la synthèse est calculée par le code.\nRends ton verdict avec l'outil submit_lens_verdict.\nUn comportement vérifié par un test d'acceptance n'appelle pas de test unitaire qui le duplique : avant de signaler un test\nmanquant, cherche-le dans les tests d'acceptance du projet. S'il y est, ce n'est pas un défaut (choix du projet, ADR 0045).\nDonne à chaque défaut sa cible (target) : test, code ou deliverable. Un défaut, un seul sujet : scinde celui qui touche à la fois\nun test et le code. Si le dossier liste tes défauts précédents contestés par l'agent, rends pour chacun un arbitrage (rulings) :\naccepted si sa raison te convainc, maintained sinon, avec ta raison ; ne les relance pas dans tes défauts.",
      classe: "standard",
      sortie: "submit_lens_verdict",
      skills: { aLaDemande: ["adversarial-review-lenses", "acceptance-review-criteria", "architecture-review-criteria"] },
    },
    "skraft-lens-architecture": {
      prompt: "agents/skraft-lens-architecture.agent.md",
      consignes: "Tu fais partie d'une revue à plusieurs lentilles ; chacune travaille isolée et la synthèse est calculée par le code.\nRends ton verdict avec l'outil submit_lens_verdict.\nUn comportement vérifié par un test d'acceptance n'appelle pas de test unitaire qui le duplique : avant de signaler un test\nmanquant, cherche-le dans les tests d'acceptance du projet. S'il y est, ce n'est pas un défaut (choix du projet, ADR 0045).\nDonne à chaque défaut sa cible (target) : test, code ou deliverable. Un défaut, un seul sujet : scinde celui qui touche à la fois\nun test et le code. Si le dossier liste tes défauts précédents contestés par l'agent, rends pour chacun un arbitrage (rulings) :\naccepted si sa raison te convainc, maintained sinon, avec ta raison ; ne les relance pas dans tes défauts.",
      classe: "standard",
      sortie: "submit_lens_verdict",
      skills: { aLaDemande: ["adversarial-review-lenses", "acceptance-review-criteria", "architecture-review-criteria"] },
    },
    "skraft-lens-quality-gates": {
      prompt: "agents/skraft-lens-quality-gates.agent.md",
      consignes: "Tu fais partie d'une revue à plusieurs lentilles ; chacune travaille isolée et la synthèse est calculée par le code.\nRends ton verdict avec l'outil submit_lens_verdict.\nUn comportement vérifié par un test d'acceptance n'appelle pas de test unitaire qui le duplique : avant de signaler un test\nmanquant, cherche-le dans les tests d'acceptance du projet. S'il y est, ce n'est pas un défaut (choix du projet, ADR 0045).\nDonne à chaque défaut sa cible (target) : test, code ou deliverable. Un défaut, un seul sujet : scinde celui qui touche à la fois\nun test et le code. Si le dossier liste tes défauts précédents contestés par l'agent, rends pour chacun un arbitrage (rulings) :\naccepted si sa raison te convainc, maintained sinon, avec ta raison ; ne les relance pas dans tes défauts.",
      classe: "light",
      sortie: "submit_lens_verdict",
      skills: { aLaDemande: ["adversarial-review-lenses", "acceptance-review-criteria", "architecture-review-criteria"] },
    },
  },
};
/**
* skraft écrit en workflow rejouable (ADR 0052, `docs/09` §14 étape 4). Extension indépendante de
* `extensions/skraft` : elle n'en importe rien, et `/skraft` reste intacte.
*
* Commande `/skraft-workflow` : pour l'instant la préparation, la difficulté, RESEARCH, les
* questions ouvertes et DESIGN, puis arrêt avec le dossier de passation de DISTILL. Le comportement reproduit
* celui du réducteur de skraft. Si le script n'est pas nettement plus simple que la partie du
* réducteur qu'il remplace, on s'arrête là (ADR 0052, conséquences).
*/
import { essayer, PanneEnvironnement, Escalade, TourInterrompu, problemesTestsExistants, correspond } from "@agent-studio/workflow";
import { buildBrief } from "./brief.mjs";
import { computeIndicators, DEFAULT_THRESHOLDS, gradeDifficulty, isDifficulty, levelEffects, shift } from "./difficulty.mjs";
import { preselectFiles } from "./preselect.mjs";
import { checkResearch } from "./research.mjs";
import { parseStory, slugOf } from "./story.mjs";
import { concevoir } from "./conception.mjs";
import { distiller } from "./distillation.mjs";
import { livrer, barreDeQualite } from "./livraison.mjs";
import { checkCoverage } from "./deliver.mjs";
import { commitMessage, creerDossiers, GELÉS, LEVEL_LABELS, repositoryShape } from "./support.mjs";
const RELANCER_OU_ABANDONNER = [
  { id: "relancer", label: "Relancer" },
  { id: "abandonner", label: "Abandonner" },
];
export default async function skraft(w, entree) {
  const { story, slug, indicateurs } = await preparer(w, entree.story);
  const run = await w.lancerTests({ etiquette: "INIT_BASELINE" });
  const problems = problemesTestsExistants(run);
  if (problems.length) {
    await w.informer(`Lancement skraft bloqué avant tout appel d'agent :\n${problems.map((p) => `- ${p}`).join("\n")}`);
    throw new PanneEnvironnement(problems.join(" ; "));
  }
  const disp = await w.disposition();
  const { barre, notes } = await barreDeQualite(w, disp);
  const sources = (await w.listerFichiers()).filter((p) => correspond(disp.sources, p));
  const warnings = run.coverage ? checkCoverage(run.coverage, sources, barre) : ["Couverture initiale non mesurée : la commande de test du projet n'en produit pas."];
  if (warnings.length || notes.length)
    await w.informer(`Précontrôle skraft — avertissement non bloquant sur le code existant :\n${[...warnings, ...notes].map((p) => `- ${p}`).join("\n")}\nLes seuils de couverture de livraison portent uniquement sur les lignes ajoutées ou modifiées.`);
  const qualityCheckpoint = await w.checkpoint(`skraft ${slug} : qualité initiale`);
  const niveau = await evaluerDifficulte(w, story, indicateurs, !entree.auto);
  const effets = levelEffects(niveau);
  // Ce que le dossier de passation raconte, tenu à jour au fil du script.
  const vue = {
    story,
    slug,
    niveau,
    phasesFaites: [],
    phasesSautees: effets.skipResearch ? ["RESEARCH"] : [],
    questions: story.openQuestions.map((text, i) => ({ id: `q${i + 1}`, text })),
    reponses: [],
    adrs: [],
    regressions: [],
    acceptanceHash: null,
    qualityCheckpoint,
  };
  if (!effets.skipResearch) {
    // `w.phase` rend `undefined` si l'humain saute la phase : la fonction rend donc une valeur.
    const faite = await w.phase("RESEARCH", async () => (await rechercher(w, vue, effets.maxAttempts), true), {
      commit: commitMessage("RESEARCH", slug),
      // Git ne suit pas les dossiers vides : le rembobinage les emporte (ADR 0037).
      apresRembobinage: () => creerDossiers(w, slug),
    });
    if (faite === undefined)
      vue.phasesSautees = [...vue.phasesSautees, "RESEARCH"];
    else
      vue.phasesFaites = [{ phase: "RESEARCH", fichiers: [`.skraft/${slug}/research/research.md`] }];
  }
  // Les questions ouvertes (story, recherche) sont tranchées avant DESIGN, toutes à la fois.
  // Étapes annoncées avec le vocabulaire de l'extension skraft : les deux se comparent (docs/10 §3).
  await w.etape("ROUTE");
  const reponses = await Promise.all(vue.questions.map((q) => w.humain("question-ouverte", `Question ouverte (${story.id})`, [{ id: "answer", label: "Répondre" }, { id: "defer", label: "Reporter" }], { detail: q.text, texteLibre: true })));
  vue.questions = vue.questions.map((q, i) => {
    const d = reponses[i];
    return { ...q, answer: d.decision === "defer" ? "(question reportée par l'utilisateur)" : d.commentaire?.trim() || "(réponse vide)" };
  });
  if (await concevoir(w, vue, effets.lenses, effets.maxAttempts))
    vue.phasesFaites = [...vue.phasesFaites, { phase: "DESIGN", fichiers: [] }];
  else
    vue.phasesSautees = [...vue.phasesSautees, "DESIGN"];
  if (await distiller(w, vue, effets.lenses, effets.maxAttempts))
    vue.phasesFaites = [...vue.phasesFaites, { phase: "DISTILL", fichiers: [] }];
  else
    vue.phasesSautees = [...vue.phasesSautees, "DISTILL"];
  if (await livrer(w, vue, effets.lenses, effets.maxAttempts))
    vue.phasesFaites = [...vue.phasesFaites, { phase: "DELIVER", fichiers: [] }];
  else
    vue.phasesSautees = [...vue.phasesSautees, "DELIVER"];
  await w.etape("DONE");
  await w.informer(bilan(vue, !entree.auto));
  return {
    slug,
    niveau,
    acceptanceHash: vue.acceptanceHash,
    regressions: vue.regressions,
    phases: vue.phasesFaites.map((p) => p.phase),
    adrs: vue.adrs,
    livraison: vue.livraison ?? null,
  };
}
function bilan(d, confirmee) {
  const adrs = d.adrs.map((a) => `${a.id} (${a.status})`).join(", ") || "aucun";
  return [
    `Pipeline skraft terminé pour **${d.story.id}** (branche skraft/${d.slug}).`,
    `Difficulté : ${d.niveau} (${confirmee ? "confirmée" : "automatique"}).`,
    `Phases exécutées : ${d.phasesFaites.map((p) => p.phase).join(", ") || "aucune"} ; sautées : ${d.phasesSautees.join(", ") || "aucune"}.`,
    `ADR : ${adrs}.`,
  ].join("\n");
}
/** Lecture de la story, branche et arborescence (effet `init` du réducteur). */
async function preparer(w, chemin) {
  await w.etape("INIT");
  for (;;) {
    let motifs;
    try {
      const lue = parseStory(await w.lireFichier(chemin));
      if (lue.ok) {
        const slug = slugOf(lue.story.id);
        await w.brancher(`skraft/${slug}`);
        await creerDossiers(w, slug);
        const indicateurs = computeIndicators(lue.story, repositoryShape(await w.listerFichiers()));
        return { story: lue.story, slug, indicateurs };
      }
      motifs = lue.errors;
    }
    catch (e) {
      motifs = [e instanceof PanneEnvironnement ? `Panne d'environnement : ${e.message}` : `Story introuvable : ${chemin}`];
    }
    await relancerOuAbandonner(w, `Story invalide : ${motifs.join(" ; ")}`);
  }
}
/** Classifieur, budget compté par le code (D24), puis confirmation humaine si demandée. */
async function evaluerDifficulte(w, story, indicateurs, confirmer) {
  await w.etape("CLASSIFY");
  const grille = gradeDifficulty(indicateurs, DEFAULT_THRESHOLDS);
  const consigne = [`Story : ${story.id} — ${story.title}`, `Indicateurs : ${JSON.stringify(indicateurs)}`, `Niveau proposé par la grille : ${grille}`].join("\n");
  let propose;
  for (;;) {
    try {
      await essayer(w, { max: 3 }, async () => {
        const r = await w.agent("skraft-classifier", consigne);
        if (!r.sortie)
          return { motifs: [`Blocage inattendu : ${r.blocage.question}`], porte: "classifieur" };
        if (!isDifficulty(r.sortie.level))
          return { motifs: [`Niveau de difficulté inconnu : ${r.sortie.level}`], porte: "classifieur" };
        propose = { level: r.sortie.level, justification: r.sortie.justification };
        return [];
      });
      break;
    }
    catch (e) {
      if (!(e instanceof Escalade || e instanceof PanneEnvironnement))
        throw e;
      await relancerOuAbandonner(w, e.message);
    }
  }
  if (!confirmer)
    return propose.level;
  const niveaux = [...new Set([propose.level, shift(propose.level, 1), shift(propose.level, -1)])];
  await w.etape("CONFIRM_DIFFICULTY");
  const d = await w.humain("confirmer-difficulte", `Difficulté de ${story.id} : ${LEVEL_LABELS[propose.level]} ?`, niveaux.map((l) => ({ id: l, label: l === propose.level ? `Confirmer : ${LEVEL_LABELS[l]}` : LEVEL_LABELS[l] })), { detail: propose.justification });
  return isDifficulty(d.decision) ? d.decision : propose.level;
}
/** Un essai de RESEARCH : le chercheur, ses questions bloquantes, puis la porte citations (§7.1). */
function rechercher(w, vue, max) {
  return essayer(w, { max }, async (motifs) => {
    let retour = motifs;
    for (;;) {
      await w.etape("RESEARCH");
      const fichiers = await w.listerFichiers();
      const utiles = preselectFiles(vue.story, fichiers);
      const consigne = buildBrief(vue, "RESEARCH", retour) + (utiles.length ? `\nFichiers utiles (présélection) :\n${utiles.map((f) => `  - ${f}`).join("\n")}` : "");
      const r = await w.agent("skraft-researcher", consigne, { lectureSeule: GELÉS });
      if (r.sortie)
        break;
      // Question bloquante (D31) : l'humain répond, l'agent repart avec la réponse dans son dossier.
      const choix = r.blocage.choix.length ? r.blocage.choix : ["Répondre"];
      await w.etape("BLOCKED");
      const d = await w.humain("blocage", "Question de l'agent (RESEARCH)", choix.map((c) => ({ id: c, label: c })), { detail: r.blocage.question });
      vue.reponses = [...vue.reponses, { question: r.blocage.question, answer: d.commentaire ? `${d.decision} (${d.commentaire})` : d.decision }];
      retour = [];
    }
    return { motifs: await porteCitations(w, vue), porte: "citations" };
  });
}
async function porteCitations(w, vue) {
  const chemin = `.skraft/${vue.slug}/research/research.md`;
  let md;
  try {
    md = await w.lireFichier(chemin);
  }
  catch (e) {
    if (e instanceof PanneEnvironnement || e instanceof TourInterrompu)
      throw e;
    return [`Document de recherche absent : ${chemin}`];
  }
  const existants = new Set(await w.listerFichiers());
  const lignes = new Map();
  for (const cite of new Set([...md.matchAll(/[\w./-]+\.[A-Za-z][A-Za-z0-9]{0,9}/g)].map((m) => m[0])))
    if (existants.has(cite))
      lignes.set(cite, (await w.lireFichier(cite)).replace(/\n$/, "").split("\n").length);
  const { reasons, openQuestions } = checkResearch(md, { lineCount: (p) => lignes.get(p) ?? null });
  if (reasons.length)
    return reasons;
  const connues = new Set(vue.questions.map((q) => q.text));
  const nouvelles = openQuestions.filter((q) => !connues.has(q));
  vue.questions = [...vue.questions, ...nouvelles.map((text, i) => ({ id: `q${vue.questions.length + i + 1}`, text }))];
  return [];
}
async function relancerOuAbandonner(w, motif) {
  await w.etape("ESCALATED");
  const d = await w.humain("escalade", "Pipeline skraft bloqué", RELANCER_OU_ABANDONNER, { detail: motif });
  if (d.decision !== "relancer")
    w.echec(`Abandon : ${motif}`);
}
