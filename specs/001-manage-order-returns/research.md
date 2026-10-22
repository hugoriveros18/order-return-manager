# Research: Order Returns Manager MVP

Date: 2026-10-21. Decisions below distinguish platform facts from project design choices.
Research used current official documentation and the existing catalog; no application
was installed, deployed, or tested during planning.

## 1. Runtime and dependency versions

**Decision**: Use Node.js 22 LTS (22.12 or newer), Next.js 16, React 19, Tailwind 4,
Prisma ORM 7, Zod 4, Vitest and Playwright. Resolve supported patch versions at installation
and pin them in the lockfile. Prisma client, adapter and CLI use the same supported major.

**Rationale**: The constitution already selects this stack. Next.js documents Node 20.9+
as its minimum. Prisma 7 remains supported, while its current documentation identifies
Prisma 8 as a release candidate; versioned v7 references avoid mixing incompatible APIs.

**Alternatives considered**: Node 24 is also viable; no required capability justifies
changing the chosen supported runtime. Prisma 8 prerelease adoption adds unnecessary
migration risk. A separate Express backend duplicates the existing Route Handler boundary.

Sources: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation),
[Prisma 7 documentation](https://www.prisma.io/docs/orm/v7),
[Prisma 7 upgrade requirements](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7).

## 2. Database access and deployment

**Decision**: Use Prisma 7 with the PostgreSQL `pg` adapter and one module-scoped client.
Use a pooled Neon runtime connection and a direct migration connection configured in
`prisma.config.ts`. Initial driver pool maximum is five connections per Function instance;
validate against the purchased database connection budget. Use the Vercel pool lifecycle
helper when deployed, and colocate the app and database where supported.

**Rationale**: Prisma 7 uses driver adapters and driver-level pooling. Neon documents
pooled and direct endpoints. Local PostgreSQL and production use the same transaction
semantics; no request-level connect/disconnect loop is necessary.

**Alternatives considered**: A Neon-specific adapter is supported but adds provider
coupling. A separate cache or Redis limiter is unnecessary for initial demo traffic.

Sources: [Neon with Prisma](https://neon.com/docs/guides/prisma),
[Prisma PostgreSQL v7](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql),
[Vercel pooling](https://vercel.com/kb/guide/connection-pooling-with-functions).

## 3. Concurrency and history integrity

**Decision**: All scoped database operations acquire the environment row first using
parameterized `SELECT ... FOR UPDATE` in a short Prisma interactive transaction at
READ COMMITTED. Read child data only after acquiring the lock. Compute committed units
from request items whose parent is PENDING, APPROVED or RECEIVED. Apply request, item,
state and event writes together. Policy changes, resets and cleanup take the same lock.

**Rationale**: PostgreSQL row locks wait for conflicting updates and provide an updated
row at READ COMMITTED. One lock per small visitor environment gives a simple consistent
order for eligibility, policy, reset, and history. Other environments remain independent.
This strategy is a project design inference; merely using a transaction would not prevent
quantity races. No mutable reserved-unit counter is needed.

**Alternatives considered**: Serializable transactions with bounded whole-transaction
retries are valid but add retry complexity. Per-item locks improve within-demo throughput
but require more lock-order discipline. Application memory locks fail across instances.

Sources: [PostgreSQL locks](https://www.postgresql.org/docs/current/explicit-locking.html),
[Prisma 7 transactions](https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions),
[PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).

## 4. Anonymous capability and tab-local context

**Decision**: A random 256-bit opaque cookie identifies an anonymous visitor capability;
store only its hash server-side. Production cookie: `__Host-orm-demo`, HttpOnly, Secure,
SameSite=Lax, Path=/, no Domain, fixed 30-day browser lifetime. Local HTTP development
uses an explicitly development-only unprefixed cookie. Environment access still expires
at 168 hours of inactivity. The cookie identifies the shared environment, not a customer
or administrator. Customer identity and view are encoded in tab-local URLs; never a
shared active-customer or role cookie. All mutations check same-origin Origin and JSON
content type. Derive the environment from the validated cookie, never a request body.

**Rationale**: Capability secrecy provides demo isolation without real accounts; selecting
an administrator role remains simulation. URL-based selection lets tabs use different
customers while viewing the same persisted data. Cookie operations belong in Route Handlers.
The fixed browser lifetime avoids response races when changing cookies on ordinary reads;
losing/expiring the cookie requires starting a new demo, without cross-device recovery.

**Alternatives considered**: Predictable environment IDs or tenant IDs supplied by the
browser break isolation. Sharing selection in localStorage creates cross-tab surprises.
Real authentication is explicitly out of scope.

Environments are logical record groups in one PostgreSQL database; the immutable product
catalog is shared. Tabs in one browser profile share a demonstration, including customer
and administrator views. Separate browser profiles or isolated private contexts receive
separate demonstrations; tabs within one private context may share it. Possession of the
secret capability grants access to the demo, not a verified real-world identity. Losing
cookies loses demo continuity. These boundaries are deliberate MVP constraints.

Source: [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies).

## 5. Expiry, navigation and cleanup

**Decision**: Guard every read and write using current database wall time after obtaining
the environment lock. If now is at or after lastActivityAt + 168 hours, refuse access
before renewal. Direct interactive navigations and operations renew activity only while
unexpired. Prefetch is disabled on private navigation; background reads are explicitly
marked and cannot renew activity. Private responses use `Cache-Control: private, no-store`;
do not use shared Next.js caches for environment data.

**Rationale**: These choices implement the clarified activity policy and prevent hidden
refreshes from extending retention. Application expiry enforcement is synchronous and
independent of asynchronous storage cleanup. Old browser-rendered text cannot be erased
from a disconnected device, but every subsequent server access is checked.

**Alternatives considered**: Cron-only expiry leaves a gap in access control. Client-only
clocks can be changed. Automatic polling is unnecessary because refresh-based cross-tab
visibility is accepted.

**Cleanup decision**: A protected daily scheduled cleanup uses the same guard lock,
rechecks expiry and deletes in batches of 100 with an execution time budget; a local
CLI can run the same service. Start with one batch per invocation; capacity admission
can reclaim another expired batch before denying a new environment. No in-process cron.
Hobby scheduling is daily and not exact, which is adequate for storage maintenance.

Sources: [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers),
[Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs),
[Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## 6. Reset fencing and idempotency

**Decision**: Each environment has a monotonically increasing generation. Every mutation
sends the generation and an opaque operation ID. Within the environment transaction,
verify scope and expiry, then check generation and operation receipt. Same key and same
canonical payload returns the recorded outcome; changed payload conflicts. A reset
increments generation and recreates fixture IDs atomically. Preserve reset receipts
outside the deleted graph so an exact reset retry can return its original acknowledgement
without resetting again. Check retained reset receipts before rejecting that reset retry's
old generation; every other old-generation operation conflicts.

**Rationale**: Distinguishes network retries from intentional new requests and prevents
pre-reset tabs from writing into the new demo. Store receipts only for successfully
committed operations; invalid attempts create no domain event. Keep receipts for the
life of the environment, including old reset acknowledgements.

**Alternatives considered**: Payload-based duplicate detection would block legitimate
new requests for remaining units. Client disable-on-click alone cannot prevent retries.
The transaction design is an application inference built on the locking/uniqueness sources.

## 7. Durable quotas and capacity

**Decision**: PostgreSQL quota buckets keyed by anonymous visitor hash survive environment
reset and domain rollback. Use server-clock fixed windows: 60 generic mutation attempts
per UTC minute, five reset attempts/hour, ten creation attempts/hour. An attempt consumes
every applicable bucket even if domain validation later fails. Admission uses a separate
short transaction and rejects on excess with 429 and Retry-After. Database outage fails
closed with a safe 503 rather than dropping enforcement. Invalid cookies cannot select
another visitor's quota identity; provisioning uses an opaque signed anonymous visitor
cookie established before creating an environment. Never log raw cookies or IP addresses.

**Rationale**: Process-memory counters are inconsistent across serverless instances.
Separate admission persistence ensures rejected domain transactions do not restore quotas.
The visitor identity cookie survives reset and expiry. Per-visitor limits do not identify
humans or prevent cookie clearing; a global admission lock caps active environments at
1,000, with temporary 503 refusal. This is a documented MVP abuse boundary, not real auth.

**Alternatives considered**: Dedicated Redis is optional future infrastructure. IP-only
identity interferes with shared networks. Unbounded anonymous allocation is unsuitable.
These numerical budgets come from the spec or explicit engineering defaults in plan.md.

## 8. Catalog, prices and visual identity

**Decision**: Reuse the ten existing Nivora image/content records as fictional seed input.
Keep catalog source untouched and reuse its existing fictional USD prices without
conversion. Store money as integer US cents and format as USD with two decimal places,
without floating-point arithmetic. Convert source decimal values to cents using exact
decimal parsing during seeding.
Review names/imagery as fictional identity; correct AI-image alternative text to describe
illustrations without claiming real product photography in the app asset copy.

**Rationale**: Meets the spec while preserving user assets. Existing images provide
consistent product identity without an image-generation task or external image hosting.

**Alternatives considered**: Generating another ten assets duplicates available work.
Real currency conversion introduces an irrelevant integration.

## 9. Approved UI and accessibility

**Decision**: Adopt Order workspace, approved by the project owner on 2026-10-21.
Use the palette, IBM Plex Sans typography, list/detail layout and mobile navigation
recorded in [contracts/ui.md](contracts/ui.md). Implement one shared visual system.

**Rationale**: Keeps purchased products and available return units together for customers,
while administrators can review the request alongside its order, quantities and history.
The direction balances both roles and supports common list/detail components. Semantic
status tokens remain distinct from brand colors; normal text targets 4.5:1 contrast.

**Alternatives considered**: Guided return desk emphasized a three-stage customer journey
but required more navigation and draft-state work. Review console emphasized administrator
queue density but gave less prominence to the customer's purchase context. Both were
reviewed and not selected; exploratory comparison files are no longer development inputs.

Source for contrast criterion: [W3C contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## Resolved research outcome

All initial technical unknowns have decisions and alternatives. No unresolved business
clarification blocks Phase 1. The owner has selected Order workspace; the UI contract
contains the implementation decisions, with no pending direction selection.


## Return-guide UI exploration (2026-10-21; selection pending)

A local, dependency-free HTML comparison was created using the Clarity font, palette,
semantic states and light/dark themes. The retired prototype remains in Git history.
It proposed a shared How returns work destination:

- A — Flow map: all five states and four transitions at once, with optional state details.
  Recommended for the MVP because it gives a complete overview with minimal interaction.
- B — Guided journey: switch between approval/receipt, rejection and cancellation.
  Stronger step-by-step teaching; understanding all outcomes requires extra interaction.
- C — Role lanes: customer actions beside administrator review/decisions/receipt.
  Clarifies responsibilities but requires more space and scanning.

All alternatives explain eligibility, reserved quantities, terminal states and fictional
pickup/receipt boundaries. At this exploration stage, these were design candidates
rather than an approved application route. The comparison controls and design notes
belonged only to the preview, which did not call application APIs. The selection and
implementation recorded below supersede this exploration.

Notification placement review: the earlier mobile failure involved immediately saving
the same policy again while its confirmation covered the button. Generalizing that
case to top placement everywhere was unnecessary. Restore the requested bottom-right
position and retain the existing dismiss/expiry behavior. Stacking verification submits
from the policy field via the normal Enter key, independently of overlay placement;
dialog closure and expiry are still exercised through actual notification controls.


## Return-guide selection (2026-10-21)

The project owner selected alternative A and requested application implementation.
This supersedes the pending-selection note above. Connector labels are HTML in reserved
layout tracks rather than SVG text; the cancel route has its own lower row to resolve
the reported overlap with Rejected. Retain the three local previews as review history.
