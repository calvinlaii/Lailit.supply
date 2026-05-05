---
phase: 01-marketing-surface
plan: 01
subsystem: marketing-shell
tags: [shadcn, design-system, layout, navigation, footer, accessibility]
dependency_graph:
  requires: []
  provides:
    - shadcn/ui v4 primitives (button, card, badge, input, label, sheet)
    - cn() utility at src/lib/utils.ts
    - Phase 1 CSS design tokens (radius, hero keyframes, reduced-motion)
    - Marketing route-group layout shell (TopNav + main#main + Footer)
    - TopNav with mobile Sheet hamburger
    - Footer with 3-column link grid
  affects:
    - All Phase 1 plans depend on this shell (01-02, 01-03, 01-04)
    - Phase 5 dashboard layout will reuse TopNav pattern
tech_stack:
  added:
    - shadcn/ui v4 (base-nova style, neutral base color, @base-ui/react primitives)
    - class-variance-authority
    - clsx + tailwind-merge
    - tw-animate-css
    - lucide-react
  patterns:
    - shadcn v4 with @base-ui/react (not Radix UI — breaking change from v3)
    - Tailwind v4 CSS-first config (@theme inline, no tailwind.config.js)
    - OKLCH color space for shadcn CSS variables
    - Route group (marketing) for layout isolation
key_files:
  created:
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/sheet.tsx
    - src/lib/utils.ts
    - components.json
    - src/app/(marketing)/layout.tsx
    - src/app/(marketing)/page.tsx
    - src/components/marketing/top-nav.tsx
    - src/components/marketing/footer.tsx
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
    - package.json
    - package-lock.json
decisions:
  - shadcn v4 uses @base-ui/react instead of Radix UI; Sheet.open/onOpenChange work through Dialog.Root props passthrough
  - Dark mode removed at CSS level by omitting .dark class block and @custom-variant dark directive
  - (marketing)/page.tsx created as temporary null-return placeholder; Plan 02 replaces this with real home page
  - SheetTrigger in v4 renders a native button natively (no asChild needed)
metrics:
  duration: 2 minutes
  completed: 2026-05-05
  tasks_completed: 2
  files_created: 12
  files_modified: 4
---

# Phase 1 Plan 01: Design System + Marketing Shell Summary

**One-liner:** shadcn/ui v4 initialized with neutral/new-york style, globals.css fixed for light-only mode with Geist font and hero keyframes, root layout updated for Bahasa Indonesia, and marketing layout shell built with sticky TopNav + Sheet-powered mobile hamburger and 3-column Footer.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Init shadcn/ui, fix globals.css, update root layout | 2192d06 | globals.css, layout.tsx, src/components/ui/*.tsx, src/lib/utils.ts |
| 2 | Build marketing layout shell with TopNav and Footer | 4ac63b1 | src/app/(marketing)/layout.tsx, top-nav.tsx, footer.tsx |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written, with one architectural observation:

**[Deviation - Architectural Observation] shadcn v4 uses @base-ui/react, not Radix UI**
- **Found during:** Task 1
- **Issue:** The plan referenced shadcn v3 concepts (new-york style, Radix UI). shadcn v4.7.0 has migrated to @base-ui/react primitives with a `base-nova` style preset. The `--style new-york` CLI flag does not exist in v4.
- **Fix:** Used `--defaults` flag which initializes with `base-nova` style and `neutral` base color. All specified components (button, card, badge, input, label, sheet) are available in v4. The Sheet API remains compatible: `open`/`onOpenChange` props work via Dialog.Root passthrough.
- **Files modified:** components.json (style: base-nova vs new-york), src/components/ui/*.tsx (Base UI primitives)
- **Impact:** All visual contracts in UI-SPEC.md remain achievable. The shadcn CSS variable system uses OKLCH color space instead of HSL in v3 — functionally equivalent for the neutral/monochrome palette.

**[Deviation - Light Mode] Dark mode block removal approach**
- **Found during:** Task 1
- **Issue:** shadcn v4 uses `.dark` CSS class for dark mode (not `prefers-color-scheme: dark`). Removing `.dark` block and the `@custom-variant dark` directive achieves D-01 light-only mode.
- **Fix:** Omitted both `.dark {}` class block and `@custom-variant dark` from globals.css. Geist Sans wired via `font-family: var(--font-geist-sans)` in `@layer base body` rule.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `return null` | src/app/(marketing)/page.tsx | 2 | Temporary placeholder per plan's verification step; Plan 02 creates real home page |
| `/explore` href | src/components/marketing/top-nav.tsx | navLinks | Stubbed per plan — wired in Phase 3 |
| `/explore` href | src/components/marketing/footer.tsx | Komponen link | Stubbed per plan — wired in Phase 3 |

## Verification Results

```
Build: PASS (next build succeeds, 4 static pages generated)
TypeScript: PASS (tsc --noEmit returns no errors)
```

### Acceptance Criteria

- [x] `grep 'lang="id"' src/app/layout.tsx` matches
- [x] `grep 'prefers-color-scheme' src/app/globals.css` returns 0 lines
- [x] `grep 'font-geist-sans' src/app/globals.css` matches
- [x] `grep 'orbit-cursor' src/app/globals.css` matches
- [x] `grep 'radius-full' src/app/globals.css` matches
- [x] `src/components/ui/button.tsx` exists
- [x] `src/components/ui/sheet.tsx` exists
- [x] `src/lib/utils.ts` contains `export function cn`
- [x] `src/app/(marketing)/layout.tsx` contains `id="main"`
- [x] Skip link "Lewati ke konten utama" present
- [x] Marketing layout has no `'use client'`
- [x] TopNav has `'use client'` on first line
- [x] SheetTrigger in TopNav
- [x] aria-label "Buka menu"/"Tutup menu" in TopNav
- [x] lailit.supply wordmark in TopNav
- [x] Footer has no `'use client'`
- [x] Footer contains "Kebijakan Privasi"
- [x] Footer contains "Syarat & Ketentuan"
- [x] Footer contains "2026 lailit.supply"

## Self-Check: PASSED

All committed files verified to exist. All commit hashes confirmed in git log.
