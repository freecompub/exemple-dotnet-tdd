# Revue DESIGN, essai 2

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.1` **minor** (deliverable) Le modèle emploie « ligne » partout, alors que la story parle de « même référence » (« une même référence en nombre »). Le lien entre « une ligne » et « une référence » n'est jamais écrit en une phrase. Le métier doit le déduire du critère 4 et d'un paragraphe de contrats.md. Ajouter une phrase de glossaire : une ligne = une référence du panier, ses quantités sont déjà regroupées. (.skraft/us-2/design/domain-model.md:35) — gravité : Le terme est cohérent avec la story et se déduit du critère 4, mais l'équivalence ligne = référence n'est pas explicitée. — aussi : .skraft/us-2/design/event-model.md:49
- `cold-reader#1.2` **minor** (deliverable) Le jargon technique domine : « Requête », « vue », « cas d'usage », « événement de modèle », « objet-valeur », « Given/When/Then », « Core », ainsi que les citations fichier:ligne dans chaque phrase. Une personne du métier a du mal à lire le modèle. Un court glossaire ou un résumé en langage de la story (palier, taux, remise, ligne, panier, grille) aiderait. (.skraft/us-2/design/domain-model.md:1) — gravité : La lecture est pénible pour le métier, mais les termes de la story (palier, remise, panier, ligne) restent présents et reconnaissables. — aussi : .skraft/us-2/design/event-model.md:8, .skraft/us-2/design/contracts.md:41
- `cold-reader#1.3` **minor** (deliverable) Le dépôt `IDepotDePaniers` et la méthode `Enregistre` ne figurent ni dans la story ni dans le code. Ils sont introduits sans être demandés, avec « aucun fichier requis ». Un lecteur ne voit pas pourquoi ils sont dans le modèle. De même, `ATPayer` apparaît dans le texte (peut-être une coquille pour « AP » / à payer) sans explication. (.skraft/us-2/design/contracts.md:92) — gravité : Vocabulaire inventé hors story, sans effet sur les critères d'US-2 : confusion possible, pas d'erreur de fond. — aussi : .skraft/us-2/design/domain-model.md:91, .skraft/us-2/design/contracts.md:61
- `cold-reader#1.4` **minor** (deliverable) Les commandes sont nommées `AjouterLigne` alors que le code expose `Ajoute`. L'événement `LigneAjoutee` n'existe pas dans le code. Le tableau le dit, mais deux vocabulaires coexistent (`AjouterLigne`/`Ajoute`, `Taux`/`Pourcentage`). Une table de correspondance nom métier / nom du code serait utile. (.skraft/us-2/design/event-model.md:10) — gravité : Le tableau cite la source, donc le lecteur retrouve la correspondance ; seule la lisibilité en pâtit. — aussi : .skraft/us-2/design/domain-model.md:39

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : CHANGES_REQUESTED

- `architecture#1.1` **major** (deliverable) Le design déclare une interface de dépôt `IDepotDePaniers` (couche Domaine, `Enregistre(Panier)`) qu'aucun critère d'US-2 ne demande. Aucun cas d'usage ne l'appelle et il n'y a ni implémentation ni fichier. Elle figure pourtant dans le diagramme de dépendances. ADR-001 écarte tout stockage (« ce projet n'a encore ni stockage ») et ne justifie pas la présence d'une interface de dépôt dans le domaine. Elle est spéculative. Elle invente aussi une signature (`Enregistre`) tout en admettant que `Panier` n'a pas d'identifiant. À retirer du modèle, des contrats et des diagrammes. Sinon, un ADR existant ou nouveau doit justifier sa place et le critère de la story qui la demande. (.skraft/us-2/design/domain-model.md:95) — gravité : Un patron sans critère de story qui le justifie, déclaré dans le domaine sans ADR qui motive ce choix, contredit le point de revue « aucun patron sans critère ». — aussi : .skraft/us-2/design/contracts.md:92, .skraft/us-2/design/diagrams.md:25
