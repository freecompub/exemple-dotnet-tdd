# Revue DESIGN, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.3 |
| quality | test-integrity, architecture | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, architecture | 0.25 | 0.25 |

## Lentille cold-reader : APPROVED

Aucun défaut.

- note (hors du changement) : `cold-reader#1.1` **minor** Le nom de l'opération qui applique un taux à un montant est incohérent : domain-model.md:74 et :127 la nomment `Applique(TauxDeRemise)`, alors que contracts.md:107-108 dit que son nom est laissé à l'implémentation. Un lecteur ne sait pas si `Applique` est ferme. (/tmp/essai-mcp-skraft-zqGCsb/projet/.skraft/us-2/design/contracts.md:107)
- note (hors du changement) : `cold-reader#1.2` **minor** Faute de français et formulation lourde : « restant non négative » (Montant est masculin : « non négatif »). Le terme « Core » pour le contexte est aussi du jargon sans glose pour une personne du métier. (/tmp/essai-mcp-skraft-zqGCsb/projet/.skraft/us-2/design/domain-model.md:75)
- note (hors du changement) : `cold-reader#1.3` **minor** `AjouterUneLigne` et `LigneAjoutee` sont des termes absents de la story, qui ne parle que de « ligne » et de « panier ». Le document précise que l'événement est conceptuel, mais le lien avec le « Soit » de la story pourrait être dit plus tôt dans le modèle. `ATPayer` (nom existant du code) n'est pas expliqué. (/tmp/essai-mcp-skraft-zqGCsb/projet/.skraft/us-2/design/event-model.md:13)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.

- note (hors du changement) : `architecture#1.1` **minor** domain-model.md:25-26 : le document dit que les paliers de remise sont exigés dans le domaine par adr-001:25-26. Or ces lignes portent sur la visibilité de la dépendance dans le .csproj. Les paliers sont seulement cités comme exemple de règle à adr-001:8. La conclusion reste correcte ; seule la citation est imprécise (même citation dans adr-a-reconsiderer.md:7 et contracts.md:13). (/tmp/essai-mcp-skraft-zqGCsb/projet/.skraft/us-2/design/adr-a-reconsiderer.md:7)
