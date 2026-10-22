# Implementation Plan: Interface Refinement

**Date**: 2026-10-22 | **Spec**: [spec.md](spec.md) | **Status**: implemented and locally verified; not deployed

## Summary and technical context

Extend the implemented Clarity interface without altering the MVP domain. Use the
existing strict TypeScript, React/Next.js App Router, Tailwind semantic tokens and
Playwright setup on Node 22.x. No new service, dependency or persisted model is needed.
Source paths and exact copy are in contracts/ui.md. Both themes and 360/1280px apply.

## Constitution Check

Before research and after design: all gates pass by document review. Demo identity and
inline approval/receipt limits preserve Principle I and baseline FR-019/020/041. Scope,
transactions, concurrency, history, anonymous limits and isolation are unchanged.
Accessible labels, reset/expiry information and verification preserve Principle V.
The constitution is read but never edited. This is not executable-test evidence.

## Phase 0 — Research decisions

Reuse the reviewed copy hierarchy from the earlier draft. Reuse the existing Brand
parcel/arrow and customer-detail semantic classes. Use App Router root icon file
conventions verified against installed Next.js documentation. See research.md for
rationale and alternatives. No unresolved research or critical clarification remains.

## Phase 1 — Contracts and model

No data/API changes; data-model.md records the unchanged baseline. contracts/ui.md
contains exact copy, state-to-surface mapping and icon constraints. quickstart.md defines
acceptance checks. The learning page/runbook are docs resources, not application routes.

## Implementation approach

- US1: Brand owns one compact Demo identifier; remove duplicate shell/rail/form warnings.
  Simplify landing, picker, order and settings copy and metadata. Keep fixed header slots,
  skeleton alignment, entered content and approved/received inline boundary information.
- US2: create src/app/icon.svg plus src/app/favicon.ico using a simplified existing
  parcel/return motif. Use built-in file metadata; inspect generated links and resources.
  No image-generation service, icon package, PWA work or full rebranding is necessary.
- US3: reuse error, soft/primary and good surfaces in admin evidence. Prefer existing
  ReturnInstructions/semantic styles; extract a small shared presentation component only
  if actual duplication warrants it. Retain role-specific actions, preserved whitespace,
  original reasons, full-width panels and status-specific notes from US1.
- US1 and US3 both touch admin-review/return-instructions; serialize that work. US2 owns
  icon assets and can proceed independently. Existing Next.js managed rules remain intact.

## Validation and delivery

Use guarded local tests only; no production fixture reset. Run lint/typecheck, targeted
communication/receipt/full-demo/reset-expiry/loading and admin-state browser checks, then
build. Inspect icon MIME/generated metadata and fresh-context requests. Visually review
light/dark, mobile/desktop, long text, direct links and 16/32px icon renderings. Reuse
semantic tests; do not add tests that merely duplicate every approved string.
Record actual evidence in validation.md. All stories ship together after their own
checks pass; baseline T097/T099 remain independent and incomplete until actually verified.
