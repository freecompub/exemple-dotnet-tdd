67c0943 test(us-02): demand net payable after the reached tier discount
5e3a499 feat(us-02): calculate the reached tier discount and domain net
9d52b7f test(us-02): require only the most advantageous quantity tier
c81db0e feat(us-02): retain the most advantageous rate without stacking tiers
168e5a0 test(us-02): refuse a tier discount below its quantity threshold
aabc4f5 feat(us-02): admit each tier only when the line reaches its threshold
7eda3bb refactor(us-02): cover separate references below the tier threshold
4199a7c refactor(us-02): cover a basket with no configured discount tiers
2ed4fb0 test(us-02): reject rates outside the contracted percentage range PLAN_DEVIATION: Taux hors 0–100 / étape 6 — tests/Tarification.UnitTests/Domaine/TauxDeRemiseTests.cs → tests/Tarification.UnitTests/Features/RemiseParPalier/TauxDeRemiseTests.cs — clean-architecture-testing: test folders name the behavior, not the production layer
c3a38c7 feat(us-02): validate discount percentages in the domain factory
d0c2a4c refactor(us-02): respect domain value and single-dot rules
7df763b refactor(us-02): name the multiplied amount explicitly in the test
