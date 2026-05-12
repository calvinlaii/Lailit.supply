
> **MIGRATION NOTE 2026-05-13:** This plan was written against Supabase Postgres + `@supabase/ssr`. The project has since migrated to **Cloudflare D1 + Drizzle ORM** (schema in `src/lib/db/schema.ts`, migrations in `drizzle/migrations/`, DB binding `env.DB` via `getCloudflareContext()`). Auth is **Clerk** (`@clerk/nextjs`), not Supabase magic-link. Re-run `/gsd-plan-phase 4` before executing.

# Phase 4: Payments & Webhooks — Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 9 new/modified files
**Analogs found:** 8 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/api/webhooks/mayar/route.ts` | route handler | event-driven (inbound webhook) | `src/app/(marketing)/login/actions.ts` | partial-match (server-only async, Supabase client pattern) |
| `src/lib/dal.ts` *(extend)* | utility / DAL | request-response (SSR read) | `src/lib/dal.ts` itself | exact (extend existing file) |
| `src/emails/WelcomeEmail.tsx` | component | transform (render→HTML) | `src/components/marketing/login-form.tsx` | partial-match (React component structure, Bahasa Indonesia copy) |
| `src/app/(dashboard)/account/page.tsx` | component / page | request-response (SSR) | `src/app/(dashboard)/dashboard/page.tsx` | exact (same route group, same DAL pattern) |
| `src/components/marketing/pricing-card.tsx` *(modify)* | component | request-response (static) | itself | exact (modify existing file) |
| `src/components/dashboard/dashboard-nav.tsx` *(modify)* | component | request-response (static) | itself | exact (modify existing file) |
| `supabase/migrations/20260507000000_phase4_payments.sql` | migration | batch (DDL) | none | no analog |
| `src/app/api/webhooks/mayar/__tests__/route.test.ts` | test | — | `src/components/marketing/__tests__/login-form.test.tsx` | role-match (Vitest + vi.mock pattern) |
| `src/emails/__tests__/WelcomeEmail.test.tsx` | test | — | `src/components/marketing/__tests__/login-form.test.tsx` | role-match (render + screen assertions) |

---

## Pattern Assignments

### `src/app/api/webhooks/mayar/route.ts` (route handler, event-driven)

**Analogs:** `src/app/(marketing)/login/actions.ts`, `src/app/(dashboard)/dashboard/actions.ts`, `src/lib/supabase/admin.ts`

**Imports pattern** — compose from three existing analog imports:

From `src/app/(marketing)/login/actions.ts` (lines 1–4):
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
```

From `src/lib/supabase/admin.ts` (lines 1–3):
```typescript
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
```

**Full imports for route.ts** (synthesised — no existing Route Handler analog):
```typescript
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
```

**No module-scope instantiation rule** (enforced by CLAUDE.md and confirmed in both analog files — neither `actions.ts` creates a client at module scope):

From `src/app/(marketing)/login/actions.ts` (lines 16–17): client is created inside the exported async function:
```typescript
export async function signInWithMagicLink(...): Promise<LoginActionState> {
  const supabase = await createClient()   // inside function — correct
```

From `src/app/(dashboard)/dashboard/actions.ts` (lines 6–8):
```typescript
export async function signOut() {
  const supabase = await createClient()   // inside function — correct
```

**Core async function pattern** — Next.js 16 Route Handler export (from RESEARCH.md Pattern 1, no existing analog in codebase):
```typescript
export async function POST(request: NextRequest) {
  // Layer 1: token check — fail fast before touching DB
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

  // Layer 2: cross-verify with Mayar API — inside function, no module scope
  const { valid, httpStatus } = await crossVerifyWithMayar(transactionId)
  if (!valid) {
    return new Response('Cross-verify failed', { status: httpStatus })
  }

  // Layer 3: idempotency INSERT — inside function, createClient() called here
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
        await handleNewMember(body, supabase)
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
    return new Response('Handler error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
```

**Error handling pattern** — from `src/app/(marketing)/login/actions.ts` (lines 27–33):
```typescript
if (error && error.status !== 400) {
  console.error('[signInWithMagicLink] error:', error.status, error.message, error.code)
  return { status: 'error', message: 'Ups, ada masalah teknis. Coba lagi.' }
}
```
Adapt: use `console.error` + structured `new Response(message, { status })` returns. Log Supabase error `.code` and `.message` before returning.

