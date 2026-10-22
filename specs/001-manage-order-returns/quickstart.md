# Quickstart and Validation Guide

The local application, migrations and test scripts are implemented. See validation.md
for actual executed results and outstanding remote deployment work. Follow this guide
against dedicated local data; it is not evidence of a public deployment.

## Prerequisites

- Node.js 22.12+ in the supported 22 LTS line, npm, and PostgreSQL 17.
- A dedicated local/test database; never run reset/seed tests against a real data store.
- For public verification: a Vercel project and isolated Neon database/preview branch.
- Package scripts: dev, build, start, lint, typecheck, test:unit, test:integration,
  test:contract, test:e2e, db:generate, db:migrate, db:seed, db:local and demo:cleanup.
- Start PostgreSQL with `docker compose up -d` or `npm run db:local` in a separate
  terminal. The local fallback uses real PostgreSQL 17.10 and creates orm_dev/orm_test.

## Local setup after implementation

1. Copy .env.example to .env.local. Set DATABASE_URL and DATABASE_URL_UNPOOLED to the
   local dedicated database, TEST_DATABASE_URL to a different test database,
   DEMO_TOKEN_SECRET to a locally generated random secret, and APP_ORIGIN to
   http://127.0.0.1:3000. Set CRON_SECRET for internal cleanup. Keep secrets uncommitted.
   prisma.config.ts must explicitly load the local env file for CLI commands.
2. Install pinned dependencies, generate the client, apply development migrations and seed:

   ```bash
   npm ci
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

3. Open http://127.0.0.1:3000. Explicitly start a demo; verify two customers, six orders,
   ten products, USD prices, six example returns with complete histories and a 30-day policy. Seeding creates only fixed catalog and
   fixture definitions; visitor environments are provisioned by Explore the demo.

## Verification commands

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:contract
npx playwright install chromium
npm run test:e2e
npm run build
```

Use PostgreSQL for integration and contract tests. A deterministic injected clock in
services and dedicated fixtures covers deadlines; never add a public clock-control
endpoint. Test scripts must refuse an unsafe database target. Record actual command
results, including any failed or unrun checks, in the implementation validation record.

## End-to-end scenarios

| Scenario | Steps | Expected result | Coverage |
| --- | --- | --- | --- |
| Basic customer creation | Start; select customer; open eligible order; select one item/unit; enter reason; review/create | One Pending review request, identifier and CREATED event | FR-001–014, SC-001–002 |
| Full return | Select all available lines/units on another eligible order | All selected units committed; no excess | FR-007–014 |
| Two tabs | Open customer detail and administration in separate tabs; approve; refresh customer | Independent view selections; same request now approved | FR-004, 031; SC-006 |
| Rejection | Reject a pending request with reason; inspect as customer | Rejected, reason visible, units available again | FR-016–017, 027–029 |
| Cancellation | Decline cancellation once, then confirm while pending | First no change, then Cancelled with one customer event | FR-018 |
| Receipt | Approve another request; read instructions; confirm simulated receipt | Received, terminal, units still committed, no real logistics/refund | FR-019–023; SC-011 |
| Policy | Change 30 days to 5; submit on now-ineligible order; inspect old requests | New request rejected; preexisting decisions unchanged | FR-024–026; SC-008 |
| Isolation | Repeat in two browser contexts; try copied foreign resource IDs | No cross-demo data disclosure or mutation | FR-032; SC-006 |
| Reset | Modify demo; confirm reset; submit an old-tab operation | Initial data restored; old generation conflicts; other visitor unaffected | FR-033–035; SC-007 |
| Expiry | Advance test clock to 168-hour boundary; attempt read/write | Explanation and explicit fresh-start action; no renewal or silent reset | FR-036; SC-013 |
| Activity | Advance clock; open screen; then simulate only background reads | Interactive view renews; background does not | FR-036; SC-013 |
| Invalid inputs | Empty lines, duplicates, zero/fraction/excess, foreign item, blank reasons | Safe errors, zero domain changes/history | FR-008–014, 038 |
| Quotas | Exhaust each fixed-window quota; reset and retry | 429, Retry-After, no allowance reset or domain change | FR-037; SC-012 |
| Accessibility/English | Keyboard all journeys; inspect 360/1280 px; inspect copy and images | Visible focus, labeled controls, all system content English, USD retained | FR-039; SC-010, 014 |

## Required concurrency checks

- Compete 20 distinct operations for an item's last units: sum committed never exceeds
  purchased; successful requests each have one event; losers get safe conflicts.
- Submit the same operation concurrently: one request/receipt/event; altered payload
  under the same key conflicts; a new key can request remaining eligible units.
