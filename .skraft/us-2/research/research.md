# Recherche — US-2 : Remise par palier de quantité

## Périmètre et critères de succès

Faire en sorte qu'une ligne de panier porte une remise calculée selon un palier de quantité
(seuil minimal d'articles → taux de remise), selon les 5 critères d'acceptation de
`stories/US-2.md:1-9` :

1. Sous le seuil : remise nulle.
2. Au seuil exact : remise appliquée.
3. Plusieurs paliers configurés : seul le plus avantageux s'applique (pas de cumul).
4. La remise se calcule **par ligne**, jamais en sommant les quantités de plusieurs lignes du
   panier, même pour une référence identique sur deux lignes distinctes.
5. Aucun palier configuré : remise nulle.

La story porte elle-même une question ouverte non tranchée : « Les paliers sont-ils les mêmes pour
toutes les références, ou définis par référence ? » (`stories/US-2.md:8`). Cette recherche ne la
tranche pas — voir « Passage de relais ».

## Fichiers analysés

- `src/Tarification.Domaine/LigneDePanier.cs:1-6` — record de ligne, porte déjà `SousTotal`.
- `src/Tarification.Domaine/Panier.cs:1-15` — agrège les lignes, additionne les sous-totaux.
- `src/Tarification.Domaine/Montant.cs:1-23` — type-valeur, **aucun opérateur de soustraction** ;
  seule une addition (`+`) et une multiplication par un entier positif existent.
- `src/Tarification.Domaine/Quantite.cs:1-13` — type-valeur, borne basse à 1, aucune borne haute.
- `src/Tarification.Application/CalculDuPanier.cs:1-21` — `Facture` porte déjà un champ `Remise`,
  actuellement toujours `Montant.Zero` (commentaire ligne 9-10 : « Les remises [...] restent à zéro
  tant que les stories correspondantes ne sont pas livrées »). `ATPayer` (ligne 11) vaut
  `SommeDesArticles + FraisDePort` — **la remise n'est pas soustraite du tout**, même si elle
  devenait non nulle.
- `tests/Tarification.Tests/CalculDuPanierTests.cs:1-41` — tests US-1, verts, aucun test sur la
  remise pour l'instant. Convention observée : une méthode `Ligne(reference, quantite, prix)` en
  fabrique de test, des noms de méthode en phrase complète, un commentaire `// @ac-n` associant un
  test à un critère d'acceptation numéroté.
- `docs/adr/adr-001-decoupage-domaine-application.md:1-33` — fixe la frontière domaine/application :
  le domaine porte les règles (`Panier`, `LigneDePanier`), l'application les cas d'usage. Une règle
  qui a besoin d'un service extérieur doit se le faire **passer**, jamais l'invoquer directement
  (lignes 23-25).
- `docs/adr/adr-002-format-de-rapport-de-tests.md` — sans rapport avec cette story (format JUnit).
- `stories/US-3.md:9-10` — question ouverte : cumul (ou non) entre code promotionnel (US-3) et
  remise par palier (US-2). Ne concerne pas l'implémentation de l'US-2 elle-même, mais contraint la
  conception pour ne pas fermer la porte à une composition future des remises.
- `.skraft/quality.json:1-20` — barre de qualité : couverture 90 % (core) / 70 % (edge), et règles
  de dépendance interdisant à `Tarification.Domaine` de dépendre de `Tarification.Application` ou
  de tout paquet d'infrastructure.
- `README.md:1-70` — contexte projet, cible `net10.0`, aucune mention de palier au-delà du tableau
  récapitulatif des stories.

## Recherches effectuées

Aucune recherche externe : la story est autosuffisante (règle d'arithmétique simple sur un domaine
métier déjà modélisé). Aucun paquet tiers n'est nécessaire. Le seul travail d'enquête était interne
au dépôt : lecture du domaine existant, des ADR, de la barre de qualité et des stories voisines
(US-3) pour ne pas construire une solution qui leur ferme une porte.

## Conventions du projet

- Types-valeurs immuables (`readonly record struct`) avec fabrique statique `De(...)` qui valide et
  lève `ArgumentOutOfRangeException` en cas d'entrée invalide (`Montant.cs:13-14`,
  `Quantite.cs:10-11`).
- Les règles métier vivent dans `Tarification.Domaine`, exposées sous forme de méthodes ou de
  propriétés calculées sur les types du domaine (`LigneDePanier.SousTotal`,
  `Panier.SommeDesLignes`).
