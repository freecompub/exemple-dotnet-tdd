// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/livraison.ts (ADR 0055).
/**
* Phase DELIVER en workflow (SPEC-skraft §7.4) : pour chaque scénario, un test unitaire rouge, puis
* le code (un tour, `turn-per-scenario`) ou le vert puis le nettoyage (sessions séparées), jusqu'au
* vert du test d'acceptance ; porte de fin de scénario ; à la fin, mutation et revue, avec
* correction ciblée des défauts (ADR 0046, 0047). Reproduit `deliver-machine.ts` et
* `deliver-effects.ts` de skraft. Toutes les preuves viennent de `w.lancerTests` (D20).
*/
import { problemesTestsExistants, couvertureDuDiff, couchesManquantes as coreFilesMissing, correspond as matchesAny, Escalade, lireBarreDeQualite as parseQualityBar, PanneEnvironnement, SauterPhase, TourInterrompu } from "@agent-studio/workflow";
import { buildBrief } from "./brief.mjs";
import { checkCoverage, checkDependencies, checkLint, checkMutation, checkRedGreenSequence, concerns, defaultDependencyRules, planScenarios } from "./deliver.mjs";
import { levelEffects } from "./difficulty.mjs";
import { acOf, featureScenarios } from "./distill.mjs";
import { reviewFacts } from "./review-brief.mjs";
import { agentFeedback, applyResponses, endTurn, isActive } from "./review-thread.mjs";
import { ecrireRapport, enregistrerLivrables, nouveauSuivi, reviser } from "./revue.mjs";
import { commitMessage, creerDossiers, sha256 } from "./support.mjs";
import { declaredIdentifiers } from "./text-analysis.mjs";
const QUALITY = ".agent-studio/quality.yaml";
const QUALITY_LEGACY = ".skraft/quality.json";
const MAX_CYCLES = 20;
const GELES_TESTEUR = ["@stack:acceptanceTests"];
const GELES_DEV = ["@stack:acceptanceTests", "@stack:unitTests"];
/** Un pas refusé par sa porte : le motif part au prochain essai du pas. */
class PasRefuse extends Error {
}
/** Le scénario échoue (budget d'un pas épuisé, porte de fin de scénario, cycles) : il reprend à son début. */
class ScenarioEchoue extends Error {
  motifs;
  constructor(motifs) {
    super(motifs.join(" ; "));
    this.motifs = motifs;
  }
}
const premiereLigne = (msg) => (msg ?? "").split("\n").find((l) => l.trim())?.trim().slice(0, 300) ?? "";
const uniq = (xs) => [...new Set(xs)];
/** Un défaut de revue revient à l'agent des tests (`test`) ou au développeur (`code`, `deliverable`). */
const pourTests = (t) => t.target === "test";
const pourDev = (t) => t.target !== "test";
const autreAgent = (t) => (t.target === "test" ? "code" : "test");
export async function livrer(w, d, lentilles, max) {
  const suivi = nouveauSuivi();
  const faite = await w.phase("DELIVER", async (cp) => {
    const L = await phase(w, d, suivi, cp, lentilles, max);
    d.livraison = { granularity: L.granularity, scenarios: L.scenarios.map((x) => [x.id, x.role, x.status]), notes: L.notes };
    for (const r of suivi.revues)
      await ecrireRapport(w, d.slug, "DELIVER", r.essai, r.lentilles);
    return true;
  }, { commit: commitMessage("DELIVER", d.slug), apresRembobinage: () => creerDossiers(w, d.slug) });
  return faite === true;
}
/**
* Budget de la phase : partagé entre les réessais de phase et les corrections de revue, comme
* `attempts` dans le réducteur (une correction en consomme un).
*/
async function phase(w, d, s, cpPhase, lentilles, max) {
  let tentatives = 0;
  let motifs = [];
  for (;;) {
    let rejet;
    try {
      const L = await planifier(w, d);
      for (let i = L.scenarios.findIndex(enAttente); i !== -1; i = L.scenarios.findIndex(enAttente)) {
        await scenario(w, d, L, i, motifs, max);
        motifs = [];
      }
      rejet = await finDePhase(w, d, s, L, cpPhase, lentilles, max, () => tentatives, () => tentatives++);
      if (!rejet.motifs.length)
        return L;
    }
    catch (e) {
      if (!(e instanceof TourInterrompu))
        throw e;
      rejet = { motifs: [`Le tour précédent a été interrompu (${e.message}) : aucune porte n'a jugé ton travail.`], garanti: false, porte: "délai" };
    }
    // Réessai de toute la phase : tracé avec sa cause (docs/10 §4.3).
    await w.rejet(`DELIVER : ${rejet.porte ?? "phase"}`, rejet.motifs);
    tentatives++;
    if (tentatives >= max && !rejet.garanti)
      throw new Escalade(rejet.motifs);
    motifs = rejet.motifs;
  }
}
const enAttente = (x) => x.role === "driver" && x.status === "pending";
// ---------- plan --------------------------------------------------------------------------
async function gelIntact(w, d) {
  return !d.acceptanceHash || (await w.empreinte(["@stack:acceptanceTests"])) === d.acceptanceHash;
}
async function lireOu(w, chemin) {
  try {
    return await w.lireFichier(chemin);
  }
  catch (e) {
    if (e instanceof PanneEnvironnement)
      throw e;
    return null;
  }
}
/** Classement des fichiers et des résultats selon la disposition de la stack (ADR 0041). */
function natures(disp) {
  const acceptance = (p) => matchesAny(disp.acceptanceTests, p);
  // `isTestFile` de l'adaptateur approché par les emplacements déclarés.
  const unit = (p) => !acceptance(p) && matchesAny(disp.unitTests, p);
  const resultatAcceptance = (r) => acOf(r.id) !== null || acceptance(r.file);
  return { acceptance, unit, resultatAcceptance, production: (p) => !acceptance(p) && !unit(p) };
}
/** Barre de qualité du projet (ADR 0049) ; invalide, c'est une panne : la juger à moitié serait attester à tort. */
export async function barreDeQualite(w, disp) {
  const q = parseQualityBar({ yaml: await lireOu(w, QUALITY), legacyJson: await lireOu(w, QUALITY_LEGACY) });
  if ("error" in q)
    throw new PanneEnvironnement(q.error);
  const sources = (await w.listerFichiers()).filter((f) => matchesAny(disp.sources, f));
  const vides = coreFilesMissing(q.bar, sources, q.declaredCore).map((c) => `Barre de qualité : la couche « ${c} » du cœur ne correspond à aucun fichier du projet ; ses seuils ne s'appliquent à rien (${q.source}).`);
  return { barre: q.bar, notes: [...q.warnings, ...vides] };
}
/** Début de DELIVER : suite de référence (seuls les tests d'acceptance peuvent être rouges), puis plan des scénarios. */
async function planifier(w, d) {
  if (!(await gelIntact(w, d)))
    throw new PanneEnvironnement("Les tests d'acceptance ont changé depuis DISTILL alors qu'ils sont gelés : restaurez-les avant de relancer.");
  const disp = await w.disposition();
  const run = await w.lancerTests({ etiquette: "DELIVER_BASELINE" });
  if (run.timedOut)
    throw new PanneEnvironnement("Les tests ont dépassé le délai avant le début de DELIVER.");
  const k = natures(disp);
  const casses = run.results.filter((r) => r.status === "failed" && !k.resultatAcceptance(r));
  if (casses.length)
    throw new PanneEnvironnement(`La suite est rouge avant DELIVER : ${casses.map((r) => r.id).join(", ")}. Corrigez-la avant de relancer.`);
  const implPlan = (await lireOu(w, `.skraft/${d.slug}/distill/impl-plan.md`)) ?? "";
  return {
    disp,
    scenarios: planScenarios({ implPlan, acceptanceTestIds: run.results.filter(k.resultatAcceptance).map((r) => r.id), regressions: d.regressions }),
    granularity: levelEffects(d.niveau).granularity,
    baseline: { all: run.results.map((r) => r.id), passed: run.results.filter((r) => r.status === "passed").map((r) => r.id) },
    unitTestsHash: null,
    dernierVert: null,
    notes: [],
    faits: [],
    contrat: [],
  };
}
// ---------- un scénario ----------------------------------------------------------------------
/** Tests d'acceptance encore autorisés à échouer : scénarios moteurs non terminés. */
const enCours = (L, i, avecCourant) => L.scenarios.filter((x, j) => x.role === "driver" && x.status !== "done" && (avecCourant || j !== i)).map((x) => x.acceptanceTestId);
/**
* Un scénario, de son checkpoint à sa porte de fin. Un échec le reprend à son début : en sessions
* séparées après un premier échec en mode tour (D22), puis dans la limite du budget ; au-delà,
* escalade au niveau du scénario.
*/
async function scenario(w, d, L, i, motifs, max) {
  const sc = L.scenarios[i];
  L.scenarios[i] = { ...sc, status: "in_progress" };
  const cpScenario = await w.checkpoint(`skraft ${d.slug} : scénario ${sc.id}`);
  const baseScenario = L.baseline;
  let echecs = 0;
  let retour = motifs;
  for (;;) {
    L.baseline = baseScenario;
    try {
      const unitTests = await derouler(w, d, L, i, cpScenario, retour, max);
      L.scenarios[i] = { ...L.scenarios[i], status: "done", unitTests };
      return;
    }
    catch (e) {
      if (!(e instanceof PanneEnvironnement) && !(e instanceof ScenarioEchoue))
        throw e;
      const panne = e instanceof PanneEnvironnement;
      // Scénario repris à son début : tracé avec sa cause (docs/10 §4.3).
      await w.rejet(panne ? `panne (${sc.id})` : `scénario ${sc.id}`, e instanceof ScenarioEchoue ? e.motifs : [e.message]);
      echecs++;
      await w.rembobiner(cpScenario);
      await creerDossiers(w, d.slug);
      retour = e instanceof ScenarioEchoue ? e.motifs : [];
      if (!panne && L.granularity === "turn-per-scenario") {
        L.granularity = "session-per-step";
        L.notes = [...L.notes, `Scénario ${sc.id} : repris en sessions séparées après un échec.`];
        continue;
      }
      if (panne || echecs >= max) {
        await escaladeScenario(w, panne ? e.message : `Scénario ${sc.id} : ${retour.join(" ; ")}`);
        echecs = 0;
      }
    }
  }
}
/** Escalade d'un scénario : relancer reprend CE scénario, sauter saute la phase (comme le réducteur). */
async function escaladeScenario(w, motif) {
  await w.etape("ESCALATED");
  const d = await w.humain("escalade", "Pipeline skraft bloqué (DELIVER)", [
    { id: "relancer", label: "Relancer la phase" },
    { id: "sauter", label: "Sauter la phase" },
    { id: "abandonner", label: "Abandonner" },
  ], { detail: motif });
  if (d.decision === "sauter")
    throw new SauterPhase();
  if (d.decision === "abandonner")
    w.echec(`Abandon : ${motif}`);
}
/** Les pas d'un scénario jusqu'à sa porte de fin ; rend les tests unitaires ajoutés. */
async function derouler(w, d, L, i, cpScenario, motifs, max) {
  const sc = L.scenarios[i];
  const dejaVert = L.baseline.passed.includes(sc.acceptanceTestId);
  let point = cpScenario;
  const unitTests = [];
  let retour = motifs;
  for (let cycles = 0; !dejaVert;) {
    const rouge = await pas(w, d, L, i, "test", point, retour, max, unitTests, null);
    retour = [];
    point = rouge.cp;
    if (rouge.nouveau && !rouge.viaAcceptance)
      unitTests.push(rouge.nouveau);
    let vert;
    if (L.granularity === "turn-per-scenario") {
      const r = await pas(w, d, L, i, "dev", point, [], max, unitTests, rouge.nouveau);
      point = r.cp;
      vert = r.acceptanceVerte;
    }
    else {
      const g = await pas(w, d, L, i, "green", point, [], max, unitTests, rouge.nouveau);
      point = g.cp;
      vert = g.acceptanceVerte;
      // Nettoyage refusé : retour au vert, sans escalade (SPEC.md §8.3).
      try {
        const r = await pas(w, d, L, i, "refactor", point, [], 1, unitTests, null);
        point = r.cp;
      }
      catch (e) {
        if (!(e instanceof ScenarioEchoue))
          throw e;
        L.notes = [...L.notes, `Scénario ${sc.id} : nettoyage annulé (${e.message})`];
      }
    }
    if (vert)
      break;
    // Chaque cycle ajoute un test et un checkpoint : sans plafond, il tournerait sans fin (D24).
    if (++cycles >= MAX_CYCLES)
      throw new ScenarioEchoue([`Le test d'acceptance du scénario reste rouge après ${cycles} cycles test puis code.`]);
  }
  await porteScenario(w, d, L, i, cpScenario, unitTests);
  return unitTests;
}
/**
* Un pas : l'agent, puis la porte du pas. Refusé, le pas est rembobiné à son point de départ et
* relancé avec le motif, dans la limite du budget ; au-delà, le scénario échoue.
*/
async function pas(w, d, L, i, etape, depuis, motifs, max, unitTests, nouveau, correction) {
  let retour = motifs;
  for (let essais = 1;; essais++) {
    try {
      const sortie = await agentDuPas(w, d, L, i, etape, retour, unitTests, nouveau, correction);
      return await porteDuPas(w, d, L, i, etape, depuis, sortie, nouveau, correction);
    }
    catch (e) {
      const motif = e instanceof PasRefuse || e instanceof TourInterrompu ? e.message : null;
      if (motif === null)
        throw e;
      // Pas refusé par sa porte, ou tour interrompu : tracé, puis rembobiné et relancé.
      await w.rejet(`pas ${etape} (${L.scenarios[i].id})`, [motif]);
      await w.rembobiner(depuis);
      await creerDossiers(w, d.slug);
      if (essais >= max)
        throw new ScenarioEchoue([motif]);
      retour = [motif];
    }
  }
}
const TEXTE = {
  test: ({ unit }) => `Pas en cours : écris UN nouveau test unitaire (dans ${unit}) pour le prochain petit comportement du scénario, vérifie avec run_tests qu'il échoue sur une assertion ou un symbole manquant, puis rends la main. N'écris aucun code de production.\n` +
    "Si ce comportement est déjà vérifié par le test d'acceptance du scénario et qu'un test unitaire ne ferait que le dupliquer, n'écris rien : rends la main en désignant ce test d'acceptance dans le champ `coveredBy` de report_phase. Le code vérifiera qu'il échoue pour une bonne raison, et le pas suivant le fera passer.",
  dev: ({ nouveau, sources }) => `Pas en cours : fais passer le test « ${nouveau ?? "?"} » au vert avec le code minimal (dans ${sources}), vérifie avec run_tests, puis nettoie le code sans changer son comportement. Ne modifie aucun test.`,
  green: ({ nouveau, sources }) => `Pas en cours : fais passer le test « ${nouveau ?? "?"} » au vert avec le code minimal (dans ${sources}), vérifié avec run_tests. Ne modifie aucun test.`,
  refactor: () => "Pas en cours : nettoie le code de production sans changer son comportement ; la suite doit rester verte. Ne modifie aucun test.",
  "fix-test": ({ unit }) => `Pas en cours : correction de revue, côté tests. Pour chaque défaut listé dans « Rejet précédent », ajoute le test demandé (dans ${unit}), ou conteste le défaut avec ta raison. ` +
    "Un test ajouté peut passer d'emblée s'il décrit un comportement que le code a déjà, ou échouer sur une assertion s'il révèle un défaut du code : le développeur le fera passer ensuite. " +
    "Ne modifie pas les tests existants, n'écris aucun code de production. Vérifie avec run_tests.",
  fix: ({ sources }) => `Pas en cours : corrige les défauts de revue listés dans « Rejet précédent », dans le code de production uniquement (${sources}) ; la suite doit rester verte. Ne modifie aucun test. ` +
    "Si un défaut ne doit pas être corrigé selon toi, conteste-le avec ta raison ; s'il est juste mais que sa correction n'est pas de ton ressort (un test à écrire, par exemple), déclare-le `outOfScope`. " +
    "Ne supprime jamais un comportement exigé par le contrat de conception pour faire taire une revue : le code le vérifie, et refuse ce tour.",
};
/** L'agent du pas, avec son dossier de passation ; une question bloquante passe à l'humain. */
async function agentDuPas(w, d, L, i, etape, motifs, unitTests, nouveau, correction) {
  const sc = L.scenarios[i];
  const critere = d.story.criteria.find((c) => c.n === sc.ac);
  let gherkin = "";
  for (const f of (await w.listerFichiers()).filter((x) => x.startsWith(`.skraft/${d.slug}/distill/features/`) && x.endsWith(".feature")))
    gherkin ||= featureScenarios(await w.lireFichier(f)).get(sc.ac) ?? "";
  // Correction de revue : chaque agent reçoit les défauts qui le concernent, à chaque relance.
  const routes = etape === "fix-test" ? (correction?.retourTests ?? []) : etape === "fix" ? [...(correction?.retourDev ?? []), ...(correction?.cibles.length ? [`Tests ajoutés par la correction côté tests, rouges : fais-les passer. ${correction.cibles.join(", ")}`] : [])] : [];
  const rejet = etape === "fix" || etape === "fix-test" ? uniq([...routes, ...motifs]) : motifs;
  d.livres = L.scenarios.filter((x) => x.status === "done").map((x) => `${x.id}${x.role === "regression" ? " (non-régression)" : ""}`);
  d.constats = L.notes;
  const testeur = etape === "test" || etape === "fix-test";
  let retour = rejet;
  for (;;) {
    await w.etape("DELIVER");
    const consigne = [
      buildBrief(d, "DELIVER", retour),
      `Scénario en cours : ${sc.id}${critere ? ` (critère ${critere.n} : ${critere.text})` : ""}`,
      ...(gherkin ? ["Scénario :", gherkin.trim()] : []),
      `Test d'acceptance à faire passer : ${sc.acceptanceTestId}`,
      ...(unitTests.length ? ["Tests unitaires déjà écrits pour ce scénario :", ...unitTests.map((t) => `  - ${t}`)] : []),
      TEXTE[etape]({ nouveau, unit: L.disp.unitTests.join(", "), sources: L.disp.sources.join(", ") }),
    ].join("\n");
    const r = await w.agent(testeur ? "skraft-test" : "skraft-dev", consigne, { lectureSeule: testeur ? GELES_TESTEUR : GELES_DEV, preuve: { etape: sc.id } });
    if (r.sortie)
      return r.sortie;
    const choix = r.blocage.choix.length ? r.blocage.choix : ["Répondre"];
    await w.etape("BLOCKED");
    const rep = await w.humain("blocage", "Question de l'agent (DELIVER)", choix.map((c) => ({ id: c, label: c })), { detail: r.blocage.question });
    d.reponses = [...d.reponses, { question: r.blocage.question, answer: rep.commentaire ? `${rep.decision} (${rep.commentaire})` : rep.decision }];
    retour = etape === "fix" || etape === "fix-test" ? routes : [];
  }
}
/** La porte du pas : RED, GREEN, REFACTOR, ou correction ; elle commite et pose le point sûr suivant. */
async function porteDuPas(w, d, L, i, etape, depuis, sortie, nouveau, correction) {
  if (!(await gelIntact(w, d)))
    throw new PasRefuse("Les tests d'acceptance ont été modifiés : ils sont gelés depuis DISTILL. Le tour est annulé.");
  if (etape === "test")
    return porteRouge(w, d, L, i, depuis, sortie.coveredBy);
  if (etape === "fix-test")
    return porteCorrectionTests(w, d, L, i, depuis, sortie, correction);
  return porteVerte(w, d, L, i, etape, depuis, nouveau, sortie, correction);
}
/** Porte RED (SPEC.md §8.3) : un seul nouveau test unitaire, rouge pour une bonne raison. */
async function porteRouge(w, d, L, i, depuis, couvertPar) {
  const sc = L.scenarios[i];
  const k = natures(L.disp);
  const changes = await w.fichiersModifies(depuis);
  if (couvertPar)
    return couvertParAcceptance(w, d, L, i, changes.length, couvertPar);
  if (changes.length === 0)
    throw new PasRefuse("Aucun fichier modifié : écris un nouveau test unitaire, ou, si le test d'acceptance du scénario vérifie déjà le comportement, désigne-le dans `coveredBy`.");
  const hors = changes.filter((f) => !k.unit(f.path));
  if (hors.length)
    throw new PasRefuse(`Seuls des tests unitaires peuvent être modifiés à ce pas. Fichiers hors tests unitaires : ${hors.map((f) => f.path).join(", ")}.`);
  const run = await w.lancerTests({ etiquette: "DELIVER_RED", etape: sc.id });
  if (run.timedOut)
    throw new PasRefuse("Les tests ont dépassé le délai : le nouveau test boucle-t-il ?");
  const connus = new Set(L.baseline.all);
  const neufs = run.results.filter((r) => !connus.has(r.id) && !k.resultatAcceptance(r));
  if (neufs.length === 0)
    throw new PasRefuse("Aucun nouveau test unitaire détecté.");
  if (neufs.length > 1)
    throw new PasRefuse(`Un seul nouveau test unitaire par pas ; trouvés : ${neufs.map((r) => r.id).join(", ")}.`);
  const t = neufs[0];
  if (t.status === "passed")
    throw new PasRefuse(`Le nouveau test « ${t.id} » passe déjà : le comportement existe ou le test est trop faible.`);
  if (t.status === "skipped")
    throw new PasRefuse(`Le nouveau test « ${t.id} » est ignoré.`);
  if (t.failureKind === "other_error")
    throw new PasRefuse(`Le nouveau test échoue pour une mauvaise raison (ni assertion, ni symbole manquant) : ${premiereLigne(t.message)}`);
  const regressions = run.results.filter((r) => L.baseline.passed.includes(r.id) && r.status === "failed");
  if (regressions.length)
    throw new PasRefuse(`Des tests qui passaient ne passent plus : ${regressions.map((r) => r.id).join(", ")}.`);
  L.unitTestsHash = await w.empreinte(["@stack:unitTests"]);
  await w.commiter(`test(${d.slug}): ${sc.id}, ${t.id}`);
  const cp = await w.checkpoint(`skraft ${d.slug} : rouge ${sc.id}`);
  L.baseline = { all: uniq([...L.baseline.all, t.id]), passed: L.baseline.passed };
  L.dernierVert = cp;
  return { cp, nouveau: t.id, viaAcceptance: false, acceptanceVerte: false };
}
/** Pas « test » sans test unitaire (ADR 0045) : le test d'acceptance du scénario tient lieu de rouge. */
async function couvertParAcceptance(w, d, L, i, nbChanges, couvertPar) {
  const sc = L.scenarios[i];
  if (nbChanges > 0)
    throw new PasRefuse("Tu as déclaré le comportement couvert par l'acceptance : aucun fichier ne doit alors être modifié. Écris un test unitaire, ou ne déclare rien.");
  if (!concerns(sc.acceptanceTestId, couvertPar))
    throw new PasRefuse(`« ${couvertPar} » n'est pas le test d'acceptance du scénario : seul ${sc.acceptanceTestId} peut tenir lieu de test rouge à ce pas.`);
  const run = await w.lancerTests({ etiquette: "DELIVER_RED", etape: sc.id });
  if (run.timedOut)
    throw new PasRefuse("Les tests ont dépassé le délai.");
  const lui = run.results.find((r) => concerns(r.id, sc.acceptanceTestId));
  if (!lui)
    throw new PasRefuse(`Le test d'acceptance ${sc.acceptanceTestId} est introuvable dans les résultats.`);
  if (lui.status === "passed")
    throw new PasRefuse(`Le test d'acceptance ${sc.acceptanceTestId} est déjà vert : il n'y a plus de comportement à faire passer.`);
  if (lui.status !== "failed" || lui.failureKind === "other_error")
    throw new PasRefuse(`Le test d'acceptance échoue pour une mauvaise raison (ni assertion, ni symbole manquant) : ${premiereLigne(lui.message)}`);
  const regressions = run.results.filter((r) => L.baseline.passed.includes(r.id) && r.status === "failed");
  if (regressions.length)
    throw new PasRefuse(`Des tests qui passaient ne passent plus : ${regressions.map((r) => r.id).join(", ")}.`);
  L.unitTestsHash = await w.empreinte(["@stack:unitTests"]);
  const cp = await w.checkpoint(`skraft ${d.slug} : couvert par l'acceptance ${sc.id}`);
  L.dernierVert = cp;
  return { cp, nouveau: sc.acceptanceTestId, viaAcceptance: true, acceptanceVerte: false };
}
/** Fichiers de production du projet, concaténés : de quoi chercher un nom du contrat. */
async function texteDesSources(w, disp) {
  const parts = [];
  for (const f of (await w.listerFichiers()).filter((x) => matchesAny(disp.sources, x)))
    parts.push(await w.lireFichier(f));
  return parts.join("\n");
}
const present = (texte, id) => new RegExp(`\\b${id}\\b`).test(texte);
/** Porte GREEN, REFACTOR ou correction : tests gelés intacts, code de production seul, suite verte hors acceptance en attente. */
async function porteVerte(w, d, L, i, etape, depuis, nouveau, sortie, correction) {
  const sc = L.scenarios[i];
  if (L.unitTestsHash && (await w.empreinte(["@stack:unitTests"])) !== L.unitTestsHash)
    throw new PasRefuse("Les tests unitaires ont été modifiés pendant le pas de code : ils sont gelés depuis leur rouge. Le tour est annulé ; modifie uniquement le code de production.");
  const k = natures(L.disp);
  const changes = await w.fichiersModifies(depuis);
  if (etape !== "refactor" && !changes.some((f) => k.production(f.path)))
    throw new PasRefuse("Aucun fichier de production modifié : écris le code qui fait passer le test.");
  // Garde du contrat ratifié (ADR 0047) : une correction ne retire pas ce que le contrat exige.
  if (etape === "fix" && L.contrat.length) {
    const texte = await texteDesSources(w, L.disp);
    const disparus = L.contrat.filter((id) => !present(texte, id));
    if (disparus.length)
      throw new PasRefuse(`Cette correction retire du code des éléments du contrat ratifié (design/contracts.md) : ${disparus.join(", ")}. ` +
        "Corrige sans retirer ce que le contrat exige ; si le défaut ne peut pas être corrigé autrement, conteste-le ou déclare-le hors de ton périmètre (`outOfScope`).");
  }
  const run = await w.lancerTests({ etiquette: etape === "refactor" ? "DELIVER_REFACTOR" : "DELIVER_GREEN", etape: sc.id });
  if (run.timedOut)
    throw new PasRefuse("Les tests ont dépassé le délai : le code boucle-t-il ?");
  // Correction : plus aucun test d'acceptance n'est attendu rouge.
  const suite = problemesDeSuite(run.results, etape === "fix" ? [] : enCours(L, i, true), k.resultatAcceptance);
  if (suite.length)
    throw new PasRefuse(suite.join(" "));
  if (nouveau && etape !== "fix") {
    const siens = run.results.filter((r) => concerns(r.id, nouveau) || r.file === nouveau);
    if (siens.length === 0)
      throw new PasRefuse(`Le test du pas est introuvable : ${nouveau}.`);
    if (siens.some((r) => r.status !== "passed"))
      throw new PasRefuse(`Le test du pas ne passe pas : ${nouveau}.`);
  }
  for (const t of correction?.cibles ?? []) {
    const siens = run.results.filter((r) => concerns(r.id, t));
    if (siens.length === 0)
      throw new PasRefuse(`Le test ajouté par la correction est introuvable : ${t}.`);
    if (siens.some((r) => r.status !== "passed"))
      throw new PasRefuse(`Le test ajouté par la correction ne passe pas : ${t}.`);
  }
  const genre = { dev: "feat", green: "feat", refactor: "refactor", fix: "fix", test: "test", "fix-test": "test" }[etape];
  await w.commiter(`${genre}(${d.slug}): ${etape === "fix" ? "correction de revue" : sc.id}`);
  const cp = await w.checkpoint(`skraft ${d.slug} : ${etape} ${sc.id}`);
  L.baseline = { all: uniq([...L.baseline.all, ...run.results.map((r) => r.id)]), passed: run.results.filter((r) => r.status === "passed").map((r) => r.id) };
  L.dernierVert = cp;
  if (correction)
    correction.reponses = sortie.responses ?? [];
  return { cp, nouveau: null, viaAcceptance: false, acceptanceVerte: run.results.some((r) => r.id === sc.acceptanceTestId && r.status === "passed") };
}
/** Suite complète : verte, sauf les tests d'acceptance des scénarios pas encore livrés ; aucun test ignoré. */
function problemesDeSuite(results, attente, estAcceptance) {
  const enAttenteDe = (r) => attente.some((p) => concerns(r.id, p));
  const echecs = results.filter((r) => r.status === "failed" && !enAttenteDe(r));
  const ignores = results.filter((r) => r.status === "skipped" && !(estAcceptance(r) && enAttenteDe(r)));
  const out = [];
  if (echecs.length)
    out.push(`Tests en échec : ${echecs.map((r) => `${r.id} (${premiereLigne(r.message)})`).join("; ")}.`);
  if (ignores.length)
    out.push(`Tests ignorés (interdit) : ${ignores.map((r) => r.id).join(", ")}.`);
  return out;
}
// ---------- fin de scénario et fin de phase ----------------------------------------------------
/** Mutation des fichiers de production donnés, jugée contre la barre. */
async function muter(w, barre, sources, etiquette) {
  const m = await w.mutation();
  if (!m)
    return { motifs: [], faits: [], notes: ["Mutation non mesurée : la stack du projet ne propose pas d'outil de mutation."] };
  const faits = m.files.filter((x) => sources.some((p) => p === x.file || p.endsWith(`/${x.file}`))).map((f) => `Mutation (${etiquette}) : ${f.file} à ${f.score} %, ${f.survived.length} mutant(s) survivant(s).`);
  return { motifs: checkMutation(m, sources, barre), faits, notes: [] };
}
/** Porte de fin de scénario (§7.4) : acceptance verte, suite verte, séquence des preuves, mutation, dépendances, lint. */
async function porteScenario(w, d, L, i, depuis, unitTests) {
  const sc = L.scenarios[i];
  const { barre, notes: notesBarre } = await barreDeQualite(w, L.disp);
  const motifs = [];
  const notes = [...notesBarre];
  const faits = [];
  if (!(await gelIntact(w, d)))
    motifs.push("Les tests d'acceptance ont été modifiés : ils sont gelés depuis DISTILL.");
  const k = natures(L.disp);
  const run = await w.lancerTests({ etiquette: "DELIVER_SCENARIO", etape: sc.id });
  if (run.timedOut)
    throw new ScenarioEchoue(["Les tests ont dépassé le délai à la fin du scénario."]);
  if (run.results.find((r) => r.id === sc.acceptanceTestId)?.status !== "passed")
    motifs.push(`Le test d'acceptance du scénario n'est pas vert : ${sc.acceptanceTestId}.`);
  motifs.push(...problemesDeSuite(run.results, enCours(L, i, false), k.resultatAcceptance));
  motifs.push(...checkRedGreenSequence((await w.preuves()).filter((x) => x.stepId === sc.id), unitTests));
  const changes = (await w.fichiersModifies(depuis)).filter((f) => f.status !== "deleted" && k.production(f.path) && matchesAny(L.disp.sources, f.path));
  const sources = changes.map((f) => f.path);
  if (sources.length) {
    if (!barre.mutation.active)
      notes.push("Mutation désactivée par la barre de qualité du projet.");
    else if (barre.mutation.moment === "scenario") {
      const m = await muter(w, barre, sources, sc.id);
      motifs.push(...m.motifs);
      faits.push(...m.faits);
      notes.push(...m.notes);
    }
    if (run.coverage) {
      const diff = couvertureDuDiff(run.coverage, changes);
      notes.push(...diff.notes);
      motifs.push(...checkCoverage(diff.report, sources, barre, true));
      for (const f of diff.report.files)
        faits.push(`Couverture du diff (${sc.id}) : ${f.file} à ${Math.round(f.score * 10) / 10} %, ${f.covered} ligne(s) sur ${f.total}.`);
    }
    else
      notes.push("Couverture non mesurée : la commande de test du projet n'en produit pas.");
    const lint = await w.lint(sources);
    if (!lint?.available)
      notes.push("Qualité de forme non mesurée : le projet n'a pas de linter configuré pour cette stack.");
    else {
      const m = checkLint(lint);
      motifs.push(...m);
      const examines = lint.analyzed ?? sources;
      const omis = sources.filter((p) => !examines.includes(p));
      if (m.length === 0 && examines.length > 0)
        faits.push(`Lint (${sc.id}) : ${lint.tool ?? "linter du projet"} sans erreur sur ${examines.join(", ")}.`);
      if (omis.length > 0)
        notes.push(`Qualité de forme non mesurée sur ${omis.join(", ")} : le linter du projet ne les examine pas.`);
    }
  }
  const regles = barre.dependencyRules.length ? barre.dependencyRules : defaultDependencyRules(L.disp.infrastructureModules);
  if (regles.length === 0)
    notes.push("Règle de dépendance non vérifiée : aucune règle déclarée, et la stack du projet n'en propose pas.");
  else {
    const archi = await w.architecture(regles);
    if (archi) {
      const trouves = checkDependencies(archi);
      motifs.push(...trouves);
      if (!trouves.length)
        faits.push(`Règle de dépendance respectée : ${regles.map((r) => `${r.module} n'importe ni ${r.forbidden.join(", ni ")}`).join(" ; ")}.`);
    }
    else
      notes.push("Règle de dépendance non vérifiée : la stack du projet ne sait pas analyser les imports.");
  }
  if (motifs.length)
    throw new ScenarioEchoue(motifs);
  L.notes = uniq([...L.notes, ...notes]);
  L.faits = uniq([...L.faits, ...faits]);
}
/** Mutation de fin de DELIVER (ADR 0049, moment par défaut) : une exécution sur tout ce que la phase a modifié. */
async function mutationDeFin(w, L, cpPhase) {
  const { barre, notes } = await barreDeQualite(w, L.disp);
  if (!barre.mutation.active)
    return { motifs: [], faits: [], notes: [...notes, "Mutation désactivée par la barre de qualité du projet."] };
  if (barre.mutation.moment !== "phase-end")
    return { motifs: [], faits: [], notes };
  const k = natures(L.disp);
  const sources = (await w.fichiersModifies(cpPhase)).filter((f) => f.status !== "deleted" && k.production(f.path) && matchesAny(L.disp.sources, f.path)).map((f) => f.path);
  if (sources.length === 0)
    return { motifs: [], faits: [], notes };
  const r = await muter(w, barre, sources, "fin de DELIVER");
  return { motifs: r.motifs, faits: r.faits, notes: [...notes, ...r.notes] };
}
/** Motifs de la mutation de fin → défauts adressés au testeur (ADR 0049). */
function filsDeMutation(motifs, tour) {
  return motifs.map((description, j) => ({
    id: `mutation#${tour}.${j + 1}`,
    lens: "mutation",
    severity: "major",
    description: `${description} Ajoute le test qui tue ce mutant : il doit passer sur le code actuel et échouer sur le mutant. ` +
      "Si la ligne mutée ne sert à aucun comportement observable (code superflu), déclare ce défaut `outOfScope` : il ira au développeur.",
    target: "test",
    status: "open",
    round: tour,
  }));
}
/**
* Fin de phase : porte (livrables, mutation), revue, et corrections ciblées tant que le budget le
* permet (une correction consomme un essai). Rend les motifs d'un réessai de phase, ou aucun.
*/
async function finDePhase(w, d, s, L, cpPhase, lentilles, max, tentatives, consommer) {
  for (;;) {
    const essai = tentatives() + 1;
    const changes = (await w.fichiersModifies(cpPhase)).filter((f) => f.status !== "deleted");
    if (changes.length === 0)
      return { motifs: ["Aucun livrable produit pendant la phase DELIVER."], garanti: false, porte: "livrables" };
    if (!d.qualityCheckpoint)
      L.notes = uniq([...L.notes, "Référence de qualité initiale absente (ancienne tâche) : couverture du diff limitée à DELIVER."]);
    const sources = (await w.fichiersModifies(d.qualityCheckpoint ?? cpPhase))
      .filter((f) => f.status !== "deleted" && matchesAny(L.disp.sources, f.path) && natures(L.disp).production(f.path));
    if (sources.length) {
      const run = await w.lancerTests({ etiquette: "DELIVER_COVERAGE" });
      const problems = problemesTestsExistants(run);
      if (problems.length)
        return { motifs: problems, garanti: false, porte: "suite finale" };
      if (run.coverage) {
        const { barre } = await barreDeQualite(w, L.disp);
        const diff = couvertureDuDiff(run.coverage, sources);
        const motifs = checkCoverage(diff.report, sources.map((f) => f.path), barre, true);
        if (motifs.length)
          return { motifs, garanti: false, porte: "couverture du diff" };
        L.notes = uniq([...L.notes, ...diff.notes]);
        L.faits = uniq([...L.faits, ...diff.report.files.map((f) => `Couverture du diff (tâche) : ${f.file} à ${Math.round(f.score * 10) / 10} %, ${f.covered} ligne(s) sur ${f.total}.`)]);
      } else L.notes = uniq([...L.notes, "Couverture non mesurée : la commande de test du projet n'en produit pas."]);
    }
    const m = await mutationDeFin(w, L, cpPhase);
    if (m.motifs.length) {
      if (L.dernierVert && tentatives() + 1 < max) {
        await w.rejet("mutation (correction ciblée)", m.motifs);
        consommer();
        s.fils = [...s.fils, ...filsDeMutation(m.motifs, tentatives())];
        await corriger(w, d, L, s, max);
        continue;
      }
      return { motifs: m.motifs, garanti: false, porte: "mutation" };
    }
    await enregistrerLivrables(w, s, changes.map((c) => c.path), essai, sha256);
    L.faits = uniq([...L.faits, ...m.faits]);
    L.notes = uniq([...L.notes, ...m.notes]);
    L.contrat = await contratPresent(w, d, L.disp);
    const derniere = (await w.preuves()).filter((e) => e.source === "gate" && e.phase?.startsWith("DELIVER")).at(-1);
    const execution = derniere
      ? `Dernière exécution des tests par le code (${derniere.phase}) : ${derniere.counts.passed} réussi(s), ${derniere.counts.failed} en échec, ${derniere.counts.skipped} ignoré(s)${derniere.timedOut ? ", délai dépassé" : ""}.`
      : null;
    const revue = await reviser(w, d, s, cpPhase, "DELIVER", lentilles, essai, faitsDeLivraison(d, s, L, execution));
    if (!revue)
      return { motifs: [], garanti: false };
    const motifs = Array.isArray(revue) ? [...revue] : [...revue.motifs];
    const garanti = !Array.isArray(revue) && revue.garanti === true;
    const parHumain = s.fils.some((t) => t.status === "humanMaintained");
    if (s.fils.some(isActive) && L.dernierVert && (tentatives() + 1 < max || parHumain)) {
      await w.rejet("revue (correction ciblée)", motifs);
      consommer();
      await corriger(w, d, L, s, max);
      continue;
    }
    return { motifs, garanti, porte: "revue" };
  }
}
/** Noms du contrat ratifié présents dans le code au moment de la revue (ADR 0047). */
async function contratPresent(w, d, disp) {
  const contrat = await lireOu(w, `.skraft/${d.slug}/design/contracts.md`);
  if (contrat === null)
    return [];
  const texte = await texteDesSources(w, disp);
  return declaredIdentifiers(contrat).filter((id) => present(texte, id));
}
/** Faits de la revue de DELIVER (§9.1), établis par le code. */
function faitsDeLivraison(d, s, L, execution) {
  const faits = reviewFacts(s.livrables, "DELIVER");
  if (d.acceptanceHash)
    faits.push(`Tests d'acceptance gelés, empreinte ${d.acceptanceHash.slice(0, 12)}, vérifiée inchangée à chaque pas de DELIVER.`);
  for (const r of d.regressions)
    faits.push(`Test d'acceptance requalifié en non-régression, avec justification dans test-plan.md : ${r}.`);
  if (execution)
    faits.push(execution);
  for (const sc of L.scenarios.filter((x) => x.status === "done")) {
    if (sc.role === "regression")
      faits.push(`Scénario ${sc.id} : non-régression, vert dès DISTILL (${sc.acceptanceTestId}).`);
    else
      faits.push(`Scénario ${sc.id} : test d'acceptance vert (${sc.acceptanceTestId}) ; tests unitaires ajoutés, chacun rouge puis vert dans les preuves : ${sc.unitTests?.length ? sc.unitTests.join(", ") : "aucun"}.`);
  }
  faits.push(...L.faits, ...L.notes.map((n) => `À noter : ${n}`));
  return faits;
}
/**
* Correction ciblée (§9.3, ADR 0046) depuis le dernier vert : côté tests d'abord, puis côté code,
* chacun ne recevant que ses défauts ; un défaut renvoyé (« hors de mon périmètre ») passe à
* l'autre agent. Un échec reprend la correction à son début, dans la limite du budget.
*/
async function corriger(w, d, L, s, max) {
  const depart = L.dernierVert;
  const filsAuDepart = s.fils;
  // Le scénario courant du réducteur : le dernier scénario moteur.
  const i = L.scenarios.map((x) => x.role).lastIndexOf("driver");
  await w.rembobiner(depart);
  await creerDossiers(w, d.slug);
  for (let echecs = 1;; echecs++) {
    try {
      await deroulerCorrection(w, d, L, s, i, depart, max);
      return;
    }
    catch (e) {
      if (!(e instanceof ScenarioEchoue))
        throw e;
      await w.rejet(`correction (${L.scenarios[i].id})`, e.motifs);
      await w.rembobiner(depart);
      await creerDossiers(w, d.slug);
      s.fils = filsAuDepart;
      if (echecs >= max) {
        await escaladeScenario(w, `Scénario ${L.scenarios[i].id} : ${e.motifs.join(" ; ")}`);
        echecs = 0;
      }
    }
  }
}
async function deroulerCorrection(w, d, L, s, i, depart, max) {
  const c = { retourTests: agentFeedback(s.fils, pourTests), retourDev: agentFeedback(s.fils, pourDev), cibles: [], reponses: [] };
  let point = depart;
  let unitTests = [];
  let etape = s.fils.some((t) => isActive(t) && pourTests(t)) ? "fix-test" : "fix";
  for (;;) {
    const r = await pas(w, d, L, i, etape, point, [], max, [], null, c);
    point = r.cp;
    const concerne = etape === "fix-test" ? pourTests : pourDev;
    s.fils = endTurn(applyResponses(s.fils, c.reponses, concerne, autreAgent), concerne);
    c.reponses = [];
    if (etape === "fix-test") {
      if (s.fils.some((t) => isActive(t) && pourDev(t)) || c.cibles.length) {
        c.retourDev = agentFeedback(s.fils, pourDev);
        etape = "fix";
        continue;
      }
      break;
    }
    if (s.fils.some((t) => isActive(t) && pourTests(t))) {
      c.retourTests = agentFeedback(s.fils, pourTests);
      etape = "fix-test";
      continue;
    }
    unitTests = c.cibles;
    break;
  }
  await porteScenario(w, d, L, i, depart, unitTests);
}
/**
* Porte de la correction côté tests (ADR 0046) : des tests unitaires seulement, aucun test existant
* disparu ni cassé, un rouge éventuel pour une bonne raison. Les rouges deviennent les cibles du
* développeur. Ne rien écrire est permis : tout a pu être contesté.
*/
async function porteCorrectionTests(w, d, L, i, depuis, sortie, c) {
  const sc = L.scenarios[i];
  const k = natures(L.disp);
  const changes = await w.fichiersModifies(depuis);
  const hors = changes.filter((f) => !k.unit(f.path));
  if (hors.length)
    throw new PasRefuse(`À ce pas, seuls des tests unitaires peuvent être ajoutés. Fichiers hors tests unitaires : ${hors.map((f) => f.path).join(", ")}.`);
  const run = await w.lancerTests({ etiquette: "DELIVER_FIX_TEST", etape: sc.id });
  if (run.timedOut)
    throw new PasRefuse("Les tests ont dépassé le délai : un test ajouté boucle-t-il ?");
  const ids = new Set(run.results.map((r) => r.id));
  const disparus = L.baseline.all.filter((id) => !ids.has(id) && !run.results.some((r) => concerns(r.id, id)));
  if (disparus.length)
    throw new PasRefuse(`Des tests existants ont disparu : ${disparus.join(", ")}. Ajoute des tests, ne retire ni ne renomme les existants.`);
  const casses = run.results.filter((r) => L.baseline.passed.includes(r.id) && r.status === "failed");
  if (casses.length)
    throw new PasRefuse(`Des tests qui passaient ne passent plus : ${casses.map((r) => r.id).join(", ")}. Ne modifie pas les tests existants.`);
  const neufs = run.results.filter((r) => !L.baseline.all.includes(r.id) && !k.resultatAcceptance(r));
  const ignores = neufs.filter((r) => r.status === "skipped");
  if (ignores.length)
    throw new PasRefuse(`Tests ajoutés ignorés (interdit) : ${ignores.map((r) => r.id).join(", ")}.`);
  const mauvais = neufs.filter((r) => r.status === "failed" && r.failureKind === "other_error");
  if (mauvais.length)
    throw new PasRefuse(`Un test ajouté échoue pour une mauvaise raison (ni assertion, ni symbole manquant) : ${mauvais.map((r) => `${r.id} (${premiereLigne(r.message)})`).join("; ")}.`);
  if (changes.length)
    await w.commiter(`test(${d.slug}): correction de revue`);
  const cp = await w.checkpoint(`skraft ${d.slug} : correction côté tests ${sc.id}`);
  L.baseline = { all: uniq([...L.baseline.all, ...run.results.map((r) => r.id)]), passed: run.results.filter((r) => r.status === "passed").map((r) => r.id) };
  L.unitTestsHash = await w.empreinte(["@stack:unitTests"]);
  L.dernierVert = cp;
  c.cibles = neufs.filter((r) => r.status === "failed").map((r) => r.id);
  c.reponses = sortie.responses ?? [];
  return { cp, nouveau: null, viaAcceptance: false, acceptanceVerte: false };
}
