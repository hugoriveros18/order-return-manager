# Vercel and Managed PostgreSQL Deployment

## Current remote status

Production is published at https://order-return-manager.vercel.app in the dedicated
`order-return-manager` project (`prj_sNh27nTWJ16pd4f59eXtXCovrodz`), under team
`team_76fOJXRi8kRxmJR6Dlwi2vS4` (`hugo-felipe-riveros-fajardos-projects`).
The Vercel project setting is Node 22.x. The authenticated CLI is linked through the
ignored `.vercel/project.json`; the official Vercel MCP connection is also authenticated
in the local Codex configuration. The earlier app-connector team-scope HTTP 403 is
separate from those successful CLI/MCP logins. New MCP tools may require a session refresh.

The existing Neon project is `shiny-thunder-25324142`, organization
`org-soft-hill-62855360`, with the owner-selected production branch. Its database reports
PostgreSQL 18.6 in AWS us-east-2; local/CI coverage uses PostgreSQL 17. Both pooled and
direct connections were verified against the same database and role. The committed
`202610210001_initial` migration was applied and the ten-product USD catalog was seeded.
No local development database was migrated or reset.

Production configuration and public-browser verification evidence are recorded in
`specs/001-manage-order-returns/validation.md`. T097 and T099 remain open until their
remaining preview-isolation, operations and full release acceptance checks are complete.
Never use local PostgreSQL URLs remotely or substitute an unrelated project/database.

## Required deployment configuration

Use a dedicated Order Returns Manager Vercel project, Node 22.x, and managed PostgreSQL
17 (Neon or compatible). Keep preview and production on separate database branches or
databases. Select a database region compatible with the checked-in iad1 Function region,
or change that region deliberately to colocate both resources.

| Variable | Source and purpose |
| --- | --- |
| DATABASE_URL | Pooled managed endpoint for Function runtime |
| DATABASE_URL_UNPOOLED | Direct endpoint for Prisma migration release step |
| DEMO_TOKEN_SECRET | Independent random server secret, at least 32 characters |
| APP_ORIGIN | Exact HTTPS origin used by the demo; no trailing slash |
| CRON_SECRET | Independent random secret for scheduled cleanup |

`TEST_DATABASE_URL` is local/CI only, never the production data store. Store remote values
as Secret variables in the selected Vercel environment. Production cookies
are `__Host-orm-demo` and `__Host-orm-visitor`, Secure, HttpOnly, SameSite=Lax, Path=/.
Preview deployments also run Next.js production mode and require HTTPS. Private API
responses send no-store and mutations validate the configured same Origin.

An immutable preview URL must be known/configured as APP_ORIGIN before its writes are
used. A stable preview alias with a matching configured origin is preferable. Do not
weaken Origin validation to arbitrary host headers to accommodate dynamic preview URLs.

## Private release access

Production Secret values are not returned by `vercel env pull`; do not downgrade their
type to make them downloadable. Obtain the intended branch's connections from Neon
and inject them into the controlled migration/seed subprocess. An ignored private
`.env.neon-release.local` can hold `DATABASE_URL` and `DATABASE_URL_UNPOOLED`; it is not
a Next.js automatically loaded environment filename. Keep it restricted to its owner.
Do not overwrite `.env.local`, reuse the release connections for local tests, print
URLs, or commit credentials. The other required server keys must be available to the
seed process for configuration validation; catalog seeding itself does not sign visitor
cookies or create visitor environments.

## Release sequence

1. Select/link the dedicated project and provision/connect the intended managed database.
2. Set variables separately for preview and production; verify names without printing values.
3. Install the lockfile dependencies and generate Prisma Client.
4. Apply the committed migration to the intended deployment database, then seed the fixed
   ten-product catalog using that environment's private credentials:

   ```bash
   npm ci
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run build
   ```

5. Deploy the prepared project, confirm the correct HTTPS APP_ORIGIN and verify Start
   demonstration → create return → administrative approval → simulated receipt → history.
6. Verify rejection/cancellation, customer/visitor isolation, reset and private cache headers.
   Record the URL, deployment identifier, actual checks and failures in validation.md.

Migrations are a controlled release step, not run on every HTTP request. Never use
prisma db push or reset against deployed data. The build itself generates Prisma Client
but does not apply migrations or seed private data automatically.

## Cleanup and operations

`vercel.json` schedules `/api/internal/cleanup` daily at 06:00 UTC; Vercel supplies the
Bearer CRON_SECRET header. The handler refuses incorrect secrets and processes up to
100 expired environments per call with a finite execution limit. Access expiry remains
synchronous even if the job is delayed. Observe cleanup backlog and invoke further
bounded batches when needed. Local parity is available through `npm run demo:cleanup`.

Pool maximum is five per Function instance; validate aggregate database pool capacity
against expected deployment concurrency. UTC database connections and epoch-based wall
clock reads preserve the 168-hour deadline independently of server time zones.
Log safe correlation IDs and error types only; never raw cookies, database URLs,
credentials, request reasons or real personal data. Monitor failures, throttles, capacity
refusals and cleanup backlog using operational logs without an analytics integration.

## CI

`.github/workflows/ci.yml` provisions PostgreSQL 17, validates strict types/lint, runs
unit/integration/contract tests, executes Chromium desktop/mobile journeys and builds.
CI configuration exists locally; no remote workflow run is claimed without a pushed
repository and a verified GitHub Actions result.
