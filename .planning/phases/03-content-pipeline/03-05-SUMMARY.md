---
plan: 03-05
status: complete
completed: 2026-05-07
---

# Plan 03-05 Summary

## What was done
- Created src/app/(marketing)/explore/page.tsx — public /explore catalog with CategoryFilterRow
- Created src/components/explore/format-content-wrapper.tsx — 'use client', useState<Format>, wires onFormatChange to setActiveFormat
- Created src/app/(marketing)/explore/[slug]/page.tsx — static params, async params, premium gate (PaywallStub), free resource with functional format tabs

## Key decisions
- Used rawSource-only approach for FormatContentWrapper (proactive per plan instructions): props are `Record<Format, string>` instead of `Record<Format, { Component: ComponentType; rawSource: string }>`. This avoids the "Functions cannot be passed directly to Client Components" Server→Client boundary error since compiled MDX `ComponentType` functions are not serializable. Code is rendered as `<pre><code>` blocks — functional tab switching satisfies D-08.
- Removed `@mdx-js/mdx` compile/run from the slug page entirely — no MDX compilation on the server needed since we only display raw source strings.
- `FormatTabBar.onFormatChange` accepts `(format: Format) => void` directly, so `setActiveFormat` is passed without any cast.
- `availableFormats` is derived from compiled entries (files that actually exist on disk), so slug pages with missing format files degrade gracefully.

## Verification
- npx next build: PASS (20 static resource pages via generateStaticParams + /explore as static)
- npx vitest run: all 16 tests GREEN
