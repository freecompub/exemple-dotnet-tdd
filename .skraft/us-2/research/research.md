# Recherche US-2 - Remise par palier de quantite

## Perimetre et criteres de succes

Eclairer la conception du calcul automatique d'une remise pour une ligne de panier, en conservant les regles existantes de chiffrage. Le besoin porte sur l'achat en nombre d'une meme reference (sources : `stories/US-2.md:3-11`, `tests/Tarification.Tests/CalculDuPanierTests.cs:16-36`).

Les paliers sont communs a toutes les references : la question de portee de la story est resolue par la reponse utilisateur, et non par une hypothese technique (sources : `stories/US-2.md:13-14`, `.skraft/us-2/research/clarifications.md:3-7`).

| Critere | Entree | Remise attendue | Source |
| --- | --- | --- | --- |
| AC-1 | 9 articles a 2,00 EUR ; seuil 10, taux 5 % | 0,00 EUR | `stories/US-2.md:7` |
| AC-2 | 10 articles a 2,00 EUR ; seuil 10, taux 5 % | 1,00 EUR | `stories/US-2.md:8` |
| AC-3 | 50 articles a 2,00 EUR ; paliers 10/5 % et 50/12 % | 12,00 EUR ; un seul palier, le plus avantageux | `stories/US-2.md:9` |
| AC-4 | Deux lignes de references differentes, chacune de 6 articles ; seuil 10 | Aucun declenchement du palier | `stories/US-2.md:10` |
| AC-5 | Aucun palier configure | 0,00 EUR | `stories/US-2.md:11` |

Ne pas trancher ici le cumul avec un code promotionnel, les frais de port ou la politique d'arrondi : ces sujets ont leurs propres criteres et questions dans les stories suivantes (sources : `stories/US-3.md:14-15`, `stories/US-4.md:7-13`, `stories/US-5.md:7-13`).

## Fichiers analyses

| Fichier et lignes | Objet de la lecture |
| --- | --- |
| `stories/US-2.md:1-14` | Besoin, cinq criteres et question de portee |
| `.skraft/us-2/research/clarifications.md:3-7` | Reponse utilisateur sur les paliers communs |
| `src/Tarification.Domaine/LigneDePanier.cs:1-7` | Reference, quantite, prix et sous-total |
| `src/Tarification.Domaine/Panier.cs:1-17` | Conservation des lignes et somme brute |
| `src/Tarification.Domaine/Montant.cs:1-26` | Representation et operations monetaires |
| `src/Tarification.Domaine/Quantite.cs:1-14` | Representation et construction des quantites |
| `src/Tarification.Application/CalculDuPanier.cs:1-22` | Point d'entree, facture et montant a payer |
| `tests/Tarification.Tests/CalculDuPanierTests.cs:1-50` | Tests existants et conventions de nommage |
| `src/Tarification.Domaine/Tarification.Domaine.csproj:1-4` | Absence de references du domaine |
| `src/Tarification.Application/Tarification.Application.csproj:1-5` | Reference au domaine |
| `tests/Tarification.Tests/Tarification.Tests.csproj:1-24` | xUnit, rapports et collecte de couverture |
| `Directory.Build.props:1-10` | Cible .NET et contraintes de compilation |
| `.agent-studio/stack.yaml:14-34` | Execution des tests et reperage des tests d'acceptance |
| `.skraft/quality.json:3-24` | Seuils de couverture et dependances interdites |
| `docs/adr/adr-001-decoupage-domaine-application.md:13-42` | Frontiere domaine/application et decimal |
| `README.md:14-30` | Inventaire des stories et role des projets |
| `stories/US-3.md:7-15` | Promotion et question du cumul |
| `stories/US-4.md:7-13` | Frais de port et assiette apres remises |
| `stories/US-5.md:7-13` | Arrondis et question metier associee |
| `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:73-95,175-209` | Objets-valeurs, services de domaine et specifications |
| `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/anti-patterns.md:66-102` | Regles dans l'application et acces du domaine aux depots |
| `.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:12-26,49-62` | Tests sociables et verification du comportement |

## Recherches effectuees

- Exploration du dossier de travail avec `list_files`, puis lecture des sources locales ; reperage des passages par recherche textuelle avec numeros de lignes. Les points d'integration retenus sont la ligne, le panier et le cas d'usage (sources : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Domaine/Panier.cs:8-16`, `src/Tarification.Application/CalculDuPanier.cs:10-21`).
- Verification de la question de configuration dans la story et reutilisation de la reponse utilisateur dans le fichier de clarifications (sources : `stories/US-2.md:13-14`, `.skraft/us-2/research/clarifications.md:3-7`).
- Comparaison du code avec l'ADR accepte et les references locales sur les objets-valeurs et services de domaine (sources : `docs/adr/adr-001-decoupage-domaine-application.md:3,15-33`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:73-95,175-191`).
- Lecture des stories voisines pour identifier les decisions a ne pas anticiper (sources : `stories/US-3.md:14-15`, `stories/US-4.md:10-13`, `stories/US-5.md:7-13`).

