# US-2 - Carte des contextes

## Perimetre metier observe

Le contexte de modelisation est **Tarification** : lignes du panier, montants et regles commerciales de prix. Le depot presente ce domaine comme la tarification d'un panier ; l'ADR existant y inclut deja paliers, promotions, frais de port et arrondis. Sources : `README.md:8-10` ; `docs/adr/adr-001-decoupage-domaine-application.md:8-11`.

Les paliers communs et leur application par ligne sont modelises dans ce meme perimetre. La story ne decrit pas un cycle de gestion autonome des paliers : aucune frontiere supplementaire de contexte n'est arretee ici. Sources : `stories/US-2.md:3-14` ; `.skraft/us-2/research/research.md:10-11`.

```mermaid
flowchart LR
    Client["Client (acteur)"] -->|"`ChiffrerPanier`"| Tarification["Tarification (perimetre metier)"]
    Tarification -->|"`PanierChiffre` : resultat de chiffrage"| Facture["`Facture` (vue du client)"]
```

Dans ce diagramme, les libelles correspondent a la commande `ChiffrerPanier`, au fait `PanierChiffre` et a la vue `Facture` definis dans le modele d'evenements ; le client et la facture ne sont pas des bounded contexts. Sources : `.skraft/us-2/design/event-model.md:7-20` ; `stories/US-2.md:3-4` ; `src/Tarification.Application/CalculDuPanier.cs:10-23`.

## Frontieres existantes, distinctes des contextes

| Element du code | Responsabilite observee | Relation existante | Source |
| --- | --- | --- | --- |
| `Tarification.Domaine` | Types-valeurs, panier, lignes et regles commerciales | Ne depend d'aucune autre couche | `docs/adr/adr-001-decoupage-domaine-application.md:15-18` |
| `Tarification.Application` | Point d'entree du chiffrage et facture retournee | Depend du domaine ; appelle le calcul du panier | `docs/adr/adr-001-decoupage-domaine-application.md:20-21` ; `src/Tarification.Application/CalculDuPanier.cs:1-23` |

Cette separation est une separation de couches deja acceptee, pas la preuve de deux contextes metier distincts. Source : `docs/adr/adr-001-decoupage-domaine-application.md:13-21`.

## Relations avec les stories voisines

| Sujet | Donnee ou resultat partage avec US-2 | Portee de la relation | Source |
| --- | --- | --- | --- |
| Chiffrage brut, US-1 | Somme des sous-totaux de ligne | Comportement livre a preserver | `stories/US-1.md:7-13` ; `src/Tarification.Domaine/Panier.cs:17` |
| Promotions, US-3 | Remise et total du panier ; question du cumul | Interaction de regles de tarification, non contrat d'integration deja etabli | `stories/US-3.md:7-15` |
| Frais de port, US-4 | Montant apres remises pour apprecier le seuil | Dependance metier : remise avant evaluation du seuil | `stories/US-4.md:10` |
| Arrondis, US-5 | Montants rendus au client, dont remise | Arrondi final distinct des valeurs intermediaires | `stories/US-5.md:7-10` |
| Stock / catalogue, US-6 | Reference et quantite des lignes | Besoin exterieur annonce par US-6, pas integration US-2 existante | `stories/US-6.md:7-15` ; `docs/adr/adr-001-decoupage-domaine-application.md:40-42` |

US-6 mentionne un catalogue, mais le choix de sa frontiere et de son contrat reste distinct du calcul de remise US-2. Aucune relation ACL, Conformist, Shared Kernel ou OHS/PL n'est attribuee ici : aucun contrat entre deux contextes n'est decrit par US-2 ou par son point d'entree actuel. Sources : `stories/US-2.md:6-14` ; `stories/US-6.md:7-15` ; `src/Tarification.Application/CalculDuPanier.cs:20-23`.

## Langage du contexte

| Terme | Sens dans Tarification | Source |
| --- | --- | --- |
| Reference | Reference de l'article d'une ligne ; des references differentes ne cumulent pas leurs quantites pour atteindre un palier | `src/Tarification.Domaine/LigneDePanier.cs:3-7` ; `stories/US-2.md:10` |
| Ligne | Reference, quantite, prix unitaire ; unite d'evaluation de la remise | `src/Tarification.Domaine/LigneDePanier.cs:3-7` ; `stories/US-2.md:10` |
| Palier | Seuil inclusif de quantite associe a un pourcentage | `stories/US-2.md:7-9` |
| Plus avantageux | Parmi les paliers atteints par une ligne, celui qui donne la remise la plus elevee ; pas l'addition de plusieurs remises | `stories/US-2.md:9` |
| Remise de quantite | Reduction calculee sur une ligne ; zero sans palier applicable | `stories/US-2.md:7-11` |
| Somme des articles | Somme brute des sous-totaux | `stories/US-1.md:7-9` ; `src/Tarification.Domaine/Panier.cs:17` |
| `Panier` | Ensemble de lignes retenues par le client ; peut etre vide | `src/Tarification.Domaine/Panier.cs:3-17` |
| `Facture` | Resultat du chiffrage avec somme des articles, remise, frais de port et montant payable | `src/Tarification.Application/CalculDuPanier.cs:5-13` |