**Admin client pattern** — from `src/lib/supabase/admin.ts` (lines 1–9):
```typescript
import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```
Call `createAdminClient()` inside `handleNewMember()`, never at module scope.

---

### `src/lib/dal.ts` (utility / DAL, extend)

**Analog:** `src/lib/dal.ts` itself (lines 1–11) — extend, do not rewrite.

**Existing file** (lines 1–11):
```typescript
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})
```

**Pattern to copy for `getMembership()`:** Replicate exactly — `import 'server-only'`, `cache()` wrapper, `await createClient()` inside the async function, query `public.users` table by `user.id`. Return `null` if no user or no membership row.

```typescript
export const getMembership = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('membership_tier, membership_status, membership_expires_at, lifetime_purchased, mayar_member_id')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data
})
```

**Critical:** `server-only` import and `cache()` are MANDATORY on every exported server function per CLAUDE.md and existing dal.ts pattern.

---

### `src/emails/WelcomeEmail.tsx` (component, transform)

**Analog:** `src/components/marketing/pricing-card.tsx` (React component structure, Bahasa Indonesia copy conventions)

**Component structure** — from `src/components/marketing/pricing-card.tsx` (lines 1–3, 36–37):
```typescript
type PricingCardProps = {
  variant: "monthly" | "lifetime";
};

export function PricingCard({ variant }: PricingCardProps) {
```

**Copy the TypeScript props interface pattern:**
```typescript
interface WelcomeEmailProps {
  name: string
  magicLink: string
  plan: 'Bulanan' | 'Seumur Hidup'
}

export function WelcomeEmail({ name, magicLink, plan }: WelcomeEmailProps) {
```

**Named export (not default export)** — matches all existing component exports in the codebase.

**Bahasa Indonesia copy conventions** — from `src/components/marketing/pricing-card.tsx` (lines 7, 10, 33) and `src/app/(dashboard)/dashboard/page.tsx` (line 19):
- Plan labels: `"Bulanan"`, `"Seumur Hidup"` (consistent with pricing card)
- Welcoming tone: `"Selamat datang"`, `"Terima kasih sudah berlangganan"`
- Action labels: Imperative — `"Masuk ke Dashboard"`

**No Tailwind in email** — `@react-email/components` requires inline styles (email client compatibility). Do not use `className` or Tailwind utility classes inside `WelcomeEmail.tsx`. Use inline `style={{}}` objects per RESEARCH.md Pattern 4.

**Function call, not JSX** — from RESEARCH.md (anti-patterns section): `react: WelcomeEmail({ name, magicLink, plan })` in `resend.emails.send()`, not `<WelcomeEmail />`.

---

### `src/app/(dashboard)/account/page.tsx` (page component, SSR)

**Analog:** `src/app/(dashboard)/dashboard/page.tsx` (lines 1–25) — exact match.

**Full analog file:**
```typescript
import type { Metadata } from 'next'
import { getUser } from '@/lib/dal'
import { DashboardStubCard } from '@/components/dashboard/dashboard-stub-card'

export const metadata: Metadata = {
  title: 'Dashboard — lailit.supply',
}

export default async function DashboardPage() {
  const user = await getUser()

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-16">
      <h1 className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
        Dashboard
      </h1>
      <p className="mt-2 text-base font-normal leading-[1.5] text-neutral-500">
        Selamat datang, {user?.email}. Komponen segera hadir.
      </p>
      <div className="mt-12">
        <DashboardStubCard />
      </div>
    </div>
  )
}
```

**Copy these patterns directly:**
- `import type { Metadata } from 'next'` — Metadata export pattern
- `export const metadata: Metadata = { title: 'Akun — lailit.supply' }` — title format
- `export default async function AccountPage()` — async Server Component, default export
- `await getUser()` + `await getMembership()` — DAL calls at page level (add `getMembership` import from dal.ts)
- Layout spacing classes: `max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-16`
- Heading classes: `text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950`

**Auth gate** — `src/app/(dashboard)/layout.tsx` (lines 8–9) handles auth redirect automatically:
```typescript
const user = await getUser()
if (!user) redirect('/login')
```
No additional auth check needed in `account/page.tsx` — it inherits from the layout.

**Badge import** — use `src/components/ui/badge.tsx`:
```typescript
import { Badge } from '@/components/ui/badge'
// Usage: <Badge variant="default">Aktif</Badge>
// Variants: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
```

