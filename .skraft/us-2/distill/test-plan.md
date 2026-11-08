# Plan de test — US-2 Remise par palier de quantité

Source : `design/contracts.md` (point d'entrée `CalculDuPanier.Chiffrer`), `passation.md`.
Feature : `tests/Tarification.UnitTests/Features/panier-remise-par-palier.feature`
Étapes : `tests/Tarification.UnitTests/Steps/ChiffrageDuPanierSteps.cs`

| Scénario | Cas d'usage | Couche | Doublure | Walking skeleton |
|---|---|---|---|---|
| @ac-1 | `CalculDuPanier` | Application | aucune | non |
| @ac-2 | `CalculDuPanier` | Application | aucune | oui |
| @ac-3 | `CalculDuPanier` | Application | aucune | non |
| @ac-4 | `CalculDuPanier` | Application | aucune | non |
| @ac-5 | `CalculDuPanier` | Application | aucune | non |

Aucune doublure : le projet n'en utilise pas et aucun stockage n'existe (objets du domaine réels).

- @ac-1 : role: regression — justification : la remise vaut déjà 0,00 € (`Facture.Remise` est à `Montant.Zero`), le scénario protège contre une remise appliquée sous le seuil.
- @ac-4 : role: regression — justification : idem, la remise vaut déjà 0,00 € ; protège contre un cumul des quantités entre lignes.
- @ac-5 : role: regression — justification : idem, la remise vaut déjà 0,00 € ; protège la grille vide.

Tests hérités de US-1 (`panier-chiffrage.feature`, `ChiffrerUnPanierLigneALigneFeature`), dont les titres portent AC-1 à AC-3 propres à US-1 ; ils passent déjà et ne pilotent aucun comportement de US-2 :
- @ac-2 : role: regression — justification : `Tarification.UnitTests.Features.ChiffrerUnPanierLigneALigneFeature.AC_2LeClientChiffrePlusieursLignes` (US-1, somme de plusieurs lignes) est livré par US-1 ; il protège la somme des articles, qui ne doit pas changer avec la remise. Le critère 2 de US-2 est piloté par `RemiseParPalierDeQuantiteFeature.AC_2…`.
- @ac-3 : role: regression — justification : `Tarification.UnitTests.Features.ChiffrerUnPanierLigneALigneFeature.AC_3LeClientChiffreUnPanierVide` (US-1, panier vide) est livré par US-1 ; il protège le panier vide avec la grille par défaut. Le critère 3 de US-2 est piloté par `RemiseParPalierDeQuantiteFeature.AC_3…`.

Rouges attendus : @ac-2 (remise 0,00 € obtenue au lieu de 1,00 €) et @ac-3 (0,00 € au lieu de 12,00 €).

## Compte des tests exécutés (dernière exécution : 10 tests, 8 réussis, 2 en échec)
- 5 scénarios de US-2 (`panier-remise-par-palier.feature`) : 2 en échec (@ac-2, @ac-3), 3 réussis (@ac-1, @ac-4, @ac-5).
- 3 scénarios de US-1 (`panier-chiffrage.feature`) : réussis.
- 2 tests xUnit `[Fact]` de `tests/Tarification.Tests/CalculDuPanierTests.cs` (US-1) : réussis ; ils ne sont pas des scénarios Gherkin, d'où l'écart avec les 8 scénarios.

## Cas notés, non écrits
- Mandat 4 : `GrilleDePaliers.RemisePour` n'existe pas encore (seuls `Vide` et `De` sont posés). Aucune extraction de test de domaine n'est décidée ici ; l'examen des branches de `RemisePour` (mandat 4) et toute mesure de mutation sont renvoyés à DELIVER, rien n'est mesuré à ce stade.
- Taux négatif → `ArgumentOutOfRangeException` : cas de boucle interne (type-valeur).
- Arrondi, grilles non monotones, seuils en double : non spécifiés, option la plus simple (`passation.md`) ; pas de scénario.
