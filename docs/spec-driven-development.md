# Spec-Driven Development in this Repository

This project uses **Specification-Driven Development (SDD)** with GitHub Spec Kit.
Specifications define accepted behavior; plans explain the technical approach; tasks
make the work executable; code and verification evidence show what actually exists.
Codex should explain this workflow when asked and apply it by default under AGENTS.md.

## Choose the right scope

| Request                                                              | Where it belongs                                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Distinct capability with its own user goal and independently testable scope | New numbered package under specs/, referencing existing capabilities it depends on or changes. |
| Extension, UI refinement or iteration within an existing capability   | Update the existing spec/contract/plan and append uniquely numbered tasks; retain completed history. |
| Bug against an accepted requirement                                  | Reference that requirement, fix the implementation and update evidence proportionally.      |
| Small copy/style adjustment                                          | Update the UI contract and affected acceptance text; avoid unnecessary feature scaffolding. |
| Reusable internal documentation                                      | Keep it under docs/ and verify links/examples; personal learning material remains local/unversioned. |

Default to evolving the specification that already owns the behavior. In this repository,
communication, favicon and administrator detail styling refine the existing order/return
experience, so they belong in 001-manage-order-returns. They are FR-042–047/SC-016–020,
with completed tasks T117–T126. The separate interface package has been consolidated.

Create a new specification when a request introduces a distinct user goal and a coherent
acceptance scope that can be described and tested on its own. For example, a future
product-exchange workflow would have different outcomes and rules from a return; it
would require a new spec and explicit scope approval. Changing return-reason copy,
adding a favicon, improving skeletons or refining rejection panels updates the existing
spec instead. A new database table is neither required nor sufficient for a new feature.
Separate release timing, diff size or a Git branch does not by itself justify a new spec.

