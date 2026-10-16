// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/conception.ts (ADR 0055).
/**
* Phase DESIGN en workflow : modélisation, décisions, porte cohérence, revue à lentilles (`revue.ts`),
* ratification des ADR. Reproduit le réducteur de skraft ; les écarts du §13 de `docs/09` ne sont
* pas tranchés ici.
*/
import { correspond as matchesAny, essayer, PanneEnvironnement } from "@agent-studio/workflow";
import { avecStory, parseAdr, setAdrStatus, storyDe } from "./adr.mjs";
import { checkDesign, matriceDeCoherence, matriceMarkdown } from "./design.mjs";
import { lensesForPhase } from "./difficulty.mjs";
import { SUPERSESSIONS } from "./adr.mjs";
import { reviewFacts } from "./review-brief.mjs";
import { ecrireRapports, enregistrerLivrables, nouveauSuivi, oublierLeRun, reviser, specialiste } from "./revue.mjs";
import { commitMessage, creerDossiers, sha256 } from "./support.mjs";
const ADR_FILE = /^docs\/adr\/adr-\d{3,}-[^/]+\.md$/;
const DESIGN_DOCS = ["event-model.md", "domain-model.md", "context-map.md", "contracts.md", "diagrams.md", "consistency-matrix.md"];
export async function concevoir(w, d, lentilles, max) {
  const suivi = nouveauSuivi();
  const faite = await w.phase("DESIGN", async (cp, relance) => {
    // Relancée après une escalade : le premier essai reçoit son motif (D15 de docs/12).
    await essayer(w, { max, motifs: relance }, (motifs, essai) => unEssai(w, d, suivi, cp, lensesForPhase(lentilles, "DESIGN"), motifs, essai));
    await statuerAdrs(w, d);
    await ecrireRapports(w, d.slug, "DESIGN", suivi);
    return true;
  }, {
    commit: commitMessage("DESIGN", d.slug),
    // Commit impossible, continué par l'humain : le bilan le dit (D19 de docs/12).
    commitManque: () => void d.nonCommitees.push("DESIGN"),
    // Le rembobinage efface les ADR de la phase : la liste les oublie aussi (D2 de docs/12).
    apresRembobinage: async () => {
      await creerDossiers(w, d.slug);
      d.adrs = await adrsDuDisque(w, d.slug);
      // Livrables et rapports du run effacé : oubliés (D6, D8 de docs/12).
      oublierLeRun(suivi);
    },
  });
  return faite === true;
}
/**
* ADR de cette story, lus sur le disque (ligne `Story`, ADR 0055) : le disque est rembobiné avec la
* phase et porte le statut dès la ratification (ADR 0064). Une liste tenue en mémoire, elle,
* gardait des ADR effacés (D2 de docs/12).
*/
async function adrsDuDisque(w, slug) {
  const adrs = [];
  for (const path of (await w.listerFichiers()).filter((p) => ADR_FILE.test(p)).sort()) {
    const md = await w.lireFichier(path);
    if (storyDe(md) !== slug)
      continue;
    const { id, status } = parseAdr(md);
    adrs.push({ id, path, status: status === "Accepted" || status === "Rejected" ? status : "Proposed" });
  }
  return adrs;
}
/**
* Un essai : modélisation puis décisions avec les mêmes motifs, porte, revue, ratification. Un
* amendement ne relance que les décisions et ne consomme pas d'essai (§13, écart 3).
*/
async function unEssai(w, d, s, cp, lentilles, motifs, essai) {
  await specialiste(w, d, s, "DESIGN", "skraft-architect-model", motifs);
  let retour = motifs;
  for (;;) {
    const avant = await instantaneAdrs(w);
    await specialiste(w, d, s, "DESIGN", "skraft-architect-decide", retour);
    const horsStory = await controlerAdrs(w, d, avant);
    if (horsStory.length)
      return { motifs: horsStory, porte: "adr" };
    const porte = await porteCoherence(w, d, s, cp, essai);
    if (porte.length)
      return { motifs: porte, porte: "cohérence" };
    const revue = await reviser(w, d, s, cp, "DESIGN", lentilles, essai, reviewFacts(s.livrables, "DESIGN"));
    if (revue)
      return revue;
    const amendements = await ratifier(w, d);
    if (!amendements.length)
      return [];
    retour = amendements;
  }
}
/** Porte cohérence (§7.2) : documents et ADR de la phase vérifiés par le code. */
async function porteCoherence(w, d, s, cp, essai) {
  // Document absent : la porte le signale s'il est requis. Une panne, elle, remonte.
  const lire = (p) => w.lireFichier(p).catch((e) => (e instanceof PanneEnvironnement ? Promise.reject(e) : undefined));
  const docs = {};
  for (const doc of DESIGN_DOCS) {
    const md = await lire(`.skraft/${d.slug}/design/${doc}`);
    if (md !== undefined)
      docs[doc] = md;
  }
  const changes = await w.fichiersModifies(cp);
  const ajoutes = new Set(changes.filter((f) => f.status === "added").map((f) => f.path));
  const adrs = [];
  const decides = new Set(d.adrs.filter((a) => a.status !== "Proposed").map((a) => a.path));
  for (const path of (await w.listerFichiers()).filter((p) => ADR_FILE.test(p))) {
    const md = await w.lireFichier(path);
    // Un ADR de cette story est « nouveau » pour la porte même s'il existait avant la phase :
    // il a pu être proposé avant un arrêt, puis amendé après la reprise.
    // Un ADR déjà décidé n'est plus « nouveau » : son statut n'est plus Proposed (D3 de docs/12).
    adrs.push({ path, md, isNew: !decides.has(path) && (ajoutes.has(path) || storyDe(md) === d.slug) });
  }
  const siens = new Set(adrs.filter((a) => storyDe(a.md) === d.slug).map((a) => a.path));
  const modifiedExistingAdrs = changes.filter((f) => f.status !== "added" && ADR_FILE.test(f.path) && !siens.has(f.path)).map((f) => f.path);
  // Sources de production : engagements structurels déjà en place (docs/15 §4.6).
  const disp = await w.disposition();
  const sources = [];
  for (const path of (await w.listerFichiers()).filter((p) => matchesAny(disp.sources, p) && !matchesAny([...disp.acceptanceTests, ...disp.unitTests], p)))
    sources.push({ path, content: (await lire(path)) ?? "" });
  const input = { docs, adrs, supersessions: (await lire(SUPERSESSIONS)) ?? "", modifiedExistingAdrs, sources };
  // La matrice de cohérence est écrite par le code, à chaque essai, même refusé : c'est lui qui la
  // juge (G10 de skraft-plugin, docs/15 §4.5), pas l'architecte qui se la décernerait.
  const matrice = `.skraft/${d.slug}/design/consistency-matrix.md`;
  await w.ecrireFichier(matrice, matriceMarkdown(matriceDeCoherence(input)));
  const reasons = checkDesign(input);
  if (reasons.length)
    return reasons;
  await enregistrerLivrables(w, s, [...changes.filter((c) => c.status !== "deleted" && c.path !== matrice).map((c) => c.path), matrice], essai, sha256);
  // Ce que dit le disque, et non ce qu'un essai précédent avait enregistré (D2 de docs/12).
  d.adrs = await adrsDuDisque(w, d.slug);
  return [];
}
/** Contenu de chaque ADR du dépôt, relevé avant le tour de l'architecte. */
async function instantaneAdrs(w) {
  const m = new Map();
  for (const path of (await w.listerFichiers()).filter((p) => ADR_FILE.test(p)))
    m.set(path, await w.lireFichier(path));
  return m;
}
/**
 * Après le tour de l'architecte (ADR 0055, point 7) : chaque nouvel ADR reçoit `Story : <slug>`,
 * écrit par le code ; un ADR qui n'appartient pas à cette story, ou qui est déjà décidé, et que
 * l'agent a modifié ou supprimé, est restauré tel qu'il était, et le tour est rejeté.
 */
