# Recherche — US-2 : remise par palier de quantité

## Périmètre et critères de succès

### Sources métier

La story de référence est `stories/US-2.md:1-14`.

**Clarification utilisateur reçue le 16 octobre 2026, transcrite comme source primaire :**

> Les mêmes paliers s’appliquent à toutes les références, avec un calcul indépendant par ligne.

Cette réponse clôt la question de portée des paliers laissée ouverte dans `stories/US-2.md:13-14` ; elle est conservée ici pour les phases suivantes (`.skraft/us-2/research/research.md:9-11`).

### Résultats attendus

| Critère | Configuration et entrée | Remise attendue | Source |
| --- | --- | --- | --- |
| ac-1 | Seuil 10, taux 5 % ; ligne de 9 × 2,00 € | 0,00 € | `stories/US-2.md:7` |
| ac-2 | Seuil 10, taux 5 % ; ligne de 10 × 2,00 € | 1,00 € | `stories/US-2.md:8` |
| ac-3 | Seuils 10 à 5 % et 50 à 12 % ; ligne de 50 × 2,00 € | 12,00 €, un seul palier, le plus avantageux | `stories/US-2.md:9` |
| ac-4 | Deux références différentes, chacune sur une ligne de 6 articles ; seuil 10 | Aucune ligne ne déclenche le seuil | `stories/US-2.md:10` |
| ac-5 | Aucun palier configuré | 0,00 € | `stories/US-2.md:11` |

Le périmètre étudié est un barème commun évalué séparément sur chaque ligne, sans mutualisation des quantités entre références (`.skraft/us-2/research/research.md:9-11` ; `stories/US-2.md:10`).

Les codes promotionnels, les frais de port, les règles d’arrondi et le stock relèvent respectivement de `stories/US-3.md:1-15`, `stories/US-4.md:1-13`, `stories/US-5.md:1-13` et `stories/US-6.md:1-14`. Cette recherche ne tranche ni leur cumul ni leur ordre d’application ; le cumul promotion/palier est explicitement une question de l’US-3 (`stories/US-3.md:14`).

## Fichiers analysés

| Fichiers | Éléments examinés |
| --- | --- |
| `src/Tarification.Domaine/LigneDePanier.cs:1-7` | Référence, quantité, prix unitaire et sous-total brut |
| `src/Tarification.Domaine/Panier.cs:1-17` | Collection des lignes, ajout et somme des sous-totaux |
| `src/Tarification.Domaine/Montant.cs:1-26` | Type-valeur monétaire, opérations et validation |
| `src/Tarification.Domaine/Quantite.cs:1-14` | Type-valeur de quantité et validation |
| `src/Tarification.Application/CalculDuPanier.cs:1-22` | Point d’entrée et résultat `Facture` |
| `tests/Tarification.Tests/CalculDuPanierTests.cs:1-50` | Construction des données, tests d’acceptance et tests de garde |
| `docs/adr/adr-001-decoupage-domaine-application.md:1-42` | Frontière des couches, types-valeurs, calcul monétaire |
| `docs/adr/adr-002-format-de-rapport-de-tests.md:1-36` | Contexte documentaire du rapport de tests, sans recherche de commande |
| `src/Tarification.Domaine/Tarification.Domaine.csproj:1-4` ; `src/Tarification.Application/Tarification.Application.csproj:1-5` | Dépendances réellement déclarées |
| `tests/Tarification.Tests/Tarification.Tests.csproj:1-24` ; `Directory.Build.props:1-10` | Framework de tests, références et conventions de compilation |
| `stories/US-1.md:1-13` ; `stories/US-2.md:1-14` | Comportement livré et besoin étudié |
| `stories/US-3.md:1-15` ; `stories/US-4.md:1-13` ; `stories/US-5.md:1-13` ; `stories/US-6.md:1-14` | Frontières avec les stories suivantes |
| `README.md:12-28` | Organisation annoncée des sources et des tests |
| `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:11-34,72-94,173-193` | Agrégats, objets-valeurs et conditions d’extraction d’un service de domaine |
| `.agent-studio/workflows/skraft-workflow/skills/clean-architecture-dotnet/references/ddd.md:1-11,113-167` | Caractère optionnel des patrons DDD et objets-valeurs |
| `.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:1-61` | Tests sociables et interdiction de doubler le domaine |
| `.agent-studio/workflows/skraft-workflow/skills/clean-architecture-testing/references/doubles-decision-tree.md:5-24,65-99` | Choix des doublures et conditions de tests de domaine |
| `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/pattern-catalog.md:9-15,133-150` | Intention de séparation des couches et limites de pertinence de CQRS |

