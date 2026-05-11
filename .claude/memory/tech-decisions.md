---
name: Tech Decisions
description: Key architectural decisions, constraints, and gotchas for lailit.supply
type: project
originSessionId: 3f12d2c7-e94f-40e4-82f1-aba274ba9dca
---
**Next.js 16 breaking changes (from CLAUDE.md):**
- Use `proxy.ts` NOT `middleware.ts`
- `cookies()`, `headers()`, `params` are all async — must await them
- Never use `getSession()` on server — always `getUser()` via DAL
- Never instantiate Supabase client at module scope (Vercel Fluid compute leaks sessions)
- Never use `next-mdx-remote` (CVE-2026-0969, archived April 2026)

**Clerk integration:**
- Package: @clerk/nextjs v7.3.3
- Env vars: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login, NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up, NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard, NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
- ClerkProvider wraps the app in src/app/layout.tsx
- src/proxy.ts exports clerkMiddleware as default — protects /dashboard(.*) and /account(.*)

**Fonts:**
- Geist Sans: --font-geist-sans (body/UI text)
- Geist Mono: --font-geist-mono (code)
- Press Start 2P: --font-pixeled (logo "LAILIT" + hero headings — substitute for Figma's "Pixeled" font)
- Caveat: loaded via Google Fonts CSS import (accent text like "for you!" in green)

**Explore catalog UI:**
- Sidebar: src/components/explore/explore-sidebar.tsx (shared between grid + detail)
- Grid page: src/components/explore/explore-layout.tsx (client, has search/filter/sort)
- Detail page: src/components/explore/resource-detail.tsx (client, uses useUser() for creator)
- Thumbnail: aspect-[4/3] (changed from aspect-video to match Figma)
- Grid: up to 5 columns (min-[1800px]:grid-cols-5)

**Figma design file:** https://www.figma.com/design/F2lwf95xRY2b8J3gabURQf/Untitled
- Node 37:10273 = component detail page layout
- Detail page header: flex-col gap-24 (96px gap between breadcrumb row and title row)

**Mayar webhooks:** No signature verification — use URL token + API cross-verify + idempotency ledger
