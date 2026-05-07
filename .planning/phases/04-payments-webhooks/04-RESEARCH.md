# Phase 4: Payments & Webhooks — Research

**Researched:** 2026-05-07
**Domain:** Mayar.id payments, webhook security, Supabase admin auth, Resend + React Email, Next.js 16 Route Handlers
**Confidence:** MEDIUM (Mayar API shape partially inferred — see Assumptions Log)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Checkout Flow**
- D-01: Pricing page CTAs use static Mayar hosted payment links — no server-side API call. Monthly link: `NEXT_PUBLIC_MAYAR_MONTHLY_URL`, Lifetime link: `NEXT_PUBLIC_MAYAR_LIFETIME_URL`.
- D-02: Both checkout links open in the same tab (not `target="_blank"`).

**Webhook Handler**
- D-03: Endpoint: `POST /api/webhooks/mayar` → `src/app/api/webhooks/mayar/route.ts`
- D-04: Security layer 1: URL token — `?token=MAYAR_WEBHOOK_TOKEN`. Invalid → `401` immediately.
- D-05: Security layer 2: Cross-verify each event against `GET https://api.mayar.id/hl/v1/payment/{id}`. Status mismatch → `400`.
- D-06: Security layer 3: `webhook_events` table with `mayar_event_id UNIQUE`. INSERT first; UNIQUE violation → return `200` (already processed).
- D-07: Event types to handle: `membership.newMemberRegistered`, `payment.received`, `membership.memberUnsubscribed`, `membership.memberExpired`, `membership.changeTierMemberRegistered`.
- D-08: Unknown event types → log + return `200`.

**Database Schema**
- D-09: Membership fields on `public.users` table: `membership_tier`, `membership_status`, `membership_expires_at`, `lifetime_purchased`, `mayar_member_id`.
- D-10: `webhook_events` table schema with `mayar_event_id UNIQUE NOT NULL` idempotency key.
- D-11: Migration file under `supabase/migrations/`.

**Welcome Email**
- D-12: Bahasa Indonesia. Subject: `"Selamat datang di lailit.supply 🎉"`.
- D-13: React Email template at `src/emails/WelcomeEmail.tsx`. Sent via `resend.emails.send()`.
- D-14: Magic link via `supabase.auth.admin.generateLink({ type: 'magiclink', email })`. Included in email body. Lands on `/dashboard`.
- D-15: Content: user first name from Mayar payload (or "Hei 👋"), plan name, magic link button "Masuk ke Dashboard".

**Account Page**
- D-16: Route: `src/app/(dashboard)/account/page.tsx` — inside auth-gated `(dashboard)` route group.
- D-17: Shows: plan name ("Bulanan"/"Seumur Hidup"), status badge ("Aktif"/"Dibatalkan"/"Kedaluwarsa"), expiry date in Bahasa Indonesia (or "Akses Seumur Hidup"), "Kelola Langganan" button.
- D-18: Customer Portal link: static `MAYAR_CUSTOMER_PORTAL_URL` env var. Plain `<a>` with `target="_blank"`.

### Claude's Discretion
- Exact Mayar API response shape for "Get Transaction" cross-verify — fields to check
- Exact Mayar webhook payload fields for each event type
- Whether `users` table extends `auth.users` via trigger or is separate `public.users` table
- DashboardNav update: add "Akun" link to existing nav
- Error handling in webhook handler for Mayar API cross-verify failures (503 vs 400)
- Exact format of Resend API calls

### Deferred Ideas (OUT OF SCOPE)
- Invoice history on account page
- Mayar Customer Portal dynamic magic-link API
- Membership expiry reminder email (7 days before)
- Renewal confirmation email
- Discord role auto-sync for paying members
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | Visitor can select monthly plan and be redirected to Mayar checkout | D-01: static link on pricing CTA button |
| PAY-02 | Visitor can select lifetime plan and be redirected to Mayar checkout | D-01: static link on pricing CTA button |
| PAY-03 | Backend receives `membership.newMemberRegistered`, creates user, sends welcome email | Webhook handler + `supabase.auth.admin.createUser` + Resend flow |
| PAY-04 | Backend receives `payment.received` and extends `membership_expires_at` | Webhook handler UPDATE on `public.users` |
| PAY-05 | Backend receives `membership.memberUnsubscribed`, sets status to `canceled`, access continues | Webhook handler UPDATE; DO NOT null `membership_expires_at` |
| PAY-06 | Backend receives `membership.memberExpired`, sets status to `expired`, revokes access | Webhook handler UPDATE; proxy.ts blocks `/dashboard` when status = expired |
| PAY-07 | Backend receives `membership.changeTierMemberRegistered`, updates `membership_tier` | Webhook handler UPDATE on `public.users.membership_tier` |
| PAY-08 | All webhooks deduplicated via `webhook_events` ledger keyed on Mayar's `data.id` | INSERT before processing; catch UNIQUE violation |
| PAY-09 | Each webhook cross-verified against Mayar "Get Transaction" API before side effects | `GET /hl/v1/payment/{id}` — see Cross-Verify section |
| PAY-10 | Lifetime purchasers have permanent access (`lifetime_purchased = true`) | Set on `newMemberRegistered` for lifetime product; skip `membership_expires_at` |
| AUTH-05 | New member account auto-created from Mayar webhook payload | `supabase.auth.admin.createUser({ email, email_confirm: true })` |
| EMAIL-01 | New member receives branded magic-link welcome email via Resend within seconds | Resend + React Email + `generateLink` |
| ACCT-01 | User can view account page showing membership tier, status, expiry | `src/app/(dashboard)/account/page.tsx` using DAL |
| ACCT-02 | User can access Mayar Customer Portal from account page | Static `MAYAR_CUSTOMER_PORTAL_URL` anchor tag |
</phase_requirements>

