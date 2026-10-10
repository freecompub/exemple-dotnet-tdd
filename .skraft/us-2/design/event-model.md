# US-2 - Modele d'evenements

## Portee et vocabulaire

Ce modele decrit le chiffrage automatique avec remise de quantite. Les paliers sont communs a toutes les references, mais leur application reste independante pour chaque ligne. Sources : `stories/US-2.md:3-11` ; `.skraft/us-2/research/research.md:10-11`.

`ChiffrerPanier` nomme l'intention deja accessible par `CalculDuPanier.Chiffrer`. `PanierChiffre` nomme le fait metier obtenu, et `Facture` le resultat observable existant. Ces noms de modelisation ne prescrivent ni classes de messages, ni emission, ni conservation d'evenements : le code actuel calcule et retourne directement une facture. Source : `src/Tarification.Application/CalculDuPanier.cs:10-23`.

## Chronologie

```text
Client
  -> `ChiffrerPanier` (panier, paliers communs)
  -> evaluation independante des lignes
  -> `PanierChiffre` (somme des articles, remise de quantite)
  -> `Facture` (SommeDesArticles, Remise, FraisDePort, ATPayer)
```

Fondement de la chronologie : intention du client et calcul automatique, `stories/US-2.md:3-11` ; donnees d'une ligne, `src/Tarification.Domaine/LigneDePanier.cs:3-7` ; resultat du cas d'usage, `src/Tarification.Application/CalculDuPanier.cs:10-23`. La configuration commune vient de `.skraft/us-2/research/research.md:10-11`.

## Commande, evenement et vues

| Element | Contrat metier | Source |
| --- | --- | --- |
| `ChiffrerPanier` | Chiffrer les lignes fournies avec les paliers communs ; chaque ligne apporte reference, quantite et prix unitaire. Aucune saisie de remise par le client. | `stories/US-2.md:3-11` ; `.skraft/us-2/research/research.md:10-11` ; `src/Tarification.Domaine/LigneDePanier.cs:3-7` |
| `PanierChiffre` | Fait de chiffrage reussi : somme brute des articles et remise de quantite calculee. Montants issus des lignes, sans cumul des quantites du panier. Pas d'identifiant ni de date requis par ce contrat. | `stories/US-2.md:7-11` ; `src/Tarification.Domaine/Panier.cs:4-17` ; `src/Tarification.Application/CalculDuPanier.cs:10-23` |
| `RemiseDeLigne` | Resultat de calcul permettant de verifier chaque critere : montant de remise pour une ligne. Ce nom designe une vue logique du calcul, pas une nouvelle interface client imposee. | `stories/US-2.md:7-11` |
| `Facture` | Vue publique existante, dont le champ `Remise` vaut actuellement zero. Dans le modele US-2, `SommeDesArticles` reste la somme brute et `Remise` rend la somme des remises calculees independamment sur les lignes. | `stories/US-1.md:7-9` ; `stories/US-2.md:7-11` ; `src/Tarification.Application/CalculDuPanier.cs:10-23` ; `src/Tarification.Domaine/Panier.cs:17` |

Le panier et les paliers sont les donnees prealables au chiffrage ; aucune vue de gestion des paliers n'est specifiee par US-2. Le modele ne decrit donc pas de commande d'administration. Sources : `stories/US-2.md:6-14` ; `src/Tarification.Application/CalculDuPanier.cs:20-23`.

## Slice et exemples d'acceptation

Une seule slice : `ChiffrerPanier` -> `PanierChiffre` -> `Facture`. Les cinq criteres sont des variantes de cette meme intention et du meme resultat, non cinq processus distincts. Sources : `stories/US-2.md:7-11` ; `src/Tarification.Application/CalculDuPanier.cs:20-23`.

| Critere | Given : paliers et lignes | When | Then : remise observable | Source |
| --- | --- | --- | --- | --- |
| AC-1 | 10 : 5 % ; une ligne 9 x 2,00 EUR | `ChiffrerPanier` | `RemiseDeLigne` = 0,00 EUR ; `Facture.Remise` = 0,00 EUR | `stories/US-2.md:7` |
| AC-2 | 10 : 5 % ; une ligne 10 x 2,00 EUR | `ChiffrerPanier` | `RemiseDeLigne` = 1,00 EUR ; `Facture.Remise` = 1,00 EUR | `stories/US-2.md:8` |
| AC-3 | 10 : 5 % et 50 : 12 % ; une ligne 50 x 2,00 EUR | `ChiffrerPanier` | `RemiseDeLigne` = 12,00 EUR ; `Facture.Remise` = 12,00 EUR ; un seul palier applique | `stories/US-2.md:9` |
| AC-4 | 10 : 5 % ; deux references differentes, chacune en quantite 6 | `ChiffrerPanier` | Chaque `RemiseDeLigne` = 0,00 EUR ; `Facture.Remise` = 0,00 EUR | `stories/US-2.md:10` |
| AC-5 | Aucun palier ; une ligne | `ChiffrerPanier` | `RemiseDeLigne` = 0,00 EUR ; `Facture.Remise` = 0,00 EUR | `stories/US-2.md:11` |

Une absence de palier applicable est un chiffrage reussi avec remise nulle, pas un refus. Les quantites inferieures a un et les montants negatifs sont deja refuses a la construction des valeurs ; le modele ne transforme pas ces erreurs en facture a zero. Sources : `stories/US-2.md:7,11` ; `src/Tarification.Domaine/Quantite.cs:10-11` ; `src/Tarification.Domaine/Montant.cs:13-14` ; `tests/Tarification.Tests/CalculDuPanierTests.cs:38-49`.

## Raccordements a conserver visibles

`Facture.ATPayer` ne soustrait actuellement pas `Remise`. US-2 donne les montants de remise, sans exemple de montant payable ; les stories voisines decrivent cependant un total reduit par une remise. Le modele expose ce raccordement a traiter lors de la phase suivante, sans confondre le comportement actuel avec un calcul net deja implemente. Sources : `src/Tarification.Application/CalculDuPanier.cs:10-13` ; `stories/US-2.md:7-11` ; `stories/US-3.md:11` ; `stories/US-4.md:10`.

Le cumul avec un code promotionnel concerne US-3 ; l'arrondi des montants rendus au client concerne US-5. Les exemples US-2 ci-dessus produisent des montants exacts au centime : ils n'exigent ni calcul promotionnel ni valeur intermediaire arrondie. Ce modele ne fixe pas ces politiques transversales. Sources : `stories/US-3.md:7-15` ; `stories/US-5.md:7-13` ; `stories/US-2.md:7-11`.
