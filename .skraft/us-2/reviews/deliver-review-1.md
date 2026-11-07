# Revue DELIVER, essai 1

Verdict (synthèse du code) : CHANGES_REQUESTED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.2` **minor** (code) Noms peu parlants ou divergents : `Montant.Pour(Pourcentage)` ne dit pas qu'il calcule un pourcentage du montant (`Applique` ou `PourcentageDe` serait plus clair). `RemiseDe` existe deux fois avec des rôles proches (panier entier dans `CalculDuPanier`, ligne seule dans `GrilleDePaliers`). `Max()` sur des montants ne dit pas qu'on retient le palier au taux le plus élevé : un commentaire sur la raison manque. (src/Tarification.Domaine/Montant.cs:23) — gravité : Gêne de lecture pour un nouveau lecteur, sans erreur de comportement. — aussi : src/Tarification.Application/CalculDuPanier.cs:31, src/Tarification.Domaine/GrilleDePaliers.cs:15
- note (hors du changement) : `cold-reader#1.1` **minor** Le commentaire de `Facture` dit que les remises restent à zéro tant que les stories ne sont pas livrées, alors que `Chiffrer` calcule maintenant la remise par palier. Seuls les frais de port restent à zéro. Le commentaire induit en erreur. (src/Tarification.Application/CalculDuPanier.cs:6)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : CHANGES_REQUESTED

- `architecture#1.1` **major** (code) La règle « la remise du panier est la somme des remises calculées ligne par ligne » (ac-4) est implémentée dans le cas d'usage `CalculDuPanier.RemiseDe` (Application), par un `Aggregate` sur `panier.Lignes`. Le design ratifié prévoit `Panier.SommeDesRemises(GrilleDePaliers)` dans l'agrégat, sur le patron de `SommeDesLignes` ; l'invariant du panier doit vivre dans le domaine. `Panier.cs` n'a pas été étendu. ADR-001 range les règles commerciales dans le domaine et laisse à l'application l'orchestration. Déplacer la somme dans `Panier.SommeDesRemises(grille)` et faire appeler cette méthode par `Chiffrer`. Écarts de nommage mineurs par rapport aux contrats : `RemiseDe` au lieu de `RemisePour`, `Montant.Pour` au lieu de `Applique`. (src/Tarification.Application/CalculDuPanier.cs:31) — gravité : Une règle commerciale d'agrégat fuit dans la couche application, contre ADR-001 et le modèle de DESIGN ; le comportement reste correct, et un refactoring le corrige.

## Lentille quality-gates : APPROVED

- `quality-gates#1.2` **minor** (code) Montant.Pour(taux) renvoie Euros * taux.Valeur / 100m sans arrondi au centime. Une remise peut donc porter des fractions de centime (ex. 5 % de 0,01 € × 10 = 0,005 €) qui entrent dans Remise et ATPayer. La règle choisie (« option la plus simple ») n'est ni nommée dans le code, ni documentée, ni testée. (src/Tarification.Domaine/Montant.cs:23) — gravité : Montant ligne modifiée par la phase, comportement non documenté sur une grandeur monétaire ; impact limité aux cas à fraction de centime.
- `quality-gates#1.3` **minor** (code) Montant.Pour construit directement new(...) sans passer par la garde de Montant.De. Avec un Pourcentage négatif (Pourcentage n'est pas validé), la remise devient un Montant négatif, ce que la doc de la classe (ligne 4-5) déclare impossible dans le domaine. (src/Tarification.Domaine/Montant.cs:23) — gravité : Contournement d'un invariant documenté sur une ligne modifiée, déclenché seulement par une entrée de taux négative non validée.
- note (hors du changement) : `quality-gates#1.1` **minor** Facture.ATPayer vaut SommeDesArticles + FraisDePort et ne déduit pas la Remise. Depuis cette phase, la remise est calculée (ligne 29), donc ATPayer surestime ce que le client doit payer lorsqu'un palier s'applique. Aucun test d'acceptance ne lit ATPayer, et les critères 1 à 5 ne le visent pas. La ligne 12 n'est pas modifiée par la phase : signalement à l'humain pour la prochaine story (ou pour trancher si ATPayer est hors US-2), sans renvoyer le travail. (src/Tarification.Application/CalculDuPanier.cs:12)
- note (hors du changement) : `quality-gates#1.4` **minor** La doc de Facture affirme que les remises restent à zéro tant que les stories ne sont pas livrées. Ce n'est plus vrai : la remise est désormais calculée par RemiseDe. Commentaire périmé (lignes 6 à 8, non modifiées par la phase : signalement à l'humain). (src/Tarification.Application/CalculDuPanier.cs:6)
