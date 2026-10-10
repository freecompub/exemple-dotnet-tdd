# Recherche — US-2 : remise par palier de quantité

## Périmètre et critères de succès

Éclairer le choix de conception du calcul de remise par ligne, sans choisir une architecture ni écrire d'ADR. La règle demandée sélectionne un seul palier éligible, le plus avantageux ; elle ne porte pas sur la quantité totale du panier (`stories/US-2.md:6-11`).

Les paliers sont **communs à toutes les références**, selon la réponse métier consignée dans `.skraft/us-2/research/clarifications.md:3-6`. La question de `stories/US-2.md:13-14` est donc résolue, et non remplacée par une hypothèse.

| Critère | Résultat à vérifier | Source |
| --- | --- | --- |
| AC-1 | 9 × 2,00 €, seuil 10 à 5 % : remise 0,00 € | `stories/US-2.md:7` |
| AC-2 | 10 × 2,00 €, seuil 10 à 5 % : remise 1,00 € | `stories/US-2.md:8` |
| AC-3 | 50 × 2,00 €, seuils 10 à 5 % et 50 à 12 % : remise 12,00 €, sans cumul | `stories/US-2.md:9` |
| AC-4 | Deux lignes de références différentes à 6 unités : aucun déclenchement du seuil 10 | `stories/US-2.md:10` |
| AC-5 | Configuration sans palier : remise 0,00 € | `stories/US-2.md:11` |

La compatibilité à préserver concerne aussi la somme brute des articles et le panier vide de l'US-1 (`stories/US-1.md:6-9` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:16-37`).

## Fichiers analysés

| Fichier | Passages examinés |
| --- | --- |
| `stories/US-2.md` | Règles et question ouverte, lignes 1-14 |
| `.skraft/us-2/research/clarifications.md` | Réponse métier, lignes 3-8 |
| `src/Tarification.Domaine/LigneDePanier.cs` | Données de ligne et sous-total, lignes 1-7 |
| `src/Tarification.Domaine/Panier.cs` | Ajout des lignes et agrégation, lignes 1-17 |
| `src/Tarification.Domaine/Montant.cs` | Type monétaire, opérations et affichage, lignes 1-26 |
| `src/Tarification.Domaine/Quantite.cs` | Type quantité et validation, lignes 1-15 |
| `src/Tarification.Application/CalculDuPanier.cs` | Facture et cas d'usage, lignes 1-22 |
| `tests/Tarification.Tests/CalculDuPanierTests.cs` | Construction, assertions et invariants, lignes 1-50 |
| `docs/adr/adr-001-decoupage-domaine-application.md` | Frontières et conventions monétaires, lignes 7-40 |
| `src/Tarification.Domaine/Tarification.Domaine.csproj` | Absence de dépendance, lignes 1-4 |
| `src/Tarification.Application/Tarification.Application.csproj` | Référence au domaine, lignes 1-5 |
| `tests/Tarification.Tests/Tarification.Tests.csproj` | Dépendances de test et références, lignes 1-25 |
| `Directory.Build.props` | Compilation et types nullables, lignes 1-10 |
| `global.json` | SDK demandé, lignes 1-6 |
| `.agent-studio/stack.yaml` | Rapports, couverture et emplacements, lignes 5-34 |
| `.skraft/quality.json` | Seuils et dépendances interdites, lignes 1-26 |
| `README.md` | Inventaire et prérequis, lignes 12-50 |
| `stories/US-1.md` | Comportement de référence, lignes 6-13 |
| `stories/US-3.md` | Cumul promotionnel laissé ouvert, lignes 6-15 |
| `stories/US-4.md` | Seuil après remise, lignes 6-10 |
| `stories/US-5.md` | Arrondis et question ouverte, lignes 6-13 |
| `stories/US-6.md` | Catalogue et stock, lignes 6-14 |
| `docs/adr/adr-002-format-de-rapport-de-tests.md` | Format de rapport, lignes 7-27 |

## Recherches effectuées

