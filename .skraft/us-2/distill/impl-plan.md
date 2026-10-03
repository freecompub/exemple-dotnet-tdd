# Plan d'implémentation (bouchons DISTILL) — US-2 : Remise par palier de quantité

Ce plan liste uniquement les bouchons posés pour que
`tests/Tarification.Tests/RemiseParPalierAcceptanceTests.cs` compile et échoue sur son assertion
métier (pas sur un symbole manquant). Ce ne sont **pas** des implémentations définitives — la
boucle `outside-in-tdd` reprendra ces fichiers pour faire passer @ac-2 et @ac-3 au vert.

## `Tarification.Domaine`

- **`Taux`** (nouveau, `src/Tarification.Domaine/Taux.cs`) : `readonly record struct` avec
  `Valeur` (`decimal`) et fabrique `De(decimal)`. Aucune validation de borne posée en bouchon
  (aucun AC n'exerce une valeur hors `[0, 1]`) — la validation `[0, 1]` décrite dans
  `design/contracts.md` reste à ajouter par la boucle interne si un critère l'exige.
- **`Palier`** (nouveau, `src/Tarification.Domaine/Palier.cs`) : `readonly record struct` positional
  `(Quantite Seuil, Taux Taux)`, conforme à `design/contracts.md`.
- **`GrilleDePaliers`** (nouveau, `src/Tarification.Domaine/GrilleDePaliers.cs`) : `De(IEnumerable<Palier>)`
  et `Vide` existent et compilent ; **`PalierApplicable(Quantite)` retourne toujours `null`,
  quelle que soit la grille** — c'est le bouchon délibérément incomplet : la vraie règle de
  sélection (« le taux maximal parmi les paliers atteints », `design/contracts.md`) n'est pas
  posée ici, elle revient à la boucle interne. C'est ce bouchon qui produit le rouge « pour la
  bonne raison » sur @ac-2 et @ac-3.
- **`Montant.Multiplie(Taux)`** (ajout dans `Montant.cs`) : bouchon trivial (`Montant.Zero`),
  jamais exercé par les tests actuels puisque `PalierApplicable` ne retourne jamais de palier non
  nul. Posé uniquement pour que la signature utilisée par `LigneDePanier.Remise` compile.
- **`LigneDePanier.Remise(GrilleDePaliers)`** (ajout dans `LigneDePanier.cs`) : délégation directe
  vers `GrilleDePaliers.PalierApplicable` — pas de logique propre, donc pas de décision métier
  anticipée ; hérite du bouchon ci-dessus.
- **`Panier.SommeDesRemises(GrilleDePaliers)`** (ajout dans `Panier.cs`) : agrégation ligne par
  ligne, symétrique à `SommeDesLignes()` existant — pas de logique propre.

## `Tarification.Application`

- **`CalculDuPanier.Chiffrer`** : une **surcharge** `Chiffrer(Panier, GrilleDePaliers)` est ajoutée
  à côté de la signature existante `Chiffrer(Panier)` (qui délègue à la nouvelle avec
  `GrilleDePaliers.Vide`), plutôt que de modifier la signature existante comme l'envisage
  `design/contracts.md`. Raison : `tests/Tarification.Tests/CalculDuPanierTests.cs` (US-1, déjà
  livrée) est hors du périmètre d'écriture de cette phase — il ne doit pas être touché. La
  surcharge préserve ces appels existants sans en changer le comportement (remise nulle via
  `GrilleDePaliers.Vide`). La boucle interne pourra fusionner les deux signatures si elle migre
  aussi ces tests.
- **`Facture.ATPayer`** : corrigé en `SommeDesArticles.Soustrait(Remise) + FraisDePort`, conforme à
  `design/contracts.md` et `design/consistency-matrix.md`. Revu après un rejet cold-reader : sans
  cette correction, un lecteur découvrant uniquement le code (sans le journal de phase) voyait un
  total facturé incohérent avec un champ `Remise` désormais non nul. Le commentaire XML de
  `Facture` est mis à jour en conséquence (la remise n'est plus présentée comme figée à zéro).
  Aucun AC ne porte de valeur explicite sur `ATPayer` — cette correction n'est donc exercée par
  aucun test d'acceptance gelé, mais elle élimine une incohérence de lecture signalée en revue.

## Statut attendu après `run_tests`

- 🔴 `Ac2_...` et `Ac3_...` : rouges, sur l'assertion de remise (valeur attendue non nulle vs.
  `Montant.Zero` renvoyé par le bouchon) — pas sur un symbole manquant.
- 🟢 `Ac1_...`, `Ac4_...`, `Ac5_...` : verts par coïncidence du bouchon (voir `test-plan.md`,
  section « Tests déjà verts »).
- 🟢 Les tests existants (`CalculDuPanierTests.cs`, US-1) restent verts : la surcharge préserve leur
  comportement.
