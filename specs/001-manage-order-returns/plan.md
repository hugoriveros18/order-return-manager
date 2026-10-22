# Implementation Plan: Order Returns Manager MVP

**Branch**: `001-manage-order-returns` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-manage-order-returns/spec.md`

## Summary

Build one Next.js application for isolated fictitious return demonstrations. Customers
inspect seeded orders and request or cancel returns. Administrators review requests,
configure the calendar-day policy, and confirm simulated receipt. PostgreSQL transactions
preserve quantities, transitions, and history; a browser-scoped opaque demo capability
isolates data without adding real accounts or business-role authorization.

The repository currently contains specification tooling and a ten-product catalog, but
no application package. This command produces design artifacts only. The existing
catalog uses USD: preserve its source files and reuse its fictional USD prices in
the application seed. Store amounts as integer cents; no currency conversion is required.

## Technical Context

**Language/Version**: Strict TypeScript 5.x on Node.js 22 LTS, minimum 22.12.

**Primary Dependencies**: Next.js 16 App Router, React 19, Tailwind CSS 4, Prisma ORM 7
with `@prisma/adapter-pg` and `pg`, Zod 4. Pin compatible patch versions and commit the
lockfile during implementation; do not install an unqualified Prisma latest release.

**Storage**: PostgreSQL 17 locally and managed PostgreSQL on Neon in production;
Prisma migrations with reviewed SQL constraints. Local static product images.

**Testing**: Vitest for pure rules, HTTP contracts, and real PostgreSQL integration;
Playwright for browser journeys, multi-tab behavior, isolation, and accessibility checks.

**Target Platform**: Vercel Node.js Functions plus current desktop/mobile browsers;
viewport validation at 360 and 1280 pixels. No Edge database runtime requirement.

**Project Type**: Fullstack web application, modular monolith, one package and deployment.

**Performance Goals**: Engineering budgets, not additional business acceptance criteria:
at ten simultaneously active environments, warm list/detail interactions and mutations
should finish within 2 seconds at p95; measure cold-start observations separately.
Support the specified 20 competing submissions without over-reservation. Report measured
results rather than claiming these budgets are already achieved.

**Constraints**: 60 mutation attempts/minute, five resets/hour, ten environment creation
attempts/hour per visitor; 168-hour rolling inactivity; America/Bogota date eligibility;
English interface/content; USD amounts. No real authentication, refunds, transport,
external notifications, or request editing. Request-scoped private data is never cached
in a shared cache. The approved UI is Clarity, implemented as one consistent
customer/administrator experience with semantic design tokens.

**Scale/Scope**: Ten shared read-only product definitions; two seeded customers and six
orders per environment. Paginate lists at 20, maximum 50. Initial operational budget:
1,000 unexpired environments, enforced atomically at creation; refuse creation with a
safe temporary-capacity message when exhausted. No truncation of existing histories.
Expired environments are cleaned in batches of 100; cleanup is independent of access
expiry. Observe storage and traffic before raising capacity.

## Constitution Check

*GATE: Evaluated before Phase 0 and repeated after Phase 1. All gates pass by design;
this is a document review, not a claim that executable application tests passed.*

| Gate | Before research | After design | Evidence |
| --- | --- | --- | --- |
| Fictitious scope, no financial/logistics actions | Pass | Pass | Simulated receipt only; local catalog; UI notices |
| Server eligibility, quantity and state invariants | Pass | Pass | Shared services, environment transaction lock, state table |
| Atomic complete writes and attributable history | Pass | Pass | Transaction protocol and event uniqueness in data model |
| Modular strict TypeScript, concrete abstractions | Pass | Pass | One app; HTTP/domain/data boundaries; no generic repository framework |
| Validation and safe uniform errors | Pass | Pass | Typed schemas and HTTP error contract |
| Browser isolation, anonymous limits and reset | Pass | Pass | Capability cookie, durable quotas, generation fencing |
| English records, spec traceability and honest validation | Pass | Pass | FR/SC mapping and quickstart scenarios; no tests claimed as run |
| Accessible responsive customer/admin experience | Pass | Pass | UI contract, contrast review and keyboard validation plan |

No constitutional amendment or exception is required. Database access isolation protects
anonymous demo capabilities; it does not introduce real customer or administrator accounts.
The constitution's specified error classes retain their meanings; transport-specific
403 (origin/session refusal), 429 (throttle), and 503 (temporary capacity) supplement them.

## Project Structure

### Documentation (this feature)

```text
specs/001-manage-order-returns/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/
    ├── http.md
    └── ui.md
