# Revue DESIGN, essai 3

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, architecture | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#2.1` **minor** (deliverable) La story dit « même référence », le modèle dit « ligne » partout (domain-model, diagrammes). L'équivalence ligne = référence n'est écrite nulle part en une phrase ; le lecteur la déduit du critère 4. Ajouter une courte définition. (.skraft/us-2/design/domain-model.md:35) — gravité : Terme cohérent avec la story et déductible, mais jamais explicité pour une personne du métier. — aussi : .skraft/us-2/design/event-model.md:49
- `cold-reader#2.2` **minor** (deliverable) Le vocabulaire technique (requête, vue, cas d'usage, objet-valeur, Given/When/Then, citations fichier:ligne dans chaque phrase) alourdit la lecture pour le métier. Un petit glossaire en termes de la story (palier, taux, remise, ligne, panier, grille) manque. (.skraft/us-2/design/contracts.md:41) — gravité : Gêne de lecture sans contradiction avec la story ; les termes métier restent présents. — aussi : .skraft/us-2/design/event-model.md:8, .skraft/us-2/design/diagrams.md:6
- `cold-reader#2.3` **minor** (deliverable) `IDepotDePaniers` / `Enregistre` n'apparaissent ni dans la story ni dans le code, et `ATPayer` n'est pas expliqué. Ils sont dans le modèle sans lien visible avec US-2. (.skraft/us-2/design/contracts.md:92) — gravité : Vocabulaire hors story sans effet sur les critères : source de confusion seulement. — aussi : .skraft/us-2/design/domain-model.md:91, .skraft/us-2/design/contracts.md:61

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.

