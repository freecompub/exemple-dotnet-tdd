# Recherche — US-2, remise par palier de quantité

## Périmètre et critères de succès

Étudier l’application des remises à partir des cinq critères de `stories/US-2.md:6-11`, en tenant compte des règles métier précisées pendant la recherche : les paliers sont communs à toutes les références et le montant de remise suit l’arrondi au centime supérieur à partir d’un demi-centime décrit dans `stories/US-5.md:7-9`. La recherche éclaire la conception sans fixer de structure de code ni rédiger d’ADR.

La solution à concevoir devra distinguer les quantités sous le seuil et au seuil, choisir un seul palier lorsque plusieurs sont atteints, calculer selon chaque ligne plutôt que le volume total du panier, et donner zéro si aucun palier n’est configuré (`stories/US-2.md:7-11`). Les critères chiffrés 9 × 2,00 € → 0,00 €, 10 × 2,00 € → 1,00 € et 50 × 2,00 € → 12,00 € constituent les exemples de référence (`stories/US-2.md:7-9`).

## Fichiers analysés

- `stories/US-2.md:1-14` — story, critères et question initiale sur la portée des paliers.
- `stories/US-1.md:1-10` — story déjà livrée et référence de comportement pour le panier.
- `stories/US-3.md:1-15` — règle de cumul des remises laissée ouverte pour la story code promotionnel.
- `stories/US-5.md:1-13` — règle d’arrondi et question sur l’arrondi.
- `src/Tarification.Domaine/LigneDePanier.cs:1-7`, `src/Tarification.Domaine/Panier.cs:1-17`, `src/Tarification.Domaine/Montant.cs:1-26`, `src/Tarification.Domaine/Quantite.cs:1-14` — modèle métier existant.
- `src/Tarification.Application/CalculDuPanier.cs:1-22` — facture et point d’entrée du calcul.
- `tests/Tarification.Tests/CalculDuPanierTests.cs:1-50` — tests et conventions de construction des données.
- `docs/adr/adr-001-decoupage-domaine-application.md:1-42` — frontières de couches et règles de dépendance.
- `.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:1-70`, `.agent-studio/workflows/skraft-workflow/skills/bdd-methodology/references/gherkin-patterns.md:18-35`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:76-96, 177-230` et `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/pattern-catalog.md:141-164` — principes de test, objets-valeurs, services de domaine et usage raisonné de CQRS.

## Recherches effectuées

- Parcours du dossier `.skraft/us-2/` avant rédaction afin de réutiliser les recherches antérieures si présentes ; aucun document de recherche antérieur n’a été fourni dans ce dossier.
- Lecture du domaine, du cas d’usage, des tests existants, des stories adjacentes et de l’ADR de découpage.
- Recherche des calculs existants de quantité, de sous-total, de remise, de taux et d’arrondi dans `src/`, `tests/` et `stories/`.
- Lecture des références de stratégie de test sociable, des patrons tactiques DDD et des règles de scénarios Gherkin pertinentes.
- Demande de clarification sur la portée des paliers, puis sur l’arrondi, avant de formuler une recommandation.

## Conventions du projet

- Le code métier et les noms de types/membres observés sont en français, en PascalCase pour les types et membres publics ; les espaces de noms reflètent les projets `Tarification.Domaine` et `Tarification.Application` (`src/Tarification.Domaine/LigneDePanier.cs:1-6`, `src/Tarification.Application/CalculDuPanier.cs:1-21`).
- Le domaine porte les règles commerciales et les types-valeurs ; l’application dépend du domaine et expose le cas d’usage testé par les tests d’acceptance (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`).
- Les montants sont représentés par `decimal` dans `Montant` ; l’ADR exclut explicitement `double` pour les calculs de prix (`src/Tarification.Domaine/Montant.cs:7-20`, `docs/adr/adr-001-decoupage-domaine-application.md:32-33`).
- Les types-valeurs existants sont des `readonly record struct` validés par des fabriques statiques `De`; leurs constructeurs sont privés (`src/Tarification.Domaine/Montant.cs:7-14`, `src/Tarification.Domaine/Quantite.cs:4-11`).
- Les tests existants sont des tests xUnit `[Fact]`, portent des noms métier en français, repèrent les critères par des commentaires `@ac-*`, et construisent les vrais objets domaine via une petite fabrique locale `Ligne` (`tests/Tarification.Tests/CalculDuPanierTests.cs:1-21,24-35`).
- Les tests observés utilisent des objets réels instanciés directement et n’introduisent pas de doublures dans cette suite (`tests/Tarification.Tests/CalculDuPanierTests.cs:11-49`). La stratégie de test recommande des objets domaine réels et réserve les doublures aux dépendances externes (`.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:12-21,38-55`).
- Les méthodes du domaine expriment une intention métier (`Ajoute`, `SommeDesLignes`, `Multiplie`) plutôt que des opérations de persistance (`src/Tarification.Domaine/Panier.cs:10-16`, `src/Tarification.Domaine/Montant.cs:18-23`).

