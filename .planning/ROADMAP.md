# Roadmap: lailit.supply

## Overview

lailit.supply ships as a paywalled, multi-format component library for the Indonesian/SEA creative dev market. The roadmap follows a strict architectural ordering enforced by research: a risk-free marketing surface lands first, then magic-link auth and the DAL pattern arrive before any code touches money, then the MDX content pipeline lights up the free-tier lead magnet, and only then is the Mayar payments + webhook system wired in (with idempotency, cross-verification, and account auto-creation). Paid content delivery (server-side gating, format tabs, Mux video) follows once payments produce real `membership_tier` rows, and discovery (Cmd-K search, bookmarks) closes the loop on a stable catalog and verified user identity.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Marketing Surface** - Public landing, pricing, legal, login, and mobile-responsive shell with no backend dependencies
- [ ] **Phase 2: Auth Foundation** - Auth via Clerk (`@clerk/nextjs`), DAL pattern, middleware-protected routes — _migrated 2026-05-13: Supabase magic-link → Clerk; DB → Cloudflare D1 + Drizzle_
- [ ] **Phase 3: Content Pipeline & Free-Tier Browse** - MDX architecture, Zod-validated frontmatter, build-time manifest, public free-tier catalog
- [ ] **Phase 4: Payments & Webhooks** - Mayar checkout for monthly + lifetime, idempotent webhook handlers, auto user creation, account page
- [ ] **Phase 5: Paid Content Delivery** - Server-side paywall, format tabs, Mux preview, syntax-highlighted code, copy buttons, dashboard grid
- [ ] **Phase 6: Discovery & Bookmarks** - Command-K fuzzy search, save/unsave persistence, saved resources page

## Phase Details

### Phase 1: Marketing Surface
**Goal**: A polished, mobile-responsive public website communicates the value proposition, displays IDR pricing with Mayar checkout CTAs (stubbed), exposes legal pages, and provides a magic-link login entry point — all rendered as pure Next.js 16 static surfaces with zero backend dependencies.
**Depends on**: Nothing (first phase)
**Requirements**: MKT-01, MKT-02, MKT-04, MKT-05, MKT-06
**Success Criteria** (what must be TRUE):
  1. Visitor lands on `/` and reads a clear value proposition that drives them toward `/pricing`
  2. Visitor sees IDR-denominated monthly and lifetime plan cards on `/pricing` with checkout CTAs (CTAs route to Phase 4 endpoints, stubbed for now)
  3. Visitor can read `/legal/privacy-policy` and `/legal/terms-and-conditions`
  4. Visitor on a 375px-wide mobile viewport sees a fully responsive, navigable site (70%+ of SEA traffic target)
  5. Visitor can reach `/login` and see a magic-link email input form (form submission wired in Phase 2)
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [ ] 01-01-PLAN.md — Design system init, globals.css, root layout, marketing layout shell, TopNav, Footer
- [ ] 01-02-PLAN.md — Home page: HeroSection with CSS animated demo, ValuePropsGrid, PricingTeaser
- [ ] 01-03-PLAN.md — Pricing page: PricingCardGrid, PricingCard (monthly + lifetime, stubbed CTAs)
- [ ] 01-04-PLAN.md — Login page with validated no-op form; /legal/privacy-policy and /legal/terms-and-conditions

### Phase 2: Auth Foundation
> _**Migration note (2026-05-13):** This phase was originally planned around Supabase magic-link, then migrated to Clerk. The DB layer was migrated again from Supabase Postgres → Cloudflare D1 + Drizzle ORM. The plan files below are historical; current truth is in code (`src/lib/dal.ts`, `src/middleware.ts`, `src/lib/db/`)._

**Goal**: Authentication is fully operational via Clerk (`@clerk/nextjs`), the Data Access Layer (DAL) pattern is enforced, `src/middleware.ts` (temporarily, until OpenNext Cloudflare lands proxy.ts) protects routes, and session continuity works across refresh and tabs — establishing the security primitives Phase 4's webhook handler will call into.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, GATE-05, EMAIL-02, EMAIL-03
**Success Criteria** (what must be TRUE):
  1. User submits their email on `/login` and receives a magic-link email from Resend within seconds
  2. User clicks the magic link and lands authenticated on the dashboard with a session that survives full browser refresh and new tabs
  3. User clicks "Log out" from any authenticated page and is signed out cleanly
  4. The magic link expires exactly 24 hours after issuance (Supabase OTP expiry = 86400s) and a fresh link can always be requested from `/login`
  5. Every server-side identity check goes through `getUser()` in a `cache()`-wrapped DAL — `getSession()` is grep-blocked in CI
**Plans**: 3 plans
**UI hint**: yes
**Notes**: Establishes the Supabase client instantiation discipline (per-request, never module-scope) flagged as catastrophic-pitfall #4 in research. `middleware.ts` does NOT exist in this codebase — use `proxy.ts` per Next.js 16.

