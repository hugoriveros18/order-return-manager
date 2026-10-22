# Feature Specification: Order Returns Manager MVP

**Feature Branch**: `master` (existing branch; no branch-creation hook configured)

**Created**: 2026-10-21

**Status**: Implemented locally; public release verification pending

**Input**: User-provided Order Returns Manager feature specifications covering nine
capabilities: catalog and orders, request creation, eligibility, administrative review,
cancellation, simulated receipt, return-window settings, history, and isolated demos.

## Clarifications

### Session 2026-10-21

- Q: Should selecting a fictitious customer in one tab change the selected customer in
  other tabs of the same demonstration? → A: No. Each tab keeps its own customer and
  customer/administrator view selection while sharing the demonstration's persisted data.
  A customer can create a request in one tab and an administrator can approve that same
  request in another; refreshing the customer view shows the updated status.

- Q: Which actions restart the seven-day inactivity period? → A: Visitor-initiated
  screen views and operations restart it; automatic background updates do not. On each
  access, expiry is checked before renewing activity. After seven full days without
  qualifying activity, access to the old environment is blocked and the visitor is
  informed and offered a fresh demonstration rather than silently resetting data.

- Q: Which language must the application screens, messages, and fictitious content use?
  → A: English, including customer and administrator interfaces, validation and error
  messages, instructions, product content, and seeded demonstration text. America/Bogota calendar rules remain unchanged; multilingual support is out of scope.

- Currency amendment (2026-10-21): The project owner selected USD for all catalog,
  order and return price displays, superseding the earlier COP requirement. Reuse the
  catalog's existing fictional USD prices; no exchange-rate conversion is required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore an Independent Demonstration (Priority: P1)

As a visitor, I can start a fictitious demonstration, select a customer, and switch
between customer and administrator views without affecting another visitor.

**Why this priority**: Every journey depends on a usable, isolated demonstration.

**Independent Test**: Start two separate visitor demonstrations and compare their initial
orders; make a change in one and verify that the other retains its original data.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they start a demonstration, **Then** an independent
   environment provides fictitious customers, orders, ten products, and a 30-day policy.
2. **Given** an active environment, **When** the visitor selects a customer or switches
   to administration, **Then** no registration is required and the environment is retained.
3. **Given** environments A and B, **When** A changes a request or policy, **Then** B's
   data and settings remain unchanged; attempts from A to access B's data are denied
   without disclosing that data.
4. **Given** an active environment, **When** the visitor reloads the application,
   **Then** its recorded requests, decisions, settings, and history remain available.
5. **Given** two tabs in the same demonstration, **When** one selects a customer or
   switches to administration, **Then** the other retains its own view and customer.
6. **Given** a customer request created in one tab, **When** an administrator opens
   the request list in another tab and approves it, **Then** both operate on the same
   request and refreshing its customer detail shows the approved status and history.

### User Story 2 - Inspect Orders and Products (Priority: P1)

As a customer, I can inspect my fictitious orders and understand whether I can request
returns for the purchased products.

**Why this priority**: Customers need purchase context before requesting a return.

**Independent Test**: Select a seeded customer with delivered and non-delivered orders;
inspect order details and eligibility explanations without creating any requests.

**Acceptance Scenarios**:

1. **Given** a selected customer, **When** they browse orders, **Then** only that
   customer's orders appear, with identifier, date, status, and purchased products.
2. **Given** an order, **When** its detail is opened, **Then** each item shows product
   name, image, purchase unit price in USD, purchased quantity, and return availability.
3. **Given** a delivered order inside the return window with available units, **When**
   its detail is opened, **Then** the customer can start a return.
4. **Given** a non-delivered, expired, or fully committed order, **When** inspected,
   **Then** the customer sees the reason a return cannot start.
5. **Given** the fixed catalog, **When** products are displayed, **Then** all ten have
   identifiers, SKUs, names, descriptions, categories, USD prices, and consistent images
   without real commercial brands; no product or order editing controls are available.

### User Story 3 - Submit a Valid Full or Partial Return (Priority: P1)

As a customer, I can request available units from one eligible order and receive a
traceable confirmation or a clear explanation of why the request cannot be accepted.

**Why this priority**: This is the main customer outcome and establishes quantity integrity.

**Independent Test**: Use eligible seeded orders to submit full and partial returns,
then try invalid quantities and overlapping submissions against remaining availability.

**Acceptance Scenarios**:

1. **Given** an eligible order, **When** the customer selects one or more items with
   available positive integer quantities and a reason, **Then** one request is created
   as Pending review, its identifier is shown, and a creation event is recorded.
2. **Given** an eligible order with all purchased units available, **When** all items
   and all their units are selected, **Then** a full return is accepted under the same rules.
3. **Given** an empty selection, invalid quantity, missing reason, foreign item,
   nonexistent order, non-delivered order, or expired window, **When** submitted,
   **Then** an understandable error appears and no request, commitment, or event is created.
