# Architecture Research

**Domain:** Subscription-based component library SaaS (paywalled MDX gallery)
**Researched:** 2026-05-05
**Confidence:** HIGH (Next.js 16 docs read locally; Supabase via Context7; Mayar via official docs)

> **CRITICAL VERSION NOTE.** Project ships on **Next.js 16.2.4 + React 19.2.4** — not Next.js 15 as PROJECT.md states. Three breaking renames vs. older training data drive much of this architecture:
> 1. **Middleware → Proxy.** File is `proxy.ts` (root or `src/`); export named `proxy` or default. (Source: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.)
> 2. **`cookies()` and `headers()` are async.** Always `await cookies()`. (Source: same docs throughout.)
> 3. **Cache Components + `unstable_instant`.** Suspense alone no longer guarantees instant client navigation under shared layouts; routes that should navigate instantly must export `unstable_instant`. Validation runs at dev/build time. (Source: `02-guides/instant-navigation.md`, repeated AI-agent hint at top of `index.md`, `06-fetching-data.md`, `08-caching.md`.)
>
> Throughout this document, "Proxy" means the Next.js 16 file and "middleware" is avoided.

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React 19 client)                     │
│  ┌────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Public marketing pages │  │ Dashboard (authed) — RSC + Client   │  │
│  │ /, /pricing, /legal/*  │  │ shells, command-K (cmdk), copy btns │  │
│  └────────────────────────┘  └─────────────────────────────────────┘  │
└──────────────────────────────────────────────┬───────────────────────┘
                                               │ HTTPS
┌──────────────────────────────────────────────┴───────────────────────┐
│                  VERCEL (Next.js 16 App Router, Node runtime)         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  proxy.ts — optimistic auth check (cookie-only, no DB call)    │  │
│  │  Reads sb-* cookie, refreshes Supabase session, redirects      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐ │
│  │ Server     │ │ Route       │ │ Server      │ │ Build-time MDX   │ │
│  │ Components │ │ Handlers    │ │ Actions     │ │ collection       │ │
│  │ (default)  │ │ /api/*      │ │ ('use server')│ │ (fs glob + zod)│ │
│  └────────────┘ └─────────────┘ └─────────────┘ └──────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Data Access Layer (DAL) — verifySession() + getEntitlement()  │  │
│  │  cache()-memoised, "server-only", single source of authz truth │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────┬─────────────────────┬──────────────────────┬─────────────────┘
       │                     │                      │
┌──────┴───────┐    ┌────────┴────────┐    ┌────────┴────────┐
│ Supabase     │    │ Resend          │    │ Mayar.id        │
│ Postgres+RLS │    │ (transactional  │    │ (checkout +     │
│ +Auth (OTP)  │    │ + magic-link    │    │ webhooks +      │
│              │    │ envelopes)      │    │ customer portal)│
└──────────────┘    └─────────────────┘    └─────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                          CONTENT (in-repo)                            │
│  content/resources/<slug>/index.mdx (frontmatter + 5 code blocks)     │
│  Parsed at build time; thumbnails as .avif under /public/r/<slug>/    │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `proxy.ts` | Refresh Supabase session cookies, optimistic redirect for `/dashboard/*`, set `x-pathname` header for layout. **Cookie reads only — no DB.** | `@supabase/ssr` `createServerClient` with `getAll`/`setAll` cookie handlers; `getUser()` early to trigger refresh |
| Server Components | Default rendering; fetch resource lists, user profile, saved items via DAL | `async` RSC + `await verifySession()` + Supabase query |
| Route Handlers (`app/api/**/route.ts`) | Webhook ingress, auth callbacks, copy-tracking pings | `export async function POST(request: NextRequest)`; `Response.json()` |
| Server Actions (`'use server'`) | Save/unsave bookmark, increment view count, request magic link | Re-verify session inside action body before mutation |
| Data Access Layer | Centralised authz + Supabase queries; the **only** module allowed to talk to DB from RSC | `import 'server-only'`, React `cache()` for per-render memoization |
| MDX Content Loader | Walks `content/resources/`, validates frontmatter with Zod, returns typed manifest | Uses `fs/promises` + `gray-matter`; runs at build time inside RSC |
| Supabase | Postgres (with RLS), Auth (OTP magic link), realtime (not needed at MVP) | `@supabase/ssr` for SSR; `@supabase/supabase-js` for admin in webhook handler |
| Resend | Sends transactional + custom magic-link emails (welcome after webhook) | Server-side only; called from Route Handler |
| Mayar.id | Checkout pages (hosted), recurring billing, customer portal, **outbound webhooks** | Configure webhook URL: `/api/webhooks/mayar/<rotatable-token>` |

---

## Recommended Project Structure

```
lailit.supply/
├── app/
│   ├── (marketing)/               # Route group: public, no auth, prerendered
│   │   ├── layout.tsx             # Marketing chrome (header/footer)
│   │   ├── page.tsx               # / — landing
│   │   ├── pricing/page.tsx       # /pricing
│   │   ├── components/page.tsx    # /components — free-tier browse, public
│   │   └── legal/
│   │       ├── terms/page.tsx
│   │       └── privacy/page.tsx
│   ├── (dashboard)/               # Route group: authed
│   │   ├── layout.tsx             # Dashboard chrome; auth check via DAL
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Browse all (free + premium-locked)
│   │   │   ├── saved/page.tsx     # User bookmarks
│   │   │   └── [slug]/page.tsx    # Resource detail (dynamic MDX)
│   │   └── billing/page.tsx       # Mayar customer portal redirect
│   ├── (auth)/                    # Route group: login flow
│   │   ├── login/page.tsx         # Email input → request magic link
│   │   ├── auth/callback/route.ts # GET — exchanges OTP code for session
│   │   └── auth/verify/page.tsx   # "Check your email"
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── mayar/[token]/route.ts   # Token in path = secret
│   │   ├── auth/
│   │   │   └── signout/route.ts
│   │   └── resources/
│   │       └── view/route.ts            # POST — track view (trending sort)
│   ├── layout.tsx                 # Root layout: <html>, fonts, providers
│   ├── globals.css                # Tailwind v4
│   ├── not-found.tsx
│   └── error.tsx
├── proxy.ts                       # ROOT — Next.js 16 Proxy (was middleware.ts)
├── mdx-components.tsx             # ROOT — required for @next/mdx
├── content/
│   └── resources/
│       └── <slug>/
│           ├── index.mdx          # Frontmatter + body
│           ├── thumb.avif
│           ├── preview.mp4        # ≤ 2 MB, muted autoplay
│           ├── framer.tsx         # Per-format code (imported as raw string)
│           ├── webflow.html
│           ├── vanilla.html
│           ├── jsx.jsx
│           └── tsx.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts              # createServerClient for RSC/Route Handler
│   │   ├── browser.ts             # createBrowserClient (singleton)
│   │   ├── proxy.ts               # createServerClient for proxy.ts (writeable cookies)
│   │   └── admin.ts               # service-role client (server-only, webhooks)
│   ├── dal/
│   │   ├── session.ts             # verifySession(), getUser()
│   │   ├── entitlement.ts         # getEntitlement() — premium gate
│   │   ├── resources.ts           # listResources(), getResource(slug)
│   │   └── saved.ts               # listSaved(), saveResource(), unsaveResource()
│   ├── mayar/
│   │   ├── webhook.ts             # parseEvent(), recordIdempotent()
│   │   └── tier.ts                # productId → membership_tier mapping
│   ├── content/
│   │   ├── load.ts                # listAllResources() — build-time MDX scan
│   │   ├── frontmatter.ts         # Zod schema for frontmatter
│   │   └── code-loader.ts         # readFormatCode(slug, format)
│   ├── email/
│   │   └── magic-link.ts          # Resend sender wrapping admin.generateLink()
│   └── search/
│       └── manifest.ts            # Build trending/search manifest
├── components/                    # UI components (Client + Server)
│   ├── ui/                        # shadcn/ui primitives
│   ├── resource/
│   │   ├── card.tsx               # RSC — gallery tile
│   │   ├── code-tabs.tsx          # 'use client' — format switcher + copy
│   │   └── lock-overlay.tsx       # Premium gate UI
│   └── command-k.tsx              # 'use client' — cmdk integration
├── types/
│   └── db.ts                      # Generated by `supabase gen types typescript`
├── supabase/
│   ├── migrations/                # SQL migrations
│   └── seed.sql
├── next.config.ts
├── package.json
└── .env.local
```

### Structure Rationale

- **Route groups `(marketing)`, `(dashboard)`, `(auth)`:** Lets each segment own its own layout without polluting URL paths. Dashboard layout enforces auth; marketing layout is fully prerenderable.
- **`proxy.ts` at root (not `src/`):** Project does not currently use `src/`. Next.js 16 supports either, but co-locating with `app/` and `package.json` is canonical and matches the docs example.
- **`content/resources/<slug>/` co-locates assets with MDX:** Avoids slug-mismatch bugs, makes git diffs reviewable per-resource, and lets `import code from './tsx.tsx?raw'` (or `fs.readFile`) cleanly fetch per-format code.
- **`lib/dal/` is the single Supabase entry point from RSC:** Per Next.js auth guide, every secure auth/data check should live here, wrapped in React `cache()`. This prevents the classic "I forgot to check auth in this one route" bug.
- **`lib/supabase/admin.ts` is `import 'server-only'`:** Service-role key must never reach the client. Admin client is only used inside webhook Route Handler and the magic-link email sender.
- **`mdx-components.tsx` at root:** Required by `@next/mdx` for App Router — won't work otherwise (per docs).

---

## Architectural Patterns

### Pattern 1: Optimistic auth in Proxy + secure check in DAL

**What:** Use `proxy.ts` only to (a) refresh Supabase session cookies on every request and (b) do *cheap* cookie-only redirects. Do the *real* authorization in the DAL where each query lives. This is the explicit recommendation in `02-guides/authentication.md`.

**When to use:** Every route in this app. It's not optional — Supabase SSR sessions need refreshing in proxy or they expire silently.

**Trade-offs:** Two layers of code, but the alternative (DB call inside proxy on every request, including prefetches) costs ~50 ms × every link prefetch and breaks Cache Components prerendering.

**Example:**

```typescript
// proxy.ts (root)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED = ['/dashboard']

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // CRITICAL: getUser() refreshes the session — not getSession()
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED.some((p) => path.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|avif|mp4)$).*)'],
}
```

```typescript
// lib/dal/entitlement.ts — the SECURE check
import 'server-only'
import { cache } from 'react'
import { createSupabaseRSC } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const getEntitlement = cache(async () => {
  const supabase = await createSupabaseRSC()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('membership_tier, membership_status, membership_expires_at, lifetime_purchased')
    .eq('id', user.id)
    .single()

  const now = new Date()
  const isPremium =
    data?.lifetime_purchased === true ||
    (data?.membership_status === 'active' &&
      data?.membership_expires_at &&
      new Date(data.membership_expires_at) > now)

  return { user, isPremium, tier: data?.membership_tier ?? 'free' }
})
```

### Pattern 2: Build-time MDX manifest + per-request code lookup

**What:** Scan `content/resources/**/index.mdx` once at build time to build a typed manifest (slug, title, frontmatter, available formats). The manifest lives in memory of the static gallery page. Per-format code blocks are read on-demand via `fs.readFile` inside the resource detail RSC (or imported with `?raw` query if the bundler is configured for it).

**When to use:** MVP with ≤ 1000 resources. Above that, you want a database-backed search index (Algolia, Meilisearch, Postgres FTS).

**Trade-offs:** Adding a resource requires a deploy. That's fine for MVP — content is curated, not user-generated. Pro: zero runtime DB reads for the gallery, perfect Lighthouse, full-text CMD-K works offline.

**Example:**

```typescript
// lib/content/load.ts
import 'server-only'
import { cache } from 'react'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { ResourceFrontmatter } from './frontmatter'

