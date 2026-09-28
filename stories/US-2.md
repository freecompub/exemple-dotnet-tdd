# US-2 — Remise par palier de quantité

En tant que client, je veux qu'une remise s'applique automatiquement quand j'achète une même
référence en nombre, afin d'être encouragé à commander davantage d'un coup.

## Critères d'acceptation
1. Palier « 10 articles ou plus : 5 % », ligne de 9 articles à 2,00 € : remise 0,00 €.
2. Palier « 10 articles ou plus : 5 % », ligne de 10 articles à 2,00 € : remise 1,00 €.
3. Paliers « 10 : 5 % » et « 50 : 12 % », ligne de 50 articles à 2,00 € : remise 12,00 €. Un seul palier s'applique, le plus avantageux.
4. La remise se calcule par ligne, jamais sur le panier entier : deux lignes de 6 articles de références différentes ne déclenchent pas le palier de 10.
5. Aucun palier configuré : remise 0,00 €.

## Questions ouvertes
- Les paliers sont-ils les mêmes pour toutes les références, ou définis par référence ?
