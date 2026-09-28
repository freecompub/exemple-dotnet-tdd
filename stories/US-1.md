# US-1 — Chiffrer un panier ligne à ligne

En tant que client, je veux voir le total de mon panier calculé à partir de chaque ligne,
afin de comprendre ce que je paie avant d'aller plus loin.

## Critères d'acceptation
1. Une ligne « MUG-01 » de 3 articles à 4,50 € : somme des articles 13,50 €.
2. Deux lignes, « MUG-01 » 3 × 4,50 € et « STY-07 » 2 × 1,20 € : somme des articles 15,90 €.
3. Panier vide : somme des articles 0,00 €.

## Notes
Story **déjà livrée**, gardée comme référence de forme. Ses tests donnent aux portes une base
verte : voir `tests/Tarification.Tests/CalculDuPanierTests.cs`.
