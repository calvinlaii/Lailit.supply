# Stack Research

**Domain:** Subscription SaaS — paywalled creative dev component library (Indonesian/SEA market)
**Researched:** 2026-05-05
**Confidence:** HIGH

---

## Critical Environment Note

The codebase ships with **Next.js 16.2.4 + React 19.2.4** (verified in `package.json`). This is materially different from training data assumptions:

- **`middleware.ts` → `proxy.ts`** (renamed in Next.js 16; functionality unchanged but file name and exported function are now `proxy`)
- **`cookies()`, `headers()`, `params` are async** — must `await` them in Server Components, Route Handlers, and Proxy
- **Turbopack is the default bundler** (affects which MDX libs are usable without webpack workarounds)
- **Cache Components** model: Route Handlers can be prerendered when they don't access runtime data; opt-in caching for `GET` via `export const dynamic = 'force-static'` or `use cache` for helper functions (cannot be used directly inside route handler body)
- **`RouteContext<'/users/[id]'>`** is a generated global helper for typed route params

Source: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`, `16-proxy.md`, `02-guides/authentication.md`, `02-guides/mdx.md`.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | `16.2.4` (already installed) | App Router framework on Vercel | Confirmed by user; Cache Components model + `proxy.ts` pattern fits paywall + auth refresh |
| React | `19.2.4` (already installed) | Server Components + `useActionState` | Required peer of Next 16; Server Actions for forms |
| TypeScript | `^5` (already installed) | Type safety end-to-end | Standard; required by shadcn/ui CLI |
| Tailwind CSS | `^4` (already installed via `@tailwindcss/postcss`) | Utility-first CSS | v4 uses CSS-first config (`@theme` directive); no `tailwind.config.js` needed; auto content detection |
| Supabase Postgres | hosted (free → Pro $25/mo) | Primary database | Confirmed; generous free tier; built-in Auth |
| Supabase Auth | via `@supabase/ssr` | Magic-link auth + session management | First-party SSR helper; PKCE flow with cookie-based sessions |
| Mayar.id | API + webhooks | Payment processing (IDR/QRIS/e-wallet) | Confirmed; only IDR-native gateway with subscription billing + customer portal |
| Resend | API + React Email | Transactional email | First-party React Email integration; works with Supabase SMTP override or admin-triggered email |
| Vercel | platform | Hosting + edge | Confirmed; first-party Next.js support |

### Auth — Magic Link (Supabase Auth via @supabase/ssr)

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.x` (latest) | Supabase JS client |
| `@supabase/ssr` | `^0.5.x` (latest) | Cookie-based SSR session helpers |

**Why this combination:** `@supabase/ssr` is the only officially supported path for Next.js App Router as of 2026. The older `@supabase/auth-helpers-nextjs` is deprecated. The package handles the cookie dance required because Server Components cannot write cookies — token refresh must happen in `proxy.ts`.

**Two distinct flows are needed for this product:**

1. **Post-payment magic link (server-triggered, the primary flow):**
   - Mayar webhook fires `payment.received` or `membership.newMemberRegistered`
   - Webhook handler calls `supabase.auth.admin.generateLink({ type: 'magiclink', email })` using **service-role key** (server-only)
   - Returns `action_link` — embed it in a Resend-sent React Email template
   - User clicks → redirects to `/auth/confirm?token_hash=...&type=email` route handler
   - Route handler calls `supabase.auth.verifyOtp({ token_hash, type: 'email' })` → session cookie set → redirect to `/dashboard`

2. **Existing user re-login (client-triggered, secondary):**
   - User enters email on `/login` form (Server Action)
   - Server calls `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: '...' } })`
   - User receives email, clicks → same `/auth/confirm` route handler

**Critical security rules (from Supabase docs):**
- **Always use `supabase.auth.getClaims()` or `getUser()` server-side**; never trust `getSession()` for authorization (it reads cookies without verifying JWT signature)
- **Service-role key MUST live behind `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_`)** — never expose to client
- Use the new **publishable key** (`sb_publishable_xxx`) for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy `anon` keys are being deprecated)
- Configure Supabase Magic Link email template to point to: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

