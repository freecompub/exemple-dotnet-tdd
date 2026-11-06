<!-- markdownlint-disable-file -->
# Research: US-02 — Remise par palier de quantité

## Scope and success criteria
- Périmètre : paliers communs à toutes les références, admissibilité par quantité de ligne, remise maximale sans cumul ni regroupement. Les cinq critères attendent respectivement 0 €, 1 €, 12 €, 0 € et 0 € de remise. Sources : stories/US-2.md:1-14 ; docs/domain/event-model/tarification.md:28-38.
- Entrées et hypothèses déjà documentées : panier et paliers fournis à l'appel, liste vide admise, calcul sans mutation, remise déduite du montant à payer. Il ne s'agit pas de sauvegarder une vente ni de gérer une configuration. Sources : docs/domain/event-model/tarification.md:17-24 ; docs/adr/adr-003-classification-chiffrage-panier.md:20-40.
- Succès : les montants nets des quatre premiers critères sont 18 €, 19 €, 88 € et 24 € ; le cinquième conserve la somme des articles. Aucun nouvel arrondi ni nouvelle règle de port. Sources : docs/domain/event-model/tarification.md:28-38 ; docs/architecture/tarification.md:31-40.
- Questions de recherche : quelles règles et frontières sont déjà fixées ? Quels points du code et tests sont réutilisables ? Quelle approche respecte ces frontières ? Sources du besoin : stories/US-2.md:7-14 ; docs/architecture/tarification.md:7-40.
- Questions produit ouvertes : 0 dans le périmètre documenté ; la rubrique de la story est vide et le modèle décrit les règles supplémentaires. ADR-003 reste Proposed, donc sa ratification n'est pas acquise. Sources : stories/US-2.md:14 ; docs/domain/event-model/tarification.md:28-38 ; docs/adr/decisions-index.md:10.

## Research executed
### File analysis
- La recherche précédente a été relue en place et ses références contrôlées dans le workspace ; cette reprise corrige notamment les mentions de répertoires et de symboles qui avaient été interprétées comme des citations de fichiers.
- Lecture préalable du registre ADR, de l'architecture et du modèle événementiel : ces documents couvrent déjà le placement des règles, la classification du chiffrage, les résultats attendus et la compatibilité. Ces questions sont réglées documentairement, sans nouvelle investigation de solution sur ces points. Sources : docs/adr/decisions-index.md:8-10 ; docs/architecture/tarification.md:7-40 ; docs/domain/event-model/tarification.md:17-38.
- La lecture des instructions Copilot demandées a été tentée ; le répertoire GitHub correspondant est absent. La documentation de features demandée est également absente. Ces constats proviennent des lectures du workspace, non d'un fichier cité. Les conventions applicables disponibles sont celles d'agents.md:1-7 ; la spécification fonctionnelle disponible est stories/US-2.md:1-14.
- Contrôle des écarts documentation/code : le panier sait actuellement sommer les sous-totaux ; les lignes exposent quantité et prix ; le chiffrage applicatif renvoie encore une remise nulle et son montant à payer ignore la remise. Sources : src/Tarification.Domaine/Panier.cs:4-17 ; src/Tarification.Domaine/LigneDePanier.cs:4-7 ; src/Tarification.Application/CalculDuPanier.cs:10-22.
- Les capacités monétaires actuelles sont création validée, addition, multiplication entière, comparaison et affichage ; il n'existe pas encore d'opération de taux ou de soustraction dans ce fichier. Les quantités créées par la fabrique doivent être positives. Sources : src/Tarification.Domaine/Montant.cs:7-26 ; src/Tarification.Domaine/Quantite.cs:4-14.
- Aucun build ni test exécuté pendant cette recherche : les outils disponibles dans cette session servent à lire, rechercher et éditer des fichiers. Aucune affirmation de RED/GREEN n'est formulée.