L'enquete est une analyse statique locale. Les references de patterns ci-dessous sont celles du depot ; aucun resultat d'execution, mesure de couverture ou benchmark n'est revendique. La chaine de validation a transmettre est celle declaree par le projet (sources : `.agent-studio/stack.yaml:14-26`, `.skraft/quality.json:3-6`).

## Conventions du projet

- Regles commerciales dans `Tarification.Domaine` ; application limitee aux cas d'usage ; dependance application vers domaine uniquement. C'est une contrainte existante, pas une decision de cette recherche (sources : `docs/adr/adr-001-decoupage-domaine-application.md:15-30`, `src/Tarification.Domaine/Tarification.Domaine.csproj:1-4`, `src/Tarification.Application/Tarification.Application.csproj:1-5`).
- Montants en `decimal` ; types-valeurs `Montant` et `Quantite` avec fabriques `De`, proprietes en lecture seule et exceptions explicites pour les entrees rejetees par ces fabriques (sources : `docs/adr/adr-001-decoupage-domaine-application.md:32-33`, `src/Tarification.Domaine/Montant.cs:7-21`, `src/Tarification.Domaine/Quantite.cs:4-11`).
- Noms metier francais, tests xUnit et construction de vrais objets de domaine ; les tests d'acceptance existants pilotent `CalculDuPanier.Chiffrer` (sources : `tests/Tarification.Tests/CalculDuPanierTests.cs:1-35`, `tests/Tarification.Tests/Tarification.Tests.csproj:6-8`). La reference de tests sociables confirme ce mode d'exercice du cas d'usage sans mocks du domaine (source : `.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:12-15,52-62`).
- Cible `net10.0`, nullable active et avertissements traites en erreurs. Rapports JUnit XML et couverture Cobertura ; seuils declares de 90 pour `core`, 70 pour `edge` (sources : `Directory.Build.props:3-8`, `.agent-studio/stack.yaml:14-26`, `.skraft/quality.json:3-6`).

## Decouvertes

1. La ligne fournit deja les trois donnees necessaires aux exemples : reference, quantite et prix unitaire. Son sous-total vaut prix multiplie par quantite (source : `src/Tarification.Domaine/LigneDePanier.cs:4-6`).
2. Le seuil est inclusif : 9 ne declenche pas 10, tandis que 10 le declenche. Le calcul vise tout le sous-total de la ligne : 10 x 2,00 x 5 % = 1,00 et 50 x 2,00 x 12 % = 12,00 ; pas seulement les articles au-dela du seuil (source : `stories/US-2.md:7-9`).
3. « Le plus avantageux » impose de comparer les remises des paliers eligibles, et non de cumuler les taux. Les criteres ne garantissent ni un ordre de configuration, ni une croissance des taux avec les seuils : choisir simplement le dernier palier ou le seuil le plus eleve ne suffit pas a etablir la regle (source : `stories/US-2.md:9`).
4. Une configuration commune ne transforme pas l'assiette en quantite totale du panier : deux references a 6 articles restent ineligibles. Le panier actuel conserve chaque ligne ajoutee sans regroupement par reference (sources : `.skraft/us-2/research/clarifications.md:7`, `stories/US-2.md:10`, `src/Tarification.Domaine/Panier.cs:10-16`).
5. `Montant` permet zero, addition, multiplication par entier et comparaison. Il n'expose ni calcul de pourcentage, ni soustraction ; une conception qui veut y encapsuler ces operations devra preciser leur contrat (source : `src/Tarification.Domaine/Montant.cs:13-23`).
6. `Chiffrer` retourne toujours une remise nulle. `Facture.ATpayer` additionne les articles et les frais de port sans tenir compte de `Remise`. Renseigner seulement le champ `Remise` laisserait donc le montant a payer inchange (source : `src/Tarification.Application/CalculDuPanier.cs:10-21`).
7. Les tests existants verifient trois comportements de somme brute et deux rejets d'entrees, mais aucune remise et aucun montant a payer. Ils constituent une base de non-regression, pas une couverture des AC de l'US-2 (source : `tests/Tarification.Tests/CalculDuPanierTests.cs:16-48`).
8. Le formatage de `Montant.ToString()` affiche deux decimales, tandis que la fabrique et les operations conservent leurs valeurs `decimal` sans arrondi explicite. L'affichage n'est donc pas une preuve d'arrondi du calcul ; l'US-5 porte ses propres criteres d'arrondi (sources : `src/Tarification.Domaine/Montant.cs:11-25`, `stories/US-5.md:7-13`).

