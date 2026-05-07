---
phase: 04-payments-webhooks
plan: 02
subsystem: email
tags: [email, react-email, resend, bahasa-indonesia, tdd]
dependency_graph:
  requires: []
  provides: [WelcomeEmail, email-deps-installed, phase4-env-vars-documented]
  affects: [04-03-PLAN.md]
tech_stack:
  added: [resend@6.12.3, "@react-email/components@1.0.12", react-email@6.1.1]
  patterns: [react-email-function-call, inline-styles-only, named-export, tdd-red-green]
key_files:
  created:
    - src/emails/WelcomeEmail.tsx
    - src/__tests__/email.test.ts
  modified:
    - package.json
    - package-lock.json
    - .env.local.example
decisions:
  - "WelcomeEmail uses @react-email/components primitives with inline styles only — no Tailwind className, no cn()/clsx"
  - "Named export (not default) matching project component conventions"
  - "Conditional greeting: name ? 'Hei {name}! 👋' : 'Hei! 👋' — handles empty string from Mayar payload"
  - "Plan-specific copy uses plan === 'Bulanan' branch — maps cleanly to WelcomeEmailProps union type"
  - "TDD RED/GREEN/REFACTOR: tests written first, then implementation, all 7 tests green"
metrics:
  duration: "2 minutes"
  completed: "2026-05-07"
  tasks_completed: 2
  files_modified: 5
requirements_covered:
  - EMAIL-01
---

# Phase 4 Plan 02: Email Dependencies & WelcomeEmail Template Summary

**One-liner:** Resend + React Email installed; Bahasa Indonesia WelcomeEmail template with conditional name greeting, plan copy, magic link CTA, and disclaimer — all 7 TDD tests green.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install email dependencies and update .env.local.example | 2b88267 | package.json, .env.local.example |
| 2 (RED) | Failing tests for WelcomeEmail | 8a82f0f | src/__tests__/email.test.ts |
| 2 (GREEN) | WelcomeEmail React Email template | 7c6a08b | src/emails/WelcomeEmail.tsx |

## What Was Built

### Task 1 — Email Dependencies + Env Vars

Installed three packages at their verified versions:
- `resend@6.12.3` — Transactional email delivery SDK
- `@react-email/components@1.0.12` — Email-safe React primitives
- `react-email@6.1.1` — Render + preview tooling

Updated `.env.local.example` with a Phase 4 section documenting all 6 new environment variables required by this phase:
- `NEXT_PUBLIC_MAYAR_MONTHLY_URL` and `NEXT_PUBLIC_MAYAR_LIFETIME_URL` (checkout links)
- `MAYAR_API_KEY`, `MAYAR_WEBHOOK_TOKEN`, `MAYAR_CUSTOMER_PORTAL_URL` (server secrets)
- `RESEND_API_KEY` (Resend delivery)

### Task 2 — WelcomeEmail Template (TDD)

**RED:** Created `src/__tests__/email.test.ts` with 7 failing tests covering all `<behavior>` items from the plan. Tests confirmed failing before any implementation.

**GREEN:** Created `src/emails/WelcomeEmail.tsx` implementing:
- `WelcomeEmailProps` interface: `name: string`, `magicLink: string`, `plan: 'Bulanan' | 'Seumur Hidup'`
- Conditional greeting: `name ? 'Hei ${name}! 👋' : 'Hei! 👋'`
- Plan-specific body copy in Bahasa Indonesia
- `Button` with `href={magicLink}` and label "Masuk ke Dashboard"
- Disclaimer: "Link ini berlaku untuk sekali login."
- All `@react-email/components` primitives, no `className`, no Tailwind

## TDD Gate Compliance

- RED gate commit: `8a82f0f` — `test(04-02): add failing tests for WelcomeEmail component`
- GREEN gate commit: `7c6a08b` — `feat(04-02): implement WelcomeEmail React Email template in Bahasa Indonesia`
- REFACTOR gate: Not needed — implementation was clean on first pass

## Deviations from Plan

### Auto-added: Test file creation

**Found during:** Task 2 (TDD RED phase)
**Issue:** The plan referenced `src/__tests__/email.test.ts` as "the test stubs this task must make green" but this file did not exist in the repository.
**Fix:** Created the test file with all 7 concrete test assertions from the plan's `<behavior>` block (no `.todo` stubs — all behaviors were immediately testable).
**Files modified:** `src/__tests__/email.test.ts` (created)
**Rule applied:** Rule 3 (auto-fix blocking issue) — test file was required for TDD RED gate

## Threat Flags

None. `WelcomeEmail` is a pure render function — no network calls, no env var access, no authentication paths. `RESEND_API_KEY` is documented in `.env.local.example` without `NEXT_PUBLIC_` prefix (server-only, as required by T-4-05 mitigation).

## Known Stubs

None. The WelcomeEmail component renders real content from its props. All props flow to visible output (greeting, plan text, magic link href, disclaimer). The `.env.local.example` placeholder values (e.g., `https://mayar.id/checkout/...`) are documentation stubs, not runtime stubs — the component itself has no stubs.

## Self-Check: PASSED

- `src/emails/WelcomeEmail.tsx` — FOUND
- `src/__tests__/email.test.ts` — FOUND
- Commit `2b88267` — FOUND
- Commit `8a82f0f` — FOUND
- Commit `7c6a08b` — FOUND
- `npx vitest run src/__tests__/email.test.ts` — 7/7 passing
- `grep -c className src/emails/WelcomeEmail.tsx` — 0 (no Tailwind in template)
- `.env.local.example` contains `MAYAR_WEBHOOK_TOKEN=` — VERIFIED
