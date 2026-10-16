// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/livraison.ts (ADR 0055).
/**
* Phase DELIVER en workflow (SPEC-skraft §7.4) : pour chaque scénario, un test unitaire rouge, puis
* le code (un tour, `turn-per-scenario`) ou le vert puis le nettoyage (sessions séparées), jusqu'au
* vert du test d'acceptance ; porte de fin de scénario ; à la fin, mutation et revue, avec
* correction ciblée des défauts (ADR 0046, 0047). Reproduit `deliver-machine.ts` et
* `deliver-effects.ts` de skraft. Toutes les preuves viennent de `w.lancerTests` (D20).
*/
import { problemesTestsExistants, couvertureDuDiff, couchesManquantes as coreFilesMissing, correspond as matchesAny, Escalade, lireBarreDeQualite as parseQualityBar, PanneEnvironnement, SauterPhase, TourInterrompu } from "@agent-studio/workflow";
import { buildBrief, lignePile } from "./brief.mjs";
import { checkCoverage, checkDependencies, checkLint, checkMutation, checkRedGreenSequence, concerns, defaultDependencyRules, lignesSousLeSeuil, mutantsSousLeSeuil, planScenarios, sansLignesExemptees } from "./deliver.mjs";
import { levelEffects } from "./difficulty.mjs";
import { acOf, featureScenarios, verifierEcarts } from "./distill.mjs";
import { reviewFacts } from "./review-brief.mjs";
import { agentFeedback, allDisputed, applyResponses, endTurn, isActive, minorThreads } from "./review-thread.mjs";
import { ecrireRapports, enregistrerLivrables, nouveauSuivi, oublierLeRun, reviser } from "./revue.mjs";
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
  const faite = await w.phase("DELIVER", async (cp, relance) => {
    const L = await phase(w, d, suivi, cp, lentilles, max, relance);
    d.livraison = { granularity: L.granularity, scenarios: L.scenarios.map((x) => [x.id, x.role, x.status]), notes: L.notes };
    await ecrireRapports(w, d.slug, "DELIVER", suivi);
    // Dérogations de mutation commitées avec la livraison : elles restent dans l'historique du projet (ADR 0065).
    if (d.derogations.length || d.derogationsCouverture.length)
      await w.ecrireFichier(`.skraft/${d.slug}/deliver/derogations.md`, rapportDeDerogations(d));
    // Écarts au plan de test commités avec la livraison (ADR 0067).
    if (d.ecartsAuPlan.length)
      await w.ecrireFichier(`.skraft/${d.slug}/deliver/ecarts-au-plan.md`, rapportDEcarts(d));
    return true;
  }, {
    commit: commitMessage("DELIVER", d.slug),
    // Commit impossible, continué par l'humain : le bilan le dit (D19 de docs/12).
    commitManque: () => void d.nonCommitees.push("DELIVER"),
    apresRembobinage: () => {
      // Livrables et rapports du run effacé : oubliés (D6, D8 de docs/12).
      oublierLeRun(suivi);
      // Le code effacé emporte les mutants qu'on avait exemptés (ADR 0065) ; la trace les garde.
      d.derogations = [];
      d.derogationsCouverture = [];
      d.ecartsAuPlan = [];
      return creerDossiers(w, d.slug);
    },
  });
  return faite === true;
}
/**
* Budget de la phase : partagé entre les réessais de phase et les corrections de revue, comme
* `attempts` dans le réducteur (une correction en consomme un).
*/
async function phase(w, d, s, cpPhase, lentilles, max, relance) {
  let tentatives = 0;
  // Relancée après une escalade : le premier pas reçoit son motif (D15 de docs/12).
  let motifs = relance;
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
/** DISTILL sautée : rien n'est gelé, et DELIVER le dit au lieu de vérifier en silence (D1 de docs/12). */
const SANS_GEL = "DISTILL a été sautée : les tests d'acceptance ne sont pas gelés. DELIVER ne peut pas vérifier qu'ils restent inchangés.";
async function planifier(w, d) {
  const sansGel = !d.acceptanceHash && d.phasesSautees.includes("DISTILL");
  if (sansGel)
    await w.informer(SANS_GEL);
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
    notes: sansGel ? [SANS_GEL] : [],
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
      // Le scénario repart de son début : ses tests sont effacés, et les écarts qu'ils portaient avec eux (ADR 0067).
      d.ecartsAuPlan = d.ecartsAuPlan.filter((x) => x.scenario !== sc.id);
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
      // La porte du nettoyage refuse qu'il fasse repasser l'acceptance du scénario au rouge (D16 de docs/12).
      L.acceptanceVerte = vert;
      // Nettoyage refusé : retour au vert, sans escalade (SPEC.md §8.3).
      try {
        const r = await pas(w, d, L, i, "refactor", point, [], 1, unitTests, null);
        point = r.cp;
        // Le dernier état du code est celui du nettoyage : c'est lui qui dit si l'acceptance est verte.
        vert = r.acceptanceVerte;
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
      // Écarts au plan de test (ADR 0067) : vérifiés contre la matrice gardée depuis DISTILL ; une
      // déclaration fausse refuse le pas, une juste n'est gardée que si la porte du pas le valide.
      const ecarts = sortie.planDeviations ?? [];
      const motifsEcarts = ecarts.length ? verifierEcarts(ecarts, d.planDeTest ?? {}) : [];
      if (motifsEcarts.length)
        throw new PasRefuse(motifsEcarts.join(" ; "));
      const resultat = await porteDuPas(w, d, L, i, etape, depuis, sortie, nouveau, correction);
      const par = etape === "test" || etape === "fix-test" ? "skraft-test" : "skraft-dev";
      d.ecartsAuPlan = [...d.ecartsAuPlan, ...ecarts.map((x) => ({ ...x, par, scenario: L.scenarios[i].id }))];
      return resultat;
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
    "Ne modifie un test existant que pour renforcer celui qu'un défaut cite ; sinon, ajoute un test. N'écris aucun code de production. Vérifie avec run_tests.",
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
  for (;;) {
    await w.etape("DELIVER");
    const consigne = [
      buildBrief(d, "DELIVER", rejet),
      lignePile(L.disp.pile, L.disp),
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
  const retouches = testsRetouches(changes, []);
  if (retouches.length)
    throw new PasRefuse(`À ce pas, un test unitaire existant ne peut recevoir que des ajouts : ${retouches.join(", ")}. Pour renforcer un test, ajoutes-en un plus strict ; ne modifie ni ne retire les tests existants.`);
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
/**
* Fichiers de tests existants dont une ligne a été retirée ou remplacée, hors `permis` : un test
* affaibli passe toujours, seule la forme du diff le trahit (D10 de docs/12).
*/
function testsRetouches(changes, permis) {
  return changes.filter((f) => f.status !== "added" && (f.removed ?? 0) > 0 && !permis.includes(f.path)).map((f) => f.path);
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
  // Correction où tout est contesté ou renvoyé, sans test rouge à faire passer : rien à modifier,
  // la lentille arbitrera (D7 de docs/12).
  const rienAModifier = etape === "fix" && !correction.cibles.length && allDisputed(correction.fils, sortie.responses ?? [], pourDev);
  if (etape !== "refactor" && !rienAModifier && !changes.some((f) => k.production(f.path)))
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
  // Un nettoyage ne change pas le comportement : l'acceptance du scénario, verte, le reste (D16 de docs/12).
  if (etape === "refactor" && L.acceptanceVerte && run.results.find((r) => r.id === sc.acceptanceTestId)?.status !== "passed")
    throw new PasRefuse(`Le nettoyage a fait passer le test d'acceptance du scénario au rouge (${sc.acceptanceTestId}) : un nettoyage ne change pas le comportement.`);
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
async function muter(w, barre, sources, etiquette, derogations = []) {
  const m = await w.mutation();
  if (!m)
    return { motifs: [], mutants: [], faits: [], notes: ["Mutation non mesurée : la stack du projet ne propose pas d'outil de mutation."] };
  const faits = m.files.filter((x) => sources.some((p) => p === x.file || p.endsWith(`/${x.file}`))).map((f) => `Mutation (${etiquette}) : ${f.file} à ${f.score} %, ${f.survived.length} mutant(s) survivant(s).`);
  return { motifs: checkMutation(m, sources, barre, derogations), mutants: mutantsSousLeSeuil(m, sources, barre, derogations), faits, notes: [] };
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
      // Les dérogations accordées comptent ici aussi, comme dans l'extension. Elles ne naissent qu'en
      // fin de DELIVER : ce cas suppose une barre passée « par scénario » pendant le run.
      const m = await muter(w, barre, sources, sc.id, d.derogations);
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
async function mutationDeFin(w, L, cpPhase, derogations) {
  const { barre, notes } = await barreDeQualite(w, L.disp);
  if (!barre.mutation.active)
    return { motifs: [], faits: [], notes: [...notes, "Mutation désactivée par la barre de qualité du projet."] };
  if (barre.mutation.moment !== "phase-end")
    return { motifs: [], faits: [], notes };
  const k = natures(L.disp);
  const sources = (await w.fichiersModifies(cpPhase)).filter((f) => f.status !== "deleted" && k.production(f.path) && matchesAny(L.disp.sources, f.path)).map((f) => f.path);
  if (sources.length === 0)
    return { motifs: [], faits: [], notes };
  const r = await muter(w, barre, sources, "fin de DELIVER", derogations);
  return { motifs: r.motifs, mutants: r.mutants, faits: r.faits, notes: [...notes, ...r.notes] };
}
/**
* Portes de fin de DELIVER qui désignent leur correcteur : un test trop faible (mutation, lignes
* modifiées non couvertes) va au testeur, un test existant cassé au développeur.
*/
const CORRECTIONS_DE_FIN = {
  mutation: {
    id: "mutation",
    target: "test",
    consigne: "Ajoute le test qui tue ce mutant : il doit passer sur le code actuel et échouer sur le mutant. " +
      "Si la ligne mutée ne sert à aucun comportement observable (code superflu), déclare ce défaut `outOfScope` : il ira au développeur. " +
      "Si le mutant est équivalent (aucune entrée ne le distingue du code), conteste-le en le démontrant : un arbitre jugera, et l'humain si besoin.",
  },
  "couverture du diff": {
    id: "couverture",
    target: "test",
    consigne: "Ajoute le test qui exerce ces lignes par un comportement observable. " +
      "Si une ligne ne sert à aucun comportement (code superflu), déclare ce défaut `outOfScope` : il ira au développeur. " +
      "Si elle ne peut pas être exercée (code défensif inatteignable), conteste le défaut avec ta raison : l'humain tranchera.",
  },
  "suite finale": {
    id: "suite finale",
    target: "code",
    consigne: "Corrige le code pour que ce test repasse ; ne modifie pas ce test.",
  },
};
const elementDe = (m) => `${m.file}:${m.line} (${m.operator})`;
/** Lignes non couvertes → un défaut par fichier, adressé au testeur, qui garde ses lignes. */
function filsDeCouverture(lignes, tour) {
  const c = CORRECTIONS_DE_FIN["couverture du diff"];
  return lignes.map((x, j) => ({
    id: `${c.id}#${tour}.${j + 1}`,
    lens: c.id,
    severity: "major",
    description: `Couverture du diff : ${x.file}, lignes non couvertes : ${x.lines.join(", ")}. ${c.consigne}`,
    target: c.target,
    couverture: x,
    status: "open",
    round: tour,
  }));
}
/** Mutants survivants → un défaut chacun, adressé au testeur, qui garde le mutant exact (ADR 0065). */
function filsDeMutation(mutants, tour) {
  const c = CORRECTIONS_DE_FIN.mutation;
  return mutants.map((m, j) => ({
    id: `${c.id}#${tour}.${j + 1}`,
    lens: c.id,
    severity: "major",
    description: `Mutant survivant : ${elementDe(m)}${m.replacement ? ` — code du mutant : ${m.replacement}` : ""}. ${c.consigne}`,
    target: c.target,
    mutant: m,
    status: "open",
    round: tour,
  }));
}
/** Motifs d'une porte de fin de DELIVER → défauts adressés à son correcteur. */
function filsDeFin(porte, motifs, tour) {
  const c = CORRECTIONS_DE_FIN[porte];
  return motifs.map((description, j) => ({
    id: `${c.id}#${tour}.${j + 1}`,
    lens: c.id,
    severity: "major",
    description: `${description} ${c.consigne}`,
    target: c.target,
    status: "open",
    round: tour,
  }));
}
/**
* Porte de fin de DELIVER en échec avec un correcteur (ADR 0049, D5 de docs/12) : les scénarios sont
* verts, rejouer la phase ne ferait travailler personne. Correction ciblée depuis le dernier vert si
* le budget le permet ; rend vrai si elle a eu lieu.
*/
async function correctionDeFin(w, d, L, s, max, tentatives, consommer, porte, motifs, fils) {
  fils ??= (tour) => filsDeFin(porte, motifs, tour);
  if (!L.dernierVert || tentatives() + 1 >= max)
    return false;
  await w.rejet(`${porte} (correction ciblée)`, motifs);
  consommer();
  s.fils = [...s.fils, ...fils(tentatives())];
  await corriger(w, d, L, s, max);
  return true;
}
/**
* Fin de phase : porte (livrables, mutation), revue, et corrections ciblées tant que le budget le
* permet (une correction consomme un essai). Rend les motifs d'un réessai de phase, ou aucun.
*/
async function finDePhase(w, d, s, L, cpPhase, lentilles, max, tentatives, consommer) {
  for (;;) {
    const essai = tentatives() + 1;
    const changes = (await w.fichiersModifies(cpPhase)).filter((f) => f.status !== "deleted");
    // Rien produit : personne à qui adresser le motif, l'humain décide sans qu'un essai soit consommé (D5).
    if (changes.length === 0)
      throw new Escalade(["livrables : Aucun livrable produit pendant la phase DELIVER."]);
    if (!d.qualityCheckpoint)
      L.notes = uniq([...L.notes, "Référence de qualité initiale absente (ancienne tâche) : couverture du diff limitée à DELIVER."]);
    const sources = (await w.fichiersModifies(d.qualityCheckpoint ?? cpPhase))
      .filter((f) => f.status !== "deleted" && matchesAny(L.disp.sources, f.path) && natures(L.disp).production(f.path));
    if (sources.length) {
      const run = await w.lancerTests({ etiquette: "DELIVER_COVERAGE" });
      const problems = problemesTestsExistants(run);
      if (problems.length) {
        if (await correctionDeFin(w, d, L, s, max, tentatives, consommer, "suite finale", problems))
          continue;
        return { motifs: problems, garanti: false, porte: "suite finale" };
      }
      if (run.coverage) {
        const { barre } = await barreDeQualite(w, L.disp);
        // Lignes exemptées par l'humain : hors du calcul (arbitrage de la couverture contestée).
        const diff = couvertureDuDiff(run.coverage, sansLignesExemptees(sources, d.derogationsCouverture));
        const motifs = checkCoverage(diff.report, sources.map((f) => f.path), barre, true);
        if (motifs.length) {
          const lignes = lignesSousLeSeuil(diff.report, sources.map((f) => f.path), barre);
          // Un défaut par fichier, qui garde ses lignes : contesté, l'humain peut les exempter.
          const fils = lignes.length ? (tour) => filsDeCouverture(lignes, tour) : undefined;
          if (await correctionDeFin(w, d, L, s, max, tentatives, consommer, "couverture du diff", motifs, fils))
            continue;
          return { motifs, garanti: false, porte: "couverture du diff" };
        }
        L.notes = uniq([...L.notes, ...diff.notes]);
        L.faits = uniq([...L.faits, ...diff.report.files.map((f) => `Couverture du diff (tâche) : ${f.file} à ${Math.round(f.score * 10) / 10} %, ${f.covered} ligne(s) sur ${f.total}.`)]);
      } else L.notes = uniq([...L.notes, "Couverture non mesurée : la commande de test du projet n'en produit pas."]);
    }
    const m = await mutationDeFin(w, L, cpPhase, d.derogations);
    if (m.motifs.length) {
      // Un défaut par mutant survivant : chacun peut être tué, ou contesté puis arbitré (ADR 0065).
      if (await correctionDeFin(w, d, L, s, max, tentatives, consommer, "mutation", m.motifs, (tour) => filsDeMutation(m.mutants, tour)))
        continue;
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
    // Sans défaut bloquant ni majeur (D5 de docs/12) : tout est vert, rejouer la phase ne ferait
    // travailler personne. Les mineurs sont corrigés comme des majeurs ; sans aucun défaut, personne
    // à qui adresser la revue : l'humain décide, sans qu'un essai soit consommé.
    if (!s.fils.some(isActive) && L.dernierVert) {
      const mineurs = minorThreads(s.revues.at(-1).lentilles, s.revues.length);
      if (!mineurs.length)
        throw new Escalade([`Revue sans défaut à corriger : ${motifs.join(" ; ")}`]);
      if (tentatives() + 1 < max || garanti || parHumain) {
        await w.rejet("revue (correction ciblée)", agentFeedback(mineurs, () => true));
        consommer();
        s.fils = [...s.fils, ...mineurs];
        await corriger(w, d, L, s, max);
        continue;
      }
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
  for (const x of d.derogations)
    faits.push(`Dérogation de mutation (${x.par}) : ${elementDe(x)} — ${x.raison}. Mutant exempté de la porte de mutation après arbitrage.`);
  for (const x of d.ecartsAuPlan)
    faits.push(`Écart au plan déclaré par ${x.par} (scénario ${x.scenario}, critère ${x.criterion}) : prévu ${x.planned} → ${x.actual} — règle : ${x.rule}. Vérifié contre la matrice du plan de test ; à juger sur sa règle.`);
  for (const x of d.derogationsCouverture)
    faits.push(`Ligne exemptée de la couverture du diff (humain) : ${x.file}:${x.line} — ${x.raison}.`);
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
  // La mémoire revient au même point que le disque (D12 de docs/12) : sinon l'empreinte et la
  // référence des tests gardent ceux d'un essai effacé, et chaque pas de la reprise est refusé.
  const memoire = { unitTestsHash: L.unitTestsHash, baseline: L.baseline, dernierVert: L.dernierVert };
  // Le scénario courant du réducteur : le dernier scénario moteur.
  const i = L.scenarios.map((x) => x.role).lastIndexOf("driver");
  await w.rembobiner(depart);
  await creerDossiers(w, d.slug);
  let motifs = [];
  for (let echecs = 1;; echecs++) {
    try {
      await deroulerCorrection(w, d, L, s, i, depart, max, motifs);
      return;
    }
    catch (e) {
      // Panne d'environnement (D14 de docs/12) : retour à l'entrée de la correction, puis l'humain.
      // « Relancer » reprend la correction, sans essai consommé (D25) ; rien de livré n'est rejoué.
      if (e instanceof PanneEnvironnement) {
        await w.rejet(`panne (correction ${L.scenarios[i].id})`, [e.message]);
        await w.rembobiner(depart);
        await creerDossiers(w, d.slug);
        s.fils = filsAuDepart;
        Object.assign(L, memoire);
        await escaladeScenario(w, e.message);
        echecs--;
        continue;
      }
      if (!(e instanceof ScenarioEchoue))
        throw e;
      await w.rejet(`correction (${L.scenarios[i].id})`, e.motifs);
      await w.rembobiner(depart);
      await creerDossiers(w, d.slug);
      s.fils = filsAuDepart;
      Object.assign(L, memoire);
      // La reprise connaît la cause de l'échec (D15 de docs/12).
      motifs = e.motifs;
      if (echecs >= max) {
        await escaladeScenario(w, `Scénario ${L.scenarios[i].id} : ${e.motifs.join(" ; ")}`);
        echecs = 0;
      }
    }
  }
}
async function deroulerCorrection(w, d, L, s, i, depart, max, motifs) {
  const c = { retourTests: agentFeedback(s.fils, pourTests), retourDev: agentFeedback(s.fils, pourDev), cibles: [], reponses: [] };
  let point = depart;
  let unitTests = [];
  let etape = s.fils.some((t) => isActive(t) && pourTests(t)) ? "fix-test" : "fix";
  for (;;) {
    c.fils = s.fils;
    const r = await pas(w, d, L, i, etape, point, motifs, max, [], null, c);
    motifs = [];
    point = r.cp;
    const concerne = etape === "fix-test" ? pourTests : pourDev;
    s.fils = endTurn(applyResponses(s.fils, c.reponses, concerne, autreAgent), concerne);
    c.reponses = [];
    if (etape === "fix-test") {
      // Mutants contestés : l'arbitre, puis l'humain si besoin (ADR 0065). Un mutant maintenu par
      // l'humain repart au testeur.
      await arbitrerMutants(w, d, s);
      await arbitrerCouverture(w, d, s);
      if (s.fils.some((t) => isActive(t) && pourTests(t))) {
        c.retourTests = agentFeedback(s.fils, pourTests);
        continue;
      }
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
  // Renforcer un test existant est permis, s'il est cité par un défaut qui t'est adressé (D10 de docs/12).
  const cites = c.fils.filter((t) => isActive(t) && pourTests(t) && t.file).map((t) => t.file);
  const retouches = testsRetouches(changes, cites);
  if (retouches.length)
    throw new PasRefuse(`Un test unitaire existant ne peut recevoir que des ajouts, sauf s'il est cité par un défaut ci-dessus : ${retouches.join(", ")}. Ajoute plutôt un test plus strict.`);
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

/** Au-delà, l'arbitre ne peut plus exempter de mutant : l'humain tranche (ADR 0065). */
const MAX_DEROGATIONS_PAR_ARBITRE = 2;
const memeMutant = (a, b) => a.file === b.file && a.line === b.line && a.operator === b.operator;
/**
* Mutants survivants contestés par le testeur (mutant équivalent) : l'arbitre de mutation juge, et
* l'humain tranche s'il refuse ou si le plafond de ses dérogations est atteint. Chaque décision est
* tracée ; une dérogation exempte ce seul mutant de la porte (ADR 0065).
*/
async function arbitrerMutants(w, d, s) {
  const contestes = s.fils.filter((t) => t.mutant && (t.status === "contested" || t.status === "recontested"));
  if (!contestes.length)
    return;
  const statut = (t, status) => (s.fils = s.fils.map((x) => (x.id === t.id ? { ...x, status } : x)));
  // Déjà exempté (correction reprise après un échec) : rien à rejuger.
  const aJuger = [];
  for (const t of contestes)
    if (d.derogations.some((x) => memeMutant(x, t.mutant)))
      statut(t, "accepted");
    else
      aJuger.push(t);
  if (!aJuger.length)
    return;
  await w.etape("ARBITRATION");
  const restants = MAX_DEROGATIONS_PAR_ARBITRE - d.derogations.filter((x) => x.par === "agent").length;
  const jugements = new Map();
  if (restants > 0) {
    // Un défaut de travail de l'arbitre (muet, délai) n'arrête rien : son silence laisse chaque
    // mutant à l'humain, comme dans l'extension (écart relevé dans docs/skraft-fonctionnement).
    try {
      const r = await w.agent("skraft-mutation-arbiter", await briefArbitre(w, d, aJuger));
      for (const j of r.sortie?.rulings ?? [])
        jugements.set(j.defect, j);
    }
    catch (e) {
      if (!(e instanceof TourInterrompu))
        throw e;
    }
  }
  let accordes = 0;
  for (const t of aJuger) {
    const j = jugements.get(t.id);
    if (j?.decision === "accepted" && accordes < restants) {
      accordes++;
      await accorder(w, d, t, "agent", j.reason ?? "");
      statut(t, "accepted");
      continue;
    }
    if (j?.decision === "maintained")
      await w.arbitrage({ porte: "mutation", élément: elementDe(t.mutant), contestation: t.contestation ?? "", décision: "à corriger", par: "agent", raison: j.reason ?? "" });
    const avis = !j
      ? `L'arbitre n'a pas été consulté ou n'a rien rendu (plafond de ${MAX_DEROGATIONS_PAR_ARBITRE} dérogations par l'arbitre).`
      : j.decision === "accepted"
        ? `L'arbitre le juge équivalent (${j.reason ?? "sans raison"}), mais le plafond de ${MAX_DEROGATIONS_PAR_ARBITRE} dérogations par l'arbitre est atteint.`
        : `L'arbitre le juge non équivalent : ${j.reason ?? "sans raison"}.`;
    const rep = await w.humain("arbitrer-mutation", `Arbitrer un mutant (${t.id})`, [
      { id: "derogation", label: "Mutant équivalent : accorder la dérogation" },
      { id: "corriger", label: "Non équivalent : le testeur doit le tuer" },
    ], {
      detail: `Mutant survivant : ${elementDe(t.mutant)}${t.mutant.replacement ? ` — code du mutant : ${t.mutant.replacement}` : ""}\n` +
        `Contestation du testeur : « ${t.contestation ?? "?"} »\n${avis}\nJustifie ta décision en commentaire : elle est tracée et commitée.`,
      texteLibre: true,
    });
    if (rep.decision === "derogation") {
      await accorder(w, d, t, "humain", rep.commentaire ?? "(sans justification)");
      statut(t, "humanAccepted");
    }
    else {
      await w.arbitrage({ porte: "mutation", élément: elementDe(t.mutant), contestation: t.contestation ?? "", décision: "à corriger", par: "humain", raison: rep.commentaire ?? "" });
      statut(t, "humanMaintained");
    }
  }
}
async function accorder(w, d, t, par, raison) {
  await w.arbitrage({ porte: "mutation", élément: elementDe(t.mutant), contestation: t.contestation ?? "", décision: "dérogation", par, raison });
  if (!d.derogations.some((x) => memeMutant(x, t.mutant)))
    d.derogations = [...d.derogations, { file: t.mutant.file, line: t.mutant.line, operator: t.mutant.operator, par, raison, contestation: t.contestation ?? "", defaut: t.id }];
}
/** Dossier de l'arbitre : chaque mutant contesté, la contestation, et le code des fichiers mutés. */
async function briefArbitre(w, d, fils) {
  const fichiers = [...new Set(fils.map((t) => t.mutant.file))];
  const codes = [];
  for (const f of fichiers)
    codes.push(`Fichier ${f} :`, "```", await w.lireFichier(f), "```");
  return [
    `Story : ${d.story.id} — ${d.story.title ?? ""}`,
    "Mutants survivants contestés par le testeur :",
    ...fils.map((t) => `  - [${t.id}] ${elementDe(t.mutant)}${t.mutant.replacement ? ` — code du mutant : ${t.mutant.replacement}` : ""} ; contestation : « ${t.contestation ?? "?"} »`),
    ...codes,
  ].join("\n");
}
/** Fichier des dérogations, commité avec DELIVER (ADR 0065). */
/** Écarts au plan de test déclarés en DELIVER, vérifiés par le code et jugés par la revue (ADR 0067). */
function rapportDEcarts(d) {
  const cellule = (x) => x.replace(/\|/g, "\\|");
  return [
    `# Écarts au plan de test — ${d.story.id}`,
    "",
    "Tests écrits à une autre couche, ou avec une autre doublure, que la matrice de `distill/test-plan.md`. Chaque écart a été déclaré par l'agent avec la règle qui l'impose, vérifié par le code contre la matrice, puis soumis à la revue.",
    "",
    "| Scénario | Critère | Déclaré par | Prévu | Réel | Règle |",
    "| --- | --- | --- | --- | --- | --- |",
    ...d.ecartsAuPlan.map((x) => `| ${x.scenario} | ${x.criterion} | ${x.par} | ${cellule(x.planned)} | ${cellule(x.actual)} | ${cellule(x.rule)} |`),
    "",
  ].join("\n");
}
function rapportDeDerogations(d) {
  const cellule = (x) => x.replace(/\|/g, "\\|");
  return [
    `# Dérogations — ${d.story.id}`,
    "",
    ...(d.derogations.length
      ? [
          "## Mutation",
          "",
          "Mutants survivants reconnus équivalents après arbitrage, exemptés de la porte de mutation (ADR 0065).",
          "",
          "| Mutant | Décidé par | Raison | Contestation du testeur |",
          "| --- | --- | --- | --- |",
          ...d.derogations.map((x) => `| ${elementDe(x)} | ${x.par} | ${cellule(x.raison)} | ${cellule(x.contestation)} |`),
          "",
        ]
      : []),
    ...(d.derogationsCouverture.length
      ? [
          "## Couverture du diff",
          "",
          "Lignes exemptées par l'humain, après contestation du testeur.",
          "",
          "| Ligne | Décidé par | Raison | Contestation du testeur |",
          "| --- | --- | --- | --- |",
          ...d.derogationsCouverture.map((x) => `| ${x.file}:${x.line} | humain | ${cellule(x.raison)} | ${cellule(x.contestation)} |`),
          "",
        ]
      : []),
  ].join("\n");
}
/**
* Couverture du diff contestée par le testeur (code défensif inatteignable) : l'humain tranche.
* Dérogation : les lignes sortent du calcul, la décision est tracée et commitée ; sinon, à tester.
*/
async function arbitrerCouverture(w, d, s) {
  const contestes = s.fils.filter((t) => t.couverture && (t.status === "contested" || t.status === "recontested"));
  if (!contestes.length)
    return;
  await w.etape("ARBITRATION");
  for (const t of contestes) {
    const element = `${t.couverture.file}:${t.couverture.lines.join(", ")}`;
    const rep = await w.humain("arbitrer-couverture", `Arbitrer un défaut de couverture (${t.id})`, [
      { id: "derogation", label: "Lignes inatteignables ou sans comportement : accorder la dérogation" },
      { id: "corriger", label: "À tester : le testeur doit les couvrir" },
    ], {
      detail: `Lignes non couvertes : ${element}\nContestation du testeur : « ${t.contestation ?? "?"} »\nJustifie ta décision en commentaire : elle est tracée et commitée.`,
      texteLibre: true,
    });
    const derogation = rep.decision === "derogation";
    const raison = rep.commentaire ?? (derogation ? "(sans justification)" : "");
    await w.arbitrage({ porte: "couverture du diff", élément: element, contestation: t.contestation ?? "", décision: derogation ? "dérogation" : "à corriger", par: "humain", raison });
    if (derogation)
      d.derogationsCouverture = [...d.derogationsCouverture, ...t.couverture.lines.map((line) => ({ file: t.couverture.file, line, raison, contestation: t.contestation ?? "", defaut: t.id }))];
    s.fils = s.fils.map((x) => (x.id === t.id ? { ...x, status: derogation ? "humanAccepted" : "humanMaintained" } : x));
  }
}
