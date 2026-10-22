# UI Contract: Interface Refinement

Baseline: [Clarity UI](../../001-manage-order-returns/contracts/ui.md).

## Communication refinement

Status: implemented and locally verified; see ../validation.md. This section governs
FR-001–004/SC-001–003 and supersedes older generic warning placement, not domain limits.

### Communication hierarchy

1. Identity: one compact, non-dismissible `Demo` identifier in the shared brand/header
   on the landing and workspace. It is readable text, not a warning banner or toast,
   and remains visible on direct entry and on loading/error/expiry screens.
2. Routine work: short copy about orders, quantities, review and next steps. Remove
   the global demo-notice strip and redundant disclaimer-only rail/form/success notes;
   remove their empty containers/spacing rather than leaving visual gaps.
3. Consequences: one consolidated explanation within each relevant request action/detail
   region. Keep the pending-admin approval explanation before approval, customer approved
   instructions, admin approved receipt explanation and received detail clarification.
   Do not place generic warnings under rejected/cancelled details. Required explanations
   must not depend on a previously visited landing page, a tooltip or an open guide.
4. Help and operations: How returns work contains one short general sample-data/scope
   explanation. Demo settings describes shared-tab operation, reset and inactivity only
   where useful. Keep precise data-loss, confirmation and expiry messages.

### English copy and surface inventory

| Surface / source                                                            | Approved wording or action                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared Brand in src/components/brand.tsx                                    | Keep Order Returns Manager; subtitle `Orders, returns and clear next steps.`; add compact `Demo` identifier, once per page.                                                                                                                                                |
| Landing intro/CTA notes in src/app/page.tsx                                 | One introduction: `Explore orders and returns with sample customers and purchases.`; CTA note `No account needed.`; retain Explore the demo and administrator entry.                                                                                                       |
| Landing footer and preview accessible descriptions                          | Remove the repeated scope footer. Use `Example order` and accurate product illustration names for preview descriptions.                                                                                                                                                    |
| Workspace global notice and rail note in src/components/workspace-shell.tsx | Remove both disclaimer-only blocks. The shared brand supplies Demo identity; Demo settings remains available.                                                                                                                                                              |
| Administrator identity in workspace-shell.tsx                               | `Administrator` with existing contextual subtitle `Your workspace only`; preserve its reserved header dimensions.                                                                                                                                                          |
| Picker in src/components/customer-picker.tsx                                | `Customer` for visible/listbox labels; remove the repeated `Demo profile` option subtitle. Retain each customer name and selection semantics.                                                                                                                              |
| Orders note/empty state in src/components/orders-screen.tsx                 | `Original purchase prices in USD.`; empty state `No orders are available for this customer. Reset the demo to restore the initial orders.`                                                                                                                                 |
| Select/review/success in src/components/return-form.tsx                     | Remove generic selection and success disclaimers. Review note: `An administrator will review your request.` Keep existing progress, cancellation and next-step information. Approval consequences live with approval/detail, not every form step.                          |
| Pending admin action in src/components/admin-review.tsx                     | One note adjacent to Approve: `Approval updates the request status. It does not issue a refund or confirm physical receipt.`                                                                                                                                               |
| Approved customer detail in src/components/return-instructions.tsx          | Keep Prepare your products. One block: `In this demo, pack the selected products for a simulated pickup within the next three business days. No real carrier will be sent. Approval does not issue a refund or confirm physical receipt.`                                  |
| Approved administrator detail in admin-review.tsx                           | One block: `Confirm receipt to complete this demo return. Approval does not issue a refund or confirm physical receipt; receipt confirmation does not issue a refund.` Keep Confirm simulated receipt.                                                                     |
| Received customer/admin detail                                              | Retain the simulation-specific receipt heading/action/history labels. One note: `Receipt is recorded for this demo. No refund has been issued.` The admin view needs a status-specific note rather than an unconditional approval footnote.                                |
| Guide summaries in src/components/return-guide.tsx                          | Approved summary `Your request is approved. Review the next steps.`; received summary `Receipt is confirmed. The return is complete.` The selected state's explanation retains applicable simulation/consequence details.                                                  |
| Guide general scope card                                                    | One consolidated explanation: `This demo uses sample data. Payments, refunds and shipping are not processed.` Remove the extra packing instruction from this general card; the approved-state explanation owns pickup timing/no-carrier details.                           |
| Settings/reset in src/components/demo-reset.tsx                             | `Your workspace`; describe shared customer/admin orders without repeatedly calling them fictional. Use `initial orders and six example returns` and `initial sample data`; preserve tab selection, 168-hour inactivity explanation, exact loss and This cannot be undone.  |
| Head metadata in src/app/layout.tsx                                         | Description `Explore order details, manage returns and follow each request in an interactive demo.`                                                                                                                                                                        |
| Product image alternatives in order-sheet.tsx and return-form.tsx           | Use accurate product illustration descriptions without redundant fictional qualifiers. Existing persisted imageAlt strings need no rewrite: derive an appropriate presentation description from the existing product name. Keep catalog sources and persisted data intact. |

Canonical statuses, history event names, toast state labels and meaningful simulated
receipt wording are not subject to a global find/replace. Any strings discovered during
implementation that are not listed here must be classified under the same four levels.
Do not change stored reasons, errors or deadlines to satisfy a banned-word scan.

### Layout and accessibility acceptance

Reuse Clarity tokens, spacing and components; introduce no new visual direction or
copy framework. Removing a subtitle/banner must not collapse fixed profile slots, move
role tabs horizontally or leave empty reserved banner space. Keep heading hierarchy,
keyboard focus, accessible names, content-aligned skeletons, light/dark contrast and
small-screen wrapping. The Demo identifier must have a readable text alternative and
must never rely on color, hover or an offscreen-only explanation. No persisted notice
preference is introduced.

## Favicon — FR-005 / SC-004

Create a simplified parcel-and-return-arrow mark derived from the existing Brand SVG.
Use the established blue/navy palette on a self-contained contrasting background. No
letters, tiny text, emoji, stock icon, external image request or new brand direction.
Ensure legibility at 16/32px in light/dark browser chrome. Implement through App Router
root metadata conventions: src/app/icon.svg plus a raster src/app/favicon.ico fallback
with 16/32/48px entries. Next.js should generate icon links; avoid competing manual
metadata or old default icons. An Apple touch icon/PWA manifest is outside scope.

## Customer/admin detail parity — FR-006 / SC-005

Reuse the current customer detail's semantic surfaces for administrator evidence:

| Region/state               | Treatment in both views                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Customer's original reason | Neutral full-width reason-summary; preserve line breaks and wrap long text.                                               |
| Rejected: rejection reason | Existing error/red-tinted surface and border, explicit Rejection reason heading; distinguish it from the original reason. |
| Approved: next steps       | Existing soft/primary surface, border and heading rhythm used by ReturnInstructions.                                      |
| Received: completion       | Existing good/green surface and border, explicit confirmation text.                                                       |
| Pending / Cancelled        | Retain canonical status badge and neutral evidence; do not invent a rejection or successful receipt panel.                |

Scope includes all five states' evidence readability, not coloring every product row
or changing history event semantics. Preserve canonical status badges and text labels;
color never carries the state alone. Keep the admin queue/evidence layout and role-specific
actions. Do not duplicate customer packing instructions verbatim as administrator actions.
The approved/received contextual copy follows the communication matrix above. Prefer
existing semantic classes/tokens; extract a small shared panel only if it prevents real
duplication. No general-purpose UI framework. Check light/dark, 360/1280px, multiline
reasons, long unbroken input, heading spacing, widths and contrast.
