# Revue DELIVER, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.1` **minor** (code) Le nom `MeilleurTauPour` et l'absence de commentaire sur la règle « seul le palier le plus avantageux, parmi ceux atteints, s'applique » obligent le lecteur à déduire l'intention de la chaîne Where/Select/DefaultIfEmpty/Max. Les deux surcharges `RemisePour` (panier, ligne) ont le même nom pour deux niveaux de règle. (src/Tarification.Domaine/GrilleDeRemise.cs:20) — gravité : Intention déductible du code ; simple confort de lecture.
- `cold-reader#1.2` **minor** (code) `Fraction(decimal tauxEnPourCent)` prend un décimal brut alors que le type `Pourcentage` existe ; le doc-comment explique l'unité, mais le nom « Fraction » pour un taux en pour-cent est ambigu (0,05 ou 5 ?). Côté `Pourcentage.De`, aucune borne n'est visible (le modèle annonçait 0 à 100) : un lecteur ne voit pas ce qui est autorisé. (src/Tarification.Domaine/Montant.cs:24) — gravité : Ambiguïté de nom atténuée par le commentaire ; la justesse relève d'autres lentilles. — aussi : src/Tarification.Domaine/Pourcentage.cs:10

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

- `architecture#1.1` **minor** (code) Montant.Fraction(decimal) prend un taux brut et construit le Montant par le constructeur privé, sans passer par Montant.De. Le modèle prévoyait Pourcentage.Applique(Montant) → Montant.De(...) (domain-model.md, contracts.md). Un taux négatif donnerait un Montant négatif, contre l'invariant du type. GrilleDeRemise lit aussi Taux.Valeur au lieu de demander à Pourcentage d'appliquer le taux. Seul Pourcentage garantit 0–100, et il n'est pas utilisé comme prévu. (src/Tarification.Domaine/Montant.cs:24) — gravité : Écart au modèle ratifié sans conséquence sur les critères : le taux arrive validé par Pourcentage, et la méthode n'est appelée que depuis le domaine.
- `architecture#1.2` **minor** (code) RemisePour(LigneDePanier) est privée alors que contracts.md la déclare publique. (src/Tarification.Domaine/GrilleDeRemise.cs:17) — gravité : Écart mineur d'interface : aucun critère ni test ne l'appelle directement, et rendre la méthode privée réduit la surface plutôt que de la gonfler.

## Lentille quality-gates : CHANGES_REQUESTED

- `quality-gates#1.1` **major** (code) Montant.Fraction construit un Montant sans garde de signe, contrairement à De et Multiplie. Avec un taux négatif (Pourcentage.De accepte n'importe quel decimal, cf. Pourcentage.cs:10, hors livrables de cette phase), la remise devient négative. Or la doc de Montant (lignes 4-5) affirme qu'un montant négatif n'existe pas dans ce domaine. Le prix final augmente alors sans erreur. (src/Tarification.Domaine/Montant.cs:24) — gravité : Une remise négative passe silencieusement et fausse le montant à payer, ce qui est un défaut majeur sur un chemin de calcul de prix. — aussi : src/Tarification.Domaine/Pourcentage.cs:10
- `quality-gates#1.2` **minor** (code) Fraction retourne une valeur non arrondie (par exemple 2,00 × 5 / 100 et autres montants à plus de deux décimales), alors que l'arrondi a été renvoyé à l'US-5. Le code ne le signale ni dans la doc ni dans un commentaire ; le comportement non décidé n'est donc pas visible. (src/Tarification.Domaine/Montant.cs:24) — gravité : Un comportement délibérément non décidé, non documenté dans le code, peut être pris pour une règle établie, défaut mineur.
- note (hors du changement) : `quality-gates#1.3` **minor** Pas dans la liste des livrables de cette phase, noté pour l'humain. Le pas 5 du plan d'implémentation prévoit les invariants de Pourcentage (0 à 100) et de PalierDeQuantite (seuil < 1, lève ArgumentOutOfRangeException). Aucun de ces invariants n'est implémenté, et aucun test unitaire n'a été ajouté (faits DELIVER). L'écart n'est pas déclaré. Les critères d'acceptance ne l'exigent pas, mais le plan le promettait. (src/Tarification.Domaine/Pourcentage.cs:10)
- note (hors du changement) : `quality-gates#1.4` **minor** Pas dans la liste des livrables de cette phase, noté pour l'humain. Le pas 1 nomme Pourcentage.Applique et PalierDeQuantite.EstAtteintPar, qui n'existent pas dans le code. La logique est en réalité dans GrilleDeRemise, et l'écart n'est pas déclaré. (.skraft/us-2/distill/impl-plan.md:7)
- note (hors du changement) : `quality-gates#1.5` **minor** Pas dans la liste des livrables de cette phase, noté pour l'humain. Les faits indiquent que la barre de qualité est lue à l'ancien emplacement et doit être déplacée vers .agent-studio/quality.yaml (ADR 0049). Ce déplacement n'est pas fait ni mentionné. (.skraft/quality.json:1)
