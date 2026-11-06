# ADR-003 — Frontière du panier et place de la grille de remise

- Statut : Accepted
- Date : 2026-11-06
- Story : us-2

## Contexte

L'US-2 introduit des paliers de remise par quantité, calculés ligne par ligne
(`stories/US-2.md:7-11`). Il faut décider où vivent ces paliers et la règle qui les applique,
par rapport au `Panier`, seul agrégat du domaine (`src/Tarification.Domaine/Panier.cs:4-17` ;
`.skraft/us-2/design/domain-model.md:21-28`).

Aucun ADR ne justifie aujourd'hui la frontière du `Panier` : l'ADR-001 le cite parmi
les règles du domaine sans en délimiter le contenu (`docs/adr/adr-001-decoupage-domaine-application.md:17-18`).
Cet ADR la fixe aussi, à titre de rattrapage.

Forces en présence :

- Le `Panier` ne représente que les lignes retenues par un client (`Panier.cs:3,6-8`) ; son seul
  invariant porte sur ses lignes (quantité ≥ 1, `src/Tarification.Domaine/Quantite.cs:10-11` ;
  prix ≥ 0, `src/Tarification.Domaine/Montant.cs:13-14`).
- Les paliers sont les mêmes pour toutes les références (réponse utilisateur, rapportée dans
  `.skraft/us-2/design/event-model.md:66`) : ils ne dépendent ni du client ni du contenu du panier
  (`.skraft/us-2/research/research.md:71`).
- Les règles commerciales vont dans le domaine (`adr-001:25-26`) ; une règle qui a besoin d'une
  donnée extérieure se la fait passer (`adr-001:28-30`).
- Aucun stockage n'existe et une couche d'infrastructure est jugée prématurée (`adr-001:40-42`).
- La question a été posée par la recherche, qui a évalué quatre approches (`research.md:59-79`).

## Décision

Nous garderons le `Panier` limité à ses lignes (`LigneDePanier`), sans y ajouter
d'invariant ni de donnée de remise. Les paliers seront portés par l'objet-valeur `GrilleDeRemise`,
composé d'objets-valeurs `PalierDeQuantite` (seuil et `Pourcentage`), dans `Tarification.Domaine`.
La grille calcule la remise de chaque ligne et leur somme pour un panier ; elle est passée au cas
d'usage `CalculDuPanier` à sa construction, une grille vide tenant lieu de valeur par défaut
(`.skraft/us-2/design/domain-model.md:30-34,58-80`).

## Conséquences

Positives :

- La règle reste dans le domaine, lisible et testable sans montage (`adr-001:25-30`).
- Le critère 4 (« par ligne ») est satisfait par construction : la grille évalue chaque élément de
  `Panier.Lignes` séparément (`Panier.cs:8`).
- Le `Panier` n'est pas modifié ; les tests existants qui construisent `new CalculDuPanier()`
  (`tests/Tarification.Tests/CalculDuPanierTests.cs:19,29,35`) restent valides grâce au
  constructeur sans argument.
- Une grille par référence reste possible plus tard : la règle reçoit la ligne, donc sa référence
  (`src/Tarification.Domaine/LigneDePanier.cs:4`).

Négatives / compromis :

- Trois types nouveaux (`Pourcentage`, `PalierDeQuantite`, `GrilleDeRemise`) au lieu de quelques
  méthodes sur le panier (`research.md:64`).
- La cohérence entre un panier et la grille qui le chiffre n'est garantie par aucun agrégat : c'est
  le cas d'usage qui les associe à chaque chiffrage.
- La grille étant un objet-valeur sans identité, elle n'a pas de cycle de vie : si les paliers
  doivent un jour être modifiés ou lus depuis une source extérieure, il faudra un dépôt et
  probablement un nouvel ADR (`domain-model.md:91-95`).

Neutres :

- Aucun dépôt n'est introduit ; la règle de dépendance de l'ADR-001 est inchangée (`adr-001:15-21`).

## Alternatives

| Alternative | Raison du rejet |
|---|---|
| Faire sans objet dédié : boucle de calcul dans `CalculDuPanier` (approche C) | Place une règle commerciale dans la couche application, contre `adr-001:25-26` (`research.md:74-76`). |
| Étendre la frontière du panier : il détient les paliers et chaque ligne calcule sa remise (approche B) | Mélange configuration commerciale et contenu du panier, alors que les paliers ne dépendent pas du client (`research.md:68-72`) ; ajouterait à l'agrégat une donnée sans invariant qui la relie à ses lignes. |
| Faire de la grille un agrégat à part entière, avec identité et dépôt | Aucune identité ni modification n'est exigée par l'US-2 : la grille est construite une fois puis passée au cas d'usage (`domain-model.md:32-34`) ; un dépôt imposerait une infrastructure jugée prématurée (`adr-001:40-42`). |
| Paliers définis par référence, lus dans un catalogue (approche D) | Non demandé : les paliers sont communs à toutes les références (`event-model.md:66`) ; le catalogue est repoussé à l'US-6 (`adr-001:40-42`, `research.md:78-79`). |
