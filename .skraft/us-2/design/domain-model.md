# Domain model US-2

Contexte : Tarification. Existant : `Panier`, `LigneDePanier`, `Montant`, `Quantite` (`src/Tarification.Domaine/`). Les noms ci-dessous sont à reprendre à l'identique ; les signatures de code ne sont pas fixées ici.

## Agrégats

| Agrégat | Racine | Contenu | Invariant | Sources |
| --- | --- | --- | --- | --- |
| `Panier` | `Panier` | `LigneDePanier` (référence, `Quantite`, prix unitaire) | Il conserve chaque ligne ajoutée sans regroupement par référence ; la remise ne se calcule jamais sur le total du panier | `src/Tarification.Domaine/Panier.cs:8-16`, `stories/US-2.md:10` |

Le `BaremeDeRemise` n'appartient pas au `Panier` : c'est une configuration commune à toutes les références (`.skraft/us-2/research/clarifications.md:7`). Il n'a pas d'identité ni de cycle de vie dans cette story : c'est un objet-valeur, pas un agrégat. Aucun autre agrégat n'est justifié par les critères.

## Objets-valeurs

| Objet-valeur | Contenu | Règles | Sources |
| --- | --- | --- | --- |
| `Montant` (existant) | euros `decimal` | Non négatif ; additionne et multiplie par entier ; ni pourcentage ni soustraction aujourd'hui | `src/Tarification.Domaine/Montant.cs:13-23` |
| `Quantite` (existant) | entier ≥ 1 | Fabrique `De` | `src/Tarification.Domaine/Quantite.cs:10-11` |
| `TauxDeRemise` (nouveau) | pourcentage, ex. 5 %, 12 % | Valeurs `decimal` (pas `double`), entre 0 et 100 inclus ; hors plage rejeté explicitement | `docs/adr/adr-001-decoupage-domaine-application.md:32-33`, `stories/US-2.md:7-9`, `.skraft/us-2/design/clarifications.md:15-18` |
| `PalierDeRemise` (nouveau) | seuil de quantité + `TauxDeRemise` | Seuil strictement positif ; seuil ≤ 0 rejeté explicitement. Éligible si `Quantite` de la ligne ≥ seuil (inclusif) | `stories/US-2.md:7-8`, `.skraft/us-2/design/clarifications.md:15-18` |
| `BaremeDeRemise` (nouveau) | ensemble de `PalierDeRemise`, possiblement vide | Commun à toutes les références, fourni à chaque chiffrage. Seuils dupliqués rejetés explicitement. Vide → remise nulle. Pour une ligne : parmi les paliers éligibles, retenir celui qui donne la plus forte remise ; jamais de cumul. Indépendant de l'ordre de déclaration | `stories/US-2.md:9,11`, `.skraft/us-2/research/clarifications.md:7`, `.skraft/us-2/research/research.md:66`, `.skraft/us-2/design/clarifications.md:5-8,15-18` |

Comportements attendus :
- `LigneDePanier` : remise de la ligne = `SousTotal` × taux du palier retenu par le `BaremeDeRemise`, sur tout le sous-total (10 × 2,00 € × 5 % = 1,00 € ; 50 × 2,00 € × 12 % = 12,00 €) (`stories/US-2.md:8-9`, `src/Tarification.Domaine/LigneDePanier.cs:6`).
- `Panier` : remise totale = somme des remises de ses lignes (`src/Tarification.Domaine/Panier.cs:16` pour la forme additive existante).
- `Montant` : il faudra une opération de pourcentage ; son contrat est à préciser (`.skraft/us-2/research/research.md:68`).

## Événements du domaine

`PalierDeRemiseRetenu`, `AucunPalierDeRemiseApplicable`, `RemiseDeLigneCalculee`, `PanierChiffre` : définis dans `event-model.md`. Aucun n'est publié ni persisté par le code actuel ; leur matérialisation éventuelle relève de l'étape suivante.

## Services du domaine

Aucun. Le besoin est par ligne et la ligne calcule déjà son sous-total ; rien n'implique plusieurs agrégats (`stories/US-2.md:10`, `src/Tarification.Domaine/LigneDePanier.cs:6`).

## Interfaces de dépôt

Aucune. Il n'y a ni stockage ni catalogue ; l'ADR-001 défère une couche infrastructure à un besoin réel (`docs/adr/adr-001-decoupage-domaine-application.md:40-42`). Le barème est passé au domaine (`docs/adr/adr-001-decoupage-domaine-application.md:28-30`).

## Questions et réponses de DESIGN

- **Q1 — Résolue : source du barème.** Fourni par l'appelant à chaque chiffrage (`.skraft/us-2/design/clarifications.md:5-8`).
- **Q2 — Résolue : montant à payer.** Déduire la remise de `Facture.ATPayer` dès US-2 (`.skraft/us-2/design/clarifications.md:10-13`).
- **Q3 — Résolue : configurations invalides.** Rejeter explicitement seuils ≤ 0, taux hors [0,100] % et seuils dupliqués ; autoriser 0 % et 100 % (`.skraft/us-2/design/clarifications.md:15-18`).
- **Q4 — Arrondi** des remises donnant des fractions de centime : traité par l'US-5 (`stories/US-5.md:7-13`) ; non modélisé ici.

## ADR existants à reconsidérer

- `docs/adr/adr-001-decoupage-domaine-application.md` : à reconsidérer pour (a) la manière de passer le barème au domaine, la règle « il faut la lui passer » (lignes 28-30) ; (b) l'ajout d'une opération de pourcentage sur `Montant` avec `decimal` (lignes 32-33). La frontière domaine/application elle-même n'est pas remise en cause par ce modèle.
- `docs/adr/adr-002-format-de-rapport-de-tests.md` : non concerné par US-2. À noter : il cite `tests/Dosage.Tests` (ligne 18) alors que le dépôt contient `tests/Tarification.Tests/` ; écart de l'ADR, sans lien avec cette story.
