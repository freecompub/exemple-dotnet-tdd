// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/gherkin.ts (ADR 0055).
/**
* Porte `gherkin` (§7.3) : la partie **mécanisable** de la skill `bdd-methodology`, portée en code.
*
* Pourquoi une porte et pas seulement une consigne dans le prompt. Les tests d'acceptance sont
* **gelés** à la sortie de DISTILL : un scénario couplé à un détail technique ne devient pas
* seulement médiocre, il devient la spécification que toute la phase de livraison doit satisfaire,
* et plus personne ne peut le corriger. Ailleurs, une faiblesse de méthode coûte un réessai ; ici
* elle se fige. La consigne améliore les chances, la porte donne la garantie.
*
* Ce que cette porte ne fait pas : juger le style, la pertinence ou la couverture. Elle refuse ce
* qui est reconnaissable **sans interprétation** — un verbe HTTP, un nom de classe, deux
* déclencheurs. Le reste appartient aux lentilles, qui disposent des mêmes critères sous leur forme
* d'origine (`acceptance-review-criteria`).
*/
/**
* Frontières de mot **sûres avec les accents**. `\b` de JavaScript ne connaît que `[A-Za-z0-9_]` :
* après « donné » ou avant « ça », il ne voit aucune transition et ne reconnaît rien. Tout le
* contenu de ce fichier étant français, s'en remettre à `\b` rendait la porte silencieuse.
*/
const AVANT = "(?<![A-Za-zÀ-ÿ0-9])";
const APRES = "(?![A-Za-zÀ-ÿ0-9])";
/** Mots-clés d'étape, français et anglais : un projet écrit ses scénarios dans sa langue. */
const DECLENCHEUR = new RegExp(`^\\s*(?:Quand|When)${APRES}`, "i");
const ASSERTION = new RegExp(`^\\s*(?:Alors|Then)${APRES}`, "i");
const ETAPE = new RegExp(`^\\s*(?:Étant donné|Etant donné|Soit|Quand|Alors|Et|Mais|Given|When|Then|And|But)${APRES}`, "i");
/** Au-delà, le scénario décrit plusieurs comportements (`bdd-methodology`, règle de granularité). */
const ETAPES_MAX = 7;
/**
* Fuites de couche. Chaque motif vise une forme que le métier n'emploie jamais — et non un simple
* mot, qui serait trop souvent légitime : « base » est courant, « base de données » ne l'est pas.
*/
const FUITES = [
  { re: new RegExp(`${AVANT}(?:POST|GET|PUT|DELETE|PATCH|HEAD)${APRES}`), dit: (t) => `verbe HTTP « ${t} »` },
  { re: /\/(?:api|v\d+)\/|\s\/[a-z][\w-]*\/[\w{}:-]+/i, dit: (t) => `chemin d'URL « ${t.trim()} »` },
  // Un identifiant à plusieurs bosses — `CalculDuPanier`, `PanierRepository` — n'apparaît jamais
  // dans une phrase métier. Un mot simplement capitalisé (`Panier`) reste permis : c'en serait un.
  { re: new RegExp(`${AVANT}[A-Z][a-zÀ-ÿ0-9]+(?:[A-Z][a-zÀ-ÿ0-9]+)+${APRES}`), dit: (t) => `nom de classe « ${t} »` },
  {
    re: new RegExp(`${AVANT}(?:bases? de données|database|file d'attente|broker|DTO|schéma SQL|table SQL)${APRES}`, "i"),
    dit: (t) => `vocabulaire d'infrastructure « ${t} »`,
  },
];
/** Assertions qui n'affirment rien d'observable. */
const ASSERTION_VAGUE = new RegExp(`${AVANT}(?:[çc]a marche|c'est correct|tout est ok|c'est ok|it works|it is correct|everything is fine)${APRES}`, "i");
/** Tags qui nomment une couche technique au lieu d'un comportement. */
const TAG_TECHNIQUE = /@(?:frontend|backend|api|http|ui|infrastructure|database|sql)\b/i;
/** Découpe un fichier `.feature` en scénarios, en ignorant les commentaires et les tableaux. */
function scenarios(fichier) {
  const out = [];
  let courant = null;
  let tags = "";
  for (const brute of fichier.content.split("\n")) {
    const ligne = brute.replace(/\r$/, "");
    if (/^\s*#/.test(ligne))
      continue; // commentaire : jamais une étape
    if (/^\s*@/.test(ligne)) {
      tags = `${tags} ${ligne.trim()}`.trim();
      continue;
    }
    const titre = /^\s*(?:Scénario|Scenario|Plan du scénario|Scenario Outline)\s*:\s*(.*)$/i.exec(ligne);
    if (titre) {
      if (courant)
        out.push(courant);
      courant = { path: fichier.path, titre: titre[1].trim(), tags, etapes: [] };
      tags = "";
      continue;
    }
    if (courant && ETAPE.test(ligne))
      courant.etapes.push(ligne.trim());
  }
  if (courant)
    out.push(courant);
  return out;
}
/**
* Motifs de refus, un par manquement, nommant le fichier et le scénario pour que la correction
* soit possible sans chercher.
*/
export function checkGherkin(features) {
  const reasons = [];
  for (const f of features)
    for (const s of scenarios(f)) {
      const ou = `${f.path}, scénario « ${s.titre} »`;
      for (const etape of s.etapes)
        for (const { re, dit } of FUITES) {
          const m = re.exec(etape);
          if (m)
            reasons.push(`${ou} : ${dit(m[0])} dans « ${etape} ». Le Gherkin décrit ce que fait le métier, pas comment le code s'y prend.`);
        }
      const declencheurs = s.etapes.filter((e) => DECLENCHEUR.test(e));
      if (declencheurs.length > 1)
        reasons.push(`${ou} : ${declencheurs.length} étapes « Quand ». Un seul déclencheur par scénario — deux comportements font deux scénarios.`);
      for (const a of s.etapes.filter((e) => ASSERTION.test(e) && ASSERTION_VAGUE.test(e)))
        reasons.push(`${ou} : l'assertion « ${a} » ne nomme aucun résultat métier observable.`);
      if (s.etapes.length > ETAPES_MAX)
        reasons.push(`${ou} : ${s.etapes.length} étapes (maximum ${ETAPES_MAX}). Un scénario aussi long décrit plusieurs comportements.`);
      const tag = TAG_TECHNIQUE.exec(s.tags);
      if (tag)
        reasons.push(`${ou} : le tag « ${tag[0]} » nomme une couche technique. Les tags décrivent un comportement (@happy-path, @error-case).`);
    }
  return reasons;
}
