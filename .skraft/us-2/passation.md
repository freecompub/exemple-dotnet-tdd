# Réponses de l'utilisateur — US-2

Écrites par le code au fil du run, une par ligne : cite-les comme toute autre source (`passation.md:<ligne>`).

- « La story US-2 laisse ouverte la question « Les paliers sont-ils les mêmes pour toutes les références, ou définis par référence ? » (stories/US-2.md:13-14). Les critères d'acceptation n'y répondent pas : ils parlent de « Palier configuré » sans jamais lier un palier à une référence. Or la réponse change le modèle (une grille unique contre une grille par référence) et l'endroit où les paliers sont configurés. Quelle règle retenir ? Précision secondaire : Facture.ATPayer ne soustrait pas la remise (src/Tarification.Application/CalculDuPanier.cs:12). Faut-il que US-2 la déduise du total à payer, ou seulement qu'elle renseigne le champ Remise ? » → Une grille de paliers unique, identique pour toutes les références ; la remise est seulement renseignée dans Facture.Remise
