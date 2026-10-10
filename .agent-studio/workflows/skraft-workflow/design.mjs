// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/design.ts (ADR 0055).
// Copie de extensions/skraft/src/design.ts (2026-10-08) : skraft-workflow est indépendante de skraft
// et n'en importe rien ; une correction de l'une ne se reporte pas seule dans l'autre.
import { adrId, parseAdr, parseSupersessions } from "./adr.mjs";
import { extractCodeIdentifiers, extractPascalIdentifiers } from "./text-analysis.mjs";
/** Documents de conception attendus (§6.2) et sources des noms du modèle. */
export const MODEL_DOCS = ["event-model.md", "domain-model.md"];
export const CITING_DOCS = ["contracts.md", "diagrams.md"];
/**
* Porte cohérence (code) : en-têtes des nouveaux ADR, numérotation continue, noms cités présents
* dans le modèle, remplacements consignés des deux côtés, ADR existants inchangés.
*/
export function checkDesign(i) {
  const reasons = [];
  if (i.docs["event-model.md"] === undefined)
    reasons.push("Document de conception manquant : event-model.md.");
  // Asymétrie voulue : un document CITE un nom en l'écrivant seul entre backticks, mais le modèle
  // le DÉFINIT n'importe où dans son code (signature dans un bloc, appel `Taux.AppliqueA(x)`).
  const known = new Set(MODEL_DOCS.flatMap((d) => extractCodeIdentifiers(i.docs[d] ?? "")));
  for (const doc of CITING_DOCS) {
    for (const id of extractPascalIdentifiers(i.docs[doc] ?? ""))
      if (!known.has(id))
        reasons.push(`\`${id}\` cité dans ${doc} n'existe pas dans ${MODEL_DOCS.join(" ni dans ")}.`);
  }
  for (const p of i.modifiedExistingAdrs)
    reasons.push(`ADR existant modifié : ${p} (les ADR sont append-only ; en rédiger un nouveau qui le remplace).`);
  const parsed = i.adrs.map((a) => ({ ...a, adr: parseAdr(a.md) }));
  for (const a of parsed.filter((x) => x.isNew)) {
    if (!a.adr.id)
      reasons.push(`${a.path} : titre « # ADR-NNN — titre » absent.`);
    for (const m of a.adr.missing)
      reasons.push(`${a.path} : section manquante « ${m} ».`);
    if (a.adr.status && a.adr.status !== "Proposed")
      reasons.push(`${a.path} : statut ${a.adr.status}, Proposed attendu.`);
    // Le nom de fichier nomme le SUJET ; le verdict vit dans `Statut`, et lui seul change quand la
    // décision évolue. Un verdict dans le nom oblige à renommer le fichier — donc à casser tous les
    // liens qui le citent. Suffixe seulement : « rejet-des-paiements » est un sujet légitime.
    const suffixe = /-(rejected|accepted|deprecated|superseded|rejete|rejeté|accepte|accepté)\.md$/i.exec(a.path);
    if (suffixe)
      reasons.push(`${a.path} : le nom de fichier porte un verdict (« ${suffixe[1]} »). Il doit nommer le sujet ; le verdict appartient au champ « Statut ».`);
    // Un ADR justifie un choix entre options ; « éviter X », « toujours Y » n'en est pas un — c'est
    // une bonne pratique, qui relève du linter, d'une skill ou d'une convention, pas d'une décision
    // d'architecture à ratifier.
    const pratique = /^\s*(?:ne pas |éviter |eviter |toujours |jamais |avoid |always |never |no(?:t)? )/i.exec(a.adr.title ?? "");
    if (pratique)
      reasons.push(`${a.path} : « ${a.adr.title} » énonce une bonne pratique, pas une décision entre options. Un ADR arbitre un choix ; une règle de ce genre relève d'une convention ou du linter.`);
  }
  const numbers = parsed.map((a) => a.adr.number).filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  const seen = new Set();
  for (const n of numbers) {
    if (seen.has(n))
      reasons.push(`Numérotation des ADR : ${adrId(n)} en double.`);
    seen.add(n);
  }
  // Seuls les trous que cette phase creuse sont reprochés : un ADR archivé avant la story
  // laisse un trou que l'agent ne peut pas combler, et le lui reprocher ferait échouer DESIGN
  // à chaque tentative, jusqu'à épuisement du budget.
  const dejaLa = parsed.filter((a) => !a.isNew).map((a) => a.adr.number).filter((n) => Number.isFinite(n));
  const depuis = (dejaLa.length ? Math.max(...dejaLa) : 0) + 1;
  const max = numbers.at(-1) ?? 0;
  for (let n = depuis; n <= max; n++)
    if (!seen.has(n))
      reasons.push(`Numérotation des ADR : ${adrId(n)} manque.`);
  const registry = parseSupersessions(i.supersessions);
  for (const a of parsed.filter((x) => x.isNew))
    for (const replaced of a.adr.supersedes)
      if (!registry.some((r) => r.by === a.adr.id && r.replaced === replaced))
        reasons.push(`${a.adr.id} remplace ${replaced} mais le registre supersessions.md ne le mentionne pas.`);
  for (const r of registry) {
    const by = parsed.find((a) => a.adr.id === r.by);
    if (!by?.adr.supersedes.includes(r.replaced))
      reasons.push(`supersessions.md indique qu'${r.by} remplace ${r.replaced}, mais ${r.by} ne le déclare pas.`);
  }
  return reasons;
}
