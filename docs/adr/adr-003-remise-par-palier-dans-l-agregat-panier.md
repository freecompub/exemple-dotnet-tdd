# ADR-003 — Remise par palier portée par l'agrégat Panier, barème passé en valeur

- Statut : Accepted
- Date : 2026-11-08
- Story : us-2

## Contexte

US-2 introduit une remise calculée **par ligne, jamais sur le panier entier** : deux lignes de
6 articles de références différentes ne déclenchent pas le palier de 10 (`stories/US-2.md:10`).
Un seul palier s'applique, le plus avantageux (`stories/US-2.md:9`). Les paliers sont les mêmes
pour toutes les références : une seule liste globale (`.skraft/us-2/passation.md:5`, `:10`).

Il faut donc décider où vit cette règle et quelle frontière d'agrégat la porte :

- ADR-001 impose que les règles commerciales, dont les paliers de remise, soient dans
  `Tarification.Domaine` (`docs/adr/adr-001-decoupage-domaine-application.md:8`, `:25-26`), et
  qu'une règle qui a besoin d'une donnée extérieure se la fasse passer plutôt que de l'appeler
  (`adr-001:28-30`). ADR-001 cite `Panier` parmi les règles (`adr-001:17-18`) mais ne fixe pas
  de frontière d'agrégat : aucun ADR ne justifie aujourd'hui l'Agrégat `Panier`.
- L'Agrégat `Panier` contient déjà ses lignes et le calcul `SommeDesLignes`
  (`src/Tarification.Domaine/Panier.cs:6-16`). L'invariant d'ac-4 porte sur l'ensemble des
  lignes d'un même panier (`.skraft/us-2/design/domain-model.md:28`).
- Le barème n'a, dans US-2, ni identité ni cycle de vie : aucun critère ne décrit une action pour
  le configurer (`.skraft/us-2/design/event-model.md:16-18`), et le projet n'a aucun stockage
  (`adr-001:40-42`).
- Le cas d'usage `CalculDuPanier` est construit sans argument par les steps existants
  (`tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs:26`).

Forces en tension : **simplicité** (aucun type à identité, aucun dépôt) contre **évolutivité**
(si un jour le barème se configure et se stocke, il deviendra une donnée chargée, pas une valeur
écrite en dur) ; **cohérence** avec l'existant (`SommeDesLignes` sur `Panier`) contre la
tentation d'un service séparé.

## Décision

L'Agrégat `Panier` reste la seule racine du chiffrage et porte l'invariant « la remise du panier
est la somme des remises de ses lignes, chaque ligne évaluée sur sa seule quantité », via
`RemiseDesLignes(BaremeDeRemises) : Montant`. L'objet-valeur `BaremeDeRemises` (liste
d'objets-valeurs `PalierDeRemise`, chacun composé d'un seuil `Quantite` et d'un objet-valeur
`Pourcentage`) est passé en argument : il n'est ni un agrégat ni référencé par `Panier`. Le cas
d'usage `CalculDuPanier` reçoit le `BaremeDeRemises` par son constructeur ; son constructeur sans
argument équivaut à `BaremeDeRemises.Aucun`.

## Conséquences

Positives :
- La règle « par ligne » (ac-4) ne peut être écrite qu'à un endroit, dans le domaine, au même
  niveau que `SommeDesLignes` (`Panier.cs:16`) ; elle se teste sans montage (`adr-001:28-30`).
- `new CalculDuPanier()` et les scénarios US-1 restent valides sans modification
  (`ChiffrageDuPanierSteps.cs:26`) ; ce constructeur couvre aussi ac-5.
- Aucun dépôt, aucune couche d'infrastructure n'est ajoutée, conformément à `adr-001:40-42`.

Négatives / compromis :
- Le barème étant une valeur fournie à la construction, l'appelant doit le connaître. Si une story
  ultérieure demande de configurer ou stocker les paliers, il faudra introduire une interface
  dans `Tarification.Application` pour le fournir, et réviser cet ADR.
- La signature publique de `Panier` grandit d'une opération qui dépend d'un type de remise :
  l'agrégat connaît désormais le barème.
- Un constructeur sans argument qui choisit silencieusement « aucun palier » peut masquer un
  oubli de configuration chez un futur appelant.

Neutre :
- `Facture.ATPayer` n'est pas modifié par cette décision (`src/Tarification.Application/CalculDuPanier.cs:12`) ;
  aucun critère d'US-2 ne porte sur le montant à payer (`stories/US-2.md:7-11`).

## Alternatives

| Alternative | Raison du rejet |
|---|---|
| Faire sans le patron : calcul de la remise directement dans `CalculDuPanier` (couche application), sans opération sur l'agrégat | Place une règle commerciale hors du domaine, contraire à `adr-001:25-26` ; écartée aussi par la recherche (`.skraft/us-2/research/research.md:73-78`). |
| Faire de `BaremeDeRemises` un agrégat distinct, chargé par un dépôt | Aucun critère ne lui donne d'identité ni de cycle de vie (`event-model.md:16-18`) et le projet n'a aucun stockage (`adr-001:40-42`) : un dépôt serait une couche d'infrastructure prématurée. |
| Faire référencer le barème par `Panier` (champ de l'agrégat) | Le barème est global, le même pour tous les paniers (`passation.md:5`) : le recopier dans chaque panier lui donnerait un état qu'il n'a pas, et `Panier.Ajoute` (`Panier.cs:10-14`) devrait le recevoir ou un constructeur devrait changer. |
| Barème indexé par référence | Contraire à la décision utilisateur, paliers globaux (`passation.md:5`, `:10`). |
| Remise calculée sur la quantité cumulée du panier | Contraire à ac-4 (`stories/US-2.md:10`). |
