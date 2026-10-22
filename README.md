# Order Returns Manager

A fullstack demonstration for full and partial returns against fictional e-commerce
orders. The approved Clarity UI is in English; original catalog prices are USD.
No real payments, refunds, shipping, carrier pickups or notifications are performed.
Customer and administrator views simulate roles without real accounts.

## Run locally

Requires Node.js 22.x (22.12 or later) and npm. The checked-in lockfile pins the dependencies.

```bash
npm ci
cp .env.example .env.local
```

Replace both example secrets in `.env.local` with independent random values of at least
32 characters. Keep this file private. Its URLs point to dedicated local development
and test databases, and APP_ORIGIN must exactly match the browser origin.

Start PostgreSQL 17 in one terminal. Choose either Docker or the bundled local fallback:

```bash
docker compose up -d
# Alternative when Docker is unavailable:
npm run db:local
```

The fallback runs real PostgreSQL 17.10 on loopback port 55432 and keeps data in ignored
`.local-db/`. Leave its terminal running; Ctrl+C stops that instance. It creates orm_dev
and the separate orm_test database. For Docker, the SQL init script creates orm_test on
first volume initialization; create it explicitly if reusing an older local volume.

In another terminal:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://127.0.0.1:3000 and select **Explore the demo**. That action creates your
own two fictitious customers, six orders, six example returns with attributable histories,
a 30-day policy and independent return data.
The seed command alone inserts the ten immutable catalog products.

## Explore the flow

1. Open an eligible delivered order and select **Request return**.
2. Select items and positive quantities, enter a reason, review, and create the request.
3. Open **Administrator view**, inspect the request, then approve or reject it with a reason.
4. Approved requests show fictional packing/pickup instructions. The administrator can
   confirm simulated receipt. No monetary refund occurs.
5. Pending requests can be cancelled by their selected customer. Inspect **My returns**
   for status and attributable, uneditable history.
6. **Return policy** changes the window for new submissions only. **Demo settings**
   resets your own data after confirmation.

Two tabs of one browser profile share the same environment but keep their own customer
and view in their URLs. A customer tab and administrator tab can act on the same request;
refresh to see other-tab changes. Separate browser profiles or private contexts provide
separate demonstrations. Tabs within one private context can share its cookies.

## Integrity and limits

- Positive integer quantities never exceed purchased/available units. Pending, approved
  and received units remain committed; rejected and cancelled units are released.
- The server rechecks eligibility and serializes operations with a short environment-row
  transaction lock. State, quantity effects, event and idempotency receipt commit together.
- The return window initially includes delivery day zero through day 30 in America/Bogota.
- The session capability is secret, HttpOnly and hashed at rest; it identifies a demo,
  not a verified person. Any holder can use that demo's customer and administrator views.
- Access expires after 168 inactive hours. Interactive navigation/operations renew it
  only before expiry; background reads do not. Reset does not silently replace expired data.
- Anonymous limits: 60 mutation attempts/minute, five reset attempts/hour, ten demo-start
  attempts/hour per visitor context. Fixed windows use server UTC. Rejected attempts
  and retries count; reset preserves quotas. Clearing cookies is not a human identity check.
- Active demos are capped at 1,000. Cleanup deletes expired graphs in batches of up to
  100 independently of access expiry. The browser capability cookies have a 30-day lifetime;
  deleting/losing them loses continuity, and cross-device recovery is not provided.

## Validation

Use dedicated local PostgreSQL test data. Destructive fixtures refuse non-loopback targets
or targets without the `_test` database suffix and never reuse the configured development DB.

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

Playwright manages its own dev server on http://127.0.0.1:3100 against orm_test and covers
360/1280 px. Do not manually use that test instance while a run is active. Run integration,
contract and browser suites sequentially because cleanup scenarios share the dedicated
test database. The production build uses the supported Next.js Webpack engine; this
avoids Turbopack worker-port restrictions in constrained local execution environments.

`npm run demo:cleanup` invokes the same cleanup service used by the secret-protected
scheduled endpoint. `npm run format` formats application/config/test source files.

