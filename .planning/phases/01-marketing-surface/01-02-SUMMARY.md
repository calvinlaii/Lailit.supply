---
phase: 01-marketing-surface
plan: 02
subsystem: marketing-home
tags: [home-page, hero, css-animation, server-component, bahasa-indonesia]
dependency_graph:
  requires:
    - 01-01 (shadcn primitives, globals.css hero keyframes, marketing layout shell)
  provides:
    - Home page at / composing HeroSection + ValuePropsGrid + PricingTeaser
    - HeroSection with display headline, CTAs, animated demo embed
    - HeroAnimatedDemo: CSS-only Server Component magnetic orbit animation
    - ValuePropsGrid: 3-column value props (1-col mobile)
    - PricingTeaser: centered pricing nudge linking to /pricing
  affects:
    - / route rendered as static Server Component
    - Visitor conversion funnel entry point (MKT-01)
tech_stack:
  added: []
  patterns:
    - Pure Server Component with zero JS shipped to client
    - CSS-only animation via @keyframes defined in globals.css (hero-demo-cursor, hero-demo-button)
    - Tailwind v4 arbitrary value syntax (text-[3rem], max-w-[960px], aspect-video)
    - next/link for internal navigation
key_files:
  created:
    - src/components/marketing/hero-animated-demo.tsx
    - src/components/marketing/hero-section.tsx
    - src/components/marketing/value-props-grid.tsx
    - src/components/marketing/pricing-teaser.tsx
  modified:
    - src/app/(marketing)/page.tsx (replaced null stub with real home page composition)
decisions:
  - CSS-only animation uses hero-demo-cursor/hero-demo-button classes from globals.css — zero JS to client
  - Both CTAs use next/link; /explore secondary CTA is intentionally stubbed (Phase 3 wires it)
  - value-props body copy uses lowercase 'nggak' per D-09 informal voice convention
metrics:
  duration: ~3 minutes
  completed: 2026-05-05
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 1 Plan 02: Home Page + Animated Hero Summary

**One-liner:** CSS-only animated magnetic hover demo in a Server Component hero, 3-column value props grid, and pricing teaser composing the Bahasa Indonesia home page at /.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Build HeroAnimatedDemo and HeroSection components | cb607f6 | hero-animated-demo.tsx, hero-section.tsx |
| 2 | Build ValuePropsGrid, PricingTeaser, and home page | bdbac52* | value-props-grid.tsx, pricing-teaser.tsx, (marketing)/page.tsx |

*Task 2 files were committed as part of plan 01-03 parallel executor (bdbac52) which ran concurrently and built the same content. Content is correct and verified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Voice Convention] Lowercase 'nggak' per D-09**
- **Found during:** Task 2
- **Issue:** Initial write used "Nggak ada vendor lock-in." (capitalized) but UI-SPEC D-09 requires lowercase informal Indonesian (`nggak`) per voice convention check. Plan acceptance criteria also explicitly tests for lowercase.
- **Fix:** Changed to "nggak ada vendor lock-in." in value-props-grid.tsx body copy.
- **Files modified:** src/components/marketing/value-props-grid.tsx
- **Commit:** cb607f6 (included in Task 1 commit context; fix applied before Task 2 commit)

### Parallel Executor Overlap

**[Observation] Plan 01-03 parallel executor committed Task 2 artifacts**
- **Context:** Plans 01-02 and 01-03 ran in parallel waves. The 01-03 executor built its pricing page which depended on HeroSection (from Task 1), and also committed value-props-grid.tsx, pricing-teaser.tsx, and the updated (marketing)/page.tsx as part of its PricingTeaser dependency chain.
- **Impact:** Task 2 files exist on the branch with correct, identical content. Both executors produced the same output from the same spec. No conflicts.
- **Resolution:** Task 2 verified as complete — all acceptance criteria pass, npm run build exits 0.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `/explore` href in secondary CTA | src/components/marketing/hero-section.tsx | 29 | Intentional — Phase 3 wires the component browse page |

## Verification Results

```
Build: PASS (npm run build exits 0, / route in static output)
TypeScript: PASS (tsc compiled successfully)
```

### Acceptance Criteria

- [x] `grep "use client" hero-animated-demo.tsx` returns ZERO lines (Server Component)
- [x] `grep "use client" hero-section.tsx` returns ZERO lines (Server Component)
- [x] `grep "hero-demo-cursor" hero-animated-demo.tsx` matches
- [x] `grep "hero-demo-button" hero-animated-demo.tsx` matches
- [x] `grep 'role="img"' hero-animated-demo.tsx` matches
- [x] `grep 'aria-label.*Demo animasi' hero-animated-demo.tsx` matches
- [x] `grep "Komponen kreatif untuk developer Indonesia" hero-section.tsx` matches
- [x] `grep "Animasi siap pakai" hero-section.tsx` matches
- [x] `grep "Mulai Sekarang" hero-section.tsx` matches
- [x] `grep 'href="/pricing"' hero-section.tsx` matches
- [x] `grep "Lihat Contoh" hero-section.tsx` matches
- [x] `grep "aspect-video" hero-animated-demo.tsx` matches
- [x] `grep "use client" value-props-grid.tsx` returns ZERO lines
- [x] `grep "use client" pricing-teaser.tsx` returns ZERO lines
- [x] `grep "Lima format, satu sumber" value-props-grid.tsx` matches
- [x] `grep "Bayar pakai Rupiah" value-props-grid.tsx` matches
- [x] `grep "Dirancang buat copy-paste" value-props-grid.tsx` matches
- [x] `grep "nggak ada vendor lock-in" value-props-grid.tsx` matches (lowercase)
- [x] `grep "Satu kali bayar, atau langganan" pricing-teaser.tsx` matches
- [x] `grep "Lihat semua paket" pricing-teaser.tsx` matches
- [x] `grep 'href="/pricing"' pricing-teaser.tsx` matches
- [x] `grep "grid-cols-3" value-props-grid.tsx` matches
- [x] `grep "grid-cols-1" value-props-grid.tsx` matches
- [x] `(marketing)/page.tsx` imports and renders HeroSection, ValuePropsGrid, PricingTeaser
- [x] `npm run build` exits 0

## Threat Surface Scan

No new security-relevant surfaces introduced. This plan builds pure static Server Components with no network endpoints, no user input, no API calls, and no dynamic data. No threat flags.

## Self-Check: PASSED

All created files verified to exist on disk. Task 1 commit `cb607f6` confirmed in git log. Task 2 artifacts confirmed in git log at `bdbac52` with correct content matching all acceptance criteria.
