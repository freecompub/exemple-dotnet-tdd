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

- `cold-reader#1.2` **minor** (code) `Montant.Prend(TauxDeRemise)` a un nom peu parlant : on ne comprend pas qu'il renvoie la part du montant correspondant à un pourcentage. Il n'a pas de commentaire, contrairement aux autres membres. Un nom comme `Appliquer` ou `PartSelon`, ou un commentaire, l'éclaircirait. (src/Tarification.Domaine/Montant.cs:23) — gravité : Le nom est cryptique mais le contexte d'appel (`SousTotal.Prend(taux)`) permet de deviner.
- `cold-reader#1.3` **minor** (code) Le calcul de la remise par ligne n'est pas écrit nulle part comme règle métier : `Panier.RemiseDesLignes` et `LigneDePanier.Remise` n'ont aucun commentaire. Rien n'indique que la remise se calcule ligne par ligne et jamais sur le panier entier. Par ailleurs, `GrilleDePaliers.Paliers` et `CalculDuPanier.Grille` sont publics sans raison visible. (src/Tarification.Domaine/Panier.cs:18) — gravité : L'intention de la règle métier principale de la story (calcul par ligne) est invisible dans le code, mais le comportement reste lisible.
- note (hors du changement) : `cold-reader#1.1` **major** Le commentaire de `Facture` dit que les remises restent à zéro tant que les stories ne sont pas livrées. Or `Chiffrer` renseigne maintenant `Remise` avec la remise par palier. Le commentaire est faux et induit en erreur. Il ne dit pas non plus que `ATPayer` ne déduit pas la remise, ce qui surprend en lisant le code. (src/Tarification.Application/CalculDuPanier.cs:6)

## Lentille test-integrity : APPROVED

Aucun défaut.


## Lentille architecture : APPROVED

Aucun défaut.

- note (hors du changement) : `architecture#1.1` **minor** Les noms livrés s'écartent du modèle et des contrats de DESIGN. `Panier.RemiseDesLignes` remplace `SommeDesRemises`. `GrilleDePaliers.TauxPour` remplace `RemisePour`, et `LigneDePanier.Remise(grille)` porte désormais le calcul de remise. Seul `Montant.Prend` est couvert par la liberté de nommage de contracts.md:107. La structure et le sens des dépendances restent conformes à ADR-001. (/tmp/essai-mcp-skraft-zqGCsb/projet/src/Tarification.Domaine/Panier.cs:18)

## Lentille quality-gates : APPROVED

- `quality-gates#1.2` **minor** (test) Couverture du diff (tâche) : GrilleDePaliers.cs est à 90 %, 9 lignes sur 10. La ligne non couverte n'est pas identifiée par le rapport, et aucune justification ne l'accompagne, alors que cette méthode (TauxPour) porte la règle de remise. (src/Tarification.Domaine/GrilleDePaliers.cs:15) — gravité : Une ligne non couverte dans la règle centrale est un trou mineur, les scénarios AC-2, AC-3 et AC-5 couvrant déjà l'essentiel.
- `quality-gates#1.5` **minor** (deliverable) Prend ne fait aucun arrondi : une remise de 11 × 1,99 à 5 % donne 1,0945 à en valeur interne (ToString l'affiche sur deux décimales, ce qui masque l'écart). La décision « option la plus simple » pour l'arrondi n'est consignée dans aucun livrable de DELIVER, et aucun test ne fixe le comportement. (src/Tarification.Domaine/Montant.cs:23) — gravité : Une valeur monétaire sous-centime peut diverger de la facture réelle sans décision tracée.
- note (hors du changement) : `quality-gates#1.1` **major** Couverture du diff (tâche) : CalculDuPanier.cs est à 50 %, 3 lignes non couvertes sur 6. Le rapport ne dit pas lesquelles ; le constructeur sans argument (l.23-25) n'est appelé par aucun test d'acceptance, car les étapes passent toujours une grille. Aucun test unitaire n'a été ajouté (« tests unitaires ajoutés : aucun ») et aucune justification n'est consignée, alors que test-plan.md l.33 demandait l'examen des branches à DELIVER. (src/Tarification.Application/CalculDuPanier.cs:23)
- note (hors du changement) : `quality-gates#1.3` **minor** Non modifiée par la phase, notée pour l'humain : le commentaire de Facture affirme que les remises restent à zéro tant que les stories ne sont pas livrées, ce qui est faux depuis que Chiffrer renseigne Remise (l.29). Le commentaire est devenu trompeur. (src/Tarification.Application/CalculDuPanier.cs:6)
- note (hors du changement) : `quality-gates#1.4` **minor** Les noms cités dans le plan ne correspondent plus au code livré : GrilleDePaliers.RemisePour est devenu TauxPour, Montant.Applique est Montant.Prend, Panier.SommeDesRemises est Panier.RemiseDesLignes, et PalierDeQuantite.EstAtteintPar n'existe pas. Le plan n'a pas été mis à jour ; test-plan.md l.33 mentionne encore RemisePour comme absent. (.skraft/us-2/distill/impl-plan.md:9)