4. **Given** one available unit, **When** two different requests for it arrive together,
   **Then** at most one succeeds and the other receives a conflict explanation.
5. **Given** a submitted operation, **When** it is retried or double-submitted,
   **Then** at most one request and one creation event result from that operation.
6. **Given** eligibility shown earlier, **When** the policy, quantities, or date have
   changed before submission, **Then** the current rules are checked again before creation.

### User Story 4 - Review and Decide Requests (Priority: P1)

As an administrator, I can inspect requests and approve or reject each pending request
in its entirety with a traceable decision.

**Why this priority**: Administrative decisions complete the core review journey.

**Independent Test**: Use pending request fixtures to approve one, reject another with a
reason, and attempt decisions on non-pending fixtures.

**Acceptance Scenarios**:

1. **Given** recorded requests, **When** the administrator opens the list and detail,
   **Then** pending requests are identifiable and the associated order, items,
   quantities, reason, creation date, status, and history are available.
2. **Given** Pending review, **When** approved, **Then** the entire request becomes
   Approved — awaiting pickup and one administrator approval event is added.
3. **Given** Pending review, **When** rejected with a nonblank reason, **Then** the
   entire request becomes Rejected, its units are released, and the reason is retained.
4. **Given** a blank rejection reason or non-pending request, **When** a decision is
   attempted, **Then** it fails without any state, quantity, or history change.
5. **Given** a pending request, **When** approval, rejection, or cancellation compete,
   **Then** exactly one valid transition wins and every loser reports the current conflict.

### User Story 5 - Follow Request Status and History (Priority: P1)

As a customer or administrator, I can understand a request's current state and the
sequence of completed actions without losing rejection explanations.

**Why this priority**: The demo must make outcomes and accountability visible.

**Independent Test**: Inspect fixtures in every supported state and compare current
status with their recorded events from both customer and administrator views.

**Acceptance Scenarios**:

1. **Given** a selected customer, **When** their requests are listed, **Then** each
   shows identifier, associated order, creation date, and current status, and requests
   of other customer profiles are excluded.
2. **Given** a request detail, **When** inspected, **Then** it shows included items,
   quantities, reason, and ordered events with date, type, and demonstration actor.
3. **Given** a rejected request, **When** the customer inspects it, **Then** its
   rejection reason is visible; customer and administrator actions are distinguishable.
4. **Given** an invalid attempted operation, **When** history is inspected, **Then**
   there is no event for that attempt and the current status matches the last valid event.
5. **Given** existing events, **When** using either view, **Then** they cannot be edited.

### User Story 6 - Cancel a Pending Request (Priority: P2)

As a customer, I can withdraw a pending request and recover eligible units for a new request.

**Why this priority**: Cancellation gives customers control before a decision is made.

**Independent Test**: Use a pending request fixture, decline and then confirm cancellation,
and compare availability and history before and after.

**Acceptance Scenarios**:

1. **Given** Pending review, **When** cancellation is initiated, **Then** confirmation
   is requested; declining it leaves all data unchanged.
2. **Given** confirmation, **When** the request is still pending, **Then** it becomes
   Cancelled, units are released, and one customer cancellation event is recorded.
3. **Given** a cancelled request, **When** a new request for the units is submitted,
   **Then** it is accepted only if all current eligibility rules still hold.
4. **Given** Approved — awaiting pickup, Rejected, Return received, or Cancelled,
   **When** cancellation or reactivation is attempted, **Then** no change occurs.

### User Story 7 - Read Instructions and Complete Simulated Receipt (Priority: P2)

As a customer, I can understand the fictional next steps after approval. As an
administrator, I can mark the approved products as received to finish the demonstration.

**Why this priority**: This completes the lifecycle while explaining its fictional nature.

**Independent Test**: Open an approved request fixture, read its instructions, confirm
receipt in administration, and verify the final customer status and history.

**Acceptance Scenarios**:

1. **Given** an approved request, **When** viewed by the customer, **Then** instructions
   ask them to pack products and explain a simulated pickup within the next three
   business days; no real carrier will be dispatched.
2. **Given** Approved — awaiting pickup, **When** the administrator confirms fictitious
   receipt, **Then** the whole request becomes Return received with one receipt event.
3. **Given** Return received, **When** inspected, **Then** confirmation and history are
   visible, units remain committed, and no further state transition is allowed.
4. **Given** any state other than approved, **When** receipt is attempted, **Then** it
   fails without changes; no transport order, label, tracking, or refund is produced.

### User Story 8 - Configure the Return Window (Priority: P2)

As an administrator, I can adjust the global return window for my demonstration so
future requests use the updated policy.

**Why this priority**: Configurability demonstrates policy enforcement without per-product rules.

