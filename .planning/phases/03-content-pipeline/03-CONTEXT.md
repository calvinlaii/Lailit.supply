---
phase: 03-content-pipeline
created: 2026-05-07
status: ready
---

# Phase 3: Content Pipeline & Free-Tier Browse — Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the MDX-in-repo content architecture with Zod-validated frontmatter, a build-time typed manifest, 20–30 placeholder seed resources across 4 categories, a public `/explore` page with category filtering, and full-layout free-tier resource detail pages with format tabs and syntax highlighting.

Requirements in scope: CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05, CONTENT-06, MKT-03, GATE-01

</domain>

<decisions>
## Implementation Decisions

### Seed Content
- **D-01:** Seed resources use placeholder content — valid MDX frontmatter + dummy/lorem code blocks. Struktur arsitektur benar, isi bisa diganti ke konten real nanti tanpa ubah apapun.
- **D-02:** 4 categories: `animation`, `ui-components`, `layout`, `interactions`. ~5–8 resources per category to reach 20–30 total seed items.
- **D-03:** Frontmatter fields: `title`, `category`, `tags` (array), `is_premium` (boolean), `available_formats` (array of `framer | webflow | html | jsx | tsx`), `mux_playback_id` (string | null), `demo_url` (string | null). All Zod-validated at build time — build fails on invalid frontmatter.

### Explore Page
- **D-04:** Public URL: `/explore` (not `/components`)
- **D-05:** Layout: 3–4 column dense grid, responsive (1 col mobile → 2 col tablet → 3–4 col desktop). Each card shows: placeholder thumbnail, title, Free/Premium badge, category label.
- **D-06:** Category filter: chip/tab row above grid — All | Animation | UI Components | Layout | Interactions. Client-side filter (no page reload). Unauthenticated visitors can filter freely.
- **D-07:** `/explore` is fully public — no auth required, no redirect to login.

### Resource Detail Page
- **D-08:** Free-tier resource detail pages get the full layout: format tabs (Framer / Webflow / HTML / JSX / TSX), syntax-highlighted code blocks (rehype-pretty-code + Shiki), one-click copy button.
- **D-09:** Premium resource tabs show a lock icon + upgrade CTA stub (Phase 5 will wire real paywall). In Phase 3, premium resources are visible in `/explore` catalog but their detail content is NOT rendered server-side to unauthenticated requests — return 403 / paywall placeholder.
- **D-10:** Only tabs listed in `available_formats` frontmatter are shown. Missing format tabs are hidden, not shown as disabled.

### Video & Thumbnails
- **D-11:** Mux video: placeholder only in Phase 3. Frontmatter includes `mux_playback_id` field for future use, but Phase 3 renders a placeholder/empty state (e.g., gradient box). Real Mux integration comes in Phase 5.
- **D-12:** AVIF thumbnails: placeholder solid-color or gradient per category in Phase 3. File path pattern `content/resources/<slug>/thumbnail.avif` reserved in schema — swap in real assets later without code changes.

### Build-Time Manifest
- **D-13:** Use `globby` to discover all resource folders, `gray-matter` to parse frontmatter, Zod schema to validate. Output typed JSON manifest at build time. Manifest used by `/explore` and resource detail pages.
- **D-14:** Per ROADMAP constraint: use `@next/mdx` — NOT `next-mdx-remote` (CVE-2026-0969), NOT `contentlayer` (unmaintained), NOT `velite` (Turbopack-incompatible).
- **D-15:** Pre-Phase 3 spike flagged in STATE.md: validate Turbopack + `rehype-pretty-code` + `shiki` integration first before full implementation.

### Claude's Discretion
- Exact slug naming convention for seed resources (e.g., `fade-in-on-scroll`, `button-hover-glow`)
- Number of resources per category (target ~5-8 each, exact count flexible)
- Placeholder thumbnail color/gradient scheme per category
- Exact copy for paywall stub on locked premium detail pages

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Constraints
- `.planning/ROADMAP.md` §Phase 3 — Goal, success criteria, explicit tech constraints (no next-mdx-remote, no contentlayer, no velite)
- `.planning/REQUIREMENTS.md` §CONTENT-01 through CONTENT-06, MKT-03, GATE-01 — Full acceptance criteria

### Next.js 16 Docs
- `node_modules/next/dist/docs/` — Read before writing any Next.js code (breaking changes from training data)

### Existing Codebase Patterns
- `src/lib/dal.ts` — DAL pattern for auth checks (needed for premium gating)
- `proxy.ts` — Route protection pattern
- `src/app/(marketing)/` — Marketing route group (explore page goes here)
- `src/components/ui/` — Existing shadcn/ui components to reuse in resource cards

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` — shadcn/ui Card, Badge, Button components available for resource cards
- `src/components/marketing/` — Marketing layout components for explore page shell
- `src/lib/dal.ts` — `getUser()` for premium content gating
- `src/lib/supabase/server.ts` — Server client factory for any server-side auth checks

### Established Patterns
- Tailwind v4 with `@theme` inline block (no `tailwind.config.js`)
- `(marketing)` route group for public pages — explore page fits here
- `(dashboard)` route group for auth-gated pages — not used in Phase 3

### Integration Points
- `/explore` goes under `src/app/(marketing)/explore/`
- Resource detail: `src/app/(marketing)/explore/[slug]/`
- Content folder: `content/resources/<slug>/` at project root
- Build-time manifest: `src/lib/manifest.ts` or `src/lib/content.ts`

</code_context>

<specifics>
## Specific Ideas

- Layout reference: osmo.supply gallery-style dense grid
- Category filter: chip/tab row (not sidebar) — consistent with mobile-first SEA audience
- Format tab labels should match the actual platform names: "Framer", "Webflow", "HTML", "JSX", "TSX"

</specifics>

<deferred>
## Deferred Ideas

- Real Mux video integration — Phase 5 (Paid Content Delivery)
- Real AVIF thumbnails — swap in before launch, no Phase needed
- Hover video preview on cards — Phase 5
- Search/filter by tags — Phase 6 (Discovery & Bookmarks)
- Animation previews in explore page — Phase 5

</deferred>

---

*Phase: 03-content-pipeline*
*Context gathered: 2026-05-07*
