// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/brief.ts (ADR 0055).
/**
* Dossier de passation (SPEC.md §6.6) : construit par le code à partir des phases réellement
* exécutées ; jamais de transcription. Pur.
*/
export function buildBrief(d, phase, rejet) {
  const lines = [`Story : ${d.story.id} — ${d.story.title}`, d.story.statement, "Critères d'acceptation :"];
  for (const c of d.story.criteria)
    lines.push(`  ${c.n}. ${c.text}`);
  lines.push(`Difficulté : ${d.niveau}`);
  lines.push(`Dossier de travail : .skraft/${d.slug}/`);
  lines.push(`Phase en cours : ${phase}`);
  if (d.phasesFaites.length)
    lines.push("Phases terminées :", ...d.phasesFaites.map((p) => `  - ${p.phase}${p.fichiers.length ? ` : ${p.fichiers.join(", ")}` : ""}`));
  if (d.phasesSautees.length)
    lines.push(`Phases sautées : ${d.phasesSautees.join(", ")}`);
  const decides = d.adrs.filter((a) => a.status !== "Proposed");
  if (decides.length)
    lines.push("ADR décidés :", ...decides.map((a) => `  - ${a.id} (${a.status}) : ${a.path}`));
  const repondues = [...d.questions.filter((q) => q.answer).map((q) => ({ question: q.text, answer: q.answer })), ...d.reponses];
  if (repondues.length)
    lines.push("Réponses de l'utilisateur :", ...repondues.map((a) => `  - ${a.question} → ${a.answer}`));
  if (d.regressions.length)
    lines.push("Tests d'acceptance requalifiés en non-régression :", ...d.regressions.map((r) => `  - ${r}`));
  if (d.acceptanceHash)
    lines.push("Les tests d'acceptance sont gelés : ne les modifie jamais.");
  if (d.livres?.length)
    lines.push(`Scénarios livrés : ${d.livres.join(", ")}`);
  if (d.constats?.length)
    lines.push("Constats de DELIVER :", ...d.constats.map((n) => `  - ${n}`));
  if (rejet.length)
    lines.push("Rejet précédent :", ...rejet.map((f) => `  - ${f}`));
  return lines.join("\n");
}
