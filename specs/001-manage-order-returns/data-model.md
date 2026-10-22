# Data Model: Order Returns Manager MVP

Design only. PostgreSQL types and relationships below guide the future Prisma schema
and reviewed SQL migrations; no migration is executed by this command.

## Entities

| Entity | Fields and types | Relationships and constraints |
| --- | --- | --- |
| VisitorContext | id UUID; tokenHash unique text; createdAt timestamptz; lastEnvironmentExpiredAt timestamptz nullable | Anonymous provisioning/quota identity; no personal data or role |
| DemoEnvironment | id UUID; visitorId unique UUID; capabilityHash unique text; generation integer; lastActivityAt, createdAt timestamptz | One active environment per visitor context; generation starts at 1; access deadline is lastActivityAt + 168 hours |
| Product | id integer; sku unique text; name, description, category, imagePath, imageAlt text; priceMinor bigint; currency USD | Ten immutable shared fictional records; nonnegative price; static images |
| Customer | id UUID; environmentId UUID; generation integer; displayName text | Unique (environmentId, generation, id); at least two profiles per seed |
| Order | id UUID; environmentId UUID; generation integer; customerId UUID; displayNumber text; orderedAt timestamptz; status enum; deliveredAt timestamptz nullable | Composite customer reference in same environment/generation; unique displayNumber within generation |
| OrderItem | id UUID; environmentId UUID; generation integer; orderId UUID; productId integer; purchasedQuantity integer; purchasePriceMinor bigint | Positive quantity; nonnegative purchase price; unique (environmentId, generation, orderId, productId) |
| ReturnPolicy | environmentId UUID primary key; windowDays integer; updatedAt timestamptz | One policy per environment; positive integer; starts at 30; reset replaces value |
| ReturnRequest | id UUID; environmentId UUID; generation integer; orderId UUID; customerId UUID; displayNumber text; reason text; status enum; createdAt, updatedAt timestamptz; rejectionReason text nullable; version integer | Composite order/customer association; nonblank reason; rejection reason nonblank iff rejected; version starts at 1 and increments on transition |
| ReturnItem | id UUID; environmentId UUID; generation integer; requestId UUID; orderItemId UUID; orderId UUID; quantity integer | Positive quantity; unique request/item pair; composite references force same order, environment and generation |
| HistoryEvent | id UUID; environmentId UUID; generation integer; requestId UUID; sequence integer; eventType enum; occurredAt timestamptz; actorKind CUSTOMER or ADMIN; actorCustomerId UUID nullable; reason text nullable | Unique request/sequence; customer actor required for CREATED/CANCELLED; administrator actor for decisions/receipt; rejection event retains reason |
| OperationReceipt | id UUID; environmentId UUID; inputGeneration integer; operationId UUID; operationKind enum; payloadHash text; actorScope text; resultJson jsonb; statusCode integer; createdAt timestamptz | Unique (environmentId, inputGeneration, operationId); survives reset; no foreign key to reset-deleted request; result contains safe minimal response |
| ProvisionReceipt | visitorId UUID; operationId UUID; nonce text; resultEnvironmentId UUID; createdAt timestamptz | Unique visitor/operation; HMAC-derived capability recovery for lost provisioning responses; no raw token storage |
| RateBucket | visitorHash text; category enum; windowStart timestamptz; attempts integer; expiresAt timestamptz | Composite primary key on visitorHash/category/windowStart; survives demo reset; durable independent transaction |
| CapacityGuard | id singleton integer | Lock serializes environment admission; count unexpired rows after reclaim; no customer-visible state |

The two anonymous cookies identify VisitorContext and the current environment capability
separately. Store hashes only. Neither cookie stores a selected customer or role.
Deleting an environment on expiry removes its entire owned graph and receipts; retain
VisitorContext and quota buckets until their own retention deadlines. Cleanup records
lastEnvironmentExpiredAt on the visitor context before deleting its environment so a
returning visitor can still receive an expiry explanation after physical deletion. Keep visitor quota
identity for its fixed 30-day cookie lifetime and expire old buckets after their window.

## Enums and canonical display names

- OrderStatus: `PROCESSING`, `SHIPPED`, `DELIVERED`; only DELIVERED is eligible.
- ReturnStatus: `PENDING` → Pending review; `APPROVED` → Approved — awaiting pickup;
  `REJECTED` → Rejected; `CANCELLED` → Cancelled; `RECEIVED` → Return received.
- EventType: `CREATED`, `APPROVED`, `REJECTED`, `CANCELLED`, `RECEIVED`.
- OperationKind: `CREATE_RETURN`, `APPROVE`, `REJECT`, `CANCEL`, `RECEIVE`,
  `UPDATE_POLICY`, `RESET`.
- RateCategory: `MUTATION_MINUTE`, `RESET_HOUR`, `CREATE_ENVIRONMENT_HOUR`.

No order mutation interface is exposed. Missing/future delivery dates in delivered
fixtures are invalid source data; display a safe ineligibility explanation.

## Identity, foreign keys and indexes

Use UUIDs for generated graph records, independent of display numbers. New reset fixtures
receive new IDs. Carry environmentId and generation through owned relationships; define
composite unique parent keys before composite foreign keys. A return request's composite
order reference includes customerId; ReturnItem repeats orderId to enforce that both its
request and order item belong to the same order. Product references alone are global.

