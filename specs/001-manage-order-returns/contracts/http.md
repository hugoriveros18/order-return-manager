# HTTP Interface Contract

Version 1 design for same-origin Next.js Route Handlers. All environment reads/mutations
run the shared context, expiry, scope and generation guards. No caller supplies its own
environment identifier. These contracts describe simulated roles, not real authorization.

## Transport and context

- Base path `/api`; JSON UTF-8; dates ISO 8601 UTC timestamps; calendar comparisons use
  America/Bogota. Money is `{amountMinor: "7999", currency: "USD"}`.
- Opaque HttpOnly cookies establish visitor quota context and the environment capability.
  Production capability cookie is `__Host-orm-demo`; local HTTP uses a dev-only name.
  Tokens are never returned in JSON, URLs, logging, or browser storage.
- Every mutation requires same-origin Origin, `application/json`, `Idempotency-Key`
  containing a UUID, and `X-Demo-Generation` containing the current positive integer,
  except visitor bootstrap/provisioning as described below. Reject unknown body fields.
- Customer resources use a customerId in the path. The server verifies that this customer,
  order and request belong together inside the capability's current environment/generation.
  Customer selection is never persisted in a shared role/customer cookie.
- Private responses, including errors, send `Cache-Control: private, no-store` and
  `Vary: Cookie`. Success envelope is `{data: ..., meta: {generation: 1}}` except
  bootstrap without an environment. IDs are opaque; display numbers are separate fields.
- Read requests use `X-Demo-Activity: navigation` only for visitor-initiated screen loads
  and refreshes. Unmarked/background reads do not renew activity. Server-rendered direct
  navigation uses the same explicit guard intent. Disable speculative prefetch on private
  links. No header can revive an expired environment.
- Mutation bodies are limited to 32 KiB. Reasons trim surrounding whitespace and allow
  1–1000 Unicode characters. Quantities/windowDays are positive safe integers; reject
  overflow rather than coercing decimals or strings. Limits are transport/storage bounds.

## Endpoints

| Method and path | Input | Success | Scope and side effects |
| --- | --- | --- | --- |
| POST /api/visitor | Empty object | 200 visitor ready | Establish/reuse anonymous quota cookie, no environment data; same-origin; bounded global ingress |
| POST /api/demo | Empty object, Idempotency-Key; no generation | 201 new demo; 200 same-operation replay | Allocate one active env per visitor; seed graph and policy; set capability cookie; quota and global capacity admission |
| GET /api/demo | Activity intent optional | 200 environment summary | generation, expiry timestamp, selected customer options; never selected tab state |
| POST /api/demo/reset | `{confirmed: true}`, operation key and generation | 200 `{reset: true, generation: next}` | Atomic reseed; exact reset retry returns original acknowledgement; no second reset |
| GET /api/customers | Activity intent optional | 200 customer list | Only current environment profiles |
| GET /api/customers/{customerId}/orders | cursor, limit | 200 paginated orders | Scoped summaries with eligibility and explanation |
| GET /api/customers/{customerId}/orders/{orderId} | Activity intent optional | 200 order detail | Items, purchase prices, available units, policy and eligibility explanation |
| POST /api/customers/{customerId}/orders/{orderId}/returns | `{reason, items: [{orderItemId, quantity}]}` | 201 request; replay returns original result | At least one distinct item; all items same scoped order; one creation event |
| GET /api/customers/{customerId}/returns | cursor, limit | 200 paginated requests | Only selected profile's requests |
| GET /api/customers/{customerId}/returns/{requestId} | Activity intent optional | 200 request detail | Items, state, history, rejection reason, instructions when approved |
| POST /api/customers/{customerId}/returns/{requestId}/cancel | `{confirmed: true}` | 200 updated request | PENDING only; customer event |
| GET /api/admin/returns | optional status, cursor, limit | 200 paginated requests | All environment customers, no cross-environment access |
| GET /api/admin/returns/{requestId} | Activity intent optional | 200 request detail | Order, customer, items, quantities, reason, date and ordered history |
| POST /api/admin/returns/{requestId}/approve | Empty object | 200 updated request | PENDING to APPROVED; administrator event |
| POST /api/admin/returns/{requestId}/reject | `{reason}` | 200 updated request | PENDING to REJECTED; nonblank reason; administrator event |
| POST /api/admin/returns/{requestId}/receive | Empty object | 200 updated request | APPROVED to RECEIVED; administrator event |
| GET /api/admin/policy | Activity intent optional | 200 `{windowDays, updatedAt}` | One current policy |
| PATCH /api/admin/policy | `{windowDays}` | 200 updated policy | Positive safe integer; new-request evaluation only |
| GET /api/internal/cleanup | Cron bearer secret, no visitor cookies | 200 `{deletedCount}` | Internal daily maintenance, bounded batches, no public demo data |

