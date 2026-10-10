# Contrats US-2

## Cadre et eligibilite des decisions

Les regles restent dans le domaine ; l'application orchestre le chiffrage et restitue `Facture`. Les montants et les taux restent en `decimal`. Il s'agit du cadre existant, pas d'une nouvelle decision (sources : `docs/adr/adr-001-decoupage-domaine-application.md:15-33`, `.skraft/us-2/design/domain-model.md:17-21`, `.skraft/us-2/design/event-model.md:28-30`).

| Candidate | Verdict ADR | Motif et sources |
| --- | --- | --- |
| Prolonger le calcul de `LigneDePanier` et la somme de `Panier` | Non eligible | Q1 : regles dans le domaine deja imposees ; responsabilites retenues par le modele (`docs/adr/adr-001-decoupage-domaine-application.md:17-21`, `.skraft/us-2/design/domain-model.md:24-27`) |
| Objets-valeurs immuables et validation a la construction | Non eligible | Q1 : convention des objets-valeurs ; bornes metier confirmees, pas une nouvelle strategie d'erreur (`.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:73-90`, `.skraft/us-2/design/clarifications.md:15-18`) |
| `BaremeDeRemise` fourni par appel et deduction dans `Facture.ATPayer` | Non eligible | Q3 : contrat impose par les reponses utilisateur, sans ajout de frontiere ni de pattern (`.skraft/us-2/design/clarifications.md:5-13`) |

