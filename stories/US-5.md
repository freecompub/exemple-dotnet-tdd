# US-5 — Arrondir au centime, une seule fois

En tant que comptable, je veux que le total facturé soit arrondi au centime de façon prévisible,
afin que la somme des lignes d'une facture corresponde toujours à son total.

## Critères d'acceptation
1. Ligne de 3 articles à 0,333 € : sous-total 1,00 €.
2. Remise de 5 % sur 33,33 € : remise 1,67 €, arrondie au centime supérieur à partir d'un demi-centime.
3. L'arrondi s'applique une seule fois, sur chaque montant rendu au client, jamais sur des valeurs intermédiaires enchaînées.
4. La somme des sous-totaux arrondis peut différer du total arrondi : c'est le total qui fait foi, et l'écart doit être inférieur à 0,01 € par ligne.

## Questions ouvertes
- Arrondi au plus proche, ou toujours en faveur du client ?
