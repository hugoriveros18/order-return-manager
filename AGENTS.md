# Order Returns Manager — Agent Instructions

## Project and language

This is a modular Next.js fullstack demo for returns against fictitious e-commerce
orders. Customer and administrator views simulate roles; they are not real accounts or
business-role authorization. No real payments, refunds, shipping or external notifications.
All project records, UI copy, code comments, specifications, plans, tasks and change
summaries must be in English. Conversations may use the user's preferred language.

Use strict TypeScript, React, Next.js App Router/Route Handlers, Tailwind CSS, PostgreSQL,
Prisma and Zod. `package.json`, `package-lock.json` and `.nvmrc` define actual versions
and commands; use npm and the lockfile. Keep the modular monolith and avoid speculative
abstractions, extra services or new dependencies without a concrete need.

## Read the relevant sources first

- [Constitution](.specify/memory/constitution.md): project principles and boundaries.
- The relevant `specs/<feature>/spec.md`: required behavior and acceptance criteria.
- That feature's `plan.md`, `tasks.md` and affected `contracts/`: implementation approach,
  execution state and UI/HTTP agreements. Read `data-model.md` for persistence changes.
- [README](README.md): runnable setup. The feature's `quickstart.md` and `validation.md`:
  verification scenarios, actual results and outstanding work.

The existing MVP baseline is [001-manage-order-returns](specs/001-manage-order-returns/spec.md).
Read only the additional sources needed for the task; do not preload every specification,
prototype or skill. Git branch names and remembered chat history do not replace the
versioned feature documents. Planning-time descriptions are historical: inspect current
code and validation evidence before assuming the application is still unimplemented.

## Spec-Driven Development is the default

For a new feature or a change to observable behavior, follow SDD even when the user does
not explicitly name Spec Kit. At the start, identify the relevant feature directory and
briefly state which artifacts will be created or updated before implementation.

| Work                                                                   | Required approach                                                                                                                                                               |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New independent capability                                             | Create `specs/<next-number>-<short-name>/`; define scenarios, requirements and acceptance criteria, then plan, generate tasks and implement.                                    |
| Extension to an existing capability                                    | Update its spec, affected contracts and plan first; append uniquely numbered tasks before implementing. Preserve completed-task history.                                        |
| Bug against an existing requirement                                    | Reference that requirement, fix the defect and verify it. Do not rewrite correct requirements to justify the bug. Update affected task/validation records proportionally.       |
| Visual/copy refinement with unchanged domain behavior                  | Update the existing UI contract and applicable acceptance text; extend plan/tasks if the scope warrants it. Do not generate a whole new feature package for a small adjustment. |
| Documentation-only change or internal refactor with unchanged behavior | Keep relevant documentation accurate and verify proportionally; do not invent a product requirement or a full SDD cycle.                                                        |

For feature work, use this sequence:

1. Specify the desired behavior, scope, scenarios and acceptance criteria.
2. Clarify only unresolved questions that affect behavior or acceptance. Pause the
   affected implementation on incomplete, contradictory or consequentially ambiguous
   requirements; continue independent work. Do not guess new business rules.
3. Plan the smallest compatible solution; update affected UI/HTTP contracts and data model.
4. Create dependency-ordered tasks, including meaningful verification; check consistency
   between spec, plan and tasks before implementation.
5. Implement the authorized tasks and keep requirements, code and tests traceable.
6. Run checks appropriate to the change. Mark a task complete only when its own
   implementation and acceptance checks are complete. Record actual outcomes and limits
   in the feature's validation record; update setup/scenario documentation as needed.

Use the repository's `.agents/skills/speckit-*/SKILL.md` workflows when available:
`speckit-specify` → `speckit-clarify` when needed → `speckit-plan` → `speckit-tasks` →
`speckit-analyze` → `speckit-implement`. Announce a skill on first use and follow its
instructions. If a skill is unavailable, use this document and `.specify/templates/`
to perform the equivalent artifact workflow; report the tooling limitation honestly.
Follow only the authorized scope, not every unrelated open task in the repository.

Continue through already authorized work without adding routine permission gates.
A request for alternatives or a plan authorizes that deliverable; an implementation
request authorizes the necessary artifact updates and implementation. Ask only when a
material ambiguity, constitutional amendment or unavailable authorization requires it.
Constitutional principles require the project owner's explicit review and documented
justification to change; this file does not amend them.

### Spec Kit reference