## Recherches effectuées

- Lecture du modèle de ligne, du panier puis du chiffrage : le chemin existant mène de `LigneDePanier.SousTotal` à `Panier.SommeDesLignes()`, puis à `CalculDuPanier.Chiffrer()` (`src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Domaine/Panier.cs:16` ; `src/Tarification.Application/CalculDuPanier.cs:19-22`).
- Comparaison entre la story et la surface de résultat : `Facture` possède déjà un champ `Remise`, alimenté à zéro ; son total à payer ne le soustrait pas (`stories/US-2.md:7-11` ; `src/Tarification.Application/CalculDuPanier.cs:10-12,21`).
- Lecture des tests livrés pour relever les conventions concrètes, plutôt que substituer les exemples génériques des skills au projet (`tests/Tarification.Tests/CalculDuPanierTests.cs:1-50`).
- Lecture de l’ADR de découpage et des références DDD pour comparer emplacement local de la règle et objet de calcul dédié (`docs/adr/adr-001-decoupage-domaine-application.md:14-33` ; `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:173-193`).
- Clarification de la portée du barème auprès de l’utilisateur, sans déduire cette portée de la présence de `Reference` sur la ligne (`stories/US-2.md:13-14` ; `.skraft/us-2/research/research.md:9-11` ; `src/Tarification.Domaine/LigneDePanier.cs:4`).

## Conventions du projet

- **Langage et nommage :** vocabulaire métier français dans les types et opérations (`LigneDePanier`, `SommeDesLignes`, `Chiffrer`), namespaces `Tarification.Domaine` et `Tarification.Application`, un fichier par concept de domaine ; `Facture` partage actuellement le fichier du cas d’usage (`src/Tarification.Domaine/LigneDePanier.cs:1-7` ; `src/Tarification.Domaine/Panier.cs:1-17` ; `src/Tarification.Application/CalculDuPanier.cs:1-22`).
- **Organisation :** deux projets de production ; règles commerciales dans le domaine, orchestration dans l’application. Le domaine ne référence aucun autre projet ou paquet et l’application référence seulement le domaine (`docs/adr/adr-001-decoupage-domaine-application.md:14-21` ; `src/Tarification.Domaine/Tarification.Domaine.csproj:1-4` ; `src/Tarification.Application/Tarification.Application.csproj:1-5`).
- **Objets-valeurs :** `readonly record struct`, constructeur privé, fabrique nommée `De`, propriétés en lecture seule et `ArgumentOutOfRangeException` pour les valeurs hors domaine ; les montants sont en `decimal` et disposent de `Zero` (`src/Tarification.Domaine/Montant.cs:7-21` ; `src/Tarification.Domaine/Quantite.cs:4-12` ; `docs/adr/adr-001-decoupage-domaine-application.md:32-33`).
- **Construction :** objets réels instanciés directement ; ajout fluent des lignes au panier ; helper privé `Ligne(string reference, int quantite, decimal prix)` dans les tests (`src/Tarification.Domaine/Panier.cs:9-13` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:13-19,27`).
- **Tests et doublures déjà en usage :** xUnit, `[Fact]`, noms français séparés par des underscores, assertions de valeurs `Montant` et commentaires `@ac-n` sur les trois critères de l’US-1. Les cinq tests existants n’emploient ni mock, ni stub, ni fake ; ils utilisent le vrai domaine, y compris pour les gardes des objets-valeurs (`tests/Tarification.Tests/CalculDuPanierTests.cs:1-50` ; `tests/Tarification.Tests/Tarification.Tests.csproj:6-8`).
- **Références de test à distinguer de l’existant :** les skills préconisent des tests sociables au point d’entrée application, sans doublures de domaine ; ils conditionnent les tests de domaine supplémentaires à une extraction et à des cas non déjà couverts. Ce n’est pas une raison pour effacer les tests de garde déjà présents (`.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:5-21,51-61` ; `.agent-studio/workflows/skraft-workflow/skills/clean-architecture-testing/references/doubles-decision-tree.md:65-99` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:37-50`).
- **Compilation :** nullabilité et imports implicites activés, avertissements traités comme erreurs (`Directory.Build.props:3-8`).

