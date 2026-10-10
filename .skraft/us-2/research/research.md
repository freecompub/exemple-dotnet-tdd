# US-2 — Recherche sur la remise par palier de quantité

## Périmètre et critères de succès

L'objet de la recherche est une remise automatique par ligne de panier, avec un seul palier applicable, le plus avantageux. Les paliers sont communs à toutes les références ; leur portée commune ne transforme pas le calcul en remise sur le panier entier. Sources : `stories/US-2.md:3-11`, `.skraft/us-2/research/clarification.md:3-9`.

Les résultats attendus sont les suivants. Source : `stories/US-2.md:6-11`.

| Critère | Configuration et entrée | Remise attendue | Source |
| --- | --- | --- | --- |
| 1 | Palier 10 : 5 %, quantité 9, prix 2,00 EUR | 0,00 EUR | `stories/US-2.md:7` |
| 2 | Palier 10 : 5 %, quantité 10, prix 2,00 EUR | 1,00 EUR | `stories/US-2.md:8` |
| 3 | Paliers 10 : 5 % et 50 : 12 %, quantité 50, prix 2,00 EUR | 12,00 EUR, sans cumul | `stories/US-2.md:9` |
| 4 | Palier 10 : 5 %, deux références distinctes de quantité 6 | Aucun déclenchement du palier | `stories/US-2.md:10` |
| 5 | Aucun palier | 0,00 EUR | `stories/US-2.md:11` |

La compatibilité à préserver concerne le calcul brut des articles, le panier vide et les validations déjà testées. Sources : `tests/Tarification.Tests/CalculDuPanierTests.cs:15-46`, `src/Tarification.Domaine/Montant.cs:13-14`, `src/Tarification.Domaine/Quantite.cs:10-11`.

Les promotions, les frais de port, les arrondis et le stock ont leurs propres stories ; leurs règles ne sont pas à introduire implicitement dans l'US-2. Sources : `stories/US-3.md:6-14`, `stories/US-4.md:6-13`, `stories/US-5.md:6-13`, `stories/US-6.md:6-14`.

## Fichiers analysés

| Fichier | Passages exploités |
| --- | --- |
| `stories/US-2.md` | Objectif, critères et question de portée : lignes 3-14 |
| `.skraft/us-2/research/clarification.md` | Réponse métier consignée : lignes 3-9 |
| `src/Tarification.Domaine/LigneDePanier.cs` | Données de ligne et sous-total : lignes 1-7 |
| `src/Tarification.Domaine/Panier.cs` | Collection, ajout et somme brute : lignes 1-17 |
| `src/Tarification.Domaine/Montant.cs` | Valeur monétaire et opérations : lignes 3-26 |
| `src/Tarification.Domaine/Quantite.cs` | Valeur de quantité et validation : lignes 3-14 |
| `src/Tarification.Application/CalculDuPanier.cs` | Facture et point d'entrée : lignes 1-21 |
| `tests/Tarification.Tests/CalculDuPanierTests.cs` | Construction des lignes et tests existants : lignes 1-48 |
| `docs/adr/adr-001-decoupage-domaine-application.md` | Frontières des couches et decimal : lignes 8-43 |
| `docs/adr/adr-002-format-de-rapport-de-tests.md` | Rapport JUnit : lignes 8-28 |
| `src/Tarification.Domaine/Tarification.Domaine.csproj` | Projet sans dépendances : lignes 1-4 |
| `src/Tarification.Application/Tarification.Application.csproj` | Référence au domaine : lignes 1-5 |
| `tests/Tarification.Tests/Tarification.Tests.csproj` | xUnit, rapport et couverture : lignes 1-24 |
| `Directory.Build.props` | Cible et options de compilation : lignes 1-10 |
| `.agent-studio/stack.yaml` | Tests, couverture et disposition : lignes 9-34 |
| `.skraft/quality.json` | Seuils et dépendances interdites : lignes 1-26 |
| `README.md` | Répartition des stories et rôle des fichiers : lignes 10-29 |
| `stories/US-3.md` | Promotions et question du cumul : lignes 6-14 |
| `stories/US-4.md` | Seuil après remises : lignes 6-13 |
| `stories/US-5.md` | Arrondis et question ouverte : lignes 6-13 |
| `stories/US-6.md` | Stock et catalogue : lignes 6-14 |