export const listAllResources = cache(async () => {
  'use cache'
  const root = path.join(process.cwd(), 'content/resources')
  const slugs = await readdir(root)
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const raw = await readFile(path.join(root, slug, 'index.mdx'), 'utf8')
      const { data } = matter(raw)
      return ResourceFrontmatter.parse({ ...data, slug })
    }),
  )
  return items.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
})
```

```typescript
// lib/content/frontmatter.ts
import { z } from 'zod'

export const ResourceFrontmatter = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['hero', 'navigation', 'card', 'form', 'animation', 'layout', 'effect']),
  tags: z.array(z.string()).default([]),
  isPremium: z.boolean().default(false),
  formats: z.array(z.enum(['framer', 'webflow', 'vanilla', 'jsx', 'tsx'])).min(1),
  thumbnail: z.string().default('thumb.avif'),
  previewVideo: z.string().optional(),
  publishedAt: z.string(),  // ISO
})
export type ResourceMeta = z.infer<typeof ResourceFrontmatter>
```

```typescript
// app/(dashboard)/dashboard/[slug]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { listAllResources } from '@/lib/content/load'
import { getEntitlement } from '@/lib/dal/entitlement'
import { CodeTabs } from '@/components/resource/code-tabs'
import { LockOverlay } from '@/components/resource/lock-overlay'