## Découvertes

- Une ligne associe déjà une référence, une `Quantite` et un `PrixUnitaire`; son `SousTotal` est le prix unitaire multiplié par la quantité (`src/Tarification.Domaine/LigneDePanier.cs:3-6`).
- `Panier` conserve une collection de lignes et additionne leurs sous-totaux, mais n’expose actuellement aucun calcul de remise (`src/Tarification.Domaine/Panier.cs:4-16`).
- `Facture` possède déjà une propriété `Remise`, mais le cas d’usage la fixe à zéro ; son `ATPayer` additionne actuellement la somme des articles et les frais de port sans soustraire cette remise (`src/Tarification.Application/CalculDuPanier.cs:5-12,19-21`).
- La quantité valide commence à 1 ; le montant existant est une valeur non négative en euros et fournit addition, multiplication par entier et comparaison (`src/Tarification.Domaine/Quantite.cs:3-11`, `src/Tarification.Domaine/Montant.cs:3-23`).
- Le critère de sélection est un palier au seuil atteint ou dépassé, et un seul palier — le plus avantageux — s’applique (`stories/US-2.md:7-9`). La portée commune à toutes les références a été confirmée par l’utilisateur en réponse à la question de `stories/US-2.md:13-14`.
- Le calcul se fait par ligne ; deux lignes de références différentes ne doivent pas additionner leurs quantités pour déclencher un palier (`stories/US-2.md:10`). La remise attendue sans aucun palier est zéro (`stories/US-2.md:11`).
- La règle d’arrondi explicitement retenue pour cette story est celle du critère 2 d’US-5 : à partir d’un demi-centime, arrondir au centime supérieur ; ce critère donne 1,67 € pour 5 % de 33,33 € (`stories/US-5.md:7-9`). La réponse de l’utilisateur confirme l’application de ce critère à US-2.
- Le critère d’US-5 précise de ne pas enchaîner des valeurs intermédiaires arrondies (`stories/US-5.md:9`). Dans US-2, seule une remise globale est actuellement exposée par `Facture`, sans détail par ligne (`src/Tarification.Application/CalculDuPanier.cs:10-12`) ; le choix de l’endroit exact où matérialiser l’arrondi des remises par ligne reste donc à confirmer en conception.
- Le cumul entre remise par palier et code promotionnel reste une question ouverte de la story US-3 et ne doit pas être déduit des critères d’US-2 (`stories/US-3.md:13-15`).
- Les validations des paliers eux-mêmes (par exemple seuils ou pourcentages invalides), leur mode de configuration et la présentation éventuelle des remises ligne par ligne ne sont pas spécifiés par les critères d’US-2 (`stories/US-2.md:6-14`).

## Approches évaluées

### A. Sélectionner un seul palier applicable par ligne, puis agréger les remises

