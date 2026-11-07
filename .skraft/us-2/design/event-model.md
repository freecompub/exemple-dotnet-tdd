# Event Model — US-2 : Remise par palier de quantité

Sources : story `stories/US-2.md:3-11`, recherche `.skraft/us-2/research/research.md`, réponses
utilisateur `.skraft/us-2/passation.md:5-9`.

## Déclencheurs

| Déclencheur | Nature | Agrégat | Produit | Source de l'existant |
|---|---|---|---|---|
| `AjouterLigne` | Commande (change l'état du panier) | `Panier` | événement `LigneAjoutee` | `Panier.Ajoute` — `src/Tarification.Domaine/Panier.cs:10-14` |
| `ChiffrerPanier` | Requête (lit le panier, ne le modifie pas) | lit `Panier` + `GrilleDePaliers` | vue `Facture` | `CalculDuPanier.Chiffrer` — `src/Tarification.Application/CalculDuPanier.cs:21` |

- Commande `AjouterLigne` → événement `LigneAjoutee`
- Requête `ChiffrerPanier` → vue `Facture`

`LigneAjoutee` est un événement de modèle : le code n'a aucun mécanisme d'événements, `Ajoute`
renvoie le panier (`src/Tarification.Domaine/Panier.cs:10-14`). US-2 n'en demande pas.

La grille de paliers n'est pas une commande : c'est une configuration (`GrilleDePaliers`) fournie au
cas d'usage, conformément à « une règle qui a besoin d'un élément extérieur le reçoit en paramètre »
(`docs/adr/adr-001-decoupage-domaine-application.md:28-30`). Le projet n'a pas de stockage
(`docs/adr/adr-001-decoupage-domaine-application.md:40-41`) et aucun critère ne modifie la grille
(`stories/US-2.md:7-11`). Grille unique, commune à toutes les références (`.skraft/us-2/passation.md:9`).

## Tranches verticales

### Tranche 1 — Constituer le panier (prérequis, existant US-1)
- Commande `AjouterLigne` (`Reference`, `Quantite`, `PrixUnitaire`) sur `Panier`
- Événement `LigneAjoutee` (`Reference`, `Quantite`, `PrixUnitaire`) — champs de
  `LigneDePanier(string Reference, Quantite Quantite, Montant PrixUnitaire)` (`src/Tarification.Domaine/LigneDePanier.cs:4`)
- Vue : `Panier.Lignes` (`src/Tarification.Domaine/Panier.cs:8`)
- Rôle dans US-2 : clause *Given* de chaque critère (« ligne de N articles à 2,00 € »).

### Tranche 2 — Chiffrer le panier avec la remise par palier (cœur de US-2)
- Requête `ChiffrerPanier` (`Panier`, avec la `GrilleDePaliers` configurée)
- Vue `Facture(SommeDesArticles, Remise, FraisDePort)` (`src/Tarification.Application/CalculDuPanier.cs:10`) :
  - `SommeDesArticles` = `Panier.SommeDesLignes()`, inchangé (`CalculDuPanier.cs:21`) ;
  - `Remise` = somme des remises de chaque `LigneDePanier` (champ existant, aujourd'hui toujours
    `Montant.Zero`, `CalculDuPanier.cs:21`) — seul champ modifié par US-2 ;
  - `FraisDePort` = `Montant.Zero`, inchangé (`CalculDuPanier.cs:21`) ; hors US-2.

## Correspondance critères → tranche

| Critère | Given | When | Then (vue `Facture`) |
|---|---|---|---|
| ac-1 | grille {10 : 5 %} ; `AjouterLigne` 9 × 2,00 € | `ChiffrerPanier` | `Remise` = 0,00 € |
| ac-2 | grille {10 : 5 %} ; `AjouterLigne` 10 × 2,00 € | `ChiffrerPanier` | `Remise` = 1,00 € |
| ac-3 | grille {10 : 5 %, 50 : 12 %} ; `AjouterLigne` 50 × 2,00 € | `ChiffrerPanier` | `Remise` = 12,00 € (un seul palier) |
| ac-4 | grille {10 : 5 %} ; `AjouterLigne` 6 × réf. A, `AjouterLigne` 6 × réf. B | `ChiffrerPanier` | `Remise` = 0,00 € (calcul par ligne) |
| ac-5 | grille vide ; une ligne quelconque | `ChiffrerPanier` | `Remise` = 0,00 € |

Critères : `stories/US-2.md:7-11`. Vérification arithmétique : `.skraft/us-2/research/research.md:58`.

## Cas de refus

`ChiffrerPanier` ne rejette pas de panier dans US-2 (aucun critère de refus, `stories/US-2.md:7-11`).
Les refus existants sont ceux des objets-valeurs : `Quantite.De` < 1 (`src/Tarification.Domaine/Quantite.cs:10-11`),
`Montant.De` < 0 (`src/Tarification.Domaine/Montant.cs:13-14`) ; les nouveaux objets-valeurs suivent le même
patron (voir `domain-model.md`).