---

## Summary

Phase 4 wires Mayar.id payments into the application end-to-end. The checkout flow is trivially simple — swap stubbed `href="#"` on pricing CTAs with env var URLs. The complexity lives in three places: (1) the webhook handler's three-layer defense chain, (2) the `membership.newMemberRegistered` event which must atomically create a Supabase auth user, insert membership columns on `public.users`, and fire a Resend welcome email, and (3) the Postgres migration that adds membership columns and creates the `webhook_events` idempotency ledger.

The most significant research gap is Mayar's exact webhook payload structure — particularly which field serves as the Mayar member identifier (`mayar_member_id`) and what `data.status` looks like at the cross-verify endpoint. Mayar's documentation confirms the common payload shape but does not publish per-event field variations. The cross-verify endpoint is confirmed as `GET https://api.mayar.id/hl/v1/payment/{id}` returning `{ statusCode, messages, data: { id, status, ... } }`. Because Mayar's `data.status` is a `boolean` in the webhook payload but the payment request endpoint returns `status` as a string (`"unpaid"` / etc.), the planner must treat the cross-verify logic as requiring runtime validation — see Pitfall 2.

No `supabase/` directory exists yet — the entire migration infrastructure must be created in Wave 0.

**Primary recommendation:** Implement the webhook handler with a strict fail-fast token check, then INSERT-first idempotency, then async cross-verify (with 503 passthrough to avoid duplicate work on Mayar retry), then event dispatch.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Pricing CTA checkout redirect | Browser / Client | — | Pure anchor tag pointing to Mayar-hosted URL; no server involvement |
| Webhook reception & security | API / Backend (Route Handler) | — | Token validation, DB writes, and cross-verify must be server-only |
| Idempotency ledger (webhook_events) | Database / Storage | API / Backend | DB enforces UNIQUE constraint; API layer catches the violation |
| Mayar cross-verify call | API / Backend | — | Requires MAYAR_API_KEY secret — never expose client-side |
| User auto-creation | API / Backend (via admin client) | — | `service_role_key` required; only callable server-side |
| Welcome email dispatch | API / Backend (from webhook handler) | — | Runs inline in `newMemberRegistered` handler after user creation |
| Magic link generation | API / Backend (via admin client) | — | `auth.admin.generateLink` requires service role |
| Membership data read (account page) | Frontend Server (SSR) | Database | DAL `getUser()` pattern; data fetched at render time |
| Account page display | Frontend Server (SSR) | Browser / Client | Server Component; Badge/Button are client UI primitives |
| Customer Portal link | Browser / Client | — | Plain anchor tag; static URL from env var |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `resend` | 6.12.3 | Email delivery API | Official SDK; wraps REST API; returns structured errors |
| `@react-email/components` | 1.0.12 | Email template primitives | Official React Email component package |
| `react-email` | 6.1.1 | Render + preview tooling | Companion to `@react-email/components` |
| `@supabase/supabase-js` | 2.105.3 | Supabase admin client (already installed) | `auth.admin.createUser`, `auth.admin.generateLink` |

[VERIFIED: npm registry — `npm view resend version` returned 6.12.3; `npm view @react-email/components version` returned 1.0.12; `npm view react-email version` returned 6.1.1; `npm view @supabase/supabase-js version` returned 2.105.3]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | (not installed) | Validate Mayar webhook payload shape | Consider adding for type-safe webhook body parsing; Mayar payload already typed via interface if not |

### Not Installing

The following do NOT need to be installed — already present in `package.json`:
- `server-only` — already at `^0.0.1`
- `@supabase/ssr` — already at `^0.10.2`
- `@supabase/supabase-js` — already at `^2.105.3`

**New installations required:**
```bash
npm install resend @react-email/components react-email
```

[VERIFIED: These packages are absent from current `package.json`]

---

## Architecture Patterns

### System Architecture Diagram