**Independent Test**: Change the initial 30-day value, evaluate new requests on both
sides of the revised boundary, and inspect preexisting requests.

**Acceptance Scenarios**:

1. **Given** a fresh environment, **When** settings are opened, **Then** 30 calendar
   days from delivery is shown as its sole global return-window policy.
2. **Given** a positive integer value, **When** saved, **Then** confirmation appears
   and all subsequent creation attempts in that environment use the new value.
3. **Given** zero, a negative, fractional, blank, or nonnumeric value, **When** saved,
   **Then** an error appears and the previous value is preserved.
4. **Given** previously registered requests and another visitor's environment, **When**
   this policy changes, **Then** neither their states and decisions nor the other
   environment's policy change; existing requests remain actionable under their states.

### User Story 9 - Reset or Restart a Temporary Demonstration (Priority: P2)

As a visitor, I can restore initial data and understand that my demonstration is temporary.

**Why this priority**: Reset makes repeated public demonstrations possible.

**Independent Test**: Create requests and change settings in one of two environments;
reset it and verify its restored baseline and the other environment's unchanged data.

**Acceptance Scenarios**:

1. **Given** a modified environment, **When** reset is requested, **Then** the visitor
   is told requests, decisions, history, and settings will be lost and must confirm.
2. **Given** declined confirmation, **When** reset is dismissed, **Then** nothing changes.
3. **Given** confirmed reset, **When** completed, **Then** only this environment's
   generated requests and history disappear and the initial example requests, histories,
   orders and the 30-day policy return with new resource identifiers.
4. **Given** no eligible orders for the selected customer, **When** viewing orders,
   **Then** an explanation and a reset option are shown.
5. **Given** an expired environment, **When** revisited, **Then** the visitor is told
   its temporary data expired and can start a fresh demonstration; old data is not
   loaded and the environment is not silently reset.
6. **Given** an operation based on data from before a reset, **When** submitted after
   reset, **Then** it cannot recreate old requests or attach old history to the restored demo.

7. **Given** an unexpired environment, **When** the visitor opens a screen or performs
   an operation, **Then** its inactivity period restarts from that activity across all
   tabs sharing the environment; background refreshes alone do not extend its lifetime.
8. **Given** exactly seven full days since the last qualifying activity, **When** an
   old tab reads data or submits an operation, **Then** access is blocked before activity
   can be renewed, no operation is applied, and the expiration explanation is shown.

### User Story 10 — Clear, respectful communication (Priority: P1)

As a visitor, I can focus on orders and returns, recognize that I am using a demo and
understand approval/receipt consequences where they matter.

**Independent test**: Browse landing, direct customer/admin links, order selection,
return creation/review/confirmation, pending/approved/received detail, guide and settings.

1. Given any landing/workspace destination, including loading/error/empty/expiry states,
   when it is displayed, one concise Demo identifier is visible without a global warning.
2. Given routine order, picker or form content, when read, copy describes the task rather
   than repeatedly stating that customers/orders are fictional. USD details are retained.
3. Given pending-admin or approved details, when approval or next steps are considered,
   applicable no-refund/no-physical-receipt, simulated three-business-day pickup and
   no-real-carrier explanations remain visible without opening help.
4. Given a received detail, when inspected, the simulation remains clear and no refund is
   implied. Reset loss, expiry, recovery and safe errors remain explicit where relevant.

### User Story 11 — Recognizable browser identity (Priority: P2)

As a visitor with several tabs, I can recognize this application from a clear favicon.

**Independent test**: Open landing and nested customer/admin pages in modern desktop
browsers and inspect the small tab icon in light/dark browser appearance.

1. Given any application route, when loaded, the browser receives the same branded icon
   rather than an absent or framework-default icon.
2. Given a 16px or 32px tab icon, when displayed against light/dark browser chrome,
   its parcel/return motif is discernible without text or a clipped symbol.

### User Story 12 — Consistent request evidence (Priority: P2)

As an administrator, I can distinguish the customer's reason, a rejection explanation
and the current outcome using the same visual semantics as the customer detail.

**Independent test**: Inspect pending, approved, rejected, received and cancelled
requests in both views and compare corresponding evidence regions.

1. Given a rejected request, when opened by the administrator, Rejection reason uses
   the customer view's error treatment and is distinct from the neutral Customer reason.
2. Given approved or received details, when inspected, corresponding informational or
   success surfaces match customer detail semantics without changing role-specific actions.
3. Given pending/cancelled details or multiline/long reasons, when viewed at narrow/wide
   widths in either theme, headings, text and status labels remain readable and aligned.

### Edge Cases

- Delivery day is day zero. A request on the final allowed local calendar date is valid;
  a request on the following date is rejected, regardless of when the form was opened.
- Missing or future delivery dates on an allegedly delivered order prevent creation
  with a safe explanation rather than silently accepting inconsistent source data.
