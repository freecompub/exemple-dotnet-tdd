// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/review.ts (ADR 0055).
// Copie de extensions/skraft/src/review.ts (2026-10-08) : skraft-workflow est indépendante de skraft
// et n'en importe rien ; une correction de l'une ne se reporte pas seule dans l'autre.
/**
* Revue (SPEC-skraft §9) : verdicts des lentilles à schéma, synthèse appliquée par le code.
*
* PROVENANCE — les quatre questions, leurs poids, la règle du minimum, l'arrêt sur question non
* couverte et l'interdiction d'un score total sont repris de **skraft-plugin**
* (GPL-3.0-or-later), branche `refactor/v1.6.0-tracking-substrate` :
* `skills/adversarial-review-lenses/SKILL.md` pour la procédure, et
* `com.anthropic.claude-code/agents/software-engineer-reviewer.md` pour la correspondance
* lentille → question, reprise telle quelle. Voir `docs/licences/autorisation-skraft.md`.
*
* ADAPTATION — dans le dépôt d'origine, la synthèse est faite par l'agent réviseur. Ici elle est
* **exécutée par le code** : c'est le principe directeur du projet, et cela rend la revue
* rejouable à l'identique depuis son seul JSON.
*/
/**
* Les quatre questions auxquelles toute revue doit répondre, et le poids de chacune. Une revue qui
* en laisse une sans réponse n'est pas une revue : ce n'est pas la lentille qui est obligatoire,
* c'est la question. `answeredBy` nomme les lentilles qui y répondent — correspondance reprise
* telle quelle de `software-engineer-reviewer.md`.
*/
export const REVIEW_QUESTIONS = {
  completeness: { weight: 0.3, answeredBy: ["quality-gates", "test-integrity"] },
  businessFit: { weight: 0.3, answeredBy: ["cold-reader"] },
  quality: { weight: 0.15, answeredBy: ["quality-gates", "architecture", "test-integrity"] },
  risk: { weight: 0.25, answeredBy: ["quality-gates", "architecture", "test-integrity", "cold-reader"] },
};
/**
* Note d'une lentille : `0` quand elle signale un défaut rédhibitoire — un `blocker`, ou un rejet
* franc —, `0.5` quand elle a trouvé quelque chose de moindre, `1` quand elle n'a rien trouvé.
*/
function noterLentille(l) {
  if (l.verdict === "REJECTED" || l.defects.some((d) => d.severity === "blocker"))
    return 0;
  return l.defects.length > 0 ? 0.5 : 1;
}
/**
* Ce que chaque question retient : **la note la plus basse** parmi les lentilles qui y répondent.
* Une lentille satisfaite ne rattrape pas une lentille inquiète sur la même question.
*/
export function assessQuestions(lenses) {
  return Object.keys(REVIEW_QUESTIONS).map((question) => {
    const { weight, answeredBy } = REVIEW_QUESTIONS[question];
    const presentes = lenses.filter((l) => answeredBy.includes(l.lens));
    if (presentes.length === 0)
      return { question, weight, answeredBy: [], rating: null, contribution: null };
    const rating = presentes.map(noterLentille).reduce((a, b) => (b < a ? b : a));
    return { question, weight, answeredBy: presentes.map((l) => l.lens), rating, contribution: Number((rating * weight).toFixed(4)) };
  });
}
/** Questions qu'aucune lentille présente n'a traitées. Une question non posée ne revient jamais propre. */
export function uncoveredQuestions(lenses) {
  return assessQuestions(lenses)
    .filter((q) => q.rating === null)
    .map((q) => q.question);
}
/**
* Verdict de §9.3. Les contributions pondérées **éclairent** la synthèse, elles ne la décident
* pas : une porte, un `blocker` ou une règle de gravité l'emportent toujours sur un calcul.
* Fonction pure : mêmes JSON, même verdict.
*/
export function synthesize(lenses) {
  if (lenses.length === 0)
    return "CHANGES_REQUESTED";
  if (lenses.filter((l) => l.verdict === "REJECTED").length >= 2)
    return "REJECTED";
  if (lenses.some((l) => l.defects.some((d) => d.severity === "blocker")))
    return "CHANGES_REQUESTED";
  // Arrêt sur question non couverte : approuver sans avoir posé une question reviendrait à la
  // déclarer propre sans l'avoir examinée.
  if (uncoveredQuestions(lenses).length > 0)
    return "CHANGES_REQUESTED";
  if (lenses.every((l) => l.verdict === "APPROVED") && !lenses.some((l) => l.defects.some((d) => d.severity === "major")))
    return "APPROVED";
  return "CHANGES_REQUESTED";
}
/** Défauts transmis au spécialiste lors d'un réessai : `blocker` et `major` seulement, avec fichier et ligne. */
export function actionableDefects(lenses) {
  return lenses.flatMap((l) => l.defects
    .filter((d) => d.severity !== "minor")
    .map((d) => `[${l.lens}, ${d.severity}] ${d.description}${d.file ? ` (${d.file}${d.line ? `:${d.line}` : ""})` : ""}`));
}
/** Rapport lisible généré par le code depuis les verdicts des lentilles (§9.3). Pur, déterministe. */
export function reviewReport(phase, attempt, lenses) {
  const lines = [`# Revue ${phase}, essai ${attempt}`, "", `Verdict (synthèse du code) : ${synthesize(lenses)}`, ""];
  // Les contributions sont publiées question par question, et **jamais additionnées** : un total
  // unique masquerait qu'une porte l'emporte toujours sur un calcul.
  lines.push("## Questions", "", "| Question | Répondue par | Poids | Contribution |", "| --- | --- | --- | --- |");
  for (const q of assessQuestions(lenses))
    lines.push(q.rating === null
      ? `| ${q.question} | **aucune lentille** | ${q.weight} | — |`
      : `| ${q.question} | ${q.answeredBy.join(", ")} | ${q.weight} | ${q.contribution} |`);
  const ouvertes = uncoveredQuestions(lenses);
  lines.push("", ...(ouvertes.length ? [`Questions restées sans réponse : **${ouvertes.join(", ")}**.`, ""] : []));
  for (const v of lenses) {
    lines.push(`## Lentille ${v.lens} : ${v.verdict}`, "");
    if (!v.defects.length)
      lines.push("Aucun défaut.", "");
    for (const d of v.defects)
      lines.push(`- ${d.id ? `\`${d.id}\` ` : ""}**${d.severity}**${d.target ? ` (${d.target})` : ""} ${d.description}${d.file ? ` (${d.file}${d.line ? `:${d.line}` : ""})` : ""}`);
    for (const r of v.rulings ?? [])
      lines.push(`- arbitrage sur \`${r.defect}\` : **${r.decision}**${r.reason ? ` — ${r.reason}` : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}
/** Relit les verdicts d'un rapport JSON, en ne gardant que les champs connus (zod n'est pas disponible dans un workflow). */
function lireVerdicts(brut) {
  const texte = (v, nom) => {
    if (typeof v !== "string") throw new Error(`Rapport de revue illisible : ${nom}`);
    return v;
  };
  const parmi = (v, valeurs, nom) => {
    if (!valeurs.includes(v)) throw new Error(`Rapport de revue illisible : ${nom}`);
    return v;
  };
  if (!Array.isArray(brut)) throw new Error("Rapport de revue illisible : liste attendue");
  return brut.map((l) => ({
    lens: texte(l.lens, "lens"),
    verdict: parmi(l.verdict, ["APPROVED", "CHANGES_REQUESTED", "REJECTED"], "verdict"),
    defects: (Array.isArray(l.defects) ? l.defects : []).map((d) => ({
      severity: parmi(d.severity, ["blocker", "major", "minor"], "severity"),
      description: texte(d.description, "description"),
      ...(typeof d.file === "string" ? { file: d.file } : {}),
      ...(typeof d.line === "number" ? { line: d.line } : {}),
      ...(d.target !== undefined ? { target: parmi(d.target, ["test", "code", "deliverable"], "target") } : {}),
      ...(typeof d.id === "string" ? { id: d.id } : {}),
      ...(typeof d.targetNote === "string" ? { targetNote: d.targetNote } : {}),
    })),
    ...(Array.isArray(l.rulings)
      ? { rulings: l.rulings.map((r) => ({ defect: texte(r.defect, "defect"), decision: parmi(r.decision, ["accepted", "maintained"], "decision"), ...(typeof r.reason === "string" ? { reason: r.reason } : {}) })) }
      : {}),
  }));
}
/** Rejoue une revue depuis son JSON : même verdict, même rapport (critère de sortie de S6). */
export function replayReview(phase, attempt, json) {
  const lenses = lireVerdicts(JSON.parse(json));
  return { verdict: synthesize(lenses), markdown: reviewReport(phase, attempt, lenses) };
}
