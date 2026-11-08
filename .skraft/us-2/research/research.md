# Recherche — US-2 Remise par palier de quantité

## Périmètre et critères de succès

Calculer, pour chaque ligne de panier, une remise selon une grille de paliers de quantité, et la
renseigner dans `Facture.Remise` (`stories/US-2.md:7-11`). Critères :

1. Palier 10 → 5 %, 9 articles à 2,00 € : remise 0,00 €.
2. Palier 10 → 5 %, 10 articles à 2,00 € : remise 1,00 €.
3. Paliers 10 → 5 % et 50 → 12 %, 50 articles à 2,00 € : 12,00 €. Un seul palier, le plus avantageux.
4. Calcul par ligne, jamais sur le panier entier (2 lignes de 6, références différentes : pas de remise).
5. Aucune grille : remise 0,00 €.

Décisions de l'utilisateur (`.skraft/us-2/passation.md:5`) : grille de paliers **unique, identique pour
toutes les références** ; la remise est **seulement renseignée dans `Facture.Remise`**, pas déduite
de `ATPayer`.

Hors périmètre : paliers par référence, déduction de la remise du total, frais de port.

## Fichiers analysés

- `src/Tarification.Domaine/LigneDePanier.cs`, `Panier.cs`, `Montant.cs`, `Quantite.cs`
- `src/Tarification.Application/CalculDuPanier.cs`
- `tests/Tarification.Tests/CalculDuPanierTests.cs`
- `tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs`
- `tests/Tarification.UnitTests/Features/panier-chiffrage.feature`
- `docs/adr/adr-001-decoupage-domaine-application.md`, `adr-002-format-de-rapport-de-tests.md`
- `stories/US-2.md`, `agents.md`, `skraft-config.json`

## Recherches effectuées

Exploration du dépôt uniquement (aucune source externe). Aucune recherche antérieure sous
`.skraft/us-2/research/` à réutiliser (seul `passation.md` existe).

## Conventions du projet