- Le cas d'usage (`CalculDuPanier.Chiffrer`) orchestre le domaine et construit la `Facture` ; il ne
  contient pas de règle de calcul lui-même dans l'état actuel du code.
- Les tests d'acceptance sont annotés `// @ac-n` et nommés en phrase complète en français
  (`CalculDuPanierTests.cs:16-17`).
- Pas d'interface/service injecté nulle part encore dans ce projet : chaque collaborateur est soit
  un type-valeur du domaine, soit construit directement. Rien dans le code actuel n'illustre le cas
  « service externe à passer » mentionné par l'ADR-001 ; US-6 (catalogue/stock) en sera
  probablement la première démonstration concrète (`README.md:19`,
  `docs/adr/adr-001-decoupage-domaine-application.md:23-25`).

## Découvertes

- `Montant` n'offre aucune opération de soustraction (`Montant.cs:1-23`) : toute remise calculée en
  `Montant` ne peut pour l'instant être composée qu'en addition, et rien dans le domaine ne permet
  de retrancher la remise de la somme des articles pour obtenir un montant à payer réduit.
- `Facture.ATPayer` (`CalculDuPanier.cs:11`) ignore déjà le champ `Remise` dans son calcul — ce
  champ existe mais n'est branché nulle part. Rendre l'US-2 visible côté facture implique donc de
  toucher `ATPayer`, pas seulement le calcul de la remise elle-même.
- Le calcul « par ligne, jamais sur le panier entier » (AC4) est déjà cohérent avec le découpage
  actuel : `LigneDePanier` porte sa propre `Quantite`, et `Panier` ne fait qu'agréger des lignes
  sans jamais regrouper par référence (`Panier.cs:7-15`). Aucun remaniement de `Panier` n'est requis
  pour respecter cette règle — il suffit de ne jamais sommer les quantités inter-lignes.
- `Quantite` n'a pas de borne haute (`Quantite.cs:10-11`) : rien n'empêche une quantité de 50 ou
  plus, ce qui correspond à l'AC3 sans ajustement nécessaire sur ce type.
- Les montants dans les AC sont tous des valeurs rondes (9, 10, 50 articles à 2,00 €, remises de
  1,00 € et 12,00 €) : aucun des trois exemples ne met en évidence une règle d'arrondi au centime —
  celle-ci est explicitement portée par US-5 (`stories/US-5.md` cité dans `README.md:16`), donc hors
  périmètre ici, mais à garder à l'esprit si une implémentation ultérieure change de taux.
- La question ouverte de la story (paliers globaux vs par référence, `stories/US-2.md:8`) n'est
  tranchée nulle part dans le dépôt : ni les ADR, ni le README, ni aucune autre story n'y répond
  explicitement pour l'US-2. US-6 introduit un catalogue par référence (`stories/US-6.md:1-3`),
  mais pour le stock, pas pour des paliers de remise — ce n'est donc pas une réponse implicite à la
  question de l'US-2.

## Approches évaluées

### A. Grille de paliers passée en paramètre du cas d'usage

**Principe.** `Palier` est un type-valeur du domaine (seuil de quantité + taux). Une liste de
`Palier` (éventuellement vide) est passée explicitement à `CalculDuPanier.Chiffrer(panier, paliers)`
ou à une méthode du domaine qui calcule la remise d'une ligne étant donné cette liste.

**Apport.** Respecte littéralement l'ADR-001 : un collaborateur externe à la règle (la grille de
paliers, qui vient probablement d'une configuration ou d'un catalogue) est *passé*, jamais invoqué
directement par le domaine. AC5 (« aucun palier configuré ») devient trivial : liste vide → remise
nulle, sans cas particulier à coder.

**Limites.** Si la réponse à la question ouverte est « paliers par référence », la signature doit
évoluer (dictionnaire indexé par référence, ou grille portée par la ligne elle-même) — mais ce
changement reste local à la frontière d'entrée, sans toucher la logique de sélection du palier le
plus avantageux.

**Accord avec les conventions.** Fort : aucun service injecté dans le constructeur, pas de nouvel
état caché ; cohérent avec le style actuel de `CalculDuPanier.Chiffrer` qui est une fonction pure
sur ses arguments (`CalculDuPanier.cs:19-20`).

**Références.** `src/Tarification.Application/CalculDuPanier.cs:19-20`,
`docs/adr/adr-001-decoupage-domaine-application.md:23-25`, `stories/US-2.md:5,8`.

### B. Paliers portés par chaque `LigneDePanier`

**Principe.** Chaque ligne reçoit directement sa propre liste de paliers applicables (champ du
record), fixée à la construction de la ligne.