## Approches evaluees

Les approches sont des candidates a la conception, non des choix d'architecture enterines.

### A - Comportement porte par les objets du domaine

**Principe.** Representer les paliers comme des valeurs metier communes, transmettre leur configuration au domaine, calculer la remise pour chaque ligne en retenant le maximum des remises eligibles, puis additionner les remises de lignes pour la facture. L'absence de paliers donne zero (references : `stories/US-2.md:7-11`, `.skraft/us-2/research/clarifications.md:7`, `src/Tarification.Domaine/Panier.cs:16`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:73-90`).

**Apport.** Prolonge le calcul deja porte par `LigneDePanier` et la reduction additive deja utilisee par `Panier`, tout en gardant les regles hors du cas d'usage (references : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Domaine/Panier.cs:16`, `docs/adr/adr-001-decoupage-domaine-application.md:17-21`).

**Limites.** Le contrat du pourcentage et les operations monetaires restent a concevoir ; les bornes de taux et le traitement des configurations invalides ne figurent pas dans les cinq AC. Ne pas transformer une convention de validation en regle metier inventee (references : `src/Tarification.Domaine/Montant.cs:13-23`, `stories/US-2.md:7-11`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:79-90`).

**Accord avec les conventions.** Conforme a la frontiere existante et aux types-valeurs du depot ; la forme exacte des types et signatures demeure a valider en conception (references : `docs/adr/adr-001-decoupage-domaine-application.md:15-30`, `src/Tarification.Domaine/Quantite.cs:4-11`).

**Evaluation.** Candidate recommandee : elle utilise directement les points de calcul existants sans necessiter une dependance exterieure (references : `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `docs/adr/adr-001-decoupage-domaine-application.md:28-30`).

### B - Service de domaine dedie au calcul de remise

**Principe.** Un calculateur sans effets de bord recoit une ligne et les paliers communs, puis renvoie la meilleure remise eligible ; l'application orchestre son utilisation sans porter la regle (references : `stories/US-2.md:9-11`, `.skraft/us-2/research/clarifications.md:7`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:175-191`).

**Apport.** Donne un point explicite de calcul et permet des tests de service de domaine avec des assertions sur les resultats (references : `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:177-185`, `.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:18-22`).

**Limites.** La reference justifie une extraction quand le comportement ne trouve pas naturellement sa place dans les objets du domaine. Ici, le besoin est par ligne et cette ligne calcule deja son sous-total ; la story n'impose pas de calcul entre plusieurs agregats (references : `stories/US-2.md:10`, `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:179-189`).

**Accord avec les conventions.** Compatible avec l'ADR si le service reste dans le domaine et recoit les donnees ; son extraction doit etre justifiee plutot que systematique (references : `docs/adr/adr-001-decoupage-domaine-application.md:17-30`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:181-191`).

**Motif d'ecartement a ce stade.** Aucun besoin lu ne justifie de preferer cette extraction au comportement de ligne deja present. Ce n'est pas une interdiction architecturale (references : `stories/US-2.md:7-11`, `src/Tarification.Domaine/LigneDePanier.cs:4-6`).

### C - Calcul inline dans CalculDuPanier