## Découvertes

1. **Le sous-total existant est brut.** Il est exactement le prix unitaire multiplié par la quantité ; la somme du panier additionne ces sous-totaux. Le remplacer par un montant net changerait la signification du chemin qui alimente actuellement `SommeDesArticles` (`src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Domaine/Panier.cs:16` ; `src/Tarification.Application/CalculDuPanier.cs:10,21` ; `stories/US-1.md:7-9`).
2. **Le calcul peut être étudié sans accès extérieur.** Les critères donnent les paliers et les entrées numériques ; le barème est commun selon la clarification. Aucun contrat de catalogue n’intervient dans cette story, alors que le besoin de stock apparaît dans l’US-6 (`stories/US-2.md:7-11` ; `.skraft/us-2/research/research.md:9-11` ; `stories/US-6.md:7-11`).
3. **L’éligibilité inclut le seuil exact.** Neuf articles sont exclus et dix inclus pour un seuil de dix (`stories/US-2.md:7-8`).
4. **La règle est un maximum de remise parmi les paliers éligibles, non une accumulation.** Le résultat de 12,00 € sur 100,00 € et la formulation « un seul palier […] le plus avantageux » excluent l’addition des taux. Choisir seulement le seuil le plus élevé nécessiterait une hypothèse supplémentaire de croissance des taux, absente des critères (`stories/US-2.md:7-11`).
5. **Les lignes restent les unités d’évaluation.** `Panier.Ajoute` conserve les lignes ajoutées sans regroupement ; le critère interdit de mutualiser deux références pour atteindre un seuil (`src/Tarification.Domaine/Panier.cs:5-13` ; `stories/US-2.md:10`).
6. **Les opérations monétaires nécessaires ne sont pas toutes présentes.** `Montant` propose addition, multiplication entière et comparaison, mais ni application d’un taux décimal ni soustraction. Son formatage à deux décimales n’arrondit pas la valeur `Euros` stockée (`src/Tarification.Domaine/Montant.cs:9-25`).
7. **Le total à payer est une surface couplée à examiner.** Il additionne seulement articles et port, même si `Facture` expose une remise ; les critères US-2 ne donnent pas de résultat explicite pour ce total. Sa prise en compte et son assertion doivent donc être clarifiées en conception, pas supposées couvertes par les cinq exemples (`src/Tarification.Application/CalculDuPanier.cs:10-12` ; `stories/US-2.md:7-11`).
8. **Le chemin sans configuration doit rester disponible.** L’US-2 demande zéro sans palier ; les tests livrés construisent tous le cas d’usage sans argument. La compatibilité de cette construction est donc un point concret de passation (`stories/US-2.md:11` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`).

## Approches évaluées

### A — Porter l’évaluation des paliers sur la ligne

- **Principe :** faire évaluer par la ligne les paliers communs reçus en entrée, à partir de sa quantité et de son sous-total ; sommer ensuite les remises de ligne. C’est un prolongement possible des données et du calcul déjà réunis dans `LigneDePanier` (`src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `stories/US-2.md:7-11`).
- **Apport :** proximité entre la règle, la quantité et l’assiette monétaire ; séparation naturelle entre lignes, conforme à ac-4 (`src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `stories/US-2.md:10`).
- **Limites :** le barème commun est une donnée distincte de la ligne ; cette approche doit encore préciser comment il est transmis et éviter de changer le sous-total brut utilisé par l’US-1 (`.skraft/us-2/research/research.md:9-11` ; `src/Tarification.Domaine/Panier.cs:16` ; `stories/US-1.md:7-9`).
- **Accord avec les conventions :** compatible avec une règle dans le domaine et un modèle porteur de comportement ; une extraction en service n’est pas automatique lorsqu’une règle appartient naturellement à un objet existant (`docs/adr/adr-001-decoupage-domaine-application.md:16-21` ; `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:173-193`).
- **Position dans cette recherche :** non retenue comme recommandation principale, car elle couple l’évolution de la ligne à la sélection dans un barème commun ; reste une alternative recevable si la conception confirme que cette responsabilité appartient à la ligne (`src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `.skraft/us-2/research/research.md:9-11`).

