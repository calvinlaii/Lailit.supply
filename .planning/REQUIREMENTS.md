# Requirements: lailit.supply

**Defined:** 2026-05-05
**Core Value:** A premium, multi-platform component library built specifically for the Indonesian/SEA creative dev market — the only one in this niche.

---

## v1 Requirements

### Authentication (AUTH)

- [ ] **AUTH-01**: User can request a magic-link login email by entering their email address
- [ ] **AUTH-02**: User can log in by clicking the magic link (no password required)
- [ ] **AUTH-03**: User session persists across browser refresh and new tabs
- [ ] **AUTH-04**: User can log out from any authenticated page
- [ ] **AUTH-05**: New member's account is auto-created from the Mayar webhook payload (no pre-signup step required)

### Payments & Billing (PAY)

- [ ] **PAY-01**: Visitor can select the monthly subscription plan and be redirected to Mayar checkout
- [ ] **PAY-02**: Visitor can select the lifetime access plan and be redirected to Mayar one-time checkout
- [ ] **PAY-03**: Backend receives `membership.newMemberRegistered` webhook, creates user account, and sends magic-link onboarding email via Resend
- [ ] **PAY-04**: Backend receives `payment.received` webhook and extends `membership_expires_at` for the relevant user
- [ ] **PAY-05**: Backend receives `membership.memberUnsubscribed` and sets status to `canceled` WITHOUT revoking immediate access (access continues until `membership_expires_at`)
- [ ] **PAY-06**: Backend receives `membership.memberExpired` and sets status to `expired`, revoking dashboard access
- [ ] **PAY-07**: Backend receives `membership.changeTierMemberRegistered` and updates `membership_tier`
- [ ] **PAY-08**: All incoming webhooks are idempotently deduplicated via a `webhook_events` ledger keyed on Mayar's `data.id`
- [ ] **PAY-09**: Each incoming webhook is cross-verified against Mayar's "Get Transaction" API before any side effects are applied
- [ ] **PAY-10**: Lifetime purchasers have permanent access (never expires — stored as `lifetime_purchased = true`)

### Access Control & Gating (GATE)

- [ ] **GATE-01**: Free-tier resources are accessible to all visitors without login
- [ ] **GATE-02**: Premium resource code is gated server-side — only returned to users with active membership or lifetime access
- [ ] **GATE-03**: Unauthenticated visitors viewing a premium resource see a paywall overlay with upgrade CTA
- [ ] **GATE-04**: Members whose subscription has expired see an account expired page with renewal CTA
- [ ] **GATE-05**: Access check uses `getUser()` via DAL (never `getSession()`; never client-only)

### Content Pipeline (CONTENT)

- [ ] **CONTENT-01**: Resources are stored as MDX files under `content/resources/<slug>/` with Zod-validated frontmatter (title, category, tags, is_premium, available_formats)
- [ ] **CONTENT-02**: Per-format code is stored as separate files in each resource folder (e.g. `framer.mdx`, `webflow.mdx`, `html.mdx`, `jsx.mdx`, `tsx.mdx`)
- [ ] **CONTENT-03**: Build-time manifest is generated from all resource MDX files (typed, Zod-validated)
- [ ] **CONTENT-04**: Each resource has: AVIF preview thumbnail, short looping video (Mux), and live demo URL
- [ ] **CONTENT-05**: MVP ships with 20–30 seed resources across multiple categories
- [ ] **CONTENT-06**: Admin can publish new resources by adding MDX files to the repo (no GUI CMS required at MVP)

### Dashboard & Discovery (DASH)

- [ ] **DASH-01**: Authenticated user can browse all resources in a responsive card grid
- [ ] **DASH-02**: User can filter resources by category
- [ ] **DASH-03**: User can search resources by name/tag via command-K (⌘K) fuzzy search
- [ ] **DASH-04**: Each resource card shows free vs premium indicator, hover video preview, and title
- [ ] **DASH-05**: User can save/bookmark a resource; saved state persists to Supabase across sessions
- [ ] **DASH-06**: User can view all their saved resources on a dedicated `/dashboard/saved` page

### Resource Detail (RES)

- [ ] **RES-01**: User can view looping Mux video preview on the resource detail page
- [ ] **RES-02**: User can open a full-screen live demo of the resource in a new tab
- [ ] **RES-03**: User can switch between available format tabs (Framer / Webflow / HTML / JSX / TSX)
- [ ] **RES-04**: Code blocks have syntax highlighting (rehype-pretty-code + Shiki)
- [ ] **RES-05**: User can copy the code for the currently selected format with one click
- [ ] **RES-06**: Premium format tabs show a lock icon and upgrade CTA when user is unauthenticated or unsubscribed

### Marketing & Public Pages (MKT)

