# lailit.supply

## What This Is

lailit.supply is a subscription-based creative dev toolkit for Indonesian and SEA creative web developers — a curated, growing library of ready-to-use animation components, interactions, and UI elements delivered across multiple formats: Framer, Webflow, vanilla HTML/CSS/JS, JSX, and TSX. Members get a paywalled dashboard with a free tier and premium locked content, paying through Mayar.id with Indonesian-native payment methods.

## Core Value

A premium, multi-platform component library built specifically for the Indonesian/SEA creative dev market — the only one in this niche.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can browse a gallery of components on the dashboard with category filters
- [ ] User can access free-tier components without paying
- [ ] User can pay via Mayar.id (QRIS, e-wallets, bank transfer) to unlock premium content
- [ ] User receives a magic-link email after payment and logs in without a password
- [ ] User can view resource detail with code blocks for multiple formats (Framer, Webflow, HTML, JSX, TSX)
- [ ] User can copy code for a specific format with one click
- [ ] User can search resources via command-K (fuzzy search)
- [ ] User can save/bookmark resources across sessions
- [ ] User can see a live preview of a component before copying
- [ ] User can manage billing through Mayar Customer Portal
- [ ] Admin can add resources via MDX files in the repo
- [ ] New member gets account auto-created via Mayar webhook on payment

### Out of Scope

- Annual subscription tier — MVP launches with monthly + lifetime only; annual added in V2
- Team plan — per-seat billing requires custom seat logic; defer to V2
- Headless CMS admin — MDX in repo is sufficient for MVP; add CMS when content team grows
- CLI tool (`npx lailit add`) — Phase 4 differentiator, post-traction
- Live in-browser playground / Sandpack — Phase 4, complex infrastructure
- International/multi-currency — IDR-only at launch; add international gateway post-MVP
- Slack community — user prefers Discord; skip Slack entirely

## Context

- **Reference product**: Osmo.supply — similar model but DOM/CSS/GSAP-only, global market, Netherlands-based. lailit.supply's differentiation: multi-library, multi-format, Indonesian-first.
- **Payment architecture**: Mayar.id handles checkout, recurring billing, and customer portal. The backend receives webhooks to create user accounts and manage access. No account creation before payment — cleaner UX.
- **Content strategy**: Resources ship in 5 formats (Framer, Webflow, HTML, JSX, TSX). MDX files in the repo for MVP. Each resource has: preview thumbnail (avif), short video preview, live demo, per-format code blocks with copy buttons.
- **Free vs paid split**: A subset of resources is permanently free (no login required or free-tier login). Premium resources are locked behind membership. This is the lead magnet — no separate `/coba` demo route needed.
- **Tech stack confirmed**: Next.js 16 App Router, Supabase (Postgres + `@supabase/ssr`), Clerk (auth), Mayar.id, Resend (transactional email), Cloudflare Workers via `@opennextjs/cloudflare`, Discord community.
- **Existing codebase**: Create Next App starter at project root — no product code yet.

## Constraints

- **Tech stack**: Next.js 16 App Router — no Pages Router
- **Payments**: Mayar.id only at MVP — IDR-native, no Stripe
- **Database**: Supabase Postgres — DAL pattern with `@supabase/ssr`
- **Auth**: Clerk (`@clerk/nextjs`) — `clerkMiddleware` runs on Edge runtime
- **Hosting**: Cloudflare Workers via `@opennextjs/cloudflare` adapter — Edge middleware only (Node middleware not yet supported by adapter)
- **Middleware file**: `src/middleware.ts` temporarily (not `proxy.ts`) until OpenNext Cloudflare ships proxy support — see opennextjs/opennextjs-cloudflare#972
- **Email**: Resend — magic link delivery and transactional
- **Content**: MDX files in repo — no external CMS at MVP
- **Community**: Discord — not Slack
- **Next.js version**: Has breaking changes from training data — read `node_modules/next/dist/docs/` before writing any Next.js code

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Indonesia/SEA-first market | Zero direct Indonesian competitor in this niche; Mayar.id enables IDR-native payments naturally | — Pending |
| Multi-library, multi-format (5 tracks) | Broader than Osmo (DOM+CSS only) — wider appeal, more content work per resource | — Pending |
| Magic link auth via Mayar webhook | Pay → webhook → account created → magic link sent. No pre-signup friction. | — Pending |
| Free tier (not demo route) | Permanent free access to subset of resources is stickier than a one-time demo | — Pending |
| Monthly + Lifetime (no annual at MVP) | Simplest pricing; annual adds 20% discount complexity without MVP signal | — Pending |
| MDX in repo for content | Free, version-controlled, sufficient for first 100 resources | — Pending |
| Supabase for Postgres | Free tier generous, built-in auth helpers, great Next.js DX | — Pending |
| Cloudflare Workers as deploy target (2026-05-13) | User preference over Vercel. Uses `@opennextjs/cloudflare` adapter. Forces Edge runtime for middleware — see middleware.ts vs proxy.ts decision below. | — Pending |
| `middleware.ts` instead of `proxy.ts` (2026-05-13) | OpenNext Cloudflare hasn't shipped proxy.ts support yet (Next 16 file rename). Clerk requires middleware to run, so use legacy file name. Revert when opennextjs-cloudflare#972 lands. | — Temporary regression |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-13 — added Cloudflare Workers deploy target + middleware.ts temporary regression*
