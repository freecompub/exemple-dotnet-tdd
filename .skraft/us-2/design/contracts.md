# Contrats — US-2

## Cadre et propositions pour la phase suivante

Les contrats ci-dessous concretisent les intentions et les resultats du modele, sans imposer de classes de commandes ou d'evenements. Le domaine conserve validation et calcul ; le point d'entree applicatif transmet les donnees et construit la `Facture`. Cette frontiere est deja imposee, et ne demande pas de nouvel ADR. Sources : `.skraft/us-2/design/event-model.md:5-15` ; `docs/adr/adr-001-decoupage-domaine-application.md:15-30`.

Proposition non tranchee : une `ConfigurationDePaliers` commune, immuable, fournie explicitement au chiffrage ; elle evaluerait chaque `LigneDePanier` sans etre stockee sur la ligne. La construction existante des lignes et l'appel sans configuration seraient conserves ; ce dernier utiliserait une configuration vide. Il s'agirait du raccordement de donnees au domaine, sans nouvelle frontiere, depot ou pattern de dispatch. Sources : `.skraft/us-2/research/clarifications.md:5-6` ; `.skraft/us-2/research/research.md:83-87,96-108` ; `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:16-36` ; `stories/US-2.md:11` ; `docs/adr/adr-001-decoupage-domaine-application.md:28-30,39-41`.

**Statut de lecture :** toutes les modalites nouvelles de ce document sont des propositions, non des decisions acquises : responsabilite d'evaluation de `ConfigurationDePaliers`, transmission explicite avec delegation de l'appel historique, types reference, validation a construction, exceptions, operations monetaires et surface publique des resultats. Les formulations imperatives ou au present dans les tableaux decrivent ce contrat candidat uniquement. Restent acquis les criteres de la story, la portee commune, les bornes et le rejet explicite clarifies, et les decisions existantes de l'ADR-001. Sources : `stories/US-2.md:7-11` ; `.skraft/us-2/research/clarifications.md:5-6` ; `.skraft/us-2/design/clarifications.md:5-6` ; `docs/adr/adr-001-decoupage-domaine-application.md:15-33`.

## `ValiderConfigurationDePaliers`

| Aspect | Contrat propose, non tranche | Sources |
| --- | --- | --- |
| Entree | Une collection de couples `SeuilDeQuantite` / `TauxDeRemise`, commune a toutes les references ; une collection vide est valide | `.skraft/us-2/research/clarifications.md:5-6` ; `stories/US-2.md:11` |
| Seuil | `SeuilDeQuantite` entier >= 1 ; distinct de `Quantite`, qui decrit les articles d'une ligne | `.skraft/us-2/design/clarifications.md:5-6` ; `src/Tarification.Domaine/Quantite.cs:3-12` |
| Taux | `TauxDeRemise` exprime en pourcentage decimal, dans [0, 100] inclus ; 5 signifie 5 %, non 500 % | `.skraft/us-2/design/clarifications.md:5-6` ; `stories/US-2.md:7-9` ; `docs/adr/adr-001-decoupage-domaine-application.md:32-33` |
| Representation | Nouveaux objets-valeurs immuables a construction controlee ; retenir des types reference pour `SeuilDeQuantite`, `TauxDeRemise` et `PalierDeQuantite` afin qu'une valeur par defaut ne puisse fabriquer un seuil zero hors validation | `.skraft/us-2/design/clarifications.md:5-6` ; `src/Tarification.Domaine/Quantite.cs:4-12` |
| Collection | `ConfigurationDePaliers` copie la collection fournie et n'expose pas de modification ; toute entree doit etre valide avant de rendre la configuration disponible au calcul | `.skraft/us-2/research/clarifications.md:5-6` ; `.skraft/us-2/design/clarifications.md:5-6` |
| Ordre et repetitions | Ne pas exiger de tri, de taux croissants ou de seuils uniques ; la selection compare les avantages eligibles, sans cumul | `stories/US-2.md:9` ; `.skraft/us-2/design/domain-model.md:30` |
| Succes | `ConfigurationDePaliersValidee` decrit logiquement une `ConfigurationDePaliers` entierement valide ; `ResultatDeValidationDesPaliers` n'impose pas un type public supplementaire | `.skraft/us-2/design/event-model.md:9-23` |
| Echec | `ConfigurationDePaliersRefusee` et `ResultatDeValidationDesPaliers` decrivent un rejet explicite : seuil ou taux hors bornes leve une exception de depassement de bornes avec parametre et valeur, selon les fabriques existantes ; entree absente ou element absent leve une exception d'argument. Aucun element n'est ignore et aucune configuration partielle n'est rendue | `.skraft/us-2/design/clarifications.md:5-6` ; `src/Tarification.Domaine/Quantite.cs:10-12` ; `src/Tarification.Domaine/Montant.cs:13-14` |

Dans cette proposition non tranchee, la validation aurait lieu a la construction des objets-valeurs et de `ConfigurationDePaliers`, avant `ChiffrerPanier`, sans second appel applicatif public. Une configuration absente dans l'appel explicite serait une erreur technique, distincte de la configuration vide valide. Le rejet par exceptions suivrait le mecanisme deja utilise pour les entrees du domaine ; ce mecanisme reste a valider pour les nouveaux types, contrairement aux bornes et au rejet explicite deja acquis. Sources : `.skraft/us-2/design/event-model.md:17-32` ; `.skraft/us-2/design/clarifications.md:5-6` ; `stories/US-2.md:11` ; `src/Tarification.Domaine/Quantite.cs:10-12` ; `src/Tarification.Domaine/Montant.cs:13-14`.

