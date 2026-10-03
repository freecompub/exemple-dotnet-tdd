# Recherche — US-2 : Remise par palier de quantité

## Périmètre et critères de succès

US-2 : une remise s'applique automatiquement quand une ligne de panier atteint un palier de
quantité configuré pour sa référence (ou, à défaut de configuration, aucune remise).

Critères d'acceptation (reformulés depuis la story) :
1. Palier « 10 articles ou plus : 5 % » ; ligne de 9 articles à 2,00 € → remise 0,00 €.
2. Même palier ; ligne de 10 articles à 2,00 € → remise 1,00 € (5 % de 20,00 €).
3. Paliers « 10 : 5 % » et « 50 : 12 % » ; ligne de 50 articles à 2,00 € → remise 12,00 € (12 % de
   100,00 €) — un seul palier s'applique, le plus avantageux (ici le plus haut seuil atteint).
4. La remise se calcule par ligne, jamais sur le panier entier : deux lignes de 6 articles de
   références différentes ne déclenchent pas le palier de 10 (6+6=12 ne doit pas être agrégé).
5. Aucun palier configuré pour une ligne → remise 0,00 €.

## Fichiers analysés

- `src/Tarification.Domaine/LigneDePanier.cs` — record `LigneDePanier(Reference, Quantite,
  PrixUnitaire)`, expose `SousTotal` (`PrixUnitaire.Multiplie(Quantite.Valeur)`).
- `src/Tarification.Domaine/Panier.cs` — collection de lignes, `SommeDesLignes()` fait la somme
  des `SousTotal` de chaque ligne (agrégation déjà par ligne, pas par quantité globale).
- `src/Tarification.Domaine/Montant.cs` — type-valeur `decimal`, jamais négatif, pas d'opérateur
  de multiplication par un taux ni de soustraction définis (`Multiplie(int)` seulement — un
  facteur `int`, pas `decimal`).
- `src/Tarification.Domaine/Quantite.cs` — type-valeur `int`, minimum 1.
- `src/Tarification.Application/CalculDuPanier.cs` — `Facture(SommeDesArticles, Remise,
  FraisDePort)` ; `Remise` vaut `Montant.Zero` en dur (US-2 non livrée) ; `ATPayer` ne soustrait
  **pas** `Remise` aujourd'hui (`SommeDesArticles + FraisDePort`), ce qui est probablement un
  oubli à corriger quand la remise cessera d'être nulle.
- `tests/Tarification.Tests/CalculDuPanierTests.cs` — tests US-1 uniquement, verts ; commentaire
  explicite indiquant que les stories suivantes (dont US-2) n'ont pas encore de tests.
- `docs/adr/adr-001-decoupage-domaine-application.md` — Domaine sans aucune dépendance (ni paquet
  tiers, ni infrastructure, ni interface) ; règles commerciales (« paliers de remise » cité
  explicitement comme exemple de règle à porter dans le domaine) ; `Application` dépend du domaine
  seul et porte les cas d'usage ; montants en `decimal` imposé.
- `docs/adr/adr-002-format-de-rapport-de-tests.md` — sans rapport pour la conception (format de
  rapport de tests JUnit), mentionné pour écarter toute contradiction : aucune.
- `.skraft/quality.json` — barre de qualité (couverture 90 % core / 70 % edge) et règles de
  dépendance interdisant tout paquet tiers/infra dans `Tarification.Domaine` et
  `Tarification.Application`.
