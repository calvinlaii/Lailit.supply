---
phase: 02-auth-foundation
mapped: 2026-05-06
files_analyzed: 11
analogs_found: 6
---

# Phase 2: Auth Foundation — Pattern Map

**Mapped:** 2026-05-06
**Files analyzed:** 11
**Analogs found:** 6 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/supabase/client.ts` | utility | request-response | `src/lib/utils.ts` | partial (utility wrapper pattern) |
| `src/lib/supabase/server.ts` | utility | request-response | `src/lib/utils.ts` | partial (utility wrapper pattern) |
| `src/lib/supabase/admin.ts` | utility | request-response | `src/lib/utils.ts` | partial (utility wrapper pattern) |
| `src/lib/supabase/middleware.ts` | utility | request-response | `src/lib/utils.ts` | partial (utility wrapper pattern) |
| `src/lib/dal.ts` | utility | request-response | `src/lib/utils.ts` | partial (utility wrapper, server-only) |
| `proxy.ts` | middleware | request-response | none | no analog |
| `src/app/auth/confirm/route.ts` | route handler | request-response | none | no analog |
| `src/app/(dashboard)/layout.tsx` | layout | request-response | `src/app/(marketing)/layout.tsx` | exact (route-group layout) |
| `src/app/(dashboard)/dashboard/page.tsx` | page | request-response | `src/app/(marketing)/page.tsx` | role-match |
| `src/components/dashboard/dashboard-nav.tsx` | component | request-response | `src/components/marketing/top-nav.tsx` | exact (nav bar pattern) |
| `src/app/(marketing)/login/actions.ts` | server action | request-response | none | no analog |

---

## Pattern Assignments

### `src/lib/supabase/client.ts` (utility, request-response)

**Analog:** `src/lib/utils.ts`

**Imports pattern** (`src/lib/utils.ts` lines 1–2):
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
```

**Core pattern to copy:** Named export of a single factory function. No default exports. No module-scope instances.

```typescript
// COPY THIS SHAPE — not module-scope, always a factory:
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**Critical constraint (from CONTEXT.md):** Never instantiate at module scope. Function must be called per-render inside `'use client'` components only.

---

### `src/lib/supabase/server.ts` (utility, request-response)

**Analog:** `src/lib/utils.ts`

**Core pattern:** Named export factory, but uses `await cookies()` (async in Next.js 16).

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()   // MUST be await — Next.js 16
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can throw in Server Components — safe to ignore
          }
        },
      },
    }
  )
}
```

---

### `src/lib/supabase/admin.ts` (utility, request-response)

**Analog:** `src/lib/utils.ts` (wrapper pattern) + `server-only` guard convention

**Core pattern:** `server-only` import at top (same as `dal.ts`), service-role client factory — stub for Phase 4.

```typescript
// src/lib/supabase/admin.ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   // NO NEXT_PUBLIC_ prefix
  )
}
```

---

### `src/lib/supabase/middleware.ts` (utility, request-response)

**Analog:** `src/lib/utils.ts` (utility helper pattern)