See [validation evidence](specs/001-manage-order-returns/validation.md),
[quickstart scenarios](specs/001-manage-order-returns/quickstart.md), and
[deployment instructions](docs/deployment.md).

## Development workflow

See the [practical SDD runbook](docs/spec-driven-development.md) for request examples,
phase/command mapping, feature-package structure and actual repository helper scripts.
Interface refinements extend the [existing specification](specs/001-manage-order-returns/spec.md)
as FR-042–047/SC-016–020. Their completed work is recorded as T117–T126 in the
[original task list](specs/001-manage-order-returns/tasks.md); see the
[validation record](specs/001-manage-order-returns/validation.md) for evidence and limits.
After implementation and verification, run `$speckit-converge` for the selected feature
before handoff. Implement any resulting tasks, verify and repeat until gaps are resolved.

[AGENTS.md](AGENTS.md) contains repository instructions for coding agents, including the
SDD workflow, domain invariants and scoped verification. For new features, update or
create the relevant specification, plan and tasks before implementation; use the local
Spec Kit skills when available. Small fixes follow the existing requirements and update
only affected artifacts. Keep the shared `.specify/`, `.agents/skills/` and `specs/`
sources versioned so the workflow travels with the repository. Machine-local pointers,
secrets and generated outputs remain ignored. Agent instructions guide development;
acceptance evidence, code review and CI verify the resulting work.

### Spec Kit resources

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit) to structure its
SDD workflow. Consult the official repository for setup, commands and workflow guidance,
and the [Specification-Driven Development guide](https://github.com/github/spec-kit/blob/main/spec-driven.md)
to revisit the methodology. The local skills and project artifacts describe how that
workflow is applied here.

## SDD artifacts

[Specification](specs/001-manage-order-returns/spec.md),
[plan](specs/001-manage-order-returns/plan.md),
[tasks](specs/001-manage-order-returns/tasks.md),
[data model](specs/001-manage-order-returns/data-model.md),
[HTTP contract](specs/001-manage-order-returns/contracts/http.md), and
[approved UI contract](specs/001-manage-order-returns/contracts/ui.md).

The `catalog/` files are preserved as source assets. The app serves copied local WebP
images from `public/products/`; Nivora and all product/customer/order content are fictional.
IBM Plex Sans is self-hosted with its included OFL license.

## Clarity interface

Light and dark appearance are available from the header and follow the system until an
explicit choice is stored in this browser. The styled customer picker supports keyboard
selection. Role/profile header slots keep their positions when switching views; settings
retain the role and selected profile, including after reset.

Orders use a persistent navigator and purchase-focused sheet. Return availability appears
in the centred selection flow; Request return is a secondary order action. Admin filters
reuse loaded request pages and preserve evidence after decisions. The Requests badge is
the actual count of pending reviews, not a decorative number. Refresh fetches current
server data while retaining the layout. Other-tab changes become visible on refresh.

New and reset demos contain six example returns with valid histories (two pending and
one each approved, received, rejected and cancelled), plus remaining eligible units.
Existing demonstrations are not silently modified: confirm Demo settings → Reset to
restore this example baseline. Modals close on Escape or backdrop click without acting.

## How returns work

Both workspace views include **How returns work**, a shared guide at `/demo/guide`.
Its five-state Flow map explains the four allowed transitions, action owners, eligibility,
reserved/released quantities and the fictitious pickup/receipt boundary. Select a state
for details or expand the quantity example. Connector labels have dedicated space;
narrow screens use a vertical main route with explicitly labeled pending-only alternatives.
The guide preserves the selected role/profile, supports keyboard and light/dark appearance,
and does not create or update return requests.

## Interface refinement

The shared header identifies the app with one compact Demo label. Routine screens focus
on orders and next steps; approval and receipt details retain contextual consequences.
Customer/admin request evidence shares semantic reason, rejection, approved and received
surfaces in both themes. Browser tabs use a parcel/return favicon with SVG and ICO formats.
These changes are locally verified as refinements of feature 001; production deployment
evidence remains separate from local verification.
