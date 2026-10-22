# Research: Interface Refinement

## Communication

Decision: one Demo identifier, task-focused ordinary copy, one boundary block where
approval/receipt matters, and a concise general guide explanation. Alternatives rejected:
retaining the noisy global warning, hiding all consequences in help, or adding a
first-visit acknowledgement. Existing constitutional constraints settle this tradeoff.
The previous UI/UX skill searches did not find a verified copy-specific match; this
placement policy is project-specific editorial judgment, not an attributed search result.

## Favicon

Decision: simplify the existing Brand parcel-and-return-arrow into a root SVG icon and
raster ICO fallback, preserving brand colors and small-size clarity. Installed Next.js
16.4.2 docs confirm src/app/icon.svg and root favicon.ico conventions generate icon links.
Alternatives rejected: generic stock/emoji icons, full logo text at tiny sizes and a new
raster-generation dependency. No need to change the in-app logo design.

## Semantic request details

Source review: customer rejection uses alert error; admin rejection currently uses neutral
reason-summary. Approved/received customer instructions already have soft/primary and
good styles. Reuse these semantic treatments and spacing; retain a neutral original
reason and prevent cancelled states appearing as successful receipts. Avoid parallel
hardcoded color palettes or rewriting domain state labels.

## Documentation

Existing AGENTS.md defines SDD and points at Spec Kit, but lacked a practical phase/script
map and request template. Add docs/spec-driven-development.md and explicit discovery links.
Use SPECIFY_FEATURE_DIRECTORY for the installed scripts; SPECIFY_FEATURE is not a
replacement for the path override. Keep the educational architecture page under docs/,
with local interactions, no application API calls and verified sources/code references.
