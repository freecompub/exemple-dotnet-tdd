# Modele de domaine — US-2

## Agregat et frontiere de coherence

`Panier` est la racine conceptuelle retenue pour decrire le chiffrage de ses lignes : il possede la collection et en calcule la somme brute. Le code n'a ni identifiant persistant ni mecanisme de transaction pour cette racine ; le terme agregat decrit ici le regroupement metier, non une decision de persistance. Source : `src/Tarification.Domaine/Panier.cs:4-17`.

`LigneDePanier` est un composant de `Panier`, pas un nouvel agregat : elle contient reference, quantite et prix unitaire, et produit son sous-total. La remise est evaluee sur cette seule ligne. La configuration commune n'est pas differenciee par reference. Sources : `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Domaine/Panier.cs:6-16` ; `stories/US-2.md:10` ; `.skraft/us-2/research/clarifications.md:5-6`.

| Element | Responsabilite metier | Sources |
| --- | --- | --- |
| `Panier` | Regrouper les lignes et leurs resultats ; conserver la somme brute et totaliser les remises par ligne | `src/Tarification.Domaine/Panier.cs:6-16` ; `stories/US-1.md:7-9` ; `stories/US-2.md:7-11` |
| `LigneDePanier` | Fournir la base et la quantite de sa propre evaluation, sans mutualiser les quantites | `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `stories/US-2.md:10` |
| `ConfigurationDePaliers` | Decrire une meme collection de paliers pour toutes les lignes ; accepter la collection vide | `.skraft/us-2/research/clarifications.md:5-6` ; `stories/US-2.md:11` |

Le modele ne decide pas si la methode de remise appartient a `Panier`, a `LigneDePanier` ou a une politique de domaine separee. L'evaluation par `ConfigurationDePaliers` decrite dans les contrats et illustree dans les diagrammes est une proposition non tranchee pour la phase suivante. La recherche soumet une politique commune, et l'ADR exige deja que la regle commerciale demeure dans le domaine. Sources : `.skraft/us-2/design/contracts.md:7-9` ; `.skraft/us-2/design/diagrams.md:3` ; `.skraft/us-2/research/research.md:114-116` ; `docs/adr/adr-001-decoupage-domaine-application.md:17-30`.

## Objets-valeurs

Les noms nouveaux ci-dessous fixent le langage des documents suivants, non des signatures C# ou des representations de stockage. Les elements existants sont explicitement distingues des concepts introduits par la story et la clarification. Sources : `src/Tarification.Domaine/Montant.cs:7-25` ; `src/Tarification.Domaine/Quantite.cs:4-14` ; `stories/US-2.md:7-11` ; `.skraft/us-2/design/clarifications.md:5-6`.

| Objet-valeur | Donnees / invariant | Etat et sources |
| --- | --- | --- |
| `Montant` | Euros en `decimal`, non negatifs ; zero disponible | Existant : `src/Tarification.Domaine/Montant.cs:7-16` ; `docs/adr/adr-001-decoupage-domaine-application.md:32-33` |
| `Quantite` | Nombre entier d'articles >= 1 | Existant, pour les lignes : `src/Tarification.Domaine/Quantite.cs:3-12` |
| `SeuilDeQuantite` | Entier >= 1 ; atteint lorsque la quantite de ligne est >= seuil | Concept de seuil : `.skraft/us-2/design/clarifications.md:5-6` ; `stories/US-2.md:7-9` |
| `TauxDeRemise` | Pourcentage decimal, 0 % et 100 % inclus | Concept de taux : `.skraft/us-2/design/clarifications.md:5-6` |
| `PalierDeQuantite` | Couple `SeuilDeQuantite` / `TauxDeRemise` valide | Concept de palier : `stories/US-2.md:7-9` ; `.skraft/us-2/design/clarifications.md:5-6` |
| `ConfigurationDePaliers` | Collection commune de `PalierDeQuantite` ; tout element invalide entraine un rejet explicite, pas une suppression silencieuse | Concept de configuration : `.skraft/us-2/research/clarifications.md:5-6` ; `.skraft/us-2/design/clarifications.md:5-6` ; `stories/US-2.md:11` |

Le seuil et la quantite de ligne ont la meme borne minimale, mais leur fusion en un type unique n'est pas decidee. De meme, aucune contrainte de taux croissants ou d'unicite des seuils n'est ajoutee : la selection porte sur le palier eligible le plus avantageux, sans cumul. Sources : `src/Tarification.Domaine/Quantite.cs:11-12` ; `.skraft/us-2/design/clarifications.md:5-6` ; `stories/US-2.md:9`.

## Regle de remise

Pour une ligne de quantite q, de prix unitaire p, et un palier eligible de taux t en pourcentage, la reduction candidate est `(p x q) x t / 100`. La reduction retenue est le maximum des candidates, ou zero sans candidat. Cette formulation rend exactement 1,00 EUR pour 10 x 2,00 EUR a 5 %, et 12,00 EUR pour 50 x 2,00 EUR a 12 %, sans additionner les taux. Sources : `src/Tarification.Domaine/LigneDePanier.cs:6` ; `stories/US-2.md:7-11`.

Un ex aequo de reduction ne modifie pas le montant rendu ; le modele n'exige pas d'identite de palier gagnant dans la facture. L'absence de configuration n'est pas un echec. Sources : `stories/US-2.md:9-11` ; `src/Tarification.Application/CalculDuPanier.cs:10-13`.

Le calcul de pourcentage et la deduction du net necessitent des operations non presentes dans `Montant`, qui propose actuellement addition, multiplication entiere et comparaison. Leur API et la politique d'arrondi ne sont pas choisies ici. Sources : `src/Tarification.Domaine/Montant.cs:18-25` ; `stories/US-5.md:7-13`.

## Evenements et resultats

| Evenement modele | Fait minimal a decrire | Source |
| --- | --- | --- |
| `ConfigurationDePaliersValidee` | La configuration fournie satisfait les bornes de tous ses paliers | `.skraft/us-2/design/clarifications.md:5-6` |
| `ConfigurationDePaliersRefusee` | La configuration fournie est invalide et explicitement rejetee | `.skraft/us-2/design/clarifications.md:5-6` |
| `PanierChiffre` | Le calcul a produit la somme brute et les remises de ligne composees dans la facture | `stories/US-1.md:7-9` ; `stories/US-2.md:7-11` ; `src/Tarification.Application/CalculDuPanier.cs:10-22` |

Ce sont des faits logiques de validation et de calcul. Ils ne sont pas des mutations persistantes exigees par la story : le code existant construit directement une facture et aucun historique n'est demande par les criteres. Ils n'imposent donc ni emission par une racine, ni bus, ni journal d'evenements. Sources : `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `stories/US-2.md:7-11`.

## Interfaces de depot

Aucune interface de depot n'est requise par ce modele US-2 : `Panier` est fourni au calcul, la story decrit des paliers configures sans exiger leur chargement ou leur sauvegarde, et l'ADR reporte l'infrastructure au besoin reel. Aucun `IPanierRepository` ou depot de configuration n'est introduit. Sources : `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `stories/US-2.md:7-11` ; `docs/adr/adr-001-decoupage-domaine-application.md:39-41`.

La future decision doit definir comment les paliers communs parviennent au calcul sans faire appeler un service exterieur par la regle de domaine. La configuration explicite pour `ChiffrerPanier` et la delegation de l'appel historique a une configuration vide sont des propositions non tranchees du contrat candidat ; le modele ne choisit donc ni injection au constructeur, ni parametre de methode, ni depot. Sources : `.skraft/us-2/design/contracts.md:7-9` ; `src/Tarification.Application/CalculDuPanier.cs:20-22` ; `.skraft/us-2/research/clarifications.md:5-6` ; `docs/adr/adr-001-decoupage-domaine-application.md:28-30`.
