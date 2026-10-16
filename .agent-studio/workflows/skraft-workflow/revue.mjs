// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/revue.ts (ADR 0055).
/**
* Revue à lentilles d'une phase (§9) et tour d'un spécialiste, communs à DESIGN et DISTILL. Les
* fils de défauts (ADR 0046) vivent dans `Suivi`, déclaré par la phase hors de `w.phase` : comme
* dans le réducteur, ils survivent à une relance par l'humain.
*/
import { correspond as matchesAny, Escalade, TourInterrompu } from "@agent-studio/workflow";
import { buildBrief, lignePile } from "./brief.mjs";
import { lensBrief, latestArtifacts } from "./review-brief.mjs";
import { reviewReport, synthesize } from "./review.mjs";
import { agentFeedback, applyArbitration, applyResponses, isActive, lensesAfterThreads, lensHistory, numberDefects, reviewRound } from "./review-thread.mjs";
import { GELÉS } from "./support.mjs";
/**
* `revues` ne fait que grandir : son rang numérote les rapports, qui ne reculent donc jamais, même
* sur un amendement qui ne consomme pas d'essai. `debutDuRun` marque la première revue du run en
* cours : celles d'avant ont été effacées du disque par un rembobinage (D8 de docs/12).
*/
export const nouveauSuivi = () => ({ revues: [], fils: [], livrables: [], debutDuRun: 0 });
/** Au rembobinage : livrables et rapports du run effacé oubliés (D6, D8 de docs/12). */
export function oublierLeRun(s) {
  s.livrables = [];
  s.debutDuRun = s.revues.length;
}
/**
* Tour d'un spécialiste ; ses réponses aux défauts mettent les fils à jour. Une question bloquante
* passe à l'humain, puis il repart avec la réponse et le même motif (D9 de docs/12).
*/
export async function specialiste(w, d, s, phase, nom, motifs, suffixe = "") {
  for (;;) {
    await w.etape(phase);
    // Un ADR décidé ne se réécrit plus (D3 de docs/12) : la garde refuse l'écriture.
    const decides = d.adrs.filter((a) => a.status !== "Proposed").map((a) => a.path);
    // Pile tirée de l'adaptateur, qui fait autorité (docs/15 §5).
    let pile = "";
    if (phase === "DESIGN" || phase === "DISTILL") {
      const disp = await w.disposition();
      pile = `\n${lignePile(disp.pile, disp)}`;
    }
    const r = await w.agent(nom, buildBrief(d, phase, motifs) + pile + suffixe, { lectureSeule: [...GELÉS, ...decides] });
    if (r.sortie) {
      if (r.sortie.responses?.length)
        s.fils = applyResponses(s.fils, r.sortie.responses, () => true);
      return;
    }
    const choix = r.blocage.choix.length ? r.blocage.choix : ["Répondre"];
    await w.etape("BLOCKED");
    const rep = await w.humain("blocage", `Question de l'agent (${phase})`, choix.map((c) => ({ id: c, label: c })), { detail: r.blocage.question });
    // Il repart avec la réponse ET le motif qu'il corrigeait (D9 de docs/12).
    d.reponses = [...d.reponses, { question: r.blocage.question, answer: rep.commentaire ? `${rep.decision} (${rep.commentaire})` : rep.decision }];
  }
}
/** Au-delà, une question de revue escalade : le budget ne borne plus ces rejeux (D4 de docs/12). */
const MAX_QUESTIONS_DE_REVUE = 2;
/**
* Revue à lentilles ; rend `undefined` si elle approuve, le rejet sinon.
*
* Question d'une lentille (D4 de docs/12) : une information nouvelle, pas un échec du producteur.
* Elle part à l'humain, puis la phase est rejouée avec la question et la réponse sans consommer
* d'essai (rejet `nonCompte`) ; en DELIVER, où tout est déjà vert, seule la revue est relancée.
*/
export async function reviser(w, d, s, cp, phase, lentilles, essai, faits) {
  for (;;) {
    await w.etape("REVIEW");
    const disp = await w.disposition();
    const fichiers = await fichiersDePhase(w, s, cp, disp);
    const contexte = { criteria: d.story.criteria, adrs: d.adrs.filter((a) => a.status === "Accepted"), slug: d.slug };
    const reponses = [...d.questions.filter((q) => q.answer).map((q) => ({ question: q.text, answer: q.answer })), ...d.reponses];
    const tousFaits = [...faits, ...reponses.map((r) => `Réponse de l'utilisateur : « ${r.question} » → ${r.answer}`)];
    const issues = await Promise.all(lentilles.map((l) => lentille(w, l, lensBrief(l, contexte, phase, fichiers, tousFaits, lensHistory(s.fils, l)), reponses)));
    const q = issues.find((x) => x.question);
    if (!q)
      return juger(w, d, s, phase, essai, issues.map((x) => x.sortie), disp);
    const motif = await questionDeRevue(w, d, s, phase, q);
    if (phase !== "DELIVER")
      return { motifs: [motif], porte: "question de revue", nonCompte: true };
  }
}
/**
* Une lentille, menée jusqu'à son verdict : une question nouvelle remonte ; une question déjà
* tranchée, un silence ou un délai dépassé relancent la lentille **seule**, une fois, sans toucher
* au producteur ; au second échec, « revue impossible » (escalade, sans essai consommé).
*/
async function lentille(w, l, brief, reponses) {
  const normaliser = (t) => t.toLowerCase().replace(/\s+/g, " ").trim();
  let consigne = brief;
  for (let tentative = 1;; tentative++) {
    let r;
    try {
      r = await w.agent(`skraft-lens-${l}`, consigne);
    }
    catch (e) {
      if (!(e instanceof TourInterrompu))
        throw e;
      if (tentative >= 2)
        throw new Escalade([`revue impossible : ${l}, ${e.message}`]);
      continue;
    }
    if (r.sortie)
      return { sortie: r.sortie };
    const deja = reponses.find((x) => normaliser(x.question) === normaliser(r.blocage.question));
    if (!deja)
      return { question: r.blocage.question, choix: r.blocage.choix, lentille: l };
    if (tentative >= 2)
      throw new Escalade([`revue impossible : ${l}, question déjà tranchée (« ${deja.question} » → ${deja.answer})`]);
    consigne = `${brief}\n\nTa question « ${r.blocage.question} » a déjà une réponse de l'utilisateur : ${deja.answer}. Rends ton verdict avec submit_lens_verdict.`;
  }
}
/** La question d'une lentille, soumise à l'humain ; rend le motif du rejeu, déjà tracé. */
async function questionDeRevue(w, d, s, phase, q) {
  s.questionsDeRevue = (s.questionsDeRevue ?? 0) + 1;
  if (s.questionsDeRevue > MAX_QUESTIONS_DE_REVUE)
    throw new Escalade([`Plus de ${MAX_QUESTIONS_DE_REVUE} questions de revue dans la phase ${phase} : « ${q.question} » (${q.lentille})`]);
  const choix = q.choix.length ? q.choix : ["Répondre"];
  await w.etape("BLOCKED");
  const rep = await w.humain("question-de-revue", `Question de la revue (${phase}, ${q.lentille})`, choix.map((c) => ({ id: c, label: c })), { detail: q.question });
  const answer = rep.commentaire ? `${rep.decision} (${rep.commentaire})` : rep.decision;
  d.reponses = [...d.reponses, { question: q.question, answer }];
  const motif = `Question de la revue (${q.lentille}) : ${q.question} — Réponse de l'utilisateur : ${answer}`;
  await w.rejet("question de revue", [motif]);
  return motif;
}
/** Verdicts rendus : rapports, fils de défauts, arbitrages, synthèse. */
async function juger(w, d, s, phase, essai, bruts, disp) {
  const tour = s.revues.length + 1;
  const classer = (f) => matchesAny([...disp.acceptanceTests, ...disp.unitTests], f) ? "test" : matchesAny(disp.sources, f) ? "code" : f.startsWith(".skraft/") || f.startsWith("docs/") ? "deliverable" : null;
  const verdicts = numberDefects(bruts, tour, classer);
  await ecrireRapport(w, d.slug, phase, tour, essai, verdicts);
  const r = reviewRound(s.fils, verdicts, tour);
  s.fils = r.threads;
  s.revues.push({ tour, essai, lentilles: verdicts });
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
  if (verdict === "REJECTED") {
    // Tracé comme tout rejet (D11 de docs/12) : sinon la cause n'existe que dans le texte de l'escalade.
    const motifs = motifsDeRejet(lenses);
    await w.rejet("revue", motifs);
    throw new Escalade([`Revue : verdict REJECTED (${motifs.join(" ; ")})`]);
  }
  return {
    motifs: s.fils.some(isActive) ? agentFeedback(s.fils, () => true) : [sansDefautCorrigible(lenses)],
    revue: true,
    // Première revue de la phase (ADR 0042), ou défaut maintenu par l'humain (§13, écart 9).
    garanti: s.revues.length === 1 || parHumain,
  };
}
/** Une ligne par lentille qui rejette, avec ses défauts. */
function motifsDeRejet(lenses) {
  return lenses.filter((l) => l.verdict === "REJECTED").map((l) => `${l.lens} : REJECTED${l.defects.length ? ` — ${l.defects.map((d) => d.description).join(" ; ")}` : ""}`);
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
/** Rapports d'une revue, nommés par son rang dans la phase. */
async function ecrireRapport(w, slug, phase, tour, essai, lentilles) {
  const base = `.skraft/${slug}/reviews/${phase.toLowerCase()}-review-${tour}`;
  await w.ecrireFichier(`${base}.json`, JSON.stringify(lentilles, null, 2));
  await w.ecrireFichier(`${base}.md`, reviewReport(phase, essai, lentilles));
}
/** Rapports du run en cours, réécrits avant le commit : un réessai rembobiné a pu les effacer. */
export async function ecrireRapports(w, slug, phase, s) {
  for (const r of s.revues.slice(s.debutDuRun))
    await ecrireRapport(w, slug, phase, r.tour, r.essai, r.lentilles);
}
/** Livrables d'un essai validé par la porte, avec leur empreinte. */
export async function enregistrerLivrables(w, s, chemins, essai, sha256) {
  // Les rapports de revue sont écrits par le code à chaque revue : ce ne sont pas des livrables à
  // soumettre aux lentilles (D6 de docs/12).
  for (const path of chemins.filter((p) => !p.includes("/reviews/")))
    s.livrables.push({ path, sha256: sha256(await w.lireFichier(path)), attempt: essai });
}
/** Revue « changements demandés » sans défaut blocker ni major. */
function sansDefautCorrigible(lenses) {
  const verdicts = lenses.map((l) => `${l.lens} : ${l.verdict}${l.defects.length ? ` (${l.defects.map((x) => x.description).join(" ; ")})` : ""}`);
  return `Revue « changements demandés » sans défaut bloquant ni majeur à corriger. Verdicts : ${verdicts.join(" ; ") || "aucune lentille"}.`;
}
