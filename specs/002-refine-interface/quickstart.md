# Validation Guide: Interface Refinement

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