async function controlerAdrs(w, d, avant) {
  const motifs = [];
  const apres = await instantaneAdrs(w);
  for (const [path, md] of apres) {
    if (!avant.has(path)) {
      if (storyDe(md) !== null && storyDe(md) !== d.slug) {
        motifs.push(`${path} : la ligne « Story » est écrite par l'orchestrateur, pas par toi ; ne l'écris pas.`);
        await w.ecrireFichier(path, md.replace(/^-\s*Story\s*:.*\n?/m, ""));
      }
      const marque = avecStory((await w.lireFichier(path)), d.slug);
      if (marque !== (await w.lireFichier(path)))
        await w.ecrireFichier(path, marque);
      continue;
    }
    const ancien = avant.get(path);
    if (md === ancien)
      continue;
    const sienne = storyDe(ancien) === d.slug && parseAdr(ancien).status === "Proposed";
    // Un amendement par réécriture complète fait disparaître la ligne : le code la remet.
    if (sienne && storyDe(md) === null) {
      await w.ecrireFichier(path, avecStory(md, d.slug));
      continue;
    }
    if (!sienne || storyDe(md) !== storyDe(ancien)) {
      await w.ecrireFichier(path, ancien);
      motifs.push(sienne
        ? `${path} : ne modifie pas la ligne « Story » d'un ADR ; ta modification est annulée.`
        : `${path} : cet ADR appartient à une autre story ou est déjà décidé ; tu ne peux pas le modifier. Ta modification est annulée ; propose un nouvel ADR qui le remplace si besoin.`);
    }
  }
  for (const [path, ancien] of avant) {
    if (apres.has(path))
      continue;
    await w.ecrireFichier(path, ancien);
    motifs.push(`${path} : un ADR ne se supprime pas ; il est restauré.`);
  }
  return motifs;
}
/** Ratification de tous les ADR proposés, à la fois ; rend les amendements demandés. */
async function ratifier(w, d) {
  await w.etape("RATIFICATION");
  const proposes = d.adrs.filter((a) => a.status === "Proposed");
  const decisions = await Promise.all(proposes.map((a) => w.humain("ratifier-adr", `Ratifier ${a.id}`, [
    { id: "accept", label: "Accepter" },
    { id: "reject", label: "Rejeter" },
    { id: "amend", label: "Demander un amendement" },
  ], { detail: `Décision d'architecture proposée : ${a.path}` })));
  const amendements = [];
  for (const [i, a] of proposes.entries()) {
    const dec = decisions[i];
    if (dec.decision === "amend")
      amendements.push(`Amendement demandé sur ${a.id} : ${dec.commentaire ?? "(sans précision)"}`);
    else {
      const status = dec.decision === "accept" ? "Accepted" : "Rejected";
      d.adrs = d.adrs.map((x) => (x.id === a.id ? { ...x, status } : x));
      // Écrit aussitôt (D3 de docs/12) : pendant l'amendement d'un autre ADR, le fichier dit déjà
      // « décidé », et `controlerAdrs` annule toute réécriture.
      await w.ecrireFichier(a.path, setAdrStatus(await w.lireFichier(a.path), status));
    }
  }
  return amendements;
}
/** Statuts dans les fichiers, une fois tous les ADR décidés ; déjà écrits à la ratification (D3), ceci ne fait que confirmer. */
async function statuerAdrs(w, d) {
  for (const a of d.adrs.filter((x) => x.status !== "Proposed"))
    await w.ecrireFichier(a.path, setAdrStatus(await w.lireFichier(a.path), a.status));
}
