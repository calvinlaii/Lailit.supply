---
phase: 04-payments-webhooks
plan: "01"
subsystem: payments-schema-and-tests
tags: [migration, sql, supabase, vitest, webhook, tdd-wave-0]
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/20260507000000_phase4_payments.sql
    - src/__tests__/webhook.test.ts
    - src/__tests__/email.test.ts
    - src/components/marketing/__tests__/pricing-card.test.tsx
    - src/app/(dashboard)/account/__tests__/page.test.tsx
    - src/app/api/webhooks/mayar/route.ts (stub)
  affects:
    - Plans 02, 03, 04 (tests must go GREEN when implementation lands)
tech_stack:
  added: []
  patterns:
    - Wave 0 Nyquist contract — test scaffolds before implementation
    - Idempotency-first webhook design (INSERT before dispatch)
    - 3-layer webhook defense: URL token + cross-verify + idempotency ledger
key_files:
  created:
    - supabase/migrations/20260507000000_phase4_payments.sql
    - src/__tests__/webhook.test.ts
    - src/__tests__/email.test.ts
    - src/components/marketing/__tests__/pricing-card.test.tsx
    - src/app/(dashboard)/account/__tests__/page.test.tsx
    - src/app/api/webhooks/mayar/route.ts
  modified: []
decisions:
  - D-09 honored: 5 membership columns on public.users (membership_tier, membership_status, membership_expires_at, lifetime_purchased, mayar_member_id)
  - D-10 honored: webhook_events table with mayar_event_id UNIQUE NOT NULL
  - D-11 honored: migration file under supabase/migrations/
  - Wave 0 stub route created to satisfy test exit-0 requirement while plans are pending
metrics:
  duration: "~15 minutes"
  completed: "2026-05-07"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 0
---

> **MIGRATION NOTE 2026-05-13:** This plan was written against Supabase Postgres + `@supabase/ssr`. The project has since migrated to **Cloudflare D1 + Drizzle ORM** (schema in `src/lib/db/schema.ts`, migrations in `drizzle/migrations/`, DB binding `env.DB` via `getCloudflareContext()`). Auth is **Clerk** (`@clerk/nextjs`), not Supabase magic-link. Re-run `/gsd-plan-phase 4` before executing.


# Phase 4 Plan 01: Wave 0 Schema Migration and Test Scaffolds Summary

**One-liner:** Postgres migration for membership schema (5 columns + webhook_events idempotency ledger) and Wave 0 test contracts covering token validation, cross-verify, and idempotency behaviors.

## What Was Built

### Task 1: Phase 4 SQL Migration

`supabase/migrations/20260507000000_phase4_payments.sql` creates:

- `public.users` table with `id uuid FK → auth.users`, `email`, plus 5 membership columns (D-09): `membership_tier text CHECK`, `membership_status text CHECK`, `membership_expires_at timestamptz`, `lifetime_purchased boolean NOT NULL DEFAULT false`, `mayar_member_id text`
- RLS enabled on `public.users` with read-own-row policy (`auth.uid() = id`) and service-role-write policy
- `handle_new_auth_user()` trigger that auto-inserts into `public.users` on `auth.users` INSERT
- `public.webhook_events` table with `mayar_event_id text UNIQUE NOT NULL` (D-10 idempotency ledger)
- Migration uses `CREATE TABLE IF NOT EXISTS` for safe re-runs (Pattern 7)

### Task 2: Wave 0 Test Scaffolds

Four test files establishing the Nyquist contract:

- `src/__tests__/webhook.test.ts`: 6 concrete passing tests for token validation (PAY-04, T-4-01), cross-verify (PAY-09), and idempotency (PAY-08); 11 todo stubs for all event handler behaviors
- `src/__tests__/email.test.ts`: 8 todo stubs for WelcomeEmail render (EMAIL-01)
- `src/components/marketing/__tests__/pricing-card.test.tsx`: 6 todo stubs for PricingCard CTA env var behavior (PAY-01, PAY-02)
- `src/app/(dashboard)/account/__tests__/page.test.tsx`: 9 todo stubs for account page rendering (ACCT-01, ACCT-02)

Plus: `src/app/api/webhooks/mayar/route.ts` stub implementing the 3 security layers (needed for concrete tests to pass).

## Test Results

```
Test Files  1 passed | 3 skipped (4)
Tests       6 passed | 34 todo (40)
Exit code   0
```

All 6 concrete webhook tests pass. All 34 todo stubs are pending (not erroring). `npx vitest run` exits 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Created stub route to satisfy exits-0 acceptance criterion**

- **Found during:** Task 2 verification
- **Issue:** The plan spec includes 6 concrete non-todo tests in `webhook.test.ts` that dynamically import `@/app/api/webhooks/mayar/route`. The plan also requires `npm test exits 0`. Without the route file, vitest fails with a module resolution error (not a test assertion failure), causing exit non-zero. The plan's must_haves.truths states "npm test passes (stubs are skipped/pending, not erroring)" — the module resolution error counts as "erroring."
- **Fix:** Created `src/app/api/webhooks/mayar/route.ts` implementing only the 3 security layers (token check, cross-verify, idempotency) needed for the 6 concrete tests to pass. Event dispatch is stubbed with a TODO comment for Plan 03.
- **Files modified:** `src/app/api/webhooks/mayar/route.ts` (created)
- **Commit:** `1bdf0d9`

### Worktree Execution Notes

This plan ran as a parallel agent in git worktree `agent-aad3872c` (branch `worktree-agent-aad3872c`). Files were created in the worktree directory. Tests were run via the root project's vitest binary from the worktree CWD to resolve the `@/` path alias correctly.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `e2a4b0f` | chore(04-01): Phase 4 Postgres migration |
| Task 2 | `1bdf0d9` | test(04-01): Wave 0 test scaffolds + webhook stub |

## Known Stubs

| File | Description |
|------|-------------|
| `src/app/api/webhooks/mayar/route.ts` | Event dispatch section has TODO comment; `membership.newMemberRegistered`, `payment.received`, and all other event handlers not implemented — deferred to Plan 03 |
| All `it.todo` tests | 34 pending stubs across 4 test files; will be implemented in Plans 02, 03, 04 |

## Self-Check: PASSED

- `supabase/migrations/20260507000000_phase4_payments.sql` — FOUND
- `src/__tests__/webhook.test.ts` — FOUND
- `src/__tests__/email.test.ts` — FOUND
- `src/components/marketing/__tests__/pricing-card.test.tsx` — FOUND
- `src/app/(dashboard)/account/__tests__/page.test.tsx` — FOUND
- `src/app/api/webhooks/mayar/route.ts` — FOUND
- Commit `e2a4b0f` — FOUND
- Commit `1bdf0d9` — FOUND
- `npx vitest run` — exits 0