- `src/Tarification.Domaine/Tarification.Domaine.csproj` — confirme l'absence de toute dépendance
  déclarée (fichier ne contient qu'un commentaire).

## Recherches effectuées

Recherche strictement interne (pas d'accès réseau dans ce rôle). Aucune recherche externe menée.
Recherche de code antérieure sous `.skraft/us-2/research/` : dossier absent avant cette phase, rien
à réutiliser.

## Conventions du projet

- Règles commerciales et types-valeurs vivent exclusivement dans `Tarification.Domaine`
  (`docs/adr/adr-001-decoupage-domaine-application.md`). Toute nouvelle règle de palier doit donc
  être un type du domaine, pas de l'application.
- Les montants sont toujours des `decimal`, jamais des `double`
  (`docs/adr/adr-001-decoupage-domaine-application.md`).
- Les types-valeurs du domaine sont des `readonly record struct` avec un constructeur privé et une
  fabrique statique `De(...)` qui valide l'invariant et lève `ArgumentOutOfRangeException` en cas
  de violation (`src/Tarification.Domaine/Montant.cs:7-15`,
  `src/Tarification.Domaine/Quantite.cs:5-9`).
- `Montant` ne connaît aujourd'hui ni soustraction, ni multiplication par un taux/`decimal` — seule
  `Multiplie(int)` existe (`src/Tarification.Domaine/Montant.cs:17-18`). Une remise en pourcentage
  nécessitera une opération nouvelle sur `Montant` (ou un calcul fait dans le type qui porte le
  palier, à partir de `Euros`).
- Les tests nomment les méthodes en phrases affirmatives françaises et taguent les faits
  d'acceptance avec un commentaire `// @ac-N` (`tests/Tarification.Tests/CalculDuPanierTests.cs:16,
  23, 30`).
- `Panier.SommeDesLignes()` agrège déjà ligne par ligne (`src/Tarification.Domaine/Panier.cs:16`),
  cohérent avec le critère 4 (pas d'agrégation inter-lignes) — aucune modification de cette
  méthode n'est nécessaire pour respecter ce critère, à condition que le calcul de remise reste
  lui aussi localisé à la ligne.

## Découvertes

- Rien dans le domaine actuel ne représente un palier de quantité, un taux de remise, ni une
  association palier↔référence : il s'agit d'un concept entièrement nouveau à concevoir
  (`src/Tarification.Domaine/` ne contient que `LigneDePanier.cs`, `Panier.cs`, `Montant.cs`,
  `Quantite.cs`).
- `Facture.ATPayer` ne soustrait pas `Remise` de `SommeDesArticles`
  (`src/Tarification.Application/CalculDuPanier.cs:12`) ; tant que `Remise` valait zéro cela restait
  invisible, mais dès qu'US-2 rendra `Remise` non nulle, `ATPayer` donnera un montant à payer trop
  élevé si cette ligne n'est pas corrigée.
- `Montant` interdit toute valeur négative (`src/Tarification.Domaine/Montant.cs:13-14`) : si la
  remise est modélisée comme une soustraction brute `SommeDesArticles - Remise`, il faut une
  opération de soustraction sûre (qui ne lève pas si le résultat est positif, ce qui sera toujours
  le cas ici puisque la remise ne dépasse jamais 100 % d'une ligne) — aucune opération de ce type
  n'existe actuellement sur `Montant`.
- Le calcul vérifié par les exemples (9/10/50 articles à 2,00 €) est cohérent avec « remise =
  taux × SousTotal de la ligne », et non « taux × (SousTotal - remise) » ou autre composition :
  50 × 2,00 € = 100,00 € ; 12 % de 100,00 € = 12,00 € (critère 3) ; 10 × 2,00 € = 20,00 € ; 5 % de
  20,00 € = 1,00 € (critère 2).
- Le critère 3 impose que lorsque plusieurs paliers sont franchis, un seul s'applique — celui qui
  donne la remise la plus favorable au client ; dans l'exemple fourni, le palier le plus haut
  (seuil le plus élevé atteint) coïncide avec le taux le plus élevé et donc la remise la plus
  avantageuse. Rien dans la story ne permet de vérifier le cas où un palier à seuil plus bas aurait
  un taux plus avantageux qu'un palier à seuil plus haut (configuration non monotone) — voir
  passage de relais.

## Approches évaluées

### A. `GrilleDePaliers` : liste de paliers portée par la ligne de panier (ou passée au calcul)

Principe : un nouveau type-valeur domaine, par exemple `Palier(Quantite Seuil, decimal Taux)` (ou
un objet dédié pour le taux), et une collection `GrilleDePaliers` qui, à partir d'une quantité,
retourne le palier le plus avantageux applicable (ou aucun). `LigneDePanier` reçoit cette grille
(nouveau paramètre optionnel, ou une collection vide par défaut) et expose une méthode `Remise()` qui
vaut `Montant.Zero` si aucun palier n'est atteint, ou `SousTotal × Taux` sinon.

Apports : respecte strictement le critère 4, car le calcul reste scopé à l'instance de
`LigneDePanier` — aucune info du panier n'est nécessaire. Respecte ADR-001 (règle commerciale dans
le domaine, aucune dépendance externe). Respecte le critère 5 par construction si la grille est
vide par défaut.

Limites : il faut décider explicitement comment représenter un taux en pourcentage (nouveau type
`Pourcentage`/`Taux`, ou `decimal` brut) et comment calculer `Montant × decimal` proprement, ce qui
demande d'étendre `Montant` (aucune opération de ce genre n'existe aujourd'hui). Il faut aussi
décider si la grille est portée par la ligne (une grille par ligne, risque de duplication si
plusieurs lignes partagent la même référence) ou par un service/catalogue externe à la ligne mais
appelé par ligne (ex. passé en paramètre à `CalculDuPanier.Chiffrer`).

Conformité aux conventions : haute — type-valeur avec fabrique validante, logique dans le domaine,
`decimal` pour les montants et taux.

Références : `src/Tarification.Domaine/LigneDePanier.cs:1-6`,
`src/Tarification.Domaine/Montant.cs:17-18`, `docs/adr/adr-001-decoupage-domaine-application.md`
(section Décision).

### B. Remise calculée dans `CalculDuPanier` (couche application), à partir d'une grille passée en paramètre

Principe : garder `LigneDePanier` inchangé (US-1), et faire porter le calcul de palier par
`CalculDuPanier.Chiffrer`, qui reçoit en plus une grille de paliers (par référence ou globale) et
boucle sur `panier.Lignes` pour calculer et sommer les remises.

Apports : ne touche pas au type `LigneDePanier` déjà testé par US-1 ; centralise le calcul au
point d'entrée déjà identifié comme pilote des tests d'acceptance
(`src/Tarification.Application/CalculDuPanier.cs:16` — commentaire « point d'entrée de la couche
application, c'est lui que les tests d'acceptance pilotent »).

Limites : contredit ADR-001, qui classe explicitement les « paliers de remise » comme règle
commerciale devant vivre dans le domaine, pas dans l'application
(`docs/adr/adr-001-decoupage-domaine-application.md`, section Contexte : « ces règles... doivent
pouvoir être lues sans qu'aucune question technique ne s'interpose » et doivent survivre au
remplacement de l'interface — un cas d'usage applicatif est plus exposé à ce remplacement qu'un
type de domaine). Une revue de dépendance future pourrait aussi moins bien détecter une dérive de
cette règle si elle n'est pas isolée dans un type dédié du domaine.

Conformité aux conventions : faible — va à l'encontre d'une décision déjà actée (ADR-001).

Références : `src/Tarification.Application/CalculDuPanier.cs:1-19`,
`docs/adr/adr-001-decoupage-domaine-application.md`.

### C. Remise portée par un service de domaine distinct (`CalculateurDeRemise`), appelé ligne par ligne

Principe : comme A, mais au lieu d'ajouter la méthode directement sur `LigneDePanier`, on crée un
type de domaine séparé (service sans état) qui prend une `LigneDePanier` et une grille, et renvoie
un `Montant` de remise. `LigneDePanier` reste un pur conteneur de données, et un objet dédié porte
le calcul.

Apports : sépare la donnée (`LigneDePanier`) du calcul (palier), ce qui peut faciliter l'ajout
d'autres règles de remise plus tard (US futures) sans surcharger `LigneDePanier` de méthodes
métier hétérogènes.

Limites : introduit un objet supplémentaire pour un calcul qui ne dépend que des champs déjà
présents sur `LigneDePanier` (`Quantite`, `PrixUnitaire`) — complexité qui n'est pas justifiée par
la story actuelle, qui ne demande qu'un seul type de remise. `LigneDePanier.SousTotal` montre déjà
que le projet place volontiers les calculs dérivés d'une ligne directement sur la ligne elle-même
(approche A), ce qui est la convention déjà en place.

Conformité aux conventions : moyenne — reste dans le domaine (conforme ADR-001) mais s'écarte du
style déjà adopté pour `SousTotal`.

Références : `src/Tarification.Domaine/LigneDePanier.cs:1-6`.

## Recommandation

Approche **A** : porter la remise comme une règle du domaine, calculée au niveau de
`LigneDePanier` (ou d'un type-valeur dédié `Palier`/`GrilleDePaliers` associé à la ligne au moment
de sa construction), dans le même esprit que `SousTotal`. C'est la seule option pleinement alignée
avec ADR-001 (règle commerciale + aucune dépendance externe) et avec le style déjà présent dans
`LigneDePanier.SousTotal` (calcul dérivé exposé comme propriété/méthode de la ligne). Elle satisfait
nativement le critère 4 (portée ligne, pas panier) puisque rien dans le calcul n'a besoin de
connaître les autres lignes.

L'approche B est écartée : elle contredit une décision déjà actée (ADR-001) qui nomme explicitement
les paliers de remise comme règle devant vivre dans le domaine.

L'approche C est écartée à ce stade : complexité non justifiée par la story, le projet préférant
déjà porter les calculs dérivés directement sur `LigneDePanier`.

## Passage de relais

Décisions à valider en conception (ADR ou choix de design), que cette recherche ne tranche pas :

1. **Où vit la grille de paliers par rapport à la ligne ?** Soit chaque `LigneDePanier` reçoit sa
   propre grille à la construction (couplage fort donnée/règle, proche de l'existant), soit une
   grille est associée par référence et passée en paramètre au calcul (`CalculDuPanier.Chiffrer`
   ou une méthode de `LigneDePanier`) — à trancher selon que la story suivante (catalogue,
   mentionnée dans ADR-001 à propos de l'US-6) doit réutiliser cette association.
2. **Représentation du taux** : `decimal` brut (ex. `0.05m`) ou nouveau type-valeur
   `Pourcentage`/`Taux` avec fabrique validante (borné entre 0 et 1 ?) — le projet valide
   systématiquement ses types-valeurs (`Montant.De`, `Quantite.De`), donc un type dédié semble
   dans l'esprit du code existant, mais ce n'est pas tranché ici.
3. **Règle de sélection du palier le plus avantageux en cas de configuration non monotone** : la
   story ne donne qu'un exemple où le palier au seuil le plus haut est aussi le plus avantageux.
   Si un palier à seuil plus bas avait un taux supérieur à un palier à seuil plus haut, faut-il
   retenir le seuil le plus haut atteint (ordre des seuils) ou le taux le plus favorable parmi tous
   les paliers atteints (ordre des remises) ? Question métier à poser si la conception doit
   couvrir ce cas, faute de quoi l'implémentation ne doit couvrir que le cas testé (plus haut seuil
   atteint = plus avantageux).
4. **Correction de `Facture.ATPayer`** (`src/Tarification.Application/CalculDuPanier.cs:12`) : il
   ne soustrait pas `Remise`. Ce bug latent devient visible dès qu'US-2 rend `Remise` non nulle. À
   confirmer en conception : corriger `ATPayer` fait-il partie du périmètre d'US-2, ou est-ce hors
   scope (à traiter séparément) ? Je recommande de le traiter dans la même story puisque c'est
   elle qui rend le bug observable, mais c'est une décision de conception, pas une recherche.
5. **Opération manquante sur `Montant`** : aucune multiplication par un `decimal`/taux, ni
   soustraction, n'existe aujourd'hui sur `Montant` (`src/Tarification.Domaine/Montant.cs`). La
   conception doit choisir l'API exacte à ajouter (ex. `Montant.Multiplie(decimal taux)` et/ou
   `Montant.Soustrait(Montant autre)`) en respectant l'invariant « pas de montant négatif ».
