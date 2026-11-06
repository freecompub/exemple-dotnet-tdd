# Recherche — US-2 Remise par palier de quantité

## Périmètre et critères de succès

Calculer, pour chaque ligne du panier, une remise selon des paliers « à partir de N articles : P % », et la rendre dans `Facture.Remise` (`stories/US-2.md:7-11`).

Critères (`stories/US-2.md:7-11`) :
1. Palier 10→5 %, 9 × 2,00 € : remise 0,00 €.
2. Palier 10→5 %, 10 × 2,00 € : remise 1,00 €.
3. Paliers 10→5 % et 50→12 %, 50 × 2,00 € : remise 12,00 € (un seul palier, le plus avantageux).
4. Calcul par ligne : deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
5. Aucun palier : remise 0,00 €.

Hors périmètre : arrondi au centime (US-5, `stories/US-5.md:7-11`), code promo (US-3, `stories/US-3.md:13-15`).

Recherche externe : aucune (non nécessaire, aucun accès réseau).

## Fichiers analysés

- `src/Tarification.Domaine/LigneDePanier.cs`
- `src/Tarification.Domaine/Panier.cs`
- `src/Tarification.Domaine/Montant.cs`
- `src/Tarification.Domaine/Quantite.cs`
- `src/Tarification.Application/CalculDuPanier.cs`
- `tests/Tarification.Tests/CalculDuPanierTests.cs`
- `docs/adr/adr-001-decoupage-domaine-application.md`, `docs/adr/adr-002-format-de-rapport-de-tests.md`
- `.skraft/quality.json`, `README.md`, `stories/US-2.md`, `US-3.md`, `US-5.md`

## Recherches effectuées

- Arborescence complète du projet (24 fichiers). Aucun dossier `.skraft/us-2/research/` préexistant : rien à réutiliser.
- Aucun type « palier », « remise » ou « grille » n'existe dans le code (lecture de tous les fichiers de `src/`).

## Conventions du projet

- Deux couches, une seule direction de dépendance : le domaine ne dépend de rien, l'application dépend du domaine seul (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`). Les règles commerciales (paliers de remise cités explicitement) vont dans le domaine (`adr-001:8-11`, `:25-26`).
- Une règle qui a besoin d'un service extérieur doit se le faire passer (`adr-001:28-30`).
- Montants en `decimal`, jamais `double` (`adr-001:32-33`).
- Types-valeurs : `readonly record struct` à constructeur privé et fabrique statique `De(...)` qui lève `ArgumentOutOfRangeException` (`src/Tarification.Domaine/Montant.cs:7-14`, `Quantite.cs:4-11`).
- Entités/lignes : `sealed record` (`LigneDePanier.cs:4`) ; agrégat : `sealed class` à API fluide `Ajoute` qui retourne `this` (`Panier.cs:10-14`).
- Noms de domaine en français, sans accent dans les identifiants de type (`Tarification.Domaine`, `LigneDePanier`), accents tolérés dans les commentaires. Méthodes de test en `Phrase_en_snake_case` (`CalculDuPanierTests.cs:17`).
- Tests : xUnit, point d'entrée = cas d'usage `CalculDuPanier.Chiffrer`, tag `// @ac-N` sur la ligne de `[Fact]` (`CalculDuPanierTests.cs:16,24,32`). Helper local `Ligne(reference, quantite, prix)` (`:13-14`). Aucune doublure (mock/fake) en usage : le domaine est pur.
- Barre de qualité : couverture core 90 %, edge 70 % ; règles de dépendance interdisant EF, System.Data, System.Net.Http (`.skraft/quality.json:3-25`).
- `Facture` documente que les remises restent à zéro tant que la story n'est pas livrée (`CalculDuPanier.cs:5-10`).

## Découvertes

1. `Facture.Remise` existe déjà mais est codée à `Montant.Zero` (`CalculDuPanier.cs:10,21`). Les critères 1 et 5 passeraient donc déjà par accident ; 2, 3, 4 sont à construire.
2. `Facture.ATPayer = SommeDesArticles + FraisDePort` : la remise n'est **pas** soustraite (`CalculDuPanier.cs:12`). Les critères US-2 ne parlent que de la remise ; la déduire du total n'est pas exigé explicitement.
3. `Montant` n'a ni soustraction, ni multiplication par un pourcentage, ni comparaison autre que `CompareTo` (`Montant.cs:18-23`). `Multiplie` n'accepte qu'un `int` (`Montant.cs:20`) : un pourcentage décimal (5 %) demande une nouvelle opération (ex. `Fois(decimal)`) ou une conversion.
4. `Montant` interdit les valeurs négatives (`Montant.cs:13-14`) : une soustraction devra gérer ce cas.
5. `Panier.Lignes` expose les lignes individuelles (`Panier.cs:8`) avec `Reference` (`LigneDePanier.cs:4`) : le calcul par ligne est directement possible. Rien n'empêche deux lignes de même référence dans un panier (`Panier.Ajoute` n'agrège pas, `Panier.cs:10-14`) ; le critère 4 dit « par ligne », donc elles ne s'additionnent pas.
6. Le choix « le plus avantageux » (critère 3) : à 50 articles, les deux paliers sont atteints (10 et 50) ; on retient le seuil le plus élevé atteint, ou le pourcentage maximal. Les deux coïncident tant que les pourcentages croissent avec le seuil ; ils divergent si une grille est incohérente (ex. 10→10 %, 50→5 %) — la sémantique « plus avantageux pour le client » = pourcentage maximal.
7. Question ouverte de la story : paliers identiques pour toutes les références, ou par référence (`stories/US-2.md:13-14`). Les critères n'en configurent jamais par référence, et le critère 4 suppose un même palier de 10 pour deux références différentes (`US-2.md:10`).
8. L'arrondi est traité par l'US-5 (« une seule fois, sur chaque montant rendu », `stories/US-5.md:9`). Avec 5 % et des prix entiers, les critères US-2 donnent des montants exacts (10×2,00×5 % = 1,00 ; 50×2,00×12 % = 12,00) : aucun arrondi n'est nécessaire ici.
9. L'US-3 demande de savoir si un code se cumule avec les paliers (`stories/US-3.md:13-14`) : la remise par ligne doit rester un montant distinct combinable plus tard.
10. Le projet de tests existant est `tests/Tarification.Tests/Tarification.Tests.csproj` ; les nouveaux tests y prennent place.

