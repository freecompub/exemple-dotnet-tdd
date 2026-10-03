# Revue DESIGN, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity | 0.15 | 0.15 |
| risk | cold-reader, test-integrity | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- **minor** Dans le diagramme de classes, la signature `+Palier~nullable~ PalierApplicable(Quantite quantite)` utilise la syntaxe mermaid `~...~` habituellement réservée aux génériques (ex. `List~T~`). Un lecteur sans contexte peut y lire un type générique `Palier<nullable>` plutôt qu'un `Palier?` nullable — la notation standard `Palier?` serait plus immédiatement lisible. (.skraft/us-2/design/diagrams.md:28)
- **minor** Dans le diagramme de séquence, le retour final est annoté `Facture (PanierChiffre)`, ce qui laisse penser qu'il existe un type ou une forme de retour nommée `PanierChiffre`, alors que l'événement n'a aucune matérialisation en code (`event-model.md` le précise ailleurs). Cette juxtaposition peut induire en erreur un lecteur qui découvre ce diagramme isolément. (.skraft/us-2/design/diagrams.md:56)
- **minor** Le type `Palier` a un champ nommé `Taux` de type `Taux` (`record struct Palier(Quantite Seuil, Taux Taux)`), ce qui crée une redondance nom-de-champ / nom-de-type pouvant gêner une lecture rapide (ex. `Taux.Taux`). (.skraft/us-2/design/contracts.md)
- **minor** Le document « contrats » fournit déjà le corps complet (expression-bodied) de `LigneDePanier.Remise`, `Panier.SommeDesRemises` et `CalculDuPanier.Chiffrer`, sans préciser si ce code est contractuel ou simplement indicatif — un lecteur sans contexte ne sait pas quelle partie est figée. (.skraft/us-2/design/contracts.md)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture-compliance-lens : APPROVED

- **minor** Le document affirme que « LigneDePanier et Panier restent les seuls agrégats du domaine », alors que diagrams.md montre Panier contenant directement des objets LigneDePanier (composition, pas de référence par ID). Si LigneDePanier est réellement un agrégat distinct, la règle DDD « les agrégats se référencent entre eux par ID, jamais par référence d'objet » serait violée par cette composition directe ; plus probablement LigneDePanier est une entité enfant au sein de l'agrégat Panier et la terminologie est imprécise. Cette ambiguïté est antérieure à US-2 mais reconduite sans correction dans ce design ; elle mériterait clarification avant la conception d'architecture pour éviter toute confusion future sur les frontières de cohérence. (.skraft/us-2/design/domain-model.md)
