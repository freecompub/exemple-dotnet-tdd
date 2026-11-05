# Recherche — US-2 — Remise par palier de quantité

## Périmètre et critères de succès

La story demande qu'une ligne de panier bénéficie d'une remise automatique quand sa quantité
atteint un palier configuré, exprimé en pourcentage. Cinq critères d'acceptation (voir
`stories/US-2.md`) :

1. Palier « 10 ou plus : 5 % », ligne de 9 × 2,00 € : remise 0,00 €.
2. Même palier, ligne de 10 × 2,00 € : remise 1,00 € (5 % de 20,00 €).
3. Deux paliers (10 : 5 %, 50 : 12 %), ligne de 50 × 2,00 € : remise 12,00 € — un seul palier
   s'applique, le plus avantageux pour le client.
4. La remise se calcule par ligne : deux lignes de 6 articles (références différentes) ne
   cumulent pas leurs quantités pour franchir le palier de 10.
5. Aucun palier configuré : remise 0,00 €.

Succès = les 5 critères passent par des tests `xUnit` dans
`tests/Tarification.Tests/CalculDuPanierTests.cs` (ou une classe dédiée du même projet), sans
violer les règles de dépendance du domaine (`.skraft/quality.json`) ni casser les tests US-1
existants.

## Fichiers analysés

- `src/Tarification.Domaine/LigneDePanier.cs` — ligne de panier, `SousTotal = PrixUnitaire ×
  Quantite.Valeur`.
- `src/Tarification.Domaine/Panier.cs` — agrégat de lignes, `SommeDesLignes()`.
- `src/Tarification.Domaine/Montant.cs` — type-valeur euros, jamais négatif, opérateur `+`,
  `Multiplie(int)`, pas d'opération de pourcentage ni de soustraction.
- `src/Tarification.Domaine/Quantite.cs` — type-valeur entier ≥ 1.
- `src/Tarification.Application/CalculDuPanier.cs` — cas d'usage `Chiffrer(Panier) → Facture`;
  `Facture.Remise` vaut `Montant.Zero` en dur (ligne 13 : `new(panier.SommeDesLignes(),
  Montant.Zero, Montant.Zero)`), commentaire explicite : « Les remises … restent à zéro tant que
  les stories correspondantes ne sont pas livrées ».
- `tests/Tarification.Tests/CalculDuPanierTests.cs` — tests US-1, tagués `// @ac-N` sur les
  `[Fact]`, méthode utilitaire privée `Ligne(reference, quantite, prix)`.
- `docs/adr/adr-001-decoupage-domaine-application.md` — séparation domaine/application, montants
  en `decimal`, règles commerciales dans le domaine, pas d'infrastructure dans le domaine.
- `docs/adr/adr-002-format-de-rapport-de-tests.md` — rapport JUnit XML, sans impact sur la
  conception métier.
- `.skraft/quality.json` — couverture exigée 90 % (core) / 70 % (edge), règles de dépendance
  interdisant à `Tarification.Domaine` de référencer `Tarification.Application` ou de
  l'infrastructure.
- `.agent-studio/stack.yaml` — confirme que `Tarification.Domaine` ne doit importer aucun module
  d'infrastructure ; aucune convention de nommage additionnelle au-delà de ce qui est déjà observé
  dans le code.
- `stories/US-2.md` — critères d'acceptation et question ouverte explicite : « Les paliers
  sont-ils les mêmes pour toutes les références, ou définis par référence ? ».
- `stories/US-1.md` — forme de référence (déjà livrée), base verte des tests.

## Recherches effectuées

Aucune recherche externe : la story ne mentionne aucune bibliothèque tierce, et le domaine est
entièrement interne (types-valeurs maison). Seule une relecture des fichiers listés ci-dessus et
des ADR du dépôt a été menée.

## Conventions du projet

