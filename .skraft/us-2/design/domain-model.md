# Modèle de domaine — US-2 : Remise par palier de quantité

Contexte : **Tarification** (seul contexte identifié — voir `context-map.md`). Tout ce qui suit vit
dans `Tarification.Domaine`, sans dépendance externe, conformément à
`docs/adr/adr-001-decoupage-domaine-application.md`.

## Objets-valeurs existants, réutilisés tels quels

- `Montant` (`src/Tarification.Domaine/Montant.cs:7-23`) : somme en euros, jamais négative,
  fabrique `Montant.De(decimal)`.
- `Quantite` (`src/Tarification.Domaine/Quantite.cs:5-13`) : nombre d'articles, minimum 1, fabrique
  `Quantite.De(int)`.
- `LigneDePanier` (`src/Tarification.Domaine/LigneDePanier.cs:4-7`) : `Reference`, `Quantite`,
  `PrixUnitaire`, expose déjà `SousTotal`.
- `Panier` (`src/Tarification.Domaine/Panier.cs:4-16`) : collection de lignes,
  `SommeDesLignes()` agrège ligne par ligne.

## Objets-valeurs nouveaux

### `Taux`

Représente un pourcentage de remise. Suit le style déjà en place pour les autres types-valeurs du
domaine (`Montant.De`, `Quantite.De` : constructeur privé + fabrique validante qui lève
`ArgumentOutOfRangeException`, voir `src/Tarification.Domaine/Montant.cs:7-15` et
`src/Tarification.Domaine/Quantite.cs:5-9`).

- Porte une valeur `decimal` entre 0 (inclus) et 1 (inclus) — 5 % s'écrit `Taux.De(0.05m)`.
- Invariant : une valeur hors de `[0, 1]` lève `ArgumentOutOfRangeException`. Justification : les
  trois exemples de la story (5 %, 12 %) sont dans cet intervalle ; aucune story consultée
  n'évoque de remise supérieure à 100 % d'une ligne ou négative. Borne haute à confirmer en
  conception si un cas > 100 % devait exister (aucun indice qu'il existe).

### `Palier`

Un couple seuil/taux : « à partir de X articles, Y % de remise ».

- Champs : `Seuil` (`Quantite`), `Taux` (`Taux`).
- Pas d'invariant croisé supplémentaire identifié entre `Seuil` et `Taux` dans les critères
  d'acceptation.

### `GrilleDePaliers`

Collection de `Palier`, représentant la règle « quel taux s'applique pour telle quantité ».

- Peut être vide (critère 5 : aucun palier configuré → remise `Montant.Zero`).
- Expose `PalierApplicable(Quantite quantite)`, qui retourne le `Palier` le plus avantageux parmi
  ceux dont le seuil est atteint ou dépassé (ou aucun si la grille est vide ou si aucun seuil n'est
  atteint). « Le plus avantageux » se résout au taux maximal parmi les paliers atteints : à
  `SousTotal` fixe, la remise ne dépend que du taux retenu, donc maximiser la remise équivaut
  exactement à maximiser le taux — lecture directe du mot « avantageux » du critère 3, qui ne
  laisse pas de question métier ouverte même pour une grille non monotone.
- Règle de sélection vérifiée par les critères : avec « 10 : 5 % » et « 50 : 12 % », une quantité de
  50 retient 12 % (critère 3), ce qui est cohérent avec « taux maximal parmi les paliers atteints ».
- Grille **globale**, unique pour toutes les références (réponse utilisateur, voir
  `event-model.md`) : pas de clé par référence, pas d'association à construire.

## Agrégats

Aucun nouvel agrégat. `LigneDePanier` et `Panier` restent les seuls agrégats du domaine ; US-2 ne
change pas leurs frontières de cohérence — elle ajoute une opération dérivée, dans le même esprit
que `SousTotal` (`src/Tarification.Domaine/LigneDePanier.cs:6`), qui est déjà un calcul dérivé exposé
directement sur `LigneDePanier`.

### `LigneDePanier.Remise(GrilleDePaliers grille)` (nouvelle opération)

- Entrée : la `GrilleDePaliers` à appliquer (passée en paramètre — pas stockée sur la ligne elle-même,
  puisque la grille est globale et non liée à la référence de la ligne).
- Sortie : un `Montant` — `Montant.Zero` si aucun palier de la grille n'est atteint par
  `Quantite`, sinon `SousTotal` multiplié par le `Taux` du palier retenu.
- Ne regarde que ses propres champs (`Quantite`, `PrixUnitaire` via `SousTotal`) et la grille reçue
  en paramètre : aucune donnée d'une autre ligne n'intervient, ce qui satisfait structurellement le
  critère 4 (deux lignes de 6 articles de références différentes restent calculées indépendamment,
  chacune à 0 — en dessous du seuil de 10 — sans jamais être sommées avant le calcul de remise).

### `Panier` — remise totale

Le cas d'usage `CalculDuPanier.Chiffrer` doit produire une `Facture.Remise` qui est la somme des
remises de chaque ligne : `Panier.SommeDesRemises(GrilleDePaliers grille)`, symétrique à
`SommeDesLignes()` (`src/Tarification.Domaine/Panier.cs:16`) — agrège les résultats de
`LigneDePanier.Remise` déjà calculés indépendamment par ligne, ce qui respecte le critère 4 (pas de
fusion de quantités avant calcul, seulement une somme des montants obtenus).

## Opération à ajouter sur `Montant`

`Montant` n'a aujourd'hui ni multiplication par un `decimal`/`Taux`, ni soustraction
(`src/Tarification.Domaine/Montant.cs:17-18` : seule `Multiplie(int)` existe). Deux besoins
découlent de cette story :

1. **Multiplication par un taux** : nécessaire pour `SousTotal × Taux` dans
   `LigneDePanier.Remise`. Doit rester dans l'invariant « jamais négatif » — un `Taux` étant borné
   à `[0, 1]`, le résultat est toujours positif ou nul si `SousTotal` l'est (ce qu'il est toujours,
   `Montant` ne pouvant être négatif).