- [ ] **MKT-01**: Home page communicates lailit.supply's value proposition and drives visitors to pricing
- [ ] **MKT-02**: Pricing page displays IDR prices for monthly and lifetime plans with Mayar checkout CTAs
- [ ] **MKT-03**: Public `/components` or `/explore` page lets visitors browse free-tier resources without logging in (lead magnet)
- [ ] **MKT-04**: Legal pages exist: `/legal/privacy-policy`, `/legal/terms-and-conditions`
- [ ] **MKT-05**: All public pages are mobile-responsive (targets 70%+ SEA mobile traffic)
- [ ] **MKT-06**: Login page with magic-link email input

### Account (ACCT)

- [ ] **ACCT-01**: User can view their account page showing membership tier, status, and expiry date
- [ ] **ACCT-02**: User can access Mayar Customer Portal from their account page to manage or cancel subscription

### Email Delivery (EMAIL)

- [ ] **EMAIL-01**: New member receives a branded magic-link welcome email via Resend within seconds of Mayar webhook firing
- [ ] **EMAIL-02**: Magic-link email expires after 24 hours (Supabase OTP expiry configured to 86400s)
- [ ] **EMAIL-03**: User can request a new magic link from the login page at any time

---

## v2 Requirements

### Subscription Tiers
- Annual subscription with ~20% discount vs monthly
- Team plan (per-seat billing, invite-link management, seat enforcement)

### Engagement
- Trending sort (aggregate copy-event counts, recomputed on schedule)
- Copy-event tracking schema and instrumentation (instrument in v1, surface in v2)
- Resource view count display

### Community
- Discord role auto-sync for paying members
- Resource request voting channel integration

### Email
- Membership expiry reminder email (7 days before expiry)
- Renewal confirmation email

### Content
- Video tutorial player per resource (long-form walkthrough)
- "Copy to Figma" button (writes to Figma clipboard format)
- Showcase page (community sites built with lailit.supply resources)

### Discovery
- Semantic AI search ("find a card hover that feels Apple-y")

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Annual subscription | Deferred to v2 — monthly + lifetime sufficient for MVP |
| Team/per-seat plans | Requires custom seat logic beyond Mayar's membership primitives; defer to v2 |
| In-browser code playground (Sandpack) | High complexity, not core to copy-paste value at MVP |
| CLI tool (`npx lailit add`) | Phase 4 differentiator; build traction first |
| Headless CMS / admin GUI | MDX-in-repo sufficient for first 100 resources |
| Multi-currency / international billing | IDR-only at launch; add international gateway post-MVP traction |
| Slack community | Using Discord instead; no Slack |
| OAuth / social login | Magic-link only — maps perfectly to Mayar webhook flow, no OAuth needed |
| Native mobile app | Web-first; mobile browser is sufficient for SEA |
| Password-based auth | Magic-link only per decision |
| Self-hosted video (BunnyCDN) | Mux free tier covers MVP; revisit at scale |

---

## Traceability

*(Populated by roadmapper — updated after roadmap creation)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| PAY-01 | — | Pending |
| PAY-02 | — | Pending |
| PAY-03 | — | Pending |
| PAY-04 | — | Pending |
| PAY-05 | — | Pending |
| PAY-06 | — | Pending |
| PAY-07 | — | Pending |
| PAY-08 | — | Pending |
| PAY-09 | — | Pending |
| PAY-10 | — | Pending |
| GATE-01 | — | Pending |
| GATE-02 | — | Pending |
| GATE-03 | — | Pending |
| GATE-04 | — | Pending |
| GATE-05 | — | Pending |
| CONTENT-01 | — | Pending |
| CONTENT-02 | — | Pending |
| CONTENT-03 | — | Pending |
| CONTENT-04 | — | Pending |
| CONTENT-05 | — | Pending |
| CONTENT-06 | — | Pending |
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| DASH-04 | — | Pending |
| DASH-05 | — | Pending |
| DASH-06 | — | Pending |
| RES-01 | — | Pending |
| RES-02 | — | Pending |
| RES-03 | — | Pending |
| RES-04 | — | Pending |
| RES-05 | — | Pending |
| RES-06 | — | Pending |
| MKT-01 | — | Pending |
| MKT-02 | — | Pending |
| MKT-03 | — | Pending |
| MKT-04 | — | Pending |
| MKT-05 | — | Pending |
| MKT-06 | — | Pending |
| ACCT-01 | — | Pending |
| ACCT-02 | — | Pending |
| EMAIL-01 | — | Pending |
| EMAIL-02 | — | Pending |
| EMAIL-03 | — | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 0 (roadmap pending)
- Unmapped: 48 ⚠️

---
*Requirements defined: 2026-05-05*
*Last updated: 2026-05-05 after initial definition*