**File structure:**
```
lib/supabase/
  client.ts      # createBrowserClient (use in 'use client' components)
  server.ts      # createServerClient (use in Server Components, Server Actions, Route Handlers)
  admin.ts       # createClient with service role key (webhook handlers only — server-only file)
  middleware.ts  # token refresh helper called by proxy.ts
proxy.ts         # NOT middleware.ts — Next.js 16 rename
app/auth/confirm/route.ts  # GET handler that calls verifyOtp
app/api/webhooks/mayar/route.ts  # POST handler for Mayar events
```

### MDX Processing

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@next/mdx` | latest | MDX as pages/imports — official | **PRIMARY** — handles MDX in App Router, supports Turbopack with string-name plugin config |
| `@mdx-js/loader` | latest | Webpack/Turbopack MDX loader | Required peer of `@next/mdx` |
| `@mdx-js/react` | latest | MDX React provider | Required peer of `@next/mdx` |
| `@types/mdx` | latest | TypeScript types | Required for `mdx-components.tsx` |
| `gray-matter` | `^4.x` | Frontmatter parsing for resource metadata | Read MDX frontmatter (title, slug, category, tier, formats, videoId) at build time using `fs` + `globby` |
| `remark-gfm` | latest | GitHub Flavored Markdown | Tables, strikethrough in resource descriptions |
| `rehype-slug` | latest | Auto IDs on headings | Anchor links in resource pages |

**Recommendation: `@next/mdx` + dynamic imports + gray-matter.** Reasoning:

1. **`next-mdx-remote` was archived April 9, 2026 by HashiCorp.** A critical CVE (CVE-2026-0969) allowed arbitrary code execution; v6.0.0 patched it with breaking changes (`blockJS: true` by default), but the project is now read-only and unmaintained. **Do not use.**
2. **Contentlayer is unmaintained** (last meaningful release 2023; FAQ explicitly states maintenance has stalled).
3. **Velite has Turbopack incompatibility issues** — its webpack plugin doesn't run under Turbopack (Next.js 16 default). Workable but requires falling back to webpack for `next dev`/`next build`, which loses the speed benefit.
4. **`@next/mdx` is first-party, Turbopack-compatible, and supports the dynamic import pattern** that fits "100s of MDX files imported by slug" beautifully:

```tsx
// app/dashboard/resources/[slug]/page.tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { default: Resource, metadata } = await import(`@/content/resources/${slug}.mdx`)
  return <Resource />
}

export function generateStaticParams() {
  // Read content/resources/*.mdx with fs+globby, return [{ slug }, ...]
}