### External research
- Les règles métier sont déjà couvertes par les sources locales ; aucun ajout de bibliothèque n'est nécessaire à la comparaison. Source : docs/architecture/tarification.md:31-40.
- Référence externe limitée à l'exécution de l'exemple console : https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-run ; création du projet temporaire : https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-new.

### Project conventions
- Stack : C# / .NET 10, nullable et implicit usings activés, version de langage latest, avertissements bloquants. Le SDK demandé est 10.0.0 avec roll-forward latestMajor. Sources : Directory.Build.props:1-10 ; global.json:1-6.
- Layout : deux projets de production et deux projets de tests dans la solution. Le projet Domaine n'a aucune référence ; Application référence uniquement Domaine. Sources : Tarification.sln:1-9 ; src/Tarification.Domaine/Tarification.Domaine.csproj:1-4 ; src/Tarification.Application/Tarification.Application.csproj:1-5.
- DESIGN doit maintenir les règles commerciales dans Domaine et les cas d'usage dans Application ; les montants sont decimal, jamais double. Source : docs/adr/adr-001-decoupage-domaine-application.md:15-33.
- Frameworks : xUnit 2.9.3 dans les deux projets, Reqnroll avec intégration xUnit et génération MSBuild 3.3.4 dans le projet BDD ; logger JUnit XML 4.1.0 et collecteur de couverture 6.0.4. Sources : tests/Tarification.Tests/Tarification.Tests.csproj:6-18 ; tests/Tarification.UnitTests/Tarification.UnitTests.csproj:7-16.
- Conventions d'acceptance : Gherkin exécutable dans le projet UnitTests, pas IntegrationTests ; déplacer plutôt que dupliquer le feature de tracking ; retirer les tests xUnit d'acceptance redondants seulement lorsque les bindings sont prouvés ; Pending n'est pas un RED valide. Source : agents.md:1-6.
- Déclarations de build : Tarification.sln:1-27, Directory.Build.props:1-10 et les références de projets ci-dessus. Commande standard de compilation : dotnet build, référence https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-build.
- Commandes de tests documentées : dotnet test --nologo --logger "junit;LogFilePath=/tmp/rapport.xml" pour la suite ; dotnet msbuild -t:TestBdd pour le BDD ; option Release documentée. La target filtre Category=bdd et refuse zéro test. Sources : README.md:50-73 ; Directory.Solution.targets:1-5.

### Existing tests
Tests existants des valeurs et du cas d'usage concernés ; les lignes ci-dessous décrivent leur contenu, pas leur état d'exécution.

| Test file | Test name | Behaviour covered |
|---|---|---|
| tests/Tarification.Tests/CalculDuPanierTests.cs | Une_quantite_nulle_ou_negative_n_existe_pas | Refus de 0 et -2 avec détail d'erreur. Source : tests/Tarification.Tests/CalculDuPanierTests.cs:13-23. |
| tests/Tarification.Tests/CalculDuPanierTests.cs | Un_montant_negatif_n_existe_pas | Refus d'un montant négatif. Source : tests/Tarification.Tests/CalculDuPanierTests.cs:25-33. |
| tests/Tarification.Tests/CalculDuPanierTests.cs | Le_client_peut_chiffrer_un_seul_article | Cas d'usage existant sans paliers : somme d'un article. Source : tests/Tarification.Tests/CalculDuPanierTests.cs:35-43. |
| tests/Tarification.Tests/CalculDuPanierTests.cs | Un_montant_multiplie_par_zero_vaut_zero | Multiplication entière par zéro. Source : tests/Tarification.Tests/CalculDuPanierTests.cs:45-51. |
| tests/Tarification.Tests/CalculDuPanierTests.cs | Un_facteur_negatif_est_refuse | Refus du facteur négatif. Source : tests/Tarification.Tests/CalculDuPanierTests.cs:53-61. |
| tests/Tarification.Tests/CalculDuPanierTests.cs | Un_montant_s_affiche_en_euros_avec_deux_decimales | Affichage monétaire en culture française. Source : tests/Tarification.Tests/CalculDuPanierTests.cs:63-77. |
| tests/Tarification.UnitTests/Features/panier-chiffrage.feature | Le client chiffre une ligne de plusieurs articles | Sous-total d'une ligne. Source : tests/Tarification.UnitTests/Features/panier-chiffrage.feature:6-11. |
| tests/Tarification.UnitTests/Features/panier-chiffrage.feature | Le client chiffre plusieurs lignes | Somme de deux lignes. Source : tests/Tarification.UnitTests/Features/panier-chiffrage.feature:13-19. |
| tests/Tarification.UnitTests/Features/panier-chiffrage.feature | Le client chiffre un panier vide | Somme nulle. Source : tests/Tarification.UnitTests/Features/panier-chiffrage.feature:21-25. |

