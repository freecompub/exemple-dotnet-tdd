# US-2 — Contrats

## Portée et choix retenus

Les contrats ci-dessous sont la cible de réalisation, pas une description d'API déjà livrée. Ils précisent les décisions closes du modèle : transmission de `GrilleDePaliers`, opérations de `Montant` et calcul de `Facture.ATPayer`. Sources : `.skraft/us-2/design/domain-model.md:59-65`, `src/Tarification.Application/CalculDuPanier.cs:9-21`, `src/Tarification.Domaine/Montant.cs:13-24`.

`GrilleDePaliers` est l'objet-valeur composite immuable retenu par le modèle, sans identité, stockage ni cycle de vie supplémentaire. Elle est passée explicitement à `CalculDuPanier.Chiffrer`, plutôt que conservée comme état mutable du cas d'usage. Sources : `.skraft/us-2/design/domain-model.md:15,26,46`, `docs/adr/adr-001-decoupage-domaine-application.md:28-30,40-43`.

La sélection appartient à `GrilleDePaliers`, le cumul à `Panier`, la construction de `Facture` à `CalculDuPanier`. Il n'y a pas de nouvelle frontière de couches à décider : l'ADR accepté impose déjà cette répartition. Aucun nouvel ADR n'est rédigé pour la redéclarer. Sources : `.skraft/us-2/design/domain-model.md:15-32`, `docs/adr/adr-001-decoupage-domaine-application.md:15-21`.

## Construction : `ConfigurerPaliers`

| Surface | Entrée et résultat | Validation et effet | Sources |
| --- | --- | --- | --- |
| `TauxDeRemise` | Pourcentage `decimal` : 5 signifie 5 %, 12 signifie 12 %. | Rejeter à la construction toute valeur <= 0 ou > 100 ; pas de correction automatique. | `.skraft/us-2/design/domain-model.md:28,64`, `.skraft/us-2/research/clarification.md:11-15` |
| `PalierDeQuantite` | `Quantite` et `TauxDeRemise` valides. | Seuil >= 1 ; vérifier aussi les valeurs reçues, y compris un `Quantite` construit par défaut dont la valeur serait 0. | `.skraft/us-2/design/domain-model.md:27`, `src/Tarification.Domaine/Quantite.cs:4-11`, `.skraft/us-2/research/clarification.md:15` |
| `GrilleDePaliers` | Ensemble de `PalierDeQuantite`, éventuellement vide. | Valider tous les paliers et l'unicité des seuils avant de rendre la grille utilisable ; prendre une copie non modifiable de la collection fournie. | `.skraft/us-2/design/domain-model.md:15,26`, `.skraft/us-2/research/clarification.md:15` |

Les valeurs numériques hors intervalle et les seuils dupliqués provoquent un rejet explicite à la construction, avec le motif de l'échec. Une configuration invalide ne devient jamais une grille vide ni une remise nulle. Ce rejet matérialise `ConfigurationDePaliersRejetee` ; une construction réussie matérialise `PaliersConfigures`. Sources : `src/Tarification.Domaine/Quantite.cs:10-11`, `src/Tarification.Domaine/Montant.cs:13-14`, `.skraft/us-2/research/clarification.md:15`, `.skraft/us-2/design/event-model.md:19-26`.

## Calcul de domaine

| Contrat cible | Résultat et invariants | Sources |
| --- | --- | --- |
| `GrilleDePaliers.RemiseDe(LigneDePanier) -> Montant` | Pour chaque palier dont le seuil <= la quantité de cette ligne, calculer `SousTotal` x pourcentage / 100. Rendre le maximum des montants, sans addition des paliers ; `Montant.Zero` si aucun palier n'est atteint. | `.skraft/us-2/design/domain-model.md:26,34`, `stories/US-2.md:7-11` |
| `Panier.RemiseDe(GrilleDePaliers) -> Montant` | Additionner exactement une remise par `LigneDePanier`, en utilisant la même grille pour chaque ligne. Panier vide : zéro. Aucun regroupement ni total des quantités, même pour des références identiques. | `.skraft/us-2/design/domain-model.md:19`, `.skraft/us-2/research/clarification.md:7`, `stories/US-2.md:10`, `src/Tarification.Domaine/Panier.cs:6-16` |
| `Montant.Multiplie(TauxDeRemise) -> Montant` | Multiplier les euros par le pourcentage / 100 en `decimal`. Garder `Multiplie(int)` inchangé pour les sous-totaux. | `.skraft/us-2/design/domain-model.md:32,34`, `src/Tarification.Domaine/Montant.cs:18-21`, `src/Tarification.Domaine/LigneDePanier.cs:6`, `docs/adr/adr-001-decoupage-domaine-application.md:32-33` |
| Soustraction de deux `Montant` | Construire le résultat via la validation de `Montant.De` : un résultat négatif est rejeté, jamais ramené silencieusement à zéro. | `.skraft/us-2/design/domain-model.md:32,63`, `src/Tarification.Domaine/Montant.cs:13-14` |

