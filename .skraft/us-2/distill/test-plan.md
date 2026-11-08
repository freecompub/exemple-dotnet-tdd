# Plan de test — US-2

Scénarios : `tests/Tarification.UnitTests/Features/remise-par-palier.feature` ; étapes :
`tests/Tarification.UnitTests/Steps/RemiseParPalierSteps.cs`. Aucune doublure en usage dans le projet.

| Scénario | Cas d'usage | Couche | Doublure | Walking skeleton |
|---|---|---|---|---|
| @ac-1 | `CalculDuPanier` | Application | aucune | non |
| @ac-2 | `CalculDuPanier` | Application | aucune | oui |
| @ac-3 | `CalculDuPanier` | Application | aucune | non |
| @ac-4 | `CalculDuPanier` | Application | aucune | non |
| @ac-5 | `CalculDuPanier` | Application | aucune | non |

- @ac-1 : role: regression — justification : la remise est déjà à 0,00 € (`Montant.Zero` en dur) ; le test garde la borne basse une fois la règle livrée.
- @ac-4 : role: regression — justification : même raison ; il garde la règle « par ligne » contre un cumul des quantités.
- @ac-5 : role: regression — justification : même raison ; il garde le cas sans barème.

Cas notés pour la boucle interne (non écrits) : validation de `Pourcentage` (0–100), doublons de seuil, ordre des paliers.
Arrondi au centime : non tranché ; réponse utilisateur « option la plus simple », sans arrondi (contracts.md).
Bouchons ajoutés : `Pourcentage`, `PalierDeRemise`, `BaremeDeRemises`, constructeur de `CalculDuPanier`.