**Apport.** Répond nativement à l'hypothèse « paliers par référence » si c'est la réponse retenue à
la question ouverte, sans structure de correspondance référence → paliers à maintenir ailleurs.

**Limites.** Si la réponse est « mêmes paliers pour toutes les références » (l'hypothèse la plus
simple au vu des trois exemples de la story, qui ne varient jamais les paliers d'une ligne à
l'autre), cette approche duplique la même grille sur chaque ligne et complique sans bénéfice la
construction d'un panier dans les tests — chaque appel à la fabrique `Ligne(...)` de test devrait
alors aussi transporter la grille. Construit une réponse à une question non tranchée.

**Accord avec les conventions.** Moyen : alourdit `LigneDePanier`, un record aujourd'hui minimal
(`LigneDePanier.cs:1-6`), avant que la question ouverte ne soit close.

**Références.** `src/Tarification.Domaine/LigneDePanier.cs:1-6`, `stories/US-2.md:8`.

### C. Grille de paliers injectée dans le constructeur de `CalculDuPanier`

**Principe.** `CalculDuPanier` reçoit sa grille de paliers une fois, à la construction, et
l'applique à chaque `Chiffrer(panier)`.

**Apport.** Évite de repasser la grille à chaque appel si elle est stable pour toute l'exécution.

**Limites.** AC5 (« aucun palier configuré ») devient un état implicite du cas d'usage plutôt qu'un
argument explicite de l'appel testé — un test doit alors construire un `CalculDuPanier` vide
spécifiquement pour ce cas, alors que l'US-1 et les tests actuels instancient `new
CalculDuPanier()` sans argument à chaque fois (`CalculDuPanierTests.cs:16,23,29`). Cela casserait la
compatibilité de ces trois tests déjà verts, ou obligerait une valeur par défaut masquée, moins
lisible qu'un paramètre explicite.

**Accord avec les conventions.** Moyen : introduit le premier état de construction du cas d'usage
dans ce projet, alors que rien ne l'exige encore pour cette story et que cela casse des tests
existants sans bénéfice évident face à l'approche A.

**Références.** `tests/Tarification.Tests/CalculDuPanierTests.cs:16,23,29`,
`src/Tarification.Application/CalculDuPanier.cs:19-20`.

## Recommandation

**Approche A** : un type-valeur `Palier` (seuil + taux) dans `Tarification.Domaine`, une règle de
calcul portée par le domaine (sur `LigneDePanier` ou une fonction dédiée) qui, recevant une liste de
`Palier` possiblement vide, retient le palier dont le seuil est atteint et dont la remise est la
plus élevée — sans jamais sommer de quantités entre lignes. La liste de paliers est un paramètre
explicite du cas d'usage, pas un état construit ni un champ de ligne. C'est l'approche qui respecte
le plus directement l'ADR-001, ne modifie aucun test existant, traite AC5 sans cas particulier, et
ne préjuge pas de la réponse à la question ouverte « paliers globaux ou par référence » : elle
peut absorber l'une ou l'autre réponse en faisant évoluer uniquement la forme du paramètre d'entrée.

Elle implique aussi deux ajustements signalés en découverte, à trancher en conception : ajouter une
opération de soustraction à `Montant` (absente aujourd'hui), et décider si/comment `Facture.ATPayer`
doit désormais soustraire `Remise`.

## Passage de relais

**Décisions à valider en conception :**
- Forme exacte du type `Palier` et de la méthode qui sélectionne le palier le plus avantageux
  (domaine pur, sans état).
- Faut-il ajouter une opération de soustraction sur `Montant`, et avec quelle garde (un montant
  négatif n'existe pas dans ce domaine, cf. `Montant.cs:7-8`) ?
- `Facture.ATPayer` doit-il être corrigé pour soustraire `Remise` dans le cadre de cette story, ou
  est-ce explicitement hors périmètre (US-1 avait laissé `Remise` toujours nulle, donc l'écart était
  invisible jusqu'ici) ?

**Questions ouvertes non tranchées par cette recherche (métier, à poser) :**
- La question propre à la story (`stories/US-2.md:8`) : les paliers sont-ils les mêmes pour toutes
  les références, ou définis par référence ? Aucun des documents du dépôt n'y répond.
- Hors périmètre direct de l'US-2 mais à garder visible : le cumul entre le code promotionnel
  (US-3) et la remise par palier (US-2) reste une question ouverte de l'US-3
  (`stories/US-3.md:9`), qui pourrait contraindre a posteriori l'endroit où vit `Remise` dans la
  composition de la facture.