Plans:
- [ ] 02-01-PLAN.md — Install Supabase packages, env setup, supabase client files (client.ts, server.ts, admin.ts, middleware.ts), DAL (dal.ts), proxy.ts
- [ ] 02-02-PLAN.md — Login Server Action (actions.ts), LoginForm wiring (useActionState), LoginErrorAlert, /auth/confirm route handler
- [ ] 02-03-PLAN.md — Dashboard shell: (dashboard) route group layout (auth gate), dashboard stub page, DashboardNav, UserMenu, DashboardStubCard, logout action

### Phase 3: Content Pipeline & Free-Tier Browse
**Goal**: The MDX-in-repo content architecture is established, 20–30 seed resources ship across categories with AVIF thumbnails and Mux videos, a typed Zod-validated build-time manifest is generated, and the public `/explore` (free-tier) page lets unauthenticated visitors browse and view free resources — proving the lead magnet and unblocking Phase 4 paywall pen-tests with real seed data.
**Depends on**: Phase 2
**Requirements**: CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05, CONTENT-06, MKT-03, GATE-01
**Success Criteria** (what must be TRUE):
  1. Admin adds a new MDX folder under `content/resources/<slug>/` containing per-format files (`framer.mdx`, `webflow.mdx`, `html.mdx`, `jsx.mdx`, `tsx.mdx`) and after build the resource appears in the manifest with Zod-validated frontmatter
  2. Build fails loudly if any resource has invalid frontmatter (missing title, category, tags, is_premium, available_formats)
  3. Unauthenticated visitor lands on `/explore` and browses 20–30 seed resources with AVIF thumbnails and looping Mux video previews
  4. Unauthenticated visitor opens a free-tier resource detail page and sees its content render fully without any login prompt
  5. Resources marked `is_premium: true` are visible in the catalog but their detail content is NOT rendered server-side to unauthenticated requests (paywall stub returns 403 / placeholder — full paywall lands in Phase 5)
**Plans**: 6 plans
**UI hint**: yes
**Notes**: Turbopack + rehype-pretty-code spike resolved: use string plugin name + serializable options only. Do NOT use `next-mdx-remote` (CVE-2026-0969, archived), `contentlayer` (unmaintained), or `velite` (Turbopack-incompatible). Use `@next/mdx` + `gray-matter` + `fast-glob` + programmatic `@mdx-js/mdx` compile for per-format files (avoids Turbopack static analysis constraint on dynamic imports).

Plans:
- [ ] 03-01-PLAN.md — Install MDX deps, next.config.ts + mdx-components.tsx, src/lib/content.ts manifest module, unit tests
- [ ] 03-02-PLAN.md — 20 seed resources: content/resources/**/index.mdx + per-format MDX files
- [ ] 03-03-PLAN.md — Server components: ThumbnailPlaceholder, VideoPlaceholder, PaywallStub, ResourceCard
- [ ] 03-04-PLAN.md — Interactive components: CategoryFilterRow, FormatTabBar, CopyButton, CodeBlock
- [ ] 03-05-PLAN.md — Pages: /explore (ExplorePage) + /explore/[slug] (ResourceDetailPage)
- [ ] 03-06-PLAN.md — Human verification: build validation, catalog browse, free/premium detail, copy button, CONTENT-06 test

### Phase 4: Payments & Webhooks
**Goal**: Mayar.id checkout works end-to-end for monthly and lifetime plans, webhook handlers are idempotent and cross-verified against Mayar's "Get Transaction" API, new member accounts are auto-created and emailed a magic link via Resend, the full membership lifecycle (registered → renewed → canceled-with-grace → expired → tier-changed → lifetime) is correctly modeled in Postgres, and authenticated users can view their account page with a Mayar Customer Portal link.
**Depends on**: Phase 2 (auth admin API), Phase 3 (seed resources for gating tests)
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08, PAY-09, PAY-10, AUTH-05, EMAIL-01, ACCT-01, ACCT-02
**Success Criteria** (what must be TRUE):
  1. Visitor clicks "Subscribe Monthly" or "Buy Lifetime" on `/pricing`, completes a Mayar sandbox checkout (QRIS / e-wallet / bank transfer), and within seconds receives a branded magic-link welcome email from Resend
  2. Replaying the same `membership.newMemberRegistered` webhook payload twice creates exactly one user account and exactly one `webhook_events` row (idempotent on `data.id`)
  3. A forged webhook with valid-looking body but missing the URL secret token, OR a payload whose `data.id` fails Mayar's "Get Transaction" verification, is rejected with no side effects
  4. After `membership.memberUnsubscribed` fires, the user's status flips to `canceled` but they still load premium content until `membership_expires_at` — and after `membership.memberExpired` fires, the dashboard returns the account-expired page
  5. Lifetime purchasers have `lifetime_purchased = true` and never see expiry behavior regardless of time elapsed
  6. Authenticated user opens `/account` and sees their tier, status, expiry date, plus a working "Manage Subscription" link to the Mayar Customer Portal
