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

/**
* Plans de DISTILL (docs/15 §4.5 et §4.7), vérifiés par le code. Repris de skraft-plugin v1.6.1 :
* - `impl-plan.md` cite chaque critère, puisque DELIVER en tire l'ordre des scénarios (G6 du
*   relecteur), et chaque critère a une étape qui nomme son fichier de test (§5 d'acceptance-designer) ;
* - `test-plan.md` porte la matrice de couverture : une ligne par critère, avec sa couche et sa
*   doublure (§4), et au moins un walking skeleton (G8).
*/
export function checkPlans(i) {
  if (i.implPlan === null) return ["Plan d'implémentation absent : impl-plan.md."];
  const reasons = [];
  const marqueur = (n) => new RegExp(`\\bac-${n}(?![0-9])`, "i");
  const etapes = sections(i.implPlan);
  for (const c of i.criteria) {
    if (!marqueur(c.n).test(i.implPlan)) {
      reasons.push(`impl-plan.md ne cite pas le critère ${c.n} (ac-${c.n}) : chaque critère y a sa place dans l'ordre de livraison.`);
      continue;
    }
    if (!etapes.filter((e) => marqueur(c.n).test(e)).some((e) => /^\s*[-*]?\s*Test\s*:\s*\S/im.test(e)))
      reasons.push(`impl-plan.md : aucune étape du critère ${c.n} (ac-${c.n}) ne nomme son fichier de test (« - Test : \`chemin\` »).`);
  }
  const m = matriceDeCouverture(i.testPlan);
  if (!m)
    reasons.push("test-plan.md n'a pas de matrice de couverture : un tableau aux colonnes Scénario, Cas d'usage, Couche, Doublure, Walking skeleton, une ligne par critère.");
  else
    for (const c of i.criteria) {
      const ligne = m.lignes.find((l) => l.some((cellule) => marqueur(c.n).test(cellule)));
      if (!ligne)
        reasons.push(`test-plan.md : aucune ligne de la matrice pour le critère ${c.n} (ac-${c.n}).`);
      else if (!/domaine|domain|application|infrastructure/i.test(ligne[m.couche] ?? ""))
        reasons.push(`test-plan.md : le critère ${c.n} (ac-${c.n}) n'indique pas sa couche (Domaine, Application ou Infrastructure).`);
      else if (VIDE.test(ligne[m.doublure] ?? ""))
        reasons.push(`test-plan.md : le critère ${c.n} (ac-${c.n}) n'indique pas sa doublure (« aucune » si son test n'en utilise pas).`);
    }
  const parLigne = i.testPlan.split("\n").some((l) => /@ac-\d+/.test(l) && /walking[ -]skeleton/i.test(l));
  const parColonne = m !== null && m.walkingSkeleton >= 0 && m.lignes.some((l) => !/^(?:non|no|[-—–]*)$/i.test(l[m.walkingSkeleton] ?? ""));
  if (!parLigne && !parColonne)
    reasons.push("test-plan.md ne désigne aucun walking skeleton : au moins une ligne de la matrice porte « oui », ou sa stratégie, dans la colonne Walking skeleton.");
  return reasons;
}

const VIDE = /^[-—–\s]*$/;

/** Texte de chaque section d'un document Markdown, titre compris (le préambule en est une). */
function sections(md) {
  const out = [""];
  for (const l of md.split("\n")) {
    if (/^#{1,6}\s/.test(l))
      out.push(l);
    else
      out[out.length - 1] += `\n${l}`;
  }
  return out;
}

/** Matrice de couverture du plan de test : le premier tableau qui a une colonne Couche et une colonne Doublure. */
function matriceDeCouverture(md) {
  const cellules = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((x) => x.trim());
  const lignes = md.split("\n");
  for (let k = 0; k < lignes.length; k++) {
    if (!lignes[k].trim().startsWith("|"))
      continue;
    const entete = cellules(lignes[k]);
    const couche = entete.findIndex((x) => /couche|layer/i.test(x));
    const doublure = entete.findIndex((x) => /doublure|double/i.test(x));
    if (couche < 0 || doublure < 0)
      continue;
    const corps = [];
    for (let j = k + 1; j < lignes.length && lignes[j].trim().startsWith("|"); j++)
      if (!/^\|?\s*:?-{2,}/.test(lignes[j].trim()))
        corps.push(cellules(lignes[j]));
    return { lignes: corps, couche, doublure, walkingSkeleton: entete.findIndex((x) => /walking/i.test(x)) };
  }
  return null;
}

/** Matrice du plan de test, par critère (`ac-N`) ; vide si le plan n'en a pas. Gardée depuis DISTILL. */
export function planDeTest(testPlan) {
  const m = matriceDeCouverture(testPlan);
  const plan = {};
  for (const l of m?.lignes ?? []) {
    const ac = /\bac-(\d+)(?![0-9])/i.exec(l.join(" "));
    if (ac)
      plan[`ac-${ac[1]}`] = { couche: l[m.couche] ?? "", doublure: l[m.doublure] ?? "" };
  }
  return plan;
}

/**
* Vérification d'un écart déclaré : le critère est dans la matrice, et le prévu reprend sa ligne
* (couche et doublure). Le code ne peut pas voir lui-même qu'un test change de couche : il vérifie la
* déclaration, la trace et la transmet ; la lentille test-integrity juge sa règle.
*/
export function verifierEcarts(ecarts, plan) {
  const reasons = [];
  const contient = (texte, attendu) => texte.toLowerCase().includes(attendu.toLowerCase().trim());
  for (const e of ecarts) {
    const cle = /^@?ac-(\d+)$/i.exec(e.criterion.trim());
    const ligne = cle ? plan[`ac-${cle[1]}`] : undefined;
    if (!ligne)
      reasons.push(`Écart au plan pour « ${e.criterion} » : aucun critère de ce nom dans la matrice de test-plan.md.`);
    else if (!contient(e.planned, ligne.couche) || !contient(e.planned, ligne.doublure))
      reasons.push(`Écart au plan pour ac-${cle[1]} : le prévu « ${e.planned} » ne reprend pas la ligne de la matrice (${ligne.couche}, ${ligne.doublure}).`);
  }
  return reasons;
}