- Multiple selected rows for the same order item are rejected as invalid; quantities
  cannot be hidden by repeated item identifiers.
- A rejected or cancelled quantity is available again only if the order is still eligible;
  receiving approved units never releases them.
- The same product on two different orders retains separate purchased-unit availability.
- A deliberate new request for remaining units is allowed even when its contents match
  an older request; replaying the same submission operation creates no duplicate.
- Concurrent state changes, creation versus reset, and creation versus policy update
  resolve in a consistent order with no mixed or partially applied result.
- Losing a success response and retrying a decision or receipt never adds a second event.
- Switching the selected customer hides the previous customer's requests; direct access
  to an order or request outside the active customer context reveals no details.
- A reset does not erase another visitor's data or bypass anonymous-write limits.
- Temporary failures preserve existing domain data and show a safe, actionable error;
  empty lists and loading states remain understandable and usable.

- Direct links must not rely on a visitor having read the landing-page introduction.
- An icon may be cached by a browser; verify fresh metadata/network responses and a
  fresh browser context before treating a stale tab as a defective asset.
- A cancelled request must not receive a green receipt-confirmation panel by association.
- A long rejection reason must wrap and retain line breaks without layout overflow.
- Do not globally replace demo/simulated words, mutate visitor reasons or rewrite
  persisted image alternatives merely to satisfy a text scan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide isolated demonstrations without registration or
  real authentication, with selectable fictitious customers and a simulated administrator.
- **FR-002**: Every environment MUST receive initial fictitious customers, orders, a
  fixed ten-product technology catalog, and its own global 30-calendar-day return policy.
  Fresh and reset environments MUST also contain six example return requests: two Pending,
  one Approved, one Received, one Rejected and one Cancelled, with valid quantities and
  complete chronological customer/administrator history. Both customers have examples;
  eligible units remain available for new requests. Existing environments retain their data
  until the visitor explicitly resets them.
- **FR-003**: Every product MUST have an identifier, SKU, name, description, category,
  USD price, and image, with consistent professional presentation and no real brands.
  All monetary displays MUST identify USD and show two decimal places; purchase unit
  prices MUST retain their original recorded USD amounts.
- **FR-004**: Customers MUST see only the orders and requests of their selected profile
  within their environment, including when opening a detail directly. Each tab MUST
  retain its own selected customer and customer/administrator view; changing these
  selections in one tab MUST NOT change them in another tab.
- **FR-005**: Order lists and details MUST expose identifier, order date, order status,
  products, product images, purchase unit prices, purchased quantities, and eligibility.
- **FR-006**: Customers MUST NOT create, modify, or delete orders or products.
- **FR-007**: Customers MUST be able to select one or more distinct items from one
  eligible order and request full or partial purchased quantities.
- **FR-008**: Every request MUST have a nonblank return reason, either selected from
  offered reasons or provided as text, and at least one item with a positive integer quantity.
- **FR-009**: Before recording a request, the system MUST recheck order existence,
  customer and environment association, delivered status, valid delivery date, current
  return window, item membership, and available quantities.
- **FR-010**: The initial window MUST be 30 calendar days from delivery. Eligibility
  MUST include the delivery date through the final allowed local calendar date, inclusive.
- **FR-011**: Available units for an order item MUST equal purchased units minus units
  in Pending review, Approved — awaiting pickup, and Return received requests. Units
  in Rejected or Cancelled requests MUST NOT be subtracted.
- **FR-012**: Repeated or simultaneous requests MUST NOT commit more units than purchased;
  repeated submission of the same operation MUST create at most one request.
- **FR-013**: Valid creation MUST record the complete request as Pending review, commit
  its quantities, add one creation event, and show its identifier in confirmation.
- **FR-014**: Invalid creation MUST explain the failed rule and leave no partial request,
  quantity commitment, or history event.
- **FR-015**: Administrators MUST see all requests in their environment, identify pending
  requests, and inspect order, items, quantities, reason, date, status, and history.
- **FR-016**: Administrators MUST be able to approve or reject only Pending review
  requests, acting on the complete request without partial approvals.
- **FR-017**: Approval MUST change the state to Approved — awaiting pickup and preserve
  committed units; rejection MUST require a nonblank reason, change the state to Rejected,
  and release units. Each successful decision MUST add one administrator event.
- **FR-018**: Customers MUST be asked to confirm cancellation. Confirmed cancellation
  MUST change only Pending review requests to Cancelled, release units, and record one
  customer event. Declining confirmation MUST leave the request unchanged.
- **FR-019**: Approved requests MUST show packing instructions and simulated pickup
  within the next three business days, explicitly stating that no real carrier is sent.
- **FR-020**: The interface MUST explain that approval and receipt do not execute a
  monetary refund and approval does not establish physical receipt.
- **FR-021**: Administrators MUST be able to confirm fictitious receipt only for an
  approved request, changing the whole request to Return received and recording one event.