- **Deux couches, une direction de dépendance** : règles commerciales dans
  `Tarification.Domaine` (pas d'infrastructure, pas de dépendance vers `Tarification.Application`),
  cas d'usage dans `Tarification.Application` qui orchestre le domaine
  (`docs/adr/adr-001-decoupage-domaine-application.md`).
- **Types-valeurs immuables** : `Montant` et `Quantite` sont des `readonly record struct` avec
  constructeur privé et fabrique statique `De(...)` qui valide l'invariant et lève
  `ArgumentOutOfRangeException` sinon (`src/Tarification.Domaine/Montant.cs:12-16`,
  `src/Tarification.Domaine/Quantite.cs:8-9`). Toute nouvelle règle de validation suit ce patron.
  `LigneDePanier` et `Facture` sont des `sealed record` (`LigneDePanier.cs:3`,
  `CalculDuPanier.cs:11`).
- **Montants en `decimal`**, jamais `double` (`docs/adr/adr-001-decoupage-domaine-application.md`,
  section Conséquences).
- **`Montant` n'a pas d'opération de pourcentage ni de soustraction** aujourd'hui
  (`src/Tarification.Domaine/Montant.cs:1-25`) : seuls `+` et `Multiplie(int)` existent. Une
  remise exprimée en pourcentage d'un `Montant` demande donc une nouvelle opération sur ce type, ou
  un calcul fait ailleurs à partir de `Euros` (ce qui romprait l'encapsulation).
- **Commentaires de résumé en tête de type**, un paragraphe, ton direct (voir chaque fichier du
  domaine).
- **Tests xUnit** avec `[Fact] // @ac-N` quand le test correspond explicitement à un critère
  d'acceptation numéroté de la story (`tests/Tarification.Tests/CalculDuPanierTests.cs:16,24,31`);
  les tests d'invariants techniques (validation `De`) n'ont pas ce tag
  (`CalculDuPanierTests.cs:36,43`). Une méthode utilitaire privée `Ligne(...)` construit les
  fixtures (`CalculDuPanierTests.cs:12-13`).
- **`Facture` porte un champ par composante du prix** (`SommeDesArticles`, `Remise`,
  `FraisDePort`), rempli à `Montant.Zero` tant que la story correspondante n'est pas livrée
  (`CalculDuPanier.cs:7-14`) — US-2 doit remplacer ce `Montant.Zero` de `Remise` par un calcul réel
  sans toucher aux autres champs.
- **Pas de couche infrastructure** : toute configuration (ici, les paliers de remise) doit être un
  objet du domaine ou de l'application, pas une source externe (fichier, base) — cohérent avec
  l'ADR-001 qui reporte l'infrastructure à quand un besoin réel la réclame.

## Découvertes

- `CalculDuPanier.Chiffrer` ignore aujourd'hui toute notion de remise ; la somme des articles
  (`SommeDesArticles`) utilise déjà le sous-total brut de chaque ligne
  (`src/Tarification.Application/CalculDuPanier.cs:14`, `src/Tarification.Domaine/Panier.cs:15`).
  Un ajout de remise par ligne doit décider si `SommeDesArticles` reste le total brut (cohérent
  avec son nom) et si `Remise` est une valeur séparée soustraite seulement dans `ATPayer`
  (`CalculDuPanier.cs:11` : `ATPayer => SommeDesArticles + FraisDePort`, qui omettrait alors la
  remise — un point à trancher en conception).
- Rien dans le domaine actuel ne représente un « palier » (seuil + taux) : il faudra un nouveau
  type (p. ex. une liste de paliers) suivant le patron type-valeur illustré par `Montant`/
  `Quantite` (fabrique statique validante, immuable).
- Aucun mécanisme de pourcentage n'existe sur `Montant` ; `Multiplie(int)` ne couvre que les
  facteurs entiers (`src/Tarification.Domaine/Montant.cs:20-21`). Un calcul à 5 % ou 12 % demande
  soit une nouvelle méthode sur `Montant` prenant un facteur décimal, soit un calcul externe suivi
  de `Montant.De(...)`.
- US-2.md porte une question ouverte non résolue par les critères d'acceptation eux-mêmes : « Les
  paliers sont-ils les mêmes pour toutes les références, ou définis par référence ? »
  (`stories/US-2.md`, section Questions ouvertes). Aucun des 5 critères ne distingue deux
  références avec des paliers différents ; l'AC-4 vérifie seulement que la remise est calculée
  ligne par ligne (pas de cumul de quantités entre lignes), ce qui est compatible aussi bien avec
  des paliers globaux qu'avec des paliers par référence.
- Aucune référence ni fichier du dépôt ne contredit un autre document consulté.

## Approches évaluées

### A. Paliers globaux, passés en paramètre du cas d'usage

Principe : une liste de paliers (seuil de quantité, taux) est injectée dans `CalculDuPanier` (p.
ex. via son constructeur) et appliquée identiquement à chaque ligne du panier.

Apports : répond directement aux 5 critères d'acceptation, qui n'utilisent qu'un seul jeu de
paliers pour toutes les lignes testées. Respecte l'ADR-001 (règle commerciale dans le domaine,
cas d'usage dans l'application qui la fournit). Cohérent avec le patron type-valeur du domaine si
les paliers sont eux-mêmes un type validé.

Limites : si la vraie règle métier est « paliers par référence », cette approche devra être
retravaillée plus tard (changement de signature du cas d'usage).

Accord avec les conventions : fort — même esprit que `Montant`/`Quantite` (type-valeur +
fabrique), aucune dépendance d'infrastructure ajoutée.

Références : `stories/US-2.md` (les 5 AC n'utilisent qu'un seul jeu de paliers),
`src/Tarification.Application/CalculDuPanier.cs:16-17` (point d'injection naturel).

### B. Paliers portés par chaque `LigneDePanier` (ou par référence, via une table)

Principe : chaque ligne (ou chaque référence produit) connaît son propre jeu de paliers,
transporté par exemple dans `LigneDePanier` ou résolu via un dictionnaire référence → paliers.

Apports : couvre le cas où la question ouverte de `stories/US-2.md` serait tranchée en faveur de
paliers spécifiques par référence.

Limites : aucun des 5 critères d'acceptation ne l'exige ; introduire cette complexité maintenant
anticipe une réponse à une question non tranchée, et ajoute un concept (mapping référence →
paliers) sans test qui le justifie.

Accord avec les conventions : partiel — alourdit `LigneDePanier`, qui reste aujourd'hui un simple
triplet (référence, quantité, prix unitaire) sans logique propre
(`src/Tarification.Domaine/LigneDePanier.cs:3-7`).

Références : `src/Tarification.Domaine/LigneDePanier.cs:3-7`, `stories/US-2.md` (question
ouverte).

## Recommandation

Retenir l'**approche A** : un jeu unique de paliers de remise (seuil de quantité + taux),
représenté par un nouveau type du domaine suivant le patron type-valeur déjà en place, appliqué
ligne par ligne par `CalculDuPanier` et sélectionnant le palier le plus avantageux atteint par
chaque ligne. Elle couvre exactement les 5 critères d'acceptation sans préjuger de la réponse à la
question ouverte sur les paliers par référence, et reste conforme à l'ADR-001 (règle commerciale
dans le domaine, aucune dépendance d'infrastructure).

L'approche B est écartée pour l'instant : aucun critère d'acceptation ne la requiert, et elle
répondrait à une question métier non tranchée.

## Passage de relais

### Existant réutilisable

- `Montant` → `src/Tarification.Domaine/Montant.cs`
- `Quantite` → `src/Tarification.Domaine/Quantite.cs`
- `LigneDePanier` → `src/Tarification.Domaine/LigneDePanier.cs`
- `Panier` → `src/Tarification.Domaine/Panier.cs`
- `CalculDuPanier` → `src/Tarification.Application/CalculDuPanier.cs`
- `Facture` → `src/Tarification.Application/CalculDuPanier.cs`

### Décisions à valider

- Comment `Montant` exposera-t-il un calcul de pourcentage (nouvelle méthode sur `Montant`, ou
  calcul externe à partir de `Euros` suivi de `Montant.De(...)`) — à trancher en conception, sans
  rompre l'immutabilité ni l'invariant « jamais négatif ».
- `Facture.ATPayer` ne soustrait pas la remise (`CalculDuPanier.cs:11`) : à corriger ou à confirmer
  comme hors-périmètre d'US-2 (la story ne teste pas `ATPayer`, seulement `Remise`).
- Arrondi du montant de remise quand le taux produit plus de deux décimales (aucun des 5 critères
  ne couvre ce cas, mais l'implémentation devra choisir une règle — `Math.Round` standard du
  domaine n'existe pas encore).

### Questions ouvertes

- « Les paliers sont-ils les mêmes pour toutes les références, ou définis par référence ? »
  (`stories/US-2.md`, section Questions ouvertes) — non tranchée par les 5 critères
  d'acceptation ; la recommandation ci-dessus suppose des paliers globaux, à confirmer avant ou
  pendant la conception.
