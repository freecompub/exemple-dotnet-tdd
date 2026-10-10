# Recherche — US-2 : remise par palier de quantité

## Périmètre et critères de succès

Éclairer la phase de conception sur la manière dont la remise de quantité s'insère dans le modèle
existant et quelles règles les critères fixent déjà. Succès : garder le calcul par ligne, retenir au
plus un palier applicable (le plus avantageux), donner 0,00 € sous le seuil ou en l'absence de
paliers, et ne pas regrouper les quantités de références différentes (`stories/US-2.md:6-12`).

La question initialement ouverte dans la story (`stories/US-2.md:14`) a reçu une réponse dans la
passation utilisateur du 2026-10-10 : les paliers sont communs à toutes les références.

## Fichiers analysés

- `.skraft/us-2/research/` — vérifié pour réutiliser une recherche antérieure ; aucun document de
  recherche n'y était présent.
- `stories/US-2.md` — critères et question ouverte.
- `src/Tarification.Domaine/LigneDePanier.cs`, `Montant.cs`, `Quantite.cs`, `Panier.cs` — modèle du
  domaine et calculs actuellement disponibles.
- `src/Tarification.Application/CalculDuPanier.cs` — facture et cas d'usage de chiffrage.
- `tests/Tarification.Tests/CalculDuPanierTests.cs` — conventions des tests existants.
- `docs/adr/adr-001-decoupage-domaine-application.md` — frontière entre règles métier et cas
  d'usage.
- `stories/US-1.md`, `US-3.md`, `US-5.md` — exemple déjà livré et dépendances métier explicites.
- `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md`,
  `.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md`,
  `.agent-studio/workflows/skraft-workflow/skills/bdd-methodology/references/gherkin-patterns.md`
  et `anti-patterns.md` — repères de modélisation et de test.

## Recherches effectuées

- Vérification des fichiers existants sous `.skraft/us-2/research/` avant toute rédaction.
- Lecture du modèle de ligne, de quantité, de montant, de panier et du cas d'usage actuel.
- Vérification de la frontière domaine/application dans l'ADR accepté et les références tactiques.
- Comparaison des critères US-2 aux tests d'acceptance US-1 et aux questions ouvertes des US-3 et
  US-5.
- Aucune recherche externe : le dépôt contient le code, les décisions et les critères nécessaires
  pour instruire les options ; aucune source externe n'a été utilisée.

## Conventions du projet

- Le domaine porte les types-valeurs et règles commerciales sans dépendance ; l'application orchestre
  le cas d'usage et dépend du domaine (`docs/adr/adr-001-decoupage-domaine-application.md:15-25`).
- Les sommes sont représentées par `Montant` avec un `decimal`, et `Montant.Multiplie` refuse un
  facteur négatif (`src/Tarification.Domaine/Montant.cs:3-25`).
- `Quantite` est une valeur validée, d'au moins un article ; `LigneDePanier` associe référence,
  quantité et prix unitaire, et expose un sous-total (`src/Tarification.Domaine/Quantite.cs:3-14`;
  `src/Tarification.Domaine/LigneDePanier.cs:3-7`).
- Le panier conserve ses lignes et additionne les sous-totaux de ligne (`src/Tarification.Domaine/Panier.cs:3-17`).
- Le cas d'usage est exposé par `CalculDuPanier.Chiffrer`; ses tests utilisent les vrais objets du
  domaine et vérifient les résultats observables (`src/Tarification.Application/CalculDuPanier.cs:14-16`;
  `tests/Tarification.Tests/CalculDuPanierTests.cs:11-42`).
- L'ADR indique qu'une règle commerciale ne doit pas être déplacée dans l'application et qu'une
  dépendance extérieure serait passée à la règle plutôt qu'appelée directement (`docs/adr/adr-001-decoupage-domaine-application.md:27-38`).

## Découvertes

- La ligne connaît déjà la référence et la quantité, et calcule son sous-total ; le panier, lui,
  additionne les sous-totaux ligne par ligne (`src/Tarification.Domaine/LigneDePanier.cs:3-7`;
  `src/Tarification.Domaine/Panier.cs:3-17`).
- Les critères imposent explicitement qu'une ligne de 9 unités reste sans remise, qu'une ligne de
  10 unités déclenche 5 %, que parmi les seuils applicables on retienne le plus avantageux, et que
  deux références séparées ne soient jamais cumulées pour atteindre un seuil (`stories/US-2.md:8-12`).
- Dans les types de ligne et de panier examinés, aucune règle de palier n'est exposée ; le calcul de
  ligne disponible est le sous-total brut (`src/Tarification.Domaine/LigneDePanier.cs:3-7`;
  `src/Tarification.Domaine/Panier.cs:3-17`).
- `Facture` expose une propriété `Remise`, mais `ATPayer` additionne actuellement seulement
  `SommeDesArticles` et `FraisDePort` (`src/Tarification.Application/CalculDuPanier.cs:7-8`).
  Les critères US-2 vérifient la valeur de la remise, pas explicitement son effet sur `ATPayer`
  (`stories/US-2.md:8-12`).
- La story demandait si les paliers étaient communs ou spécifiques (`stories/US-2.md:14`) ; la
  réponse utilisateur du 2026-10-10 confirme qu'ils sont communs à toutes les références.
- US-3 laisse ouvert le cumul entre code promotionnel et remise US-2 (`stories/US-3.md:14-15`).
  US-5 prévoit un calcul de remise pouvant produire des fractions de centime et demande encore quelle
  règle générale d'arrondi retenir (`stories/US-5.md:8-13`).