- **FR-022**: Only the transitions in the state table below MUST be allowed. Rejected,
  Cancelled, and Return received MUST be final; requests MUST NOT be reactivated or edited.
- **FR-023**: Invalid, contradictory, or losing concurrent transitions MUST leave state,
  quantities, and history unchanged and explain the conflict. Repeated operations MUST
  NOT create duplicate events.
- **FR-024**: Administrators MUST be able to view and replace the environment's sole
  global return-window value with a positive integer number of calendar days.
- **FR-025**: Invalid settings MUST preserve the previous value and explain the error;
  successful updates MUST show confirmation and affect only new request evaluations.
- **FR-026**: Policy changes MUST NOT retroactively invalidate registered requests,
  alter past decisions, or prevent transitions otherwise allowed by their current states.
- **FR-027**: Request lists MUST show identifier, associated order, creation date, and
  current status; details MUST show items, quantities, reason, and history.
- **FR-028**: Creation, approval, rejection, cancellation, and receipt MUST each record
  their event type, timestamp, and demonstration actor. Customer actors MUST identify
  the selected fictitious profile; administrator events MUST identify the administrator view.
- **FR-029**: History MUST be ordered by actual event sequence, retain rejection reasons,
  agree with current status, and offer no event-editing capability in either view.
- **FR-030**: Every related change to request contents, quantities, status, and history
  MUST either complete consistently together or make no domain change.
- **FR-031**: Requests, decisions, settings, and history MUST remain available across
  page reloads while the environment exists and has not been reset. Tabs in the same
  browser context MUST share this persisted data. Loading or refreshing a request list
  or detail MUST show completed changes made in another tab; automatic live updates
  are not required.
- **FR-032**: Visitors MUST NOT read, modify, or reset another visitor's environment,
  even by supplying identifiers from that environment or entering administration.
- **FR-033**: Reset MUST require confirmation describing the loss of generated requests,
  decisions, history, and settings. It MUST affect only the visitor's environment and
  restore initial fictitious orders and policy with no generated requests or history.
- **FR-034**: Reset and competing operations MUST preserve a consistent baseline;
  stale operations MUST NOT apply to the restored environment.
- **FR-035**: Customers with no eligible orders MUST receive an explanation and an option
  to reset their demonstration.
- **FR-036**: Visitors MUST be told that data is temporary. An environment MUST expire
  after seven full days (168 hours) since its last qualifying visitor activity, initially
  its creation. Visitor-initiated screen views and operations in any sharing tab MUST
  renew activity only while the environment remains unexpired. Automatic background
  updates MUST NOT renew it. Every access MUST check expiry before reading environment
  data, applying operations, or renewing activity. At or after expiry, old data MUST
  remain inaccessible, an expiration explanation MUST appear, and the visitor MUST be
  offered a fresh demonstration; the system MUST NOT silently reset the old environment.
  Access expiry MUST NOT depend on when expired data is physically cleaned up.
- **FR-037**: Public demonstrations MUST limit anonymous state-changing attempts to
  60 per minute per visitor and resets to five per hour per visitor. Excess attempts
  MUST be refused without domain changes, explaining the limit and when to retry.
  Reset MUST NOT renew these allowances. Creating new environments MUST be limited
  to 10 attempts per hour per anonymous visitor context.
- **FR-038**: Invalid operations and unexpected failures MUST show clear, uniform errors
  with an error identifier and safe message, without exposing internal diagnostics,
  credentials, or real personal information.
- **FR-039**: Customer and administrator journeys MUST support mobile and desktop
  browsers, keyboard operation, labeled controls, visible focus, understandable loading,
  empty and error states, and status information that does not rely on color alone.
  All customer and administrator interface text, messages, instructions, and fictitious
  content MUST be in English, including product names and descriptions and seeded
  textual reasons. Visitor-entered free text MUST be preserved without translation;
  visitors MUST NOT be required to write their free text in English.
- **FR-040**: Demonstration data and all activities MUST remain fictitious. No action
  MUST create financial, transport, messaging, or other external customer operations.

- **FR-041**: Both demonstration views MUST expose a shared How returns work guide using
  the approved Flow map (alternative A). Show the five canonical states and only the four
  permitted transitions, identify the customer/administrator actors, and explain committed
  versus released units, eligibility and fictitious pickup/receipt with no monetary refund.
  State selection MUST reveal a concise explanation without changing demonstration data.
  Preserve role/customer context when entering the guide, switching roles or selecting a
  different profile there. All connector labels MUST be fully readable, unclipped and
  outside state-card bounds. Provide a readable narrow-screen layout, keyboard operation,
  visible selection and both appearance themes.

- **FR-042**: Landing and every customer/admin workspace route MUST expose one concise,
  non-dismissible Demo identifier, including direct-entry and loading/error/empty/expiry
  states. General scope explanations MUST NOT appear as a persistent warning strip or
  repeated navigation/profile/order-detail disclaimers. A short landing sample-data
  introduction and one general guide explanation MAY remain.
