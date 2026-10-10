// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/review-brief.ts (ADR 0055).
const short = (h) => h.slice(0, 12);
/** Livrables du dernier essai validé, dernière empreinte par chemin. */
export function latestArtifacts(records) {
  const last = Math.max(0, ...records.map((a) => a.attempt));
  const byPath = new Map();
  for (const a of records)
    if (a.attempt === last)
      byPath.set(a.path, a);
  return [...byPath.values()];
}
/** Faits établis par le code pour la revue (§9.1) ; DESIGN n'exécute aucun test, donc aucune preuve. */
export function reviewFacts(livrables, phase) {
  return latestArtifacts(livrables).map((a) => `Livrable ${a.path} : porte de ${phase} validée à l'essai ${a.attempt} (sha256 ${short(a.sha256)}).`);
}
const list = (title, xs) => (xs.length ? [title, ...xs.map((x) => `  - ${x}`)] : []);
export function lensBrief(lens, c, phase, files, facts, history = []) {
  const lines = [`Revue de la phase ${phase}.`, ...history];
  const factBlock = list("Faits établis par le code (acquis : ne les revérifie pas) :", facts);
  switch (lens) {
    case "cold-reader":
      lines.push("Tu n'as aucun contexte du producteur : juge uniquement ce que disent les fichiers ci-dessous.", ...list("Livrables :", files.artifacts), ...list("Code :", files.code), ...list("Tests :", files.tests));
      break;
    case "test-integrity":
      lines.push(...list("Critères d'acceptation :", c.criteria.map((x) => `${x.n}. ${x.text}`)), ...list("Tests :", files.tests), ...list("Livrables :", files.artifacts), ...factBlock);
      break;
    case "architecture":
      lines.push(...list("ADR ratifiés :", c.adrs.map((a) => `${a.id} : ${a.path}`)), ...list("Code :", files.code), ...list("Livrables :", files.artifacts), ...factBlock);
      break;
    case "quality-gates":
      lines.push("Tu n'exécutes rien.");
      if (facts.length)
        lines.push("Les faits ci-dessous sont établis par le code et font foi : vérifie que les livrables leur sont fidèles, et signale ce qu'ils passent sous silence.", ...factBlock);
      else
        lines.push("**Aucune mesure n'existe à ce stade de la tâche** : ni test exécuté, ni couverture, ni mutation, ni lint.", "Un écart que tu ne peux confronter à aucune mesure n'est pas de ton ressort — n'invente pas de défaut pour avoir quelque chose à dire.", "Il te reste une chose à chercher, et une seule : un livrable qui **se prévaut** d'une qualité que rien n'a mesurée. S'il n'y en a pas, approuve sans défaut.");
      lines.push(...list("Livrables :", files.artifacts));
      break;
  }
  return lines.join("\n");
}
