# Ordered delivery tests

All application tests enter CalculDuPanier.Chiffrer with real objects; no doubles.
Rules reside in Panier, LigneDePanier and the contracted Domain values.

| # | Level | Behaviour | TPP | Contradiction |
|---|---|---|---|---|
| 1 | acceptance | AC-2 reached tier (committed by DISTILL) | nil→constant | Remise is zero, not 1.00 |
| 2 | unit, Application | AC-2 net payable after discount | constant→scalar | Net is zero, not 19.00 |
| 3 | acceptance | AC-3 most advantageous tier | scalar→array | A single selected tier gives 5.00, not 12.00 |
| 4 | acceptance | AC-1 below threshold | unconditional→if | Unconditional rate gives 0.90, not zero |
| 5 | acceptance | AC-4 distinct references | coverage if already green | Lines must remain separate |
| 6 | acceptance | AC-5 empty tiers | coverage if already green | Empty tiers must preserve 20.00 |
| 7 | unit, Domain | Contract rejects out-of-range rate | unconditional→if | Factory currently accepts any decimal |