## Approches évaluées

### A. `PalierDeQuantite` + `GrilleDeRemise` dans le domaine, grille passée au cas d'usage (réf. : `adr-001:8-11,28-30`)
- Principe : un type-valeur `PalierDeQuantite(Quantite seuil, decimal pourcentage)` ; un objet `GrilleDeRemise` (liste de paliers, vide autorisée) avec `RemisePour(LigneDePanier) → Montant` qui choisit le palier atteint le plus avantageux. `CalculDuPanier` reçoit la grille (constructeur, valeur par défaut = grille vide) et additionne les remises ligne à ligne dans `Facture.Remise`.
- Apporte : règle lisible par le métier, dans le domaine, testable sans montage ; critère 5 = grille vide ; critère 4 satisfait par construction (calcul sur chaque ligne).
- Limites : ajoute 2 types et une opération `Montant` (pourcentage, soustraction éventuelle) ; changement de constructeur de `CalculDuPanier` (les tests actuels utilisent `new CalculDuPanier()` — `CalculDuPanierTests.cs:19,29,35` — donc un constructeur sans argument doit rester).
- Accord conventions : fort (record struct + fabrique `De`, `sealed`, domaine pur).
- Évolutivité : une grille par référence reste possible plus tard (`RemisePour` voit la référence de la ligne).

### B. Remise portée par `LigneDePanier`/`Panier` (paliers stockés dans le panier)
- Principe : `Panier` détient les paliers ; `LigneDePanier.Remise(paliers)`.
- Apporte : moins de nouveaux types.
- Limites : mélange configuration commerciale et contenu du panier ; `Panier` ne représente aujourd'hui que les lignes (`Panier.cs:3`). Les paliers ne dépendent pas du client.
- Accord conventions : moyen.

### C. Calcul directement dans `CalculDuPanier` (couche application)
- Principe : boucle sur `panier.Lignes` dans `Chiffrer`.
- Limites : place une règle commerciale hors du domaine, contre `adr-001:25-26`. **Écartée.**

### D. Paliers définis par référence (catalogue)
- Limites : non demandé par les critères, aucun catalogue n'existe (l'ADR le repousse à l'US-6, `adr-001:40-42`). **Écartée** pour cette story (sur-conception), sous réserve de la réponse métier.

## Recommandation

Approche A : `PalierDeQuantite` et `GrilleDeRemise` dans `Tarification.Domaine`, grille unique pour toutes les références, injectée par constructeur dans `CalculDuPanier` (constructeur sans argument conservé = grille vide), remise calculée ligne par ligne et sommée dans `Facture.Remise`. Tests d'acceptance via `CalculDuPanier.Chiffrer`, sans doublure.

## Passage de relais

### Existant réutilisable
- `Montant` → `src/Tarification.Domaine/Montant.cs`
- `Quantite` → `src/Tarification.Domaine/Quantite.cs`
- `LigneDePanier` → `src/Tarification.Domaine/LigneDePanier.cs`
- `Panier` → `src/Tarification.Domaine/Panier.cs`
- `Facture` → `src/Tarification.Application/CalculDuPanier.cs`
- `CalculDuPanier` → `src/Tarification.Application/CalculDuPanier.cs`
- `CalculDuPanierTests` → `tests/Tarification.Tests/CalculDuPanierTests.cs`

### Décisions à valider
- Paliers communs à toutes les références (hypothèse retenue, cohérente avec le critère 4) ou par référence ?
- `Facture.ATPayer` doit-il soustraire la remise ? Aujourd'hui non (`CalculDuPanier.cs:12`) ; les critères US-2 ne le précisent pas. Si oui, cela suppose une soustraction sur `Montant` (cas négatif exclu, `Montant.cs:13-14`).
- « Le plus avantageux » = pourcentage maximal parmi les paliers atteints (retenu) ; une grille incohérente doit-elle être refusée à la construction ?
- Forme du pourcentage (`decimal` en %, ex. 5, ou fraction 0,05) et bornes valides (0–100 ?).

### Questions ouvertes
- Deux lignes de même référence dans le panier s'additionnent-elles pour le palier ? Le critère 4 (« par ligne ») suggère que non ; à confirmer.
- Arrondi : renvoyé à l'US-5 ; aucune décision prise ici.
- Cumul avec le code promotionnel : renvoyé à l'US-3.
