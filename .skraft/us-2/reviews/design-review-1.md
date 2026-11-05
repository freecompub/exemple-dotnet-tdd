# Revue DESIGN, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.1` **minor** (deliverable) La vue Facture expose un champ `SommeDesArticles` calculé par une méthode nommée `Panier.SommeDesLignes()` (domain-model.md et contracts.md). Les deux noms désignent la même somme mais avec des mots différents (« articles » vs « lignes ») : une personne du métier qui lit le code après le design peut croire à deux notions distinctes alors qu'il s'agit du même total. (.skraft/us-2/design/contracts.md)
- `cold-reader#1.2` **minor** (deliverable) Le document mélange le vocabulaire métier français (palier, remise, panier) avec du jargon technique anglais non traduit (« Value Object … Self-validating — construction fails if invariants are violated », cité tel quel depuis architecture-patterns). Cette citation technique en anglais, insérée au milieu d'un raisonnement en français sur les règles métier, nuit à la lisibilité pour un lecteur non technicien. (.skraft/us-2/design/domain-model.md)
- `cold-reader#1.3` **minor** (deliverable) Le nom `Montant.Pourcentage(taux)` ne précise pas, dans son nom seul, qu'il retourne la part du montant correspondant à ce taux (un montant réduit), par opposition par exemple à un taux exprimé en pourcentage brut. Le sens n'est clair qu'après lecture du corps de la méthode ; un nom comme `Part(taux)` ou `PartAuTaux(taux)` collerait davantage au vocabulaire métier (« part de la remise »). (.skraft/us-2/design/contracts.md)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

- `architecture#1.1` **minor** (deliverable) GrilleDeRemise est qualifiée d'objet-valeur mais modélisée comme `public sealed class` (pas un `record`/`readonly record struct` comme Montant, Quantite et PalierDeRemise) : l'égalité structurelle n'est pas garantie par construction, contrairement au patron suivi pour les autres VO du domaine. À uniformiser en phase de code, mais ne remet pas en cause la conception. (.skraft/us-2/design/domain-model.md)