## Recherches effectuées

- Lecture de la chaîne ligne → panier → chiffrage → facture pour identifier les points d'intégration. Sources : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Domaine/Panier.cs:6-16`, `src/Tarification.Application/CalculDuPanier.cs:9-21`.
- Recherche de conventions et d'opérations réutilisables dans les types-valeurs et les projets. Sources : `src/Tarification.Domaine/Montant.cs:7-26`, `src/Tarification.Domaine/Quantite.cs:4-14`, `docs/adr/adr-001-decoupage-domaine-application.md:15-33`.
- Lecture des tests existants et de la chaîne de mesure, sans exécution : la suite appelle `CalculDuPanier.Chiffrer`, et le profil déclare un rapport JUnit avec couverture Cobertura. Sources : `tests/Tarification.Tests/CalculDuPanierTests.cs:15-46`, `.agent-studio/stack.yaml:14-31`.
- Vérification des dépendances fonctionnelles dans les stories voisines, notamment le cumul des remises et les arrondis. Sources : `stories/US-3.md:12-14`, `stories/US-4.md:10`, `stories/US-5.md:6-13`.
- Clarification de la seule question de portée inscrite dans l'US-2 : paliers communs à toutes les références. Sources : `stories/US-2.md:13-14`, `.skraft/us-2/research/clarification.md:3-9`.

Cette recherche repose sur les sources locales listées ci-dessus ; aucune référence externe n'est utilisée.

## Conventions du projet

- Les règles commerciales appartiennent au domaine ; l'application porte les cas d'usage et dépend uniquement du domaine. Les deux projets matérialisent cette séparation. Sources : `docs/adr/adr-001-decoupage-domaine-application.md:15-21`, `src/Tarification.Domaine/Tarification.Domaine.csproj:1-4`, `src/Tarification.Application/Tarification.Application.csproj:1-5`.
- Les montants sont des `decimal`, avec construction par `Montant.De`, zéro explicite et interdiction des valeurs négatives ; la quantité est construite par `Quantite.De` et doit valoir au moins un. Sources : `docs/adr/adr-001-decoupage-domaine-application.md:32-33`, `src/Tarification.Domaine/Montant.cs:7-16`, `src/Tarification.Domaine/Quantite.cs:4-11`.
- Les noms sont métier, en français ; les lignes et montants sont des records, et `Panier.Ajoute` permet la construction chaînée utilisée dans les tests. Sources : `src/Tarification.Domaine/LigneDePanier.cs:4`, `src/Tarification.Domaine/Montant.cs:7`, `src/Tarification.Domaine/Panier.cs:10-14`, `tests/Tarification.Tests/CalculDuPanierTests.cs:13-28`.
- La compilation cible `net10.0`, active les références nullables et traite les avertissements comme des erreurs. Source : `Directory.Build.props:3-8`.
- Les tests utilisent xUnit ; les trois tests d'acceptation US-1 portent des marqueurs `@ac-1`, `@ac-2` et `@ac-3`. Sources : `tests/Tarification.Tests/Tarification.Tests.csproj:6-8`, `tests/Tarification.Tests/CalculDuPanierTests.cs:16-35`.
- La mesure déclarée utilise JUnit et Cobertura ; les seuils de couverture déclarés sont 90 pour `core` et 70 pour `edge`. Sources : `.agent-studio/stack.yaml:14-26`, `.skraft/quality.json:3-6`.
- Le profil distingue les fichiers `*AcceptanceTests.cs` des autres tests ; la suite présélectionnée s'appelle toutefois `CalculDuPanierTests.cs`. Sources : `.agent-studio/stack.yaml:28-31`, `tests/Tarification.Tests/CalculDuPanierTests.cs:10`.