- Lecture du chemin de calcul : sous-total de ligne → agrégation du panier → facture. Références : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Domaine/Panier.cs:10-16`, `src/Tarification.Application/CalculDuPanier.cs:10-22`.
- Recherche des opérations monétaires et des validations réutilisables : création, zéro, addition, multiplication entière, comparaison ; quantité positive. Références : `src/Tarification.Domaine/Montant.cs:7-25`, `src/Tarification.Domaine/Quantite.cs:4-14`.
- Lecture des contraintes de placement des règles et de dépendance. Références : `docs/adr/adr-001-decoupage-domaine-application.md:13-33`, `.skraft/quality.json:7-24`.
- Lecture des tests de référence et du profil de validation. Références : `tests/Tarification.Tests/CalculDuPanierTests.cs:13-50`, `.agent-studio/stack.yaml:14-31`.
- Lecture des stories voisines pour délimiter les interactions, sans résoudre leurs questions métier. Références : `stories/US-3.md:13-15`, `stories/US-4.md:10`, `stories/US-5.md:6-13`, `stories/US-6.md:6-14`.

Enquête limitée à la lecture locale ; aucune recherche externe ni exécution de commande effectuée pendant cette phase.

## Conventions du projet

- Les règles commerciales appartiennent au domaine ; l'application expose les cas d'usage pilotés par les tests d'acceptance. Le domaine ne doit appeler ni infrastructure ni paquet tiers (`docs/adr/adr-001-decoupage-domaine-application.md:15-21`). Les projets matérialisent cette direction (`src/Tarification.Domaine/Tarification.Domaine.csproj:1-4` ; `src/Tarification.Application/Tarification.Application.csproj:1-5`).
- Les montants utilisent `decimal`, pas `double` (`docs/adr/adr-001-decoupage-domaine-application.md:32-33` ; `src/Tarification.Domaine/Montant.cs:9-14`).
- Les types-valeurs sont des `readonly record struct`, avec création par `De` et rejet explicite des valeurs négatives ou des quantités inférieures à un (`src/Tarification.Domaine/Montant.cs:7-14` ; `src/Tarification.Domaine/Quantite.cs:4-12`). Ces validations existantes ne définissent pas à elles seules les bornes d'un futur taux.
- Les noms métier sont en français, les espaces de noms sont déclarés au niveau fichier, et les exemples de tests utilisent xUnit, `[Fact]`, des littéraux `decimal` et des assertions sur `Montant` (`src/Tarification.Domaine/LigneDePanier.cs:1-6` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:1-36`).
- La cible est `net10.0`, les types nullables sont activés et les avertissements sont traités comme des erreurs (`Directory.Build.props:3-8`). Le profil prévoit JUnit XML et Cobertura ; les seuils déclarés sont 90 pour `core` et 70 pour `edge` (`.agent-studio/stack.yaml:14-26` ; `.skraft/quality.json:3-6`).

## Découvertes