This boundary is the project's workflow convention, not a universal Spec Kit mandate.
The official [SDD guide](https://github.com/github/spec-kit/blob/main/spec-driven.md)
describes evolving specifications and continuous refinement. The official
[specify command template](https://github.com/github/spec-kit/blob/main/templates/commands/specify.md)
also supports numbered feature directories and an explicitly selected directory. These
sources support both evolving intent and separate features; they do not prescribe a
single granularity for every change. State the ownership decision before creating files.

When amending, update accepted behavior first, adjust affected design/contracts, then
append tasks after the highest existing ID. Never regenerate the whole completed task
list. Preserve old IDs and completion evidence; use a mapping if consolidating a package.
When creating a distinct feature, document dependencies and update existing specifications
whose behavior is intentionally changed, keeping one clear owner for each requirement.

## What to send Codex

You may write the request in Spanish. All recorded project information and UI copy stay
in English. Describe outcomes before implementation choices:

```text
Goal: What should improve, and why?
Users and entry point: Who uses it, and on which screen or action?
Current behavior: What happens now? Include a reproducible example if relevant.
Expected behavior: What should happen instead?
Rules and limits: Eligibility, quantities, states, allowed actions and error cases.
Acceptance examples: Given [context], when [action], then [observable result].
Scope: What is included and what should remain unchanged?
Delivery: Plan only / implement specified tasks / commit / deploy.
References: Screens, files or examples that help explain the request.
```

Example: "Plan a clearer request detail for administrators. Rejection explanations
should use the same semantic treatment as the customer detail. Preserve states, actions,
original reasons and both themes. Do not implement or deploy yet."

For a new business feature, include at least one valid case, one invalid case and the
expected state/data outcome. You do not need to choose database tables or frameworks.
Codex should ask only consequential unresolved questions and document agreed answers;
it must not invent a business rule or fabricate a clarification answer.

## Phase and command map

Commands below beginning with `$` are **Codex skill invocations in chat**, not Bash
commands. Shell scripts are support utilities; they do not perform the reasoning or
replace a specification, human review, tests or acceptance evidence.

| Phase        | Codex instruction                                                         | Output / purpose                                                                                                    | Supporting shell utility                                                     |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Constitution | `$speckit-constitution` only for an explicitly requested principle change | .specify/memory/constitution.md; requires owner review. Existing principles are normally read, not regenerated.     | resolve-template.sh constitution-template --json                             |
| Specify      | `$speckit-specify` plus the goal and acceptance examples                  | specs/NNN-name/spec.md and a requirements-quality checklist                                                         | resolve-template.sh spec-template --json                                     |
| Clarify      | `$speckit-clarify`                                                        | Consequential questions, accepted answers recorded in spec.md, or an explicit no-critical-ambiguity result          | check-prerequisites.sh --json --paths-only                                   |
| Plan         | `$speckit-plan`                                                           | plan.md, research.md, data-model.md, contracts/ and quickstart.md, proportionate to scope                           | setup-plan.sh --json                                                         |
| Tasks        | `$speckit-tasks`                                                          | Dependency-ordered tasks.md, requirement mapping and verification tasks                                             | setup-tasks.sh --json                                                        |
| Analyze      | `$speckit-analyze`                                                        | Read-only consistency/coverage/constitution report; not automatic implementation                                    | check-prerequisites.sh --json --require-spec --require-tasks --include-tasks |
| Implement    | `$speckit-implement`, naming the feature/tasks                            | Authorized code/artifact changes and executed verification; completed tasks checked only after their own acceptance | check-prerequisites.sh --json --require-tasks --include-tasks                |
| Converge     | `$speckit-converge` after implementation and verification                 | Assess current code against spec/plan/all tasks and constitution; append remaining work or report convergence         | check-prerequisites.sh --json --require-spec --require-tasks --include-tasks |
| Release      | Request a commit/deployment within the intended environment               | Reviewable changes, verified CI/build, controlled migrations and public smoke evidence                              | Repository npm commands and docs/deployment.md                               |

Optional: `$speckit-checklist` reviews requirement quality for a chosen concern.
`$speckit-analyze` checks cross-artifact consistency before implementation;
`$speckit-converge` checks implementation coverage afterward and is part of this
repository's default feature-delivery flow. `$speckit-taskstoissues` is deprecated.
None implies release permission.

"Plan this change and run the SDD planning phases automatically, excluding constitution"
means specify → clarify as needed → plan → tasks → analyze. Implementation is a separate
instruction. "Implement the interface refinement" authorizes its tasks; it does not
automatically complete unrelated deployment tasks T097/T099.

## Close implementation with convergence

Use this sequence after the planning phases:

```text
implement → run appropriate checks → converge → review/release
                                      ↓ gaps
                             implement appended tasks
                                      ↓
                             checks → converge again
```

Run converge only after tasks have been generated and implement has run on that task
list. Name the feature explicitly, for example: `$speckit-converge for
specs/001-manage-order-returns`. The shell prerequisite helper resolves paths; it does not
perform the audit. The audit examines present code, not Git differences or history.
Every task is assessed regardless of its checkbox, along with requirements, acceptance
scenarios, plan decisions and governing constitutional constraints.

Converge classifies gaps as missing, partial, contradicting or unrequested work, reports
evidence and severity, and may only append a new numbered Convergence phase to tasks.md
with new IDs and source references. It must not edit specifications/plans/application
code, or rewrite existing tasks. If no actionable gaps remain, tasks.md stays byte-for-byte
unchanged. Fixing findings belongs to a subsequent authorized implement pass; a conflict
requiring a business decision still needs clarification.

Tests establish behavior for executed scenarios; convergence checks coverage against
intent. Neither substitutes for the other. A clean feature audit does not establish
production acceptance or complete another feature's pending tasks. Record scope,
findings/counts and evidence limits in the handoff; any separately requested documentation
update happens after converge, outside its append-only task-writing contract.

## Select the feature explicitly

Run shell helpers from the repository root. Installed scripts resolve the directory
from `SPECIFY_FEATURE_DIRECTORY`, then the ignored `.specify/feature.json` pointer.
Do not infer it from the Git branch. `SPECIFY_FEATURE` is a branch-context hint in this
installation; it is not a substitute for the feature-directory path override.

```bash
export SPECIFY_FEATURE_DIRECTORY=specs/001-manage-order-returns

.specify/scripts/bash/check-prerequisites.sh --json --paths-only
.specify/scripts/bash/setup-plan.sh --json
.specify/scripts/bash/setup-tasks.sh --json
.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks
```

For amendments, explicitly select the current directory and edit its artifacts without
replacing completed content. Review a helper/skill's installed behavior before invoking
it on populated files; selecting a directory does not make template copying harmless.
The scripts do not perform the reasoning or mark tasks complete.
For a **new** feature, let speckit-specify select the next number
and create its spec. Do not run create-new-feature.sh on an existing feature as a way
to select it. Branch creation is a separate optional workflow, not the source of truth.
Use SPECIFY_FEATURE_NO_PERSIST=1 for read-only helper checks if pointer changes are not
wanted. Keep .specify/feature.json ignored and never commit workstation paths/secrets.

## Structure and source of truth

```text
.specify/memory/constitution.md       Project-wide principles
specs/001-manage-order-returns/       MVP and refinements to its existing capabilities
  spec.md                            What/why; scenarios, requirements and outcomes
  plan.md                            How; architecture, constraints and delivery
  research.md                        Decisions, rationale and alternatives
  data-model.md                      Data impact, including explicitly no changes
  contracts/ui.md                    User interface/copy agreement
  contracts/http.md                  Only if HTTP contracts change
  quickstart.md                      Runnable validation journey
  tasks.md                           Dependency-ordered implementation/checks
  validation.md                      Actual commands, evidence and limits
  checklists/requirements.md          Requirement quality, not app-test results
docs/                               Reusable operational/development guides
```

IDs are local to a feature directory. Within 001, keep FR-001–041, SC-001–015 and
T001–T116 stable; the interface refinement extends those sequences. For future separate
features, qualify cross-feature references with their directory/number. Do not duplicate
or rewrite completed tasks to make a new package appear complete. Historical evidence
may retain retired identifiers when an explicit migration map explains their current IDs.

## Evidence and implementation boundaries

A quality checklist passing means the documents are coherent; it does not mean UI,
API or database tests ran. Keep planned tasks unchecked. During implementation, select
meaningful existing or new tests for the change, run shared-database suites sequentially,
use the guarded local test database and record actual results. Never run destructive
fixtures against Neon production. A successful local build does not establish public
acceptance or scheduled cleanup. Keep real secrets and generated evidence out of Git.

Read [AGENTS.md](../AGENTS.md), the relevant package and
[deployment.md](deployment.md). For methodology and tooling refreshers, use
[GitHub Spec Kit](https://github.com/github/spec-kit) and its
[SDD guide](https://github.com/github/spec-kit/blob/main/spec-driven.md).