Tests spécifiques aux remises : None found dans les fichiers de tests source examinés ; ils couvrent seulement les validations et le chiffrage antérieur. Sources : tests/Tarification.Tests/CalculDuPanierTests.cs:13-77 ; tests/Tarification.UnitTests/Features/panier-chiffrage.feature:1-25 ; tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs:15-33.

## Key discoveries
- Déjà couvert par les docs : un seul bounded context Tarification, sans nouvelle intégration ; calcul métier dans Domain et mapping applicatif. Aucune investigation supplémentaire de frontières n'est requise. Sources : docs/architecture/context-map.md:5-22 ; docs/architecture/tarification.md:7-40.
- Déjà couvert par les docs : maximum des taux admissibles, pas maximum des seuils ; lignes distinctes, seuils répétés admis, ordre sans effet, taux entre 0 et 100 inclus, paliers vides admis. Sources : docs/domain/event-model/tarification.md:36-38 ; docs/architecture/tarification.md:19-31.
- Déjà couvert par les docs : calcul pur, montant net calculé dans Domain, pas d'événement ni dépôt, compatibilité de l'appel sans paliers et absence d'arrondi nouveau. ADR-003 reste une proposition. Sources : docs/architecture/tarification.md:31-40 ; docs/adr/decisions-index.md:10.
- Écart vérifié : les valeurs et comportements décrits pour US-2 ne sont pas encore ceux du code du panier ou du cas d'usage ; la remise actuelle est un champ existant mais non calculé. Sources : src/Tarification.Domaine/Panier.cs:4-17 ; src/Tarification.Application/CalculDuPanier.cs:10-22.
- Les bindings existants pilotent directement le cas d'usage avec des valeurs du domaine et parsèment les prix en culture invariante ; cette frontière est réutilisable pour les scénarios US-2. Source : tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs:12-33.

## Evaluated approaches
### Calcul pur dans le domaine, paliers fournis à la Query (recommandé)
- Principes : évaluer chaque ligne avec les mêmes paliers fournis, retenir le taux maximal admissible, sommer les remises et laisser Application mapper le résultat. Sources : docs/architecture/tarification.md:11-15,31-40 ; docs/domain/event-model/tarification.md:17-24,36-38.
- Avantages et usage idéal : calcul sans infrastructure sur un panier déjà fourni, appels reproductibles sans modifier les entrées, respect de la frontière métier. Sources : docs/adr/adr-003-classification-chiffrage-panier.md:24-40 ; docs/adr/adr-001-decoupage-domaine-application.md:15-22.
- Limites : pas d'historique ni de réservation des paliers pour une commande future ; ces exigences nécessiteraient une décision distincte. Source : docs/adr/adr-003-classification-chiffrage-panier.md:35-40.
- Fit : respecte ADR-001 et reprend l'approche déjà décrite par l'architecture ; la ratification Query reste à faire. Sources : docs/architecture/tarification.md:31-40 ; docs/adr/decisions-index.md:8-10.
- Exemple runnable de la règle, hors workspace, sans proposer de contrat de production : créer un projet console temporaire avec dotnet new console --framework net10.0, remplacer son programme par l'exemple ci-dessous, puis dotnet run. Résultat attendu 12, cas AC-3. Exemple non exécuté dans cette session. Sources : stories/US-2.md:10 ; https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-new ; https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-run.