```
Mayar Dashboard
  │
  │  (1) Merchant configures webhook URL:
  │      https://lailit.supply/api/webhooks/mayar?token=MAYAR_WEBHOOK_TOKEN
  │
  ▼
POST /api/webhooks/mayar?token=...
  │
  ├─► [A] Token check: searchParams.get('token') === MAYAR_WEBHOOK_TOKEN
  │       FAIL → 401 (stop)
  │
  ├─► [B] Parse JSON body → extract event_type, data.id, data.customerEmail, etc.
  │
  ├─► [C] INSERT into webhook_events (mayar_event_id = data.id)
  │       UNIQUE violation → 200 (already processed, stop)
  │
  ├─► [D] Cross-verify: GET https://api.mayar.id/hl/v1/payment/{data.id}
  │       503/timeout → 503 (Mayar will retry)
  │       404 or status mismatch → 400 (reject)
  │
  └─► [E] Dispatch by event_type:
          │
          ├── membership.newMemberRegistered
          │     → supabase.auth.admin.createUser (or find existing)
          │     → UPDATE public.users SET membership_* columns
          │     → supabase.auth.admin.generateLink (magiclink)
          │     → resend.emails.send(WelcomeEmail)
          │
          ├── payment.received
          │     → UPDATE public.users SET membership_expires_at = ...
          │
          ├── membership.memberUnsubscribed
          │     → UPDATE public.users SET membership_status = 'canceled'
          │     (membership_expires_at stays — access until expiry)
          │
          ├── membership.memberExpired
          │     → UPDATE public.users SET membership_status = 'expired'
          │
          ├── membership.changeTierMemberRegistered
          │     → UPDATE public.users SET membership_tier = ...
          │
          └── (unknown) → console.log, return 200

Supabase Postgres (public schema):
  ├── auth.users (managed by Supabase)
  └── public.users (one row per auth user, via trigger or manual insert)
        ├── id (uuid, FK → auth.users.id)
        ├── email (text)
        ├── membership_tier (text)
        ├── membership_status (text)
        ├── membership_expires_at (timestamptz)
        ├── lifetime_purchased (boolean)
        └── mayar_member_id (text)
  └── webhook_events
        ├── id (uuid PK)
        ├── mayar_event_id (text UNIQUE NOT NULL)
        ├── event_type (text NOT NULL)
        ├── payload (jsonb NOT NULL)
        ├── processed_at (timestamptz)
        └── created_at (timestamptz DEFAULT now())
```

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       └── mayar/
│   │           └── route.ts          # POST handler (new)
│   └── (dashboard)/
│       └── account/
│           └── page.tsx              # Account page (new)
├── emails/
│   └── WelcomeEmail.tsx              # React Email template (new)
└── lib/
    └── dal.ts                        # extend getUser() or add getMembership()

supabase/
└── migrations/
    └── 20260507000000_phase4_payments.sql   # (new — supabase/ dir doesn't exist yet)
```

### Pattern 1: Next.js 16 Route Handler for Webhook

**What:** `POST` export in `route.ts`; use `request.nextUrl.searchParams` for query params; `await request.json()` for body.
**When to use:** Any server-side API endpoint receiving POST from external service.

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (token !== process.env.MAYAR_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await request.json()
  // ... process
  return new Response('OK', { status: 200 })
}
```

### Pattern 2: Supabase Admin — Create User + Generate Magic Link

**What:** Use `createAdminClient()` (already in `src/lib/supabase/admin.ts`) to create a user with `email_confirm: true`, then generate a magic link.
**When to use:** `membership.newMemberRegistered` event handler.

```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-admin-generatelink [CITED]
// Source: https://supabase.com/docs/reference/javascript/auth-admin-createuser [CITED]
import { createAdminClient } from '@/lib/supabase/admin'

const supabaseAdmin = createAdminClient()

// Step 1: Create auth user (idempotent — check for existing first)
const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email: customerEmail,
  email_confirm: true,       // skip email verification — they just paid
  user_metadata: { full_name: customerName },
})

// Step 2: Generate magic link
const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
  type: 'magiclink',
  email: customerEmail,
  options: {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  },
})

const magicLink = linkData?.properties?.actionLink
```

**Critical note:** `generateLink` with `type: 'magiclink'` handles user creation automatically if the user doesn't exist. However, since we need to also set membership columns on `public.users` and the user must exist for the FK to work, the order is: (1) create user, (2) upsert `public.users` row with membership data, (3) generate magic link. [CITED: supabase.com/docs/reference/javascript/auth-admin-generatelink]

### Pattern 3: Resend + React Email

**What:** Instantiate `Resend` at the call site (not module scope — aligns with Supabase no-module-scope rule). Pass React Email component as a function call (not JSX).
**When to use:** `newMemberRegistered` event after user creation.

```typescript
// Source: https://resend.com/docs/send-with-nextjs [CITED via Context7]
import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'

// IMPORTANT: instantiate inside the function, not at module scope
async function sendWelcomeEmail(email: string, name: string, magicLink: string, plan: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: 'lailit.supply <noreply@lailit.supply>',  // must use verified Resend domain
    to: [email],
    subject: 'Selamat datang di lailit.supply 🎉',
    react: WelcomeEmail({ name, magicLink, plan }),  // function call, not JSX
  })
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}
```

### Pattern 4: React Email Template Structure

**What:** Use `@react-email/components` for email-safe primitives. Inline styles are safer than Tailwind in email clients. For this project, plain inline styles are recommended over Tailwind preset.
**When to use:** `src/emails/WelcomeEmail.tsx`.

```typescript
// Source: https://github.com/resend/react-email (Context7 /resend/react-email) [CITED]
import {
  Html, Head, Body, Container, Heading, Text, Button, Preview
} from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  magicLink: string
  plan: 'Bulanan' | 'Seumur Hidup'
}

export function WelcomeEmail({ name, magicLink, plan }: WelcomeEmailProps) {
  return (
    <Html lang="id">
      <Head />
      <Preview>Selamat datang di lailit.supply — akun kamu sudah siap!</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#fafafa' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ fontSize: '24px', color: '#0a0a0a' }}>
            Hei, {name}! 👋
          </Heading>
          <Text style={{ color: '#404040' }}>
            Terima kasih sudah berlangganan paket <strong>{plan}</strong> di lailit.supply.
          </Text>
          <Button
            href={magicLink}
            style={{
              backgroundColor: '#0a0a0a',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              display: 'inline-block',
              textDecoration: 'none',
            }}
          >
            Masuk ke Dashboard
          </Button>
          <Text style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '24px' }}>
            Link ini berlaku satu kali. Jika kamu tidak membuat akun ini, abaikan email ini.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### Pattern 5: Idempotency-First INSERT

**What:** INSERT into `webhook_events` before processing. Catch Postgres unique violation (code `'23505'`) and return `200` immediately.
**When to use:** Start of every webhook handler dispatch, after cross-verify passes.

```typescript
// Source: [ASSUMED — standard Postgres idempotency pattern, no specific doc URL]
const supabase = await createClient()

