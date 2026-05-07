# Phase 3: Content Pipeline & Free-Tier Browse — Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 16 new/modified files
**Analogs found:** 14 / 16

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `next.config.ts` | config | transform | `next.config.ts` (modify existing) | exact |
| `mdx-components.tsx` | config | transform | — | no analog |
| `src/lib/content.ts` | utility/service | batch (build-time) | `src/lib/dal.ts` | role-match |
| `src/app/(marketing)/explore/page.tsx` | component (page) | request-response | `src/app/(marketing)/pricing/page.tsx` | exact |
| `src/app/(marketing)/explore/[slug]/page.tsx` | component (page) | request-response | `src/app/(dashboard)/dashboard/page.tsx` | role-match |
| `src/components/explore/resource-card.tsx` | component | request-response | `src/components/marketing/pricing-card.tsx` | role-match |
| `src/components/explore/category-filter-row.tsx` | component (client) | event-driven | `src/components/marketing/top-nav.tsx` | role-match |
| `src/components/explore/format-tab-bar.tsx` | component (client) | event-driven | `src/components/marketing/top-nav.tsx` | role-match |
| `src/components/explore/code-block.tsx` | component | request-response | `src/components/dashboard/dashboard-stub-card.tsx` | partial |
| `src/components/explore/copy-button.tsx` | component (client) | event-driven | `src/components/marketing/login-form.tsx` (button pattern) | partial |
| `src/components/explore/thumbnail-placeholder.tsx` | component | request-response | `src/components/marketing/hero-animated-demo.tsx` | role-match |
| `src/components/explore/video-placeholder.tsx` | component | request-response | `src/components/marketing/hero-animated-demo.tsx` | role-match |
| `src/components/explore/paywall-stub.tsx` | component | request-response | `src/components/dashboard/dashboard-stub-card.tsx` | exact |
| `content/resources/<slug>/index.mdx` | config (content) | batch | — | no analog |
| `content/resources/<slug>/<format>.mdx` | config (content) | batch | — | no analog |
| `src/lib/__tests__/content.test.ts` | test | batch | `src/components/marketing/__tests__/login-form.test.tsx` | role-match |

---

## Pattern Assignments

### `next.config.ts` (config, transform)

**Analog:** `next.config.ts` (lines 1–8) — existing file to be modified, not replaced.

**Existing file** (lines 1–8):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**Target pattern** — wrap with `createMDX`, add `pageExtensions`, add rehype plugin using **string name only** (Turbopack-safe):
```typescript
// next.config.ts — full replacement
import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [
      // CRITICAL: string plugin name + serializable options ONLY
      // Never pass getHighlighter / onVisitLine / any function — breaks Turbopack
      ['rehype-pretty-code', { theme: 'github-dark-dimmed' }],
    ],
  },
})

export default withMDX(nextConfig)
```

**Critical constraint:** Do NOT pass function values to rehype plugins. Turbopack cannot serialize JS functions across the Rust boundary (RESEARCH.md Pitfall 1).

---

### `mdx-components.tsx` (config, transform)

**Analog:** None in codebase. Follow RESEARCH.md Pattern 2 exactly.

**Pattern** (project root, next to `src/` and `package.json`):
```typescript
// mdx-components.tsx — REQUIRED for @next/mdx + App Router
// Without this file, @next/mdx silently fails with App Router
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  }
}
```

**Location:** `/Users/calvinlai/Desktop/lailit.supply/mdx-components.tsx` (project root, NOT inside `src/`).

---

### `src/lib/content.ts` (utility/service, batch)

**Analog:** `src/lib/dal.ts`

**Imports pattern from analog** (lines 1–3):
```typescript
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
```

**Copy this pattern** — `server-only` import at line 1, `cache()` wrapper from React:
```typescript
import 'server-only'    // line 1 — enforces server boundary
import { cache } from 'react'
```

