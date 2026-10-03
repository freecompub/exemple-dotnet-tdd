# Modèle d'événements — US-2 : Remise par palier de quantité

## Décision validée

Réponse utilisateur (voir passation) : les paliers sont les mêmes pour toutes les références — une
seule grille globale, pas de configuration par référence. Ce choix écarte tout mécanisme
d'association Référence → grille (pas de catalogue à introduire pour cette story).

## Timeline

```
timeline
    title Chiffrage d'un panier avec remise de palier — Event Timeline
    section Command
        ChiffrerPanier : Soumise par le Client, avec le Panier et la GrilleDePaliers en vigueur
    section Event
        PanierChiffre : Raised par le cas d'usage CalculDuPanier
    section Read Model
        Facture : Consultée par le Client avant paiement
```

- Commande `ChiffrerPanier` : intention « je veux connaître le montant à payer pour ce panier,
  compte tenu de la grille de paliers en vigueur ». Portée par le cas d'usage déjà en place
  (`src/Tarification.Application/CalculDuPanier.cs:16-19` — `CalculDuPanier.Chiffrer`), qui devra
  recevoir en plus la `GrilleDePaliers` à appliquer (aujourd'hui `Chiffrer(Panier panier)` ne prend
  pas de grille : `src/Tarification.Application/CalculDuPanier.cs:19`).
- Événement `PanierChiffre` : fait établi « le panier a été chiffré, avec telle somme des articles,
  telle remise, tel montant à payer ». Il n'existe aujourd'hui aucune trace explicite de cet
  événement dans le code — le projet ne fait pas d'event sourcing (aucun event store, aucun bus ;
  `CalculDuPanier.Chiffrer` retourne directement une `Facture` — `src/Tarification.Application/CalculDuPanier.cs:19`).
  Il est documenté ici pour le modèle de comportement, mais son unique matérialisation restera le
  retour synchrone de `Chiffrer`, pas un fait persisté. Aucune autre US consultée (`stories/US-*.md`)
  n'exige une trace de ce fait dans le temps ; pas de justification pour l'event sourcing au sens du
  catalogue de patterns (pas de besoin d'audit ni de requête temporelle identifié).
- Vue `Facture` : déjà existante (`src/Tarification.Application/CalculDuPanier.cs:9-13`). Le champ
  `Remise` cessera d'être figé à `Montant.Zero` (actuellement en dur :
  `src/Tarification.Application/CalculDuPanier.cs:19`) ; il portera la somme des remises calculées
  ligne par ligne.

## Slice unique

Une seule tranche de valeur couvre toute la story : « chiffrer un panier en tenant compte des
paliers de quantité ». Les 5 critères d'acceptation ne distinguent pas de sous-commande ni de
sous-vue : ce sont des variations de données (0, 1, ou 2 paliers configurés ; seuil atteint ou non ;
lignes indépendantes) sur la même commande/événement/vue.

## Calcul par ligne (rappel du critère 4)

Le calcul de remise n'a besoin d'aucune information au-delà d'une `LigneDePanier` et de la
`GrilleDePaliers` : pas d'agrégation entre lignes. `Panier.SommeDesLignes()` agrège déjà les
`SousTotal` ligne par ligne (`src/Tarification.Domaine/Panier.cs:16`) ; la remise totale de la
facture suit le même principe (somme des remises de chaque ligne, calculées indépendamment).

## Point non tranché, transmis à la conception d'architecture

Le mécanisme exact pour que `ChiffrerPanier` / `CalculDuPanier.Chiffrer` dispose de la
`GrilleDePaliers` (nouveau paramètre de méthode vs. champ construit) est un choix de câblage, pas
un choix de modèle d'événements — voir `domain-model.md` et la liste des ADR à reconsidérer.
