# US-2 - Modele du domaine

## Statut du modele

Le modele complete les concepts existants pour decrire les regles US-2. Les frontieres d'agregats ci-dessous sont des candidats de modelisation, pas une nouvelle decision d'architecture ; l'existant est un panier en memoire chiffre par un cas d'usage. Sources : `src/Tarification.Domaine/Panier.cs:4-17` ; `src/Tarification.Application/CalculDuPanier.cs:20-23` ; `docs/adr/adr-001-decoupage-domaine-application.md:40-42`.

## Agregats et objets contenus

| Element | Role dans le modele | Identite et cycle de vie observes | Source |
| --- | --- | --- | --- |
| `Panier` | Candidat racine : contient les lignes et fournit le perimetre du chiffrage. Somme les montants, mais ne somme pas les quantites pour declencher une remise | Aucune identite persistante exposee ; lignes ajoutees avec `Ajoute` ; panier fourni directement a `Chiffrer` | `src/Tarification.Domaine/Panier.cs:4-17` ; `src/Tarification.Application/CalculDuPanier.cs:22` ; `stories/US-2.md:10` |
| `LigneDePanier` | Objet-valeur contenu, pas racine distincte : porte les donnees necessaires a l'evaluation independante de la remise | Record de reference, quantite et prix ; aucune identite propre exposee | `src/Tarification.Domaine/LigneDePanier.cs:3-7` ; `stories/US-2.md:7-11` |
| `PalierDeQuantite` | Objet-valeur a modeliser : seuil et pourcentage ; pas un agregat d'administration | US-2 donne des couples seuil/pourcentage, sans identite ni mutation de palier | `stories/US-2.md:7-14` |
| `PaliersDeQuantite` | Ensemble de valeurs utilise pour toutes les lignes ; ensemble vide autorise | Portee commune aux references ; aucun cycle de persistance specifie | `.skraft/us-2/research/research.md:10-11` ; `stories/US-2.md:11-14` |

L'independance du calcul de chaque ligne est une regle de calcul, non une obligation de transaction ou de persistance par ligne. Le code actuel additionne deja des sous-totaux derives des lignes. Sources : `stories/US-2.md:10` ; `src/Tarification.Domaine/LigneDePanier.cs:6` ; `src/Tarification.Domaine/Panier.cs:17`.

## Objets-valeurs et donnees

| Concept | Donnees et contraintes etayees | Source |
| --- | --- | --- |
| `Quantite` | Entier d'au moins un article ; construction rejetee sous un | `src/Tarification.Domaine/Quantite.cs:4-11` |
| `Montant` | Somme en euros, `decimal`, non negative ; zero, addition et multiplication par quantite disponibles | `src/Tarification.Domaine/Montant.cs:3-22` ; `docs/adr/adr-001-decoupage-domaine-application.md:32-33` |
| `LigneDePanier` | `Reference`, `Quantite`, `PrixUnitaire` ; `SousTotal = PrixUnitaire x Quantite` | `src/Tarification.Domaine/LigneDePanier.cs:4-6` |
| `PalierDeQuantite` | Seuil inclusif et taux en pourcentage, exemples 10 / 5 % et 50 / 12 % | `stories/US-2.md:7-9` |
| `PaliersDeQuantite` | Collection commune ; pas de filtre par reference ; peut ne contenir aucun palier | `.skraft/us-2/research/research.md:10-11` ; `stories/US-2.md:11` |

Le taux est une donnee du palier, sans objet-valeur supplementaire impose dans ce modele. US-2 fournit les exemples 5 % et 12 %, mais ne donne pas de regle de validation generale des taux ni de gestion des doublons de seuil. Ce document ne prescrit pas de bornes ni de rejet additionnels. Source : `stories/US-2.md:7-14`.

## Regles de calcul

Pour une ligne de quantite `q`, de prix unitaire `p`, et un palier de seuil `s` et de taux `t` exprime en pourcentage :