## `ChiffrerPanier`

| Aspect | Contrat propose, non tranche | Sources |
| --- | --- | --- |
| Entree explicite | `Panier` et une `ConfigurationDePaliers` valide ; meme configuration pour toutes les lignes du calcul | `.skraft/us-2/design/event-model.md:13-15` ; `.skraft/us-2/research/clarifications.md:5-6` |
| Compatibilite | Conserver l'entree existante avec seulement `Panier`, deleguant au calcul avec configuration vide ; ne pas modifier la construction de `LigneDePanier` | `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `src/Tarification.Domaine/LigneDePanier.cs:4` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:13-36` ; `stories/US-2.md:11` |
| Base | Pour une `LigneDePanier`, utiliser son sous-total brut : prix unitaire multiplie par `Quantite` | `src/Tarification.Domaine/LigneDePanier.cs:4-6` |
| Eligibilite | `Quantite` de cette ligne >= `SeuilDeQuantite` ; jamais une somme de quantites entre lignes | `stories/US-2.md:7-10` |
| Selection | Comparer les `TauxDeRemise` des paliers eligibles et retenir le maximum ; sur une base non negative commune, il donne la plus grande remise. Aucun palier eligible donne zero ; un ex aequo n'exige pas d'identite de gagnant | `stories/US-2.md:7-11` ; `src/Tarification.Domaine/Montant.cs:13-14` ; `.skraft/us-2/design/domain-model.md:34-36` |
| Calcul | `RemiseDeLigne` = base brute x (taux retenu / 100), en decimal. La division du taux precede la multiplication, sans conversion binaire. Ajouter a `Montant` les operations de pourcentage et de deduction avec conservation de sa non-negativite | `stories/US-2.md:7-9` ; `docs/adr/adr-001-decoupage-domaine-application.md:32-33` ; `src/Tarification.Domaine/Montant.cs:7-25` |
| Agregation | La remise du `Panier` est la somme des `RemiseDeLigne` ; chaque ligne ajoutee reste une unite de calcul, sans regroupement par reference | `stories/US-2.md:10` ; `src/Tarification.Domaine/Panier.cs:6-16` |
| Sortie | `PanierChiffre` decrit le resultat logique ; rendre la `Facture`, sans publication ni stockage d'evenement | `.skraft/us-2/design/event-model.md:7-15` ; `src/Tarification.Application/CalculDuPanier.cs:20-22` |

## `Facture` et `RemiseDeLigne`

`Facture` conserve ses trois montants publics : somme brute des articles, remise totale et frais de port. Le total a payer devient somme brute moins remise plus port ; dans US-2, le port reste zero. La deduction corrige le raccordement de la remise, sans modifier la somme brute. Sources : `src/Tarification.Application/CalculDuPanier.cs:5-13,20-22` ; `.skraft/us-2/design/event-model.md:48` ; `stories/US-2.md:3-11`.

`RemiseDeLigne` reste un resultat logique interne de l'evaluation : ligne concernee, base brute et montant de remise. Ne pas l'ajouter a la surface publique de `Facture` dans US-2 ; les tests de ligne peuvent verifier directement l'evaluation par `ConfigurationDePaliers`. Cela conserve le contrat public existant tout en permettant de verifier l'absence d'agregation des quantites. Sources : `.skraft/us-2/design/event-model.md:46` ; `src/Tarification.Application/CalculDuPanier.cs:10-13` ; `stories/US-2.md:10`.

Le calcul conserve les valeurs decimal non arrondies comme `Montant` le fait aujourd'hui ; ne pas utiliser son affichage comme operation de calcul. Ce contrat US-2 ne fixe aucune politique de restitution au centime ni de cumul avec une autre remise : ces decisions restent dans les stories correspondantes. Sources : `src/Tarification.Domaine/Montant.cs:11-14,25` ; `.skraft/us-2/design/adrs-to-reconsider.md:14` ; `.skraft/us-2/research/research.md:85,129-132`.

## Exemples contractuels

Les valeurs ci-dessous sont celles d'un panier limite aux lignes decrites, avec port nul ; le brut est la somme des sous-totaux et le net illustre la deduction proposee ci-dessus, non encore tranchee. Sources : `src/Tarification.Domaine/LigneDePanier.cs:6` ; `src/Tarification.Domaine/Panier.cs:16` ; `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `stories/US-2.md:7-11`.

| Critere | Paliers et lignes | Brut | Remise | Net | Source |
| --- | --- | --- | --- | --- | --- |
| 1 | 10 / 5 % ; 9 x 2,00 EUR | 18,00 EUR | 0,00 EUR | 18,00 EUR | `stories/US-2.md:7` |
| 2 | 10 / 5 % ; 10 x 2,00 EUR | 20,00 EUR | 1,00 EUR | 19,00 EUR | `stories/US-2.md:8` |
| 3 | 10 / 5 % et 50 / 12 % ; 50 x 2,00 EUR | 100,00 EUR | 12,00 EUR | 88,00 EUR | `stories/US-2.md:9` |
| 4 | 10 / 5 % ; deux references, chacune 6 x 2,00 EUR | 24,00 EUR | 0,00 EUR | 24,00 EUR | `stories/US-2.md:10` ; `src/Tarification.Domaine/LigneDePanier.cs:6` |
| 5 | Collection vide ; 10 x 2,00 EUR | 20,00 EUR | 0,00 EUR | 20,00 EUR | `stories/US-2.md:11` ; `src/Tarification.Domaine/LigneDePanier.cs:6` |
