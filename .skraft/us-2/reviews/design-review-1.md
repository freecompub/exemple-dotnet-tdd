# Revue DESIGN, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, architecture | 0.25 | 0.125 |

## Lentille cold-reader : CHANGES_REQUESTED

- `cold-reader#1.1` **major** (deliverable) Le modele dit que l'emplacement de la regle de remise n'est pas decide (Panier, LigneDePanier ou politique separee), alors que contracts.md attribue l'evaluation des lignes a ConfigurationDePaliers et diagrams.md represente explicitement ce flux. Le lecteur ne peut pas savoir si cette responsabilite est une decision de conception ou reste ouverte. (.skraft/us-2/design/domain-model.md)
- `cold-reader#1.2` **major** (deliverable) La transmission de ConfigurationDePaliers au calcul est presentee comme une decision future, alors que contracts.md retient deja une configuration explicite pour ChiffrerPanier et conserve l'appel historique avec configuration vide. Aligner le modele de domaine sur ce contrat, ou marquer le contrat comme proposition non tranchee. (.skraft/us-2/design/domain-model.md)
- `cold-reader#1.3` **major** (deliverable) Le modele evenementiel indique que le point d'invocation et la forme du rejet ne sont pas fixes, mais contracts.md tranche la validation a la construction et precise les exceptions de rejet. Cette divergence laisse le cycle de validation ambigu pour le lecteur. (.skraft/us-2/design/event-model.md)
- `cold-reader#1.4` **minor** (deliverable) L'exposition publique de RemiseDeLigne est dite « a decider », tandis que contracts.md et consistency-matrix.md la fixent comme interne et excluent ce detail de Facture. Indiquer dans ce modele que la decision est prise. (.skraft/us-2/design/event-model.md)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.