1. Le sous-total brut vaut `p x q`. Source : `src/Tarification.Domaine/LigneDePanier.cs:6`.
2. Le palier est applicable si `q >= s` : le seuil est inclusif. Sources : `stories/US-2.md:7-8`.
3. Sa remise candidate vaut `(p x q) x t / 100`. Les exemples donnent 20 x 5 / 100 = 1 et 100 x 12 / 100 = 12. Sources : `stories/US-2.md:8-9`.
4. La remise de la ligne est la plus elevee parmi les remises candidates applicables ; aucun cumul de paliers. Sans candidat, elle vaut zero. Sources : `stories/US-2.md:7-9,11`.
5. Chaque ligne est evaluee avec les memes paliers, independamment des autres lignes ; ni regroupement de lignes ni somme de quantites au niveau du panier. Sources : `stories/US-2.md:10` ; `.skraft/us-2/research/research.md:10-11`.
6. La remise de quantite rendue pour le panier est la somme des remises de ses lignes ; `SommeDesArticles` conserve sa signification brute. Sources : `stories/US-2.md:7-11` ; `stories/US-1.md:7-9` ; `src/Tarification.Domaine/Panier.cs:17` ; `src/Tarification.Application/CalculDuPanier.cs:10-13`.

Le plus grand seuil n'est pas la definition du plus avantageux : le critere impose de maximiser la remise parmi les paliers atteints, sans affirmer que les taux sont croissants. Source : `stories/US-2.md:9`.

## Evenements

`PanierChiffre` est le fait logique correspondant au resultat de `ChiffrerPanier` : somme brute et remise de quantite determinees. Aucun evenement de changement de configuration n'est modelise, car US-2 decrit seulement l'application de paliers configures. Sources : `.skraft/us-2/design/event-model.md:7-20` ; `stories/US-2.md:6-14`.

Le code existant ne leve pas d'evenement de domaine et ne modifie pas le panier lors du chiffrage ; `PanierChiffre` ne doit donc pas etre interprete comme une emission technique ou un nouvel etat persiste deja decides. Sources : `src/Tarification.Application/CalculDuPanier.cs:20-23` ; `src/Tarification.Domaine/Panier.cs:4-17`.

## Interfaces de depot

**Aucune interface de depot n'est requise par les interactions observees pour US-2.** `Chiffrer` recoit le panier directement ; US-2 ne demande pas de sauvegarde ou de recherche de panier ni de gestion persistante des paliers. L'ADR existant indique explicitement que le projet n'a pas encore de stockage. Sources : `src/Tarification.Application/CalculDuPanier.cs:22` ; `stories/US-2.md:6-14` ; `docs/adr/adr-001-decoupage-domaine-application.md:40-42`.

La provenance et le stockage des paliers ne sont donc pas convertis ici en un contrat de depot invente. Si la phase suivante introduit une dependance exterieure, la contrainte existante est que la regle de domaine ne l'appelle pas directement. Source : `docs/adr/adr-001-decoupage-domaine-application.md:28-30`.

## Points a instruire a l'etape suivante

| Point | Constat source, sans verdict architectural |
| --- | --- |
| Porteur du calcul et entree des paliers | Le domaine porte les regles commerciales ; le point d'entree actuel ne recoit que le panier. `docs/adr/adr-001-decoupage-domaine-application.md:15-21` ; `src/Tarification.Application/CalculDuPanier.cs:22` |
| Montant payable | `ATPayer` additionne les articles et le port sans deduire la remise ; les stories suivantes parlent explicitement de total reduit. `src/Tarification.Application/CalculDuPanier.cs:12` ; `stories/US-3.md:11` ; `stories/US-4.md:10` |
| Arrondis | US-5 decrit l'arrondi de la remise rendue au client et interdit les arrondis intermediaires enchaines. `stories/US-5.md:8-10` |
| Cumul promotionnel | US-3 porte le code promotionnel et la question de son interaction avec US-2. `stories/US-3.md:7-15` |