**Core pattern:** Helper called from `proxy.ts` to refresh the session token. Takes `request` and `response` objects; returns updated response with refreshed cookies.

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() not getSession() — verifies JWT signature
  await supabase.auth.getUser()

  return supabaseResponse
}
```

---

### `src/lib/dal.ts` (utility, request-response)

**Analog:** `src/lib/utils.ts` (utility wrapper pattern) — plus `server-only` guard.

**Imports pattern (`src/lib/utils.ts` lines 1–2) — adapt:**
```typescript
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
```

**Core pattern:** `getUser()` wrapped in `React.cache()` so repeated calls within the same RSC render tree are deduplicated.

```typescript
// src/lib/dal.ts
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user   // null if not authenticated
})
```

**Critical constraint:** Never call `getSession()`. `getUser()` is the only authorized identity source server-side. DAL is `server-only` — importing it in a Client Component throws a build error by design.

---

### `proxy.ts` (middleware, request-response)

**Analog:** None in codebase. No `middleware.ts` or `proxy.ts` exists yet.

**Pattern source:** CONTEXT.md spec + Next.js 16 convention (file must be named `proxy.ts` at root, not `middleware.ts`).

```typescript
// proxy.ts  (root of repo, next to package.json — NOT in src/)
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*'],
}
```

**Critical constraint (from CONTEXT.md):** File must be named `proxy.ts`, not `middleware.ts` — Next.js 16 renamed the convention. Wrong name = proxy never runs.

---

### `src/app/auth/confirm/route.ts` (route handler, request-response)

**Analog:** None in codebase. No route handlers exist yet.

**Pattern source:** CONTEXT.md Decision 2 spec. Uses `await cookies()` and `NextResponse.redirect()`.

```typescript
// src/app/auth/confirm/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | null
  const origin = new URL(request.url).origin

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Token missing, expired, or invalid
  return NextResponse.redirect(`${origin}/login?error=link-expired`)
}
```

---

### `src/app/(dashboard)/layout.tsx` (layout, request-response)

**Analog:** `src/app/(marketing)/layout.tsx` — exact match (route-group layout pattern).

**Imports pattern** (`src/app/(marketing)/layout.tsx` lines 1–2):
```typescript
import { TopNav } from "@/components/marketing/top-nav";
import { Footer } from "@/components/marketing/footer";
```

**Skip-link pattern** (`src/app/(marketing)/layout.tsx` lines 11–16):
```tsx
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral-950 focus:border focus:border-neutral-200 focus:rounded-lg"
>
  Lewati ke konten utama
</a>
```

**Layout shell pattern** (`src/app/(marketing)/layout.tsx` lines 4–24):
```tsx
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* skip link */}
      <TopNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
```

**Dashboard adaptation:** Replace `<TopNav />` with `<DashboardNav />`. Remove `<Footer />` (no footer in authenticated area). Layout is a Server Component — call `getUser()` from DAL here and pass `user` as prop to `DashboardNav`.

```tsx
// src/app/(dashboard)/layout.tsx
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { getUser } from "@/lib/dal"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral-950 focus:border focus:border-neutral-200 focus:rounded-lg"
      >
        Lewati ke konten utama
      </a>
      <DashboardNav email={user.email ?? ''} />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  )
}
```

---

### `src/app/(dashboard)/dashboard/page.tsx` (page, request-response)

**Analog:** `src/app/(marketing)/page.tsx` — role-match (Server Component page with metadata and named imports).

**Metadata pattern** (`src/app/(marketing)/page.tsx` lines 1–10):
```typescript
import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";

export const metadata: Metadata = {
  title: "lailit.supply — Komponen kreatif untuk developer Indonesia",
  description: "...",
};

export default function HomePage() {
  return ( ... )
}
```

**Dashboard page adaptation:** Server Component, reads user from DAL (or receives via layout), renders stub card.

```tsx
// src/app/(dashboard)/dashboard/page.tsx
import type { Metadata } from "next"
import { getUser } from "@/lib/dal"
import { DashboardStubCard } from "@/components/dashboard/dashboard-stub-card"

