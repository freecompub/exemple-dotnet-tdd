// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/revue.ts (ADR 0055).
/**
* Revue à lentilles d'une phase (§9) et tour d'un spécialiste, communs à DESIGN et DISTILL. Les
* fils de défauts (ADR 0046) vivent dans `Suivi`, déclaré par la phase hors de `w.phase` : comme
* dans le réducteur, ils survivent à une relance par l'humain.
*/
import { correspond as matchesAny, Escalade, TourInterrompu } from "@agent-studio/workflow";
import { buildBrief } from "./brief.mjs";
import { lensBrief, latestArtifacts } from "./review-brief.mjs";
import { reviewReport, synthesize } from "./review.mjs";
import { agentFeedback, applyArbitration, applyResponses, isActive, lensesAfterThreads, lensHistory, numberDefects, reviewRound } from "./review-thread.mjs";
import { GELÉS } from "./support.mjs";
export const nouveauSuivi = () => ({ revues: [], fils: [], livrables: [] });
/**
* Tour d'un spécialiste ; ses réponses aux défauts mettent les fils à jour. Une question bloquante
* passe à l'humain, puis il repart sans motif (comme le réducteur).
*/
export async function specialiste(w, d, s, phase, nom, motifs, suffixe = "") {
  let retour = motifs;
  for (;;) {
    await w.etape(phase);
    const r = await w.agent(nom, buildBrief(d, phase, retour) + suffixe, { lectureSeule: GELÉS });
    if (r.sortie) {
      if (r.sortie.responses?.length)
        s.fils = applyResponses(s.fils, r.sortie.responses, () => true);
      return;
    }
    const choix = r.blocage.choix.length ? r.blocage.choix : ["Répondre"];
    await w.etape("BLOCKED");
    const rep = await w.humain("blocage", `Question de l'agent (${phase})`, choix.map((c) => ({ id: c, label: c })), { detail: r.blocage.question });
    d.reponses = [...d.reponses, { question: r.blocage.question, answer: rep.commentaire ? `${rep.decision} (${rep.commentaire})` : rep.decision }];
    retour = [];
  }
}
/** Revue à lentilles ; rend `undefined` si elle approuve, le rejet sinon. */
export async function reviser(w, d, s, cp, phase, lentilles, essai, faits) {
  await w.etape("REVIEW");
  const tour = s.revues.length + 1;
  const disp = await w.disposition();
  const classer = (f) => matchesAny([...disp.acceptanceTests, ...disp.unitTests], f) ? "test" : matchesAny(disp.sources, f) ? "code" : f.startsWith(".skraft/") || f.startsWith("docs/") ? "deliverable" : null;
  const fichiers = await fichiersDePhase(w, s, cp, disp);
  const contexte = { criteria: d.story.criteria, adrs: d.adrs.filter((a) => a.status === "Accepted") };
  const bruts = await Promise.all(lentilles.map(async (l) => {
    const r = await w.agent(`skraft-lens-${l}`, lensBrief(l, contexte, phase, fichiers, faits, lensHistory(s.fils, l)));
    if (!r.sortie)
      throw new TourInterrompu(`Blocage inattendu : ${r.blocage.question}`);
    return r.sortie;
  }));
  const verdicts = numberDefects(bruts, tour, classer);
  await ecrireRapport(w, d.slug, phase, essai, verdicts);
  const r = reviewRound(s.fils, verdicts, tour);
  s.fils = r.threads;
  s.revues.push({ essai, lentilles: verdicts });
  // Contesté deux fois, maintenu deux fois : l'humain tranche, tous les désaccords à la fois.
  let lenses = r.lenses;
  let parHumain = false;
  if (r.persistent.length) {
    await w.etape("ARBITRATION");
    const decisions = await Promise.all(r.persistent.map((t) => arbitrer(w, t)));
    for (const [i, t] of r.persistent.entries())
      s.fils = applyArbitration(s.fils, `${decisions[i]}:${t.id}`);
    lenses = lensesAfterThreads(verdicts, s.fils);
    parHumain = s.fils.some((t) => t.status === "humanMaintained");
  }
  const verdict = synthesize(lenses);
  if (verdict === "APPROVED")
    return undefined;
  if (verdict === "REJECTED")
    throw new Escalade(["Revue : verdict REJECTED"]);
  return {
    motifs: s.fils.some(isActive) ? agentFeedback(s.fils, () => true) : [sansDefautCorrigible(lenses)],
    revue: true,
    // Première revue de la phase (ADR 0042), ou défaut maintenu par l'humain (§13, écart 9).
    garanti: s.revues.length === 1 || parHumain,
  };
}
async function arbitrer(w, t) {
  const d = await w.humain("arbitrer", `Arbitrer un désaccord de revue (${t.id})`, [
    { id: "accept", label: "Donner raison à l'agent : le défaut tombe" },
    { id: "maintain", label: "Donner raison à la lentille : à corriger" },
  ], {
    detail: `Défaut ${t.severity} signalé par la lentille ${t.lens} : ${t.description}${t.file ? ` (${t.file}${t.line ? `:${t.line}` : ""})` : ""}\n` +
      `L'agent le conteste : « ${t.contestation ?? "?"} »\n` +
      `La lentille le maintient${t.ruling ? ` : « ${t.ruling} »` : ""}.`,
  });
  return d.decision;
}
/** Fichiers de la phase depuis son checkpoint : livrables, code, tests (rapports de revue exclus). */
async function fichiersDePhase(w, s, cp, disp) {
  const changes = (await w.fichiersModifies(cp)).filter((f) => f.status !== "deleted" && !f.path.includes("/reviews/")).map((f) => f.path);
  // Approximation du `isTestFile` de l'adaptateur par ses emplacements déclarés.
  const tests = changes.filter((p) => matchesAny([...disp.acceptanceTests, ...disp.unitTests], p));
  const code = changes.filter((p) => !tests.includes(p) && matchesAny(disp.sources, p));
  const existants = new Set(await w.listerFichiers());
  const derniers = latestArtifacts(s.livrables).map((a) => a.path).filter((p) => existants.has(p));
  return { artifacts: [...new Set([...derniers, ...changes.filter((p) => !tests.includes(p) && !code.includes(p))])], code, tests };
}
/** Rapports d'une revue ; réécrits avant le commit, un rembobinage a pu les effacer. */
export async function ecrireRapport(w, slug, phase, essai, lentilles) {
  const base = `.skraft/${slug}/reviews/${phase.toLowerCase()}-review-${essai}`;
  await w.ecrireFichier(`${base}.json`, JSON.stringify(lentilles, null, 2));
  await w.ecrireFichier(`${base}.md`, reviewReport(phase, essai, lentilles));
}
/** Livrables d'un essai validé par la porte, avec leur empreinte. */
export async function enregistrerLivrables(w, s, chemins, essai, sha256) {
  for (const path of chemins)
    s.livrables.push({ path, sha256: sha256(await w.lireFichier(path)), attempt: essai });
}
/** Revue « changements demandés » sans défaut blocker ni major. */
function sansDefautCorrigible(lenses) {
  const verdicts = lenses.map((l) => `${l.lens} : ${l.verdict}${l.defects.length ? ` (${l.defects.map((x) => x.description).join(" ; ")})` : ""}`);
  return `Revue « changements demandés » sans défaut bloquant ni majeur à corriger. Verdicts : ${verdicts.join(" ; ") || "aucune lentille"}.`;
}