## Découvertes

1. Le sous-total existant est brut : prix unitaire multiplié par quantité. C'est la base disponible pour calculer un pourcentage sur une ligne, sans modifier la signification de la somme des articles. Sources : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Domaine/Panier.cs:16`, `tests/Tarification.Tests/CalculDuPanierTests.cs:16-29`.
2. `Panier.Ajoute` ajoute chaque ligne telle quelle, sans regroupement par référence ; `SommeDesLignes` additionne les sous-totaux. La règle demandée est également par ligne : aucune fusion de références n'est nécessaire pour satisfaire les critères. Sources : `src/Tarification.Domaine/Panier.cs:10-16`, `stories/US-2.md:10`.
3. Les classes de ligne, panier et chiffrage exposent actuellement uniquement les données et calculs bruts, sans entrée de configuration des paliers. Une entrée de configuration sera donc à définir en conception. Sources : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Domaine/Panier.cs:4-16`, `src/Tarification.Application/CalculDuPanier.cs:19-21`.
4. `Facture.Remise` existe déjà, mais `Chiffrer` la fixe à zéro. Renseigner cette propriété est le point de sortie directement compatible avec les critères exprimés en montant de remise. Sources : `src/Tarification.Application/CalculDuPanier.cs:9-12,19-21`, `stories/US-2.md:7-11`.
5. `Facture.ATPayer` ne soustrait pas `Remise`. Dès qu'une remise non nulle sera produite, ce champ continuera à afficher la somme des articles et des frais de port, indépendamment de la remise : ce raccord doit être examiné en conception. Source : `src/Tarification.Application/CalculDuPanier.cs:9-12`.
6. `Montant` offre l'addition, une multiplication par entier et la comparaison ; il ne fournit ni multiplication par pourcentage ni soustraction. Toute extension devra respecter son invariant de non-négativité. Source : `src/Tarification.Domaine/Montant.cs:13-24`.
7. Le critère du « plus avantageux » ne donne aucune garantie de croissance des taux avec les seuils. Choisir uniquement le plus grand seuil ne suffit donc pas à traduire la règle sans une contrainte métier supplémentaire. Source : `stories/US-2.md:7-11`.
8. Les tests actuels couvrent la somme brute, le panier vide et les validations, mais aucun scénario de palier ; ils ne constituent pas une couverture des cinq critères US-2. Source : `tests/Tarification.Tests/CalculDuPanierTests.cs:15-46`.
9. L'arrondi relève de l'US-5 et le cumul avec un code promotionnel reste une question ouverte de l'US-3. Les introduire ici fixerait des règles au-delà des critères US-2. Sources : `stories/US-5.md:6-13`, `stories/US-3.md:12-14`, `stories/US-2.md:6-11`.

## Approches évaluées

Les approches ci-dessous sont des propositions à comparer, pas des descriptions de composants déjà présents. Leurs points d'appui exacts sont indiqués pour chaque option.

### A — Règle de paliers dédiée dans le domaine, orchestrée par le chiffrage

- **Principe proposé :** fournir une configuration commune à une règle du domaine, évaluer les paliers éligibles pour chaque ligne, retenir la remise la plus élevée puis additionner les remises dans le chiffrage. Références : `stories/US-2.md:7-11`, `.skraft/us-2/research/clarification.md:7`, `docs/adr/adr-001-decoupage-domaine-application.md:17-21`.
- **Apport :** séparer la sélection du palier du calcul brut existant et exploiter le champ `Facture.Remise`, sans faire du panier entier l'assiette d'éligibilité. Références : `src/Tarification.Domaine/LigneDePanier.cs:6`, `src/Tarification.Domaine/Panier.cs:16`, `src/Tarification.Application/CalculDuPanier.cs:9-12`, `stories/US-2.md:10`.
- **Limites :** nécessite de concevoir la représentation des paliers, leur transmission au cas d'usage et le raccord de `ATPayer` ; ces surfaces ne sont pas actuellement équipées. Références : `src/Tarification.Application/CalculDuPanier.cs:9-21`, `src/Tarification.Domaine/Montant.cs:18-24`.
- **Accord avec les conventions :** compatible avec une règle métier dans le domaine et une application d'orchestration ; n'exige pas de service extérieur pour les critères présents. Références : `docs/adr/adr-001-decoupage-domaine-application.md:17-30`, `stories/US-2.md:6-11`.
- **Statut d'évaluation :** candidate recommandée ; API et découpage précis restent à valider en conception.

### B — Calcul de la remise porté directement par `LigneDePanier`

- **Principe proposé :** ajouter à la ligne un calcul recevant les paliers communs, puis agréger ses résultats au chiffrage. Références : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Domaine/Panier.cs:16`, `.skraft/us-2/research/clarification.md:7`.
- **Apport :** proximité immédiate avec la quantité et le sous-total ; la frontière par ligne est explicite. Références : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `stories/US-2.md:10`.
- **Limites :** ajoute la sélection d'une politique commune au record qui porte aujourd'hui seulement les données et le sous-total ; l'agrégation et le raccord de facture restent nécessaires. Références : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Application/CalculDuPanier.cs:9-21`, `.skraft/us-2/research/clarification.md:7`.
- **Accord avec les conventions :** respecte la localisation des règles dans le domaine ; l'ADR cite explicitement `LigneDePanier` parmi les porteurs de règles. Référence : `docs/adr/adr-001-decoupage-domaine-application.md:17-18`.
- **Motif de rejet dans cette recommandation :** préférer isoler l'évaluation de la configuration commune du record de ligne. C'est un arbitrage de conception proposé, non une interdiction de l'ADR. Références : `.skraft/us-2/research/clarification.md:7`, `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `docs/adr/adr-001-decoupage-domaine-application.md:17-21`.