```csharp
decimal[,] lignes = { { 50m, 2m } };
decimal[,] paliers = { { 10m, 5m }, { 50m, 12m } };
decimal remise = 0m;
for (int i = 0; i < lignes.GetLength(0); i++)
{
    decimal taux = 0m;
    for (int j = 0; j < paliers.GetLength(0); j++)
        if (lignes[i, 0] >= paliers[j, 0] && paliers[j, 1] > taux)
            taux = paliers[j, 1];
    remise += lignes[i, 0] * lignes[i, 1] * taux / 100m;
}
System.Console.WriteLine(remise);
```

### Calcul de la règle dans l'application (alternative rejetée)
- Principes : exécuter la même sélection et somme directement dans le cas d'usage avant de construire la facture. Point d'accès existant : src/Tarification.Application/CalculDuPanier.cs:19-22.
- Avantage et usage idéal : proximité du résultat applicatif pour un simple mapping ; cette proximité est observable dans le fichier actuel, mais ne justifie pas d'y transférer une règle commerciale. Sources : src/Tarification.Application/CalculDuPanier.cs:10-22 ; docs/adr/adr-001-decoupage-domaine-application.md:15-22.
- Exemple runnable : reprendre exactement le programme console précédent ; il illustre la même arithmétique si elle était placée dans Application. La différence évaluée est le placement, pas le résultat numérique. Références : stories/US-2.md:10 ; https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-run.
- Limites et fit : techniquement exprimable avec les entrées existantes, mais non viable selon les conventions ratifiées : ADR-001 impose les règles commerciales dans Domaine, et l'architecture demande un mapping seulement dans Application. Rejet recommandé sur cette preuve. Sources : docs/adr/adr-001-decoupage-domaine-application.md:15-26 ; docs/architecture/tarification.md:31-40.

## Handoff to DESIGN
- Recommandation : reprendre le calcul pur dans Domaine, avec paliers fournis à la Query et mapping de facture dans Application. Deux approches évaluées, dont une alternative rejetée ; zéro question produit ouverte. Les docs couvrent déjà le comportement et les frontières : ne pas réouvrir ces investigations. Sources : docs/architecture/tarification.md:7-40 ; docs/domain/event-model/tarification.md:17-38 ; stories/US-2.md:14.
- À ratifier : classification Query d'ADR-003 ; contrats et invariants des nouvelles valeurs déjà énumérées ; instantanés des collections ; opérations monétaires ; compatibilité de l'entrée existante et mapping du montant net. La présente recherche n'ajoute aucun contrat de production ni ADR. Sources : docs/adr/decisions-index.md:10 ; docs/architecture/tarification.md:19-40.
- Agrégat réutilisé : Panier, lignes distinctes et somme existante — src/Tarification.Domaine/Panier.cs:4-17 ; classification documentaire — docs/architecture/tarification.md:7-15.
- Valeurs réutilisées : LigneDePanier, Quantite et Montant — src/Tarification.Domaine/LigneDePanier.cs:4-7 ; src/Tarification.Domaine/Quantite.cs:4-14 ; src/Tarification.Domaine/Montant.cs:7-26.
- Cas d'usage et interface d'entrée concrets : méthode Chiffrer de CalculDuPanier ; read model Facture — src/Tarification.Application/CalculDuPanier.cs:10-22. Aucun contrat I/O ou dépôt à introduire pour cette slice — docs/architecture/tarification.md:13-15,40.
- Patterns structurels : dépendance Application vers Domaine seulement ; tests d'acceptance au point d'entrée et bindings Reqnroll existants — src/Tarification.Application/Tarification.Application.csproj:1-5 ; docs/adr/adr-001-decoupage-domaine-application.md:15-22 ; tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs:12-33.
- Questions restantes : aucune ambiguïté produit documentée ; les ratifications techniques ci-dessus appartiennent à DESIGN. Source : stories/US-2.md:7-14 ; docs/architecture/tarification.md:19-40.