```

`tasks.md` is a later output of `$speckit-tasks` and is not generated here.

### Source Code (repository root)

Proposed implementation layout; these files are not created by this planning command.

```text
catalog/                         # Existing reference assets; preserve source data
public/products/                 # Optimized copies of catalog images
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
prisma.config.ts
src/
├── app/
│   ├── page.tsx                  # Demo entry/expiry recovery
│   ├── customer/[customerId]/    # Orders, returns and details; tab-local selection
│   ├── admin/                   # Requests, request detail and policy
│   ├── demo/                    # Reset confirmation
│   └── api/                     # Thin Next.js Route Handlers
├── components/                  # Accessible display and form components
├── features/
│   ├── demo/                    # Context, activity, expiry, reset and quotas
│   ├── orders/                  # Scoped queries and eligibility projections
│   ├── returns/                 # Pure rules, schemas, services and Prisma queries
│   └── policy/                  # Validation and policy service
└── lib/                         # Prisma client, clock, safe errors and logging
scripts/cleanup-demo.ts
tests/
├── unit/
├── integration/
├── contract/
└── e2e/
```

**Structure Decision**: Use one Next.js project and explicit feature service modules.
Route Handlers validate transport inputs and call services. Pure functions evaluate
eligibility/transitions; data modules perform scoped Prisma queries. Server Components
render shells without calling their own HTTP endpoints; browser data access follows
HTTP contracts. Private resource rendering goes through the same context/expiry guard.
No queue, microservice, Redis dependency, or real identity provider is necessary.

### Phase 0 — Research Decisions

See [research.md](research.md) for official sources, rationale, alternatives, current
version compatibility, browser isolation, concurrency, expiry, quotas and UI decisions.
All design unknowns are resolved; version patches are verified when dependencies are
installed. Prefer supported documented APIs over assuming that latest majors are compatible.

### Phase 1 — Design and Validation

See [data-model.md](data-model.md), [HTTP contracts](contracts/http.md),
[UI contracts](contracts/ui.md), and [quickstart.md](quickstart.md). Functional groups map
to independent implementation slices: demo isolation (FR-001–002, 031–037), orders
(FR-003–006), creation/eligibility (FR-007–014), decisions/cancellation/receipt
(FR-015–023), settings (FR-024–026), and history/errors/accessibility (FR-027–030, 038–040).
Cross-cutting work includes server validation, lock order, expiry, idempotency, and tests.

### Approved UI — Clarity

The project owner approved the recommended Order workspace direction on 2026-10-21.
Implement one visual system for customer and administrator views. The implementation
contract, including tokens and responsive behavior, is [contracts/ui.md](contracts/ui.md).

- Palette: light gray canvas `#F3F6FA`, white surfaces `#FFFFFF`, dark ink `#192A3A`,
  primary blue `#2258C7`, navy navigation `#16324F`, and teal support accent `#087F76`.
- Typography: self-host IBM Plex Sans with system sans-serif fallback; 16 px body,
  24 px section headings and 32 px page headings, with tabular numeric prices/quantities.
- Customer desktop: navigation for Orders and My returns; order list beside an order
  sheet containing imagery, purchased/committed/available quantities, eligibility,
  deadline and Request return. Return creation uses a focused form and review summary.
- Administrator desktop: status-filtered request queue beside scoped request detail,
  quantities, reason, history and valid whole-request decision controls. Return policy
  is a dedicated page. Demo settings contains reset and temporary-data information.
- Mobile: compact navigation, list pages followed by full detail pages with explicit
  back navigation. Preserve all quantities, reasons and actions at 360 px; use labeled
  stacked rows instead of squeezing the desktop columns into the viewport.
- Accessibility: explicit status labels and independent semantic status colors,
  keyboard/focus behavior, associated errors and 4.5:1 normal-text contrast targets.
  All system content is English and prices identify USD with two decimal places.

### Planning Validation Performed

- Reviewed all 40 functional requirements and 14 success criteria against the design.
- Validated local document links, template completion and absence of unresolved markers.
- Before UI selection, checked the exploratory preview JavaScript syntax with Node.js.
- Before UI selection, ran Chromium through all 12 exploratory preview combinations:
  three directions, two roles and
  360/1280-pixel widths. Images loaded, selectors rendered the expected layout, no
  JavaScript exceptions occurred and no horizontal page overflow was detected.
