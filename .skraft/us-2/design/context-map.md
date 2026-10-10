# Carte des contextes — US-2

## Frontiere observee

Le contexte metier modele est la **Tarification du panier** : lignes, quantites, montants et remise par palier. Le domaine porte les regles ; l'application porte le cas d'usage. Ce sont les deux couches deja decidees par l'ADR-001, pas deux contextes metier distincts. Sources : `docs/adr/adr-001-decoupage-domaine-application.md:8-21` ; `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `stories/US-2.md:3-11`.

```text
Client
  -> intention `ChiffrerPanier`
  -> [Tarification du panier : `Panier`, lignes, configuration commune]
  -> fait `PanierChiffre`
  -> vue `Facture`

Donnees communes de paliers
  -> intention `ValiderConfigurationDePaliers`
  -> [Tarification du panier]
  -> `ConfigurationDePaliersValidee` ou `ConfigurationDePaliersRefusee`
```

Les noms de cette carte sont ceux des tranches de comportement ; leurs donnees et sorties reposent sur la story, le contrat de validation et la facture existante. Aucune origine technique de la configuration n'est attribuee : le cas d'usage actuel ne la recoit pas. Sources : `stories/US-2.md:3-11` ; `.skraft/us-2/design/clarifications.md:5-6` ; `.skraft/us-2/research/clarifications.md:5-6` ; `src/Tarification.Application/CalculDuPanier.cs:10-22`.

## Langage du contexte

| Terme | Sens dans Tarification | Sources |
| --- | --- | --- |
| Reference | Reference de l'article sur une ligne ; ce n'est pas une cle de configuration des paliers | `src/Tarification.Domaine/LigneDePanier.cs:4` ; `.skraft/us-2/research/clarifications.md:5-6` |
| Ligne | Reference, quantite et prix unitaire ; unite d'evaluation d'un palier | `src/Tarification.Domaine/LigneDePanier.cs:4-6` ; `stories/US-2.md:10` |
| Palier | Seuil de quantite et taux de remise ; eligible des que le seuil est atteint | `stories/US-2.md:7-9` ; `.skraft/us-2/design/clarifications.md:5-6` |
| Plus avantageux | Plus grande reduction parmi les paliers eligibles ; un seul palier contribue | `stories/US-2.md:9` |
| Somme des articles | Somme brute des sous-totaux des lignes | `stories/US-1.md:7-9` ; `src/Tarification.Domaine/Panier.cs:16` |
| Remise | Reduction calculee par ligne, rendue globalement par la facture | `stories/US-2.md:7-11` ; `src/Tarification.Application/CalculDuPanier.cs:10` |

## Voisinages et limites

| Sujet voisin | Lien metier documente | Limite du modele US-2 | Sources |
| --- | --- | --- | --- |
| Code promotionnel | Reduction au niveau du panier | Ni regle de cumul ni priorite decidee | `stories/US-3.md:3-15` |
| Frais de port | Seuil apprecie apres remises | Ni calcul du port ni politique par pays ajoutes | `stories/US-4.md:7-13` |
| Arrondi | Montants rendus au client et total faisant foi | Aucune nouvelle politique d'arrondi adoptee ici | `stories/US-5.md:7-13` |
| Catalogue / stock | Verification d'une reference et de la quantite disponible | Pas de reservation ni de depot de stock pour US-2 | `stories/US-6.md:7-14` ; `docs/adr/adr-001-decoupage-domaine-application.md:39-41` |

Ces voisinages ne constituent pas une proposition de services ou de bounded contexts supplementaires. L'ADR-001 reporte une couche infrastructure au besoin reel de stockage ou d'interface ; l'US-2 exprime un calcul et une configuration commune, pas une integration externe. Aucun lien ACL, Conformist, Shared Kernel ou contrat publie n'est donc choisi dans cette carte. Sources : `docs/adr/adr-001-decoupage-domaine-application.md:39-41` ; `stories/US-2.md:3-11` ; `.skraft/us-2/research/clarifications.md:5-6`.
