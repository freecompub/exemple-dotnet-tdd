# Matrice de cohérence — US-2 : Remise par palier de quantité

Un seul contexte (**Tarification**, voir `context-map.md`), aucune persistance, aucun event
sourcing (`event-model.md`) : tout le calcul est synchrone, en mémoire, dans un seul appel à
`CalculDuPanier.Chiffrer`. Il n'y a donc aucune cohérence éventuelle à documenter entre agrégats ou
contextes — la matrice ci-dessous relie chaque règle métier à sa portée, au type qui la porte, et
au critère d'acceptation qui la vérifie.

| Règle | Portée (cohérence) | Type responsable | Cohérence | Critère(s) source |
|---|---|---|---|---|
| Sous-total d'une ligne | Ligne (`LigneDePanier`) | `LigneDePanier.SousTotal` (existant, US-1) | Immédiate — calcul pur, pas d'E/S | Base pour AC1–AC4 |
| Sélection du palier applicable à une quantité | Ligne (`LigneDePanier`), via une grille globale passée en paramètre | `GrilleDePaliers.PalierApplicable` | Immédiate — fonction pure sur la grille reçue | AC1, AC2, AC3, AC5 |
| Remise d'une ligne | Ligne (`LigneDePanier`) — ne lit que ses propres `Quantite`/`PrixUnitaire` et la grille reçue | `LigneDePanier.Remise` | Immédiate — aucune lecture d'une autre ligne ni du panier entier | AC1, AC2, AC3, AC5 |
| Absence d'agrégation inter-lignes avant remise | Panier (`Panier`) — chaque ligne est calculée isolément, puis seulement sommée | `Panier.SommeDesRemises` (boucle, pas de fusion de quantités) | Immédiate — la somme des résultats, jamais une somme des quantités avant calcul | AC4 |
| Grille vide ⇒ remise nulle pour toute ligne | Ligne, par construction de `GrilleDePaliers.Vide` | `GrilleDePaliers.Vide` + `GrilleDePaliers.PalierApplicable` (retourne toujours `null`) | Immédiate | AC5 |
| Montant à payer tient compte de la remise | Facture (`Facture`) — agrège les résultats de toutes les lignes du panier | `Facture.ATPayer` (`SommeDesArticles.Soustrait(Remise) + FraisDePort`) | Immédiate — un seul appel synchrone à `Chiffrer` | AC1, AC2, AC3 (valeurs de `ATPayer` attendues implicitement par la story) |
| Invariant « pas de montant négatif » préservé malgré la soustraction de la remise | Montant (`Montant`) | `Montant.Soustrait` (repasse par `Montant.De`) | Garantie structurelle : `Taux` ∈ [0, 1] borne la remise d'une ligne à son propre `SousTotal`, donc la somme des remises ne peut jamais excéder `SommeDesArticles` | Découle de AC1–AC3 ; aucun critère ne teste explicitement un dépassement, la garantie est démontrée par construction (voir `contracts.md`) |

## Points d'attention transmis à l'implémentation

- Aucune cohérence éventuelle (pas de file de messages, pas de projection asynchrone) : chaque
  ligne du tableau se résout dans le même appel synchrone que `CalculDuPanier.Chiffrer`
  (`event-model.md`, section Slice unique).
- Le changement de signature de `CalculDuPanier.Chiffrer` (ajout du paramètre `GrilleDePaliers`)
  casse la compatibilité binaire avec les appels existants (tests US-1) : ces appels doivent migrer
  vers `GrilleDePaliers.Vide` pour préserver leur résultat (`Remise` toujours nulle), conformément à
  AC5.
- La correction de `Facture.ATPayer` (soustraction de `Remise` manquante aujourd'hui) est incluse
  dans le périmètre de cette story, car c'est elle qui rend le défaut observable
  (`research.md`, section Découvertes et Passage de relais, point 4).