- Before UI selection, visually inspected desktop screenshots for all three directions.
  Exploration artifacts were removed after the accepted design was recorded in the UI
  contract; those checks do not validate the future application implementation.
- Calculated text contrast for primary buttons, main text and five status pairs;
  every checked pair exceeds 4.5:1. This is not a full accessibility audit.
- No application, PostgreSQL integration, performance or end-to-end business tests were
  run: application implementation is outside this planning command.

## Complexity Tracking

No constitutional violations. A single database-backed demo guard serializes operations
within one small environment; this intentionally trades same-visitor write throughput
for simpler correctness. Separate visitors can operate concurrently. Durable quota rows,
idempotency receipts, and generation fencing each address an explicit public-demo invariant.

## Approved implementation revision: Clarity

Implement alternative A using UI/UX Pro Max guidance and spec.md's approved UI revision.
Use a small client resource cache scoped to this browser session and path/customer; never
cache visitor data on the server globally. Deduplicate reads, retain content while refreshing,
clear data on reset/expired or invalid capability, and validate context on cached navigation.
Orders already project full item details, so selection reuses a loaded order page. Admin
requests load bounded pages, keep them while filtering locally, and load further pages
when a filter has no loaded matches. Return pendingCount in list metadata from an exact
environment/generation-scoped COUNT query; update client snapshots and badge after writes.
Keep role/customer selection in URLs, use a fixed header grid and accessible listbox, and
provide shared brand, theme and modal components. Store appearance preference only.

Provision/reset seeds six valid attributable example requests across the two profiles and
all five states. Domain-test fixtures may request an empty-return baseline explicitly;
production provisioning and reset always use the example baseline. Add tests proving
quantity integrity, history/actors, independent environments and baseline restoration.
Validate actual UI in light/dark at desktop/mobile widths, including network counts,
position stability, backdrop dismissal, keyboard controls, badge updates and retained roles.

## Loading-state refinement

Use lightweight section skeleton components built from the same layout classes as the
loaded views, selected explicitly by each data-loading boundary. Keep the shared header
and existing data visible during refresh. Use semantic theme tokens for skeleton blocks
and a 45% soft-tint hover on unselected customer options; do not reduce text opacity.
Verify delayed HTTP responses in Chromium at mobile/desktop widths, skeleton replacement,
refresh continuity, keyboard names, reduced motion and selected/hover distinction in both
themes. This elaborates the existing UI requirement; domain and HTTP contracts do not change.


### Navigation and feedback implementation refinement

Use the first loaded order as the implicit selection. Reuse the back-link and reason-summary styles, and introduce a semantic instruction panel. Add a shared AsyncButton that overlays hidden sizing labels and a visible idle/busy face; preserve both dimensions and accessible button names. Mount a shared client toast viewport in the root layout, with per-notification expiry and dismissal, moving its portal into an active dialog to preserve top-layer interaction. Route mutation failures and action confirmations through this viewport. Verify default selection, delayed refresh/save geometry, dialog errors, toast stacking/dismissal/expiry and selected settings navigation on desktop/mobile.


### Detail alignment and copy polish

Scope the reason-panel horizontal-margin override to customer return details so the
administrator evidence layout retains its existing padding. Use the shared Refresh
label and derive the order-total item noun from the existing purchased-unit sum.


## Approved return-guide implementation

Implement FR-041/SC-015 as a small client ReturnGuide component under the existing
`/demo` layout at `/demo/guide`, reusing typed Status, statusLabels, Icon and WorkspaceShell.
Use CSS Grid for content-driven cards and dedicated HTML connector tracks; put the
cancel label and return connector in a separate lower row. A container query changes
only the diagram into a vertical route when space is insufficient. No diagram package,
new API, database table or domain mutation is needed.

Renew the existing demo context on guide entry and role/profile URL changes so cached
help navigation remains qualifying visitor activity, with the usual expiry guard.
Preserve the current `/demo` pathname in role/profile links, and match settings/guide
navigation independently. Keep guide navigation accessibly named in compact layouts.
Verify canonical states/transitions, label/card geometry and clipping, keyboard/live
feedback, role/profile retention, narrow widths, both themes and reduced motion. Record
executed checks and audit all unchecked original tasks after implementation.