- Deux couches : le domaine ne dépend de rien, l'application dépend du seul domaine
  (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`). Les règles commerciales (paliers de
  remise, arrondis) vont dans le domaine (`adr-001:8-9, 25-26`).
- Types-valeurs : `readonly record struct` à constructeur privé et fabrique statique `De(...)` qui
  lève `ArgumentOutOfRangeException` (`Montant.cs:7-14`, `Quantite.cs:4-11`). Entité de ligne : `sealed record`
  (`LigneDePanier.cs:4`).
- Montants en `decimal`, jamais `double` (`adr-001:32-33`).
- Langue : identifiants et commentaires XML en français (`Panier.Lignes`, `SommeDesLignes`, `Multiplie`).
  Tests xUnit nommés en phrases françaises à underscores (`CalculDuPanierTests.cs:12, 19`).
- Namespaces `Tarification.Domaine` / `Tarification.Application` ; tests `Tarification.Tests` (xUnit) et
  `Tarification.UnitTests` (Reqnroll).
- Le point d'entrée piloté par les tests d'acceptance est `CalculDuPanier` (`CalculDuPanier.cs:15-18`).
- BDD : Reqnroll + xUnit dans `*.UnitTests`, fichiers `.feature` en français, tags `@bdd @panier @US-n`,
  `@ac-n`, `@happy-path`/`@edge-case` (`panier-chiffrage.feature:1-7, 21`, `agents.md:1`). Étapes
  avec décimaux écrits à point (`4.50`) et parsés en `InvariantCulture` (`ChiffrageDuPanierSteps.cs:18-22`).
- Pas de doublures en usage : aucun mock/fake dans les tests actuels ; les objets du domaine sont
  construits réellement (`ChiffrageDuPanierSteps.cs:21-26`).
- Les tests xUnit manuels ne doivent pas doubler les scénarios Gherkin ; ne garder que les cas limites
  non couverts (`agents.md:2`).
- Mutation Stryker configurée sur les changements depuis la branche de base (`skraft-config.json:20`).

## Découvertes

- `Facture.Remise` existe déjà mais est codée à `Montant.Zero` ; le commentaire dit que les remises
  restent à zéro tant que leur story n'est pas livrée (`CalculDuPanier.cs:5-10, 21`).
- `ATPayer = SommeDesArticles + FraisDePort` ne soustrait pas la remise (`CalculDuPanier.cs:12`) :
  conforme à la décision utilisateur, rien à changer.
- `CalculDuPanier` n'a pas de constructeur ni d'état ; `Chiffrer(Panier)` seul (`CalculDuPanier.cs:19-21`).
  Les étapes l'instancient par `new CalculDuPanier()` (`ChiffrageDuPanierSteps.cs:26`) : un changement de
  signature de constructeur touche ce fichier (un paramètre optionnel ou un constructeur sans argument le préserve).
- `LigneDePanier` expose `Reference`, `Quantite`, `PrixUnitaire`, `SousTotal` (`LigneDePanier.cs:4-6`) :
  tout ce qu'il faut pour une remise par ligne. Le critère 4 est satisfait naturellement par un calcul
  ligne par ligne et une somme ; les lignes de références différentes ne s'additionnent pas.
- Le domaine n'a pas d'opération pour appliquer un pourcentage : `Montant` ne propose que `+`, `Multiplie(int)`
  et `CompareTo` (`Montant.cs:18-23`). Il faut ajouter une opération (ex. prendre un pourcentage) ou
  calculer sur `Euros`. `Multiplie` refuse un facteur négatif et ne prend qu'un `int` (`Montant.cs:20-21`).
- `Montant` n'a ni soustraction ni arrondi ; un montant négatif est interdit (`Montant.cs:5-6, 13-14`).
- `Panier.SommeDesLignes` utilise `Aggregate(Montant.Zero, …)` (`Panier.cs:16`) : patron à reprendre pour sommer les remises.
- Exemples chiffrés : 10 × 2,00 = 20,00 ; 5 % = 1,00. 50 × 2,00 = 100,00 ; 12 % = 12,00. Aucun de ces cas n'exige d'arrondi.
- Le palier « le plus avantageux » : avec des taux croissants avec le seuil, c'est le palier de seuil le plus haut atteint
  ; si une grille avait un taux non monotone, « le plus avantageux » (taux maximal) et « seuil le plus haut » diffèrent
  (non précisé par la story, voir questions ouvertes).
- Le test existant `Tarification.Tests` ne couvre que les invariants des types-valeurs (`CalculDuPanierTests.cs:11-22`).

## Approches évaluées

### A. Type de domaine `GrilleDePaliers` + `PalierDeQuantite`, injecté dans `CalculDuPanier`
- Principe : le domaine porte `PalierDeQuantite(seuil, taux)` et une grille qui, pour une `LigneDePanier`, retourne
  la remise (palier le plus avantageux, sinon zéro). `Panier` somme les remises par ligne.
  `CalculDuPanier` reçoit la grille (constructeur, grille vide par défaut) et remplit `Facture.Remise`.
- Apport : règle métier lisible dans le domaine (`adr-001:8-9, 25-26`) ; testable sans montage ; critères 1-5 se
  mappent directement ; la grille unique correspond à la décision utilisateur ; grille vide = critère 5.
- Limites : ajoute 1-2 types et une opération de pourcentage sur `Montant` ; modifie la construction de `CalculDuPanier`.
- Accord conventions : fort (types-valeurs, domaine pur, `decimal`, `Aggregate`).
- Références : `Montant.cs:7-23`, `Panier.cs:16`, `LigneDePanier.cs:4-6`, `CalculDuPanier.cs:19-21`.

### B. Calcul de remise dans `CalculDuPanier` (couche application)
- Principe : la boucle sur les lignes et la sélection de palier sont écrites dans `Chiffrer`.
- Apport : moins de types, changement local.
- Limites : place une règle commerciale hors du domaine, contre `adr-001:25-26` ; la logique devient moins réutilisable.
- Accord : faible. Rejetée.

### C. Paliers définis par référence (dictionnaire référence → grille)
- Principe : chaque référence a sa grille.
- Limites : écarté par la décision utilisateur (`passation.md:5`) ; complexité inutile.
- Rejetée.

### D. Remise sur la quantité cumulée du panier par référence
- Principe : regrouper les lignes de même référence avant d'appliquer le palier.
- Limites : la story parle de « ligne » (critère 4) ; un regroupement n'est pas demandé et changerait la règle si un panier
  contient deux lignes de la même référence. Non étayé par la story. Rejetée.

## Recommandation

Approche A : un type de domaine pour les paliers et la grille, la remise calculée par ligne dans le domaine et sommée
dans `Panier`, la grille passée à `CalculDuPanier` (vide par défaut, pour que `new CalculDuPanier()` et les scénarios US-1 restent valides).
Les scénarios Reqnroll des critères 1-5 s'ajoutent dans un nouveau `.feature` taggé `@US-2`, avec des étapes de configuration des paliers.

## Passage de relais

### Existant réutilisable

- `Panier` → `src/Tarification.Domaine/Panier.cs`
- `LigneDePanier` → `src/Tarification.Domaine/LigneDePanier.cs`
- `Montant` → `src/Tarification.Domaine/Montant.cs`
- `Quantite` → `src/Tarification.Domaine/Quantite.cs`
- `CalculDuPanier` → `src/Tarification.Application/CalculDuPanier.cs`
- `Facture` → `src/Tarification.Application/CalculDuPanier.cs`
- `ChiffrageDuPanierSteps` → `tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs`

### Décisions à valider

- Domaine plutôt qu'application pour la règle (approche A).
- Forme d'injection de la grille dans `CalculDuPanier` (constructeur avec grille vide par défaut) : choix de conception.
- Opération de pourcentage sur `Montant` ou calcul sur `Euros`.

### Questions ouvertes

- **Arrondi** : la story ne dit rien pour une remise qui ne tombe pas juste au centime (ex. 11 × 1,99 € × 5 % = 1,0945 €).
  Mode d'arrondi et moment (par ligne ou sur le total) à fixer ; aucun critère ne l'exige. `adr-001:8-9` cite les arrondis comme règle métier.
- **« Le plus avantageux »** : pour des grilles non monotones, plus haut taux ou plus haut seuil atteint ? Les critères n'en ont pas besoin.
- **Validation de la grille** : seuil < 1, taux hors 0-100 %, seuils en double — comportement non spécifié.