Consult [GitHub Spec Kit](https://github.com/github/spec-kit) for the toolkit overview,
setup and workflow documentation, and its [SDD guide](https://github.com/github/spec-kit/blob/main/spec-driven.md)
to review the methodology and specification → plan → tasks process. Use these references
when refreshing how Spec Kit works; use this repository's constitution, specifications
and installed skill instructions for project decisions and version-specific execution.

Spec Kit uses `SPECIFY_FEATURE` or the ignored `.specify/feature.json` pointer to resolve
an active feature; a fresh clone may have neither. Select the intended feature from the
request and `specs/`, rather than assuming `main`/`master` identifies it. For an existing
feature, use the matching `SPECIFY_FEATURE` value when invoking prerequisite scripts.
Do not commit machine-local feature pointers or absolute workstation paths.

## Domain invariants to preserve

- Every read/write is scoped to the visitor's demo environment and generation. Tabs can
  share an environment while retaining their own role and selected customer in URLs.
- Only delivered orders within the configured calendar-day window are eligible.
  Follow the spec's America/Bogota boundary rules and initial 30-day policy.
- Available units = purchased units minus units in pending, approved and received
  requests. Rejected/cancelled units are released. Distinct requests may include the
  same order item only while units remain available; never exceed purchased units.
- Allowed transitions: pending → approved/rejected/cancelled; approved → received.
  Rejected, cancelled and received are final. Rejection requires a reason.
- Server validation is authoritative. Related state/quantity/history writes are atomic;
  preserve transaction locking, idempotency, reset fencing and concurrency guarantees.
- Every valid creation/transition records its date and demonstration actor. Failed
  operations produce no partial writes or history events.
- Use exact USD minor-unit arithmetic. Approval and simulated receipt issue no refund.
- Keep expiry-before-access, explicit expiry recovery, anonymous limits and isolated
  confirmed reset behavior. Do not silently reseed or reset an existing visitor's demo.

## Implementation and UI conventions

- `src/app/`: routes and layouts; `src/components/`: UI and client interaction;
  `src/features/`: domain services, handlers and scoped queries; `src/lib/`: shared
  infrastructure/contracts; `prisma/`: schema and migrations; `tests/`: verification.
- Keep Route Handlers thin. Favor pure business-rule functions and isolate database
  dependencies. Use explicit typed contracts and avoid unjustified `any`.
- Preserve the approved Clarity design. For UI work, use the repository's
  `ui-ux-pro-max` skill when available. Reuse semantic light/dark tokens, icons, status
  labels, navigation, skeletons, async buttons, toasts and modal components.
- Preserve accessible names, keyboard operation and visible keyboard focus. Verify
  responsive layouts, state labels, loading/empty/error states and reduced motion.
  Avoid layout jumps during selection, refresh and pending API actions.
- Keep HTTP error envelopes and documented status codes consistent. Show safe messages;
  never expose SQL, stack traces, credentials or sensitive logs to the UI.
- Preserve `catalog/` source assets. Do not hand-edit generated Prisma code or apply
  schema changes without reviewed migrations and corresponding artifact updates.

## Verification and environment

Use Node.js 22.12+ (`.nvmrc` selects 22). Follow README for private local env setup and
PostgreSQL. Relevant commands, selected by the change:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:contract
npm run test:e2e
npm run build
```

Run integration, contract and browser suites sequentially: they share the dedicated test
database and include cleanup scenarios. Playwright starts its own server on port 3100;
do not manually use that test instance. Keep test and development databases separate.
Do not run destructive fixtures, resets or cleanup against a deployed data store.
Build after browser testing; avoid regenerating Prisma while an active dev/browser
suite is using it. For domain changes, prioritize quantities, transitions, concurrency,
isolation and history. For UI changes, verify affected flows in light/dark and narrow/wide
viewports. Do not add implementation-mirroring tests for trivial copy/style changes.
Documentation-only changes normally need link/command/consistency checks, not app tests.

Never claim a test, deployment or CI run succeeded without executing it. Explain checks
not run and their reason. Keep failures and fixes in the relevant validation record.
Local success does not complete a task that explicitly requires public-preview evidence.

## Secrets, releases and handoff

Keep `.env*` secrets, `.vercel/`, local database data, test output and generated code
uncommitted; `.env.example` contains placeholders only. Follow
[deployment.md](docs/deployment.md) for the intended Vercel project, managed PostgreSQL,
preview isolation, migrations, runtime/direct URLs, origin and cleanup configuration.
Do not substitute an unrelated existing project/database when access is missing.

Keep `AGENTS.md`, `.specify/` shared sources, `.agents/skills/`, `specs/` and relevant
project docs versioned so development context survives a new checkout. Preserve the
Next.js-managed block below. Report the result, artifact changes, actual verification
and remaining tasks; do not treat this file as a substitute for the specification.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
