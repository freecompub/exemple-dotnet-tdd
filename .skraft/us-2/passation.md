# Réponses de l'utilisateur — US-2

Écrites par le code au fil du run, une par ligne : cite-les comme toute autre source (`passation.md:<ligne>`).

- « Les paliers sont-ils les mêmes pour toutes les références, ou définis par référence ? » → Les mêmes paliers s'appliquent à toutes les références.
- « **Arrondi** : la story ne dit rien pour une remise qui ne tombe pas juste au centime (ex. 11 × 1,99 € × 5 % = 1,0945 €). » → Pas de précision supplémentaire : retiens l'option la plus simple qui respecte les critères d'acceptation.
- « **« Le plus avantageux »** : pour des grilles non monotones, plus haut taux ou plus haut seuil atteint ? Les critères n'en ont pas besoin. » → Pas de précision supplémentaire : retiens l'option la plus simple qui respecte les critères d'acceptation.
- « **Validation de la grille** : seuil < 1, taux hors 0-100 %, seuils en double — comportement non spécifié. » → Pas de précision supplémentaire : retiens l'option la plus simple qui respecte les critères d'acceptation.
- « La story US-2 laisse ouverte la question « Les paliers sont-ils les mêmes pour toutes les références, ou définis par référence ? » (stories/US-2.md:13-14). Les critères d'acceptation n'y répondent pas : ils parlent de « Palier configuré » sans jamais lier un palier à une référence. Or la réponse change le modèle (une grille unique contre une grille par référence) et l'endroit où les paliers sont configurés. Quelle règle retenir ? Précision secondaire : Facture.ATPayer ne soustrait pas la remise (src/Tarification.Application/CalculDuPanier.cs:12). Faut-il que US-2 la déduise du total à payer, ou seulement qu'elle renseigne le champ Remise ? » → Une grille de paliers unique, identique pour toutes les références ; la remise est seulement renseignée dans Facture.Remise