**Bahasa Indonesia status labels:**
- `'active'` → `'Aktif'` (variant: `"default"`)
- `'canceled'` → `'Dibatalkan'` (variant: `"secondary"`)
- `'expired'` → `'Kedaluwarsa'` (variant: `"destructive"`)
- Lifetime expiry → `'Akses Seumur Hidup'` (never show date)
- Date format: `new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })`

---

### `src/components/marketing/pricing-card.tsx` (modify — wire CTA href)

**Analog:** itself (lines 83–95) — the stubbed CTA block to replace.

**Current stubbed CTA** (lines 83–95):
```typescript
{/* Stubbed CTA — per D-12: aria-disabled, data-stub, cursor-not-allowed */}
<div className="mt-8">
  <a
    href="#"
    aria-disabled="true"
    data-stub="true"
    title="Segera hadir"
    tabIndex={-1}
    className="inline-flex w-full items-center justify-center bg-neutral-950 text-white px-6 py-3 rounded-lg text-base font-semibold cursor-not-allowed opacity-50 pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
  >
    {data.ctaLabel}
  </a>
</div>
```

**Replace with live CTA pattern** — wire env var URLs per D-01/D-02:
```typescript
const MONTHLY_DATA = {
  // ... existing fields
  checkoutUrl: process.env.NEXT_PUBLIC_MAYAR_MONTHLY_URL ?? '#',
}

const LIFETIME_DATA = {
  // ... existing fields
  checkoutUrl: process.env.NEXT_PUBLIC_MAYAR_LIFETIME_URL ?? '#',
}
```
```typescript
{/* Live CTA — D-01: same-tab navigation per D-02 */}
<div className="mt-8">
  <a
    href={data.checkoutUrl}
    className="inline-flex w-full items-center justify-center bg-neutral-950 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-neutral-800 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
  >
    {data.ctaLabel}
  </a>
</div>
```
Remove `aria-disabled`, `data-stub`, `tabIndex={-1}`, `cursor-not-allowed`, `opacity-50`, `pointer-events-none`. No `target="_blank"` per D-02.

---

### `src/components/dashboard/dashboard-nav.tsx` (modify — add "Akun" link)

**Analog:** itself (lines 1–20) — add a nav link alongside the existing `lailit.supply` logo link.

**Existing nav structure** (lines 6–19):
```typescript
export function DashboardNav({ email }: DashboardNavProps) {
  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-neutral-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-neutral-950 ..."
        >
          lailit.supply
        </Link>
        <UserMenu email={email} />
      </div>
    </nav>
  )
}
```

**Add "Akun" link** — insert between the logo `Link` and `UserMenu`, using same `Link` + `className` convention:
```typescript
<Link
  href="/account"
  className="text-sm font-normal text-neutral-500 hover:text-neutral-950 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 rounded"
>
  Akun
</Link>
```

---

### `supabase/migrations/20260507000000_phase4_payments.sql` (migration, batch DDL)

**No analog in codebase** — no `supabase/` directory exists yet. Use RESEARCH.md Pattern 7 as the template.

See "No Analog Found" section below for details.

---

### `src/app/api/webhooks/mayar/__tests__/route.test.ts` (test, unit)

**Analog:** `src/components/marketing/__tests__/login-form.test.tsx` (lines 1–10, 28–44)

**Test file structure** — copy exactly:
```typescript
import { describe, it, expect, vi } from "vitest";
```

**Module mock pattern** (lines 7–10):
```typescript
vi.mock("@/app/(marketing)/login/actions", () => ({
  signInWithMagicLink: vi.fn().mockResolvedValue({ status: "idle" }),
}));
```