### B — Représenter le barème dans un objet de domaine dédié, évalué par ligne

- **Principe :** représenter les seuils et taux comme des données métier et confier à un objet de domaine dédié l’évaluation d’une ligne : filtrer les seuils atteints, retenir une seule remise maximale, retourner zéro sans candidat. L’application conserve son rôle d’entrée du chiffrage (`stories/US-2.md:7-11` ; `docs/adr/adr-001-decoupage-domaine-application.md:16-21`).
- **Apport :** rendre explicite le barème partagé sans rattacher sa configuration à une référence, et séparer le sous-total brut du calcul de remise (`.skraft/us-2/research/research.md:9-11` ; `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Application/CalculDuPanier.cs:10`).
- **Limites :** introduit au moins un concept supplémentaire ; son nom, sa forme exacte et la nécessité de types-valeurs séparés restent à justifier. Les références DDD rendent ces patrons optionnels et déconseillent un agrégat pour une simple liste consultée (`.agent-studio/workflows/skraft-workflow/skills/clean-architecture-dotnet/references/ddd.md:1-11` ; `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:30-34,72-94`).
- **Accord avec les conventions :** compatible avec le vocabulaire métier, les objets-valeurs et l’absence de dépendance extérieure ; testable avec le vrai domaine depuis `CalculDuPanier`, comme les tests livrés (`src/Tarification.Domaine/Montant.cs:7-21` ; `docs/adr/adr-001-decoupage-domaine-application.md:16-21,32-33` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:13-35`).
- **Position dans cette recherche :** recommandée comme piste à approfondir, sans imposer un service, une interface, une hiérarchie ou un nouveau projet ; l’arbitrage de responsabilité face à A appartient à la conception (`.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:173-193` ; `docs/adr/adr-001-decoupage-domaine-application.md:14-21`).

### C — Calculer les remises directement dans le cas d’usage

- **Principe :** ajouter dans `CalculDuPanier.Chiffrer` la sélection des seuils et le calcul des pourcentages avant de construire `Facture`, dont `Remise` est aujourd’hui à zéro (`src/Tarification.Application/CalculDuPanier.cs:19-22`).
- **Apport :** modification située au point où le résultat est déjà assemblé ; les tests actuels passent par ce point d’entrée (`src/Tarification.Application/CalculDuPanier.cs:10-22` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:19-35`).
- **Limites :** ferait porter une règle commerciale de palier à l’application plutôt qu’au domaine (`stories/US-2.md:7-11` ; `docs/adr/adr-001-decoupage-domaine-application.md:16-25`).
- **Accord avec les conventions :** contraire au découpage accepté ; les références de tests interdisent également de centraliser les règles stratégiques dans les handlers (`docs/adr/adr-001-decoupage-domaine-application.md:16-25` ; `.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:59-61`).
- **Motif de rejet :** l’économie d’un objet ne justifie pas de déplacer la règle dans la couche explicitement réservée aux cas d’usage (`docs/adr/adr-001-decoupage-domaine-application.md:16-25`).

