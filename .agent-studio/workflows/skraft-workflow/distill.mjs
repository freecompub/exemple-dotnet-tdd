// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/distill.ts (ADR 0055).
import { normalizeLiteral } from "./story.mjs";
/** Numéro de critère porté par un identifiant de test (`ac-2`, `Ac2`, `ac_2`). */
export function acOf(testId) {
  // `ac-2`, `AC_2`, `ac2` isolés, ou `Ac2` en camelCase (`testAc2Plafonne`).
  const m = /(?<![A-Za-z0-9])ac[-_]?(\d+)(?![0-9])/i.exec(testId) ?? /(?<=[a-z])Ac(\d+)(?![0-9])/.exec(testId);
  return m ? Number(m[1]) : null;
}
/** Texte des scénarios de chaque critère (`@ac-<n>`), toutes fonctionnalités confondues. */
export function featureScenarios(feature) {
  const out = new Map();
  const blocks = feature.split(/(?=^\s*@)/m);
  for (const b of blocks) {
    const tags = /^\s*(@[^\n]+)/.exec(b)?.[1] ?? "";
    for (const m of tags.matchAll(/@ac-(\d+)/g)) {
      const n = Number(m[1]);
      out.set(n, `${out.get(n) ?? ""}\n${b}`);
    }
  }
  return out;
}
const hasLiteral = (text, literal) => normalizeLiteral(text).includes(normalizeLiteral(literal));
/** Dans du code, un nombre se compare par sa valeur (12,5 U ↔ 12.5) ; une chaîne, mot pour mot. */
function codeHasLiteral(code, literal) {
  const num = /^(\d+(?:[.,]\d+)?)(?:\s?\S+)?$/.exec(literal.trim());
  if (!num || /[«"“]/.test(literal))
    return hasLiteral(code, literal);
  const value = num[1].replace(",", ".");
  return new RegExp(`(?<![\\d.])${value.replace(".", "[.,]")}(?![\\d])`).test(code) || hasLiteral(code, literal);
}
export function checkValues(i) {
  const reasons = [];
  const scenarios = new Map();
  for (const f of i.features)
    for (const [n, text] of featureScenarios(f.content))
      scenarios.set(n, { text: `${scenarios.get(n)?.text ?? ""}${text}`, path: scenarios.get(n)?.path ?? f.path });
  for (const c of i.criteria) {
    const scenario = scenarios.get(c.n);
    const tests = i.acceptanceTests.filter((t) => t.content.split("\n").some((l) => acOf(l) === c.n));
    if (!scenario)
      reasons.push(`Aucun scénario tagué @ac-${c.n} pour le critère ${c.n}.`);
    if (!tests.length)
      reasons.push(`Aucun test d'acceptance ne porte le marqueur ac-${c.n} (critère ${c.n}).`);
    for (const literal of c.literals) {
      if (scenario && !hasLiteral(scenario.text, literal))
        reasons.push(`La valeur « ${literal} » du critère ${c.n} n'apparaît pas dans le scénario @ac-${c.n} (${scenario.path}).`);
      if (tests.length && !tests.some((t) => codeHasLiteral(t.content, literal)))
        reasons.push(`La valeur « ${literal} » du critère ${c.n} n'apparaît pas dans le test d'acceptance du critère ${c.n} (${tests.map((t) => t.path).join(", ")}).`);
    }
  }
  return [...new Set(reasons)];
}
/**
* Porte RED d'acceptance : rouge sur assertion ou symbole manquant accepté ; autre erreur rejetée ;
* test déjà vert requalifié en non-régression s'il est justifié dans test-plan.md, sinon rejeté.
*/
export function checkAcceptanceRed(i) {
  const reasons = [];
  const regressions = [];
  // `results` est la suite ENTIÈRE ; les tests d'acceptance s'y reconnaissent au marqueur que
  // skraft exige lui-même (ADR 0041), jamais à l'endroit où le langage range ses fichiers.
  const acceptance = i.results.filter((r) => acOf(r.id) !== null);
  if (acceptance.length === 0) {
    // Deux situations que « aucun test d'acceptance » confondait, et qui n'appellent pas la même
    // correction : rien n'a tourné, ou tout a tourné sans porter de marqueur.
    if (i.results.length === 0)
      return { reasons: ["Aucun test n'a été exécuté : la suite n'a produit aucun résultat."], regressions };
    const vus = i.results.slice(0, 3).map((r) => `« ${r.id} »`).join(", ");
    return {
      reasons: [
        `${i.results.length} test(s) exécuté(s), aucun ne porte de marqueur « ac-<n> » dans son NOM (vus : ${vus}…). ` +
          `Nomme chaque test d'acceptance d'après son critère — par exemple « Ac2_… », « ac_2_… » ou « ac-2 » — sinon la porte ne peut pas le relier au critère qu'il pilote.`,
      ],
      regressions,
    };
  }
  const justified = (n) => i.testPlan.split("\n").some((l) => new RegExp(`@ac-${n}(?![0-9])`).test(l) && /r[ée]gression/i.test(l) && /justification\s*:\s*\S/i.test(l));
  for (const r of acceptance) {
    if (r.status === "failed") {
      if (r.failureKind === "other_error")
        reasons.push(`Le test d'acceptance « ${r.id} » échoue pour une mauvaise raison : ${(r.message ?? "").split("\n")[0]}`);
      continue;
    }
    if (r.status === "skipped") {
      reasons.push(`Le test d'acceptance « ${r.id} » est ignoré.`);
      continue;
    }
    const n = acOf(r.id);
    if (n !== null && justified(n))
      regressions.push(r.id);
    else
      reasons.push(`Le test d'acceptance « ${r.id} »${n !== null ? ` (critère ${n})` : ""} passe déjà : requalifiez-le en non-régression avec une justification dans test-plan.md, ou faites-le piloter un nouveau comportement.`);
  }
  return { reasons, regressions };
}
