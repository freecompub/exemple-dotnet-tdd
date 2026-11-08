# Recherche — US-2 Remise par palier de quantité

## Périmètre et critères de succès

Calculer, pour chaque ligne de panier, une remise selon des paliers « à partir de N articles : X % ». Un seul palier s'applique : le plus avantageux. Sans palier, la remise vaut 0,00 € (`stories/US-2.md:7-11`).

Critères de succès (`stories/US-2.md:7-11`) :
1. Palier 10 : 5 %, 9 articles à 2,00 € → 0,00 €.
2. Palier 10 : 5 %, 10 articles à 2,00 € → 1,00 €.
3. Paliers 10 : 5 % et 50 : 12 %, 50 articles à 2,00 € → 12,00 €.
4. Calcul par ligne : deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
5. Aucun palier → 0,00 €.

Décision utilisateur : paliers identiques pour toutes les références, une seule liste globale (`.skraft/us-2/passation.md:5`). Cela ferme la question ouverte de `stories/US-2.md:14`.

Hors périmètre : frais de port et autres stories (US-3 à US-6). Je ne les ai pas lues.

## Fichiers analysés

- `src/Tarification.Domaine/LigneDePanier.cs`
- `src/Tarification.Domaine/Panier.cs`
- `src/Tarification.Domaine/Montant.cs`
- `src/Tarification.Domaine/Quantite.cs`
- `src/Tarification.Application/CalculDuPanier.cs`
- `tests/Tarification.Tests/CalculDuPanierTests.cs`
- `tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs`
- `tests/Tarification.UnitTests/Features/panier-chiffrage.feature`
- `tests/Tarification.UnitTests/Tarification.UnitTests.csproj`
- `docs/adr/adr-001-decoupage-domaine-application.md`
- `docs/adr/adr-002-format-de-rapport-de-tests.md`
- `agents.md`
- `stories/US-2.md`
- `.skraft/us-2/passation.md`

## Recherches effectuées