- **FR-043**: Routine copy MUST be task-focused and retire the strings "Your own fictional
  workspace.", "Original purchase prices in USD. All products and orders are fictional."
  and "Demonstration only. No real refunds, shipments or pickups." Currency, amounts,
  deadlines, quantities, customer names, canonical states/events and entered reasons
  MUST preserve their meaning.
- **FR-044**: Baseline FR-019/020/041 explanations MUST remain with their applicable
  approval/receipt action or detail, including direct entry, in at most one consolidated
  boundary block per region. Help alone MUST NOT replace contextual explanations.
  No text may promise actual pickup, physical receipt, payment or refund.
- **FR-045**: Copy/presentation changes MUST preserve accessible control/image descriptions,
  actionable errors, reset loss/confirmation/irreversibility, temporary-data/expiry and
  recovery messages. They MUST NOT add first-visit warnings, consent dialogs, dismissal
  preferences or new navigation steps to replace removed repetition.
- **FR-046**: All application routes MUST expose a consistent professional favicon aligned
  with the existing parcel/return identity, legible at 16/32px against light/dark browser
  appearance, with a browser-compatible raster fallback and no text-dependent identity.
- **FR-047**: Administrator request-detail evidence MUST reuse customer-detail semantic
  treatments: neutral original reason, red/error rejection reason, informational approved
  instructions and green/success received confirmation. All five states MUST retain
  explicit text labels, appropriate actions, readable full-width panels and existing
  lifecycle meaning. Color alone MUST NOT communicate an outcome.

### State Transitions

| Current state | Action and actor | Next state | Quantity effect | History event |
| --- | --- | --- | --- | --- |
| No request | Customer creates valid request | Pending review | Commit selected units | Created |
| Pending review | Administrator approves | Approved — awaiting pickup | Keep committed | Approved |
| Pending review | Administrator rejects with reason | Rejected | Release committed units | Rejected |
| Pending review | Customer confirms cancellation | Cancelled | Release committed units | Cancelled |
| Approved — awaiting pickup | Administrator confirms fictitious receipt | Return received | Keep committed | Received |

All other transitions are prohibited. There is no automatic pickup, receipt, or refund
transition. Receipt does not require waiting three business days; the pickup wording
is illustrative instruction, not a real schedule or time gate.

### Scope Boundaries

The nine user-provided capabilities form this single MVP feature. Eligibility is a
shared business rule exercised by order inspection, creation, and policy changes.

The MVP excludes registration, real authentication and role permissions, new orders or
purchases, checkout, payments, monetary refunds (including after receipt), merchant or
carrier integrations, real pickup, labels, tracking, email, SMS, external notifications,
catalog editing, inventory management, advanced catalog search, photo or evidence
attachments, partial approval, request editing, cancellation after approval, per-product,
per-category or per-customer policies, multiple merchants, financial reporting, and
advanced analytics. Demo isolation is required despite the absence of real accounts.

### Key Entities *(include if feature involves data)*

- **Demonstration environment**: A visitor's independent, temporary collection of
  customers, orders, return requests, settings, and history; has a lifecycle and reset boundary.
- **Fictitious customer**: A selectable demonstration profile with associated orders
  and requests within an environment, never a real person's data.
- **Product**: One of ten fixed fictitious technology products, identified by identifier
  and SKU, with descriptive content, category, USD price, and image.
- **Order**: A preexisting fictitious purchase associated with a customer and environment,
  with identifier, order date, status, delivery date when applicable, and order items.
- **Order item**: A product purchased in a particular order, its purchase unit price,
  and purchased quantity; the boundary for committed and available units.
- **Return request**: An identified request for one order, with selected items and
  quantities, customer reason, creation date, current state, and any rejection reason.
- **Return item**: An association between a request and an order item with a positive
  integer requested quantity.
- **Return policy**: The single positive-integer calendar-day window for an environment,
  initially 30 days, applied to new request evaluations.
- **History event**: An uneditable lifecycle record for a request, with timestamp,
  event type, demonstration actor, and rejection explanation when applicable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh demonstration exposes exactly ten complete product records, at
  least two selectable fictitious customers, and order examples covering eligible,
  expired, non-delivered, and fully committed situations during a demonstration run.
- **SC-002**: Every valid full or partial request scenario yields one identified pending
  request and one creation event; every invalid scenario yields zero domain changes.
- **SC-003**: Across at least 20 simultaneous attempts competing for an order item's
  final available units, total committed units never exceed purchased units.
- **SC-004**: All four allowed state transitions succeed from their stated source
  states; every other attempted transition fails without changing state or history.
- **SC-005**: Every successful lifecycle operation has exactly one attributable event,
  and 100% of inspected requests have a state consistent with their event sequence.