export const dynamicParams = false
```

For **frontmatter** (which `@next/mdx` does not natively support), use the **export-based pattern** rather than YAML frontmatter — cleaner type safety:

```mdx
export const metadata = {
  title: "Magnetic Cursor Hover",
  category: "interactions",
  tier: "premium",
  formats: ["framer", "webflow", "html", "jsx", "tsx"],
  videoId: "abc123",
  thumbnail: "/thumbs/magnetic-cursor.avif",
  publishedAt: "2026-05-01"
}
```

For aggregating resources (gallery page, search index), iterate the directory at build time with `fs.readdir` and dynamically import to extract `metadata`. Cache the result with React's `cache` or write a `velite`-style build script that emits `content/resources.json` for the search index.

**Plugin config in Turbopack** must use string names (functions can't be passed across the JS↔Rust boundary):

```js
// next.config.mjs
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: [
      'rehype-slug',
      ['rehype-pretty-code', { theme: 'github-dark' }],
    ],
  },
})
```

### Search — Command-K (under 1000 resources)

| Library | Version | Purpose |
|---------|---------|---------|
| `cmdk` | `^1.x` | Command palette UI primitive (by Paco Coursey, used by Vercel, Linear, Raycast) |
| `fuse.js` | `^7.x` | Fuzzy search engine (zero deps, ~3KB gzip core) |

**Why this combination:**
- `cmdk` ships with built-in fuzzy filtering via `command-score`, but `command-score` is too restrictive for typo tolerance on **multi-format technical resources** (e.g., "framr" should still match "framer"). Pair `cmdk` with **`fuse.js` for the actual scoring**, and pass results to `<Command.List>`.
- For <1000 resources (project's hard cap), client-side Fuse.js responds in 0.1–1ms — no server round-trip needed.
- Algolia/Typesense are overkill for this dataset size and add monthly cost; only worth it past ~10k records.
- Build a static `resources.json` index at build time (from MDX exports) and ship it as `import` so it's served via the standard Next.js static asset pipeline.

**shadcn/ui has a pre-built `<CommandDialog>` wrapper** — install via `npx shadcn@latest add command` and customize the filter function to use Fuse.

**Indexed fields:** `title`, `category`, `formats[]`, `tags[]`. Weight `title` highest. Display thumbnail + format badges in results.

### Video Hosting — Component Previews

**Recommendation: Mux** — with Bunny Stream as cost-conscious fallback if budget pressure emerges.

| Service | Pricing | Verdict |
|---------|---------|---------|
| **Mux** ✅ | Free up to 100,000 minutes delivered/month + $0.015/min stored + $0.045/GB delivered after | **Pick this.** Free tier covers MVP entirely; cleanest DX with `@mux/mux-player-react`; per-title encoding optimization saves 30–50% bandwidth; has MCP server for AI workflows. |
| Cloudflare Stream | $5/1,000 min stored + $1/1,000 min viewed | Simpler pricing math; only worth it if already deep on Cloudflare. |
| Bunny Stream | $0.0055/GB CDN + $0.02/min encoding | ~50% cheaper than Cloudflare; good if you scale to lots of long-form content. Vertical (9:16) encoding is a documented option. |

**Why Mux for this product specifically:**
- Component preview videos are 2–10 seconds, looped, muted — **delivered minutes will be massive but stored minutes minimal**. Mux's per-title encoding crushes the cost on short loops.
- Free 100k delivered min/mo means MVP can run at $0 video cost up to ~5–10k DAUs depending on autoplay loops.
- `MuxPlayer` React component handles HLS, lazy loading, poster frames, and `playsInline` attributes for mobile autoplay out of the box.
- Mux Data analytics (also free tier) gives you per-resource view counts → useful product signal.

**Storage pattern:** Upload via Mux dashboard or API, store the resulting `playbackId` in the MDX frontmatter (`videoId: "abc123xyz"`). Render with `<MuxPlayer playbackId={metadata.videoId} loop muted autoPlay playsInline />`.

**For the AVIF thumbnail/poster:** Use Mux's auto-generated thumbnails (`https://image.mux.com/{playbackId}/thumbnail.webp?time=2`) or upload AVIFs to Vercel (next/image handles AVIF) — both work; AVIF on Vercel is finer-grained control.

### Syntax Highlighting — Code Blocks

| Library | Version | Purpose |
|---------|---------|---------|
| `shiki` | `^1.x` (or `^2.x` if released) | Tokenizer engine — uses VS Code's TextMate grammars |
| `rehype-pretty-code` | `^0.13.x` (latest) | Rehype plugin that wraps Shiki with line numbers, highlighting, diff support, transformers |

**Why this combination:**
- Shiki produces **build-time HTML output** (no client-side highlighter shipped to browser) — zero runtime cost, perfect for a Next.js Server Component MDX pipeline.
- `rehype-pretty-code` adds the features Osmo-style component libraries need: line numbers, highlighted lines via `{1,3-5}` syntax, focused/dimmed code with `{# focus}`, copy button hooks via data attributes, multi-theme (light/dark) via CSS variables.
- Plugs directly into the `@next/mdx` rehype pipeline (configured in `next.config.mjs`).
- Works with Turbopack (string-name plugin config supported as of recent `@next/mdx` versions).

**Avoid:** `react-syntax-highlighter` (Prism-based, ships ~150KB to client, no first-class Tailwind theming), Prism directly (no native dark/light dual theme without hacks).

