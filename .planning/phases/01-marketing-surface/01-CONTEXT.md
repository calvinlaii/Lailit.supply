# Phase 1: Marketing Surface - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

A polished, mobile-responsive public website: home page, pricing page, legal pages (`/legal/privacy-policy`, `/legal/terms-and-conditions`), and login page. All pages are static Next.js 16 App Router surfaces with zero backend dependencies. Checkout CTAs on `/pricing` are stubbed links (wired to Mayar in Phase 4). Magic-link form on `/login` is UI-only (wired in Phase 2).

</domain>

<decisions>
## Implementation Decisions

### Brand & Visual Direction
- **D-01:** Light-first color mode (white/off-white background, dark text). No dark mode at MVP.
- **D-02:** No accent color — pure black + white palette. Component previews provide the visual color. Brutalist/editorial aesthetic.
- **D-03:** Variable sans-serif typography — use Geist (already in Next.js ecosystem, no licensing cost). Clean and modern.
- **D-04:** Spacious + editorial feel. Big type, generous whitespace. Let content breathe. Premium positioning.

### Hero Section
- **D-05:** Primary visual hook: bold headline + one looping animated component demo playing live. Shows motion capability immediately.
- **D-06:** Tagline: **"Komponen kreatif untuk developer Indonesia"** (and/or a punchy Indonesian sub-headline). This is the brand anchor.
- **D-07:** Two CTAs in the hero: primary ("Mulai Sekarang" → `/pricing`) + secondary ("Lihat Contoh" → free component browse page, stubbed for Phase 3).

### Copy Language
- **D-08:** Bahasa Indonesia primary throughout. All headlines, CTAs, descriptions, and section labels in Indonesian.
- **D-09:** Voice: builder-to-builder, casual confidence. Like one developer talking to another. Direct, a little playful. Not formal or corporate.

### Pricing Page Layout
- **D-10:** Side-by-side plan cards for Monthly vs Lifetime. Easy comparison.
- **D-11:** Each plan card shows: IDR price (e.g. "Rp 449.000/bulan" and "Rp 13.500.000 sekali bayar"), feature bullet list (what's included), "Paling Populer" badge on the Monthly plan, and a cancellation/reassurance note ("Batalkan kapan saja" on monthly).
- **D-12:** Checkout CTAs on pricing page are stubbed (`href="#"` or a "Segera Hadir" state) — wired to Mayar in Phase 4.

### Navigation
- **D-13:** Minimal top nav: logo left, links right ("Komponen", "Harga", "Masuk"). Mobile: hamburger menu.

### Legal & Login Pages
- **D-14:** Legal pages are simple text-heavy pages. No special design — just clean typography, breadcrumb back to home.
- **D-15:** Login page: single centered email input form + "Kirim Magic Link" button. Form submission is a no-op (wired in Phase 2). Show instructional copy below: "Kami akan kirim link masuk ke emailmu."

### Claude's Discretion
- Exact spacing values, margin/padding scales
- Footer structure and links
- Exact animated component to use in hero (pick any visually impressive one from the planned library, or a placeholder)
- Loading states and transitions between pages
- Favicon and Open Graph meta tags

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/REQUIREMENTS.md` — MKT-01, MKT-02, MKT-04, MKT-05, MKT-06 are the phase requirements
- `.planning/PROJECT.md` — Brand decisions, IDR pricing values, market positioning

### Research Findings
- `.planning/research/STACK.md` — Confirmed stack: Next.js 16.2.4, Tailwind v4, shadcn/ui v3, Geist font
- `.planning/research/SUMMARY.md` — Key pitfalls and architectural notes

### Next.js 16 Specifics
- `node_modules/next/dist/docs/01-app/01-getting-started/` — Next.js 16 App Router conventions
- `node_modules/next/dist/docs/01-app/02-guides/` — Next.js 16 guides

No external ADRs or design docs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/globals.css` — Existing Tailwind v4 global styles. Should be extended, not replaced.
- `src/app/layout.tsx` — Root layout. Will become the marketing layout shell.

### Established Patterns
- None yet — this is the first phase. Patterns established here become the convention for all future phases.
- Tailwind v4 uses `@theme` directive (no `tailwind.config.js`) — research confirmed this.

### Integration Points
- `src/app/` — App Router root. Marketing pages go in a `(marketing)` route group.
- Navigation component built here will be reused in the dashboard layout (Phase 5).

</code_context>

<specifics>
## Specific Ideas

- Tagline: "Komponen kreatif untuk developer Indonesia" — this is the headline anchor
- Hero animated demo should feel like it's "alive" — something with smooth motion (could be a placeholder particle/canvas animation or a real component from the upcoming library)
- Pricing: "Rp 449.000/bulan" for Monthly, "Rp 13.500.000 sekali bayar" for Lifetime (from PROJECT.md spec Section 18.2 IDR conversions)
- "Paling Populer" badge on Monthly plan
- "Batalkan kapan saja" reassurance on Monthly
- Login page instructional copy: "Kami akan kirim link masuk ke emailmu."

</specifics>

<deferred>
## Deferred Ideas

- Dark mode — future enhancement post-MVP
- Annual plan card on pricing — deferred to v2 (no annual tier at MVP)
- FAQ section on pricing page — could add in Phase 1 or later; scope-dependent
- Showcase / testimonials section — Phase 3+ once members exist
- Newsletter signup — v2

</deferred>

---

*Phase: 01-marketing-surface*
*Context gathered: 2026-05-05*