- **SC-006**: In a demonstration with two visitors and two customer profiles each,
  no visitor can inspect or change the other's data; customer views show zero requests
  belonging to another selected profile. In two tabs of the same environment, selecting
  different views or customers MUST preserve each tab's selection; a request created
  in the customer tab MUST be reviewable in the administrator tab, and approval MUST
  appear when the customer detail is refreshed.
- **SC-007**: Each confirmed reset restores initial orders and the 30-day policy,
  removes all generated requests and history only in that environment, and rejects
  operations based on its pre-reset data.
- **SC-008**: A policy update changes eligibility for new submissions at its date
  boundary while preserving 100% of preexisting requests, decisions, and history.
- **SC-009**: A reviewer can complete creation, approval, instruction lookup, receipt,
  and customer history lookup end to end in one public demonstration; separate runs
  also complete rejection, cancellation, policy change, and reset.
- **SC-010**: All primary journeys are usable at 360-pixel and 1280-pixel viewport widths
  without losing controls or information, and can be completed using a keyboard.
- **SC-011**: Every approved request displays the three-business-day fictional pickup
  explanation and no-real-carrier/no-refund notices; no test operation triggers an
  external financial, logistics, or notification action.
- **SC-012**: Attempts beyond each defined anonymous-write allowance produce an
  understandable retry message and zero domain changes; confirmed reset does not
  allow the same visitor to bypass the limit.

- **SC-013**: A visitor-initiated screen view before expiry restarts the shared 168-hour
  inactivity window. Background-only activity does not extend it. At the exact expiry
  boundary and afterward, reads and writes in every tab are blocked with an explanation
  and an option to start fresh, without silently resetting or exposing expired data.

- **SC-014**: Every customer and administrator screen, system message, instruction,
  and seeded product description or reason is in English. USD prices and the configured
  calendar rules remain intact, and visitor-entered free text is displayed as entered.

- **SC-016**: Landing and all inventoried workspace destinations, including direct links,
  show one Demo identifier; the global warning strip and all three retired strings are
  absent. Routine identity/navigation/order-price notes contain zero generic financial
  or logistics disclaimers.
- **SC-017**: Pending-admin, approved-customer, approved-admin and received detail scenarios
  retain 100% of applicable baseline boundary information without opening help, with at
  most one boundary block per action/detail region.
- **SC-018**: The communication journey completes at 360/1280px in light/dark appearance
  without lost controls, clipped text, horizontal overflow or additional acknowledgement;
  reset/expiry remain clear and the lifecycle is unchanged.
- **SC-019**: Landing and nested customer/admin routes deliver valid icon resources with
  correct image types and no missing/conflicting icon links. The identity is visually
  recognizable at 16/32px in light/dark browser appearance.
- **SC-020**: Across all five states, both views show corresponding reason/outcome surfaces
  with consistent semantic treatment and explicit labels. Multiline/long-text examples at
  360/1280px in both themes have no clipped headings or horizontal overflow, and normal
  text contrast meets the existing 4.5:1 target.

## Assumptions

- This specification expands the owner's MVP scope within constitution v1.0.0;
  simulated receipt is an administrative record, not reverse-logistics management.
- All project records remain in English. Currency is USD; translation support is not
  part of this MVP. The confirmed application language is also English, including
  interface text, messages, instructions, product content, and seeded textual reasons.
  This language choice does not restrict or translate visitor-entered free text.
- Calendar dates use America/Bogota. Delivery is day zero; a window of N days permits
  creation through the end of delivery date plus N calendar days. Business days in
  illustrative instructions mean Monday through Friday, without holiday calculations.
- The confirmed inactivity policy is seven full days renewed by visitor-initiated
  browsing and operations, excluding background updates. The limits of 60 state-changing
  attempts per minute and five resets per hour remain initial demo defaults because
  the input specifies no numerical write limits.
  Read-only browsing does not consume write allowances. Creation of environments is
  additionally limited to 10 attempts per hour per anonymous visitor context; these
  allowances are independent, and rejected attempts count toward their applicable limit.
- Visitor continuity is scoped to the same browser context. Sharing a browser context
  shares persisted demonstration data, while each tab has its own selected view and
  customer. Cross-device recovery and real user identity are out of scope.
  Selecting a fictitious role does not grant access to another environment.
- A submission retry represents the same operation. Intentionally beginning another
  request represents a new operation and is permitted for remaining eligible units.
- Initial data includes at least two fictitious customers, a customer/order combination
  with multiple quantities and multiple items, a recent delivered order, an expired
  delivered order, and a non-delivered order. Fully committed and lifecycle examples
  can be produced through the demonstrated flows; reset restores no generated requests.
- Reset restores the same catalog and purchase scenarios with delivery dates relative
  to the new demonstration start, so at least one eligible order remains available.