L'ordre des paliers ne change pas le montant rendu ; un seuil supérieur avec un taux inférieur n'écarte pas un meilleur palier déjà atteint. Des paliers donnant le même montant n'affectent pas le résultat public : aucun contrat public ne retourne l'identité du palier retenu. Sources : `stories/US-2.md:9`, `.skraft/us-2/design/domain-model.md:8,19`, `src/Tarification.Application/CalculDuPanier.cs:9-12`.

Les calculs n'introduisent pas d'arrondi au centime ; ils conservent la valeur `decimal` obtenue. La politique d'arrondi des montants rendus au client appartient à l'US-5. Sources : `.skraft/us-2/design/domain-model.md:32,64`, `stories/US-5.md:6-13`, `src/Tarification.Domaine/Montant.cs:9-14`.

## Cas d'usage : `ChiffrerPanier`

| Signature cible | Contrat | Sources |
| --- | --- | --- |
| `CalculDuPanier.Chiffrer(Panier) -> Facture` | Garder l'appel existant ; déléguer au calcul avec une `GrilleDePaliers` vide, sans configuration implicite globale. | `src/Tarification.Application/CalculDuPanier.cs:19-21`, `tests/Tarification.Tests/CalculDuPanierTests.cs:16-35`, `.skraft/us-2/design/event-model.md:43` |
| `CalculDuPanier.Chiffrer(Panier, GrilleDePaliers) -> Facture` | Entrées explicites, non nulles, grille préalablement validée. Refuser explicitement les entrées nulles en signalant l'entrée manquante ; ne pas les assimiler à une configuration absente. Rendre la facture sans modifier le panier ni la grille. | `.skraft/us-2/design/domain-model.md:17-27`, `src/Tarification.Application/CalculDuPanier.cs:19-21`, `docs/adr/adr-001-decoupage-domaine-application.md:28-30` |

Dans `Facture`, `SommeDesArticles` reste la somme brute de `Panier.SommeDesLignes()`, `Remise` devient la somme des remises de lignes, et `FraisDePort` reste zéro pour US-2. `ATPayer` devient `SommeDesArticles - Remise + FraisDePort` : la remise s'applique effectivement, sans modifier la somme brute. Sources : `stories/US-2.md:3-11`, `.skraft/us-2/design/domain-model.md:19,46,62`, `src/Tarification.Application/CalculDuPanier.cs:5-12,21`.

Le taux plafonné à 100 % garantit que chaque remise est comprise entre zéro et le sous-total ; leur somme ne dépasse donc pas `SommeDesArticles`. La soustraction reste ainsi non négative pour une facture produite par ce cas d'usage. Sources : `.skraft/us-2/research/clarification.md:15`, `src/Tarification.Domaine/LigneDePanier.cs:6`, `src/Tarification.Domaine/Panier.cs:16`, `src/Tarification.Domaine/Montant.cs:13-14`.

## Faits du modèle

`PaliersConfigures` et `ConfigurationDePaliersRejetee` correspondent respectivement à la construction réussie et au rejet explicite. `RemiseDeLigneCalculee` décrit le résultat de chaque ligne ; `PanierChiffre` décrit la facture produite. Le raccord retenu est un calcul synchrone et un retour direct de `Facture`, pas une publication ou une persistance de messages. Les événements restent les faits explicatifs du modèle ; aucune classe de message ou infrastructure de transport n'est exigée par ces contrats. Sources : `.skraft/us-2/design/event-model.md:5,19-26,30-35`, `src/Tarification.Application/CalculDuPanier.cs:19-21`, `docs/adr/adr-001-decoupage-domaine-application.md:40-43`.