**Plans**: 5 plans
**UI hint**: yes
**Notes**: Research-flagged gaps to resolve at phase kickoff: (a) Mayar webhook signature mechanism, (b) Customer Portal magic-link API exact shape, (c) sandbox credentials, (d) static IPs for allowlisting. Defense-in-depth (URL token + cross-verification + idempotency ledger) is non-negotiable — this is the highest-risk phase per research pitfalls #1, #2, #4.

Plans:
- [ ] 04-01-PLAN.md — DB migration SQL (public.users + webhook_events) + Wave 0 test scaffolds (webhook.test.ts, email.test.ts)
- [ ] 04-02-PLAN.md — Install resend + react-email deps, .env.local.example update, WelcomeEmail template (Bahasa Indonesia)
- [ ] 04-03-PLAN.md — Webhook route handler: full 3-layer defense + all 5 event handlers + promote test stubs to green
- [ ] 04-04-PLAN.md — DAL getMembership(), pricing CTA wiring, AccountMembershipCard, /account page, DashboardNav "Akun" link
- [ ] 04-05-PLAN.md — [BLOCKING] Schema apply via `wrangler d1 migrations apply lailitsupply --remote` + full test suite + human verification of complete payments surface

### Phase 5: Paid Content Delivery
**Goal**: The server-side paywall is fully enforced (curl-tested, not just UI), authenticated members see all five format tabs unlocked with syntax highlighting and copy buttons, Mux video previews and live demos work on iOS Safari, expired/unauthenticated users see appropriate paywall and account-expired pages, and the authenticated dashboard renders the full responsive card grid with category filters.
**Depends on**: Phase 4 (real `membership_tier` rows)
**Requirements**: GATE-02, GATE-03, GATE-04, RES-01, RES-02, RES-03, RES-04, RES-05, RES-06, DASH-01, DASH-02, DASH-04
**Success Criteria** (what must be TRUE):
  1. Authenticated active member opens any premium resource and switches between Framer / Webflow / HTML / JSX / TSX tabs, each rendering with Shiki syntax highlighting and a working one-click copy button
  2. Unauthenticated visitor hitting a premium resource detail URL directly via `curl` receives a 403 with NO premium code in the response body — and in the browser sees a paywall overlay with upgrade CTA
  3. Authenticated user whose membership has expired sees an account-expired page with a renewal CTA when accessing premium content (free tier still works)
  4. Resource detail page plays a looping Mux video preview AND opens a full-screen live demo in a new tab
  5. Authenticated member browses `/dashboard` as a responsive card grid, filters by category, and each card shows a free/premium indicator + hover video preview + title
**Plans**: TBD
**UI hint**: yes
**Notes**: Research-flagged spike: iOS Safari Mux autoplay quirks. Pen-test gating with `curl` against every premium endpoint per research pitfall #5 — never trust the browser to enforce access.

### Phase 6: Discovery & Bookmarks
**Goal**: Members can find resources fast via Command-K fuzzy search, save resources persistently to Cloudflare D1, and view their saved collection on a dedicated page — closing the engagement loop on a stable catalog and verified user identity.
**Depends on**: Phase 5
**Requirements**: DASH-03, DASH-05, DASH-06
**Success Criteria** (what must be TRUE):
  1. Authenticated member presses ⌘K (Cmd-K) anywhere in the dashboard and a fuzzy search modal opens, returning results matched by title and tags via fuse.js
  2. Member clicks the bookmark icon on any resource card and the saved state persists across logout/login and across browsers (round-trips to D1, not localStorage)
  3. Member visits `/dashboard/saved` and sees exactly the resources they have bookmarked, with the same card layout as the main grid
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Marketing Surface | 4/4 | Human verification pending | 2026-05-06 |
| 2. Auth Foundation | 3/3 | Human verification pending | 2026-05-06 |
| 3. Content Pipeline & Free-Tier Browse | 0/6 | Not started | - |
| 4. Payments & Webhooks | 0/5 | Not started | - |
| 5. Paid Content Delivery | 0/TBD | Not started | - |
| 6. Discovery & Bookmarks | 0/TBD | Not started | - |

## Coverage Summary

- **v1 requirements:** 49 total (5 AUTH + 10 PAY + 5 GATE + 6 CONTENT + 6 DASH + 6 RES + 6 MKT + 2 ACCT + 3 EMAIL)
- **Mapped:** 49/49 ✓
- **Unmapped:** 0
- **Duplicates:** 0
- **Orphaned phases:** 0

*Note: REQUIREMENTS.md header text said "48 total" but the actual itemized list contains 49 v1 requirements. Roadmap maps all 49.*

---
*Roadmap created: 2026-05-05*
