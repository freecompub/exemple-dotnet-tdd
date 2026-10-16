// Converti en JavaScript le 2026-10-10 depuis extensions/skraft-workflow/src/adr.ts (ADR 0055).
const SECTIONS = ["Contexte", "Décision", "Conséquences", "Alternatives"];
const pad = (n) => String(n).padStart(3, "0");
export const adrId = (n) => `ADR-${pad(n)}`;
export function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
export const adrPath = (n, title) => `docs/adr/adr-${pad(n)}-${slugify(title)}.md`;
export function validateAdrInput(i) {
  const errors = [];
  for (const k of ["title", "context", "decision", "consequences", "alternatives"])
    if (!i[k]?.trim())
      errors.push(`Champ obligatoire vide : ${k}`);
  if (i.status !== "Proposed")
    errors.push("Un nouvel ADR est toujours au statut Proposed");
  for (const s of i.supersedes ?? [])
    if (!/^ADR-\d{3,}$/.test(s))
      errors.push(`Remplacement mal formé : ${s} (attendu ADR-NNN)`);
  return errors;
}
export function renderAdr(n, i, date) {
  return [
    `# ${adrId(n)} — ${i.title.trim()}`,
    "",
    `- Statut : ${i.status}`,
    `- Date : ${date}`,
    ...(i.supersedes?.length ? [`- Remplace : ${i.supersedes.join(", ")}`] : []),
    "",
    "## Contexte",
    "",
    i.context.trim(),
    "",
    "## Décision",
    "",
    i.decision.trim(),
    "",
    "## Conséquences",
    "",
    i.consequences.trim(),
    "",
    "## Alternatives",
    "",
    i.alternatives.trim(),
    "",
  ].join("\n");
}
export function parseAdr(md) {
  const h = /^#\s+ADR-(\d+)\s*[—–-]\s*(.+?)\s*$/m.exec(md);
  const status = /^-\s*Statut\s*:\s*(\S+)/m.exec(md)?.[1] ?? "";
  const supersedes = (/^-\s*Remplace\s*:\s*(.+)$/m.exec(md)?.[1] ?? "").split(/[,\s]+/).filter((x) => /^ADR-\d+$/.test(x));
  const missing = SECTIONS.filter((s) => !new RegExp(`^##\\s+${s}\\s*$`, "m").test(md));
  const number = h ? Number(h[1]) : NaN;
  return { number, id: h ? adrId(number) : "", title: h?.[2] ?? "", status, supersedes, missing };
}
export function nextAdrNumber(existing) {
  return existing.length ? Math.max(...existing) + 1 : 1;
}
/** Bascule le statut (ratification) : seule la ligne « Statut » change. */
export function setAdrStatus(md, status) {
  return md.replace(/^(-\s*Statut\s*:\s*)\S+/m, `$1${status}`);
}
/** Ligne du registre des remplacements (`docs/adr/supersessions.md`). */
export const supersessionLine = (by, replaced) => `- ${by} remplace ${replaced}`;
export function parseSupersessions(md) {
  return [...md.matchAll(/^-\s*(ADR-\d+)\s+remplace\s+(ADR-\d+)\s*$/gm)].map((m) => ({ by: m[1], replaced: m[2] }));
}
/** Registre des remplacements d'ADR, tenu par l'architecte. */
export const SUPERSESSIONS = "docs/adr/supersessions.md";
/**
 * Rattachement d'un ADR à sa story (ADR 0055, point 7) : une ligne `- Story : <slug>` dans
 * l'en-tête, écrite par le code, jamais par l'agent. Elle tient après un arrêt et une reprise,
 * puisqu'elle se lit dans le fichier.
 */
export function storyDe(md) {
  return /^-\s*Story\s*:\s*(\S+)\s*$/m.exec(md)?.[1] ?? null;
}
/** Ajoute la ligne `Story` après les autres lignes de l'en-tête (Statut, Date, Remplace…). */
export function avecStory(md, slug) {
  if (storyDe(md) !== null) return md;
  const lignes = md.split("\n");
  let i = lignes.findIndex((l) => /^-\s*Statut\s*:/.test(l));
  if (i < 0) return md;
  while (i + 1 < lignes.length && /^-\s*\S/.test(lignes[i + 1])) i++;
  lignes.splice(i + 1, 0, `- Story : ${slug}`);
  return lignes.join("\n");
}

