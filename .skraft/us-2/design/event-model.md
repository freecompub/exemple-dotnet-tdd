# Event model US-2 — Remise par palier de quantité

Le système est un calcul sans état : aucun stockage n'existe (`docs/adr/adr-001-decoupage-domaine-application.md:40-42`) et le point d'entrée est `CalculDuPanier.Chiffrer` (`src/Tarification.Application/CalculDuPanier.cs:21`). Les événements ci-dessous sont des faits métier du modèle ; ils ne supposent ni journal d'événements ni publication (c'est une décision de l'étape suivante).

## Commandes

| Commande | Intention | Données | Rejets possibles | Sources |
| --- | --- | --- | --- | --- |
| `ChiffrerPanier` | Obtenir la facture d'un panier, remise comprise | `Panier` (lignes : référence, `Quantite`, prix unitaire) et `BaremeDeRemise` commun à toutes les références, fourni à chaque appel | Entrées invalides de `Quantite`/`Montant` rejetées par leurs fabriques ; seuils ≤ 0, taux hors [0,100] % et seuils dupliqués rejetés explicitement avant le calcul | `src/Tarification.Application/CalculDuPanier.cs:21`, `src/Tarification.Domaine/Quantite.cs:10-11`, `.skraft/us-2/research/clarifications.md:7`, `.skraft/us-2/design/clarifications.md:5-8,15-18` |

`ChiffrerPanier` correspond à l'actuel `Chiffrer`. Le barème sera fourni par l'appelant à chaque chiffrage (`.skraft/us-2/design/clarifications.md:5-8`).

## Événements

| Événement | Fait enregistré | Contenu | Sources |
| --- | --- | --- | --- |
| `PalierDeRemiseRetenu` | Pour une ligne, un palier a été retenu parmi ceux dont le seuil est atteint (seuil inclusif), le plus avantageux | référence de la ligne, `PalierDeRemise` retenu | `stories/US-2.md:7-9` |
| `AucunPalierDeRemiseApplicable` | Pour une ligne, aucun palier n'est atteint, ou aucun palier n'est configuré | référence de la ligne | `stories/US-2.md:7,11` |
| `RemiseDeLigneCalculee` | La remise d'une ligne vaut sous-total × taux du palier retenu (zéro sinon) | référence, `Montant` de remise | `stories/US-2.md:7-9`, `src/Tarification.Domaine/LigneDePanier.cs:6` |
| `PanierChiffre` | La facture est établie : somme des articles, remise totale = somme des remises de lignes | `Facture` | `src/Tarification.Application/CalculDuPanier.cs:10-13`, `src/Tarification.Domaine/Panier.cs:16` |

`PalierDeRemiseRetenu` et `AucunPalierDeRemiseApplicable` sont exclusifs pour une ligne donnée. `RemiseDeLigneCalculee` suit toujours l'un des deux.

## Vues (read models)

| Vue | Contenu | Consommateur | Sources |
| --- | --- | --- | --- |
| `Facture` | `SommeDesArticles`, `Remise`, `FraisDePort`, `ATPayer` | Client / tests d'acceptance | `src/Tarification.Application/CalculDuPanier.cs:10-13` |

Constat : `Facture.ATPayer` n'inclut aujourd'hui pas `Remise` (`src/Tarification.Application/CalculDuPanier.cs:12`). Cible confirmée pour US-2 : `ATPayer` déduit `Remise` de `SommeDesArticles`, puis ajoute `FraisDePort` (`.skraft/us-2/design/clarifications.md:10-13`, `src/Tarification.Application/CalculDuPanier.cs:10-12`).

## Tranches

| Tranche | Commande → événements → vue | Critères |
| --- | --- | --- |
| T1 Seuil inclusif | `ChiffrerPanier` → `PalierDeRemiseRetenu` / `AucunPalierDeRemiseApplicable` → `RemiseDeLigneCalculee` → `Facture.Remise` | AC-1 (9 articles → 0,00 €), AC-2 (10 articles → 1,00 €) (`stories/US-2.md:7-8`) |
| T2 Palier le plus avantageux | idem, deux paliers éligibles | AC-3 (50 × 2,00 € → 12,00 €) (`stories/US-2.md:9`) |
| T3 Par ligne | `ChiffrerPanier` sur deux lignes de références différentes | AC-4 (2 × 6 articles → 0,00 €) (`stories/US-2.md:10`) |
| T4 Sans barème | `ChiffrerPanier` → `AucunPalierDeRemiseApplicable` | AC-5 (`stories/US-2.md:11`) |

## Scénarios (Given / When / Then)

- AC-3 : Given paliers 10→5 % et 50→12 %, ligne de 50 à 2,00 € (sous-total 100,00 €) ; When `ChiffrerPanier` ; Then `PalierDeRemiseRetenu` (50, 12 %), `RemiseDeLigneCalculee` = 12,00 €. Le résultat ne doit pas dépendre de l'ordre de déclaration des paliers (`.skraft/us-2/research/research.md:66`, découverte 3).