**Core pattern** (based on `dal.ts` `cache()` pattern + RESEARCH.md Pattern 3):
```typescript
// src/lib/content.ts
import 'server-only'
import { cache } from 'react'
import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import matter from 'gray-matter'
import { z } from 'zod'

const CONTENT_ROOT = path.join(process.cwd(), 'content/resources')

const ResourceFrontmatterSchema = z.object({
  title: z.string(),
  category: z.enum(['animation', 'ui-components', 'layout', 'interactions']),
  tags: z.array(z.string()),
  is_premium: z.boolean(),
  available_formats: z.array(z.enum(['framer', 'webflow', 'html', 'jsx', 'tsx'])),
  mux_playback_id: z.string().nullable(),
  demo_url: z.string().nullable(),
})

export type ResourceMeta = z.infer<typeof ResourceFrontmatterSchema> & { slug: string }

export const getAllResources = cache(async (): Promise<ResourceMeta[]> => {
  const indexFiles = fg.sync('*/index.mdx', { cwd: CONTENT_ROOT, absolute: true })
  return indexFiles.map((filePath) => {
    const slug = path.basename(path.dirname(filePath))
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(fileContent)
    try {
      const validated = ResourceFrontmatterSchema.parse(data)
      return { slug, ...validated }
    } catch (e) {
      throw new Error(`Invalid frontmatter in ${slug}/index.mdx: ${e}`)
    }
  })
})

export const getResourceBySlug = cache(async (slug: string) => {
  const all = await getAllResources()
  return all.find((r) => r.slug === slug) ?? null
})
```

**Key pattern from `dal.ts`:** `cache()` wraps async functions that should compute once per request/build cycle. The `server-only` sentinel at line 1 prevents this module from being imported by Client Components (build will error if attempted).

---

### `src/app/(marketing)/explore/page.tsx` (component/page, request-response)

**Analog:** `src/app/(marketing)/pricing/page.tsx` (lines 1–34)

**Imports pattern from analog** (lines 1–2):
```typescript
import type { Metadata } from "next";
import { PricingCardGrid } from "@/components/marketing/pricing-card-grid";
```

**Copy this page shell pattern** — `Metadata` export + default sync function + max-width container + page header:
```typescript
import type { Metadata } from "next";
// ... import explore components

export const metadata: Metadata = {
  title: "Jelajahi Komponen — lailit.supply",
  description: "...",
};

export default async function ExplorePage() {
  // Server Component — no auth check needed (D-07: fully public)
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto">
        {/* Page header */}
        <header className="mb-12">
          <h1 className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
            Komponen
          </h1>
        </header>
        {/* Category filter + grid delegated to client component */}
        <CategoryFilterRow resources={resources} />
      </div>
    </div>
  );
}
```

**Container spacing pattern** from `pricing/page.tsx` (lines 11–12):
```typescript
<div className="px-4 sm:px-8 lg:px-12 py-16 lg:py-24">
  <div className="max-w-[1200px] mx-auto">
```

---

### `src/app/(marketing)/explore/[slug]/page.tsx` (component/page, request-response)

**Analog:** `src/app/(dashboard)/dashboard/page.tsx` (lines 1–26) for the server component + `getUser()` pattern; combine with `generateStaticParams` from RESEARCH.md.

**Auth/gating pattern from analog** (lines 1–3 of dashboard/page.tsx):
```typescript
import { getUser } from '@/lib/dal'
// ...
const user = await getUser()
```

**Copy this gating pattern** — but for Phase 3 content gating, check `is_premium` from manifest (NOT `getUser()`) before rendering:
```typescript
import { getAllResources, getResourceBySlug } from '@/lib/content'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const resources = await getAllResources()
  return resources.map((r) => ({ slug: r.slug }))
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>  // CRITICAL: async in Next.js 16
}) {
  const { slug } = await params       // MUST await — sync access throws
  const resource = await getResourceBySlug(slug)
  if (!resource) notFound()

  if (resource.is_premium) {
    return <PaywallStub />            // Phase 3 stub — no auth call needed
  }

  // Render free content...
}
```

**Page container pattern from analog** (lines 12–14 of dashboard/page.tsx):
```typescript
<div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-16">
  <h1 className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
```

---

### `src/components/explore/resource-card.tsx` (component, request-response)

**Analog:** `src/components/marketing/pricing-card.tsx` (lines 1–98)