- Compete approve/reject/cancel: exactly one transition succeeds. Duplicate receipt
  replay never appends events. Test every forbidden transition and final state.
- Compete creation against policy change and reset: observe one consistent ordering;
  no old-generation writes after reset. Retry reset after a lost response: no second reset.
- Compete expiry cleanup against activity renewal using the shared environment lock:
  eligible data is not deleted and expired data cannot be revived.

## Public preview and operations

Use a separate preview database and server-side secrets. Configure pooled runtime URL,
direct migration URL, production-secure cookies and APP_ORIGIN. Run committed migrations
with prisma migrate deploy in the controlled release step, generate client/build, and
perform a preview smoke run before promotion. The local implementation is complete;
remote access and managed-database provisioning are still required before a deployment
can be verified. See `docs/deployment.md`.

Measure warm p95 against the plan's ten-environment/2-second engineering budget and record
cold-start observations separately. Verify no-store responses and no prefetched activity
renewal. Limit global active environments to 1,000 and test capacity refusal. Configure
protected daily cleanup; execute npm run demo:cleanup against local fixtures to confirm
bounded deletion and secret-protected HTTP parity. Do not depend on cron for exact expiry.

Current error logs contain a correlation request ID, failure event and error type.
Never log tokens, free-text reasons, credentials or real personal data. For deployment,
monitor failure, conflict, quota, capacity and cleanup counts using platform diagnostics
without adding a dedicated analytics product.

## Validate the approved UI after implementation

Use [contracts/ui.md](contracts/ui.md) as the visual and interaction acceptance reference.
Check the Order workspace palette and typography, customer order-list/detail layout,
administrator queue/detail layout, and dedicated policy/settings pages. Verify that
order selection updates the purchase sheet in place, and return detail pages provide a
back action while preserving tab-local customer context. At 360 and 1280 px, check quantities, USD prices, English copy, status
labels, keyboard access and error recovery. Validate implemented workflows through the
scenarios above; exploratory mockups are not application acceptance evidence.

Run database-backed suites sequentially. The checked-in build uses Next.js Webpack to avoid
Turbopack worker-port restrictions in constrained local environments.

## Clarity review

Use the header appearance toggle to inspect light/dark. The Requests badge is the exact
Pending count, initially two in the restored baseline. Orders switch within the stable
purchase sheet. Request return is a secondary option; quantities available for return
appear in the selection form. The pictured review and confirmation use centred columns.
Settings retains the selected role/profile after reset. Existing demos receive the six
example requests only after explicit reset; no background reseeding discards visitor work.


## How returns work guide

From either workspace view, open How returns work in the navigation. Verify that it
shows Pending review, Approved — awaiting pickup, Return received, Rejected and Cancelled,
and only pending→approved/rejected/cancelled plus approved→received. Select each state
using Tab and Enter/Space; its explanation changes without changing demonstration data.
The approved and received descriptions distinguish simulated pickup, explicit receipt
confirmation and the absence of a monetary refund.

At 360px and 1280px in both themes, read every connector label in full. In particular,
Customer cancels · pending only must occupy its own area outside Rejected/Cancelled.
Switch roles and customers while on the guide: retain the guide route and intended
profile. Only How returns work is selected in navigation; Demo settings remains a
separate destination. Expand the quantity example and confirm the two/one/one arithmetic.


## Interface-refinement acceptance journey (2026-10-22)

This acceptance journey was executed locally; commands and actual results are recorded
in validation.md. Use the
README local/test setup and a guarded test database; never reset production for testing.

1. Open landing and direct customer/admin routes; verify one Demo identifier and the
   copy matrix, without a global banner, rail warning or the three retired strings.
2. Walk selection, review and confirmation; retain task/quantity/USD and next-step detail.
3. Open pending-admin, approved-customer/admin and received details without visiting help;
   inspect required consequence information and the guide's single general scope block.
4. Inspect all five states in both views. Compare neutral reasons, red rejection, soft
   approval and green receipt; include multiline/unbroken reasons and keyboard navigation.
5. Confirm reset loss/irreversibility and expiry/recovery remain explicit and functional.
6. At 360/1280px in light/dark, review readable text, contrast, widths, fixed header slots,
   keyboard names and loading states without overflow or layout jumps.
7. In fresh browser contexts inspect generated icon links, successful SVG/ICO responses,
   MIME types and appearance at 16/32px on landing and nested routes in light/dark chrome.

Run npm run lint and npm run typecheck. Run focused Playwright communication and detail
checks, reusing full-demo, receive-return, reset-expiry and loading-states scenarios.
Run npm run build after browser verification. Record commands and actual results in
validation.md; keep application tasks unchecked until their acceptance checks pass.