Aucune recherche externe (pas d'accès réseau). Exploration du dépôt avec `list_files` et lecture des fichiers ci-dessus. Aucune recherche antérieure n'existait sous `.skraft/us-2/research/`.

## Conventions du projet

- Deux couches, une seule direction de dépendance. `Tarification.Domaine` ne dépend de rien. Il porte les types-valeurs et les règles. `Tarification.Application` ne dépend que du domaine et porte les cas d'usage (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`). Les règles commerciales (paliers de remise cités) vont dans le domaine (`adr-001:8`, `:25`).
- Montants en `decimal`, jamais en `double` (`adr-001:32-33`).
- Types-valeurs : `readonly record struct` à constructeur privé, fabrique statique `De(...)` qui lève `ArgumentOutOfRangeException` si la valeur est invalide (`src/Tarification.Domaine/Montant.cs:7-14`, `src/Tarification.Domaine/Quantite.cs:4-11`).
- Entités et valeurs composées : `sealed record` (`LigneDePanier.cs:4`) ou `sealed class` (`Panier.cs:4`).
- Nommage en français pour les types et les méthodes : `Ajoute`, `Multiplie`, `SommeDesLignes`, `Chiffrer`. Les commentaires XML sont en français.
- Cas d'usage : `CalculDuPanier.Chiffrer(Panier)` retourne un `Facture` (`CalculDuPanier.cs:19-21`). Le commentaire prévoit que les remises restent à zéro tant que leur story n'est pas livrée (`CalculDuPanier.cs:5-9`).
- Tests d'acceptance : Gherkin en français (`# language: fr`), tags `@bdd @panier @US-n` et `@ac-n`, liés par Reqnroll dans `*.UnitTests` (`panier-chiffrage.feature:1-7`, `agents.md:1`, `UnitTests.csproj:10-11`). Le step existant crée `new CalculDuPanier()` sans argument (`ChiffrageDuPanierSteps.cs:26`).
- Doublures : aucune en usage. Tous les tests construisent directement les vrais objets du domaine (`ChiffrageDuPanierSteps.cs:12-26`).
- Tests unitaires xUnit des valeurs du domaine dans `Tarification.Tests` (`CalculDuPanierTests.cs:11-22`). Selon `agents.md:2`, un test xUnit qui double un scénario Reqnroll doit être retiré. On ne garde que les cas limites non couverts.
- Les scénarios US-1 sont dans `panier-chiffrage.feature`. Pour US-2, un nouveau fichier ou une extension de celui-ci reste à décider (conception).

## Découvertes

1. Le calcul actuel ne soustrait rien. `Facture.ATPayer = SommeDesArticles + FraisDePort` (`CalculDuPanier.cs:12`). `Chiffrer` passe `Montant.Zero` pour la remise et les frais de port (`CalculDuPanier.cs:21`). Le champ `Remise` existe déjà mais n'entre pas dans `ATPayer`.
2. `Montant` n'a ni soustraction, ni multiplication par un pourcentage. Il a `+`, `Multiplie(int)` et `CompareTo` (`Montant.cs:18-23`). Un montant négatif est interdit (`Montant.cs:13-14`). Une soustraction `somme - remise` n'est donc sûre que si la remise ne dépasse jamais la somme.
3. `LigneDePanier.SousTotal` = prix unitaire × quantité (`LigneDePanier.cs:6`). C'est l'assiette de la remise par ligne. Sur les critères : 10 × 2,00 = 20,00 € ; 5 % → 1,00 € ; 50 × 2,00 = 100,00 € ; 12 % → 12,00 €.
4. `Panier` expose `Lignes` (`Panier.cs:8`). La remise par ligne se calcule donc sans changer `Panier`. Le critère 4 est satisfait si chaque ligne est évaluée seule sur sa propre quantité.
5. `Quantite.Valeur` est un `int` ≥ 1 (`Quantite.cs:6`, `:11`). Le seuil d'un palier se compare directement à cette valeur.
6. Le critère 3 « le plus avantageux » : pour un pourcentage appliqué à la même assiette, le palier applicable le plus avantageux est celui au plus grand pourcentage parmi ceux dont le seuil est atteint. Rien dans les critères n'interdit un pourcentage décroissant avec le seuil (ex. 10 : 12 %, 50 : 5 %) ; « le plus avantageux » doit alors se comprendre comme le pourcentage maximal, et non le seuil maximal. Voir les questions ouvertes.
7. L'arrondi de la remise n'est spécifié nulle part. Les critères ne donnent que des résultats exacts. La question d'arrondi posée en bloqueur n'a pas été tranchée par l'utilisateur (`passation.md:5` ne répond qu'à la portée des paliers).
8. Les paliers étant globaux, ils sont une donnée de configuration unique, indépendante de la référence. Il faut les fournir à la règle (passer plutôt qu'appeler), conformément à `adr-001:28-30`.9. Il n'y a pas encore de scénario pour la remise. Le seul step « Alors » vérifie la somme des articles (`ChiffrageDuPanierSteps.cs:28-33`). Il faudra ajouter les steps pour configurer des paliers et vérifier la remise.
10. `new CalculDuPanier()` est appelé sans argument dans les steps (`ChiffrageDuPanierSteps.cs:26`). Si les paliers arrivent par le constructeur, les scénarios US-1 doivent continuer à fonctionner : il faut un constructeur sans paliers, ou une liste vide par défaut. Le critère 5 (aucun palier → 0,00 €) correspond à ce cas.

## Approches évaluées

### A. Type de domaine `PalierDeRemise` + politique `BaremeDeRemises`, passé au cas d'usage
- Principe : le domaine porte un `PalierDeRemise` (seuil `Quantite`, pourcentage) et un barème (liste de paliers). `LigneDePanier` (ou le barème) calcule la remise d'une ligne. `CalculDuPanier` reçoit le barème, somme les remises par ligne et les place dans `Facture.Remise`.
- Apport : la règle reste dans le domaine (`adr-001:25`). Le barème est testable sans montage (`adr-001:28-30`). Le calcul par ligne est naturel (critère 4). La liste vide donne zéro (critère 5).
- Limites : ajoute des types. Impose d'ajouter à `Montant` une opération de pourcentage et une soustraction, ou de ne pas toucher à `ATPayer`.
- Accord avec les conventions : fort. Elle suit le style des types-valeurs avec fabrique `De` (`Montant.cs:13`, `Quantite.cs:10`), les noms français et les `sealed record`.
- Références : `LigneDePanier.cs:4-6`, `Montant.cs:18-23`, `CalculDuPanier.cs:10-21`, `adr-001:15-30`.

### B. Calcul directement dans `CalculDuPanier`
- Principe : une liste de paliers sous forme de tuples/records dans la couche application, et la boucle sur les lignes dans `Chiffrer`.
- Apport : peu de code.
- Limites : place une règle commerciale dans la couche application, ce qui contredit `adr-001:25` (la règle doit vivre dans le domaine). Plus difficile à tester isolément.
- Accord avec les conventions : faible.
- Références : `CalculDuPanier.cs:19-22`, `adr-001:20-26`.

### C. Paliers par référence (dictionnaire référence → paliers)
- Principe : un barème indexé par `LigneDePanier.Reference`.
- Apport : plus flexible.
- Limites : écartée, car contraire à la décision utilisateur (paliers globaux, `passation.md:5`). Elle ajouterait aussi de la complexité sans besoin exprimé.
- Références : `LigneDePanier.cs:4`, `passation.md:5`.

### D. Remise sur le panier entier (cumul des quantités)
- Principe : appliquer le palier sur le total d'articles du panier.
- Limites : écartée, contraire au critère 4 (`stories/US-2.md:10`).

## Recommandation

Approche A : un `PalierDeRemise` et un barème dans `Tarification.Domaine`. La remise d'une ligne se calcule sur son `SousTotal` avec le palier applicable le plus avantageux. `CalculDuPanier` reçoit le barème (liste vide par défaut) et somme les remises des lignes dans `Facture.Remise`. Les décisions de forme (types exacts, arrondi, impact sur `ATPayer`) restent à la conception.

## Passage de relais

### Décisions à valider
- Les paliers sont globaux, identiques pour toutes les références : décision utilisateur (`passation.md:5`).
- Où et comment injecter le barème dans `CalculDuPanier`. Les steps existants appellent `new CalculDuPanier()` (`ChiffrageDuPanierSteps.cs:26`).
- Si la remise est déduite de `ATPayer`, il faut une soustraction sur `Montant`. Aujourd'hui `ATPayer` ignore `Remise` (`CalculDuPanier.cs:12`). Les critères US-2 ne mentionnent que la remise, pas le montant à payer.

### Questions ouvertes
- Arrondi de la remise au centime lorsqu'elle n'est pas exacte (ex. 5 % de 3,33 €) : non précisé par les critères ni par l'utilisateur (`passation.md:5`). C'est une règle métier à demander avant d'implémenter ce cas. Aucun critère ne l'exige.
- « Le plus avantageux » : plus grand pourcentage ou plus grand seuil atteint ? Équivalent si les pourcentages croissent avec le seuil (cas du critère 3).
- Validation d'un palier (seuil ≥ 1 ; pourcentage entre 0 et 100 ; doublons de seuil) : non spécifiée.
- Faut-il retirer ou compléter des tests existants ? Aucun test US-1 ne couvre la remise.

### Existant réutilisable
- `LigneDePanier` → `src/Tarification.Domaine/LigneDePanier.cs`
- `Panier` → `src/Tarification.Domaine/Panier.cs`
- `Montant` → `src/Tarification.Domaine/Montant.cs`
- `Quantite` → `src/Tarification.Domaine/Quantite.cs`
- `Facture` → `src/Tarification.Application/CalculDuPanier.cs`
- `CalculDuPanier` → `src/Tarification.Application/CalculDuPanier.cs`
- `ChiffrageDuPanierSteps` → `tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs`