## Approches évaluées

### 1. Appliquer une règle de palier à chaque ligne, avec les paliers communs

- **Principe :** chaque ligne est évaluée séparément à partir d'une même configuration de paliers ;
  le seuil le plus avantageux atteint par cette ligne détermine sa remise.
- **Apports :** correspond directement à l'évaluation par ligne et au choix du meilleur palier dans
  les critères US-2 (`stories/US-2.md:8-12`).
- **Limites :** la story ne précise pas le stockage ni la durée de vie de la configuration des paliers
  (`stories/US-2.md:6-14`).
- **Accord avec les conventions :** une règle portée par le domaine et appliquée à la ligne est
  compatible avec la frontière de l'ADR et avec la ligne qui détient déjà la référence, la quantité
  et le sous-total (`docs/adr/adr-001-decoupage-domaine-application.md:15-25`;
  `src/Tarification.Domaine/LigneDePanier.cs:3-7`).
- **Références :** `stories/US-2.md:8-14`; réponse utilisateur sur la portée commune des paliers
  (passation US-2, 2026-10-10); `src/Tarification.Domaine/LigneDePanier.cs:3-7`;
  `docs/adr/adr-001-decoupage-domaine-application.md:15-25`.

### 2. Appliquer à chaque ligne des paliers définis par référence

- **Principe :** choisir les paliers associés à la référence de la ligne, puis évaluer uniquement la
  quantité de cette ligne.
- **Apports :** permet des règles différenciées par référence sans agréger les quantités de lignes
  différentes ; la ligne possède déjà une référence (`src/Tarification.Domaine/LigneDePanier.cs:3-7`).
- **Limites :** l'utilisateur a répondu que les paliers sont communs à toutes les références ; cette
  approche contredit cette réponse et introduirait une configuration spécifique non demandée
  (réponse utilisateur sur la portée des paliers, passation US-2, 2026-10-10;
  `stories/US-2.md:14`).
- **Accord avec les conventions :** le calcul peut rester une règle de domaine, mais la convention
  du projet ne détermine pas la portée métier de sa configuration (`docs/adr/adr-001-decoupage-domaine-application.md:15-25`).
- **Références :** réponse utilisateur sur la portée commune des paliers (passation US-2,
  2026-10-10); `stories/US-2.md:14`; `src/Tarification.Domaine/LigneDePanier.cs:3-7`;
  `docs/adr/adr-001-decoupage-domaine-application.md:15-25`.

### 3. Agréger les quantités au niveau du panier avant d'appliquer le palier

- **Principe :** sommer les quantités du panier (ou de lignes de références différentes) puis calculer
  une remise au palier atteint.
- **Apports :** un calcul centralisé au panier pourrait traiter le panier comme une seule quantité.
- **Limites :** contredit directement le critère qui exclut le déclenchement par deux lignes de
  références différentes (`stories/US-2.md:11-12`).
- **Accord avec les conventions :** même si le panier possède la collection des lignes, cette option
  enfreint la règle métier explicitement formulée ; la commodité du point d'agrégation ne la rend pas
  acceptable (`src/Tarification.Domaine/Panier.cs:3-17`; `stories/US-2.md:11-12`).
- **Références :** `stories/US-2.md:11-12`; `src/Tarification.Domaine/Panier.cs:3-17`.

### 4. Implémenter la remise uniquement dans le cas d'usage applicatif

- **Principe :** calculer les seuils directement dans `CalculDuPanier.Chiffrer`, sans introduire de
  comportement métier dans le domaine.
- **Apports :** le cas d'usage est déjà le point d'entrée qui chiffre le panier
  (`src/Tarification.Application/CalculDuPanier.cs:14-16`).
- **Limites :** mettrait une règle commerciale dans la couche que l'ADR réserve à l'orchestration ; il
  serait en désaccord avec la décision acceptée (`docs/adr/adr-001-decoupage-domaine-application.md:15-25`).
- **Accord avec les conventions :** faible ; l'ADR indique explicitement que les règles commerciales
  appartiennent au domaine (`docs/adr/adr-001-decoupage-domaine-application.md:15-38`).
- **Références :** `src/Tarification.Application/CalculDuPanier.cs:14-16`;
  `docs/adr/adr-001-decoupage-domaine-application.md:15-38`.

## Recommandation

Recommander à la conception de modéliser des paliers communs à toutes les références, évalués
indépendamment sur chaque ligne, en retenant au plus un palier, le plus avantageux parmi ceux atteints
(`stories/US-2.md:8-12`; réponse utilisateur sur la portée commune des paliers, passation US-2,
2026-10-10). Cette recommandation éclaire le choix ; elle ne détermine ni le stockage ni le cycle de
vie de la configuration.

## Passage de relais

### Décisions à valider

- Effet de `Remise` sur le montant payable : `Facture.ATPayer` ne la déduit pas actuellement, et les
  critères US-2 ne précisent pas le montant final à payer (`src/Tarification.Application/CalculDuPanier.cs:7-8`;
  `stories/US-2.md:8-12`).

### Questions ouvertes

- La remise de quantité se cumule-t-elle avec un code promotionnel, ou le code l'emporte-t-il ? US-3
  pose explicitement cette question (`stories/US-3.md:14-15`).
- Quelle règle d'arrondi appliquer aux remises US-2 ? US-5 fixe un exemple d'arrondi d'une remise et
  laisse ouverte la règle générale (`stories/US-5.md:8-13`).
