<!-- markdownlint-disable-file -->
# QA report — us-02

Status: `done: PUBLISH closed`

## Test plan

[details/2026-11-06/test-plan-us-02.md](details/2026-11-06/test-plan-us-02.md), written in DISTILL.

## Gates

### exemple-dotnet-tdd

| Gate | Status | Time | Evidence |
| --- | --- | ---: | --- |
| build | pass | 1 s | [gates/exemple-dotnet-tdd/build-2.log](gates/exemple-dotnet-tdd/build-2.log) |
| format | pass | 3 s | [gates/exemple-dotnet-tdd/format-2.log](gates/exemple-dotnet-tdd/format-2.log) |
| test | pass | 1 s | [gates/exemple-dotnet-tdd/test-2.log](gates/exemple-dotnet-tdd/test-2.log) |
| mutation | pass | 16 s | [gates/exemple-dotnet-tdd/mutation-1.log](gates/exemple-dotnet-tdd/mutation-1.log) |

Mutation score: core 100 % (bar 100 %, 1 mutant), boundary 82 % (bar 80 %, 46 mutants).

Surviving mutants:

- `src/Tarification.Domaine/Montant.cs:32 Block removal mutation ({}) has no test covering it`
- `src/Tarification.Domaine/PaliersDeRemise.cs:22 Logical mutation (autre is not null || _paliers.SequenceEqual(autre._paliers)) has no test covering it`
- `src/Tarification.Domaine/PaliersDeRemise.cs:22 Equality mutation (autre is null) has no test covering it`
- `src/Tarification.Domaine/TauxDeRemise.cs:11 Equality mutation (<= 0) survived`
- `src/Tarification.Domaine/TauxDeRemise.cs:11 Equality mutation (>= 100) survived`
- `src/Tarification.Domaine/TauxDeRemise.cs:12 String mutation ("") survived`
- `src/Tarification.Domaine/TauxDeRemise.cs:18 Conditional (false) mutation ((false?this :autre)) survived`
- `src/Tarification.Domaine/TauxDeRemise.cs:18 Equality mutation (Pourcentage > autre.Pourcentage) survived`

## TDD red commits

| Commit | Subject | Replay exit code |
| --- | --- | ---: |
| `1635055` | `test(us-02): add failing acceptance test for quantity tier discount` | 1 |
| `cad2afa` | `test(us-02): keep first acceptance test red on empty skeleton` | 1 |
| `67c0943` | `test(us-02): demand net payable after the reached tier discount` | 1 |
| `9d52b7f` | `test(us-02): require only the most advantageous quantity tier` | 1 |
| `168e5a0` | `test(us-02): refuse a tier discount below its quantity threshold` | 1 |
| `2ed4fb0` | `test(us-02): reject rates outside the contracted percentage range` | 1 |

## Reviews

| Review | Pass | Verdict | Findings | Lenses |
| --- | ---: | --- | ---: | --- |
| design_review | 1 | approved | 1 | consistency fail (1), architecture-compliance pass, fitness pass |
| distill_review | 2 | approved | 4 | coverage pass, business-alignment fail (3), testability pass, boundary-enforcement fail (1) |
| deliver_review | 2 | approved | 5 | test-integrity fail (1), architecture-boundaries fail (4), cold-reader pass |