export const unstable_instant = { prefetch: 'static' }   // Next.js 16

export async function generateStaticParams() {
  const all = await listAllResources()
  return all.map(({ slug }) => ({ slug }))
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const all = await listAllResources()
  const meta = all.find((r) => r.slug === slug)
  if (!meta) notFound()

  return (
    <article>
      <Suspense fallback={null}>
        <PaywallGate meta={meta} />
      </Suspense>
    </article>
  )
}

async function PaywallGate({ meta }: { meta: ResourceMeta }) {
  if (!meta.isPremium) return <ResourceBody slug={meta.slug} formats={meta.formats} />
  const { isPremium } = await getEntitlement()
  if (!isPremium) return <LockOverlay slug={meta.slug} />
  return <ResourceBody slug={meta.slug} formats={meta.formats} />
}
```

### Pattern 3: Idempotent webhook ingress with token-in-path

**What:** Mayar's webhook docs (verified at https://docs.mayar.id/integration/webhook) describe 7 event types but **do not document a signature header** at time of research. Compensate with: (a) put a long random token in the URL path so only Mayar knows the URL, (b) record every `event.id` (or composite key) in a `webhook_events` table with a unique constraint, ignore duplicates.

**When to use:** Any webhook ingress. Idempotency is non-negotiable — Mayar will retry, and a duplicate `payment.received` must not double-extend membership.

**Trade-offs:** URL-token security is weaker than HMAC; rotate the token if exposed. Add IP allowlisting if Mayar publishes IPs.

**Example:**

```typescript
// app/api/webhooks/mayar/[token]/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { processMayarEvent } from '@/lib/mayar/webhook'

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/webhooks/mayar/[token]'>,
) {
  const { token } = await ctx.params
  if (token !== process.env.MAYAR_WEBHOOK_TOKEN) {
    return new Response('not found', { status: 404 })   // Don't leak existence
  }

  const body = await request.json()
  // Mayar payload: { event: 'payment.received', data: { id, ... } }
  const eventKey = `${body.event}:${body.data?.id}`

  const admin = createSupabaseAdmin()
  const { error: dupeErr } = await admin
    .from('webhook_events')
    .insert({ event_key: eventKey, source: 'mayar', payload: body })

  if (dupeErr?.code === '23505') {                       // unique violation
    return NextResponse.json({ status: 'duplicate' })   // 200 — Mayar stops retrying
  }
  if (dupeErr) return NextResponse.json({ error: 'db' }, { status: 500 })

  try {
    await processMayarEvent(body, admin)
    await admin.from('webhook_events').update({ processed_at: new Date().toISOString() }).eq('event_key', eventKey)
    return NextResponse.json({ status: 'ok' })
  } catch (e) {
    // Leave row un-processed; Mayar will retry; we'll de-dupe on next attempt
    return NextResponse.json({ error: 'processing' }, { status: 500 })
  }
}
```

### Pattern 4: Magic link via Resend (custom envelope) + Supabase admin link generation

**What:** Two valid options:
1. **Simple:** Call `supabase.auth.signInWithOtp({ email })` from a Server Action. Supabase Auth sends the email itself (configure SMTP to point at Resend in Supabase dashboard).
2. **Branded:** After webhook creates user, call `admin.generateLink({ type: 'magiclink', email })`, then send via Resend with your own branded template.

For lailit.supply, **option 2 is recommended** because the webhook flow needs to create the account *and* trigger the email in one server-side step — there's no client-side request to call `signInWithOtp` from.

**When to use:** Option 2 whenever you need full email branding control or a non-interactive "post-payment" flow.

**Trade-offs:** Option 2 = more code; you own the deliverability and templating. Option 1 = less control, but Supabase handles bounce tracking.

**Example:**

```typescript
// lib/email/magic-link.ts
import 'server-only'
import { Resend } from 'resend'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export async function sendWelcomeMagicLink(email: string) {
  const admin = createSupabaseAdmin()

  // 1. Create user idempotently (or fetch existing)
  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
  // ...lookup by email; create if missing with email_confirm: true...

  // 2. Generate one-time magic link
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  })
  if (error) throw error

  // 3. Send via Resend with branded template
  const resend = new Resend(process.env.RESEND_API_KEY!)
  await resend.emails.send({
    from: 'lailit.supply <hello@lailit.supply>',
    to: email,
    subject: 'Welcome to lailit.supply — sign in',
    react: WelcomeEmail({ magicLink: data.properties.action_link }),
  })
}
```

### Pattern 5: Free vs. premium browse with unified routing

**What:** A single `/components` route renders the entire library. Premium tiles render with a lock badge to non-members; clicking them goes to `/dashboard/[slug]` which itself decides whether to show body or `LockOverlay`. **Don't** create `/components/free` and `/components/premium` — that's a routing anti-pattern that fragments SEO and confuses users.

**When to use:** Always. Lock state is a UI concern, not a routing concern.

**Trade-offs:** Slightly more work in the card component to render two states, but pays off enormously in URL stability and content marketing (one canonical URL per resource).

---

## Data Flow

### Request Flow — Public gallery view

```
GET /components
    │
    ├─► proxy.ts: refresh session cookie (no-op if not signed in), fall through
    │
    ├─► (marketing)/components/page.tsx (RSC)
    │       │
    │       ├─► listAllResources() — cache(), reads MDX from disk at build
    │       │   under 'use cache' so it's prerendered for first request
    │       │
    │       └─► <Suspense> per category section if needed
    │
    └─► HTML streamed; cmdk client island hydrates with manifest as JSON island