### C — Toute la règle directement dans `CalculDuPanier`

- **Principe proposé :** filtrer les paliers, calculer et sommer les remises directement dans `Chiffrer`. Références : `src/Tarification.Application/CalculDuPanier.cs:19-21`, `stories/US-2.md:7-11`.
- **Apport :** rassemble le calcul et la construction de la facture au point d'entrée déjà utilisé par les tests. Références : `src/Tarification.Application/CalculDuPanier.cs:19-21`, `tests/Tarification.Tests/CalculDuPanierTests.cs:16-35`.
- **Limites :** déplace une règle commerciale dans la couche des cas d'usage. Références : `docs/adr/adr-001-decoupage-domaine-application.md:17-26`, `stories/US-2.md:3-11`.
- **Accord avec les conventions :** incompatible avec la répartition explicite de l'ADR-001, même sans nouvelle dépendance de projet. Référence : `docs/adr/adr-001-decoupage-domaine-application.md:17-26`.
- **Motif de rejet :** non-respect de la frontière métier/application. Référence : `docs/adr/adr-001-decoupage-domaine-application.md:17-26`.

### D — Retenir le plus grand seuil atteint plutôt que la remise maximale

- **Principe proposé :** trier les seuils et prendre le dernier atteint. Référence du besoin auquel comparer cette proposition : `stories/US-2.md:7-11`.
- **Apport :** restitue le résultat de l'exemple 10 : 5 %, 50 : 12 %. Référence : `stories/US-2.md:9`.
- **Limites :** cet exemple n'établit pas que tous les taux croissent avec les seuils ; cette sélection n'exprime pas à elle seule « le plus avantageux ». Référence : `stories/US-2.md:9`.
- **Accord avec les conventions :** peut être placé dans le domaine, mais sa conformité métier dépendrait d'une contrainte absente des critères. Références : `docs/adr/adr-001-decoupage-domaine-application.md:17-18`, `stories/US-2.md:6-11`.
- **Motif de rejet :** ne pas inventer une monotonie des taux pour remplacer la sélection du meilleur avantage. Référence : `stories/US-2.md:9`.

## Recommandation

