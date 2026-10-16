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
/**
* Consignes de phase (option A de docs/15 §4.5) : en DESIGN et en DISTILL, les lentilles jugent des
* documents, pas du code. Repris des lentilles internes des relecteurs de skraft-plugin v1.6.1
* (`solution-architect-reviewer`, `acceptance-designer-reviewer`), pour la part qui demande un
* jugement ; ce qui se vérifie mécaniquement est dans les portes (`design.ts`, `distill.ts`).
* Entre parenthèses dans les commentaires : la porte d'origine.
*/
const CONSIGNES_DE_PHASE = {
  DESIGN: {
    "cold-reader": [
      "Le vocabulaire du modèle (commandes, événements, agrégats) est celui de la story : une personne du métier s'y retrouve sans connaître le code.",
    ],
    "test-integrity": [
      // G7
      "Chaque critère d'acceptation a son déclencheur dans event-model.md : une commande s'il change l'état, une requête s'il ne fait que lire.",
      "Chaque résultat attendu par un critère est observable dans le modèle (événement ou vue) : on pourra l'écrire en test d'acceptance.",
      // Phase 4 de solution-architect
      "Chaque déclencheur forme une tranche verticale : le déclencheur, l'événement qu'il produit, la vue que lit l'utilisateur.",
    ],
    architecture: [
      // G1
      "Chaque engagement structurel visible dans les diagrammes (agrégat, contexte, CQRS, Event Sourcing, saga, couche anticorruption) est justifié par un ADR.",
      // G3, G4 ; couche des dépôts selon solution-architect, phase 6 (le relecteur, G4, ne cite que
      // l'application : le plugin se contredit, l'architecte fait foi)
      "Les interfaces de dépôt et de passerelle sont déclarées dans le domaine ou dans l'application, jamais dans l'infrastructure, et l'ADR de l'agrégat justifie ce choix ; domaine et application ne dépendent ni de l'infrastructure ni de l'API.",
      // G5
      "Chaque agrégat garantit ses propres invariants ; il n'en référence un autre que par son identifiant.",
      // Phase 3 de solution-architect
      "Les agrégats, contextes et cas d'usage existants relevés par la recherche sont réutilisés ou étendus, pas dupliqués.",
      // Phase 7 : déclencheurs obligatoires d'ADR (le code ne vérifie que l'existant et la couche anticorruption)
      "Chaque déclencheur obligatoire d'ADR présent dans la conception a son ADR : CQRS avec bus, Event Sourcing, saga, agrégat qui franchit une frontière existante, découpage ou fusion de contextes, couche anticorruption, changement transverse (erreurs, validation, transactions).",
      // STRUCTURAL_DRIFT, sens « document → ADR » (le sens « ADR → modèle » est vérifié par le code)
      "Chaque agrégat introduit par les documents (modèle, contrats, diagrammes) est nommé par un ADR, nouveau ou existant, qui le justifie ; un dépôt, en tant que tel, n'en demande pas.",
      // G9, G11
      "Aucun agrégat, contexte ou patron sans critère de la story qui le justifie ; un patron coûteux cite une force mesurée et évalue l'option « sans le patron ».",
      // G15
      "Aucun ADR ne ratifie une règle que le projet impose déjà (linter, test d'architecture, convention).",
    ],
  },
  DISTILL: {
    "cold-reader": [
      // G3
      "Chaque scénario se lit par une personne du métier, sans connaissance technique.",
    ],
    "test-integrity": [
      // G2
      "Chaque cas limite ou négatif tranché par les critères a son scénario.",
      // G5
      "Chaque étape est non ambiguë et implémentable telle quelle.",
      "Chaque test d'acceptance vérifie le résultat métier de son scénario, pas un détail d'implémentation.",
    ],
    architecture: [
      // G7
      "Chaque scénario entre par le cas d'usage de la couche Application nommé dans contracts.md.",
      // G11
      "Le plan de test place chaque scénario à la bonne couche ; un cas d'usage nouveau est testé au niveau Application, pas seulement de bout en bout.",
    ],
  },
  DELIVER: {
    "test-integrity": [
      // docs/15 §4.7 : la matrice de couverture de DISTILL fait foi pour la couche et la doublure
      "Chaque test respecte la couche et la doublure que la matrice de .skraft/<slug>/distill/test-plan.md prévoit pour son critère ; un écart non déclaré est un défaut, un écart déclaré dans les faits se juge sur sa règle.",
    ],
    // ADR 0067 : un critère sans test fidèle à sa ligne, sauf écart déclaré (quality-gates-lens du plugin, v1.15.1)
    "quality-gates": ["Chaque critère de la matrice du plan de test a au moins un test qui respecte sa ligne, sauf écart déclaré dans les faits."],
  },
};

const list = (title, xs) => (xs.length ? [title, ...xs.map((x) => `  - ${x}`)] : []);
export function lensBrief(lens, c, phase, files, facts, history = []) {
  const lines = [`Revue de la phase ${phase}.`, ...history];
  const factBlock = list("Faits établis par le code (acquis : ne les revérifie pas) :", facts);
  switch (lens) {
    case "cold-reader":
      lines.push("Tu n'as aucun contexte du producteur : juge uniquement ce que disent les fichiers ci-dessous.", ...list("Livrables :", files.artifacts), ...list("Code :", files.code), ...list("Tests :", files.tests));
      break;
    case "test-integrity":
      // Le code de production aussi : un test miroir du code ne se voit qu'en lisant les deux (4.1 de docs/15).
      lines.push(...list("Critères d'acceptation :", c.criteria.map((x) => `${x.n}. ${x.text}`)), ...list("Tests :", files.tests), ...list("Code :", files.code), ...list("Livrables :", files.artifacts), ...factBlock);
      break;
    case "architecture":
      // Les tests aussi : une doublure dans le domaine se voit dans les tests (4.2 de docs/15).
      lines.push(...list("ADR ratifiés :", c.adrs.map((a) => `${a.id} : ${a.path}`)), ...list("Code :", files.code), ...list("Tests :", files.tests), ...list("Livrables :", files.artifacts), ...factBlock);
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
  lines.push(...list(`Points à examiner en ${phase} :`, (CONSIGNES_DE_PHASE[phase]?.[lens] ?? []).map((x) => x.replace("<slug>", c.slug ?? "<slug>"))));
  return lines.join("\n");
}
