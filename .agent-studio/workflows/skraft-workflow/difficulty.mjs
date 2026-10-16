// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/difficulty.ts (ADR 0055).
/** Seuils de la grille initiale ; réglables, à ajuster d'après les mesures d'usage (D37). */
export const DEFAULT_THRESHOLDS = {
  challengingModules: 3,
  challengingQuestions: 2,
  hardCriteria: 5,
  hardModules: 3,
  mediumCriteria: 3,
  mediumModules: 2,
};
const LEVELS = ["simple", "medium", "medium-hard", "challenging"];
export function gradeDifficulty(i, t) {
  if ((i.newExternalIntegration && i.modulesTouched >= t.challengingModules) || i.openBusinessQuestions >= t.challengingQuestions)
    return "challenging";
  if (i.acceptanceCriteria > t.hardCriteria || i.modulesTouched >= t.hardModules || i.openBusinessQuestions >= 1)
    return "medium-hard";
  if (i.acceptanceCriteria >= t.mediumCriteria || i.modulesTouched >= t.mediumModules)
    return "medium";
  return "simple";
}
/** Un cran de plus ou de moins (proposition du classifieur), borné. */
export function shift(level, delta) {
  const i = Math.min(LEVELS.length - 1, Math.max(0, LEVELS.indexOf(level) + delta));
  return LEVELS[i];
}
export function isDifficulty(x) {
  return typeof x === "string" && LEVELS.includes(x);
}
const EXTERNAL = /\b(API|REST|GraphQL|webhook|base de données|SQL|file de messages|Kafka|RabbitMQ|service externe|FHIR|HL7|SMTP|S3)\b/i;
/** Indicateurs de §8.1 calculés depuis la story et la forme du dépôt. */
export function computeIndicators(story, repo) {
  const text = `${story.title}\n${story.statement}\n${story.criteria.map((c) => c.text).join("\n")}`.toLowerCase();
  const touched = repo.modules.filter((m) => {
    if (text.includes(m.toLowerCase()))
      return true;
    return (repo.keywords[m] ?? []).some((k) => text.includes(k.toLowerCase()));
  });
  const external = EXTERNAL.exec(`${story.statement}\n${story.criteria.map((c) => c.text).join("\n")}`);
  const mentionedInCode = external ? repo.files.some((f) => f.toLowerCase().includes(external[1].toLowerCase())) : false;
  return {
    acceptanceCriteria: story.criteria.length,
    modulesTouched: touched.length,
    newExternalIntegration: !!external && !mentionedInCode,
    // Toute question ouverte d'une story porte a priori sur une règle métier ; le classifieur peut nuancer.
    openBusinessQuestions: story.openQuestions.length,
  };
}
/**
* Lentilles que la phase peut réellement occuper (ADR 0028).
*
* `quality-gates` confronte les livrables aux faits **mesurés** par le code — tests, couverture,
* mutation, lint. En DESIGN, rien de tout cela n'existe : aucun test n'a encore été écrit. Sommée
* de rendre un verdict sans matière, elle invente un grief dans une catégorie voisine : le 28/09
* elle a reproché deux fois de suite à des documents de conception de décrire la cible plutôt que
* l'existant — reproche qu'un document de conception ne peut structurellement pas satisfaire.
*
* Une porte ne doit pas attester ce qu'elle n'a pas mesuré ; elle ne doit pas non plus le
* **reprocher**. Le retrait est légitime parce que les trois autres lentilles couvrent à elles
* seules les quatre questions de `review.ts` — un test le vérifie pour chaque couple
* (niveau, phase), sans quoi écarter une lentille interdirait l'approbation.
*/
export function lensesForPhase(lenses, phase) {
  return phase === "DESIGN" ? lenses.filter((l) => l !== "quality-gates") : [...lenses];
}
/** Effets du niveau (§8.3) : les moyens changent, jamais la logique de contrôle. */
export function levelEffects(level) {
  // Quel que soit le niveau, le jeu retenu doit couvrir les quatre questions de `review.ts` :
  // une question laissée sans lentille interdit l'approbation. En `simple`, `cold-reader` et
  // `test-integrity` y suffisent à elles deux.
  const all = ["cold-reader", "test-integrity", "architecture", "quality-gates"];
  switch (level) {
    case "simple":
      return { skipResearch: true, granularity: "turn-per-scenario", lenses: ["cold-reader", "test-integrity"], maxAttempts: 2 };
    case "medium":
      return { skipResearch: true, granularity: "turn-per-scenario", lenses: all, maxAttempts: 3 };
    case "medium-hard":
      return { skipResearch: false, granularity: "turn-per-scenario", lenses: all, maxAttempts: 3 };
    case "challenging":
      return { skipResearch: false, granularity: "session-per-step", lenses: all, maxAttempts: 3 };
  }
}
