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

- `cold-reader#1.1` **minor** (deliverable) Les renvois internes pointent vers des lignes qui ne correspondent plus au contenu : contracts.md cite `domain-model.md:58-61`, `:38-56`, `:84-86` et `event-model.md:67-68`, `:71`, `:40-46`, alors que ces passages se trouvent ailleurs (par ex. choix « option la plus simple » aux lignes 82-87 d'event-model.md). L'ADR-003 a le même défaut avec `event-model.md:66` et `domain-model.md:30-34,58-80`. Un lecteur ne retrouve pas la source citée. (.skraft/us-2/design/contracts.md:28) — gravité : Gêne de traçabilité seulement ; le vocabulaire et le sens restent compréhensibles. — aussi : docs/adr/adr-003-frontiere-du-panier-et-grille-de-remise.md:24, docs/adr/adr-003-frontiere-du-panier-et-grille-de-remise.md:38
- `cold-reader#1.2` **minor** (deliverable) Les champs de la vue `Facture` sont désignés par position (« 1er champ », « 3e champ ») au lieu de leur nom `SommeDesArticles` et `FraisDePort`, utilisés dans domain-model.md et event-model.md. Le même concept porte deux libellés selon le document. (.skraft/us-2/design/contracts.md:76) — gravité : Nommage incohérent entre livrables ; le lecteur doit deviner la correspondance. — aussi : .skraft/us-2/design/contracts.md:78
- `cold-reader#1.3` **minor** (deliverable) Les termes « seuil », « taux » et « taux maximal » n'apparaissent pas dans la story, qui parle de « palier de 10 articles ou plus » et de « palier le plus avantageux ». Le lien est fait une fois (« le plus avantageux »), mais le glossaire n'est pas posé : une personne du métier doit déduire que « seuil » = nombre d'articles et « taux » = pourcentage. (.skraft/us-2/design/domain-model.md:91) — gravité : Écart de vocabulaire mineur avec la story, compensé par le contexte.

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.

