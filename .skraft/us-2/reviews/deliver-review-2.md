# Revue DELIVER, essai 2

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.3 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.15 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#2.2` **minor** (code) Le même concept porte deux noms : `SommeDesArticles` côté Facture et `SommeDesLignes` côté Panier. `Montant.Zero` mélange aussi l'anglais et le français. (src/Tarification.Application/CalculDuPanier.cs:29) — gravité : Gêne de vocabulaire sans conséquence sur le comportement.
- note (hors du changement) : `cold-reader#2.1` **major** `ATPayer` est un nom illisible (on dirait une coquille de « À payer »). Son calcul (SommeDesArticles + FraisDePort) ignore `Remise` sans que rien ne dise si c'est voulu. Le commentaire de la ligne 6 dit que les remises restent à zéro, alors que `Chiffrer` (ligne 29) calcule une remise réelle avec la grille. Le lecteur ne sait pas si la remise doit être déduite. (src/Tarification.Application/CalculDuPanier.cs:12)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.

- arbitrage sur `architecture#1.1` : **accepted** — Panier.SommeDesRemises(grille) existe dans le domaine et CalculDuPanier.Chiffrer l'appelle. L'invariant est bien dans l'agrégat.

## Lentille quality-gates : APPROVED

Aucun défaut.

- note (hors du changement) : `quality-gates#2.1` **minor** Le commentaire de la classe Facture affirme que « les remises et les frais de port restent à zéro tant que les stories correspondantes ne sont pas livrées ». Or US-2 est livrée : Chiffrer calcule désormais la remise (Panier.SommeDesRemises via la grille). Le commentaire est donc faux pour la remise. Les frais de port restent bien à zéro. (src/Tarification.Application/CalculDuPanier.cs:6)