const { error: insertError } = await supabase
  .from('webhook_events')
  .insert({
    mayar_event_id: body.data.id,
    event_type: body['event.received'],
    payload: body,
  })

if (insertError) {
  if (insertError.code === '23505') {
    // Already processed — idempotent success
    return new Response('Already processed', { status: 200 })
  }
  // Unexpected DB error
  console.error('webhook_events insert error:', insertError)
  return new Response('Internal error', { status: 500 })
}
```

### Pattern 6: Mayar Cross-Verify Call

**What:** After idempotency check, call Mayar's payment detail endpoint to verify the transaction is real. Use `data.id` from the webhook payload as the path parameter.
**When to use:** After token validation, before idempotency INSERT.

**IMPORTANT ORDER: Token check → body parse → cross-verify → INSERT into webhook_events → dispatch**

Wait — revisit order: the CONTEXT.md specifies INSERT first (D-06), then process. But cross-verify should happen BEFORE INSERT to avoid recording unverifiable events. Recommended order: token → parse → cross-verify → INSERT → dispatch. This prevents recording fraudulent events in the ledger.

```typescript
// Source: https://docs.mayar.id/api-reference/reqpayment/detail [CITED]
// Endpoint confirmed: GET https://api.mayar.id/hl/v1/payment/{id}
async function crossVerifyWithMayar(transactionId: string): Promise<{
  valid: boolean
  httpStatus: number
}> {
  let res: Response
  try {
    res = await fetch(`https://api.mayar.id/hl/v1/payment/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MAYAR_API_KEY}`,
      },
      // Prevent Next.js from caching this fetch
      cache: 'no-store',
    })
  } catch {
    return { valid: false, httpStatus: 503 }
  }

  if (res.status === 503 || res.status === 502 || res.status === 504) {
    return { valid: false, httpStatus: 503 }  // Mayar down → Mayar will retry
  }
  if (!res.ok) {
    return { valid: false, httpStatus: 400 }  // transaction not found
  }

  const json = await res.json()
  // json.data.status is string ("unpaid" / "paid" etc.) from payment endpoint
  // If statusCode !== 200 or data missing, treat as invalid
  if (json.statusCode !== 200 || !json.data) {
    return { valid: false, httpStatus: 400 }
  }

  return { valid: true, httpStatus: 200 }
}
```

### Pattern 7: public.users Table

**Finding:** No `supabase/` directory exists in the repo. No migrations have been run. The `public.users` table does NOT exist yet.

**Standard Supabase pattern:** Create a `public.users` table that mirrors `auth.users` via a trigger. The trigger runs on `INSERT` into `auth.users` and creates a corresponding row in `public.users`. This is the canonical approach described in Supabase docs.

```sql
-- Source: [ASSUMED — standard Supabase public.users trigger pattern]
-- Migration file: supabase/migrations/20260507000000_phase4_payments.sql

-- 1. Create public.users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  membership_tier text CHECK (membership_tier IN ('monthly', 'lifetime')),
  membership_status text CHECK (membership_status IN ('active', 'canceled', 'expired')),
  membership_expires_at timestamptz,
  lifetime_purchased boolean NOT NULL DEFAULT false,
  mayar_member_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy: users can only read their own row