## Recommandation

**Approfondir uniquement l’approche B en conception : un barème métier explicite, évalué indépendamment pour chaque ligne, en conservant le sous-total brut et le point d’entrée `CalculDuPanier`.** Elle représente directement les seuils configurables et la clarification du barème commun, sans placer la règle dans l’application ni changer la signification des montants existants (`stories/US-2.md:7-11` ; `.skraft/us-2/research/research.md:9-11` ; `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `docs/adr/adr-001-decoupage-domaine-application.md:16-21`).

Cette recommandation ne fixe ni contrat public, ni classe nouvelle, ni décision d’architecture : A reste documentée pour l’arbitrage de responsabilité ; C est écartée pour incompatibilité avec l’ADR existant (`.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:173-193` ; `docs/adr/adr-001-decoupage-domaine-application.md:16-25`).

## Passage de relais

### Existant réutilisable

`Panier` → `src/Tarification.Domaine/Panier.cs`
`LigneDePanier` → `src/Tarification.Domaine/LigneDePanier.cs`
`Montant` → `src/Tarification.Domaine/Montant.cs`
`Quantite` → `src/Tarification.Domaine/Quantite.cs`
`CalculDuPanier` → `src/Tarification.Application/CalculDuPanier.cs`
`Facture` → `src/Tarification.Application/CalculDuPanier.cs`
`CalculDuPanierTests` → `tests/Tarification.Tests/CalculDuPanierTests.cs`

### Décisions à valider en conception

- Responsabilité du barème et de son évaluation : approfondir B, confronter à A, sans créer un agrégat ou un service par simple application mécanique d’un patron (`.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:30-34,173-193`).
- Contrat de configuration du barème et compatibilité avec `new CalculDuPanier().Chiffrer(panier)` en l’absence de paliers (`stories/US-2.md:11` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`).
- Opérations monétaires nécessaires et intégration de la remise dans le résultat ; ne pas confondre `SommeDesArticles`, `Remise` et `ATPayer` (`src/Tarification.Domaine/Montant.cs:13-25` ; `src/Tarification.Application/CalculDuPanier.cs:10-12,21`).
- Couverture des cinq critères au point d’entrée application avec le domaine réel ; n’ajouter des tests de domaine que selon la responsabilité effectivement extraite, sans doubler la même couverture (`tests/Tarification.Tests/CalculDuPanierTests.cs:13-35` ; `.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:12-21` ; `.agent-studio/workflows/skraft-workflow/skills/clean-architecture-testing/references/doubles-decision-tree.md:65-99`).

### Questions ouvertes et limites des règles disponibles

- **Portée du barème : résolue.** Même configuration pour toutes les références, calcul par ligne (`.skraft/us-2/research/research.md:9-11`).
- **Total à payer : à expliciter si inclus dans la livraison US-2.** Les cinq critères spécifient la remise ; la formule existante ne la retranche pas. Ne pas considérer cette intégration comme déjà vérifiée (`stories/US-2.md:7-11` ; `src/Tarification.Application/CalculDuPanier.cs:10-12`).
- **Configurations invalides : règles non fournies.** Les critères ne définissent ni les bornes des taux, ni les seuils invalides, ni le traitement de doublons. Demander la règle métier avant d’ajouter des comportements de rejet ou de normalisation ; ne pas déduire ces valeurs des gardes de `Quantite` et `Montant` (`stories/US-2.md:7-14` ; `src/Tarification.Domaine/Quantite.cs:10-12` ; `src/Tarification.Domaine/Montant.cs:13-14`).
- **Arrondi : ne pas inventer de politique dans US-2.** Les exemples de cette story donnent des résultats exacts au centime ; une story séparée traite précisément des montants rendus au client et des valeurs intermédiaires (`stories/US-2.md:7-11` ; `stories/US-5.md:7-10`).
- **Cumul avec les promotions : ne pas anticiper la réponse.** Cette question reste explicitement ouverte dans l’US-3 (`stories/US-3.md:14`).
