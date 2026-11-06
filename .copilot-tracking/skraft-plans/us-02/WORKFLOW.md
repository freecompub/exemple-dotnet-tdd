<!-- markdownlint-disable-file -->
# Workflow — us-02

done: PUBLISH closed

## RESEARCH

- [x] research — solution-researcher: done

## DESIGN

- [x] design — solution-architect: done
- [x] design_review — consistency, architecture-compliance, fitness: approved
- [x] adr — adr-ratification: answered

## DISTILL

- [x] distill — acceptance-designer: done, pass 2
- [x] distill_review — coverage, business-alignment, testability, boundary-enforcement: approved, pass 2

## DELIVER

- [x] deliver — software-engineer: done, pass 2
- [x] gates — build, format, lint, test, architecture, coverage: pass, pass 2
- [x] deliver_review — test-integrity, architecture-boundaries, cold-reader, mock-fidelity, contract-fidelity: approved, pass 2
- [x] mutation — mutation: pass
- [ ] kill_proposal — software-engineer
- [ ] mutation_plan — mutation-plan
- [ ] kill_mutants — software-engineer
- [ ] mutation_review — test-integrity
- [ ] mutation_gates — build, format, lint, test, architecture, coverage
- [x] visuals — publish playwright-visuals: skipped

## PUBLISH

- [x] pr_writer — pr-writer: done
- [x] publish — publish pull-request: local