Index orders by (environmentId, generation, customerId, orderedAt), requests by
(environmentId, generation, status, createdAt) and customerId, return items by orderItemId,
and history by requestId/sequence. Index lastActivityAt for cleanup and visitorHash for
quota retention. Lists use stable (createdAt, id) cursor ordering.

Database CHECK constraints enforce local positive quantities/window/generation/version,
nonnegative prices, nonblank reasons and actor/rejection consistency. A CHECK cannot
safely enforce committed sums across rows; the mandatory environment lock and scoped
aggregate do so. There are no unguarded mutation code paths. App-facing database access
must not expose generic update/delete history operations.

## Invariants and transaction protocol

1. Validate cookie and same-origin transport. Atomically consume durable quota buckets
   for mutations in a separate admission transaction; even invalid domain attempts count.
2. Open a short READ COMMITTED transaction; lock DemoEnvironment by the validated
   capability hash before reading its owned rows. Use parameterized SQL for the lock.
3. Read database wall time after lock acquisition (do not use a transaction-start time
   that predates a long lock wait). Reject expired access before renewing activity.
4. Validate requested customer context and generation. For an exact reset retry only,
   an existing reset receipt can acknowledge its original input generation. Other
   old-generation operations return conflict before replaying old receipts.
5. Check operation receipt for matching kind, actor scope, and canonical payload hash.
   Return the recorded safe outcome on replay; conflicting reuse is 409. Customer
   replay still requires its original scoped context. Fresh operation IDs mean new intent.
6. Re-evaluate current order state/date, policy, items and committed units. Available
   quantity is purchased minus SUM(quantity) for PENDING, APPROVED and RECEIVED parents.
7. For successful creation, write request, all items, CREATED event and receipt together.
   For transitions, verify current state then update it, increment version, append exactly
   one next-sequence event, and record the receipt together.
8. Renew qualifying activity and commit. Invalid domain operations roll back domain
   changes; their quota admissions remain consumed. Valid screen reads renew activity
   inside their guard transaction. Activity is operational metadata, never a domain event.

Never call external services or wait for user input while holding a transaction.
Set finite lock and statement timeouts. Retry a transient deadlock at most twice with
jitter around the entire transaction, then return a safe concurrency conflict. No partial
write or event escapes an aborted transaction. Same-operation retries consume quota too.

## State machine

| Source | Action | Destination | Actor | Commitment |
| --- | --- | --- | --- | --- |
| No request | Create | PENDING | Customer | Add requested units |
| PENDING | Approve | APPROVED | Administrator | Unchanged |
| PENDING | Reject with reason | REJECTED | Administrator | Released |
| PENDING | Confirm cancel | CANCELLED | Customer | Released |
| APPROVED | Confirm simulated receipt | RECEIVED | Administrator | Unchanged |

REJECTED, CANCELLED and RECEIVED are final. A receipt confirmation applies to the whole
request and needs no waiting period. No partial approval or line-level decision exists.

## Policy and calendar calculation

Use current server time projected to America/Bogota local date. Delivery is day zero;
accept while local today is at most delivery local date plus windowDays, inclusive.
Use date-only calendar arithmetic, not elapsed 24-hour subtraction. Invalid/future dates
are ineligible. Changes to windowDays apply to new request evaluation only. Existing
requests remain actionable by their current states. Financial amounts serialize as
base-10 integer strings in minor units to avoid bigint/JSON and floating-point errors.

## Reset and expiry lifecycle

A reset uses the same environment lock, checks expiry and generation, increments
generation, removes old history/requests/items/orders/customers, restores six baseline
orders for two customers and the 30-day policy, then saves its receipt in the same
transaction. Preserve the shared Product catalog, visitor quota identity, quota buckets
and reset receipts. No half-reset state is visible. Late requests with the previous
generation cannot act on the restored graph.

The retained reset receipt returns its original minimal acknowledgement only. If a
later reset has happened, callers must refetch the current environment; replaying a
receipt must not overwrite a newer browser generation with the historical response.

Expiry occurs at 168 hours since last qualifying activity. Each access checks it before
renewal; background reads cannot renew. Daily cleanup acquires the environment lock,
rechecks eligibility for deletion, and cascades owned data in bounded batches. Access
remains blocked even if cleanup is delayed. A new demo requires explicit visitor intent;
expired data is never silently reset or restored.

## Seed catalog mapping

Use the existing fictional USD prices in `catalog/products.json` unchanged.
Integer-cent values in catalog ID order are:
7999, 3999, 6999, 4999, 3499, 3999, 4499, 4499, 3499, 2499.
Convert source decimals exactly to cents; never multiply binary floating-point values
without an exact decimal conversion. Currency is USD throughout the catalog, purchase
price snapshots, contracts, and UI. Display two decimal places and an explicit USD label.
Reuse SKUs and imagery, copy assets into public/products during implementation, and
retain fictional-brand disclaimers. Seed two named fictitious profiles and six orders:
recent delivered multi-item, recent delivered multi-quantity, expired delivered,
processing, shipped, and recent delivered for the second profile. Dates are relative to
initialization/reset. Six example requests are seeded on provisioning/reset: two pending and one approved,
received, rejected and cancelled. Each has valid items/quantities and complete history;
committed examples leave units available for new requests. Both profiles have examples.
