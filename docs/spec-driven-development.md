# Spec-Driven Development in this Repository

This project uses **Specification-Driven Development (SDD)** with GitHub Spec Kit.
Specifications define accepted behavior; plans explain the technical approach; tasks
make the work executable; code and verification evidence show what actually exists.
Codex should explain this workflow when asked and apply it by default under AGENTS.md.

## Choose the right scope

| Request                                                              | Where it belongs                                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| New capability or a bounded change needing its own acceptance/review | New numbered package under specs/, referencing the MVP and any earlier package it extends.  |
| Small extension with no need for independent tracking                | Amend the existing feature's spec/contract and append tasks; retain completed history.      |
| Bug against an accepted requirement                                  | Reference that requirement, fix the implementation and update evidence proportionally.      |
| Small copy/style adjustment                                          | Update the UI contract and affected acceptance text; avoid unnecessary feature scaffolding. |
| Learning material or internal documentation                          | Keep it under docs/ and verify links/examples; do not pretend it is an application feature. |

Both a new package and an amendment can be correct. The deciding factors are scope,
reviewability and independent acceptance, not whether a change touches an existing page.
For this multi-part iteration, 002-refine-interface adds communication, favicon and admin
semantic-detail changes; 001-manage-order-returns remains the MVP/domain baseline.

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
| Release      | Request a commit/deployment within the intended environment               | Reviewable changes, verified CI/build, controlled migrations and public smoke evidence                              | Repository npm commands and docs/deployment.md                               |

Optional: `$speckit-checklist` reviews requirement quality for a chosen concern;
`$speckit-converge` audits unbuilt scope; `$speckit-analyze` checks cross-artifact
consistency. `$speckit-taskstoissues` is deprecated. None implies a release permission.

"Plan this change and run the SDD planning phases automatically, excluding constitution"
means specify → clarify as needed → plan → tasks → analyze. Implementation is a separate
instruction. "Implement feature 002" authorizes its tasks; it does not automatically
complete unrelated deployment tasks still pending in feature 001.

## Select the feature explicitly

Run shell helpers from the repository root. Installed scripts resolve the directory
from `SPECIFY_FEATURE_DIRECTORY`, then the ignored `.specify/feature.json` pointer.
Do not infer it from the Git branch. `SPECIFY_FEATURE` is a branch-context hint in this
installation; it is not a substitute for the feature-directory path override.

```bash
export SPECIFY_FEATURE_DIRECTORY=specs/002-refine-interface

.specify/scripts/bash/check-prerequisites.sh --json --paths-only
.specify/scripts/bash/setup-plan.sh --json
.specify/scripts/bash/setup-tasks.sh --json
.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks
```

The setup scripts preserve existing plan/task files; they do not write the plan or
mark tasks complete. For a **new** feature, let speckit-specify select the next number
and create its spec. Do not run create-new-feature.sh on an existing feature as a way
to select it. Branch creation is a separate optional workflow, not the source of truth.
Use SPECIFY_FEATURE_NO_PERSIST=1 for read-only helper checks if pointer changes are not
wanted. Keep .specify/feature.json ignored and never commit workstation paths/secrets.

## Structure and source of truth

```text
.specify/memory/constitution.md       Project-wide principles
specs/001-manage-order-returns/       Existing MVP/domain baseline
specs/002-refine-interface/           Bounded follow-up change
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
docs/                               Reusable operational/development/learning guides
```

IDs are local to a package: write `002/FR-001` when comparing features so it is not
confused with `001/FR-001`. A later specification explicitly identifies which baseline
presentation rules it supersedes. Domain rules remain in the baseline unless a later
approved change deliberately updates them. Do not duplicate or rewrite completed
baseline tasks just to make a new package appear complete.

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
