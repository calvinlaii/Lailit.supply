---
phase: 04-payments-webhooks
created: 2026-05-07
status: ready
---

# Phase 4: Payments & Webhooks — Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire Mayar.id checkout into the existing pricing page CTAs, implement idempotent webhook handlers for the full membership lifecycle (newMemberRegistered → renewed → canceled → expired → lifetime), auto-create Supabase user accounts on first payment, send branded Bahasa Indonesia welcome emails with magic links via Resend + React Email, and expose an authenticated `/account` page showing membership status with a Mayar Customer Portal link.

Requirements in scope: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08, PAY-09, PAY-10, AUTH-05, EMAIL-01, ACCT-01, ACCT-02

</domain>

<decisions>
## Implementation Decisions

### Checkout Flow
- **D-01:** Pricing page CTAs use **static Mayar hosted payment links** — no server-side API call or checkout session creation. Mayar Dashboard → create product/plan → get payment link → hardcode as `href` on the buttons. Monthly link and Lifetime link stored as env vars (`NEXT_PUBLIC_MAYAR_MONTHLY_URL`, `NEXT_PUBLIC_MAYAR_LIFETIME_URL`).
- **D-02:** Both checkout links open in the same tab (not `target="_blank"`) so the back button returns to pricing page if user abandons.

