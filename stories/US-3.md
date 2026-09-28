# US-3 — Code promotionnel sur le panier

En tant que client, je veux saisir un code promotionnel qui réduit le total de mon panier,
afin de profiter d'une offre reçue par courriel.

## Critères d'acceptation
1. Code « BIENVENUE10 » valant 10 %, somme des articles 50,00 € : remise 5,00 €.
2. Code inconnu « NIMPORTEQUOI » : remise 0,00 €, et le motif « Code promotionnel inconnu » est rendu au client.
3. Code « BIENVENUE10 » plafonné à 4,00 €, somme des articles 50,00 € : remise 4,00 €.
4. Aucun code saisi : remise 0,00 €, aucun motif.
5. Un code ne peut jamais rendre le total négatif : code de 100 % sur 50,00 € donne un total de 0,00 €.

## Questions ouvertes
- Un code promotionnel se cumule-t-il avec les remises par palier de l'US-2, ou l'emporte-t-il ?
- Un code expiré est-il « inconnu », ou mérite-t-il un motif distinct ?
