// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/deliver.ts (ADR 0055).
// Copie de extensions/skraft/src/deliver.ts (2026-10-08) : skraft-workflow est indépendante de skraft
// et n'en importe rien ; une correction de l'une ne se reporte pas seule dans l'autre.
/**
* Fonctions pures de DELIVER (SPEC-skraft §7.4) : plan des scénarios, séquence rouge puis vert
* dans les preuves, seuils de mutation par couche, règle de dépendance, Object Calisthenics
* mesurables. Aucune I/O : les effets leur passent le contenu lu par le code.
*/
import { coucheDe as layerOf } from "@agent-studio/workflow";
import { acOf } from "./distill.mjs";
/**
* Scénarios de DELIVER : un par test d'acceptance, dans l'ordre de `impl-plan.md` (première mention
* de `ac-<n>`), puis les critères non cités par numéro croissant. Les tests requalifiés en
* non-régression sont déjà faits : ils doivent seulement rester verts.
*/
export function planScenarios(input) {
  const order = [];
  for (const m of input.implPlan.matchAll(/@?\bac-(\d+)\b/gi)) {
    const n = Number(m[1]);
    if (!order.includes(n))
      order.push(n);
  }
  const rank = (n) => (order.includes(n) ? order.indexOf(n) : order.length + n);
  const tests = input.acceptanceTestIds
    .map((id) => ({ id, ac: acOf(id) }))
    .filter((t) => t.ac !== null)
    .sort((a, b) => rank(a.ac) - rank(b.ac) || a.id.localeCompare(b.id));
  const seen = new Map();
  return tests.map((t) => {
    const k = (seen.get(t.ac) ?? 0) + 1;
    seen.set(t.ac, k);
    const regression = input.regressions.includes(t.id);
    return {
      id: k === 1 ? `ac-${t.ac}` : `ac-${t.ac}#${k}`,
      ac: t.ac,
      acceptanceTestId: t.id,
      role: regression ? "regression" : "driver",
      status: regression ? "done" : "pending",
    };
  });
}
/**
* Un résultat désigne-t-il ce test ? Un fichier qui ne compile plus apparaît sous son seul nom :
* - en `chemin > test` (Vitest, Swift), le chemin est un préfixe de l'identifiant ;
* - en JUnit, l'identifiant est une classe qualifiée (`Projet.Tests.QuantiteTests.Methode`) : le
*   fichier `…/QuantiteTests.cs` désigne alors les tests de la classe du même nom. Le 03/10, faute
*   de cette règle, la porte GREEN a déclaré introuvable un test rouge par compilation devenu vert.
*/
export const concerns = (resultId, testId) => resultId === testId || testId.startsWith(`${resultId} > `) || resultId.startsWith(`${testId} > `) || fileDesignatesClass(testId, resultId) || fileDesignatesClass(resultId, testId);
/** `tests/X/QuantiteTests.cs` désigne `A.B.QuantiteTests.M` : le nom du fichier est un segment de classe de l'identifiant. */
function fileDesignatesClass(path, id) {
  const m = /[/\\]([^/\\]+)\.[A-Za-z0-9]+$/.exec(path);
  if (!m || /[/\\]/.test(id))
    return false;
  // Tous les segments sauf le dernier, qui est le nom de la méthode.
  return id.split(".").slice(0, -1).includes(m[1]);
}
/** Porte de fin de scénario : au moins un rouge (bonne raison) puis un vert par test unitaire ajouté. */
export function checkRedGreenSequence(evidence, unitTests) {
  const reasons = [];
  for (const t of unitTests) {
    const red = evidence.findIndex((e) => e.failing.some((f) => concerns(f.id, t) && (f.failureKind === "assertion" || f.failureKind === "missing_symbol")));
    if (red === -1) {
      reasons.push(`Aucune exécution rouge du test unitaire « ${t} » dans les preuves.`);
      continue;
    }
    const green = evidence.slice(red + 1).some((e) => !e.timedOut && e.testIds.some((id) => concerns(id, t)) && !e.failing.some((f) => concerns(f.id, t)));
    if (!green)
      reasons.push(`Aucune exécution verte du test unitaire « ${t} » après son rouge dans les preuves.`);
  }
  return reasons;
}
// ---------- barre de qualité (configurable par projet) ---------------------------------
// La barre vit dans `.agent-studio/quality.yaml`, commune aux extensions (ADR 0049) : lue par
// `parseQualityBar` de `@agent-studio/extension-api`. L'ancien `.skraft/quality.json` est relu, converti.
/**
* Règles appliquées quand le projet n'en déclare aucune : le domaine n'importe pas ce que la
* stack tient pour de l'infrastructure. Les noms viennent de `ctx.stack`, jamais d'ici.
*/
export function defaultDependencyRules(infrastructureModules) {
  if (infrastructureModules.length === 0)
    return [];
  return [{ module: "Domain", forbidden: [...infrastructureModules] }];
}
// Les seuils de forme ne figurent plus ici : ils appartiennent à la configuration du linter du
// projet (`.eslintrc`, `.swiftlint.yml`…), seul endroit où ils ne peuvent pas se contredire.
export { lireBarreDeQualite as parseQualityBar } from "@agent-studio/workflow";
/**
* Seuils de couverture sur les fichiers de production du scénario. Plancher de la mutation : elle
* dit si le code est atteint, pas si les tests le jugent — mais elle est presque toujours
* disponible, là où un outil de mutation manque souvent.
*
* Un fichier absent du rapport n'est pas reproché : il n'a pas été mesuré, et le compter à zéro
* serait attester d'une mesure qui n'a pas eu lieu.
*/
export function checkCoverage(report, sources, bar, diff = false) {
  const reasons = [];
  for (const path of sources) {
    const seuil = bar.coverage[layerOf(path, bar)];
    if (seuil === undefined)
      continue; // le projet n'exige rien : le fait suffit
    const f = report.files.find((x) => x.file === path || path.endsWith(`/${x.file}`));
    if (!f)
      continue;
    if (f.score + 1e-9 < seuil) {
      const missing = diff ? f.lines?.filter((l) => !l.covered).map((l) => l.number) ?? [] : [];
      reasons.push(`Couverture${diff ? " du diff" : ""} : ${path} à ${round(f.score)} % (minimum ${seuil} %), ${f.covered} ligne(s) couverte(s) sur ${f.total}.${missing.length ? ` Lignes non couvertes : ${missing.join(", ")}.` : ""}`);
    }
  }
  return reasons;
}
/** Seuils de mutation sur les fichiers de production : par couche (domaine, application, reste), ADR 0049. */
export function checkMutation(report, sources, bar) {
  const reasons = [];
  for (const path of sources) {
    const f = report.files.find((x) => x.file === path || path.endsWith(`/${x.file}`));
    if (!f)
      continue; // aucun mutant applicable dans ce fichier
    const threshold = bar.mutation[layerOf(path, bar)];
    if (f.score + 1e-9 < threshold) {
      const survivors = f.survived.map((s) => `ligne ${s.line} (${s.operator})`).join(", ");
      reasons.push(`Mutation : ${path} à ${round(f.score)} % (minimum ${threshold} %)${survivors ? ` ; mutants survivants : ${survivors}` : ""}.`);
    }
  }
  return reasons;
}
const round = (n) => Math.round(n * 10) / 10;
export function checkDependencies(report) {
  return report.violations.map((v) => `Règle de dépendance : ${v.file} (module ${v.module}) importe ${v.imported}.`);
}
export const dependencyRules = (bar) => bar.dependencyRules;
// ---------- Qualité de forme : le linter du projet ------------------------------------
/**
* La qualité de forme — longueur des méthodes, imbrication, nombre d'attributs — est jugée par
* le linter que le projet a déjà configuré, avec ses propres seuils. Un analyseur maison
* imposerait une seconde autorité, qui rejetterait du code que la CI du projet accepte, et ne
* saurait lire que les langages dont on aurait écrit la grammaire.
*
* Pas de linter : aucun motif, et la porte le dit au lieu de conclure (voir `deliver-effects`).
*/
export function checkLint(report) {
  if (!report?.available)
    return [];
  return report.violations.map((v) => `Lint : ${v.file}${v.line !== undefined ? `:${v.line}` : ""} — ${v.rule} : ${v.message}`);
}