```

### Request Flow — Premium resource detail

```
GET /dashboard/animated-hero  (signed-in member)
    │
    ├─► proxy.ts: refresh session; check cookie present → continue
    │
    ├─► (dashboard)/dashboard/[slug]/page.tsx (RSC)
    │       │
    │       ├─► params.slug → listAllResources() → meta lookup
    │       │
    │       ├─► <Suspense fallback={skeleton}>
    │       │     PaywallGate (RSC)
    │       │       └─► getEntitlement() — DAL, cache()-memo'd
    │       │             └─► supabase.auth.getUser() (verified, cookie-authed)
    │       │             └─► SELECT membership_* FROM users WHERE id = $1
    │       │       └─► isPremium ? <ResourceBody/> : <LockOverlay/>
    │       └─► </Suspense>
    │
    └─► <ResourceBody> reads per-format code via fs, passes to <CodeTabs> client island
```

### Webhook Flow — User pays for the first time

```
Mayar.id (after QRIS/e-wallet auth)
    │
    │ POST /api/webhooks/mayar/<TOKEN>
    │ { event: 'membership.newMemberRegistered', data: { id, customerEmail, productId, ... } }
    ▼
Route Handler (Node runtime)
    │
    ├─► Validate URL token vs. env var
    ├─► INSERT webhook_events(event_key=event:data.id) — UNIQUE catches retries
    ├─► processMayarEvent():
    │     ├─► tier = mapProductToTier(data.productId)         // monthly | lifetime
    │     ├─► UPSERT users(email=customerEmail) — get user id
    │     ├─► UPDATE users SET membership_tier=tier,
    │     │       membership_status='active',
    │     │       membership_expires_at = (tier === 'monthly' ? now + 30d : null),
    │     │       lifetime_purchased = (tier === 'lifetime')
    │     ├─► sendWelcomeMagicLink(email)  → Resend → user inbox
    │     └─► UPDATE webhook_events SET processed_at = now()
    │
    └─► 200 { status: 'ok' }
