# Modele evenementiel — US-2

## Portee et notation

Le client demande un chiffrage avec remise automatique par ligne ; les paliers sont communs a toutes les references. Le modele ci-dessous nomme les intentions, les faits observables et les vues a reprendre dans les documents suivants. Sources : `stories/US-2.md:3-11` ; `.skraft/us-2/research/clarifications.md:5-6`.

Les noms ci-dessous constituent un vocabulaire de conception, pas des classes deja presentes ni une decision de publication ou de stockage d'evenements. Le code actuel retourne une `Facture` depuis `Chiffrer` et ne comporte aucune emission d'evenements dans ce chemin. Source : `src/Tarification.Application/CalculDuPanier.cs:10-22`.

## Tranches

| Intention / commande | Donnees connues | Fait / evenement modele | Vue et resultat | Sources |
| --- | --- | --- | --- | --- |
| `ValiderConfigurationDePaliers` | Collection commune de couples seuil/taux ; collection vide admise | `ConfigurationDePaliersValidee` si chaque seuil est entier >= 1 et chaque taux decimal est dans [0 %, 100 %] | `ResultatDeValidationDesPaliers` : configuration acceptee | `.skraft/us-2/design/clarifications.md:5-6` ; `.skraft/us-2/research/clarifications.md:5-6` ; `stories/US-2.md:11` |
| `ValiderConfigurationDePaliers` | Configuration contenant un seuil ou un taux hors contrat | `ConfigurationDePaliersRefusee` | `ResultatDeValidationDesPaliers` : rejet explicite ; aucun resultat de validation positif | `.skraft/us-2/design/clarifications.md:5-6` |
| `ChiffrerPanier` | Lignes : reference, quantite, prix unitaire ; configuration commune valide | `PanierChiffre` | `Facture` : somme brute des articles, remise totale ; detail logique `RemiseDeLigne` pour expliquer et verifier chaque calcul | `stories/US-2.md:3-11` ; `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Application/CalculDuPanier.cs:10-22` ; `stories/US-1.md:3-9` |

`ValiderConfigurationDePaliers` represente le controle du contrat fourni par le metier, non une fonctionnalite d'administration ou d'enregistrement des paliers. Ces dernieres ne sont pas decrites par l'US-2 ; la signature actuelle ne recoit aucune configuration. Le rejet explicite est acquis, mais son point d'invocation et sa forme ne sont pas fixes ici : validation a construction et exceptions decrites dans les contrats sont des propositions non tranchees pour la phase suivante. Sources : `.skraft/us-2/design/contracts.md:7-9` ; `stories/US-2.md:3-11` ; `.skraft/us-2/design/clarifications.md:5-6` ; `src/Tarification.Application/CalculDuPanier.cs:20-22`.

## Chronologie logique

```text
`ValiderConfigurationDePaliers`
  -> `ConfigurationDePaliersValidee` -> `ResultatDeValidationDesPaliers`
  ou `ConfigurationDePaliersRefusee` -> `ResultatDeValidationDesPaliers`

Configuration valide + lignes
  -> `ChiffrerPanier` -> `PanierChiffre` -> `Facture`
```

Cette chronologie distingue validation et calcul sans imposer deux appels publics, un transport ou un traitement asynchrone. Ses deux intentions derivent du rejet explicite demande et du chiffrage existant. Sources : `.skraft/us-2/design/clarifications.md:5-6` ; `src/Tarification.Application/CalculDuPanier.cs:20-22`.

## Calcul observable

Pour chaque ligne, la base est son prix unitaire multiplie par sa quantite. Les paliers eligibles sont ceux dont le seuil est atteint par cette seule quantite. La remise est la plus grande reduction offerte par un seul palier eligible, ou zero si aucun ne l'est. Les remises des lignes composent la remise du panier ; les quantites ne sont jamais additionnees pour rendre un palier eligible. Sources : `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `stories/US-2.md:7-11`.

| Scenario Given / When `ChiffrerPanier` | Then `PanierChiffre` : remise observable | Source |
| --- | --- | --- |
| Seuil 10 / 5 %, ligne 9 x 2,00 EUR | `RemiseDeLigne` = 0,00 EUR ; `Facture.Remise` = 0,00 EUR | `stories/US-2.md:7` |
| Seuil 10 / 5 %, ligne 10 x 2,00 EUR | `RemiseDeLigne` = 1,00 EUR ; `Facture.Remise` = 1,00 EUR | `stories/US-2.md:8` |
| Seuils 10 / 5 % et 50 / 12 %, ligne 50 x 2,00 EUR | `RemiseDeLigne` = 12,00 EUR ; pas 17,00 EUR de cumul | `stories/US-2.md:9` |
| Seuil 10 / 5 %, deux references differentes, chacune a 6 unites | Chaque `RemiseDeLigne` = 0,00 EUR ; remise totale = 0,00 EUR | `stories/US-2.md:10` |
| Aucun palier | Remise = 0,00 EUR | `stories/US-2.md:11` |

## Vues et compatibilite

`RemiseDeLigne` nomme un resultat de calcul : ligne concernee, base brute et montant de remise. L'association a la ligne ne requiert pas de nouvel identifiant : le panier conserve les lignes ajoutees et chaque ligne porte sa reference. L'exposition publique de ce detail reste a decider ; la facture actuelle ne contient qu'un montant global de remise. Sources : `src/Tarification.Domaine/Panier.cs:6-16` ; `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `src/Tarification.Application/CalculDuPanier.cs:10-13` ; `stories/US-2.md:10`.

`Facture.SommeDesArticles` conserve le brut fixe par l'US-1. `Facture.Remise` rend la reduction totale. Le raccordement a `ATPayer` doit etre examine : aujourd'hui il additionne articles et port sans deduction, tandis que les stories suivantes emploient un total apres remises. Sources : `stories/US-1.md:7-9` ; `src/Tarification.Application/CalculDuPanier.cs:10-13` ; `stories/US-3.md:11` ; `stories/US-4.md:10`.

Le modele n'ajoute ni motif de refus commercial pour absence de palier, ni evenement de stock ou de promotion : sans palier la remise vaut zero ; les refus de stock et le cumul promotionnel appartiennent a d'autres stories. Sources : `stories/US-2.md:11` ; `stories/US-6.md:7-11` ; `stories/US-3.md:13-15`.