**Soumettre l'approche A à la conception : une règle de paliers dédiée dans le domaine, utilisant la configuration commune et évaluée séparément pour chaque ligne, puis une orchestration au chiffrage.** Elle exprime le meilleur avantage sans cumul, conserve l'assiette par ligne et respecte la frontière existante. Sources : `stories/US-2.md:7-11`, `.skraft/us-2/research/clarification.md:7`, `docs/adr/adr-001-decoupage-domaine-application.md:17-21`.

La recommandation ne fixe ni signature publique, ni représentation des taux, ni emplacement définitif des nouveaux types. Les surfaces à raccorder restent la configuration, les opérations monétaires nécessaires et la facture. Sources : `src/Tarification.Domaine/Montant.cs:13-24`, `src/Tarification.Application/CalculDuPanier.cs:9-21`.

## Passage de relais

### Éléments acquis

- Les paliers sont communs à toutes les références ; l'éligibilité demeure évaluée par ligne. Sources : `.skraft/us-2/research/clarification.md:7`, `stories/US-2.md:10`.
- Aucun palier signifie une remise nulle ; les remises de paliers ne se cumulent pas sur une ligne. Sources : `stories/US-2.md:9,11`.

### Décisions à valider en conception

- Choisir la représentation des seuils et taux et la manière de fournir la configuration, tout en préservant le cas sans palier et les usages actuels de `Chiffrer(Panier)`. Sources : `stories/US-2.md:11`, `src/Tarification.Application/CalculDuPanier.cs:19-21`, `tests/Tarification.Tests/CalculDuPanierTests.cs:16-35`.
- Valider l'emplacement exact de la règle dans le domaine et les opérations monétaires à exposer : la multiplication disponible accepte seulement un entier, et aucune soustraction n'existe. Sources : `docs/adr/adr-001-decoupage-domaine-application.md:17-21`, `src/Tarification.Domaine/Montant.cs:18-24`.
- Examiner le raccord de `Facture.ATPayer` à une remise non nulle et conserver le sens brut de `SommeDesArticles`. Sources : `src/Tarification.Application/CalculDuPanier.cs:9-12`, `tests/Tarification.Tests/CalculDuPanierTests.cs:16-29`.
- Prévoir les cinq critères US-2 au point d'entrée applicatif et la non-régression US-1 ; valider le placement des tests d'acceptation au regard du profil. Sources : `stories/US-2.md:6-11`, `tests/Tarification.Tests/CalculDuPanierTests.cs:15-46`, `.agent-studio/stack.yaml:28-31`.
- Vérifier la sélection du meilleur avantage indépendamment de l'ordre de configuration et du plus grand seuil : le critère exige le meilleur palier, pas une convention de tri. Source : `stories/US-2.md:9`.

### Questions ouvertes à ne pas résoudre implicitement

- Quelle règle de validité appliquer aux configurations hors des exemples : seuil non positif, taux négatif ou supérieur à 100 %, seuils dupliqués ? Les critères ne donnent que les seuils 10 et 50 et les taux 5 % et 12 % ; les types actuels protègent quantités et montants, pas une configuration de taux. Sources : `stories/US-2.md:7-11`, `src/Tarification.Domaine/Quantite.cs:10-11`, `src/Tarification.Domaine/Montant.cs:13-14`. Réponses à faire préciser si ces cas entrent dans la conception : rejet explicite des configurations invalides, ou autres règles métier explicites ; aucun comportement n'est retenu ici.
- Le cumul avec les codes promotionnels et le choix général d'arrondi restent ouverts dans leurs stories respectives ; ne pas les fixer au passage. Sources : `stories/US-3.md:12-14`, `stories/US-5.md:12-13`.
- Les deux lignes d'une même référence ne font pas l'objet d'un exemple d'acceptation spécifique ; ne pas introduire de regroupement automatique en contradiction avec le calcul par ligne et le comportement actuel d'ajout. Sources : `stories/US-2.md:10`, `src/Tarification.Domaine/Panier.cs:10-16`.