```

### State Management

```
Server state (source of truth):
    Supabase Postgres ── DAL ── React cache() per render ── RSC tree
                                                              │
                                                              ▼
                                            React Server Component Payload
                                                              │
                                                              ▼
Client state (ephemeral):                              Browser DOM
    React useState / useReducer in Client islands
    (e.g. CodeTabs active format, cmdk open/closed,
    optimistic save toggle)

Cross-cutting:
    Saved-resource toggle ── Server Action ── DAL.saveResource()
                                ▲                  │
                                │                  ▼
                          revalidatePath('/dashboard/saved')
```

### Key Data Flows

1. **Resource list:** Build-time MDX scan → JSON manifest → RSC renders gallery → client prefetches detail pages on hover → manifest doubles as cmdk index.
2. **Entitlement check:** Cookie → proxy refreshes → RSC calls `getEntitlement()` → Supabase `users` row → boolean → branch UI. Cached per render via `cache()`.
3. **Payment → access:** Mayar checkout → webhook → users row updated → magic link sent → user clicks → `/auth/callback` exchanges OTP → cookie set → next request to `/dashboard/*` finds entitlement = true.
4. **Bookmark:** Server Action with `'use server'` → `verifySession()` → INSERT/DELETE `saved_resources` → `revalidatePath` to update the saved page.
5. **Trending sort:** Server Action on resource view → INSERT `resource_views(user_id, slug, viewed_at)` → nightly cron (Vercel Cron) computes rolling 7-day count → writes to `resource_trending(slug, score)` → manifest reads at build (V1) or per-request with `use cache` cacheLife('hours') (V2).

---

## Database Schema (Supabase Postgres)

> All tables have **RLS enabled**. The service-role key (admin) is the *only* identity allowed to write `users.membership_*`, `webhook_events`, and `resource_trending`.

```sql
-- 1. users — extends auth.users (Supabase manages auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  mayar_customer_id text unique,
  membership_tier text check (membership_tier in ('free','monthly','lifetime')) default 'free',
  membership_status text check (membership_status in ('active','past_due','cancelled','expired')) default 'active',
  membership_expires_at timestamptz,             -- null for lifetime/free
  lifetime_purchased boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.users enable row level security;

create policy "users_self_select" on public.users
  for select using ((select auth.uid()) = id);

-- No INSERT/UPDATE policy for end-users → only service role mutates.

-- 2. saved_resources — bookmarks
create table public.saved_resources (
  user_id uuid references public.users(id) on delete cascade,
  resource_slug text not null,
  saved_at timestamptz default now(),
  primary key (user_id, resource_slug)
);
alter table public.saved_resources enable row level security;

create policy "saved_self_all" on public.saved_resources
  for all using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id);

create index on public.saved_resources(user_id, saved_at desc);

-- 3. webhook_events — idempotency
create table public.webhook_events (
  id bigserial primary key,
  event_key text not null unique,                -- e.g. 'payment.received:abc123'
  source text not null check (source in ('mayar')),
  payload jsonb not null,
  received_at timestamptz default now(),
  processed_at timestamptz,
  error text
);
alter table public.webhook_events enable row level security;
-- No policies → only service role accesses.

-- 4. resource_views — for trending sort
create table public.resource_views (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete set null,
  resource_slug text not null,
  viewed_at timestamptz default now()
);
alter table public.resource_views enable row level security;
-- INSERT-only for authed users; reads only by admin/cron.
create policy "views_self_insert" on public.resource_views
  for insert with check ((select auth.uid()) = user_id);
create index on public.resource_views(resource_slug, viewed_at desc);

-- Optional materialised aggregate (refreshed nightly)
create table public.resource_trending (
  resource_slug text primary key,
  score_7d int default 0,
  score_30d int default 0,
  updated_at timestamptz default now()
);
alter table public.resource_trending enable row level security;
create policy "trending_public_read" on public.resource_trending for select using (true);
```

**Generated TS types:** Run `supabase gen types typescript --project-id <id> --schema public > types/db.ts` after every migration.

---

## Content Architecture (MDX)

### Frontmatter Schema (YAML)

```yaml
---
title: "Animated Hero with Parallax"
description: "Multi-layer parallax hero section with scroll-triggered animations."
category: "hero"
tags: ["scroll", "parallax", "gsap"]
isPremium: true
formats: ["framer", "webflow", "vanilla", "jsx", "tsx"]
thumbnail: "thumb.avif"          # relative to this resource folder
previewVideo: "preview.mp4"       # optional, ≤ 2 MB
publishedAt: "2026-05-01"
---
```

The MDX body is the *description page*: usage notes, dependencies, customization tips. Code blocks are **not** in the MDX body — they're separate files in the same folder, loaded on demand by `code-loader.ts`. This:
- Keeps MDX small and reviewable.
- Lets you syntax-highlight per-language correctly with `rehype-pretty-code`.
- Allows `?raw` imports or `fs.readFile` without parsing concerns.
- Eliminates the "1500-line MDX with 5 fenced code blocks" problem.

### Serving Code Per Format

Two approaches, both server-only:

**Approach A — `fs.readFile` (recommended, simplest):**

```typescript
// lib/content/code-loader.ts
import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const FORMAT_FILES = {
  framer: 'framer.tsx',
  webflow: 'webflow.html',
  vanilla: 'vanilla.html',
  jsx: 'jsx.jsx',
  tsx: 'tsx.tsx',
} as const

export async function readFormatCode(slug: string, format: keyof typeof FORMAT_FILES) {
  const file = path.join(process.cwd(), 'content/resources', slug, FORMAT_FILES[format])
  return readFile(file, 'utf8')
}
```

The detail page reads only the format the user clicks (lazy):

```typescript
// app/(dashboard)/dashboard/[slug]/page.tsx
const initialFormat = meta.formats[0]
const code = await readFormatCode(slug, initialFormat)
return <CodeTabs slug={slug} formats={meta.formats} initialCode={code} initialFormat={initialFormat} />
```

`<CodeTabs>` is `'use client'` — when the user switches tabs, it calls a Server Action `getCode(slug, format)` to fetch the next format. Result is then highlighted with Shiki on the server (or in a Web Worker on the client) and displayed.

**Approach B — Webpack `?raw` imports:** Cleaner but requires bundler config. Skip for MVP.

---

## Auth Flow Detail (with sequence)

```
1. User on /pricing clicks "Subscribe Monthly"
   → href="https://mayar.id/checkout/<your-product-id>"

2. Mayar handles checkout (QRIS / OVO / DANA / bank transfer)
   → On success, Mayar POSTs to /api/webhooks/mayar/<TOKEN>

3. Route Handler:
   - Validates token, idempotency
   - Upserts user (admin.createUser w/ email_confirm:true if new)
   - Updates users.membership_*
   - Calls admin.generateLink({type:'magiclink', email})
   - Sends branded Resend email with action_link

4. User opens email, clicks "Sign in to lailit.supply"
   → Browser visits Supabase magic link URL
   → Supabase verifies, redirects to /auth/callback?code=<otp>

5. /auth/callback (Route Handler):
   - supabase.auth.exchangeCodeForSession(code)
   - Supabase SSR sets sb-* cookies
   - 303 redirect to /dashboard

6. Subsequent /dashboard/* requests:
   - proxy.ts refreshes cookies (token rotation handled by @supabase/ssr)
   - DAL getEntitlement() returns isPremium=true
   - Premium MDX body renders
```

> **Server Components vs. Client for sessions:** `supabase.auth.getUser()` works in both, but **prefer Server Components** as the source of truth. Client-side hydration of session is only for things like real-time UI badges. *Never* trust `useSession()`-style hooks for authorization decisions.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0–1k users / 100 resources** | Current design works as-is. MDX manifest in memory, Supabase free tier, Vercel Hobby. Build time stays under 30 s. |
| **1k–10k users / 500 resources** | Move from MDX-in-repo to `mdx-bundler` with build cache. Add Postgres FTS index for search (replace cmdk's in-memory index). Move thumbnails to Supabase Storage or Cloudflare R2 with `next/image` loader. Enable Cache Components and `use cache` aggressively. Move resource_views aggregation to Supabase scheduled function (cron). |
| **10k+ users / 1000+ resources** | Split content out of repo into a headless CMS (Sanity/Contentful) or a CMS-backed MDX serve via Edge Config. Move trending/search to Algolia or Meilisearch. Add Redis (Upstash) for rate limits, hot data caching. Consider edge runtime for marketing pages. |

### Scaling Priorities (likely bottlenecks, in order)

1. **Search latency in cmdk.** In-memory manifest works to ~500 resources, then JSON ships > 100 KB to client. Fix: server-side fuzzy search via Postgres trigram (`pg_trgm`) and Server Action.
2. **Webhook throughput.** Mayar may retry aggressively. Fix: keep handler under 1 s, push slow work (Resend send, audit log) to a background queue (Supabase queue / Vercel cron).
3. **Build time.** MDX manifest grows linearly. Fix: incremental builds with content-source caching; move to ISR/`use cache` per slug; eventually CMS.
4. **Postgres connection limits on Supabase free tier (60).** Fix: use Supabase pooler URL (port 6543 / pgbouncer), not direct (5432).

---

## Anti-Patterns

### Anti-Pattern 1: Calling Supabase from a Layout for auth

**What people do:** Put `getUser()` in `app/(dashboard)/layout.tsx` and assume every nested page is now protected.
**Why it's wrong:** Per the Next.js docs (`02-guides/authentication.md`), layouts do **not** re-render on every navigation under partial rendering. A user whose session was revoked mid-session can keep clicking through dashboard routes if the only check is in the layout. Also, Server Actions and Route Handlers bypass layouts entirely.
**Do this instead:** Put the check in a DAL function (`getEntitlement()`), call it from each page's RSC and from every Server Action / Route Handler that touches user data.

### Anti-Pattern 2: Doing the entitlement DB lookup inside `proxy.ts`

**What people do:** Read `users.membership_*` from Postgres in proxy to decide redirects.
**Why it's wrong:** Proxy runs on **every** request including prefetches, asset misses, and Cache Components static probes. A DB call per prefetch destroys navigation latency and balloons Supabase usage. Per Next.js 16 docs: "Proxy is not intended for slow data fetching."
**Do this instead:** Proxy reads the cookie only (cheap optimistic check). The DAL does the DB-backed verification at render time.

### Anti-Pattern 3: Storing premium code in the public bundle

**What people do:** Import all per-format code with `import code from './tsx?raw'` in the gallery RSC and ship the JSON to the client.
**Why it's wrong:** Even though Server Components don't ship server modules to the client, careless `'use client'` boundaries leak data via props. A premium TSX file ending up in `__NEXT_DATA__` or RSC payload defeats the paywall in seconds.
**Do this instead:** Only fetch code *after* `getEntitlement()` returns `isPremium === true`, and only for the requested format. Strip the field from any data passed to client islands. Use React's `taintUniqueValue` if paranoid.

### Anti-Pattern 4: Trusting `getSession()` for auth decisions

**What people do:** `const { data: { session } } = await supabase.auth.getSession()` then check `session?.user?.id`.
**Why it's wrong:** Per Supabase SSR docs (verified via Context7): `getSession()` reads cookies *without verification*. The user object can be spoofed by anyone who controls the browser. `getUser()` round-trips to Supabase Auth and verifies the JWT.
**Do this instead:** Use `getUser()` in *every* server-side authorization check. Reserve `getSession()` for client-side UI hints only.

### Anti-Pattern 5: Mixing free and premium routes (`/components/free`, `/dashboard/premium/[slug]`)

**What people do:** Route premium content under a separate URL prefix.
**Why it's wrong:** SEO fragmentation, marketing teams can't link to a single canonical URL, you can't change a resource from free→premium without breaking links, and screenshots posted on Twitter become dead URLs after pricing changes.
**Do this instead:** One URL per resource (`/components/[slug]` if browseable, `/dashboard/[slug]` if behind login). Premium status is a UI state, not a routing concern.

### Anti-Pattern 6: Webhook handler that does its work synchronously and slowly

**What people do:** Single handler does: validate → DB upsert → admin.generateLink → Resend send → respond.
**Why it's wrong:** If Resend is slow (or rate-limited), Mayar times out, retries, and you double-process.
**Do this instead:** Idempotency record FIRST (`webhook_events` insert), then quickly mark "received". Do the user creation + email send in a try block; if it fails, leave row un-processed and rely on Mayar retry. Even better: kick off the email send via Vercel cron / Supabase queue and return 200 immediately.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `@supabase/ssr` `createServerClient` in proxy + RSC + Route Handlers; `createBrowserClient` for client islands | **Always `getUser()`** for authz, never `getSession()`. Pooler URL on Vercel. |
| Supabase Postgres | Direct via Supabase JS client wrapped in DAL functions; service-role only for webhook & magic-link admin ops | RLS enabled on every table; admin client `import 'server-only'` |
| Mayar.id | Outbound webhooks → `/api/webhooks/mayar/[token]`. Hosted checkout pages linked from `/pricing`. Customer portal redirect from `/billing` | URL-token auth (no documented HMAC); idempotency via `webhook_events.event_key` unique constraint; 7 documented event types |
| Resend | Server-side `Resend` SDK only; called from Route Handler/Server Action | Configure SPF/DKIM/DMARC for `lailit.supply` before launch |
| Vercel | Default Node runtime for proxy + handlers; static for marketing routes | Set `MAYAR_WEBHOOK_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` in env |
| Discord | Out of band — invite link in welcome email + dashboard | No webhook integration at MVP |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client island ↔ Server | React Server Actions (preferred) or Route Handlers | Client never imports `lib/supabase/admin` or `lib/dal/*` — TypeScript will type-error and `import 'server-only'` will throw at build time |
| RSC ↔ Database | Always via `lib/dal/*`. No raw `supabase.from(...)` in page files | One module = one source of authz truth |
| Proxy ↔ Database | None. Proxy reads cookies only | Proxy uses Supabase only to refresh tokens, not to query app tables |
| Webhook handler ↔ App | Handler uses admin client; writes to `users` and `webhook_events` only | DAL is reserved for user-context queries |
| MDX content ↔ Database | None. Content is filesystem; database tracks views/saves *referencing* slugs | `resource_slug` is a string FK to filesystem; missing-slug view rows are tolerated and ignored |

---

## Sources

**Local Next.js 16.2.4 documentation (read in full):**
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` — Proxy file convention (renamed from middleware)
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md` — DAL pattern, optimistic Proxy, layouts pitfall
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md` — `unstable_instant` requirement
- `node_modules/next/dist/docs/01-app/02-guides/mdx.md` — `@next/mdx`, `mdx-components.tsx`, `generateStaticParams`
- `node_modules/next/dist/docs/01-app/02-guides/redirecting.md`

**Context7 (HIGH confidence — current):**
- `/supabase/ssr` — `createServerClient` patterns for Next.js App Router, async cookies, `getUser()` vs `getSession()`
- `/supabase/supabase-js` — `signInWithOtp`, `auth.admin.generateLink`, `auth.admin.createUser`
- `/supabase/supabase` — RLS patterns with `auth.uid()`, table policies

**Mayar.id official docs (MEDIUM confidence — official source but signature verification undocumented):**
- https://docs.mayar.id/integration/webhook — 7 event types, JSON payload structure
- https://docs.mayar.id/api-reference/webhook/registerurlhook — webhook registration API

---

*Architecture research for: lailit.supply (paywalled component library SaaS)*
*Researched: 2026-05-05*
