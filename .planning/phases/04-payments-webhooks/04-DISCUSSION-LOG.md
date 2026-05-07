---
phase: 04-payments-webhooks
created: 2026-05-07
---

# Phase 4: Payments & Webhooks — Discussion Log

**Session:** 2026-05-07

## Gray Areas Discussed

### 1. Checkout Flow (D-01, D-02)
**Decision:** Static Mayar hosted payment links — no server-side checkout session creation. Monthly and Lifetime links stored as `NEXT_PUBLIC_MAYAR_MONTHLY_URL` / `NEXT_PUBLIC_MAYAR_LIFETIME_URL` env vars. Both links open in same tab (no `target="_blank"`).

**Rationale:** Mayar.id doesn't require dynamic checkout sessions for hosted links. Simpler, less surface area, no API key exposure in frontend.

---

### 2. Webhook Security & Idempotency (D-03 through D-08)
**Decision:** Three-layer defense:
1. URL token (`?token=MAYAR_WEBHOOK_TOKEN`) — fail fast before parsing body
2. Cross-verify via Mayar "Get Transaction" API before any side effects
3. Idempotency ledger: INSERT into `webhook_events` first, catch UNIQUE violation → already processed → return 200

**Event types handled:** `membership.newMemberRegistered`, `payment.received`, `membership.memberUnsubscribed`, `membership.memberExpired`, `membership.changeTierMemberRegistered`. Unknown events → log + 200.

---

### 3. Database Schema (D-09, D-10, D-11)
**Decision:** Membership fields on `public.users` table (no separate memberships table for MVP). New columns: `membership_tier`, `membership_status`, `membership_expires_at`, `lifetime_purchased`, `mayar_member_id`. Separate `webhook_events` table for idempotency ledger with `mayar_event_id UNIQUE NOT NULL`.

---

### 4. Account Page & Customer Portal (D-16, D-17, D-18)
**Decision:** `/account` inside `(dashboard)` route group (inherits auth gate). Shows plan, status badge, expiry (or "Akses Seumur Hidup" for lifetime). "Kelola Langganan" button uses static `MAYAR_CUSTOMER_PORTAL_URL` env var — no dynamic API call for MVP.

---

### 5. Welcome Email (D-12 through D-15)
**Decision:** Bahasa Indonesia email via React Email + Resend. Subject: `"Selamat datang di lailit.supply 🎉"`. Magic link via `supabase.auth.admin.generateLink({ type: 'magiclink', email })`. CTA button: "Masuk ke Dashboard".