export const metadata: Metadata = {
  title: "Dashboard — lailit.supply",
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

---

### `src/components/dashboard/dashboard-nav.tsx` (component, request-response)

**Analog:** `src/components/marketing/top-nav.tsx` — exact match (nav bar pattern).

**Nav shell pattern** (`src/components/marketing/top-nav.tsx` lines 19–21):
```tsx
<nav className="sticky top-0 z-50 h-16 border-b border-neutral-200 bg-white">
  <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center justify-between">
```

**Logo link pattern** (`src/components/marketing/top-nav.tsx` lines 22–29):
```tsx
<Link
  href="/"
  aria-label="lailit.supply, kembali ke beranda"
  className="text-base font-semibold text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 rounded"
>
  lailit.supply
</Link>
```

**Focus-visible pattern** (consistent across `top-nav.tsx` interactive elements):
```
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950
```

**Hover background pattern** (`top-nav.tsx` line 51):
```
hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950
```

**DashboardNav adaptation:** Server Component (receives `email` prop from layout — no `'use client'` needed unless dropdown requires it). Use shadcn `<Avatar>` + `<DropdownMenu>`. Logo links to `/dashboard` not `/`. No hamburger / sheet.

```tsx
// src/components/dashboard/dashboard-nav.tsx
// NOTE: DropdownMenu from @base-ui/react requires 'use client' if used directly.
// Isolate dropdown into a child Client Component: <UserMenu email={email} />
import Link from "next/link"
import { UserMenu } from "./user-menu"   // 'use client' island

type DashboardNavProps = { email: string }

export function DashboardNav({ email }: DashboardNavProps) {
  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-neutral-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 rounded"
        >
          lailit.supply
        </Link>
        <UserMenu email={email} />
      </div>
    </nav>
  )
}
```

---

### `src/app/(marketing)/login/actions.ts` (server action, request-response)

**Analog:** None in codebase. No Server Actions exist yet.

**Pattern source:** CONTEXT.md "Two Magic Link Flows" + React 19 `useActionState` convention referenced in UI-SPEC.md downstream notes.

**Return shape:** Discriminated union for `useActionState` compatibility.

```typescript
// src/app/(marketing)/login/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export type LoginActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export async function signInWithMagicLink(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get('email') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/auth/confirm',
    },
  })

  // Unknown email silently swallowed — always return success (AUTH-01 enumeration protection)
  if (error && error.status !== 400) {
    return { status: 'error', message: 'Ups, ada masalah teknis. Coba lagi.' }
  }

  return { status: 'success' }
}
```

---

## Modified Files

### `src/components/marketing/login-form.tsx` (component, request-response) — MODIFIED

**Analog:** Self — existing file. Current state: `'use client'` with `useState` + `handleSubmit` no-op.

**Existing structure** (`src/components/marketing/login-form.tsx` lines 1–93):
- `'use client'` directive (line 1)
- `useState` for email + errorMessage (lines 13–14)
- `handleSubmit` prevents default (line 16)
- Client-side validation (lines 19–28)
- Card div with heading, subtext, form, submit button (lines 33–93)
- Button uses raw `<button>` tag with Tailwind (lines 80–85) — NOT shadcn `<Button>`

**Phase 2 changes:** Replace `useState` + `handleSubmit` with `useActionState`. Add loading state (Loader2 spinner), success state (form replaced), link-expired alert (server-read from `searchParams`).

**`useActionState` wiring pattern (React 19 — no prior analog, from UI-SPEC):**
```tsx
'use client'
import { useActionState } from 'react'
import { signInWithMagicLink, type LoginActionState } from '@/app/(marketing)/login/actions'
import { Loader2 } from 'lucide-react'

const initialState: LoginActionState = { status: 'idle' }

export function LoginForm({ errorParam }: { errorParam?: string }) {
  const [state, action, isPending] = useActionState(signInWithMagicLink, initialState)

  if (state.status === 'success') {
    return (
      <div ...>
        {/* Success block — heading + body per Copywriting Contract */}
      </div>
    )
  }

  return (
    <div className="w-full max-w-[420px] bg-neutral-50 border border-neutral-200 rounded-[12px] p-8 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_4px_12px_rgba(10,10,10,0.04)]">
      {/* Heading + subtext — UNCHANGED from Phase 1 */}
      {errorParam === 'link-expired' && <LoginErrorAlert />}
      <form action={action} noValidate className="mt-8">
        {/* Input — same classes as Phase 1 */}
        <button
          type="submit"
          disabled={isPending}
          className={`mt-4 w-full inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${
            isPending
              ? 'bg-neutral-800 text-white cursor-not-allowed'
              : 'bg-neutral-950 text-white hover:bg-neutral-800 active:bg-neutral-900'
          }`}
          aria-disabled={isPending}
        >
          {isPending
            ? <><Loader2 size={16} className="animate-spin mr-2" aria-label="Memuat" role="status" />Mengirim...</>
            : 'Kirim Magic Link'}
        </button>
      </form>
    </div>
  )
}
```

**Key diff from Phase 1:** `handleSubmit` → `action={action}` on `<form>`. `useState` for email retained for client-side validation (still needed). `isPending` from `useActionState` drives loading state. Button's raw `<button>` tag pattern preserved (not swapped to shadcn `<Button>` — consistent with Phase 1).

---

## Shared Patterns

### Path Alias
**Source:** `src/lib/utils.ts` line 1 — all imports use `@/` alias.
**Apply to:** All new files.
```typescript
import { ... } from "@/lib/utils"
import { ... } from "@/lib/dal"
import { ... } from "@/lib/supabase/server"
```

### `server-only` Guard
**Apply to:** `src/lib/dal.ts`, `src/lib/supabase/admin.ts`
```typescript
import 'server-only'
// Must be the first line. Build fails if file is imported from a Client Component.
```

### Async `cookies()` Pattern (Next.js 16)
**Apply to:** `src/lib/supabase/server.ts`, `src/app/auth/confirm/route.ts`, `src/lib/supabase/middleware.ts`
```typescript
const cookieStore = await cookies()  // await is MANDATORY — sync call throws in Next.js 16
```

### Focus-Visible Pattern
**Source:** `src/components/marketing/top-nav.tsx` lines 26, 38, 50
**Apply to:** All interactive elements in `dashboard-nav.tsx`
```
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950
```

### Sticky Nav Shell
**Source:** `src/components/marketing/top-nav.tsx` lines 20–22
**Apply to:** `src/components/dashboard/dashboard-nav.tsx`
```tsx
<nav className="sticky top-0 z-50 h-16 border-b border-neutral-200 bg-white">
  <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center justify-between">
```

### Skip Link
**Source:** `src/app/(marketing)/layout.tsx` lines 11–16
**Apply to:** `src/app/(dashboard)/layout.tsx`
```tsx
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral-950 focus:border focus:border-neutral-200 focus:rounded-lg"
>
  Lewati ke konten utama
</a>
```

### Metadata Export Pattern
**Source:** `src/app/(marketing)/page.tsx` lines 1–10 and `src/app/(marketing)/login/page.tsx` lines 1–8
**Apply to:** `src/app/(dashboard)/dashboard/page.tsx`
```typescript
import type { Metadata } from "next";
export const metadata: Metadata = { title: "...", description: "..." };
```

### Card Surface Token
**Source:** `src/components/marketing/login-form.tsx` line 34 and `src/components/marketing/pricing-card.tsx` line 40
**Apply to:** Dashboard stub card, any surface cards.
```
bg-neutral-50 border border-neutral-200 rounded-[12px] p-8
```
Shadow (elevation token) — only for login card and pricing cards, NOT stub card:
```
shadow-[0_1px_2px_rgba(10,10,10,0.04),0_4px_12px_rgba(10,10,10,0.04)]
```

### Typography Scale (extracted from existing components)
**Source:** `src/components/marketing/login-form.tsx` lines 35–40 and `src/components/marketing/pricing-card.tsx` lines 51–68
```
Heading:  text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950
Body:     text-base font-normal leading-[1.5] text-neutral-500
Label:    text-sm font-normal leading-[1.45] text-neutral-950
```

### Test File Structure
**Source:** `src/components/marketing/__tests__/login-form.test.tsx` lines 1–5
**Apply to:** Auth-related unit tests in Phase 2
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentName } from "../component-name";
```

---

## No Analog Found

Files with no close match in the codebase — planner should use CONTEXT.md spec patterns directly:

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `proxy.ts` | middleware | request-response | No middleware/proxy files exist; first in project. File location is repo root, not `src/`. |
| `src/app/auth/confirm/route.ts` | route handler | request-response | No route handlers exist; first `route.ts` in project. |
| `src/app/(marketing)/login/actions.ts` | server action | request-response | No Server Actions exist; first `actions.ts` in project. |

---

## Metadata

**Analog search scope:** `/Users/calvinlai/Desktop/lailit.supply/src/`
**Files scanned:** 20 source files
**Pattern extraction date:** 2026-05-06
**Next.js version:** 16.2.4 (breaking changes: `proxy.ts`, async `cookies()`/`headers()`/`params`)
**React version:** 19.2.4 (`useActionState` available, not deprecated `useFormState`)
**Supabase packages installed:** None yet — `@supabase/ssr` and `@supabase/supabase-js` must be added before Phase 2 execution.
**`server-only` package installed:** Not yet — must be added (`npm install server-only`).
