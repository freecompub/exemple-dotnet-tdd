# US-2 - Contrats de chiffrage

## Contraintes et eligibilite des decisions

Le calcul commercial reste dans le domaine ; l'application orchestre le chiffrage et rend `Facture`. Cette frontiere est deja acceptee : elle ne fait pas l'objet d'un nouvel ADR. Sources : `docs/adr/adr-001-decoupage-domaine-application.md:13-30` ; `.skraft/us-2/design/domain-model.md:59`.

| Candidat | Verdict du filtre ADR | Justification sourcee |
| --- | --- | --- |
| Porter les regles de palier dans le domaine | Non eligible, Q1 : frontiere deja imposee | `docs/adr/adr-001-decoupage-domaine-application.md:15-30` |
| Conserver `Panier` contenant `LigneDePanier`, avec des paliers comme valeurs fournies | Non eligible, Q3 : pas de nouvelle frontiere transactionnelle ou de cycle de persistance | `.skraft/us-2/design/domain-model.md:11-16,51-53` ; `src/Tarification.Domaine/Panier.cs:4-17` |
| Fournir les paliers au chiffrage en memoire | Non eligible, Q3 : passage de valeurs, sans nouvelle couche ni dependance exterieure | `.skraft/us-2/design/event-model.md:11-19,30` ; `docs/adr/adr-001-decoupage-domaine-application.md:28-30,40-42` |

Le filtre applique distingue les conventions existantes des ajouts structurels ; aucun de ces candidats ne justifie un nouvel ADR. Source du filtre : `.agent-studio/workflows/skraft-workflow/skills/adr-eligibility-gate/SKILL.md:44-85`.

## Entree : `ChiffrerPanier`

`ChiffrerPanier` reste l'intention executee par le point d'entree existant, sans classe de message ni mecanisme de dispatch supplementaire. Le contrat de conception fournit explicitement un `Panier` et des `PaliersDeQuantite` lors du chiffrage. Les paliers sont des donnees prealables, pas une remise saisie par le client. Sources : `.skraft/us-2/design/event-model.md:7,11-19,25,30`.

| Donnee | Contrat | Source |
| --- | --- | --- |
| `Panier` | Les lignes deja constituees sont les seules lignes evaluees ; le panier peut etre vide | `.skraft/us-2/design/domain-model.md:11-12` ; `src/Tarification.Domaine/Panier.cs:3-17` |
| `LigneDePanier` | Reference, `Quantite`, prix unitaire en `Montant` ; sous-total brut derive du prix et de la quantite | `.skraft/us-2/design/domain-model.md:22-24` |
| `PalierDeQuantite` | Seuil inclusif et taux exprime en pourcentage | `.skraft/us-2/design/domain-model.md:25,35-36` |
| `PaliersDeQuantite` | Meme ensemble fourni pour toutes les lignes ; ensemble vide autorise ; aucune selection par reference | `.skraft/us-2/design/domain-model.md:14,26,38` |

L'appel existant sans paliers doit rester disponible et correspondre a l'ensemble vide. Il conserve ainsi les resultats livres, sans configuration implicite a charger. Sources : `src/Tarification.Application/CalculDuPanier.cs:20-23` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:16-35` ; `stories/US-2.md:11`.

## Calcul : `RemiseDeLigne`

Pour chaque `LigneDePanier`, le domaine calcule le sous-total brut en `decimal`, selectionne les paliers dont le seuil est atteint, puis retient le montant de remise maximal parmi ces paliers. Il ne cumule jamais plusieurs paliers. Sources : `.skraft/us-2/design/domain-model.md:23-25,34-41` ; `docs/adr/adr-001-decoupage-domaine-application.md:32-33`.

```text
sous-total brut = prix unitaire x quantite de la ligne
remise candidate = sous-total brut x taux / 100
RemiseDeLigne = maximum des remises candidates applicables
               ou zero si aucun palier n'est applicable