Le filtre Q1/Q3 vient de `.agent-studio/workflows/skraft-workflow/skills/adr-eligibility-gate/SKILL.md:44-87`. Aucun ADR n'est cree : les candidats ci-dessus ne passent pas ce filtre. Aucun bus CQRS, Event Sourcing, microservice ou mecanisme de publication n'est introduit : le besoin reste un calcul, sans stockage, dans les frontieres existantes (sources : `stories/US-2.md:7-11`, `docs/adr/adr-001-decoupage-domaine-application.md:15-23,40-42`, `.skraft/us-2/design/event-model.md:3`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/SKILL.md:12`).

## Entree et sortie de `ChiffrerPanier`

| Surface | Contrat cible | Sources |
| --- | --- | --- |
| Entree | `Panier` et `BaremeDeRemise` valide, commun a toutes les references, fourni par l'appelant a chaque invocation | `.skraft/us-2/design/event-model.md:9-11`, `.skraft/us-2/design/clarifications.md:5-8`, `.skraft/us-2/research/clarifications.md:7` |
| Compatibilite | Conserver l'appel existant a `Chiffrer` avec seulement `Panier` ; le deleguer au meme calcul avec un `BaremeDeRemise` vide, et non a un second algorithme | `tests/Tarification.Tests/CalculDuPanierTests.cs:19-35`, `stories/US-2.md:11`, `.skraft/us-2/research/research.md:136` |
| Sortie | Une `Facture` : `SommeDesArticles` conserve la somme brute ; `Remise` contient la somme des remises de lignes ; `FraisDePort` reste nul pour US-2 | `.skraft/us-2/design/event-model.md:20,28`, `src/Tarification.Domaine/Panier.cs:16`, `src/Tarification.Application/CalculDuPanier.cs:21`, `.skraft/us-2/research/research.md:17` |
| Montant a payer | `Facture.ATPayer` = `SommeDesArticles` moins `Remise` plus `FraisDePort`, des US-2 | `.skraft/us-2/design/clarifications.md:10-13`, `src/Tarification.Application/CalculDuPanier.cs:10-12` |
| Effets | Calcul synchrone sans stockage ni publication ; les evenements modelisent les faits du calcul et ne deviennent pas des messages ou un journal | `.skraft/us-2/design/event-model.md:3,15-23`, `docs/adr/adr-001-decoupage-domaine-application.md:40-42` |

## Valeurs et rejets

| Valeur | Invariant et comportement aux frontieres | Sources |
| --- | --- | --- |
| `TauxDeRemise` | Pourcentage `decimal` de 0 a 100 inclus ; 5 signifie 5 %, soit un facteur 5/100. Rejeter explicitement toute valeur hors plage a la construction | `.skraft/us-2/design/domain-model.md:19`, `.skraft/us-2/design/clarifications.md:15-18`, `stories/US-2.md:8` |
| `PalierDeRemise` | Seuil entier strictement positif et `TauxDeRemise` valide ; seuil nul ou negatif rejete a la construction | `.skraft/us-2/design/domain-model.md:20`, `.skraft/us-2/design/clarifications.md:15-18` |
| `BaremeDeRemise` | Ensemble immuable de `PalierDeRemise` ; accepter l'ensemble vide, rejeter les seuils dupliques meme si les taux sont identiques ; ne pas eliminer silencieusement un doublon | `.skraft/us-2/design/domain-model.md:11,21`, `.skraft/us-2/design/clarifications.md:15-18`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:75-85` |
| `Quantite` et `Montant` | Conserver les rejets existants : quantite inferieure a 1 et montant negatif | `src/Tarification.Domaine/Quantite.cs:10-11`, `src/Tarification.Domaine/Montant.cs:13-14`, `tests/Tarification.Tests/CalculDuPanierTests.cs:38-48` |

Les valeurs hors plage suivent les exceptions explicites des fabriques existantes ; un doublon est une erreur d'argument lors de la construction du bareme. Aucun rejet ne retourne une remise nulle ou une `Facture` de succes. L'immutabilite impose de ne pas conserver une collection modifiable par l'appelant. Toute voie de construction ou d'entree doit preserver ces invariants, y compris une valeur par defaut d'un type-valeur (sources : `.skraft/us-2/design/clarifications.md:15-18`, `src/Tarification.Domaine/Quantite.cs:10-11`, `src/Tarification.Domaine/Montant.cs:13-14`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:81-85`).

## Calcul et coherence

Pour chaque `LigneDePanier`, selectionner les `PalierDeRemise` dont le seuil est inferieur ou egal a sa `Quantite`, puis appliquer une seule fois le taux maximal eligible a tout son `SousTotal`. Comparer les taux equivaut a comparer les remises sur cette meme assiette non negative. Ne pas choisir le plus grand seuil, le dernier palier declare, ni additionner les taux (sources : `.skraft/us-2/design/domain-model.md:18-25`, `stories/US-2.md:7-9`, `.skraft/us-2/research/research.md:66`).

Sans palier eligible, la remise de ligne vaut `Montant.Zero`. Un palier eligible a 0 % donne egalement zero, mais reste un palier applicable. En cas de taux maximaux egaux, le montant est identique ; le contrat ne rend pas l'identite du palier selectionne observable dans `Facture` (sources : `.skraft/us-2/design/domain-model.md:19-21`, `.skraft/us-2/design/event-model.md:17-19,28`, `.skraft/us-2/design/clarifications.md:15-18`).

`Panier` additionne les remises de ses lignes sans agreger leurs quantites ni regrouper les references. La selection ne modifie ni les lignes, ni le bareme. La coherence est celle d'un appel synchrone sur les lignes presentes : la `Facture` est construite apres le calcul de toutes les lignes, sans projection differee ni transaction de stockage (sources : `.skraft/us-2/design/domain-model.md:9-13,24-27`, `.skraft/us-2/design/event-model.md:3,20`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:81-85`).

`Montant` porte l'operation de pourcentage : euros multiplies par le pourcentage divise par 100, sans arrondi intermediaire. La deduction necessaire au montant a payer conserve l'invariant non negatif ; avec des taux valides, chaque remise est comprise entre zero et son sous-total, donc la remise totale ne depasse pas la somme brute. Une soustraction produisant un montant negatif doit etre rejetee, pas ramenee silencieusement a zero (sources : `.skraft/us-2/design/domain-model.md:18-27`, `.skraft/us-2/design/clarifications.md:10-18`, `src/Tarification.Domaine/Montant.cs:3-14`, `stories/US-5.md:9`).

Les exemples US-2 ont des resultats exacts au centime. Aucun arrondi propre a US-2 n'est ajoute ; la politique de rendu reste le sujet d'US-5. Le cumul promotionnel et l'assiette des frais de port restent hors de cette livraison (sources : `stories/US-2.md:7-9`, `.skraft/us-2/research/research.md:17,71`).