**Server Component convention from analog** (note: `pricing-card.tsx` has NO `'use client'` directive — it's a Server Component by default):
```typescript
// No 'use client' — Server Component
type ResourceCardProps = {
  resource: ResourceMeta
}
```

**Card visual pattern from analog** (lines 40–42):
```typescript
<div className="relative bg-white border border-neutral-200 rounded-[12px] p-8 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_4px_12px_rgba(10,10,10,0.04)] hover:border-neutral-950 transition-colors duration-150 ease-out flex flex-col">
```

**Badge pattern from analog** (lines 43–48):
```typescript
{data.badge && (
  <div className="absolute top-6 right-6">
    <span className="inline-flex items-center rounded-full bg-neutral-950 px-3 py-1 text-sm font-semibold text-white leading-[1.45]">
      {data.badge}
    </span>
  </div>
)}
```

**Free/Premium badge** — use same inline badge pattern but with conditional variant for premium (dark bg) vs. free (outline/secondary). Can use `<Badge>` from `src/components/ui/badge.tsx` with `variant="outline"` or `variant="default"`.

**Imports pattern:**
```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ResourceMeta } from '@/lib/content'
import { ThumbnailPlaceholder } from '@/components/explore/thumbnail-placeholder'
```

---

### `src/components/explore/category-filter-row.tsx` (component/client, event-driven)

**Analog:** `src/components/marketing/top-nav.tsx` (lines 1–75) — closest example of a `'use client'` component with `useState` managing active UI state.

**Client Component declaration + useState pattern from analog** (lines 1–8):
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// ...
import { useState } from "react";
```

**Copy this active-state pattern from analog** (lines 9–10, 15–16):
```typescript
const [isOpen, setIsOpen] = useState(false);
// → adapt for category filter:
const [active, setActive] = useState<Category>('all')
```

**Filter chip pattern** (based on RESEARCH.md Code Examples):
```typescript
'use client'
import { useState } from 'react'
import type { ResourceMeta } from '@/lib/content'

type Category = 'all' | 'animation' | 'ui-components' | 'layout' | 'interactions'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'animation', label: 'Animasi' },
  { value: 'ui-components', label: 'UI Components' },
  { value: 'layout', label: 'Layout' },
  { value: 'interactions', label: 'Interactions' },
]

export function CategoryFilterRow({ resources }: { resources: ResourceMeta[] }) {
  const [active, setActive] = useState<Category>('all')
  const filtered = active === 'all'
    ? resources
    : resources.filter(r => r.category === active)
  // render chips + ResourceCard grid
}
```

**Active chip visual style** — copy `underline` active state from `top-nav.tsx` (lines 36–39) but adapt to chip style matching existing badge/button patterns:
```typescript
className={`... ${active === cat.value ? 'bg-neutral-950 text-white' : 'bg-transparent text-neutral-950 border border-neutral-200 hover:border-neutral-950'}`}
```

---

### `src/components/explore/format-tab-bar.tsx` (component/client, event-driven)

**Analog:** `src/components/marketing/top-nav.tsx` (lines 1–75) — `'use client'` component with active state.

**Client + state pattern** (same as category-filter-row):
```typescript
'use client'
import { useState } from 'react'
import type { ResourceMeta } from '@/lib/content'

type Format = 'framer' | 'webflow' | 'html' | 'jsx' | 'tsx'

const FORMAT_LABELS: Record<Format, string> = {
  framer: 'Framer',
  webflow: 'Webflow',
  html: 'HTML',
  jsx: 'JSX',
  tsx: 'TSX',
}