2. **Soustraction sûre** pour `Facture.ATPayer`, qui aujourd'hui ne soustrait pas `Remise`
   (`src/Tarification.Application/CalculDuPanier.cs:12` : `SommeDesArticles + FraisDePort`, sans
   `- Remise`). Ce bug latent, invisible tant que `Remise` valait `Montant.Zero`, devient visible
   dès qu'US-2 rend `Remise` non nulle — la recherche l'a signalé explicitement (voir
   `research.md`, section Découvertes). Une remise calculée comme un pourcentage du `SousTotal` de
   chaque ligne est toujours inférieure ou égale au `SousTotal`, donc `SommeDesArticles - Remise`
   ne peut jamais devenir négatif : une soustraction sûre (sans levée d'exception dans ce cas
   d'usage) est possible sans assouplir l'invariant « pas de montant négatif ».

Le nom exact de ces opérations (`Multiplie(Taux)`, `Soustrait(Montant)`, ou autre) est un choix de
conception d'architecture, pas tranché ici.

## Interfaces de dépôt (repository)

Aucune. Ni `GrilleDePaliers`, ni `Palier`, ni `Taux` ne nécessitent de persistance ou de dépôt pour
cette story : la grille est une valeur fournie au calcul (cf. `event-model.md`, commande
`ChiffrerPanier`), pas une entité chargée depuis un stockage. Aucune interface de dépôt n'est donc à
définir en couche Application pour US-2. (À distinguer d'US-6, qui introduit un catalogue avec
dépôt — hors périmètre ici.)

## Événements de domaine

Aucun événement de domaine nouveau au sens tactique (DDD) n'est nécessaire : le projet ne fait pas
d'event sourcing (voir `event-model.md`, section sur `PanierChiffre`) et aucune story consultée
n'exige qu'un fait de remise soit publié ou rejoué. Le concept d'« événement » utile ici reste celui
du modèle de comportement (`event-model.md`), pas un type C# à créer dans `Tarification.Domaine`.

## ADR existants à reconsidérer

- **`docs/adr/adr-001-decoupage-domaine-application.md`** : à relire en conception d'architecture
  pour confirmer que `Taux`, `Palier`, `GrilleDePaliers` et l'opération `LigneDePanier.Remise`
  respectent la frontière domaine/application déjà actée (aucune dépendance externe, logique
  commerciale dans le domaine). Cette ADR nomme déjà explicitement les « paliers de remise » comme
  règle devant vivre dans le domaine — elle n'a donc pas besoin d'être réécrite, mais la conception
  doit vérifier que le nouveau code s'y conforme et, le cas échéant, documenter l'ajout des
  nouvelles opérations sur `Montant` en cohérence avec elle.
- **`docs/adr/adr-002-format-de-rapport-de-tests.md`** : aucun lien identifié avec cette story
  (format de rapport de tests JUnit) — mentionnée uniquement pour écarter toute contradiction,
  aucune reconsidération nécessaire.

## Passage de relais vers la conception d'architecture

1. Choisir l'API exacte des nouvelles opérations sur `Montant` (multiplication par `Taux`,
   soustraction sûre) — noms, visibilité.
2. Décider si la correction de `Facture.ATPayer` (soustraction manquante de `Remise`) fait partie
   du périmètre livré par US-2 — la recherche recommande que oui, puisque c'est cette story qui
   rend le bug observable (voir `research.md`, section Passage de relais, point 4).
