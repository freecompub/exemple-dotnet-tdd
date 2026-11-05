# Implementation Plan — US-2 — Remise par palier de quantité

Ordre de livraison, de l'extérieur (cas d'usage `CalculDuPanier.Chiffrer`) vers l'intérieur
(objets-valeurs du domaine), conformément à `contracts.md` et `domain-model.md`.

## Bouchons de compilation posés en DISTILL

Pour que les 5 scénarios ci-dessous compilent et échouent sur leur assertion métier (quand ce
n'est pas déjà le cas), les fichiers suivants portent des signatures minimales :

- `src/Tarification.Domaine/PalierDeRemise.cs` (nouveau) — fabrique `De(Quantite, decimal)`
  entièrement validée (patron `Montant.De`/`Quantite.De`, pas une logique métier à différer).
- `src/Tarification.Domaine/GrilleDeRemise.cs` (nouveau) — `Vide`, `De(...)` validés ;
  `PalierLePlusAvantageux(Quantite)` stub, retourne toujours `null` (la sélection du palier le
  plus avantageux est la logique métier à construire dans la boucle interne).
- `src/Tarification.Domaine/Montant.cs` (étendu) — `Pourcentage(decimal)` implémenté entièrement :
  calcul pur, pas de règle métier propre à la story à différer (même statut que `Multiplie(int)`
  déjà en place).
- `src/Tarification.Domaine/LigneDePanier.cs` (étendu) — `Remise(GrilleDeRemise)` stub, retourne
  toujours `Montant.Zero` (ignore volontairement `GrilleDeRemise.PalierLePlusAvantageux` tant que
  celui-ci n'est pas implémenté).
- `src/Tarification.Application/CalculDuPanier.cs` (étendu) — nouvelle surcharge
  `Chiffrer(Panier, GrilleDeRemise)` qui somme `ligne.Remise(grille)` sur toutes les lignes
  (orchestration, conforme à la formule de `contracts.md`) ; l'ancienne surcharge
  `Chiffrer(Panier)` est conservée et délègue à `Chiffrer(panier, GrilleDeRemise.Vide)`, pour ne
  pas casser la compilation de `tests/Tarification.Tests/CalculDuPanierTests.cs` (hors périmètre
  d'écriture de cette phase) ; sa suppression, prévue par `contracts.md`, est un geste de la
  boucle interne de livraison, pas de DISTILL.

## Étapes

### Étape 1 — ac-1 (walking skeleton)
- Test : `tests/Tarification.Tests/RemiseParPalierDeQuantiteAcceptanceTests.cs`
- Entre par : `CalculDuPanier.Chiffrer(Panier, GrilleDeRemise)`
- Déjà vert avec le bouchon (voir `test-plan.md`, tests à requalifier) : confirme que le câblage
  bout en bout (grille → ligne → facture) ne casse rien sous le seuil.

### Étape 2 — ac-2
- Test : `tests/Tarification.Tests/RemiseParPalierDeQuantiteAcceptanceTests.cs`
- Entre par : `CalculDuPanier.Chiffrer(Panier, GrilleDeRemise)`
- Rouge sur l'assertion métier (0,00 € obtenu, 1,00 € attendu) : fait émerger
  `GrilleDeRemise.PalierLePlusAvantageux` (un seul palier, seuil atteint) et
  `Montant.Pourcentage` appelé réellement depuis `LigneDePanier.Remise`.

### Étape 3 — ac-3
- Test : `tests/Tarification.Tests/RemiseParPalierDeQuantiteAcceptanceTests.cs`
- Entre par : `CalculDuPanier.Chiffrer(Panier, GrilleDeRemise)`
- Rouge sur l'assertion métier (0,00 € obtenu, 12,00 € attendu) : fait émerger la règle « le taux
  le plus élevé gagne parmi les paliers atteints », pas le seuil le plus élevé.

### Étape 4 — ac-4
- Test : `tests/Tarification.Tests/RemiseParPalierDeQuantiteAcceptanceTests.cs`
- Entre par : `CalculDuPanier.Chiffrer(Panier, GrilleDeRemise)`
- Déjà vert avec le bouchon (voir `test-plan.md`) ; reste vert après l'étape 2/3 si
  `LigneDePanier.Remise` n'utilise que la quantité de sa propre ligne — garde-fou contre une
  implémentation qui sommerait les quantités du panier.

### Étape 5 — ac-5
- Test : `tests/Tarification.Tests/RemiseParPalierDeQuantiteAcceptanceTests.cs`
- Entre par : `CalculDuPanier.Chiffrer(Panier, GrilleDeRemise)`
- Déjà vert avec le bouchon (voir `test-plan.md`) ; reste vert après les étapes 2/3 car
  `GrilleDeRemise.Vide` ne contient aucun palier dont le seuil puisse être atteint.