CREATE POLICY "Users can view own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 4. Trigger: auto-insert into public.users when auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. webhook_events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mayar_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. No RLS needed on webhook_events — accessed only via service role in webhook handler
```

### Anti-Patterns to Avoid

- **Module-scope Supabase client:** Never `const supabase = createClient()` at the top of `route.ts`. Always instantiate inside the function. [VERIFIED: CLAUDE.md directive]
- **Module-scope Resend instance:** Same rule — instantiate inside the handler function to prevent session leaks on Vercel Fluid compute.
- **Using `getSession()` for access checks:** Never. Always `getUser()` via DAL. [VERIFIED: CLAUDE.md directive]
- **JSX syntax for React Email:** Pass React Email component as a function call, not `<WelcomeEmail />`. `react: WelcomeEmail({ name, magicLink, plan })`. [CITED: resend.com/docs/send-with-nextjs]
- **Processing before idempotency check:** Always INSERT into `webhook_events` before applying DB side effects. A failed DB write after side effects = inconsistent state on retry.
- **Returning non-200 for unknown event types:** Unknown events must return `200`, not `400`. Returning error codes causes Mayar to retry indefinitely. [CITED: docs.mayar.id/integration/webhook — D-08]
- **Catching 503 from Mayar cross-verify as 400:** If Mayar's own API is down, return `503` from the webhook handler so Mayar retries later rather than discarding the event.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery | SMTP client | Resend SDK | TLS, bounce handling, deliverability, DKIM — all handled |
| Email HTML rendering | Manual HTML string | React Email components | Email client compatibility, Outlook quirks, CSS inlining |
| Magic link generation | Custom JWT | `supabase.auth.admin.generateLink` | Supabase manages OTP expiry, token storage, hashing |
| Auth user creation | Custom user table insert | `supabase.auth.admin.createUser` | Handles password hash, email confirmation, auth schema integrity |
| Idempotency logic | In-memory deduplication | Postgres `UNIQUE` constraint | Survives restarts, handles concurrent retries atomically |
| Webhook payload validation | Manual JSON checks | TypeScript interface + runtime checks | At minimum define a `MayarWebhookPayload` interface |

---

## Mayar API: Confirmed Findings

### Webhook Payload (Confirmed Shape)

[CITED: docs.mayar.id/integration/webhook — fetched 2026-05-07]

```typescript
interface MayarWebhookPayload {
  'event.received': string      // e.g. 'membership.newMemberRegistered'
  data: {
    id: string                  // Mayar's webhook/transaction ID — use as idempotency key
    status: boolean             // Transaction status (boolean in webhook payload)
    createdAt: string           // ISO timestamp
    updatedAt: string           // ISO timestamp
    merchantId: string
    merchantEmail: string
    merchantName: string
    customerName: string        // use as first name (may be full name)
    customerEmail: string       // KEY: the email to create user account with
    customerMobile: string
    amount: number              // in IDR
    isAdminFeeBorneByCustomer: boolean
    isChannelFeeBorneByCustomer: boolean
    productId: string
    productName: string         // e.g. 'Bulanan' or 'Lifetime' — use to determine membership_tier
    productType: string
    pixelFbp: string
    pixelFbc: string
    addOn: unknown[]
    custom_field: unknown[]
  }
}
```

**Field note:** The `data.id` field is documented as "Webhook ID" — this serves as the idempotency key for `webhook_events.mayar_event_id`. [CITED: docs.mayar.id/integration/webhook]

**Membership tier detection:** The webhook does not include an explicit `membershipTier` field in the documented schema. Tier should be inferred from `data.productName` or `data.productId` — match against the configured monthly/lifetime product names from Mayar Dashboard. [ASSUMED — see A1 in Assumptions Log]

**Mayar member identifier:** The `mayar_member_id` column (for Customer Portal link) is NOT documented in the standard payload. It may come from `data.id`, `data.productId`, or a field not in the standard schema. [ASSUMED — see A2 in Assumptions Log]

### Cross-Verify Endpoint (Confirmed)

[CITED: docs.mayar.id/api-reference/reqpayment/detail — fetched 2026-05-07]

```
GET https://api.mayar.id/hl/v1/payment/{id}
Authorization: Bearer {MAYAR_API_KEY}
```

Response:
```json
{
  "statusCode": 200,
  "messages": "success",
  "data": {
    "id": "uuid",
    "link": "short-slug",
    "name": "payment request title",
    "amount": 449000,
    "status": "unpaid",
    "description": "...",
    "type": "...",
    "userId": "uuid"
  }
}
```

**Critical discrepancy:** The webhook payload has `data.status` as `boolean`. The payment request detail endpoint returns `data.status` as `string` (`"unpaid"` etc.). These are different representations of the same underlying state. The cross-verify check should validate that the payment exists (HTTP 200, `statusCode: 200`), not attempt to compare status values across the two formats. [CITED: docs.mayar.id, ASSUMED for status semantics — see A3]

**Sandbox:** `https://api.mayar.club/hl/v1/payment/{id}` [CITED: docs.mayar.id/api-reference/introduction]

---

## Common Pitfalls

### Pitfall 1: No `supabase/` Directory — Manual Migration Required

**What goes wrong:** Planner assumes Supabase CLI is initialized; it isn't. No `supabase/` directory, no migration history.
**Why it happens:** Phase 4 is the first phase to need Postgres schema changes. Phases 1–3 used auth only.
**How to avoid:** Wave 0 task must `mkdir -p supabase/migrations` and create the migration SQL manually. Supabase CLI is not required to apply migrations — they can be run via the Supabase Dashboard SQL editor or `psql`.
**Warning signs:** `supabase migrate up` fails with "not a Supabase project directory."

### Pitfall 2: `data.status` Type Mismatch Between Webhook and API

**What goes wrong:** Code compares `webhookBody.data.status === 'paid'` expecting a string, but the webhook payload delivers `data.status` as a `boolean`.
**Why it happens:** Mayar's docs show `data.status: boolean` for webhook payloads but `status: string` for the payment detail API response.
**How to avoid:** The cross-verify step should only confirm the payment EXISTS (HTTP 200) and not attempt value-for-value status matching. For event-specific business logic, trust the `event.received` field name over status values.
**Warning signs:** Cross-verify always passes or always fails despite valid transactions.

### Pitfall 3: Module-Scope Supabase/Resend Instantiation

**What goes wrong:** Session bleed between requests on Vercel Fluid compute; or stale API key after env var rotation.
**Why it happens:** Module-level singletons are shared across requests in serverless warm containers.
**How to avoid:** `const supabase = createAdminClient()` and `const resend = new Resend(...)` inside the function body, not at module scope. This is a CLAUDE.md hard requirement.
**Warning signs:** Auth errors after long idle periods, or requests getting each other's session cookies.

### Pitfall 4: Double-Execution on Retry if INSERT Comes After Processing

**What goes wrong:** If processing (DB updates, email send) succeeds but `webhook_events` INSERT fails, Mayar retries the webhook and the event is processed twice.
**Why it happens:** Out-of-order operations.
**How to avoid:** Order is strictly: token check → parse → cross-verify → INSERT webhook_events → dispatch. The INSERT acts as a "claim" on the event. If INSERT fails for non-UNIQUE reasons, return 500 (Mayar retries). If INSERT succeeds, proceed.
**Warning signs:** Users receive duplicate welcome emails; `membership_expires_at` extended twice.

