# Project Research Summary

**Project:** lailit.supply
**Domain:** Subscription SaaS — paywalled multi-format creative dev component library (Indonesian/SEA market)
**Researched:** 2026-05-05
**Confidence:** HIGH (with three flagged Mayar.id-specific gaps requiring implementation-phase verification)

---

## Confirmed Stack

Next.js 16.2.4 + React 19 (already installed) · Tailwind v4 + shadcn/ui v3 · Supabase Postgres + Auth via `@supabase/ssr` · Mayar.id checkout + webhooks · Resend + React Email · `@next/mdx` + `gray-matter` + dynamic imports · `rehype-pretty-code` + `shiki` · `cmdk` + `fuse.js` · Mux + `@mux/mux-player-react` · Drizzle ORM + `postgres` driver · `zod`, `motion`, `lucide-react`, `date-fns`, `globby`

**Do NOT use:**
- `next-mdx-remote` — archived April 2026 with CVE-2026-0969 (Vercel blocks deployments)
- `contentlayer` — unmaintained since 2023
- `velite` — incompatible with Turbopack (Next.js 16 default)
- `@supabase/auth-helpers-nextjs` — deprecated, incompatible with Next.js 16 async cookies
- `middleware.ts` — renamed to `proxy.ts` in Next.js 16

---

## Table Stakes (MVP Must-Haves)

- Dashboard gallery with category filters
- Resource detail page with **5-format tabbed code blocks** (Framer / Webflow / HTML / JSX / TSX) — THE primary differentiator
- Code copy button per format
- Magic-link auth (no passwords)
- Mayar checkout + webhook → user account creation + magic-link delivery
- **Server-side** free tier + paid gating (never client-only)
- Mayar Customer Portal link in account page
- Pricing page with IDR pricing
- Bahasa Indonesia checkout/email copy
- Mobile-responsive (70%+ SEA traffic is mobile)
- AVIF thumbnails via `next/image`
- Basic search
- Custom 404 / no-access pages
- Discord invite for paying members

---

## Top 5 Critical Pitfalls

1. **Mayar webhooks lack signature verification** — anyone can forge `payment.received` to grant premium access. Defense: token-in-URL secret + cross-verify every event via Mayar's "Get Transaction" API matching `status`/`amount`. Treat body as untrusted until verified.

2. **Webhook duplicate processing creates ghost subscriptions** — Mayar will retry. Defense: `webhook_events` ledger with `mayar_event_id` PK; `INSERT ... ON CONFLICT DO NOTHING RETURNING id` BEFORE side effects; return 200 quickly on duplicate.

3. **`getSession()` is spoofable on the server** — cookies can be forged. Defense: always `supabase.auth.getUser()` in DAL wrapped in `cache()`. Add lint/grep CI rule blocking `getSession()` in server contexts.

4. **Vercel Fluid compute reuses Supabase clients across users if instantiated at module scope** — catastrophic auth bypass. Defense: instantiate the Supabase client INSIDE every request handler / RSC / Server Action; never at module scope.

5. **Client-side-only access gating leaks paid content** — direct API calls bypass UI. Defense: server-render premium MDX and gate the resulting HTML at the route handler with `verifySession()` returning 403. Test with `curl`, not the browser.

---

## Surprising Findings (Changes Default Approach)

- **`middleware.ts` is renamed to `proxy.ts`** in Next.js 16 — most training data and tutorials are wrong
- **`cookies()`, `headers()`, `params` are async** — must `await` everywhere in Next.js 16
- **`next-mdx-remote` is archived (April 2026)** with CVE-2026-0969 — Vercel blocks deploys using it
- **`@supabase/auth-helpers-nextjs` is deprecated** — must use `@supabase/ssr`; old tutorials break on Next.js 16's async cookies
- **Mayar.id has no documented webhook signature mechanism** — requires defense-in-depth (token-in-URL + cross-verification via API)
- **Mux's free tier (100k delivered min/mo)** covers MVP at $0 — no need for Cloudflare Stream / Bunny at launch
- **The 5-format wedge (Framer + Webflow + HTML + JSX + TSX) is uncontested** — no competitor offers more than 3 formats
- **`velite` is Turbopack-incompatible** (webpack-only) despite being commonly recommended for Next.js content

---

## Architectural Constraints Affecting Phase Order

1. **Auth before payments** — Mayar webhook handler requires `supabase.auth.admin.generateLink()` to create users and send magic links
2. **Content pipeline before payments** — paid-content gating tests need real seed MDX resources
3. **Payments before paid content delivery** — paywall pen-tests need live (sandbox) webhooks producing real `membership_tier` rows
4. **Search/bookmarks after content + auth** — both depend on stable catalog manifest + verified user identity
5. DAL pattern + `force-dynamic` + webhook token + idempotency ledger must ALL exist before Phase 4 touches real money

---

## Suggested Phase Structure

| Phase | Name | Key Deliverable | Research Needed? |
|-------|------|-----------------|-----------------|
| 1 | Marketing Surface | Landing, pricing, legal pages | No — standard Next.js 16 |
| 2 | Auth Foundation | Magic-link via Supabase, `proxy.ts`, DAL skeleton | No — canonical Supabase pattern |
| 3 | Content Pipeline | MDX architecture, resource catalog, dashboard browse | Phase spike: Turbopack + rehype-pretty-code |
| 4 | Payments & Webhooks | Mayar integration, user creation, membership gating | Yes — verify Mayar signature scheme first |
| 5 | Paid Content Delivery | Server-side paywall, format tabs, video previews | Phase spike: iOS Safari Mux autoplay |
| 6 | Discovery & Engagement | Cmd-K search, bookmarks, copy event tracking | No — standard cmdk + fuse.js |
| 7 | Community & Retention | Discord invite gating, changelog, transactional emails | No — straightforward |

---

## Research Gaps (Flag for Phase 4)

- **Mayar webhook signature mechanism** — verify in Mayar dashboard/support at Phase 4 kickoff; defense-in-depth is fallback
- **Mayar customer portal magic-link API exact shape** — validate via dashboard during Phase 4 setup
- **Mayar test/sandbox credentials** — secure before Phase 4; never test against real money
- **Whether Mayar IPs are static for allowlisting** — ask Mayar support during Phase 4
- **Bahasa Indonesia copywriting quality** — native-speaker review before launch
