# Matrice de coherence US-2

## Criteres, modele et contrats

Chaque ligne ci-dessous decrit une verification a transmettre, pas un test deja execute. La commande de toutes les tranches est `ChiffrerPanier` ; la vue rendue est `Facture` (source : `.skraft/us-2/design/event-model.md:9,28,36-39`).

| Exigence | Responsabilite | Faits modelises | Resultat a verifier | Sources |
| --- | --- | --- | --- | --- |
| AC-1 : 9 a 2,00 EUR ; 10/5 % | `BaremeDeRemise`, `LigneDePanier` | `AucunPalierDeRemiseApplicable`, `RemiseDeLigneCalculee`, `PanierChiffre` | `Facture.Remise` = 0,00 ; `Facture.ATPayer` = 18,00 | `stories/US-2.md:7`, `.skraft/us-2/design/clarifications.md:10-13` |
| AC-2 : 10 a 2,00 EUR ; 10/5 % | `PalierDeRemise`, `TauxDeRemise`, `LigneDePanier` | `PalierDeRemiseRetenu`, `RemiseDeLigneCalculee`, `PanierChiffre` | `Facture.Remise` = 1,00 ; `Facture.ATPayer` = 19,00 | `stories/US-2.md:8`, `.skraft/us-2/design/clarifications.md:10-13` |
| AC-3 : 50 a 2,00 EUR ; 10/5 %, 50/12 % | `BaremeDeRemise`, `LigneDePanier` | `PalierDeRemiseRetenu`, `RemiseDeLigneCalculee`, `PanierChiffre` | `Facture.Remise` = 12,00 ; `Facture.ATPayer` = 88,00 ; pas 17,00 de remise | `stories/US-2.md:9`, `.skraft/us-2/design/clarifications.md:10-13` |
| AC-4 : deux references de 6 articles ; 10/5 % | `Panier`, `LigneDePanier` | Deux fois `AucunPalierDeRemiseApplicable` et `RemiseDeLigneCalculee`, puis `PanierChiffre` | `Facture.Remise` = 0,00 ; aucune aggregation des quantites | `stories/US-2.md:10`, `.skraft/us-2/design/domain-model.md:9` |
| AC-5 : bareme vide | `BaremeDeRemise`, `Panier` | `AucunPalierDeRemiseApplicable` pour chaque ligne, puis `RemiseDeLigneCalculee` et `PanierChiffre` | `Facture.Remise` = 0,00 ; montant a payer egal a la somme brute | `stories/US-2.md:11`, `.skraft/us-2/design/clarifications.md:10-13` |

Les montants a payer ci-dessus decoulent de la deduction confirmee et des frais de port nuls du chemin existant ; ce ne sont pas de nouveaux criteres de la story (sources : `.skraft/us-2/design/clarifications.md:10-13`, `src/Tarification.Application/CalculDuPanier.cs:21`).

## Frontieres et non-regressions

| Obligation | Verification a transmettre | Sources |
| --- | --- | --- |
| Paliers communs, assiette locale | Appliquer le meme `BaremeDeRemise` a deux references ; verifier chaque remise sur sa propre ligne | `.skraft/us-2/research/clarifications.md:7`, `stories/US-2.md:10` |
| Maximum et independance de l'ordre | Permuter les paliers de l'AC-3 et obtenir 12,00 ; ajouter un cas ou le plus grand seuil a un taux plus faible et verifier le taux eligible maximal | `stories/US-2.md:9`, `.skraft/us-2/research/research.md:66` |
| Addition des remises | Pour deux lignes eligibles, verifier que `Facture.Remise` est la somme des deux remises, sans cumul de paliers sur une ligne | `.skraft/us-2/design/domain-model.md:21-25`, `.skraft/us-2/design/event-model.md:20` |
| Seuil valide | Rejet explicite de 0 et d'un seuil negatif ; acceptation de 1 | `.skraft/us-2/design/clarifications.md:15-18` |
| Taux valide | Rejeter un taux negatif et un taux superieur a 100 ; accepter 0 et 100 ; a 100 %, remise egale au sous-total et montant a payer nul | `.skraft/us-2/design/clarifications.md:10-18`, `.skraft/us-2/design/domain-model.md:24` |
| Seuils dupliques | Rejeter deux paliers de meme seuil, que leurs taux soient identiques ou differents ; ne pas rendre de `Facture` | `.skraft/us-2/design/clarifications.md:15-18` |
| Immutabilite du bareme | Modifier la collection source apres construction ne change pas les remises du `BaremeDeRemise` construit | `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:75-85` |
| Invariants de construction | Verifier qu'une valeur par defaut invalide ne contourne pas la validation d'un seuil ou d'un taux ; rejeter une deduction donnant un `Montant` negatif | `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:81-85`, `src/Tarification.Domaine/Montant.cs:3-14`, `.skraft/us-2/design/clarifications.md:15-18` |
| Chemin sans configuration | Conserver les appels a `Chiffrer` avec `Panier` seul, avec remise nulle ; conserver les tests de somme brute et de rejets existants | `tests/Tarification.Tests/CalculDuPanierTests.cs:16-48`, `stories/US-2.md:11` |
| Panier vide | Avec ou sans paliers valides, somme brute, remise et montant a payer nuls ; aucun fait de ligne | `src/Tarification.Domaine/Panier.cs:16`, `tests/Tarification.Tests/CalculDuPanierTests.cs:33-35`, `.skraft/us-2/design/event-model.md:17-20` |
| Exactitude monetaire | Comparer les valeurs de `Montant`, pas leur affichage ; conserver le calcul `decimal` sans arrondi intermediaire | `src/Tarification.Domaine/Montant.cs:9-25`, `docs/adr/adr-001-decoupage-domaine-application.md:32-33`, `stories/US-5.md:9` |
| Frontiere existante | Regles dans `LigneDePanier`, `BaremeDeRemise`, `Montant` et `Panier` ; application limitee a l'orchestration et a la restitution de `Facture` | `docs/adr/adr-001-decoupage-domaine-application.md:17-30`, `.skraft/us-2/design/domain-model.md:24-27` |

Les tests d'acceptance doivent verifier les montants rendus par le point d'entree avec de vrais objets du domaine ; ils ne doivent pas exiger la publication des faits du modele. Les tests existants ne couvrent pas les remises US-2 (sources : `.skraft/us-2/research/research.md:59,70,147`, `.skraft/us-2/design/event-model.md:3`).
