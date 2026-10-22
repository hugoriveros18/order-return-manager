# UI Contract: Clarity

Approved revision on 2026-10-21: alternative A in design/ui-review. The revision below
supersedes conflicting visual/layout requirements in the original contract retained below.

Light tokens: canvas #F3F6FA, surface #FFFFFF, ink #20374C, primary #245C99, muted
#566A7C, soft #E7EFF8. Dark tokens: canvas #101923, surface #182432, ink #E6EDF5,
primary #94BFF5, muted #B1C0D0, soft #23364D. Use IBM Plex Sans and explicit status text.

Persistent customer order navigator; local selection changes the detail in place. Read-only
purchase lines show purchased quantity and USD price. A neutral secondary Request return
action belongs in a separated Order options footer, with an unrestricted short deadline.
The customer selector is a custom accessible listbox with a fixed-width profile slot beside
a fixed role switch. Settings URLs carry view/customer. A theme toggle follows system
until explicitly selected, persists locally, and works on landing/forms/modals. Keyboard
focus is visible; pointer focus does not add a ring. Brand text is left aligned.

Forms use fixed-size quantity slots and a centred 880px flow, pictured review and a
centred confirmation. Reject opens a modal with a required reason. All modals support
Escape, focus containment/return and backdrop dismissal unless a write is in flight.
Requests shows a real Pending badge from a scoped server count. Loaded-page filters
are instant, preserve the evidence panel after a decision and never hide unloaded results:
load further pages as needed, retaining loaded pages. Reset restores six seeded requests.

## Layout and interaction

The landing uses the Clarity split hero, a pictured sample purchase and three concise
feature explanations. Brand title/subtitle align left. Hero support copy uses the full
column width; it wraps naturally on small screens without forced sentence breaks.

Desktop pairs a narrow navigation rail, a persistent order chooser and a purchase sheet.
The sheet shows purchased quantities and original prices; return availability/committed
units belong to the return selection form. Mobile uses a compact chooser above the sheet.
Selecting an order updates the URL and detail without reloading the list or changing the
header position. Direct order links continue to work. A separate centred return form and
review retain draft values. Quantity controls reserve their dimensions when selected.

Admin review pairs a filtered queue and request evidence/history. Filters reuse loaded
pages; pagination remains explicit. Preserve the selected evidence after a decision even
if the request no longer matches the queue filter. Refresh retains the current content
until the server responds. The Pending badge uses an exact server count across pages.

Role and customer context is tab-local. Settings URLs include view/customer, and reset
restores that role and the same fictional profile using its new resource identifier.
Appearance is a browser preference, independent of capabilities or demo reset.

## Accessibility and modal behaviour

Use labeled controls, semantic headings and visible keyboard focus. The customer picker
supports Arrow keys, Home/End, Enter/Space, Escape and outside-click dismissal. Preserve
accessible names for icon-only mobile navigation and theme controls. Every modal uses
a dialog with focus containment/return, Escape and backdrop dismissal. Dismissal changes
no domain state; an in-flight operation keeps its modal until its result is known.
Rejection requires nonblank text and a visible required marker. Cancellation and reset
retain explicit confirmation. Hover feedback never changes component dimensions.
Both themes retain status text and readable contrast; respect reduced motion.

## Domain and demonstration boundaries

Use the canonical five states and four allowed transitions. Customer/admin decisions
remain whole-request operations. Approved instructions explain packing and simulated
pickup within three business days, no real carrier, no actual refund or physical receipt
on approval. Received confirms a simulation and no monetary refund. Terminal states
expose no transition controls. History is immutable, ordered and attributable.

Expiry requires explicit recovery rather than a silent reset. Reset restores orders,
policy and the six-example baseline, removes visitor-generated changes, and leaves other
visitors untouched. Server checks remain authoritative for scope, expiry, quantities and
state even when the UI reuses loaded data. English system copy and exact USD prices apply.

## Loading and customer-picker refinement (2026-10-21)

Initial data loading uses section-specific, noninteractive skeletons for the order navigator
and purchase sheet, administrator queue and evidence, customer return list/detail, return
selection form, policy form and demo settings. Match their real container widths, columns,
image/row areas, headers and action regions at desktop/mobile breakpoints. A detail-only
load must preserve its already-loaded surrounding list. Cached refresh keeps real content
visible rather than replacing it with a skeleton. Skeletons support both themes, announce
one meaningful loading status, hide decorative blocks from assistive technology and use
no motion when reduced motion is preferred. They approximate structure rather than promise
zero layout shift for unknown data lengths.

The active customer option keeps its full soft background. Hovering an unselected option
uses the same tint at 45% opacity, preserving readable text and its selection checkmark.
Keyboard focus remains visible independently of hover and selection.


## Navigation and action feedback refinement (2026-10-21)

- Without an explicit order selection, select the first displayed order, regardless of return eligibility. Preserve explicit order links.
- Separate the customer reason from approved-return instructions with spacing, a distinct panel and a subordinate heading. The Back to requests link uses the same icon and treatment as Back to order.
- Mark Demo settings as the current sidebar destination in both role views. Reset copy says “Restore the 30-day return window.”
- Every API action button reserves space for idle and busy content, prevents duplicate clicks, and displays a spinner while awaiting the response. Refresh includes the shared refresh icon and retains loaded content.
- Transient action success/error feedback uses stacked, theme-aware, accessible toasts outside the content flow. Each notification auto-dismisses after five seconds, offers manual dismissal and pauses its timer during hover or keyboard interaction. Notifications remain visible and usable in dialogs and across navigation. Field validation, recorded reasons and blocking page-recovery information retain their contextual presentation.


## Detail alignment and copy polish (2026-10-21)

Customer return-detail reason panels occupy the same content width as rejection and
status-instruction panels in every request state, including narrow screens. Section
refresh buttons use the shared label “Refresh”. Order totals use “1 item” for one
purchased unit and “N items” for other totals; quantities and monetary totals are unchanged.


## Notification placement refinement (2026-10-21)

Use bottom-right placement for the stacked notification viewport, respecting safe-area
insets on narrow screens. Keep manual dismissal, five-second expiry and hover/focus
pause. A notification can temporarily cover underlying content on a small viewport;
it can be dismissed or allowed to expire. The earlier top placement came from an
immediate repeat-save test at 360px, not from a general requirement for all screens.


## Approved How returns work guide — alternative A

Route: `/demo/guide?view=customer|admin&customer=<id>`. Reuse WorkspaceShell and its
current role/profile/theme. Expose a selected, accessibly named navigation link in both
views; preserve the guide route when switching roles or customer profiles. Demo settings
is selected only on its own route.

Use the approved five-state overview with optional state details. HTML connector labels
occupy separate layout areas: Approve and Receive between upper cards, Reject between
the pending branch and rejection, and Customer cancels · pending only in a dedicated
lower row below Rejected/Cancelled. Card height is content-driven. Labels do not scale
with an SVG, clip, intersect cards or depend on hover for their full wording. A narrow
container uses a vertical main route and explicitly labeled pending-only alternatives.

Selection is keyboard-operable, exposes pressed state and updates one persistent polite
live region. Reuse canonical status labels and icons. Provide short eligibility,
quantity and simulation explanations plus an expandable two-purchased/one-committed
example. No guide interaction writes domain data. Use semantic theme colors and respect
reduced motion. Preview selectors and design-rationale notes are not application content.