- **Principe :** évaluer les paliers communs contre la quantité de chaque ligne, retenir le palier applicable le plus avantageux, calculer sa remise sur le sous-total de cette ligne, puis agréger les montants de remise.
- **Apports :** respecte explicitement les critères de seuil, de palier le plus avantageux, de calcul par ligne et d’absence de palier (`stories/US-2.md:7-11`). S’appuie sur la ligne et son sous-total déjà modélisés (`src/Tarification.Domaine/LigneDePanier.cs:3-6`).
- **Limites :** la représentation et la validation des paliers ne sont pas encore définies ; le détail par ligne n’est pas exposé par la facture existante (`src/Tarification.Application/CalculDuPanier.cs:10-12`, `stories/US-2.md:6-14`). L’arrondi intermédiaire ou final des remises agrégées doit rester cohérent avec la règle de non-enchaînement (`stories/US-5.md:8-9`).
- **Accord avec les conventions :** cohérent avec le placement des règles commerciales dans le domaine, l’emploi de `Montant` et `Quantite`, et le point d’entrée applicatif déjà piloté par les tests (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`, `src/Tarification.Domaine/Montant.cs:7-20`, `src/Tarification.Domaine/Quantite.cs:4-11`, `src/Tarification.Application/CalculDuPanier.cs:15-21`).
- **Références exactes :** `stories/US-2.md:7-11`; `src/Tarification.Domaine/LigneDePanier.cs:3-6`; `src/Tarification.Application/CalculDuPanier.cs:10-21`; `stories/US-5.md:8-9`.

### B. Additionner les quantités du panier avant de sélectionner un palier

- **Principe :** additionner les quantités de toutes les lignes, puis appliquer un palier au total du panier.
- **Apports :** centralise le calcul sur un total de quantités.
- **Limites :** contredit le critère explicite qui interdit d’atteindre le seuil en cumulant deux références différentes de six articles (`stories/US-2.md:10`).
- **Accord avec les conventions :** le panier sait agréger ses lignes (`src/Tarification.Domaine/Panier.cs:6-16`), mais détourner cette agrégation pour décider de l’éligibilité commerciale contredit la granularité demandée par la story (`stories/US-2.md:10`).
- **Références exactes :** `stories/US-2.md:10`; `src/Tarification.Domaine/Panier.cs:6-16`.

### C. Configurer un ensemble de paliers distinct pour chaque référence

- **Principe :** associer une configuration de paliers à chaque référence et consulter celle de la ligne.
- **Apports :** permettrait de différencier les offres par article.
- **Limites :** la portée métier a été tranchée par l’utilisateur en faveur de paliers communs à toutes les références ; une configuration par référence dépasse donc la règle confirmée.
- **Accord avec les conventions :** le modèle de ligne contient une référence, mais aucun catalogue ou configurateur de paliers par article n’existe dans les fichiers analysés (`src/Tarification.Domaine/LigneDePanier.cs:3-6`, `docs/adr/adr-001-decoupage-domaine-application.md:17-21`).
- **Références exactes :** `stories/US-2.md:13-14`; décision utilisateur « Paliers communs à toutes les références »; `src/Tarification.Domaine/LigneDePanier.cs:3-6`.

## Recommandation

Retenir le comportement de l’approche A comme base de conception : sélectionner, pour chaque ligne prise indépendamment, le palier commun applicable offrant le taux de remise le plus élevé, appliquer ce seul taux au sous-total de cette ligne, puis produire la remise de facture ; avec une configuration vide, la remise vaut zéro (`stories/US-2.md:7-11`). Pour les fractions de centime, suivre la règle confirmée d’US-5 — arrondi supérieur à partir d’un demi-centime — sans arrondir des résultats intermédiaires enchaînés (`stories/US-5.md:8-9`). La conception doit préciser où l’arrondi intervient lors de l’agrégation et ne pas présumer de la règle de cumul avec US-3 (`src/Tarification.Application/CalculDuPanier.cs:10-12`, `stories/US-3.md:13-15`).

## Passage de relais

### Existant réutilisable

`LigneDePanier` → `src/Tarification.Domaine/LigneDePanier.cs`

`Panier` → `src/Tarification.Domaine/Panier.cs`

`Quantite` → `src/Tarification.Domaine/Quantite.cs`

`Montant` → `src/Tarification.Domaine/Montant.cs`

`Facture` → `src/Tarification.Application/CalculDuPanier.cs`

`CalculDuPanier` → `src/Tarification.Application/CalculDuPanier.cs`

`CalculDuPanierTests` → `tests/Tarification.Tests/CalculDuPanierTests.cs`

### Décisions à valider

- Définir la représentation et les invariants de configuration des paliers ; les critères ne donnent pas de règle de rejet pour des valeurs invalides (`stories/US-2.md:6-14`).
- Préciser si le détail des remises par ligne doit être rendu, ou si seule la propriété `Facture.Remise` suffit ; le modèle actuel n’expose qu’un montant global (`src/Tarification.Application/CalculDuPanier.cs:10-12`).
- Choisir le point d’arrondi cohérent avec la règle de l’US-5 lorsque les remises calculées ligne par ligne sont agrégées ; ne pas arrondir des intermédiaires en chaîne (`stories/US-5.md:8-9`).
- Laisser à la décision métier explicitement ouverte par US-3 le cumul avec les codes promotionnels (`stories/US-3.md:13-15`).

### Questions ouvertes

- Aucun complément n’est nécessaire sur la portée des paliers ni sur la règle d’arrondi retenue : elles ont été clarifiées par l’utilisateur. Les autres questions ci-dessus restent hors des critères spécifiés d’US-2.