### Webhook Handler
- **D-03:** Webhook endpoint: `POST /api/webhooks/mayar` (file: `src/app/api/webhooks/mayar/route.ts`).
- **D-04:** Security: URL token authentication — Mayar sends to `https://lailit.supply/api/webhooks/mayar?token=MAYAR_WEBHOOK_TOKEN`. Backend validates `searchParams.get('token') === process.env.MAYAR_WEBHOOK_TOKEN` before any processing. Invalid token → `401` immediately.
- **D-05:** Defense layer 2: cross-verify each incoming event against Mayar's "Get Transaction" API (`GET https://api.mayar.id/hl/v1/payment/{id}`) before applying side effects. If Mayar API says the transaction doesn't exist or status mismatches → reject with `400`.
- **D-06:** Defense layer 3: idempotency ledger. `webhook_events` table with `mayar_event_id` (Mayar's `data.id`) as a `UNIQUE` constraint. Process = insert first; if `UNIQUE` violation → already processed → return `200` with no side effects.
- **D-07:** Webhook handler processes these Mayar event types:
  - `membership.newMemberRegistered` → create Supabase user + send welcome email
  - `payment.received` → extend `membership_expires_at`
  - `membership.memberUnsubscribed` → set status `canceled` (access continues until expires_at)
  - `membership.memberExpired` → set status `expired`, revoke access
  - `membership.changeTierMemberRegistered` → update `membership_tier`
- **D-08:** Unknown event types → log and return `200` (don't error — allows Mayar to add events without breaking the handler).

### Database Schema
- **D-09:** Membership fields live directly on the `users` table (no separate `memberships` table for MVP). New columns:
  - `membership_tier: text` — `'monthly' | 'lifetime' | null`
  - `membership_status: text` — `'active' | 'canceled' | 'expired' | null`
  - `membership_expires_at: timestamptz` — null for lifetime, date for monthly
  - `lifetime_purchased: boolean` — default `false`
  - `mayar_member_id: text` — Mayar's member identifier for Customer Portal link resolution
- **D-10:** `webhook_events` table schema:
  - `id: uuid` (PK)
  - `mayar_event_id: text UNIQUE NOT NULL` — idempotency key (Mayar's `data.id`)
  - `event_type: text NOT NULL` — e.g., `'membership.newMemberRegistered'`
  - `payload: jsonb NOT NULL` — raw webhook body
  - `processed_at: timestamptz` — set when processing completes
  - `created_at: timestamptz DEFAULT now()`
- **D-11:** Migration file goes under `supabase/migrations/` (Supabase CLI pattern).

### Welcome Email & Onboarding
- **D-12:** Welcome email is in **Bahasa Indonesia**. Subject: `"Selamat datang di lailit.supply 🎉"`.
- **D-13:** Template built with **React Email** (`@react-email/components`). Located at `src/emails/WelcomeEmail.tsx`. Sent via Resend using `resend.emails.send()`.
- **D-14:** Email CTA: **magic link that logs user straight into the dashboard** — use `supabase.auth.admin.generateLink({ type: 'magiclink', email })` from the admin client to generate the link and include it in the email body. Clicking it lands the user on `/dashboard` already authenticated.
- **D-15:** Email content includes: user's first name (extracted from Mayar payload if available, else just "Hei 👋"), plan name (Monthly/Lifetime), and the magic link button "Masuk ke Dashboard".

### Account Page
- **D-16:** Route: `src/app/(dashboard)/account/page.tsx` — inside the auth-gated `(dashboard)` route group. Inherits existing `(dashboard)` layout (auth check via DAL).
- **D-17:** Page displays: plan name ("Bulanan" / "Seumur Hidup"), status badge ("Aktif" / "Dibatalkan" / "Kedaluwarsa"), `membership_expires_at` formatted as Bahasa Indonesia date (or "Akses Seumur Hidup" for lifetime), and a "Kelola Langganan" button.
- **D-18:** Mayar Customer Portal link: **static URL stored in `MAYAR_CUSTOMER_PORTAL_URL` env var** (from Mayar Dashboard). The "Kelola Langganan" button is a plain `<a href={process.env.MAYAR_CUSTOMER_PORTAL_URL} target="_blank" rel="noopener noreferrer">`. No dynamic API call needed for MVP.

### Claude's Discretion
- Exact Mayar API response shape for "Get Transaction" cross-verify — research what fields to check
- Exact Mayar webhook payload structure for each event type — research before coding handlers
- Whether `users` table extends Supabase `auth.users` via RLS policies or a separate `public.users` table
- DashboardNav update: add "Akun" link to existing nav
- Error handling in webhook handler for Mayar API cross-verify failures (503 vs 400)
- Exact format of Resend API calls (from Resend docs, not training data)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Constraints
- `.planning/ROADMAP.md` §Phase 4 — Goal, success criteria, explicit tech notes (webhook defense, research gaps)
- `.planning/REQUIREMENTS.md` §Payments & Billing (PAY), §Account (ACCT), §Email (EMAIL-01), §Auth (AUTH-05)

### Existing Code Patterns
- `src/lib/dal.ts` — DAL pattern with `server-only` + `cache()` (MUST replicate for any new server data access)
- `src/lib/supabase/server.ts` — Server client factory (use for webhook handler DB calls)
- `src/lib/supabase/admin.ts` — Admin client (needed for `auth.admin.generateLink()` in welcome email flow)
- `src/app/(dashboard)/` — Auth-gated route group (account page goes here, inherits auth layout)
- `src/app/(marketing)/pricing/page.tsx` — Existing pricing page with stubbed CTAs to wire up

### Next.js 16 Docs
- `node_modules/next/dist/docs/` — Read before writing any Next.js code (Route Handlers, async params, etc.)

### External Services
- Mayar API: research `https://api.mayar.id` docs for webhook payload shapes and "Get Transaction" endpoint
- Resend + React Email: research current API for `resend.emails.send()` and `@react-email/components`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/dal.ts` — `getUser()` cache wrapper; Phase 4 needs `getMembership()` or extend `getUser()` to return membership fields
- `src/lib/supabase/admin.ts` — Admin client for `supabase.auth.admin.generateLink()` (welcome email magic link)
- `src/lib/supabase/server.ts` — Per-request server client for all webhook DB writes
- `src/components/ui/` — shadcn/ui Badge, Button, Card for account page UI
- `src/app/(dashboard)/layout.tsx` — Auth gate layout; account page inherits this automatically

### Established Patterns
- `server-only` + `cache()` on every exported server function (dal.ts pattern — MANDATORY)
- Next.js 16 `proxy.ts` protects `(dashboard)` routes (already wired in Phase 2)
- Tailwind v4 `@theme` inline (no tailwind.config.js)
- Bahasa Indonesia UI copy throughout (consistent with Phase 3 components)

### Integration Points
- `/pricing/page.tsx` — Replace stubbed CTA href with `NEXT_PUBLIC_MAYAR_MONTHLY_URL` / `NEXT_PUBLIC_MAYAR_LIFETIME_URL`
- `src/app/api/webhooks/mayar/route.ts` — New Route Handler (doesn't exist yet)
- `src/emails/WelcomeEmail.tsx` — New React Email template (doesn't exist yet)
- `src/app/(dashboard)/account/page.tsx` — New account page (doesn't exist yet)
- Supabase `public.users` table — needs new membership columns via migration

</code_context>

<specifics>
## Specific Ideas

- Welcome email subject: `"Selamat datang di lailit.supply 🎉"` — keep the emoji
- Account page "expires" copy for lifetime: `"Akses Seumur Hidup"` (never shows a date)
- Webhook token guard: check query param first, before even parsing the body — fail fast on invalid token
- Idempotency order: INSERT into `webhook_events` FIRST (before processing), catch unique violation and return 200 immediately — prevents partial double-execution
- Customer Portal button label: `"Kelola Langganan"` (consistent Bahasa Indonesia)
- "Dibatalkan" status note: show small text "Akses aktif sampai {date}" so canceled users don't panic

</specifics>

<deferred>
## Deferred Ideas

- Invoice history on account page — needs Mayar API for billing history; defer to v2
- Mayar Customer Portal dynamic magic-link API — research gap; static URL sufficient for MVP
- Membership expiry reminder email (7 days before) — v2 requirement per REQUIREMENTS.md
- Renewal confirmation email — v2 requirement
- Discord role auto-sync for paying members — v2 requirement

</deferred>

---

*Phase: 04-payments-webhooks*
*Context gathered: 2026-05-07*