### Pitfall 5: User Already Exists on `membership.newMemberRegistered`

**What goes wrong:** `supabase.auth.admin.createUser` throws an error if the email already exists (e.g., user re-subscribes after expiry).
**Why it happens:** Mayar fires `newMemberRegistered` on every new subscription, including re-subscriptions.
**How to avoid:** Use `listUsers` to check for existing user by email before `createUser`. If found, skip creation and proceed to UPDATE membership columns. Use upsert-style logic for `public.users` membership columns.
**Warning signs:** Webhook returns 500, user complains they never received welcome email on re-subscription.

### Pitfall 6: `proxy.ts` Doesn't Gate `/account`

**What goes wrong:** Account page at `/account` is accessible without login.
**Why it happens:** `proxy.ts` matcher already includes `'/account/:path*'` [VERIFIED: proxy.ts line 9], but the `(dashboard)` layout at `src/app/(dashboard)/layout.tsx` also does `getUser()` redirect check. Both layers are already set up — the account page at `src/app/(dashboard)/account/page.tsx` will inherit both.
**How to avoid:** No action needed — architecture is already correct. Just place the file in the right route group.
**Warning signs:** If account page is placed outside `(dashboard)` route group, it won't inherit the layout's auth check.

### Pitfall 7: Resend Domain Verification

**What goes wrong:** Email sends fail with "domain not verified" error.
**Why it happens:** Resend requires the sending domain (`lailit.supply`) to have DNS records added.
**How to avoid:** Add Resend domain in Resend Dashboard before testing. For local dev, Resend provides `onboarding@resend.dev` which can be used as `from` address without domain verification.
**Warning signs:** `resend.emails.send()` returns `error` object with domain-related message.

---

## Code Examples

### Webhook Handler Skeleton (complete flow)

```typescript
// Source: Pattern synthesis from [CITED: Next.js 16 route.md, docs.mayar.id/integration/webhook,
//          docs.mayar.id/api-reference/reqpayment/detail, supabase.com admin docs]
// File: src/app/api/webhooks/mayar/route.ts
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'

export async function POST(request: NextRequest) {
  // Layer 1: Token check
  const token = request.nextUrl.searchParams.get('token')
  if (!token || token !== process.env.MAYAR_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Parse body
  let body: MayarWebhookPayload
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const eventType = body['event.received']
  const transactionId = body.data?.id

  if (!transactionId) {
    return new Response('Missing data.id', { status: 400 })
  }

  // Layer 2: Cross-verify with Mayar API
  const { valid, httpStatus } = await crossVerifyWithMayar(transactionId)
  if (!valid) {
    return new Response('Cross-verify failed', { status: httpStatus })
  }

  // Layer 3: Idempotency — INSERT first
  const supabase = await createClient()
  const { error: insertError } = await supabase
    .from('webhook_events')
    .insert({ mayar_event_id: transactionId, event_type: eventType, payload: body })

  if (insertError) {
    if (insertError.code === '23505') {
      return new Response('Already processed', { status: 200 })
    }
    console.error('webhook_events insert failed:', insertError)
    return new Response('DB error', { status: 500 })
  }

  // Dispatch
  try {
    switch (eventType) {
      case 'membership.newMemberRegistered':
        await handleNewMember(body)
        break
      case 'payment.received':
        await handlePaymentReceived(body, supabase)
        break
      case 'membership.memberUnsubscribed':
        await handleUnsubscribed(body, supabase)
        break
      case 'membership.memberExpired':
        await handleExpired(body, supabase)
        break
      case 'membership.changeTierMemberRegistered':
        await handleTierChange(body, supabase)
        break
      default:
        console.log('Unknown Mayar event type:', eventType)
    }
  } catch (err) {
    console.error('Webhook dispatch error:', err)
    // Don't return 500 — event was already recorded in ledger
    // Returning 500 causes Mayar to retry which would hit idempotency and return 200
    // Prefer 500 so ops team sees the retry in logs
    return new Response('Handler error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
```

### Account Page (server component)

