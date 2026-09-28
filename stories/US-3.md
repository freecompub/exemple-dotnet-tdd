# US-3 — Arrondir la dose au pas de l'instrument

En tant que patient, je veux que la dose proposée soit arrondie au pas que mon stylo sait délivrer,
afin de ne pas lire une valeur que je ne peux pas administrer.

## Critères d'acceptation
1. Pas de 0,5 U, dose calculée 6,3 U : dose proposée 6 U.
2. Pas de 0,5 U, dose calculée 6,8 U : dose proposée 6,5 U.
3. Pas de 1 U, dose calculée 6,8 U : dose proposée 6 U.
4. L'arrondi se fait toujours vers le BAS : une dose arrondie ne doit jamais dépasser le calcul.
5. L'arrondi s'applique après le plafond, jamais avant.

## Questions ouvertes
- Le pas dépend-il du stylo, du patient, ou des deux ?
