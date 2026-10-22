# Tasks: Interface Refinement

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/ui.md and quickstart.md.
All ten application tasks below are implemented and locally verified on 2026-10-22. IDs are local to feature 002. Do not carry
baseline deployment tasks into this feature or mark them complete by association.

## Phase 1 — User Story 1: Clear communication (P1)

**Independent test**: landing/direct-entry and return journeys retain compact Demo
identity and contextual limits without ordinary disclaimer repetition.

- [x] T001 [US1] Update src/components/brand.tsx, src/components/workspace-shell.tsx, src/components/customer-picker.tsx and src/app/page.tsx per contracts/ui.md; remove redundant global/rail/landing copy and retain one Demo identifier, accessible names and stable profile geometry. Adjust src/app/globals.css only for the compact identity and removed blocks. Covers FR-001/002/004.
- [x] T002 [P] [US1] Simplify customer notes, selection/review/success and image descriptions in src/components/orders-screen.tsx, src/components/return-form.tsx and src/components/order-sheet.tsx without changing stored data, prices, reasons, quantities or next steps. Covers FR-002/004.
- [x] T003 [US1] Consolidate state-specific approval/receipt limits in src/components/admin-review.tsx, src/components/return-instructions.tsx and src/components/return-guide.tsx using the contract, preserving baseline FR-019/020/041 and canonical labels/actions. Covers FR-003/004.
- [x] T004 [P] [US1] Simplify settings/reset copy in src/components/demo-reset.tsx and metadata in src/app/layout.tsx while preserving loss, irreversibility, inactivity, recovery and tab context. Covers FR-002/004.

## Phase 2 — User Story 2: Branded favicon (P2)

**Independent test**: recognizable 16/32px identity and valid icon links/resources on
landing and nested routes, with a fresh browser context to avoid stale-cache conclusions.

- [x] T005 [P] [US2] Add src/app/icon.svg and src/app/favicon.ico derived from the existing parcel/return mark, with self-contained contrast and 16/32/48px ICO entries; use App Router metadata conventions and avoid duplicate/default icons. Covers FR-005/SC-004.

## Phase 3 — User Story 3: Detail semantic parity (P2)

**Independent test**: all five states have matching evidence semantics across views,
with neutral customer reasons and distinct red rejection, soft approval and green receipt.

- [x] T006 [US3] Align administrator detail surfaces in src/components/admin-review.tsx with src/components/customer-returns.tsx and src/components/return-instructions.tsx using src/app/globals.css semantic classes/tokens; preserve multiline/long reasons, full-width blocks, heading spacing, labels and role actions. Extract a shared panel only if warranted. Depends on T001/T003 to avoid conflicting copy/style edits. Covers FR-006/SC-005.

## Phase 4 — Acceptance and delivery

- [x] T007 [US1] Add bounded behavior acceptance in tests/e2e/communication.spec.ts and update approved-copy selectors in affected tests/e2e files; cover direct entry, four consequence scenarios, picker accessibility, guide/reset/expiry and light/dark 360/1280px. Reuse receive-return, full-demo, reset-expiry and loading-states tests rather than global banned-word scans or string-only unit tests. Depends on T001–T004; covers FR-001–004/SC-001–003.
- [x] T008 [P] [US2] Verify generated icon links, valid SVG/ICO response types and no missing/conflicting icons in tests/e2e/communication.spec.ts or a dedicated tests/e2e/favicon.spec.ts; visually review 16/32px light/dark renderings and fresh-context landing/nested routes. Use a separate favicon.spec.ts if running alongside T007. Depends on T005; covers FR-005/SC-004.
- [x] T009 [US3] Extend tests/e2e/admin-review.spec.ts and affected detail scenarios with the five-state semantic mapping, explicit labels, multiline/long reasons, widths, theme contrast and 360/1280px behavior. Compare corresponding customer detail semantics and retain existing decisions/history tests. Depends on T006; covers FR-006/SC-005.
- [x] T010 Run lint, typecheck, focused browser checks and production build; visually review all three stories and record actual evidence/limits in specs/002-refine-interface/validation.md. Align README.md's interface summary only when runtime changes land. Depends on T007/T008/T009; covers all requirements and criteria.

## Dependencies, parallel work and delivery

No new setup/backend foundation is needed. T001–T004 form US1; only T002/T004 are
file-disjoint parallel opportunities. T005 can proceed independently. T006 follows
T001/T003 because admin/instructions/CSS overlap. T007–T009 follow their story's changes;
T008 may run in parallel only in its own test file. T010 follows all verification tasks.
Example file-level concurrency: T002 customer flow with T005 icon assets. This is not
an instruction to spawn agents. Deliver the complete refinement after all checks pass.

| Requirement / criterion | Implementation   | Verification |
| ----------------------- | ---------------- | ------------ |
| FR-001 / SC-001         | T001             | T007, T010   |
| FR-002 / SC-001         | T001, T002, T004 | T007, T010   |
| FR-003 / SC-002         | T003             | T007, T010   |
| FR-004 / SC-003         | T001–T004        | T007, T010   |
| FR-005 / SC-004         | T005             | T008, T010   |
| FR-006 / SC-005         | T006             | T009, T010   |

The former uncommitted 001/T117–T122 communication draft maps to 002/T001–T004,
T007 and T010. No completed-task history is rewritten. Favicon/detail-parity add T005,
T006, T008 and T009. All ten application tasks are complete after local verification; see validation.md.
Production deployment and baseline release tasks are separate.