1. Une ligne contient déjà les trois données utiles au calcul : référence, quantité, prix unitaire ; son sous-total est le prix multiplié par la quantité (`src/Tarification.Domaine/LigneDePanier.cs:4-6`). Le calcul de remise peut donc être évalué à partir d'une ligne sans recomposer sa base monétaire.
2. `Panier.Ajoute` conserve chaque ligne ajoutée et ne fusionne pas les références ; `SommeDesLignes` additionne les sous-totaux en partant de zéro (`src/Tarification.Domaine/Panier.cs:6-16`). Agréger les quantités avant la sélection d'un palier ne correspondrait pas au calcul « par ligne » exigé (`stories/US-2.md:10`).
3. Le cas d'usage ne reçoit actuellement qu'un panier et retourne une remise nulle. Aucun paramètre de configuration des paliers n'est présent dans cette signature (`src/Tarification.Application/CalculDuPanier.cs:20-22`). Une surface de transmission des paliers reste donc à concevoir, avec le périmètre commun clarifié (`.skraft/us-2/research/clarifications.md:5-6`).
4. `Facture` expose déjà `Remise`, mais `ATPayer` n'en tient pas compte : il additionne seulement articles et port (`src/Tarification.Application/CalculDuPanier.cs:10-13`). Renseigner `Remise` ne suffira pas à modifier ce total. L'US-4 attend un seuil évalué après remises, et l'US-3 illustre un total ramené à zéro par une remise de 100 % (`stories/US-4.md:10` ; `stories/US-3.md:11`).
5. `Montant` fournit l'addition, la multiplication par un entier et la comparaison, mais pas une multiplication par taux ni une soustraction (`src/Tarification.Domaine/Montant.cs:13-25`). L'affichage à deux décimales est dans `ToString`, tandis que la création conserve le `decimal` fourni (`src/Tarification.Domaine/Montant.cs:11-14,25`). Il ne faut pas confondre cet affichage avec une règle d'arrondi de calcul.
6. Le critère 3 exige le palier le plus avantageux, pas simplement celui du plus grand seuil. Les exemples fournis donnent 5 % puis 12 %, mais ne spécifient pas que tous les taux configurés doivent croître avec les seuils (`stories/US-2.md:7-11`). Une sélection par avantage parmi les paliers éligibles satisfait ce texte sans ajouter une contrainte de monotonie.
7. Les tests existants vérifient les totaux bruts, le panier vide et deux invariants de types-valeurs ; ils ne vérifient ni `Remise` ni `ATPayer` (`tests/Tarification.Tests/CalculDuPanierTests.cs:16-50`). Les cinq critères de l'US-2 doivent donc recevoir leur propre couverture (`stories/US-2.md:7-11`).
8. Le cumul avec un code promotionnel est explicitement ouvert dans l'US-3 ; l'arrondi est traité par l'US-5, qui comporte sa propre question métier (`stories/US-3.md:13-15` ; `stories/US-5.md:6-13`). Ces politiques ne peuvent pas être déduites des résultats entiers au centime de l'US-2 (`stories/US-2.md:7-11`).

## Approches évaluées

### A — Politique de paliers commune, évaluée dans le domaine pour chaque ligne

**Principe proposé :** représenter les paliers comme données de domaine et évaluer, pour chaque ligne, les paliers dont le seuil est atteint ; retenir l'avantage maximal, puis additionner les remises des lignes. Transmettre la configuration au calcul plutôt que la rechercher dans une infrastructure.

**Apport :** rend explicites la configuration commune, la sélection sans cumul et la séparation entre remise de ligne et somme brute ; permet de vérifier la règle avec les données déjà présentes sur la ligne (`.skraft/us-2/research/clarifications.md:5-6` ; `stories/US-2.md:7-11` ; `src/Tarification.Domaine/LigneDePanier.cs:4-6`).

**Limites :** les types de palier, l'entrée de configuration et les opérations monétaires requises ne sont pas encore définis ; leur API reste à concevoir (`src/Tarification.Application/CalculDuPanier.cs:20-22` ; `src/Tarification.Domaine/Montant.cs:13-25`). Cette approche ne tranche ni l'arrondi ni le cumul promotionnel (`stories/US-5.md:6-13` ; `stories/US-3.md:13-15`).

**Accord avec les conventions :** favorable si la règle reste dans le domaine et l'application ne fait qu'orchestrer. L'ADR demande de transmettre les besoins extérieurs aux règles plutôt que de les appeler directement (`docs/adr/adr-001-decoupage-domaine-application.md:17-30`).

**Évaluation :** approche recommandée pour la conception, sans imposer un nom de classe, une interface ou une signature.

### B — Porter la configuration et le calcul directement sur chaque ligne

**Principe proposé :** enrichir `LigneDePanier` avec les paliers et une remise calculée, puis agréger ces remises dans `Panier`.

**Apport :** garde sous-total et remise à proximité des données de la ligne ; exploite le modèle de record déjà présent (`src/Tarification.Domaine/LigneDePanier.cs:3-6` ; `src/Tarification.Domaine/Panier.cs:16`).

**Limites :** attacher une configuration à chaque ligne autoriserait des configurations différentes alors que le métier a choisi des paliers communs ; il faudrait garantir cette cohérence lors de la construction. L'enrichissement toucherait aussi le constructeur utilisé par les tests existants (`.skraft/us-2/research/clarifications.md:5-6` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:13-14`).

**Accord avec les conventions :** placement métier compatible avec l'ADR, qui cite explicitement `LigneDePanier` parmi les règles du domaine (`docs/adr/adr-001-decoupage-domaine-application.md:17-18`).

