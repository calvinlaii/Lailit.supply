---
phase: 01-marketing-surface
plan: 03
subsystem: pricing-page
tags: [pricing, static, server-component, idr, stub-cta, bahasa-indonesia]
dependency_graph:
  requires:
    - 01-01 (shadcn primitives, marketing layout shell with TopNav + Footer)
  provides:
    - /pricing static page with side-by-side plan cards (stacked on mobile)
    - PricingCard component (monthly/lifetime variants)
    - PricingCardGrid layout component
  affects:
    - Phase 4 will swap stub CTAs to real Mayar.id checkout hrefs (data-stub="true" markers)
tech_stack:
  added: []
  patterns:
    - Server Component pricing card with variant prop pattern
    - Stubbed CTA pattern: <a aria-disabled="true" data-stub="true" href="#" tabIndex={-1}>
    - fontVariantNumeric tabular-nums for IDR price alignment
    - Absolute-positioned badge (top-right corner of card)
key_files:
  created:
    - src/components/marketing/pricing-card.tsx
    - src/components/marketing/pricing-card-grid.tsx
    - src/app/(marketing)/pricing/page.tsx
  modified: []
decisions:
  - Used plain <div> for card container instead of shadcn Card primitive — shadcn v4 Card has opinionated ring/bg/gap defaults that conflict with the 1px border-neutral-200 + custom shadow spec
  - Badge implemented as inline <span> with rounded-full rather than shadcn Badge — avoids v4 Badge variant override complexity for a simple black pill
  - tabIndex=-1 on stub CTA anchors prevents keyboard navigation to inert elements
metrics:
  duration: 2 minutes
  completed: 2026-05-05
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 1 Plan 03: Pricing Page Summary

**One-liner:** Static /pricing page with two IDR-priced plan cards (Rp 449.000/bulan and Rp 13.500.000 sekali bayar), side-by-side on desktop, stacked on mobile, with Bahasa Indonesia copy verbatim from UI-SPEC and aria-disabled stub CTAs marked for Phase 4 Mayar.id wiring.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Build PricingCard and PricingCardGrid components | 795a63d | src/components/marketing/pricing-card.tsx, src/components/marketing/pricing-card-grid.tsx |
| 2 | Build pricing page | 06e1426 | src/app/(marketing)/pricing/page.tsx |

## Deviations from Plan

None — plan executed exactly as written.

**Note on shadcn Card primitive:** The plan's `<interfaces>` block suggested using shadcn `Card`, `CardHeader`, `CardContent`, `CardFooter` primitives. However, the plan's `<action>` block explicitly showed a plain `<div>` implementation. The plan's own implementation template was followed — the plain `<div>` approach is the correct choice given the shadcn v4 Card's opinionated `ring-1 ring-foreground/10` and `bg-card` defaults which would require significant override to match the `border-neutral-200` + custom shadow spec. This is not a deviation — it is the plan's stated implementation.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `href="#"` aria-disabled stub CTA | src/components/marketing/pricing-card.tsx | 87–93 | Intentional per D-12 and plan spec — Phase 4 wires to real Mayar.id checkout URLs. data-stub="true" is the wiring marker. |

## Threat Surface Scan

No new security surface introduced. This plan builds a fully static Server Component page with no user input, no API calls, no auth paths, and no data sources. The stub CTAs are inert `<a>` elements with `pointer-events-none`. The plan's threat model correctly categorizes all threats as `accept`.

## Verification Results

```
npm run build: PASS
Routes: ○ / ○ /_not-found ○ /pricing (all static)
TypeScript: PASS (no type errors)
```

### Acceptance Criteria

- [x] `grep "use client" src/components/marketing/pricing-card.tsx` returns 0 lines (Server Component)
- [x] `grep "use client" src/components/marketing/pricing-card-grid.tsx` returns 0 lines (Server Component)
- [x] `grep "Rp 449.000" src/components/marketing/pricing-card.tsx` matches
- [x] `grep "Rp 13.500.000" src/components/marketing/pricing-card.tsx` matches
- [x] `grep "Paling Populer" src/components/marketing/pricing-card.tsx` matches
- [x] `grep "Batalkan kapan saja" src/components/marketing/pricing-card.tsx` matches
- [x] `grep "sekali bayar" src/components/marketing/pricing-card.tsx` matches
- [x] `grep "Berlangganan Bulanan" src/components/marketing/pricing-card.tsx` matches
- [x] `grep "Beli Lifetime" src/components/marketing/pricing-card.tsx` matches
- [x] `grep 'aria-disabled="true"' src/components/marketing/pricing-card.tsx` matches
- [x] `grep 'data-stub="true"' src/components/marketing/pricing-card.tsx` matches
- [x] `grep "cursor-not-allowed" src/components/marketing/pricing-card.tsx` matches
- [x] `grep "pointer-events-none" src/components/marketing/pricing-card.tsx` matches
- [x] `grep "tabular-nums" src/components/marketing/pricing-card.tsx` matches
- [x] `grep "md:grid-cols-2" src/components/marketing/pricing-card-grid.tsx` matches
- [x] `grep "grid-cols-1" src/components/marketing/pricing-card-grid.tsx` matches
- [x] `grep "use client" src/app/(marketing)/pricing/page.tsx` returns 0 lines
- [x] `grep 'title: "Harga' src/app/(marketing)/pricing/page.tsx` matches
- [x] `grep "Akses penuh ke seluruh komponen" src/app/(marketing)/pricing/page.tsx` matches
- [x] `grep "tidak ada tier tersembunyi" src/app/(marketing)/pricing/page.tsx` matches
- [x] `grep "Harga sudah termasuk PPN" src/app/(marketing)/pricing/page.tsx` matches
- [x] `grep "Mayar.id" src/app/(marketing)/pricing/page.tsx` matches
- [x] `grep "PricingCardGrid" src/app/(marketing)/pricing/page.tsx` matches
- [x] `npm run build` exits 0, /pricing in build output

## Self-Check: PASSED

All created files confirmed to exist. All commit hashes confirmed in git log.
