# Order Returns Manager Constitution

## Core Principles

### I. Demonstration Scope and Boundaries

Order Returns Manager MUST remain a fullstack web MVP for managing product returns
against fictitious e-commerce orders. It MUST support order lookup, full and partial
return requests, eligibility validation, request review, and status and history lookup.
The goal is a functional flow that can be demonstrated online.

The application MUST use exclusively fictitious data. It MUST NOT process real payments
or refunds, manage shipping or reverse logistics, or integrate external merchants or
providers. Customer and administrator views MUST simulate roles without real
authentication or authorization. Public deployments MUST limit anonymous writes and
provide a way to reset demonstration data.

The interface MUST state that approving a return does not issue a refund or confirm
physical receipt of a product. These boundaries keep the demonstration's capabilities
and consequences explicit.

### II. Server-Enforced Domain Integrity

- Returns MUST reference only orders and order items that exist in persisted fictitious data.
- Eligibility MUST depend on order status and the rules defined in the feature's `spec.md`.
- Every request MUST identify its items and use positive integer quantities. Quantities
  MUST NOT exceed either purchased units or units still available for return.
- Repeated or concurrent requests MUST NOT reserve more than the purchased quantity
  across pending and approved returns for any order item.
- Only pending requests MAY be approved or rejected. `spec.md` MUST define the states
  and permitted transitions. An invalid transition MUST NOT modify data.
- The server MUST enforce eligibility, quantity, and state rules before saving changes.
  Interface validation MUST be complementary to server validation.

These rules preserve domain correctness regardless of the client or request timing.

### III. Atomic Changes and Auditable History

Creating a return request and every valid approval or rejection MUST generate a history
event with a timestamp and demonstration actor. Rejection reasons MUST be required
when the feature specification requires them.

Changes to quantities, states, and history MUST remain consistent. Related writes MUST
execute atomically whenever partial completion could violate an invariant. Transactions
and data constraints MUST prevent incomplete requests, transitions without history, and
over-reservation during repeated or concurrent requests wherever applicable.

History MUST describe completed changes, and failed operations MUST NOT leave partial
domain changes behind. This makes the demonstration's state and decisions traceable.

### IV. Modular, Strictly Typed Design

The application MUST use a modular monolith. Abstractions and infrastructure MUST have
a concrete need. Interface components, HTTP routes, business logic, and data access
MUST have separate responsibilities.

TypeScript MUST run in strict mode. Modules MUST expose explicit contracts and MUST NOT
use unjustified `any`. Variables and functions MUST use `camelCase`; components and
types MUST use `PascalCase`.

Implementation MUST prioritize small modules, descriptive names, functional React
components, and React hooks. Business rules MUST favor pure functions, with external
dependencies isolated behind explicit boundaries. This keeps rules understandable and
testable without unnecessary infrastructure.

### V. Verifiable Quality and Accessible Experience

Verification MUST prioritize quantities, states, concurrency, and history, together with
the main customer and administrator journeys. Tests MUST cover valid flows, invalid
inputs, excessive quantities, prohibited transitions, and repeated or concurrent requests.

Interfaces MUST be accessible and provide loading, empty, and error states. Documentation
MUST describe actual behavior. Requirements, implementation, and tests MUST remain
traceable to one another. No contributor or tool MAY claim that a validation passed
without executing it.

## Technology Stack and Operational Constraints

- Language: TypeScript.
- Frontend: React, Next.js App Router, and Tailwind CSS.
- Backend: Node.js and Next.js Route Handlers.
- Database: PostgreSQL.
- Data access: Prisma as the initial choice.
- Validation: Zod or an equivalent typed validation solution.
- Testing: Vitest and Playwright.
- Deployment: Vercel and compatible managed PostgreSQL, such as Neon.

Public deployments MUST apply the anonymous-write limits and data-reset capability
defined in Principle I. Feature specifications MUST make their operational behavior
concrete before the affected functionality is implemented. Simulated role selection
MUST NOT be treated as real access control.

## Development Workflow and Error Handling

All recorded project information MUST be written in English, including specifications,
plans, tasks, code comments, documentation, review records, and change descriptions.

This constitution defines project principles and boundaries. Each feature's `spec.md`
defines its behavior and acceptance criteria. Contributors MUST update `spec.md` before
implementing behavioral changes and review affected contracts, documentation, and tests.

If requirements are incomplete, ambiguous, or contradictory, contributors MUST stop the
affected implementation, communicate the conflict, and request clarification. Unaffected
work MAY continue. Requirements MUST NOT be changed solely to justify an incorrect
implementation.

The server MUST validate inputs, identifiers, quantities, states, and domain rules before
saving changes. HTTP error responses MUST use the following status codes consistently:

| Status | Meaning |
| --- | --- |
| `400` | Invalid input data |
| `404` | Resource does not exist |
| `409` | State, quantity, or concurrency conflict |
| `500` | Unexpected failure |

Error responses MUST use a uniform structure containing an error identifier and a safe,
clear message. User-visible errors MUST NOT expose stack traces, SQL queries,
credentials, or internal details. Technical errors MUST be logged with enough context
for diagnosis, without secrets or real personal data.

Reviews MUST check domain invariants, atomicity, history completeness, error contracts,
accessibility, demonstration boundaries, and consistency with `spec.md`. Verification
records MUST identify checks actually executed and any failures or checks not run.

## Governance

This constitution governs project principles and boundaries; feature specifications MUST
comply with it. The project owner retains final authority over business rules.

Amendments to constitutional principles MUST receive explicit review and approval from
the project owner and MUST include a documented justification. Amendment records MUST
identify affected principles, compatibility implications, and any required updates to
specifications, contracts, documentation, or tests. An amendment is adopted only after
that approval; this initial version records the principles supplied by the project owner.

Constitution versions MUST follow semantic versioning:

- MAJOR: incompatible removals or redefinitions of governance or principles.
- MINOR: new principles or sections, or materially expanded guidance.
- PATCH: clarifications, wording corrections, or other non-semantic refinements.

Every amendment MUST update the version and last-amended date while preserving the
original ratification date. Dates MUST use `YYYY-MM-DD`. Every implementation plan and
change review MUST assess constitutional compliance. Identified conflicts MUST be
resolved through clarification or an approved amendment before affected implementation
continues.

**Version**: 1.0.0 | **Ratified**: 2026-10-21 | **Last Amended**: 2026-10-21