Adapt for webhook test — mock Supabase clients and Resend:
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }) },
  })),
}))
```

**describe/it/expect structure** (lines 29–44):
```typescript
describe('POST /api/webhooks/mayar', () => {
  it('returns 401 when token is missing', async () => { ... })
  it('returns 401 when token is wrong', async () => { ... })
  it('returns 200 without side effects when event already in webhook_events', async () => { ... })
  it('returns 503 when Mayar cross-verify returns 503', async () => { ... })
})
```

**Test helper** — construct `NextRequest` with searchParams:
```typescript
import { NextRequest } from 'next/server'
const makeRequest = (token: string, body: object) =>
  new NextRequest(`http://localhost/api/webhooks/mayar?token=${token}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
```

---

### `src/emails/__tests__/WelcomeEmail.test.tsx` (test, unit)

**Analog:** `src/components/marketing/__tests__/login-form.test.tsx` (lines 1–3, 29–35)

**Imports pattern** (lines 1–3):
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
```

Add React Email render helper — `render` from `@react-email/render` for email-specific rendering, or use standard `@testing-library/react` `render` for structural checks:
```typescript
import { WelcomeEmail } from '../WelcomeEmail'
```

**Test structure:**
```typescript
describe('WelcomeEmail', () => {
  it('renders user name in greeting', () => {
    render(WelcomeEmail({ name: 'Budi', magicLink: 'https://example.com/link', plan: 'Bulanan' }))
    expect(screen.getByText(/Budi/)).toBeDefined()
  })
  it('renders plan name', () => { ... })
  it('renders magic link button', () => { ... })
})
```

---

## Shared Patterns

### `server-only` + `cache()` (DAL pattern — MANDATORY)

**Source:** `src/lib/dal.ts` (lines 1–11)
**Apply to:** `src/lib/dal.ts` extension (`getMembership`)

```typescript
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getMembership = cache(async () => {
  // ...
})
```

Every exported function that reads from the DB on the server side MUST follow this pattern per CLAUDE.md.

### No module-scope client instantiation

**Source:** `src/app/(marketing)/login/actions.ts` (line 16), `src/app/(dashboard)/dashboard/actions.ts` (line 8)
**Apply to:** `src/app/api/webhooks/mayar/route.ts` — `createClient()`, `createAdminClient()`, `new Resend()` must all live inside function bodies, not at file top level.

```typescript
// CORRECT — inside function:
export async function POST(request: NextRequest) {
  const supabase = await createClient()       // inside
  const adminClient = createAdminClient()     // inside
  const resend = new Resend(process.env.RESEND_API_KEY)  // inside
}
```

### Async cookies / Next.js 16 server client

**Source:** `src/lib/supabase/server.ts` (lines 4–5)
**Apply to:** `src/app/api/webhooks/mayar/route.ts` when calling `createClient()`

```typescript
export async function createClient() {
  const cookieStore = await cookies()   // cookies() is async in Next.js 16
```

The webhook handler calls `await createClient()` (note the await — required in Next.js 16).

### Admin client factory pattern

**Source:** `src/lib/supabase/admin.ts` (lines 1–9)
**Apply to:** `handleNewMember()` inside `route.ts`

```typescript
import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

Call as `const admin = createAdminClient()` inside the handler function.

### Dashboard layout auth gate (inherited — no action needed)

**Source:** `src/app/(dashboard)/layout.tsx` (lines 8–9)
**Apply to:** `src/app/(dashboard)/account/page.tsx` — automatically inherited, no code needed in the page itself.

```typescript
const user = await getUser()
if (!user) redirect('/login')
```

The `proxy.ts` (line 9) also already includes `'/account/:path*'` in its matcher — dual protection is already wired.

### Bahasa Indonesia copy conventions

**Source:** `src/components/marketing/pricing-card.tsx` (lines 7, 8, 33, 34), `src/app/(dashboard)/dashboard/page.tsx` (line 19)
**Apply to:** `src/app/(dashboard)/account/page.tsx`, `src/emails/WelcomeEmail.tsx`

- Plan names: `"Bulanan"` / `"Seumur Hidup"` (match pricing card)
- Status: `"Aktif"`, `"Dibatalkan"`, `"Kedaluwarsa"`
- Actions: `"Kelola Langganan"`, `"Masuk ke Dashboard"`
- Lifetime access copy: `"Akses Seumur Hidup"` (no expiry date shown)
- Canceled access note: `"Akses aktif sampai {date}"`

### Vitest test structure

**Source:** `src/components/marketing/__tests__/login-form.test.tsx` (lines 1–3)
**Apply to:** All new test files

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
```

Vitest config resolves `@` to `./src` (vitest.config.ts line 13–15). Test environment is `jsdom`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `supabase/migrations/20260507000000_phase4_payments.sql` | migration | batch (DDL) | No `supabase/` directory exists in repo; no prior migrations. Use RESEARCH.md Pattern 7 (SQL template) directly. Key decisions: `CREATE TABLE IF NOT EXISTS`, `ENABLE ROW LEVEL SECURITY`, trigger `handle_new_auth_user()` to sync `auth.users` → `public.users`, `webhook_events` with `mayar_event_id UNIQUE NOT NULL`. |

---

## Metadata

**Analog search scope:** `src/app/`, `src/lib/`, `src/components/`, `proxy.ts`, `vitest.config.ts`
**Files read:** 18 source files
**Pattern extraction date:** 2026-05-07