```

Source des formules : `.skraft/us-2/design/domain-model.md:32-39`.

`RemiseDeLigne` reste un resultat logique du calcul, sans imposer une nouvelle interface publique. La responsabilite de calcul independant appartient a `LigneDePanier` ; `Panier` additionne les montants de remise, pas les quantites. Aucun regroupement de lignes, meme de reference identique, n'est introduit. Sources : `.skraft/us-2/design/event-model.md:27` ; `.skraft/us-2/design/domain-model.md:12,16,38-39`.

Le choix porte sur le montant maximal, non sur le seuil maximal ni l'ordre de configuration. Deux candidats de meme montant donnent le meme resultat observable : aucun identifiant de palier retenu n'est exige par la vue. Sources : `.skraft/us-2/design/domain-model.md:37,41` ; `.skraft/us-2/design/event-model.md:26-28`.

## Sortie : `PanierChiffre` et `Facture`

`PanierChiffre` est le fait logique du calcul reussi, non un evenement a publier ou a enregistrer. Le chiffrage ne modifie pas `Panier`. Sources : `.skraft/us-2/design/event-model.md:7,26` ; `.skraft/us-2/design/domain-model.md:45-47`.

| Champ de `Facture` | Postcondition de conception | Source |
| --- | --- | --- |
| `SommeDesArticles` | Somme brute des sous-totaux ; aucune remise incorporee dans ce champ | `.skraft/us-2/design/domain-model.md:34,39` |
| `Remise` | Somme des `RemiseDeLigne` calculees independamment | `.skraft/us-2/design/domain-model.md:38-39` ; `.skraft/us-2/design/event-model.md:28` |
| `FraisDePort` | Reste zero pour US-2 ; la regle de port appartient a la story correspondante | `src/Tarification.Application/CalculDuPanier.cs:5-8,20-23` ; `stories/US-4.md:6-10` |
| `ATPayer` | Somme des articles moins remise, plus frais de port | `.skraft/us-2/design/domain-model.md:60` ; `stories/US-3.md:11` ; `stories/US-4.md:7-10` |

La deduction dans `ATPayer` est une modification attendue, pas un comportement deja implemente : actuellement, ce champ additionne seulement les articles et le port. Pour les exemples a une ligne, le montant payable attendu devient respectivement 18,00 EUR, 19,00 EUR et 88,00 EUR pour AC-1, AC-2 et AC-3, avec port nul. Sources : `src/Tarification.Application/CalculDuPanier.cs:10-13,22` ; `stories/US-2.md:7-9` ; `stories/US-3.md:11` ; `stories/US-4.md:10`.

Le panier vide rend une somme brute, une remise et un montant payable nuls ; l'absence de palier est un succes avec remise nulle, pas une erreur. Sources : `stories/US-1.md:9` ; `.skraft/us-2/design/event-model.md:44` ; `src/Tarification.Application/CalculDuPanier.cs:22`.

## Erreurs et limites du contrat

Les rejets existants de `Quantite` inferieure a un et de `Montant` negatif sont conserves : ils ne doivent pas devenir une `Facture` de repli a zero. Sources : `.skraft/us-2/design/event-model.md:44` ; `src/Tarification.Domaine/Quantite.cs:10-11` ; `src/Tarification.Domaine/Montant.cs:13-14`.

Le modele ne definit pas de validation generale des taux ni de regle de rejet des seuils dupliques ; ce contrat n'ajoute pas de bornes ou de traitement d'erreur metier non specifies. Source : `.skraft/us-2/design/domain-model.md:28`.

Pour US-2, les calculs conservent la precision `decimal`, sans arrondi intermediaire. Les cinq criteres ont des remises exactes au centime ; la politique d'arrondi des montants exposes est rattachee a US-5. Sources : `docs/adr/adr-001-decoupage-domaine-application.md:32-33` ; `.skraft/us-2/design/event-model.md:38-42,50` ; `stories/US-5.md:8-10`.

US-2 n'ajoute ni entree promotionnelle ni evaluation promotionnelle : le contrat porte uniquement sur les remises de quantite. L'interaction avec une promotion reste dans US-3, sans l'implementer par anticipation. Sources : `.skraft/us-2/design/event-model.md:25,50` ; `.skraft/us-2/design/domain-model.md:62` ; `stories/US-3.md:7-15`.

Aucun depot, stockage des paliers ou commande d'administration n'est ajoute. Sources : `.skraft/us-2/design/domain-model.md:51-53` ; `.skraft/us-2/design/event-model.md:30` ; `docs/adr/adr-001-decoupage-domaine-application.md:40-42`.