New demo provisioning is idempotent by VisitorContext and operation key, with its receipt
stored at visitor scope so it survives a lost Set-Cookie response. Replays can reissue the
same capability only through a server-side encrypted provisioning receipt or a token
regenerated using a server secret and the receipt nonce; never store raw bearer tokens.
Choose deterministic HMAC-derived capability from a stored random nonce + visitor ID for
this implementation, with only capability hash on the environment. Do not rotate secrets
without planning invalidation. If an active demo already exists for that visitor, recover
it instead of allocating another; if expired, creation starts a new graph explicitly.

If cleanup has already deleted the environment, a valid visitor context and its expiry
marker still allow an expiration explanation without disclosing any old data. Expired
provisioning receipts cannot revive a graph. Explicit new-start intent uses a new key,
removes any expired predecessor under the same admission protocol and creates fresh data.

Provisioning takes the capacity lock, then the visitor provisioning lock and admission
receipt, then environment locks only if recovering/reclaiming an existing graph. No other
operation holds these locks in the reverse order. Cleanup and mutations never acquire
the capacity lock while holding an environment lock. POST /api/demo consumes both
applicable generic-mutation and creation allowances; reset consumes mutation and reset
allowances. Context bootstrap cannot allocate demo data and is globally ingress limited.

## Responses and shapes

Request summaries include `id`, `displayNumber`, `orderId`, `orderDisplayNumber`,
`customerId`, `createdAt`, canonical status and `version`. Detail adds `reason`,
`rejectionReason`, `items`, `history`, and `instructions` for approved requests.
Items include orderItemId, product name/image/alt, purchase price, purchased quantity,
requested quantity and current availability. History uses sequence, eventType, occurredAt,
actor `{kind, customerId?, displayName}` and rejection reason when present.

Order detail includes `eligibility: {eligible, code, message, eligibleUntilDate}` and
available units per item. Codes distinguish NOT_DELIVERED, WINDOW_EXPIRED,
NO_AVAILABLE_UNITS and INVALID_DELIVERY_DATE. Eligibility is informational until creation
rechecks it under the lock. Displayed instruction content explicitly rules out real
carrier dispatch and monetary refunds. Lists default to 20 and cap at 50; malformed
cursors/unknown statuses return 400. A customer with zero records receives an empty list.

## Uniform failures

Shape: `{error: {code: "QUANTITY_CONFLICT", message: "Only 1 unit is available.",
requestId: "opaque-correlation-id"}}`. Optional `retryAfterSeconds` is safe metadata.
Do not include traces, queries, raw tokens, database identifiers or unscoped object data.

| HTTP status | Error examples | Expected outcome |
| --- | --- | --- |
| 400 | INVALID_INPUT, DUPLICATE_ITEM, INVALID_POLICY, REJECTION_REASON_REQUIRED | Reject malformed data without domain changes |
| 403 | INVALID_ORIGIN, DEMO_SESSION_REQUIRED | No cross-origin mutation or invalid-capability data access |
| 404 | RESOURCE_NOT_FOUND | Missing and foreign-environment resources look identical |
| 409 | ORDER_INELIGIBLE, QUANTITY_CONFLICT, STATE_CONFLICT, STALE_DEMO, IDEMPOTENCY_CONFLICT, DEMO_EXPIRED | Explain domain conflict; expiry response offers explicit restart |
| 429 | RATE_LIMITED | No domain changes; Retry-After header; consumed allowances survive reset |
| 500 | INTERNAL_ERROR | Safe message and correlation ID; transaction rollback |
| 503 | TEMPORARILY_UNAVAILABLE, DEMO_CAPACITY_REACHED | No unbounded allocation or bypass on database/admission outage |

Expiry takes precedence over new access, activity renewal, and operation replay. Rate
admission can reject before a domain transaction; it never grants access to expired data.
No invalid operation produces a history event. Same-operation success replay uses its
recorded safe response, even if the request later transitioned; the caller refetches
current detail rather than treating a historical response as a fresh state projection.

## Contract validation targets

Cover each endpoint's happy path, malformed inputs, absent/foreign resources, stale
cookie/generation, invalid Origin, quota excess, safe unexpected error, and correct cache
headers. Check exact-duplicate operation replay and changed-payload conflicts. Test all
state transitions and all invalid source states against real PostgreSQL. Cleanup must
reject absent/wrong bearer secrets and recheck expiry after lock acquisition.

## Clarity list metadata

GET /api/admin/returns includes meta.pendingCount: an exact integer count of PENDING
requests scoped to the current environment/generation, independent of status filter,
cursor or page size. Existing data/meta.generation, no-store and error contracts remain.
GET /api/demo returns the renewed expiresAt when explicitly requested as navigation;
background checks report the current deadline without renewing activity.
