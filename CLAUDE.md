@AGENTS.md

# GSD Workflow

This project uses GSD (Get Shit Done) for structured phase-based development.

## Active Project
- **Project:** lailit.supply
- **Planning:** `.planning/`
- **Current Phase:** Phase 1 — Marketing Surface
- **Roadmap:** `.planning/ROADMAP.md`

## Phase Execution Rules
- Always read `.planning/STATE.md` at session start
- Run `/gsd-plan-phase N` before executing any phase
- Run `/gsd-execute-phase N` to execute a planned phase
- Never skip phases — ordering is architecturally enforced (see ROADMAP.md)

## Key Constraints
- **Deploy target: Cloudflare Workers** via `@opennextjs/cloudflare` (see `wrangler.jsonc`, `open-next.config.ts`)
- Next.js 16: **temporarily on `src/middleware.ts`** (NOT `proxy.ts`) — OpenNext Cloudflare doesn't yet support proxy.ts (tracking: opennextjs/opennextjs-cloudflare#972). Revert to `proxy.ts` once upstream lands the Adapters API.
- `cookies()`/`headers()`/`params` are async
- Never use `getSession()` on server — always `getUser()` via DAL
- Never instantiate Supabase client at module scope (leaks sessions across requests in serverless/Workers)
- Never use `next-mdx-remote` (CVE-2026-0969, archived April 2026)
- Mayar webhooks have no signature verification — use URL token + API cross-verify + idempotency ledger
- Phase 4 (Payments & Webhooks) note: webhook handler runs on workerd (Cloudflare Workers). Verify any Node-only deps work with `nodejs_compat`.