**Principe.** Ajouter directement filtrage des seuils, comparaison et calcul du pourcentage dans `Chiffrer`, qui construit deja la facture (reference du point d'insertion : `src/Tarification.Application/CalculDuPanier.cs:19-21`).

**Apport.** Regroupe dans le point d'entree existant le calcul et la restitution de `Facture.Remise` (reference : `src/Tarification.Application/CalculDuPanier.cs:10-21`).

**Limites.** Place une regle commerciale dans l'application, contrairement a l'ADR ; correspond au transaction script decrit dans la reference locale (references : `docs/adr/adr-001-decoupage-domaine-application.md:17-26`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/anti-patterns.md:66-82`).

**Accord avec les conventions.** Non conforme : l'application doit orchestrer et deleguer le comportement metier (references : `docs/adr/adr-001-decoupage-domaine-application.md:17-21`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/anti-patterns.md:81-82`).

**Motif d'ecartement.** Contredit la separation deja acceptee ; la reduction du nombre de fichiers ne compense pas cette violation (reference : `docs/adr/adr-001-decoupage-domaine-application.md:15-26`).

### D - Un palier applique apres aggregation des quantites du panier

**Principe.** Additionner les quantites de toutes les lignes et choisir un palier unique pour le panier ; le panier expose deja ses lignes (reference du point d'acces : `src/Tarification.Domaine/Panier.cs:8`).

**Apport.** Fournit un seul seuil a evaluer pour tout le panier, mais change l'assiette exigee de la remise (reference : `stories/US-2.md:10`).

**Limites.** Deux lignes de 6 articles de references differentes atteindraient alors 12, contrairement a l'AC-4. Les paliers communs ne permettent pas cette aggregation (references : `stories/US-2.md:10`, `.skraft/us-2/research/clarifications.md:7`).

**Accord avec les conventions.** Peut etre place dans le domaine, mais n'est pas conforme au comportement metier requis (references : `docs/adr/adr-001-decoupage-domaine-application.md:17-18`, `stories/US-2.md:10`).

**Motif d'ecartement.** Echec direct du critere d'acceptation 4 (reference : `stories/US-2.md:10`).

## Recommandation

**Soumettre l'approche A a la conception : comportement de remise dans les objets du domaine, configuration commune fournie explicitement, meilleure remise eligible calculee par ligne puis somme des remises restituee par le cas d'usage.** Elle prolonge les responsabilites presentes et respecte les cinq AC ainsi que l'ADR existant. Cette recommandation ne fixe ni types, ni signatures, ni mechanismes de configuration ; leur choix appartient a la conception (sources : `stories/US-2.md:7-11`, `.skraft/us-2/research/clarifications.md:7`, `src/Tarification.Domaine/LigneDePanier.cs:4-6`, `src/Tarification.Domaine/Panier.cs:16`, `docs/adr/adr-001-decoupage-domaine-application.md:17-30`).

## Passage de relais

### Decisions a valider en conception

- Propriete du comportement, representation des paliers et du taux, et emplacement de la configuration commune : les objets-valeurs sont une piste, pas un modele arrete (sources : `.skraft/us-2/research/clarifications.md:7`, `.agent-studio/workflows/skraft-workflow/skills/architecture-patterns/references/ddd-tactical.md:73-95`, `src/Tarification.Domaine/LigneDePanier.cs:4-6`).
- Contrat d'integration entre somme brute, remise et montant a payer. Le champ `Remise` existe, mais `ATpayer` l'ignore actuellement ; eviter une implementation qui ne modifie que ce champ sans clarifier le montant effectivement facture (sources : `src/Tarification.Application/CalculDuPanier.cs:10-21`, `stories/US-2.md:3-4`).
- Operations de pourcentage et, si necessaire, de deduction dans `Montant`, en conservant `decimal` et les contraintes validees plutot que des conversions en `double` (sources : `src/Tarification.Domaine/Montant.cs:13-23`, `docs/adr/adr-001-decoupage-domaine-application.md:32-33`).
- Compatibilite du chemin actuel sans configuration, utilise par les tests livres, avec l'AC-5 ; la signature exacte n'est pas choisie ici (sources : `tests/Tarification.Tests/CalculDuPanierTests.cs:19-35`, `stories/US-2.md:11`).
- Nommage des nouveaux tests d'acceptance : le profil repere `*AcceptanceTests.cs`, tandis que la classe existante est `CalculDuPanierTests`. Ne pas supposer qu'un test xUnit quelconque sera classe comme acceptance par le profil (sources : `.agent-studio/stack.yaml:28-31`, `tests/Tarification.Tests/CalculDuPanierTests.cs:11-35`).

### Questions ouvertes a ne pas remplacer par des valeurs inventees

- Quelles configurations de seuils et taux sont autorisees, et quel traitement des configurations invalides est attendu ? Les AC donnent seulement les exemples 10/5 % et 50/12 % ; ils ne definissent pas de bornes de taux ni de politique d'erreur de configuration. A clarifier si ces cas entrent dans le perimetre de conception (source : `stories/US-2.md:7-11`).
- Quelle politique d'arrondi appliquer aux cas qui produisent des fractions de centime ? Ne pas la deduire des exemples exacts de l'US-2 ; l'US-5 la traite et conserve une question ouverte (sources : `stories/US-2.md:7-9`, `stories/US-5.md:7-13`).
- Le cumul avec les codes promotionnels reste la question de l'US-3 ; ne pas introduire de politique de priorite ou de cumul dans cette livraison (source : `stories/US-3.md:14`).

### Verification a transmettre

Prevoir cinq tests d'acceptance pilotant `CalculDuPanier`, avec assertions sur la remise obtenue et reprise exacte des entrees du tableau de criteres. Conserver les trois tests de somme brute et les rejets existants. Pour la selection du palier, verifier aussi que permuter la configuration ne change pas le resultat exige par « le plus avantageux », plutot que tester une implementation de tri (sources : `stories/US-2.md:7-11`, `tests/Tarification.Tests/CalculDuPanierTests.cs:16-48`, `.agent-studio/workflows/skraft-workflow/skills/outside-in-tdd/references/testing-strategy.md:52-62`).

L'execution future doit utiliser les rapports et la couverture declares par le profil ; cette recherche ne remplace pas cette validation (sources : `.agent-studio/stack.yaml:14-26`, `.skraft/quality.json:3-6`).
