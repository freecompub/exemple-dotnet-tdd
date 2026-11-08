# Revue DELIVER, essai 1

Verdict (synthèse du code) : APPROVED

## Questions

| Question | Répondue par | Poids | Contribution |
| --- | --- | --- | --- |
| completeness | test-integrity, quality-gates | 0.3 | 0.15 |
| businessFit | cold-reader | 0.3 | 0.15 |
| quality | test-integrity, architecture, quality-gates | 0.15 | 0.075 |
| risk | cold-reader, test-integrity, architecture, quality-gates | 0.25 | 0.125 |

## Lentille cold-reader : APPROVED

- `cold-reader#1.2` **minor** (code) `Prend(Pourcentage taux)` est un nom obscur pour « la part du montant correspondant au taux ». Le lecteur ne devine pas qu'il calcule une part sans arrondi. Dans `Panier.cs:16`, `RemiseTotale` n'a pas de résumé alors que le design parlait de `RemiseDesLignes` (somme des remises par ligne). (src/Tarification.Domaine/Montant.cs:23) — gravité : Nommage peu parlant, mais le sens se retrouve en lisant les appels. — aussi : src/Tarification.Domaine/Panier.cs:16
- note (hors du changement) : `cold-reader#1.1` **minor** Le commentaire de `Facture` dit que les remises restent à zéro tant que leur story n'est pas livrée. C'est faux depuis US-2 : `Remise` est maintenant calculée. Il ne dit pas non plus que `ATPayer` ne déduit pas la remise, ce qui surprendra un lecteur. (src/Tarification.Application/CalculDuPanier.cs:6)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

- `architecture#1.1` **minor** (code) Le code s'écarte des contrats ratifiés sans que l'ADR-003 ni contracts.md soient mis à jour : l'opération du Panier s'appelle RemiseTotale et non RemiseDesLignes(BaremeDeRemises) ; BaremeDeRemises.RemiseDe(ligne) devient TauxPour(Quantite) avec la remise portée par LigneDePanier.Remise(bareme) (LigneDePanier.cs:8), alors que le modèle disait LigneDePanier « non modifié » ; Pourcentage.Applique(Montant) devient Montant.Prend(Pourcentage) (Montant.cs:23), alors que Montant devait être réutilisé tel quel. La structure (invariant dans l'agrégat, barème en valeur, dépendance Application→Domaine) reste conforme ; seuls les noms et la répartition des responsabilités divergent. Réaligner la documentation (ou les noms) pour garder l'ADR fidèle au code. (src/Tarification.Domaine/Panier.cs:16) — gravité : Dérive de nommage et de répartition interne au domaine, sans effet sur les frontières d'agrégat ni sur le sens des dépendances ; elle nuit seulement à la traçabilité entre ADR et code.

## Lentille quality-gates : APPROVED

- `quality-gates#1.2` **minor** (code) Prend renvoie le montant exact sans arrondi au centime (ex. 3,33 € × 5 % = 0,1665 €). La question d'arrondi est signalée comme non tranchée dans les faits et le test-plan, mais aucun commentaire ne documente ce choix dans le code. Aucun test unitaire ne le couvre, le cas étant noté pour la boucle interne. (src/Tarification.Domaine/Montant.cs:23) — gravité : Un choix métier non tranché est implémenté silencieusement ; le défaut est mineur tant que l'affichage reste à deux décimales, mais il doit être explicite.
- note (hors du changement) : `quality-gates#1.1` **minor** La doc de Facture annonce que les remises restent à zéro tant que les stories ne sont pas livrées (« mieux vaut un champ visiblement vide »). Or Chiffrer calcule désormais la remise (ligne 29, panier.RemiseTotale(_bareme)) : le commentaire est faux. (src/Tarification.Application/CalculDuPanier.cs:6)
- note (hors du changement) : `quality-gates#1.3` **minor** Hors périmètre DELIVER, mais à signaler à l'humain : la justification de la requalification (« la remise est déjà à 0,00 €, Montant.Zero en dur ») n'est plus vraie, puisque CalculDuPanier.cs:29 calcule la remise. Les lignes 15-16 reprennent la même justification. (.skraft/us-2/distill/test-plan.md:14)
