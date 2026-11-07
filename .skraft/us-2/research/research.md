# Recherche — US-2 : Remise par palier de quantité

## Périmètre et critères de succès

Story : un client qui achète une même référence en nombre obtient automatiquement une remise
(`stories/US-2.md:3-4`). Critères (`stories/US-2.md:7-11`) :

1. Palier « ≥ 10 : 5 % », 9 × 2,00 € → remise 0,00 €.
2. Palier « ≥ 10 : 5 % », 10 × 2,00 € → remise 1,00 €.
3. Paliers « 10 : 5 % » et « 50 : 12 % », 50 × 2,00 € → remise 12,00 € (un seul palier, le plus avantageux).
4. Calcul par ligne, jamais sur le panier entier : deux lignes de 6 références différentes ne déclenchent pas le palier de 10.
5. Aucun palier configuré → remise 0,00 €.

Décision métier reçue : une **grille unique** de paliers, commune à toutes les références
(`.skraft/us-2/passation.md:5`). Cela tranche la question ouverte de `stories/US-2.md:14`.

Hors périmètre : le cumul avec les codes promotionnels (question de l'US-3, `stories/US-3.md:14`) et les frais de port.

## Fichiers analysés

- `src/Tarification.Domaine/LigneDePanier.cs`
- `src/Tarification.Domaine/Panier.cs`
- `src/Tarification.Domaine/Montant.cs`
- `src/Tarification.Domaine/Quantite.cs`
- `src/Tarification.Application/CalculDuPanier.cs`
- `tests/Tarification.Tests/CalculDuPanierTests.cs`
- `docs/adr/adr-001-decoupage-domaine-application.md`, `docs/adr/adr-002-format-de-rapport-de-tests.md`
- `stories/US-2.md`, `stories/US-3.md`, `stories/US-6.md`
- `Directory.Build.props`, `.agent-studio/stack.yaml`

## Recherches effectuées

Exploration du dépôt uniquement (aucune source externe). Aucune recherche antérieure sous
`.skraft/us-2/research/` à réutiliser. Aucun type « palier », « pourcentage » ou « remise » n'existe dans `src/`
en dehors du champ `Remise` de `Facture`.

## Conventions du projet

- Deux couches, une seule direction de dépendance : `Tarification.Domaine` ne dépend de rien, `Tarification.Application` dépend du domaine seul (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`). Les règles commerciales vivent dans le domaine (`:25-26`).
- Une règle qui a besoin d'un élément extérieur le reçoit en paramètre (`docs/adr/adr-001-decoupage-domaine-application.md:28-30`).
- Montants en `decimal`, jamais en `double` (`docs/adr/adr-001-decoupage-domaine-application.md:32-34`).
- Nommage en français ; types-valeurs en `readonly record struct` avec constructeur privé et fabrique statique `De(...)` qui lève `ArgumentOutOfRangeException` si la valeur est invalide (`src/Tarification.Domaine/Montant.cs:7-14`, `src/Tarification.Domaine/Quantite.cs:4-11`). Entités/valeurs composites en `sealed record` (`src/Tarification.Domaine/LigneDePanier.cs:4`) ; `Panier` est une `sealed class` à API fluide `Ajoute` (`src/Tarification.Domaine/Panier.cs:10-14`).
- Commentaires `<summary>` en français expliquant le pourquoi métier.
- `TreatWarningsAsErrors` activé, `Nullable` activé (`Directory.Build.props:5,8`).
- Tests : xUnit, noms de méthode en français avec underscores, critère tracé par un commentaire `// @ac-N` sur `[Fact]` (`tests/Tarification.Tests/CalculDuPanierTests.cs:16,24,32`). Aide locale `Ligne(reference, quantite, prix)` (`:13-14`). **Aucune doublure** (mock/stub/fake) en usage : les tests construisent de vrais objets du domaine et pilotent `CalculDuPanier` (`:19,29,35`).
- Le profil de stack repère les tests d'acceptance par `tests/**/*AcceptanceTests.cs` (`.agent-studio/stack.yaml:29`) ; le fichier de tests existant s'appelle `CalculDuPanierTests.cs`, sans ce suffixe.
- Piège de lecture : l'ADR-002 désigne le projet de tests par un nom hérité d'un autre projet (`docs/adr/adr-002-format-de-rapport-de-tests.md:18`), alors que le projet de tests réel est `Tarification.Tests` (`.agent-studio/stack.yaml:10`) ; reliquat de nom, sans effet sur US-2.

## Découvertes

1. `CalculDuPanier.Chiffrer(Panier)` ne prend aucune configuration et renvoie toujours `Montant.Zero` en remise : `src/Tarification.Application/CalculDuPanier.cs:21`. Le commentaire prévoit explicitement que les remises restent à zéro « tant que les stories correspondantes ne sont pas livrées » (`:6-8`).
2. `Facture(SommeDesArticles, Remise, FraisDePort)` a déjà le champ `Remise` (`src/Tarification.Application/CalculDuPanier.cs:10`), mais `ATPayer => SommeDesArticles + FraisDePort` (`:12`) **ne soustrait pas** la remise. Les critères US-2 ne parlent que de la remise, pas du total à payer.
3. `LigneDePanier.SousTotal` = prix unitaire × quantité (`src/Tarification.Domaine/LigneDePanier.cs:6`) : c'est la base naturelle de la remise par ligne ; la référence est portée par la ligne (`:4`), ce qui permet le calcul par ligne (critère 4).
4. `Panier.Lignes` expose les lignes en lecture seule (`src/Tarification.Domaine/Panier.cs:8`) ; `SommeDesLignes` agrège par `Aggregate` (`:16`) : même patron réutilisable pour sommer les remises ligne à ligne.
5. `Montant` n'offre que `+`, `Multiplie(int)` et `CompareTo` (`src/Tarification.Domaine/Montant.cs:18-23`) : pas de multiplication par un `decimal`/pourcentage, pas de soustraction. Calculer 5 % de 20,00 € exige donc une nouvelle opération (ou un accès à `Euros`, `:9`). Il n'y a aucune règle d'arrondi dans le code : 5 % de montants non ronds peut produire des fractions de centime (non couvert par les critères).
6. `Montant` interdit les valeurs négatives (`src/Tarification.Domaine/Montant.cs:13-14`) : une remise, positive, est représentable ; un total diminué de la remise ne peut pas passer sous zéro sans lever une exception.
7. `Quantite.Valeur` est un `int` ≥ 1 (`src/Tarification.Domaine/Quantite.cs:6,10-11`) : le seuil d'un palier se compare directement à `Quantite.Valeur`.
8. Les critères chiffrés se vérifient : 10 × 2,00 € = 20,00 € ; 5 % = 1,00 € (critère 2) ; 50 × 2,00 € = 100,00 € ; 12 % = 12,00 € (critère 3) ; en comparaison, le palier 10 donnerait 5,00 €, donc le plus avantageux est bien le palier au seuil le plus haut atteint ici. Deux lignes de 6 (critère 4) : chaque ligne reste sous 10.
9. Comme les tests d'acceptance pilotent `CalculDuPanier` (`docs/adr/adr-001-decoupage-domaine-application.md:20-21`), la grille doit pouvoir y entrer : soit par le constructeur (aujourd'hui implicite, `src/Tarification.Application/CalculDuPanier.cs:19-22`), soit en paramètre de `Chiffrer`. Le critère 5 (aucun palier) impose une grille vide valide.

## Approches évaluées

### A. Type de domaine « grille de paliers » injecté dans `CalculDuPanier`
- Principe : `PalierDeQuantite` (seuil `Quantite`, pourcentage) et une `GrillePaliers` (liste, éventuellement vide) dans `Tarification.Domaine`, avec une méthode « remise pour une ligne » qui retient le palier atteint au pourcentage le plus élevé. `CalculDuPanier` reçoit la grille (constructeur) et additionne les remises des lignes pour renseigner `Facture.Remise`.
- Apporte : règle lisible par le métier, testable sans montage, en accord avec la décision de grille unique (`passation.md:5`) ; la grille vide donne naturellement 0,00 € (critère 5) ; le calcul par ligne est structurel (critère 4).
- Limites : plusieurs nouveaux types ; il faut ajouter une opération pourcentage à `Montant` ; une décision d'arrondi reste à prendre.
- Accord avec les conventions : fort — règles dans le domaine (`adr-001:25-26`), configuration passée à la règle (`adr-001:28-30`), types-valeurs avec fabrique `De` (`Quantite.cs:10`).
- Références : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Domaine/Montant.cs:18-23`, `src/Tarification.Application/CalculDuPanier.cs:19-22`.

### B. Méthode sur `LigneDePanier` prenant une liste de paliers
- Principe : `LigneDePanier.Remise(IEnumerable<Palier>)`, sans type de grille ; `CalculDuPanier` stocke la liste et somme.
- Apporte : moins de types, patron proche de `SousTotal` (`LigneDePanier.cs:6`).
- Limites : la règle « un seul palier, le plus avantageux » (critère 3) n'a pas de lieu propre ; la liste vide et les doublons de seuils ne sont pas validés ; la logique de sélection est appelée à grossir sur la ligne.
- Accord avec les conventions : correct (logique dans le domaine) mais moins expressif que A.
- Références : `src/Tarification.Domaine/LigneDePanier.cs:4-7`.

### C. Calcul dans `CalculDuPanier` (couche application)
- Principe : boucle sur `panier.Lignes` et logique de palier directement dans le cas d'usage.
- Apporte : le plus court à écrire.
- Limites : place une règle commerciale hors du domaine, ce que l'ADR-001 veut empêcher (`adr-001:25-26`).
- Accord : contraire à l'ADR-001. **Écartée.**
- Références : `src/Tarification.Application/CalculDuPanier.cs:21`.

### D. Grille par référence
- Principe : dictionnaire référence → paliers.
- Limites : contredit la décision utilisateur d'une grille unique (`.skraft/us-2/passation.md:5`) ; complexité sans besoin exprimé. **Écartée.**

## Recommandation

**Approche A** : introduire dans le domaine un palier et une grille de paliers (vide autorisée) qui calculent la remise d'une ligne en retenant le palier atteint le plus avantageux, ajouter à `Montant` l'opération de pourcentage nécessaire, et injecter la grille dans `CalculDuPanier` pour sommer les remises par ligne dans `Facture.Remise`. Tests d'acceptance écrits avec de vrais objets, sans doublure, selon la convention actuelle, avec les marqueurs `// @ac-1` à `// @ac-5`.

## Passage de relais

### Décisions à valider (pour la conception)
- Forme de la configuration : grille passée au constructeur de `CalculDuPanier` ou en paramètre de `Chiffrer` (le constructeur actuel est implicite, `CalculDuPanier.cs:19-22`) ; les tests existants appellent `new CalculDuPanier()` sans argument (`CalculDuPanierTests.cs:19,29,35`), donc la grille vide doit rester le comportement par défaut.
- Faut-il que `Facture.ATPayer` soustraie la `Remise` ? Aujourd'hui non (`CalculDuPanier.cs:12`) ; les critères US-2 ne l'exigent pas.
- Nom du fichier de tests d'acceptance (suffixe `AcceptanceTests.cs` attendu par `.agent-studio/stack.yaml:29`).

### Questions ouvertes
- Arrondi de la remise lorsque le pourcentage donne des fractions de centime : aucune règle dans le projet, aucun critère ne la fixe (hors critères chiffrés tombant juste).
- Comportement si deux paliers ont le même seuil, ou si un palier plus haut a un pourcentage plus faible que le palier inférieur. Les critères parlent du « plus avantageux » (`stories/US-2.md:9`) sans trancher ce cas.
- Cumul avec le code promotionnel de l'US-3 (`stories/US-3.md:14`) : hors US-2.

### Existant réutilisable
- `LigneDePanier` → `src/Tarification.Domaine/LigneDePanier.cs`
- `Panier` → `src/Tarification.Domaine/Panier.cs`
- `Montant` → `src/Tarification.Domaine/Montant.cs`
- `Quantite` → `src/Tarification.Domaine/Quantite.cs`
- `CalculDuPanier` → `src/Tarification.Application/CalculDuPanier.cs`
- `Facture` → `src/Tarification.Application/CalculDuPanier.cs`
