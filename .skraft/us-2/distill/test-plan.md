# Plan de test — US-2

Fichier de tests : `tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs`
Scénarios : `.skraft/us-2/distill/features/remise-par-palier.feature`

| Scénario | Cas d'usage | Couche | Doublure | Walking skeleton |
|---|---|---|---|---|
| @ac-2 | `CalculDuPanier.Chiffrer` | Application | aucune | oui |
| @ac-3 | `CalculDuPanier.Chiffrer` | Application | aucune | non |
| @ac-1 | `CalculDuPanier.Chiffrer` | Application | aucune | non |
| @ac-4 | `CalculDuPanier.Chiffrer` | Application | aucune | non |
| @ac-5 | `CalculDuPanier.Chiffrer` | Application | aucune | non |

Les cinq tests sont rouges contre le bouchon `GrilleDeRemise.RemisePour`, qui renvoie une remise de 0,01 € : chacun échoue sur son assertion de remise, aucun n'est une non-régression.

Cas notés pour la boucle interne (non écrits) : `Pourcentage.De` hors [0 ; 100] et `PalierDeQuantite` à seuil < 1 lèvent `ArgumentOutOfRangeException` (contrats).

Hors périmètre, non tranché (option la plus simple retenue) : deux lignes de même référence restent distinctes ; arrondi → US-5 ; cumul avec code promo → US-3.
