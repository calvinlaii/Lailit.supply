---
phase: 4
slug: 04-payments-webhooks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

> **MIGRATION NOTE 2026-05-13:** This plan was written against Supabase Postgres + `@supabase/ssr`. The project has since migrated to **Cloudflare D1 + Drizzle ORM** (schema in `src/lib/db/schema.ts`, migrations in `drizzle/migrations/`, DB binding `env.DB` via `getCloudflareContext()`). Auth is **Clerk** (`@clerk/nextjs`), not Supabase magic-link. Re-run `/gsd-plan-phase 4` before executing.


# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green + `next build` passes + webhook smoke test
- **Max feedback latency:** ~8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | PAY-01 | — | DB migration creates `membership_tier`, `membership_status`, `membership_expires_at`, `lifetime_purchased`, `mayar_member_id` cols on `users`; `webhook_events` table with `mayar_event_id UNIQUE NOT NULL` | build | `npx next build` | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | PAY-03 | T-4-01 | Invalid token → 401 before body parse; no database writes on 401 | unit | `npx vitest run src/__tests__/webhook.test.ts -t "token"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | PAY-02, PAY-03 | T-4-01 | Cross-verify returns 400 if Mayar API 404; unique violation on `mayar_event_id` returns 200 with no side effects | unit | `npx vitest run src/__tests__/webhook.test.ts -t "idempotency\|cross-verify"` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | PAY-04, AUTH-05 | — | `membership.newMemberRegistered` creates Supabase user + inserts `webhook_events` row with `processed_at` set | unit | `npx vitest run src/__tests__/webhook.test.ts -t "newMember"` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | PAY-05, PAY-06 | — | `payment.received` extends `membership_expires_at`; `memberUnsubscribed` sets status `canceled` but does NOT clear `membership_expires_at` | unit | `npx vitest run src/__tests__/webhook.test.ts -t "renewal\|cancel"` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | PAY-07, PAY-08 | — | `memberExpired` sets status `expired`; lifetime purchaser has `lifetime_purchased=true` and `membership_expires_at=null` | unit | `npx vitest run src/__tests__/webhook.test.ts -t "expired\|lifetime"` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | EMAIL-01 | — | WelcomeEmail renders without errors; subject is "Selamat datang di lailit.supply 🎉"; contains "Masuk ke Dashboard" text | unit | `npx vitest run src/__tests__/email.test.ts` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 3 | PAY-01, PAY-02 | — | Pricing CTAs have `href` pointing to `NEXT_PUBLIC_MAYAR_MONTHLY_URL` / `NEXT_PUBLIC_MAYAR_LIFETIME_URL` env vars | build | `npx next build` | N/A | ⬜ pending |
| 04-06-01 | 06 | 3 | ACCT-01, ACCT-02 | — | `/account` page renders within `(dashboard)` group; shows plan, status badge, expiry; "Kelola Langganan" links to `MAYAR_CUSTOMER_PORTAL_URL` | smoke (manual) | `curl -H "Cookie: ..." http://localhost:3000/account` | N/A | ⬜ pending |
| 04-07-01 | 07 | 4 | All | All | `next build` exit 0; `npx vitest run` green; webhook idempotency verified end-to-end | build | `npx next build && npx vitest run --reporter=verbose` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/webhook.test.ts` — stubs for PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08 (token validation, idempotency, cross-verify mock, event handlers)
- [ ] `src/__tests__/email.test.ts` — stubs for EMAIL-01 (WelcomeEmail render test)
- [ ] Mocked `@supabase/supabase-js` admin client for auth.admin.createUser + generateLink
- [ ] Mocked `resend` for emails.send

*Wave 0 is embedded in Plan 04-01 (DB schema + webhook route stub).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pricing CTA links open Mayar checkout | PAY-01 | External URL, browser flow | Open `/pricing` in browser, click "Berlangganan Bulanan" → should navigate to Mayar hosted checkout |
| Welcome email received after checkout | EMAIL-01 | Full e2e requires Mayar sandbox | Trigger `membership.newMemberRegistered` via curl against local webhook endpoint; check Resend dashboard |
| Magic link in welcome email logs in | AUTH-05 | Browser session flow | Click magic link from email → should land on `/dashboard` authenticated |
| Account page shows correct membership data | ACCT-01 | Browser rendering | Log in, visit `/account`, verify tier/status/expiry match DB row |
| "Kelola Langganan" button opens Customer Portal | ACCT-02 | External URL | Click button on `/account`, verify navigates to Mayar Customer Portal |
| Replay webhook idempotency (end-to-end) | PAY-03 | Requires live Supabase | POST same payload twice to `/api/webhooks/mayar?token=...`, verify `webhook_events` has exactly one row |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