**Motif de rejet au profit de A :** pour une configuration commune, attacher les paliers à chaque ligne ajoute un problème de cohérence sans exigence correspondante dans les critères (`.skraft/us-2/research/clarifications.md:5-6` ; `stories/US-2.md:7-11`). Une méthode de ligne recevant une politique commune reste une variante possible de A, à décider en conception.

### C — Calculer les paliers directement dans `CalculDuPanier`

**Principe proposé :** ajouter la configuration au cas d'usage et y effectuer sélection et calcul, avant de construire la facture.

**Apport :** le point de construction de la facture dispose déjà du panier et du champ `Remise`, et les tests le pilotent directement (`src/Tarification.Application/CalculDuPanier.cs:10-22` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:16-36`).

**Limites :** déplacerait une règle commerciale dans l'application, contrairement à la frontière déclarée (`docs/adr/adr-001-decoupage-domaine-application.md:17-26`).

**Accord avec les conventions :** défavorable pour la sélection et le calcul ; favorable seulement pour transmettre les données et appeler une règle du domaine (`docs/adr/adr-001-decoupage-domaine-application.md:20-21`).

**Motif de rejet :** contradiction avec l'emplacement imposé aux règles métier par l'ADR-001 (`docs/adr/adr-001-decoupage-domaine-application.md:24-26`).

## Recommandation

**Soumettre l'approche A à la conception : une politique commune de paliers, évaluée dans le domaine indépendamment pour chaque ligne, avec sélection du palier éligible le plus avantageux et agrégation des remises.** Elle s'appuie sur la réponse métier, les critères de non-cumul et de calcul par ligne, et la frontière existante entre domaine et application (`.skraft/us-2/research/clarifications.md:5-6` ; `stories/US-2.md:9-11` ; `docs/adr/adr-001-decoupage-domaine-application.md:17-21`). Cette recommandation n'est pas une décision d'architecture ; les emplacements précis, signatures et types restent à valider.

## Passage de relais

**Décisions de conception à valider :**

- Choisir la représentation du palier et de son taux ainsi que le point de transmission de la configuration commune ; préserver l'usage sans palier et la construction existante des lignes (`.skraft/us-2/research/clarifications.md:5-6` ; `stories/US-2.md:11` ; `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:13-14`).
- Définir les opérations monétaires nécessaires au pourcentage et au montant net, sans remplacer `decimal` par `double` (`src/Tarification.Domaine/Montant.cs:13-25` ; `docs/adr/adr-001-decoupage-domaine-application.md:32-33`).
- Valider le contrat de `SommeDesArticles`, `Remise` et `ATPayer` avant leur raccordement : les tests de l'US-1 fixent la somme brute, le total actuel ignore la remise, et les stories suivantes attendent des montants après remises (`tests/Tarification.Tests/CalculDuPanierTests.cs:16-37` ; `src/Tarification.Application/CalculDuPanier.cs:10-13` ; `stories/US-3.md:11` ; `stories/US-4.md:10`).
- Prévoir les cinq tests d'acceptation, les régressions de l'US-1 et un test discriminant pour des paliers présentés dans un ordre différent ou des taux non croissants : ce dernier vérifierait « plus avantageux », pas « dernier palier » (`stories/US-2.md:7-11` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:16-37`).

**Questions métier à ne pas résoudre implicitement :**

- Les critères décrivent les configurations 10/5 % et 50/12 %, ainsi que leur absence, mais ne donnent pas de contrat pour un seuil ou un taux invalide. Si la conception expose ces entrées, faire préciser leurs bornes et le comportement de rejet ; ne pas transformer les invariants de `Quantite` et `Montant` en règle de taux (`stories/US-2.md:7-11` ; `src/Tarification.Domaine/Quantite.cs:11-12` ; `src/Tarification.Domaine/Montant.cs:13-14`).
- Ne pas fixer ici le cumul promotionnel ni la politique d'arrondi : ces sujets sont explicitement portés par les stories ultérieures (`stories/US-3.md:13-15` ; `stories/US-5.md:6-13`).

La portée commune des paliers est validée par le métier ; elle n'est plus une question ouverte (`.skraft/us-2/research/clarifications.md:5-8`).
