---
name: Project Context
description: lailit.supply — Indonesian component library, current stack and state
type: project
originSessionId: 3f12d2c7-e94f-40e4-82f1-aba274ba9dca
---
**What it is:** lailit.supply — a component library website for Indonesian developers. Free + premium components in Framer, Webflow, HTML, JSX, TSX formats.

**GitHub:** https://github.com/calvinlaii/Lailit.supply

**Stack:**
- Next.js 16.2.4 (App Router, Turbopack dev)
- TypeScript
- Tailwind CSS v4
- Clerk v7.3.3 — authentication (replaced Supabase magic-link auth)
- Supabase — database only (membership/subscription data, Mayar webhooks)
- Mayar — Indonesian payment gateway (webhooks at /api/webhooks/mayar)
- Resend + React Email — transactional emails
- MDX + gray-matter + fast-glob — file-based CMS for components
- Vercel — deployment target

**Key file locations:**
- Route groups: `src/app/(marketing)/`, `src/app/(explore)/`, `src/app/(dashboard)/`
- Explore catalog: `src/app/(explore)/explore/` and `src/app/(explore)/explore/[slug]/`
- Component content: `content/resources/[slug]/index.mdx` + format files (framer.mdx, tsx.mdx, etc.)
- Auth middleware: `src/proxy.ts` (Next.js 16 uses proxy.ts NOT middleware.ts)
- Auth DAL: `src/lib/dal.ts` — uses Clerk's `currentUser()`
- Supabase clients: `src/lib/supabase/` (server.ts, admin.ts, client.ts)
- Content lib: `src/lib/content.ts` — ResourceMeta schema + getAllResources/getResourceBySlug

**ResourceMeta schema fields:** title, category, description (optional), tags, is_premium, available_formats, mux_playback_id, demo_url, published_at (optional), slug

**Auth flow:**
- Clerk handles login/signup at /login ([[...login]]) and /sign-up ([[...sign-up]])
- src/proxy.ts runs clerkMiddleware, protects /dashboard and /account routes
- Unauthenticated users hitting /dashboard → 307 redirect to /login
- dal.ts uses currentUser() from @clerk/nextjs/server

**Current phase:** Phase 1 (Marketing Surface) per .planning/ROADMAP.md
**Planning:** .planning/ directory with GSD workflow

**Why:** `proxy.ts` not `middleware.ts` — Next.js 16 renamed middleware to proxy.
**Why:** Clerk moved from Supabase magic-link auth (commit 7764baf by collaborator).
**Why:** `src/proxy.ts` not `./proxy.ts` — when src/app exists, Clerk expects proxy at src/.