```typescript
// Source: Pattern from existing (dashboard)/dashboard/page.tsx [VERIFIED: codebase]
// File: src/app/(dashboard)/account/page.tsx
import type { Metadata } from 'next'
import { getUser } from '@/lib/dal'
import { getMembership } from '@/lib/dal'  // new DAL function
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Akun — lailit.supply',
}

export default async function AccountPage() {
  const user = await getUser()
  const membership = await getMembership()  // returns membership fields from public.users

  const isLifetime = membership?.membership_tier === 'lifetime'
  const expiryDisplay = isLifetime
    ? 'Akses Seumur Hidup'
    : membership?.membership_expires_at
      ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          .format(new Date(membership.membership_expires_at))
      : '—'

  const statusLabel = {
    active: 'Aktif',
    canceled: 'Dibatalkan',
    expired: 'Kedaluwarsa',
  }[membership?.membership_status ?? ''] ?? '—'

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-16">
      <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
        Akun
      </h1>
      {/* membership card, status badge, expiry, portal link */}
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-mdx-remote` for MDX | `@next/mdx` | CVE-2026-0969 (archived April 2026) | DO NOT use next-mdx-remote under any circumstances |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | ~2024 | auth-helpers deprecated; already using ssr in this project |
| `middleware.ts` | `proxy.ts` | Next.js 16 | middleware.ts not supported; already using proxy.ts |
| `next/headers` sync `cookies()` | `await cookies()` | Next.js 15+ | params and cookies are now async; already handled in server.ts |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Mayar webhook payload does not include an explicit tier field; tier must be inferred from `data.productName` matching the merchant's product names configured in Mayar Dashboard | Mayar API: Confirmed Findings | If Mayar does include an explicit tier field, tier detection code would be unnecessarily complex |
| A2 | `mayar_member_id` stored in `public.users` corresponds to `data.id` from the webhook (the transaction/webhook ID), not a separate member-specific identifier | Mayar API: Confirmed Findings | If Mayar has a separate memberId field, Customer Portal links may not work correctly |
| A3 | The `GET /hl/v1/payment/{id}` endpoint accepts the same `id` value as `data.id` in the webhook payload | Cross-Verify Endpoint | If `data.id` is a webhook-specific ID rather than a payment request ID, cross-verify calls will return 404 for all real transactions |
| A4 | No `public.users` table exists yet in Supabase (no supabase/ directory in repo); the table must be created in migration | Architecture Patterns | If public.users was created manually in Supabase Dashboard, the migration must handle the `IF NOT EXISTS` case carefully |
| A5 | Resend's `from` field can use `noreply@lailit.supply` once the domain is verified in Resend Dashboard | Resend + React Email | If domain isn't verified before testing, must use `onboarding@resend.dev` as temporary sender |

**A3 is the highest-risk assumption.** If Mayar's webhook `data.id` does not match the `{id}` path parameter of `GET /hl/v1/payment/{id}`, the entire cross-verify defense layer will incorrectly reject all valid webhooks with `400`. Mitigation: test with sandbox credentials before deploying to production. The sandbox base URL is `https://api.mayar.club/hl/v1/payment/{id}`.

---

## Open Questions

1. **Is `data.id` in webhook payload the same as `{id}` in `GET /hl/v1/payment/{id}`?**
   - What we know: Webhook payload has `data.id: string` described as "Webhook ID". Payment detail endpoint takes a UUID path param described as "obtainable from dashboard or initial creation response."
   - What's unclear: Whether these are the same UUID.
   - Recommendation: Test with Mayar sandbox immediately. If they differ, cross-verify must first call `GET /hl/v1/transaction?...` or equivalent list endpoint to look up by a matching field.

2. **Does the webhook payload have a `membershipTier` or equivalent field not shown in standard docs?**
   - What we know: Documented payload has `productName` and `productId` but no explicit tier field.
   - What's unclear: Whether Mayar adds membership-specific fields for membership product types.
   - Recommendation: Log the full raw webhook payload in dev/staging before writing tier-detection logic. Do not hard-code tier values until a real webhook is received.

3. **Does `public.users` table already exist in the Supabase project?**
   - What we know: No `supabase/` directory in repo; no migrations have been committed.
   - What's unclear: Whether the table was created manually via Supabase Dashboard during Phase 2 setup.
   - Recommendation: Wave 0 task should verify via Supabase Dashboard before writing migration. Use `CREATE TABLE IF NOT EXISTS` to be safe.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js + Resend SDK | ✓ | (project runs) | — |
| Supabase project | Auth + DB | ✓ | `snbjpmqaschuzaqxmncd.supabase.co` confirmed in `.env.local` | — |
| `supabase/` CLI directory | Running migrations locally | ✗ | — | Apply SQL via Supabase Dashboard → SQL Editor |
| `RESEND_API_KEY` env var | Email delivery | ✗ (not in .env.local) | — | Create at resend.com, add to .env.local + Vercel |
| `MAYAR_API_KEY` env var | Cross-verify calls | ✗ (not in .env.local) | — | Obtain from web.mayar.id/api-keys |
| `MAYAR_WEBHOOK_TOKEN` env var | Webhook URL token | ✗ (not in .env.local) | — | Generate random string, configure in Mayar Dashboard |
| `NEXT_PUBLIC_MAYAR_MONTHLY_URL` | Pricing CTA | ✗ (not in .env.local) | — | Create product in Mayar Dashboard, copy link |
| `NEXT_PUBLIC_MAYAR_LIFETIME_URL` | Pricing CTA | ✗ (not in .env.local) | — | Create product in Mayar Dashboard, copy link |
| `MAYAR_CUSTOMER_PORTAL_URL` | Account page | ✗ (not in .env.local) | — | Find in Mayar Dashboard |
| Resend domain verification | Email `from` address | ✗ (unknown) | — | Use `onboarding@resend.dev` for testing |

**Missing dependencies with no fallback:**
- None — all missing items have either a fallback or a setup path.

**Missing dependencies with fallback:**
- `supabase/` CLI: use Supabase Dashboard SQL Editor to run migration SQL directly.
- `RESEND_API_KEY`: obtain from resend.com (free tier sufficient for MVP).
- `MAYAR_API_KEY`: obtain from web.mayar.id/api-keys.
- Resend domain: use `onboarding@resend.dev` for dev/staging, configure `lailit.supply` for production.