export function FormatTabBar({
  formats,
  activeFormat,
  onFormatChange,
}: {
  formats: Format[]
  activeFormat: Format
  onFormatChange: (f: Format) => void
}) {
  // Only render tabs for formats listed in available_formats (D-10: hide missing tabs)
  return (
    <div role="tablist" aria-label="Format kode" className="flex gap-2">
      {formats.map((fmt) => (
        <button
          key={fmt}
          role="tab"
          aria-selected={activeFormat === fmt}
          onClick={() => onFormatChange(fmt)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 ease-out ${
            activeFormat === fmt
              ? 'bg-neutral-950 text-white'
              : 'bg-transparent text-neutral-950 border border-neutral-200 hover:border-neutral-950'
          }`}
        >
          {FORMAT_LABELS[fmt]}
        </button>
      ))}
    </div>
  )
}
```

---

### `src/components/explore/code-block.tsx` (component, request-response)

**Analog:** `src/components/dashboard/dashboard-stub-card.tsx` (lines 1–15) — Server Component, no `'use client'`, structural display component.

**Server Component convention from analog** (no directive at top):
```typescript
// No 'use client' — Server Component
// Receives pre-highlighted MDX content as a React component prop
```

**Pattern** — receives MDX Component (already syntax-highlighted by rehype-pretty-code at build time) and renders it inside a styled container:
```typescript
// src/components/explore/code-block.tsx
import type { ComponentType } from 'react'

export function CodeBlock({ Content }: { Content: ComponentType }) {
  return (
    <div className="relative rounded-[12px] border border-neutral-200 bg-neutral-950 overflow-x-auto p-6 text-sm">
      <Content />
    </div>
  )
}
```

---

### `src/components/explore/copy-button.tsx` (component/client, event-driven)

**Analog:** `src/components/marketing/login-form.tsx` — closest example of a `'use client'` component with async state transitions and button feedback patterns (lines 123–146).

**Client + async state pattern from analog** (lines 1–5):
```typescript
'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
```

**Button state pattern from analog** (lines 126–132) — copy disabled/pending state visual:
```typescript
disabled={isPending}
aria-disabled={isPending}
className={`... ${
  isPending
    ? 'bg-neutral-800 text-white cursor-not-allowed'
    : 'bg-neutral-950 text-white hover:bg-neutral-800 active:bg-neutral-900'
}`}
```

**Copy pattern** — adapt to clipboard + copied feedback state:
```typescript
'use client'
import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Disalin!' : 'Salin kode'}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${
        copied
          ? 'bg-neutral-800 text-white cursor-default'
          : 'bg-neutral-950 text-white hover:bg-neutral-800 active:bg-neutral-900'
      }`}
    >
      {copied ? 'Disalin!' : 'Salin Kode'}
    </button>
  )
}
```

---

### `src/components/explore/thumbnail-placeholder.tsx` (component, request-response)

**Analog:** `src/components/marketing/hero-animated-demo.tsx` (lines 1–30) — Server Component, no `'use client'`, placeholder visual with `role="img"` and `aria-label`.

**Placeholder visual + accessibility pattern from analog** (lines 4–10):
```typescript
// Server Component — no 'use client'
<div
  role="img"
  aria-label="Demo animasi tombol magnetic hover"
  className="relative w-full max-w-[960px] mx-auto aspect-video border border-neutral-200 rounded-[12px] bg-white overflow-hidden flex items-center justify-center"
>
```

**Copy this pattern** — use `aspect-video` ratio, `role="img"`, `aria-label`, and per-category gradient background:
```typescript
// src/components/explore/thumbnail-placeholder.tsx
// No 'use client' — Server Component
const CATEGORY_GRADIENTS: Record<string, string> = {
  animation: 'from-violet-100 to-purple-200',
  'ui-components': 'from-blue-100 to-cyan-200',
  layout: 'from-emerald-100 to-teal-200',
  interactions: 'from-orange-100 to-amber-200',
}

export function ThumbnailPlaceholder({
  category,
  title,
}: {
  category: string
  title: string
}) {
  const gradient = CATEGORY_GRADIENTS[category] ?? 'from-neutral-100 to-neutral-200'
  return (
    <div
      role="img"
      aria-label={`Preview placeholder for ${title}`}
      className={`w-full aspect-video rounded-[12px] bg-gradient-to-br ${gradient}`}
    />
  )
}
```

---

### `src/components/explore/video-placeholder.tsx` (component, request-response)

**Analog:** `src/components/marketing/hero-animated-demo.tsx` (lines 1–30) — same placeholder pattern.

**Copy same structure** as `thumbnail-placeholder.tsx` but for the video slot — `aspect-video`, gradient box, `aria-label` indicating "video coming soon":
```typescript
// src/components/explore/video-placeholder.tsx
// No 'use client' — Server Component
export function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div
      role="img"
      aria-label={`Video preview untuk ${title} — segera hadir`}
      className="w-full aspect-video rounded-[12px] bg-neutral-100 flex items-center justify-center"
    >
      <p className="text-sm text-neutral-500 leading-[1.45]">Video segera hadir</p>
    </div>
  )
}
```

---

### `src/components/explore/paywall-stub.tsx` (component, request-response)

**Analog:** `src/components/dashboard/dashboard-stub-card.tsx` (lines 1–15) — exact match: Server Component, dashed-border stub card with "coming soon" messaging.

**Copy directly from analog** (lines 1–15) and adapt messaging:
```typescript
// src/components/explore/paywall-stub.tsx
// No 'use client' — Server Component
// Pattern: copy from src/components/dashboard/dashboard-stub-card.tsx
export function PaywallStub() {
  return (
    <div className="max-w-[480px] border border-dashed border-neutral-200 rounded-[12px] p-8 bg-neutral-50">
      <p className="text-sm font-normal leading-[1.45] text-neutral-500 uppercase tracking-widest">
        KONTEN PREMIUM
      </p>
      <h2 className="mt-3 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">
        Komponen ini untuk member premium.
      </h2>
      <p className="mt-4 text-base font-normal leading-[1.5] text-neutral-500">
        Langganan untuk mengakses semua komponen premium beserta kode lengkapnya.
      </p>
      {/* CTA stub — Phase 5 wires real paywall */}
      <a
        href="/pricing"
        className="mt-6 inline-flex items-center justify-center bg-neutral-950 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-neutral-800 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
      >
        Lihat Harga
      </a>
    </div>
  )
}
```

---

### `content/resources/<slug>/index.mdx` (content, batch)

**Analog:** None in codebase. Follow RESEARCH.md Code Examples exactly.

**Frontmatter pattern:**
```mdx
---
title: Fade In On Scroll
category: animation
tags: [scroll, fade, intersection-observer]
is_premium: false
available_formats: [framer, jsx, tsx]
mux_playback_id: null
demo_url: null
---
```

**Slug naming convention** (Claude's discretion per CONTEXT.md): Use `{category-abbreviation}-{descriptor}` format, e.g.:
- `animation-fade-in-on-scroll`
- `ui-button-hover-glow`
- `layout-bento-grid`
- `interactions-magnetic-cursor`

**CRITICAL:** Do NOT place `.mdx` files inside `src/app/` — they become routable pages. Content lives under `content/resources/` at project root only (RESEARCH.md Pitfall 6).

---

### `content/resources/<slug>/<format>.mdx` (content, batch)

**Analog:** None in codebase. Follow RESEARCH.md Code Examples exactly.

**Format file pattern** — MDX file with a fenced code block using the format name as language identifier:
```mdx
```framer
// Fade In On Scroll — Framer component placeholder
// Replace with real Framer code before launch
export default function FadeInOnScroll() {
  return <div>Placeholder Framer component</div>
}
```
```

---

### `src/lib/__tests__/content.test.ts` (test, batch)

**Analog:** `src/components/marketing/__tests__/login-form.test.tsx` (lines 1–97)

**Test file structure from analog** (lines 1–10):
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";
```

**Mock pattern from analog** (lines 8–10, 13–27) — mock server-only modules that can't run in jsdom:
```typescript
vi.mock("@/app/(marketing)/login/actions", () => ({
  signInWithMagicLink: vi.fn().mockResolvedValue({ status: "idle" }),
}));
```

**Copy this mock pattern** for `content.test.ts` — mock `fs`, `fast-glob`, and `gray-matter` to avoid real filesystem reads in tests:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('fast-glob', () => ({
  default: { sync: vi.fn() },
}))
vi.mock('gray-matter', () => ({
  default: vi.fn(),
}))
vi.mock('fs', () => ({
  default: { readFileSync: vi.fn() },
}))

// describe blocks: schema validation, slug discovery, invalid frontmatter throws
describe('ResourceFrontmatterSchema', () => { ... })
describe('getAllResources', () => { ... })
```

**Test runner from analog** (vitest.config.ts lines 1–16):
```typescript
// Quick run: npx vitest run src/lib/__tests__/content.test.ts
// Full suite: npx vitest run --reporter=verbose
```

---

## Shared Patterns

### Server Component Convention
**Source:** `src/components/marketing/hero-section.tsx` (line 1), `src/components/marketing/value-props-grid.tsx` (line 1), `src/components/marketing/hero-animated-demo.tsx` (line 1)
**Apply to:** All `src/components/explore/` files except `category-filter-row.tsx`, `format-tab-bar.tsx`, `copy-button.tsx`
```typescript
// Server Component — no 'use client'
```
This comment convention (found in hero-section.tsx line 1, value-props-grid.tsx line 1) explicitly marks files as Server Components. Copy this convention to all new server-only components.

### `server-only` Sentinel
**Source:** `src/lib/dal.ts` (line 1)
**Apply to:** `src/lib/content.ts` only
```typescript
import 'server-only'
```
Placed at line 1, before all other imports. Ensures the manifest module cannot be accidentally imported in Client Components (build-time error if attempted).

### React `cache()` Wrapper
**Source:** `src/lib/dal.ts` (lines 1–11)
**Apply to:** `src/lib/content.ts` — `getAllResources()` and `getResourceBySlug()`
```typescript
import { cache } from 'react'
// ...
export const getUser = cache(async () => {
  // ...
})
```
Wrap every exported async function in `content.ts` with `cache()`. This deduplicates calls within a single render pass and a single build pass.

### Container/Layout Spacing
**Source:** `src/app/(marketing)/pricing/page.tsx` (lines 11–12) and `src/app/(dashboard)/dashboard/page.tsx` (lines 13–14)
**Apply to:** `src/app/(marketing)/explore/page.tsx`, `src/app/(marketing)/explore/[slug]/page.tsx`
```typescript
<div className="px-4 sm:px-8 lg:px-12 py-16 lg:py-24">
  <div className="max-w-[1200px] mx-auto">
```
Consistent horizontal padding and max-width constraint across all marketing pages.

### Typography Scale
**Source:** `src/app/(marketing)/pricing/page.tsx` (lines 15–20), `src/app/(dashboard)/dashboard/page.tsx` (lines 15–21)
**Apply to:** All new page components and content display components
```typescript
// H1 (page title):
"text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950"
// Body / description:
"text-base font-normal leading-[1.5] text-neutral-500"
// Small / caption:
"text-sm font-normal leading-[1.45] text-neutral-500"
```

### `cn()` Utility for Conditional Classes
**Source:** `src/lib/utils.ts` (lines 1–5), used throughout `src/components/ui/`
**Apply to:** All new components that have conditional className logic
```typescript
import { cn } from '@/lib/utils'
// Usage:
className={cn('base-classes', condition && 'conditional-class', className)}
```

### `Metadata` Export Pattern
**Source:** `src/app/(marketing)/pricing/page.tsx` (lines 1–7), `src/app/(dashboard)/dashboard/page.tsx` (lines 1–5)
**Apply to:** `explore/page.tsx`, `explore/[slug]/page.tsx`
```typescript
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "...",
  description: "...",
};
```

### Async `params` in Next.js 16
**Source:** RESEARCH.md Pitfall 3, Pattern 4 — verified against `node_modules/next/dist/docs/`
**Apply to:** `src/app/(marketing)/explore/[slug]/page.tsx`
```typescript
export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>  // Promise type — NOT { slug: string }
}) {
  const { slug } = await params  // MUST await
```
This is a Next.js 16 breaking change. The `dashboard/page.tsx` does NOT have params so there is no codebase example — the RESEARCH.md verified pattern is authoritative here.

### Focus-visible Outline (Accessibility)
**Source:** `src/components/marketing/hero-section.tsx` (line 21), `src/components/marketing/login-form.tsx` (line 128)
**Apply to:** All interactive elements (buttons, links) in new components
```typescript
"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
```

### Hover/Active Transition on Interactive Elements
**Source:** `src/components/marketing/pricing-card.tsx` (line 40), `src/components/marketing/hero-section.tsx` (line 21)
**Apply to:** Resource cards, filter chips, format tabs, CTA buttons
```typescript
"transition-colors duration-150 ease-out"
```

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `mdx-components.tsx` | config | transform | No MDX setup exists yet in this project |
| `content/resources/<slug>/index.mdx` | content | batch | No MDX content files exist in this project |
| `content/resources/<slug>/<format>.mdx` | content | batch | No MDX content files exist in this project |

---

## Metadata

**Analog search scope:** `/Users/calvinlai/Desktop/lailit.supply/src/` (all subdirectories)
**Files scanned:** 26 source files
**Pattern extraction date:** 2026-05-07