- The demonstration retains its data until reset or expiry. After expiration, old data
  cannot be recovered through the application; no promise of permanent retention is made.
- The finite creation allowance is a per-visitor limit, not an unbounded public resource
  guarantee. Operational capacity must be bounded during planning without changing the
  specified customer journeys or weakening isolation.
- Dependencies are the approved project constitution and complete fictitious initial
  product, customer, and order content. No merchant, payment, carrier, or messaging
  service is required. Technical choices belong to the implementation plan.

## Approved UI revision — Clarity (2026-10-21)

The owner selected alternative A, Clarity, during the UI prototype review. The retired
comparison remains in Git history; this specification and the UI contract define the
approved interface. This supersedes the
initial Order workspace visual implementation. Customer purchases use a persistent
order navigator and a stable detail panel without a second identical desktop screen.
Order selection reuses the loaded bounded order page; request status filters operate
on loaded data without replacing the workspace with loading placeholders. Additional
pages and explicit refresh remain server-backed, and all writes revalidate eligibility.

- Light and dark appearance are available throughout the app. Initially follow the system;
  an explicit selection persists in this browser and does not change demo ownership.
- The logo title and subtitle align left. Short hero support text and return-window copy
  use their available container width rather than arbitrary character-width limits.
- Orders emphasize purchased products and quantities. A restrained, clearly labeled
  Request return action stays visible when eligible, with availability explained in the form.
- Role controls occupy fixed header slots. The customer selector is a styled, keyboard
  operable picker; changing role or customer retains stable control positions.
- Demo settings retains the role and customer context in the URL, including after reset.
- The administrator Requests badge reports the actual environment-wide Pending count,
  independently of the active filter/page; zero is omitted. Decisions and refresh update it.
- Selection controls reserve their size, show each product name once, and use quantity
  steppers. Review includes product images; form/confirmation/settings use centred columns.
- Administrative buttons read Approve request and Reject. The rejection modal has a
  required reason. All modals dismiss on backdrop click and Escape, restore focus, and
  never perform the action on dismissal. In-flight writes cannot be dismissed mid-operation.
- Pointer interaction has no persistent blue outline; keyboard navigation keeps a visible
  accessible focus indicator. Subtle hover feedback and reduced-motion support apply.

### Clarity loading and picker acceptance refinement

Initial loading MUST use skeletons representing the current section’s layout (orders,
request queue/list/detail, return selection, policy and demo settings), with responsive
geometry, meaningful accessible status and light/dark/reduced-motion support. Refresh
with existing data MUST keep that content visible. The unselected customer’s hover
background MUST be lighter than the selected background without fading its text.
Detailed visual rules are maintained in contracts/ui.md; domain rules are unaffected.


## Navigation and action feedback refinement (2026-10-21)

- Without an explicit order selection, select the first displayed order, regardless of return eligibility. Preserve explicit order links.
- Separate the customer reason from approved-return instructions with spacing, a distinct panel and a subordinate heading. The Back to requests link uses the same icon and treatment as Back to order.
- Mark Demo settings as the current sidebar destination in both role views. Reset copy says “Restore the 30-day return window.”
- Every API action button reserves space for idle and busy content, prevents duplicate clicks, and displays a spinner while awaiting the response. Refresh includes the shared refresh icon and retains loaded content.
- Transient action success/error feedback uses stacked, theme-aware, accessible toasts outside the content flow. Each notification auto-dismisses after five seconds, offers manual dismissal and pauses its timer during hover or keyboard interaction. Notifications remain visible and usable in dialogs and across navigation. Field validation, recorded reasons and blocking page-recovery information retain their contextual presentation.


## Approved return-guide addition (2026-10-21)

Alternative A — Flow map is approved for application implementation at `/demo/guide`.
The guide is shared by both roles and accessible from the workspace navigation. Its
cancel transition has a dedicated connector row below the alternative-state cards;
“Customer cancels · pending only” must never overlap Rejected or another state. Short
Approve/Receive/Reject labels have their own connector space. At narrow content widths,
use a vertical route with explicit alternative-outcome/source labels rather than tiny,
scaled text or horizontal scrolling. State descriptions remain educational controls,
not controls that create or change real demonstration requests.

- **SC-015**: A visitor can open the guide in either role, understand all five states and
  four transitions, select each state by keyboard, retain role/profile context, and read
  all connector labels without card overlap or clipping at mobile and desktop widths.


## Interface communication and detail refinement (2026-10-22)

User Stories 10–12, FR-042–047 and SC-016–020 refine the existing MVP interface.
They supersede older generic disclaimer placement and request-evidence styling only.
No domain entity, state transition, API, schema, migration, role authorization or real
financial/logistics operation is added. Preserve the approved Clarity identity, USD
amounts, stored content and existing domain rules. Standalone personal learning material
is excluded from version control; the shared SDD runbook remains project documentation.
