# US-6 — Refuser une quantité au-delà du stock disponible

En tant que responsable des stocks, je veux qu'un panier ne puisse pas retenir plus d'articles
qu'il n'en existe, afin de ne pas vendre ce que nous n'avons pas.

## Critères d'acceptation
1. Stock de 5 pour « MUG-01 », ligne de 3 articles : le panier est accepté tel quel.
2. Stock de 5 pour « MUG-01 », ligne de 8 articles : le panier est refusé avec le motif « Stock insuffisant pour MUG-01 : 5 disponibles ».
3. Référence absente du catalogue : le panier est refusé avec le motif « Référence inconnue ».
4. Un refus ne chiffre rien : aucune facture n'est produite, et le motif suffit à expliquer pourquoi.
5. Stock de 0 : la référence est traitée comme indisponible, pas comme inconnue.

## Questions ouvertes
- Le stock est-il vérifié au moment du chiffrage, ou réservé jusqu'au paiement ?