**Wave 0 must include:** A `.env.local.example` update documenting all 5 new env vars required by Phase 4.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 + jsdom |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-01 | Monthly CTA `href` reads from env var `NEXT_PUBLIC_MAYAR_MONTHLY_URL` | unit | `npm test -- src/components/marketing/__tests__/pricing-card.test.tsx` | ❌ Wave 0 |
| PAY-02 | Lifetime CTA `href` reads from env var `NEXT_PUBLIC_MAYAR_LIFETIME_URL` | unit | `npm test -- src/components/marketing/__tests__/pricing-card.test.tsx` | ❌ Wave 0 |
| PAY-08 | Webhook handler returns 200 (no side effects) when `mayar_event_id` already exists | unit | `npm test -- src/app/api/webhooks/mayar/__tests__/route.test.ts` | ❌ Wave 0 |
| PAY-04 | Token validation rejects missing/wrong token with 401 | unit | `npm test -- src/app/api/webhooks/mayar/__tests__/route.test.ts` | ❌ Wave 0 |
| PAY-09 | Cross-verify returning 503 causes handler to return 503 | unit | `npm test -- src/app/api/webhooks/mayar/__tests__/route.test.ts` | ❌ Wave 0 |
| ACCT-01 | Account page renders plan, status, expiry — lifetime shows "Akses Seumur Hidup" | unit | `npm test -- src/app/(dashboard)/account/__tests__/page.test.tsx` | ❌ Wave 0 |
| EMAIL-01 | WelcomeEmail component renders name, plan, magic link button | unit | `npm test -- src/emails/__tests__/WelcomeEmail.test.tsx` | ❌ Wave 0 |

Note: Integration tests for the full webhook → DB → email flow require sandbox Mayar credentials and a live Supabase test database. These are manual-only for Phase 4. Unit tests mock the DB and Resend/admin calls.

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/components/marketing/__tests__/pricing-card.test.tsx` — covers PAY-01, PAY-02
- [ ] `src/app/api/webhooks/mayar/__tests__/route.test.ts` — covers PAY-04, PAY-08, PAY-09
- [ ] `src/app/(dashboard)/account/__tests__/page.test.tsx` — covers ACCT-01
- [ ] `src/emails/__tests__/WelcomeEmail.test.tsx` — covers EMAIL-01
- [ ] `supabase/migrations/` directory + migration SQL file

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase `auth.admin.createUser` + `generateLink(type:'magiclink')` |
| V3 Session Management | no | Handled by Supabase auth (Phase 2) |
| V4 Access Control | yes | `(dashboard)` layout + `proxy.ts` token check; membership status gating in Phase 5 |
| V5 Input Validation | yes | TypeScript interface for webhook payload; validate `event.received` and `data.id` presence before processing |
| V6 Cryptography | no | No custom crypto — Supabase handles OTP hashing |

### Known Threat Patterns for Mayar Webhooks + Next.js

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged webhook (attacker posts fake `newMemberRegistered`) | Spoofing | URL token + Mayar API cross-verify (`data.id` must exist in Mayar system) |
| Replay attack (re-send captured valid webhook) | Repudiation | Idempotency ledger (`webhook_events.mayar_event_id UNIQUE`) |
| Mayar API spoofing during cross-verify | Tampering | HTTPS to `api.mayar.id` (pinned via DNS); Bearer token proves API key ownership |
| Sensitive env var exposure (MAYAR_API_KEY, RESEND_API_KEY) | Information Disclosure | Server-only route handler; never use `NEXT_PUBLIC_` prefix for secrets |
| Service role key misuse | Elevation of Privilege | `createAdminClient()` called only inside webhook handler (server-only); never exposed to browser |
| Magic link interception | Information Disclosure | Magic links expire per Supabase OTP expiry setting (EMAIL-02: 86400s); one-time use |

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Next.js 16 Route Handler API
- [docs.mayar.id/integration/webhook](https://docs.mayar.id/integration/webhook) — Mayar webhook payload structure and event types
- [docs.mayar.id/api-reference/reqpayment/detail](https://docs.mayar.id/api-reference/reqpayment/detail) — `GET /hl/v1/payment/{id}` response schema
- [docs.mayar.id/api-reference/introduction](https://docs.mayar.id/api-reference/introduction) — Mayar base URL and sandbox URL
- Context7 `/websites/supabase` — `auth.admin.generateLink` response shape and `auth.admin.createUser`
- Context7 `/websites/resend` — `resend.emails.send()` with React Email components
- Context7 `/resend/react-email` — `@react-email/components` template structure
- Project codebase — `src/lib/dal.ts`, `src/lib/supabase/admin.ts`, `src/app/(dashboard)/layout.tsx`, `proxy.ts`

### Secondary (MEDIUM confidence)
- [supabase.com/docs/reference/javascript/auth-admin-generatelink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) — `data.properties.actionLink` response field
- npm registry (verified) — resend@6.12.3, @react-email/components@1.0.12, react-email@6.1.1

### Tertiary (LOW confidence — see Assumptions Log)
- Inferred from `docs.mayar.id/llms.txt` listing — absence of explicit membership tier field in payload
- `mayar-py` and `mayar-nim` unofficial clients — confirm no lookup-by-ID method exists in stable API

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry
- Architecture: HIGH — based on existing project code patterns + confirmed Next.js 16 docs
- Mayar webhook payload shape: MEDIUM — confirmed common fields; per-event variations not documented
- Mayar cross-verify endpoint: MEDIUM — URL and response schema confirmed via official docs; `data.id` mapping is ASSUMED (A3)
- Supabase admin patterns: HIGH — cited from official docs
- Resend/React Email: HIGH — verified via Context7 from official sources

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (stable APIs; re-check if Mayar publishes new webhook docs)