**Tabs for multi-format code blocks** (Framer / Webflow / HTML / JSX / TSX):
- Use **shadcn/ui `Tabs`** component as the wrapper.
- Each tab renders a Shiki-highlighted block. The shadcn registry includes a `code-block` block at `https://ui.shadcn.com/docs/components/code-block`-style patterns; combine with custom `<Pre>` MDX component override to wire up the per-tab copy button.
- Copy button: native `navigator.clipboard.writeText()` — no library needed (don't pull in `react-copy-to-clipboard`; Browser support is universal).

### UI Components — Dashboard

**Recommendation: shadcn/ui (CLI v3.x).** Confirmed best-in-class for 2026:

- All components updated for **Tailwind v4 + React 19 + Next.js 16**.
- CLI initializes new projects with Tailwind v4 (`@theme` directive, no `tailwind.config.js`).
- Components are **copied into your repo** (not installed as dependencies) → full control, no version-lock pain.
- Built on **Radix UI primitives** for accessibility; you get keyboard nav, screen reader, focus management for free.
- The community ecosystem (shadcn-blocks, shadcn-ui-kit, registry MCP server) provides drop-in dashboard layouts.

**Components needed for this MVP:**
```bash
npx shadcn@latest add \
  button card badge dialog sheet \
  command (for ⌘K palette) \
  tabs (for multi-format code blocks) \
  input form label \
  toast sonner (toast notifications) \
  avatar dropdown-menu \
  skeleton (loading states) \
  scroll-area separator
```

**When NOT shadcn/ui:**
- If building a heavily-branded marketing surface, use raw Tailwind + Framer Motion / Motion One.
- For data tables with virtualization at 10k+ rows, pair shadcn/ui with TanStack Table directly.

### Webhook Handling — Mayar

**Mayar webhook contract (verified from `docs.mayar.id/integration/webhook`):**

| Field | Detail |
|-------|--------|
| Method | `POST` |
| Content-Type | `application/json` |
| Events | `payment.received`, `payment.reminder`, `shipper.status`, `membership.newMemberRegistered`, `membership.changeTierMemberRegistered`, `membership.memberExpired`, `membership.memberUnsubscribed` |
| Payload top-level | `event.received` (event type) + `data.{...}` |
| Key data fields | `id`, `status`, `amount`, `customerEmail`, `customerName`, `productId`, `productType`, `createdAt`, `updatedAt`, `custom_field[]`, `addOn[]` |
| Signature verification | **Not documented in public Mayar docs** — requires checking dashboard for token/secret config or contacting Mayar support |

**⚠️ FLAG FOR PHASE-SPECIFIC RESEARCH:** Mayar's public webhook docs do not specify a signature verification mechanism. Before implementing payment integration:
1. Log into Mayar dashboard → Webhook configuration page → look for "Webhook Signing Secret" or "Token"
2. If no signature mechanism exists, fall back to **shared-secret token in URL path** (e.g., `/api/webhooks/mayar/{secret}`) and IP allow-listing if Mayar publishes IPs
3. File a support request with Mayar to confirm signature scheme

**Idempotency pattern (Next.js Route Handler):**

```ts
// app/api/webhooks/mayar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 1. Read raw body BEFORE parsing (needed if signature verification added later)
  const rawBody = await request.text()
  const body = JSON.parse(rawBody)

  // 2. Verify shared-secret (interim) — replace with HMAC if Mayar adds one
  const token = request.nextUrl.searchParams.get('token')
  if (token !== process.env.MAYAR_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient() // service-role, bypasses RLS

  // 3. Idempotency: upsert event into webhook_events table by Mayar's data.id
  const { error: dedupeError } = await supabase
    .from('webhook_events')
    .insert({
      provider: 'mayar',
      event_id: body.data.id,           // Mayar's webhook ID
      event_type: body.event,
      payload: body,
      processed: false,
    })

  // unique violation = duplicate; ack 200 and return
  if (dedupeError?.code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // 4. ACK fast, process async — return 200 within 5s of receipt
  // For MVP volume, inline processing is fine; for scale, push to a queue
  await processMayarEvent(body, supabase)

  await supabase
    .from('webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('provider', 'mayar')
    .eq('event_id', body.data.id)

  return NextResponse.json({ ok: true })
}
```

**Schema for `webhook_events`:**
```sql
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean default false,
  processed_at timestamptz,
  created_at timestamptz default now(),
  unique(provider, event_id)  -- the dedup constraint
);
```

**Critical webhook patterns to follow:**
1. **Receive fast, process safe** — verify signature/secret + dedupe + 200 OK in <5s; do work after.
2. **Use upserts on user/membership tables** — if `payment.received` arrives twice, the membership state should converge to the same value.
3. **Always log raw payloads** to the `webhook_events.payload` JSONB column — auditing + replay.
4. **Build a `/admin/webhooks` page** to view + manually retry failed events (table is already structured for it).
5. **Configure Mayar dashboard with two URLs**: prod (`https://lailit.supply/api/webhooks/mayar?token=...`) and staging.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `^3.x` | Runtime validation | Webhook payload schema, Server Action form validation |
| `gray-matter` | `^4.x` | Frontmatter parsing | Resource metadata extraction at build time |
| `globby` | `^14.x` | Glob file listing | Finding all `content/resources/**/*.mdx` |
| `react-email` (`@react-email/components`) | latest | Email templates as React | Magic link email, payment receipt, welcome flow |
| `resend` | `^4.x` | Resend SDK | Send React Email templates from server actions / webhook handlers |
| `date-fns` | `^4.x` | Date formatting | Resource published dates, billing periods |
| `clsx` + `tailwind-merge` (already pulled by shadcn as `cn` util) | latest | className concat | Conditional Tailwind classes |
| `lucide-react` | latest | Icon set | shadcn/ui's default icon system |
| `motion` (formerly Framer Motion) | `^11.x` | Animations | Hover effects on resource cards, page transitions |

**Optional but commonly worth adding for this product:**

| Library | Purpose | Decision |
|---------|---------|----------|
| `drizzle-orm` + `drizzle-kit` | Type-safe SQL with Postgres | **Recommended** — pairs with Supabase for non-auth queries (resources, bookmarks, webhook_events). RLS-aware client gives full TypeScript inference. Avoids the tiny-but-real friction of Supabase JS client `.from('table').select()` chaining. Use Drizzle for *queries*; keep Supabase Auth for sessions. |
| `discord.js` (server) or webhook URL | Discord integration | Defer — for MVP, just post invite link in `/dashboard/community`. |
| `@vercel/analytics` + `@vercel/speed-insights` | Page analytics + Web Vitals | **Add early** — free on Vercel, useful product signal. |
| `posthog-js` | Product analytics + feature flags | Defer to post-MVP unless flag-gating premium content. |
| `sharp` | Image optimization | Already used by Next.js for AVIF; no manual install needed. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `eslint` + `eslint-config-next` (already installed) | Linting | Already on `^9` and `16.2.4` |
| Prettier + `prettier-plugin-tailwindcss` | Formatting | Auto-sorts Tailwind classes |
| TypeScript strict mode | Type safety | Set `"strict": true` in tsconfig |
| `@types/mdx` | Types for MDX exports | Required for `mdx-components.tsx` |
| Drizzle Kit (CLI) | Schema migrations | `drizzle-kit generate` + `drizzle-kit migrate` |
| Supabase CLI | Local Supabase + auth template management | `npx supabase init` + `npx supabase db push` for migrations |

---

## Installation

```bash
# Already in package.json (Next.js 16.2.4, React 19.2.4, Tailwind 4)
# Skip these — they're installed.

# Auth + DB
npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres
npm install -D drizzle-kit @types/pg

# Email
npm install resend @react-email/components

# MDX pipeline
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
npm install gray-matter globby
npm install remark-gfm rehype-slug rehype-pretty-code shiki

# Search + UI
npm install cmdk fuse.js
npx shadcn@latest init  # initializes shadcn with Tailwind v4 config
npx shadcn@latest add button card badge dialog sheet command tabs input form label toast sonner avatar dropdown-menu skeleton scroll-area separator

# Video player
npm install @mux/mux-player-react

# Validation + utilities
npm install zod date-fns
npm install motion  # animations

# Analytics (free on Vercel)
npm install @vercel/analytics @vercel/speed-insights
```

**Environment variables (`.env.local`):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx  # NEW format, not anon
SUPABASE_SERVICE_ROLE_KEY=eyJ...                          # server-only, NEVER NEXT_PUBLIC_

# Database (for Drizzle)
DATABASE_URL=postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres

# Mayar
MAYAR_API_KEY=xxx
MAYAR_WEBHOOK_SECRET=xxx        # shared-secret in URL until HMAC scheme confirmed

# Resend
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=hello@lailit.supply

# Mux
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx              # only needed if using Direct Upload from server

# App
NEXT_PUBLIC_SITE_URL=https://lailit.supply
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@next/mdx` + dynamic imports | `velite` | When you need a build-time content layer with Zod schemas across non-MDX files (YAML, JSON) AND can opt out of Turbopack. Better DX for typed content but locks you to webpack. |
| `@next/mdx` + dynamic imports | `next-mdx-remote/rsc` | **Do NOT use.** Repo archived 2026-04-09; CVE-2026-0969. If you absolutely need remote MDX (loading from a CMS later), use `@mdx-js/mdx` directly with `evaluate()`. |
| `cmdk` + `fuse.js` | Algolia | When the resource catalog exceeds ~5,000 entries OR you need typo-tolerance + synonyms tuned per locale. Algolia free tier is 10k records / 100k searches per month — not relevant pre-MVP. |
| `cmdk` + `fuse.js` | Typesense (self-hosted) | When you want OSS + multi-language tokenization (Bahasa) and have ops capacity. Overkill for MVP. |
| `cmdk` + `fuse.js` | `orama` | Comparable to Fuse.js for client-side; choose if you need stemming/BM25. Slightly larger bundle. |
| Mux | Cloudflare Stream | If lailit.supply is already on Cloudflare for DNS + Workers and the team values single-vendor billing. |
| Mux | Bunny Stream | At scale (>100k delivered min/mo) Bunny is ~50% cheaper. Migrate later if cost pressures appear. |
| `rehype-pretty-code` + `shiki` | `bright` (by code-hike) | If you need notebook-style scrolly code annotations. More complex, slower build. |
| shadcn/ui | Radix Themes | Faster to ship than copy-paste shadcn, but locks you into Radix's theming model. Less escape velocity. |
| shadcn/ui | Headless UI / Mantine | Fine alternatives but neither is the de facto standard for AI-coding-agent workflows in 2026. |
| Drizzle | Prisma | Prisma's heavier client + edge-runtime caveats make it less Next.js-on-Vercel friendly. Drizzle is the 2026 default for Postgres + Vercel + Supabase. |
| Drizzle | Supabase JS client only | OK for tiny apps but loses end-to-end TS inference and lock you into REST-style chaining. Better to layer Drizzle on top of Supabase Auth. |
| Supabase Auth | Clerk / Better Auth | Clerk is excellent DX but adds $25–$200/mo cost. Supabase already chosen for DB → use its auth. Better Auth is rising fast but pairing it with Supabase Auth's RLS would duplicate state. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-mdx-remote` (any version) | **Archived 2026-04-09; CVE-2026-0969** allows arbitrary code execution. Even patched v6 is unmaintained. | `@next/mdx` with dynamic `import(...)` for slug-based loading |
| `contentlayer` | Maintenance stopped in 2023; FAQ on official site confirms it. | `@next/mdx` + custom build script, or Velite if you accept webpack lock-in |
| `@supabase/auth-helpers-nextjs` | Deprecated in favor of `@supabase/ssr`. Will break with Next.js 16's async cookies. | `@supabase/ssr` |
| `middleware.ts` | Renamed to `proxy.ts` in Next.js 16. The old name no longer works as documented. | `proxy.ts` with named or default `proxy` export |
| Synchronous `cookies()` / `headers()` / `params` | These are **async in Next.js 16** — must `await`. | `await cookies()`, `await headers()`, `const { slug } = await params` |
| `getSession()` for authorization | Reads cookies without verifying JWT; spoof-able. | `getUser()` or `getClaims()` for any access decision |
| Anon key (`sb_anon_xxx` legacy) | Being deprecated by Supabase. | Publishable key (`sb_publishable_xxx`) |
| `react-syntax-highlighter` | Ships ~150KB Prism to the client; runtime highlighting; weak Tailwind theming. | `rehype-pretty-code` + `shiki` (build-time, zero client JS) |
| `react-copy-to-clipboard` | Adds dependency for one line of code (`navigator.clipboard.writeText()`). | Native Clipboard API in a `<button onClick>` handler |
| Stripe (for IDR market) | Doesn't support QRIS / Indonesian e-wallets / IDR locally; user must already have credit card. | Mayar.id (already chosen) |
| Hosting videos in Supabase Storage | Supabase Storage is not optimized for video streaming (no HLS, no per-title encoding, no CDN edge caching for video). | Mux |
| Self-hosting MDX content via fetch in a Server Component every render | Recompiles MDX on every request, defeats SSG. | Static `import` of MDX modules + `generateStaticParams` |
| `pages/` directory | The user's constraint is App Router only. Mixing causes routing confusion. | All routes in `app/` |
| Storing payment intents/customer-IDs as the source of membership truth | Payment provider state can drift; webhooks can be missed. | Have a `memberships` table that webhooks upsert into; treat that as the source of truth and reconcile on Mayar API calls. |

---

## Stack Patterns by Variant

**If volume reaches >5,000 resources:**
- Move search from Fuse.js client-side to **Algolia** or **Meilisearch (self-hosted on Fly.io)**
- Trigger reindex from a Postgres trigger or a build-time job
- Index `resources` table directly rather than parsing MDX exports

**If video bandwidth costs become >$500/mo:**
- Migrate from Mux to **Bunny Stream**
- Rewrite player with `bunny-stream-react` or `<video>` tag + HLS.js
- Keep `playbackId` field name; just change the URL pattern

**If Indonesian Bahasa search is a requirement (not just English):**
- Replace Fuse.js with **Orama** (better tokenization for non-English) or self-host **Typesense** with Bahasa stop-words

**If a CMS is added in V2 (per `PROJECT.md` "Out of Scope"):**
- Use **Sanity Studio** (best Next.js integration, free for ≤3 users)
- Pull MDX strings from Sanity → use `@mdx-js/mdx`'s `evaluate()` (NOT `next-mdx-remote`) to render
- Keep MDX-in-repo as fallback path for code snippets

**If team expands and need multi-author workflow:**
- Move `webhook_events` table to a managed queue (Inngest or Trigger.dev)
- Add Drizzle migrations to CI
- Set up Vercel preview branches with branch databases on Supabase

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@16.2.4` | `react@19.2.x`, `react-dom@19.2.x` | Already correctly pinned. Do not downgrade. |
| `next@16.2.4` | `eslint-config-next@16.2.4` | Match Next major. Already correct. |
| `@supabase/ssr@^0.5` | `@supabase/supabase-js@^2.45+` | SSR helpers depend on async cookies API in Next 15+. |
| `@next/mdx` (latest) | `@mdx-js/loader@^3`, `@mdx-js/react@^3` | MDX v3 is required; older v2 will not work with Next 16. |
| `tailwindcss@^4` | `@tailwindcss/postcss@^4` | Must use the dedicated PostCSS plugin (not the v3 `tailwindcss` plugin). Already correct in package.json. |
| `tailwindcss@^4` | `prettier-plugin-tailwindcss@^0.6+` | v4 needs newer formatter version. |
| `shadcn@^3` (CLI) | Tailwind 4, React 19, Next 16 | Must use shadcn CLI v3+ (renamed from shadcn-ui). |
| `cmdk@^1` | React 19 | Works fine on R19. |
| `motion` (the package, not framer-motion) | React 19 | Framer Motion was renamed to `motion`. |
| `rehype-pretty-code` (with Turbopack) | `@next/mdx` v15.0+ | Turbopack support requires string-name plugins; latest `@next/mdx` accepts this. |
| `react-email` | React 19, Next 16 | Confirmed updated; `@react-email/components` aligned. |
| `mux-player-react` | React 19 | Confirmed React 19 support. |
| `drizzle-orm` (with Supabase) | postgres@^3 driver, NOT pg@^8 | Use `postgres` (Postgres.js) for serverless on Vercel; `pg` has connection pool issues on edge. |
| `velite` | webpack only | **Incompatible with Turbopack.** Avoid unless you opt out of Turbopack. |
| `next-mdx-remote@*` | n/a | **Archived; do not use at any version.** |

---

## Sources

### Primary (verified — HIGH confidence)
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — Route Handler async params, Cache Components, `RouteContext` helper
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` — `middleware.ts` → `proxy.ts` rename in Next 16
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md` — Async `cookies()`, DAL pattern, Server Actions auth
- `node_modules/next/dist/docs/01-app/02-guides/mdx.md` — `@next/mdx` configuration, dynamic imports, Turbopack plugin syntax
- Context7 `/supabase/ssr` — `createBrowserClient` / `createServerClient` patterns, cookie handlers, `getUser()` vs `getSession()` security guidance
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — publishable key migration, proxy token refresh
- [Supabase Passwordless email logins](https://supabase.com/docs/guides/auth/auth-email-passwordless) — `signInWithOtp` with `shouldCreateUser`, Magic Link template config
- [Supabase auth.admin.generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) — service-role link generation for post-payment flow
- [Mayar Webhook Documentation](https://docs.mayar.id/integration/webhook) — event types, payload structure, HTTP semantics

### Secondary (corroborating — MEDIUM confidence)
- [next-mdx-remote on npm/Snyk](https://security.snyk.io/package/npm/next-mdx-remote) + [GitHub repo](https://github.com/hashicorp/next-mdx-remote) — archive status April 2026, CVE-2026-0969
- [Vercel changelog: blocked next-mdx-remote](https://vercel.com/changelog/new-deployments-with-vulnerable-versions-of-next-mdx-remote-are-now-blocked-by-default) — confirms severity
- [Mux Free Plan](https://www.mux.com/blog/free-plan) + [Mux pricing](https://www.mux.com/docs/pricing/video) — 100k free delivered minutes confirmed
- [Mux vs Cloudflare Stream vs Bunny Stream 2026 (PkgPulse)](https://www.pkgpulse.com/guides/mux-vs-cloudflare-stream-vs-bunny-stream-video-cdn-2026)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) + [shadcn/ui Next.js install](https://ui.shadcn.com/docs/installation/next)
- [Rehype Pretty Code](https://rehype-pretty.pages.dev/) — official docs
- [Velite Next.js integration](https://velite.js.org/guide/with-nextjs) + [GitHub issues](https://github.com/zce/velite) — Turbopack incompatibility documented
- [Resend Next.js docs](https://resend.com/docs/send-with-nextjs) + [React Email 5.0](https://resend.com/blog/react-email-5)
- [Drizzle + Supabase guide](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) + [Supabase Drizzle docs](https://supabase.com/docs/guides/database/drizzle)

### Webhook patterns
- [Webhook Idempotency (HookReplay)](https://hookreplay.dev/blog/webhook-idempotency)
- [Webhook Best Practices: Retry, Idempotency (DEV)](https://dev.to/henry_hang/webhook-best-practices-retry-logic-idempotency-and-error-handling-27i3)
- [Next.js 16 Webhook Handler Pattern (DEV)](https://dev.to/huangyongshan46a11y/nextjs-16-webhook-handler-pattern-stripe-github-and-more-2bgh)

### Open questions / LOW confidence (require validation in implementation phase)
- **Mayar webhook signature verification mechanism** — public docs don't specify HMAC scheme; must verify in dashboard or via support before production deployment
- **Mayar customer portal magic link API exact shape** — confirmed it exists (referenced in API index) but request/response schema not retrieved
- **Mayar test mode / sandbox credentials** — `web.mayar.club` mentioned for testing; flow not fully documented publicly
- **Whether Mayar IPs are static** — would enable IP allowlisting as defense-in-depth

---

*Stack research for: Subscription SaaS — paywalled creative dev component library*
*Researched: 2026-05-05*
*Confidence: HIGH (with three flagged Mayar-specific gaps for phase implementation)*
