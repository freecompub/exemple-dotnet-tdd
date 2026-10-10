// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/support.ts (ADR 0055).
// Repris de extensions/skraft/src/effects.ts et config.ts (2026-10-08) : skraft-workflow est
// indépendante de skraft et n'en importe rien.
import { empreinte } from "@agent-studio/workflow";
/** Empreinte sha256 d'un contenu, en hexadécimal : calcul pur fourni par la plateforme. */
export const sha256 = (texte) => empreinte(texte).slice("sha256:".length);
/** Recrée l'arborescence de la story (ADR 0037) : Git ne suit pas les dossiers vides. */
export async function creerDossiers(w, slug) {
  for (const d of dossiersDeLaStory(slug))
    await w.creerDossier(d);
}
export const LEVEL_LABELS = {
  simple: "Simple",
  medium: "Moyenne",
  "medium-hard": "Assez difficile",
  challenging: "Difficile",
};
/** Forme du dépôt pour les indicateurs de difficulté : modules = dossiers de `Sources/`, `src/` ou `packages/`. */
export function repositoryShape(files) {
  const modules = new Map();
  for (const f of files) {
    const m = /^(?:Sources|src|packages)\/([^/]+)\//.exec(f);
    if (!m)
      continue;
    const words = modules.get(m[1]) ?? new Set();
    const base = f.split("/").at(-1).replace(/\.[^.]+$/, "");
    for (const w of base.split(/(?=[A-Z])|[-_]/))
      if (w.length > 3)
        words.add(w.toLowerCase());
    modules.set(m[1], words);
  }
  return { modules: [...modules.keys()], files, keywords: Object.fromEntries([...modules].map(([k, v]) => [k, [...v]])) };
}
/**
* Fichiers qu'aucun agent n'écrit, quel que soit son périmètre : la barre de qualité sur laquelle
* le travail est jugé (ADR 0049). Un agent ne doit pas pouvoir abaisser son propre critère.
*/
export const GELÉS = [".skraft/quality.json", ".agent-studio/quality.yaml"];
/** Dossiers où les agents et le code déposent les livrables d'une story (ADR 0037). */
export const dossiersDeLaStory = (slug) => [
  `.skraft/${slug}/research`,
  `.skraft/${slug}/design`,
  `.skraft/${slug}/distill/features`,
  `.skraft/${slug}/reviews`,
];
/** Message de commit d'une phase. */
export const commitMessage = (phase, slug) => phase === "DELIVER" ? `feat(${slug}): livraison de la story` : `docs(skraft): ${phase.toLowerCase()} de ${slug}`;
