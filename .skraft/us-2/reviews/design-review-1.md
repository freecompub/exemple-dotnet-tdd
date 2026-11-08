# Revue DESIGN, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, architecture | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.1` **minor** (deliverable) Plusieurs renvois vers domain-model.md pointent des lignes qui ne correspondent plus au contenu. Événements : `domain-model.md:64` mène à « Arguments nuls », alors que la section est à la ligne 75. Dépôts : `:66-70` est faux. ATPayer : `domain-model.md:76` est faux, la section est à la ligne 87. Le lecteur qui suit ces renvois tombe sur un autre sujet. (.skraft/us-2/design/contracts.md:9) — gravité : Gêne de navigation uniquement ; le vocabulaire et le sens restent clairs. — aussi : .skraft/us-2/design/contracts.md:10, .skraft/us-2/design/contracts.md:42
- `cold-reader#1.2` **minor** (deliverable) La liste « points à trancher » demande de retirer des `ArgumentNullException` de contracts.md aux lignes 23, 85 et 94. contracts.md n'en contient plus et n'a pas autant de lignes. L'instruction est périmée et déroute un lecteur qui découvre le dossier. (.skraft/us-2/design/adr-a-reconsiderer.md:10) — gravité : Reste d'une version précédente ; sans effet sur le modèle mais source de confusion.
- `cold-reader#1.3` **minor** (deliverable) Le jargon technique « Core », « ACL » et « Conformist » est employé sans définition. Il s'éloigne du langage de la story, que le métier ne partage pas. Le terme « Taux » du modèle n'est pas non plus relié explicitement au « pourcentage » de la story. « ATPayer » (nom existant du code) n'est pas expliqué comme « montant à payer ». (.skraft/us-2/design/context-map.md:5) — gravité : Léger écart de vocabulaire ; le glossaire du contexte (palier, barème, remise d'une ligne) reste compréhensible par le métier. — aussi : .skraft/us-2/design/domain-model.md:85

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.

