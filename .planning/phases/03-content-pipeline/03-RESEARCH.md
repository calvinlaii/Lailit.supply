# Phase 3: Content Pipeline & Free-Tier Browse — Research

**Researched:** 2026-05-07
**Domain:** MDX content pipeline, build-time manifest generation, syntax highlighting, public browse page
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Seed Content**
- D-01: Seed resources use placeholder content — valid MDX frontmatter + dummy/lorem code blocks. Architecture is correct; content can be swapped for real content later without code changes.
- D-02: 4 categories: `animation`, `ui-components`, `layout`, `interactions`. ~5–8 resources per category to reach 20–30 total seed items.
- D-03: Frontmatter fields: `title`, `category`, `tags` (array), `is_premium` (boolean), `available_formats` (array of `framer | webflow | html | jsx | tsx`), `mux_playback_id` (string | null), `demo_url` (string | null). All Zod-validated at build time — build fails on invalid frontmatter.

**Explore Page**
- D-04: Public URL: `/explore` (not `/components`)
- D-05: Layout: 3–4 column dense grid, responsive (1 col mobile → 2 col tablet → 3–4 col desktop). Each card shows: placeholder thumbnail, title, Free/Premium badge, category label.
- D-06: Category filter: chip/tab row above grid — All | Animation | UI Components | Layout | Interactions. Client-side filter (no page reload). Unauthenticated visitors can filter freely.
- D-07: `/explore` is fully public — no auth required, no redirect to login.

**Resource Detail Page**
- D-08: Free-tier resource detail pages get the full layout: format tabs (Framer / Webflow / HTML / JSX / TSX), syntax-highlighted code blocks (rehype-pretty-code + Shiki), one-click copy button.
- D-09: Premium resource tabs show a lock icon + upgrade CTA stub. In Phase 3, premium resources are visible in `/explore` catalog but their detail content is NOT rendered server-side to unauthenticated requests — return 403 / paywall placeholder.
- D-10: Only tabs listed in `available_formats` frontmatter are shown. Missing format tabs are hidden, not shown as disabled.

**Video & Thumbnails**
- D-11: Mux video: placeholder only in Phase 3. Frontmatter includes `mux_playback_id` field for future use, but Phase 3 renders a placeholder/empty state (gradient box).
- D-12: AVIF thumbnails: placeholder solid-color or gradient per category. File path pattern `content/resources/<slug>/thumbnail.avif` reserved in schema.

**Build-Time Manifest**
- D-13: Use `globby` to discover all resource folders, `gray-matter` to parse frontmatter, Zod schema to validate. Output typed JSON manifest at build time. Manifest used by `/explore` and resource detail pages.
- D-14: Use `@next/mdx` — NOT `next-mdx-remote` (CVE-2026-0969), NOT `contentlayer` (unmaintained), NOT `velite` (Turbopack-incompatible).
- D-15: Pre-Phase 3 spike flagged in STATE.md: validate Turbopack + `rehype-pretty-code` + `shiki` integration first before full implementation.

### Claude's Discretion
- Exact slug naming convention for seed resources (e.g., `fade-in-on-scroll`, `button-hover-glow`)
- Number of resources per category (target ~5–8 each, exact count flexible)
- Placeholder thumbnail color/gradient scheme per category
- Exact copy for paywall stub on locked premium detail pages

### Deferred Ideas (OUT OF SCOPE)
- Real Mux video integration — Phase 5
- Real AVIF thumbnails — swap in before launch, no Phase needed
- Hover video preview on cards — Phase 5
- Search/filter by tags — Phase 6
- Animation previews in explore page — Phase 5
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONTENT-01 | Resources stored as MDX files under `content/resources/<slug>/` with Zod-validated frontmatter | Zod v4 schema pattern documented; gray-matter for frontmatter parsing; fast-glob for file discovery |
| CONTENT-02 | Per-format code stored as separate files in each resource folder (framer.mdx, webflow.mdx, html.mdx, jsx.mdx, tsx.mdx) | @next/mdx dynamic import pattern for per-format MDX files |
| CONTENT-03 | Build-time manifest generated from all resource MDX files (typed, Zod-validated) | Server-only module with fast-glob + gray-matter + Zod; executes at build time via generateStaticParams |
| CONTENT-04 | Each resource has AVIF preview thumbnail, short looping video (Mux), and live demo URL | Phase 3: all placeholders; thumbnail.avif path + mux_playback_id field reserved in schema |
| CONTENT-05 | MVP ships with 20–30 seed resources across multiple categories | Slug naming convention and seed list defined in UI-SPEC.md |
| CONTENT-06 | Admin can publish new resources by adding MDX files to repo | Manifest module auto-discovers via glob pattern; no CMS needed |
| MKT-03 | Public `/explore` page lets visitors browse free-tier resources without logging in | Server Component page under `(marketing)` route group; no auth check needed |
| GATE-01 | Free-tier resources accessible to all visitors without login | Detail page checks `is_premium` from manifest; 403 response for premium; no DAL call for free resources |
</phase_requirements>

---

## Summary

Phase 3 establishes the MDX content pipeline that powers lailit.supply's free-tier lead magnet. The architecture has three layers: (1) a filesystem-based content store under `content/resources/<slug>/`, (2) a build-time typed manifest generated from Zod-validated frontmatter, and (3) two public Next.js pages (`/explore` and `/explore/[slug]`) under the existing `(marketing)` route group.

The most important architectural decision is how the manifest is generated. The CONTEXT.md decision says "build-time manifest via globby + gray-matter + Zod," but the cleanest Next.js 16 App Router pattern is a `server-only` module (`src/lib/content.ts`) that uses `fast-glob` (already installed as a Next.js dependency) to discover resources and `gray-matter` to parse frontmatter. This module is imported by `generateStaticParams` (which runs at build time) and by Server Component pages. The effect is a manifest computed once per build, not re-computed on every request.

The critical spike flagged in STATE.md (Turbopack + rehype-pretty-code + shiki) has a clear resolution: rehype-pretty-code works with Turbopack when configured with **serializable options only** (a string theme name, no callback functions). The Turbopack constraint — "remark/rehype plugins without serializable options cannot be used" — is satisfied by using `['rehype-pretty-code', { theme: 'github-dark-dimmed' }]` in the @next/mdx config. If custom transformers or `getHighlighter` are needed later, fall back to `--webpack` flag; Phase 3 does not need them.

**Primary recommendation:** Use `fast-glob` (already installed) instead of `globby` (ESM-only, adds a dependency); use `@next/mdx` with string-based plugin config for Turbopack compatibility; generate the manifest as a `server-only` cached module.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Content storage (MDX files) | Filesystem (build-time) | — | MDX-in-repo pattern; no database needed at MVP |
| Frontmatter validation | Build time (Zod) | — | Fail-fast validation at `next build`; errors caught before deploy |
| Manifest generation | API / Server (server-only module) | — | `generateStaticParams` runs manifest at build time; same module used by Server Components at runtime |
| `/explore` page (catalog) | Frontend Server (SSR/SSG) | Browser (filter state) | Page is Server Component; category filter chip state is Client Component (`"use client"`) |
| Resource detail page | Frontend Server (SSR/SSG) | — | `generateStaticParams` pre-renders all slugs statically |
| Premium gating (Phase 3 stub) | API / Server | — | `is_premium` check happens in Server Component before rendering; 403 for premium, never in browser |
| Format tab state | Browser / Client | — | Active tab index is client-side UI state; no server round-trip |
| Syntax highlighting | Build time / Server | — | rehype-pretty-code runs at build time via @next/mdx transform; output is static HTML |
| Copy button clipboard | Browser / Client | — | `navigator.clipboard.writeText` is browser-only; requires `"use client"` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @next/mdx | 16.2.4 | MDX processing, rehype/remark plugin pipeline | Official Next.js MDX solution; Turbopack-compatible |
| @mdx-js/loader | 3.x | Webpack loader required by @next/mdx | Peer dependency of @next/mdx |
| @mdx-js/react | 3.x | React MDX components context | Required for App Router mdx-components.tsx |
| @types/mdx | 2.x | TypeScript types for MDX | Required for TypeScript MDX imports |
| gray-matter | 4.0.3 | Frontmatter parsing from MDX files | Official Next.js docs recommend it; CJS-compatible |
| zod | 4.4.3 | Frontmatter schema validation (already installed) | TypeScript-first; build fails on invalid data |
| fast-glob | 3.3.3 | File discovery for content directory (already installed) | CJS-compatible; already a Next.js transitive dep; no extra install |
| rehype-pretty-code | 0.14.3 | Syntax highlighting in MDX code blocks | Official recommendation; Shiki-backed |
| shiki | 4.0.2 | Syntax highlighter engine used by rehype-pretty-code | Peer dependency; peerDependencies: `^1.0.0 \|\| ^2.0.0 \|\| ^3.0.0 \|\| ^4.0.0` |

**Already installed (no action):** `zod` (4.4.3), `fast-glob` (3.3.3 as Next.js transitive dep)

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| server-only | 0.0.1 | Enforce server boundary on manifest module | Apply to `src/lib/content.ts` — already installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fast-glob | globby 16.x | globby is ESM-only, requires dynamic import in next.config.ts scripts; fast-glob is already installed |
| @next/mdx | next-mdx-remote | BANNED — CVE-2026-0969, archived April 2026 |
| @next/mdx | contentlayer | BANNED — unmaintained |
| @next/mdx | velite | BANNED — Turbopack-incompatible |
| rehype-pretty-code | @shikijs/rehype | rehype-pretty-code is the established choice with better meta-string support |

**Installation:**

```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx gray-matter rehype-pretty-code shiki
```

**Version verification (confirmed 2026-05-07):**
```
@next/mdx:          16.2.5 (installing at 16.2.4 to match Next.js version)
gray-matter:        4.0.3
rehype-pretty-code: 0.14.3
shiki:              4.0.2
fast-glob:          3.3.3 (already installed)
zod:                4.4.3 (already installed)
```

[VERIFIED: npm registry, 2026-05-07]

---

## Architecture Patterns

### System Architecture Diagram

```
  content/resources/<slug>/
  ├── index.mdx (frontmatter: title, category, tags, is_premium, ...)
  ├── framer.mdx
  ├── webflow.mdx
  ├── html.mdx
  ├── jsx.mdx
  └── tsx.mdx
         │
         │  fast-glob discovers directories
         │  gray-matter parses frontmatter
         │  Zod validates schema → fails build on error
         ▼
  src/lib/content.ts (server-only module)
  ├── getAllResources() → ResourceMeta[]    (manifest)
  └── getResourceBySlug(slug) → ResourceDetail
         │
         ├─────────────────────────────────────────────┐
         │                                             │
         ▼                                             ▼
  /explore (page.tsx)                    /explore/[slug] (page.tsx)
  Server Component                       Server Component
  ├── getAllResources()                   ├── generateStaticParams() → all slugs
  ├── Passes data to Client:             ├── getResourceBySlug(slug) → manifest entry
  │   CategoryFilterRow (client)         ├── if is_premium: return 403 + PaywallStub
  └── ResourceCard grid (server)         ├── dynamicImport(`content/resources/${slug}/${tab}.mdx`)
                                         └── FormatTabBar (client) + CodeBlock (server)
                                                    │
                                                    ▼
                                         rehype-pretty-code (via @next/mdx)
                                         Shiki syntax highlighting
                                         Static HTML output
```

### Recommended Project Structure

```
content/
└── resources/
    ├── animation-fade-in-on-scroll/
    │   ├── index.mdx          # frontmatter only
    │   ├── framer.mdx         # code content
    │   ├── jsx.mdx
    │   └── tsx.mdx
    └── ui-button-hover-glow/
        ├── index.mdx
        ├── framer.mdx
        └── webflow.mdx

src/
├── lib/
│   └── content.ts             # server-only manifest module
├── app/
│   └── (marketing)/
│       └── explore/
│           ├── page.tsx       # /explore — Server Component
│           └── [slug]/
│               └── page.tsx   # /explore/[slug] — Server Component
└── components/
    └── explore/
        ├── resource-card.tsx          # Server Component
        ├── category-filter-row.tsx    # Client Component ("use client")
        ├── format-tab-bar.tsx         # Client Component ("use client")
        ├── code-block.tsx             # Server Component (receives pre-highlighted HTML)
        ├── copy-button.tsx            # Client Component ("use client")
        ├── thumbnail-placeholder.tsx  # Server Component
        ├── video-placeholder.tsx      # Server Component
        └── paywall-stub.tsx           # Server Component

mdx-components.tsx             # project root — REQUIRED for @next/mdx + App Router
```

### Pattern 1: next.config.ts — @next/mdx with Turbopack-safe rehype-pretty-code

**What:** Configure @next/mdx with rehype-pretty-code using **serializable string options only** — this satisfies Turbopack's constraint that function values cannot be passed through the Rust layer.

**When to use:** Any time rehype/remark plugins are added to @next/mdx in a Turbopack project. Do NOT pass function values (no `getHighlighter`, no `onVisitLine` callbacks) — these break Turbopack.

**Example:**
```typescript
// next.config.ts — VERIFIED pattern from Next.js 16 docs
// Source: node_modules/next/dist/docs/01-app/02-guides/mdx.md
import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [
      // Turbopack requires string plugin name + serializable options only
      // No function values allowed (no getHighlighter, no onVisitLine, etc.)
      ['rehype-pretty-code', { theme: 'github-dark-dimmed' }],
    ],
  },
})

export default withMDX(nextConfig)
```

**Critical:** `next.config.ts` (TypeScript) is supported for ESM plugin imports per Next.js 16 docs: "you'll need to use `next.config.mjs` or `next.config.ts`." [VERIFIED: node_modules/next/dist/docs/01-app/02-guides/mdx.md]

### Pattern 2: mdx-components.tsx — required for App Router

**What:** `mdx-components.tsx` at project root is **mandatory** for @next/mdx to work with App Router. Without it, @next/mdx will fail silently.

**Example:**
```typescript
// mdx-components.tsx — project root (next to src/, package.json)
// Source: node_modules/next/dist/docs/01-app/02-guides/mdx.md
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  }
}
```

### Pattern 3: Manifest Module (server-only, build-time)

**What:** A `server-only` module that discovers all content with `fast-glob`, parses frontmatter with `gray-matter`, and validates with Zod. Imported by `generateStaticParams` (build time) and Server Component pages (request time). The `cache()` wrapper ensures a single parse per build/request cycle.

**Example:**
```typescript
// src/lib/content.ts
// Source: Next.js docs MDX guide + fast-glob CJS pattern
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
  available_formats: z.array(
    z.enum(['framer', 'webflow', 'html', 'jsx', 'tsx'])
  ),
  mux_playback_id: z.string().nullable(),
  demo_url: z.string().nullable(),
})

export type ResourceMeta = z.infer<typeof ResourceFrontmatterSchema> & {
  slug: string
}

export const getAllResources = cache(async (): Promise<ResourceMeta[]> => {
  const indexFiles = fg.sync('*/index.mdx', {
    cwd: CONTENT_ROOT,
    absolute: true,
  })

  return indexFiles.map((filePath) => {
    const slug = path.basename(path.dirname(filePath))
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(fileContent)

    // Throws ZodError at build time if invalid — fails the build
    const validated = ResourceFrontmatterSchema.parse(data)
    return { slug, ...validated }
  })
})

export const getResourceBySlug = cache(async (slug: string) => {
  const all = await getAllResources()
  return all.find((r) => r.slug === slug) ?? null
})
```

**Note on Zod v4:** The project uses Zod 4.4.3. `z.enum()` in Zod v4 accepts string literals directly (same API as Zod v3 for string enums). `z.nativeEnum()` is deprecated in v4. [VERIFIED: Zod v4 docs via Context7]

### Pattern 4: Dynamic MDX Import for Per-Format Code

**What:** Each format file (framer.mdx, webflow.mdx, etc.) is a separate MDX file imported dynamically. The `@next/mdx` transform runs rehype-pretty-code on them at build time — the output is pre-highlighted HTML that ships as a React component.

**Example:**
```typescript
// src/app/(marketing)/explore/[slug]/page.tsx
// Source: Next.js 16 docs — App Router generateStaticParams + async params
import type { MDXComponents } from 'mdx/types'
import { getAllResources, getResourceBySlug } from '@/lib/content'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const resources = await getAllResources()
  return resources.map((r) => ({ slug: r.slug }))
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>  // async in Next.js 16!
}) {
  const { slug } = await params       // must await params
  const resource = await getResourceBySlug(slug)
  if (!resource) notFound()

  if (resource.is_premium) {
    // Phase 3: stub 403, no server-side rendering of content
    return <PaywallStub />
  }

  // Dynamic import — @next/mdx processes at build time
  const activeFormat = resource.available_formats[0]
  const { default: FormatContent } = await import(
    `@/../../content/resources/${slug}/${activeFormat}.mdx`
  )
  // ...
}
```

**Critical Next.js 16 breaking change:** `params` is a `Promise` — must be `await`-ed. [VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md]

### Anti-Patterns to Avoid

- **Importing gray-matter in Client Components:** gray-matter uses Node.js `fs` under the hood. The manifest module must be `server-only` or the build will fail.
- **Passing functions to rehype plugins in Turbopack:** `getHighlighter`, `onVisitLine`, `filterMetaString` callbacks cannot be passed to Turbopack. Use string theme names only. If callbacks are needed, fall back to webpack via `next dev --webpack`.
- **Module-scope Supabase client:** Not applicable to Phase 3 (no Supabase calls in this phase's content pipeline), but the DAL check for premium gating still uses `getUser()` if needed.
- **Using `middleware.ts` instead of `proxy.ts`:** Per CLAUDE.md — this project uses `proxy.ts`. Do not create `middleware.ts`.
- **Synchronous params access in Next.js 16:** `params.slug` (sync) will throw. Always use `const { slug } = await params`.
- **pageExtensions without `@next/mdx`:** Setting `pageExtensions` to include `.mdx` without wrapping with `withMDX()` causes MDX files to fail to parse.
- **Forgetting `mdx-components.tsx` at project root:** @next/mdx with App Router silently breaks without this file. [VERIFIED: Next.js 16 docs]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter parsing | Custom YAML/regex parser | gray-matter | Handles edge cases, YAML types, multiline values |
| File discovery glob | `fs.readdirSync` recursive | fast-glob (already installed) | Battle-tested, handles nested paths, CJS-compatible |
| Schema validation | Manual field checks | Zod v4 (already installed) | TypeScript inference, clear error messages, build-fail guarantee |
| Syntax highlighting | Manual regex or Prism | rehype-pretty-code + Shiki | Accurate language grammars, TextMate themes, no maintenance |
| Copy button clipboard | Custom event listeners | Native `navigator.clipboard.writeText` | Built-in browser API; no library needed |
| MDX rendering | Custom markdown-to-HTML | @next/mdx | React Server Component integration, build-time transform |

**Key insight:** Every "clever custom solution" in this domain has nasty edge cases (YAML multiline strings, glob symlinks, broken syntax grammars, async clipboard API fallbacks). The ecosystem packages handle them.

---

## Common Pitfalls

### Pitfall 1: Turbopack Breaks When rehype-pretty-code Receives Function Options

**What goes wrong:** `next dev` works, `next build` fails or rehype-pretty-code silently does nothing when configured with JavaScript function callbacks (e.g., `getHighlighter`, `onVisitLine`).

**Why it happens:** Turbopack is Rust-based and cannot serialize JavaScript function references across the Rust/JS boundary. The Next.js 16 docs explicitly state: "remark and rehype plugins without serializable options cannot be used yet with Turbopack."

**How to avoid:** Use only serializable options: `{ theme: 'github-dark-dimmed' }`. If custom Shiki bundled languages or transformer functions are needed in later phases, use `next dev --webpack` or `next build --webpack`.

**Warning signs:** Build completes but code blocks have no syntax highlighting. Check `next build` output for loader errors.

[VERIFIED: node_modules/next/dist/docs/01-app/02-guides/mdx.md]

### Pitfall 2: Dynamic MDX Imports Need Literal String Paths (Turbopack)

**What goes wrong:** `await import(`content/resources/${slug}/${format}.mdx`)` fails at build time because Turbopack (and webpack) cannot statically analyze the dynamic template literal to discover which files to include in the bundle.

**Why it happens:** Both bundlers require resolvable paths at build time. Fully dynamic string interpolation prevents static analysis.

**How to avoid:** Use a `switch`/`map` approach where all possible import paths are expressed as static strings, or constrain the dynamic segment to a known set:

```typescript
const FORMAT_IMPORTS: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  framer: () => import(`@/../../content/resources/${slug}/framer.mdx`),
  webflow: () => import(`@/../../content/resources/${slug}/webflow.mdx`),
  html: () => import(`@/../../content/resources/${slug}/html.mdx`),
  jsx: () => import(`@/../../content/resources/${slug}/jsx.mdx`),
  tsx: () => import(`@/../../content/resources/${slug}/tsx.mdx`),
}
```

Actually, because the slug segment is dynamic, even per-format imports will have this problem. The correct pattern for this architecture is to NOT use dynamic import for content body rendering. Instead, read the MDX file content as a string (using `fs.readFileSync` in the server module), then process it through the unified pipeline at request time (using `@mdx-js/mdx` programmatic API). See Pattern 5 below.

[VERIFIED: known Turbopack/webpack static analysis requirement; ASSUMED: specific behavior with nested dynamic imports in content paths — needs spike validation]

### Pitfall 3: `params` Is async in Next.js 16 — Sync Access Throws

**What goes wrong:** `const { slug } = params` throws `TypeError: Cannot destructure property 'slug' of 'params'` because `params` is a Promise in Next.js 16 App Router.

**Why it happens:** Next.js 16 made `params`, `searchParams`, `cookies()`, and `headers()` all async to support streaming.

**How to avoid:** Always use `const { slug } = await params` in page components. [VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md]

### Pitfall 4: next.config.ts needs `pageExtensions` AND `withMDX` wrapper

**What goes wrong:** Setting `pageExtensions: ['mdx', ...]` without wrapping with `createMDX()()` means `.mdx` files are treated as pages but not processed — they return syntax errors.

**How to avoid:** Always use `export default withMDX(nextConfig)` pattern. Both `pageExtensions` config AND the `withMDX` wrapper are required together. [VERIFIED: node_modules/next/dist/docs/01-app/02-guides/mdx.md]

### Pitfall 5: Build-Time Zod Errors Are Silent Without `process.exit(1)`

**What goes wrong:** `ResourceFrontmatterSchema.parse(data)` throws a `ZodError` at build time. If not caught at the manifest module level, it surfaces as a cryptic build error deep in the Next.js build stack.

**Why it happens:** Zod errors are runtime JavaScript errors, not TypeScript type errors.

**How to avoid:** In `getAllResources()`, wrap the `.parse()` call and re-throw with the slug:
```typescript
try {
  return ResourceFrontmatterSchema.parse(data)
} catch (e) {
  throw new Error(`Invalid frontmatter in ${slug}/index.mdx: ${e}`)
}
```

[ASSUMED: specific error surfacing behavior; general pattern is standard Zod usage]

### Pitfall 6: MDX `pageExtensions` Makes `.mdx` Files Routable

**What goes wrong:** Adding `.mdx` to `pageExtensions` means any `.mdx` file inside `src/app/` or `src/pages/` becomes a route. The content files live in `content/` (project root), not `src/app/`, so this is safe — but be careful not to create `.mdx` files inside `src/app/`.

**How to avoid:** Keep all content MDX files under `content/resources/<slug>/` at the project root, not under `src/app/`. [VERIFIED: CONTEXT.md D-13 + Next.js docs]

---

## Pattern 5: Alternative MDX Rendering Strategy (Recommended for Per-Format Files)

Given Pitfall 2 (dynamic import limitations), the recommended approach for rendering per-format `.mdx` content is to **read MDX files as strings using `fs.readFileSync` and compile them programmatically using `@mdx-js/mdx`** rather than relying on Next.js's webpack/Turbopack dynamic import.

This avoids the bundler static analysis problem entirely because the file content is read at runtime (server-side) via Node.js `fs`, not through the bundler.

**Architecture:**
```typescript
// src/lib/content.ts — format content loading
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import rehypePrettyCode from 'rehype-pretty-code'

export async function getFormatContent(slug: string, format: string) {
  const filePath = path.join(CONTENT_ROOT, slug, `${format}.mdx`)
  const source = fs.readFileSync(filePath, 'utf-8')

  const compiled = await compile(source, {
    outputFormat: 'function-body',
    rehypePlugins: [
      [rehypePrettyCode, { theme: 'github-dark-dimmed' }]
    ],
  })

  const { default: Content } = await run(compiled, {
    ...runtime,
    baseUrl: import.meta.url,
  })
  return Content
}
```

**Tradeoff:** This runs rehype-pretty-code at request time (not build time), adding ~20-50ms per request for code compilation. For a static site exported with `generateStaticParams`, this is fine — the compilation happens during `next build` when the static params are pre-rendered.

**Note:** `@mdx-js/mdx` is the programmatic compiler that @next/mdx wraps. Installing `@next/mdx` pulls it in as a dependency. [ASSUMED: exact API — verify against installed @mdx-js/mdx version during spike]

---

## Code Examples

### Zod v4 Frontmatter Schema

```typescript
// Source: Zod v4 docs via Context7 (/websites/zod_dev_v4)
import { z } from 'zod'

export const ResourceFrontmatterSchema = z.object({
  title: z.string(),
  category: z.enum(['animation', 'ui-components', 'layout', 'interactions']),
  tags: z.array(z.string()),
  is_premium: z.boolean(),
  available_formats: z.array(
    z.enum(['framer', 'webflow', 'html', 'jsx', 'tsx'])
  ),
  mux_playback_id: z.string().nullable(),
  demo_url: z.string().nullable(),
})

export type ResourceMeta = z.infer<typeof ResourceFrontmatterSchema> & {
  slug: string
}
```

### Sample MDX Index File (Frontmatter)

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

### Sample Format File (framer.mdx)

```mdx
```framer
// Fade In On Scroll — Framer component placeholder
// Replace with real Framer code before launch
export default function FadeInOnScroll() {
  return <div>Placeholder Framer component</div>
}
```
```

### generateStaticParams with async params (Next.js 16)

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md
export async function generateStaticParams() {
  const resources = await getAllResources()
  return resources.map((r) => ({ slug: r.slug }))
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params  // MUST await in Next.js 16
  // ...
}
```

### Category Filter Row (Client Component Pattern)

```typescript
// "use client" required — filter state lives in browser
'use client'
import { useState } from 'react'
import type { ResourceMeta } from '@/lib/content'

type Category = 'all' | 'animation' | 'ui-components' | 'layout' | 'interactions'

export function CategoryFilterRow({ resources }: { resources: ResourceMeta[] }) {
  const [active, setActive] = useState<Category>('all')
  const filtered = active === 'all'
    ? resources
    : resources.filter(r => r.category === active)
  // ... render chips and ResourceCard grid
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-mdx-remote for remote MDX | @next/mdx for local MDX | CVE-2026-0969 archived April 2026 | next-mdx-remote is banned in this project |
| contentlayer for type-safe content | Manual Zod schema + fast-glob | contentlayer unmaintained 2024 | No contentlayer; use Zod + fs |
| velite | @next/mdx | velite Turbopack-incompatible | velite banned in this project |
| `params.slug` (sync) in Next.js 13–14 | `(await params).slug` (async) in Next.js 15+ | Next.js 15.0 | Breaking change — must await params |
| Zod `z.nativeEnum()` | Zod v4 `z.enum()` supports enum-like input | Zod 4.0 | `z.nativeEnum()` deprecated; `z.enum()` handles string literals |
| `next.config.js` for ESM plugins | `next.config.ts` or `.mjs` supported | Next.js 15.1 | TypeScript config fully supported with ESM imports |
| Turbopack `experimental.turbo` config key | `turbopack` top-level config key | Next.js 15.3 | Renamed; old key removed in Next.js 16 |

**Deprecated/outdated:**
- `experimental.turbo`: Removed in Next.js 16. Use top-level `turbopack`. [VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.md]
- `getStaticPaths` (Pages Router): Replaced by `generateStaticParams` in App Router.
- `getSession()` on server: Still banned per CLAUDE.md — use `getUser()` via DAL.

---

## Turbopack Spike: Resolution

The spike flagged in STATE.md ("validate Turbopack + rehype-pretty-code + shiki integration") has a clear answer based on official Next.js 16 documentation:

**Turbopack can use rehype-pretty-code IF options are serializable.**

The constraint from Next.js 16 MDX docs: "remark and rehype plugins without serializable options cannot be used yet with Turbopack, because JavaScript functions can't be passed to Rust."

**What this means for Phase 3:**
- `['rehype-pretty-code', { theme: 'github-dark-dimmed' }]` — **WORKS** (string options are serializable)
- `[rehypePrettyCode, { getHighlighter: async () => {...} }]` — **BREAKS** (function not serializable)
- `[rehypePrettyCode, { onVisitLine: (node) => {...} }]` — **BREAKS** (function not serializable)

Phase 3 does not need custom `getHighlighter` or visitor hooks. Default theme string is sufficient. **Spike is resolved: use string plugin name + serializable options.**

However, if using the Pattern 5 (programmatic `@mdx-js/mdx` compile for per-format files), rehype-pretty-code is called directly in Node.js (not through Turbopack) — so function options ARE allowed there.

[VERIFIED: node_modules/next/dist/docs/01-app/02-guides/mdx.md]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build scripts, fast-glob, gray-matter | ✓ | v24.15.0 | — |
| npm | Package installation | ✓ | 11.12.1 | — |
| fast-glob | Manifest generation | ✓ (transitive) | 3.3.3 | — |
| zod | Schema validation | ✓ | 4.4.3 | — |
| gray-matter | Frontmatter parsing | ✗ (not installed) | — | Install: `npm install gray-matter` |
| @next/mdx | MDX processing | ✗ (not installed) | — | Install with peer deps |
| rehype-pretty-code | Syntax highlighting | ✗ (not installed) | — | Install: `npm install rehype-pretty-code shiki` |
| shiki | Syntax highlighter engine | ✗ (not installed) | — | Install with rehype-pretty-code |

**Missing dependencies with no fallback (must install):**
- `gray-matter` — frontmatter parsing, no viable substitute in this stack
- `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx` — MDX processing, no alternative per locked decisions
- `rehype-pretty-code`, `shiki` — syntax highlighting per D-08

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 3 |
|-----------|-------------------|
| Use `proxy.ts` NOT `middleware.ts` | `/explore` and `/explore/[slug]` are public — no proxy.ts changes needed for Phase 3. Premium gating uses server component checks, not route-level proxy. |
| `cookies()`/`headers()`/`params` are async | `params` in `[slug]/page.tsx` must be `await`-ed. |
| Never use `getSession()` on server — always `getUser()` via DAL | Phase 3 premium stub: for the 403 response, can check `is_premium` from manifest without auth — no session needed. Full auth gating is Phase 5. |
| Never instantiate Supabase client at module scope | Not applicable to content pipeline (no Supabase in Phase 3 content reads). |
| Never use `next-mdx-remote` | Locked: use `@next/mdx`. |
| Read `node_modules/next/dist/docs/` before writing Next.js code | Done — all Next.js patterns in this research are verified against local docs. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Dynamic MDX import of per-format files (`import(\`content/...\`)`) will fail Turbopack static analysis | Common Pitfalls #2 | If wrong, can use dynamic import directly and skip Pattern 5 programmatic compile. Low risk — Pattern 5 works either way. |
| A2 | `@mdx-js/mdx` programmatic `compile()` + `run()` API works in Next.js 16 Server Components | Pattern 5 | If API changed, need to verify exact import paths. Medium risk — mitigated by spike in Wave 0. |
| A3 | rehype-pretty-code with string-only options works with Turbopack's string plugin name (`'rehype-pretty-code'`) | Standard Stack, Pitfall 1 | If wrong, must fall back to webpack for builds. LOW risk — per Next.js docs this is the explicit Turbopack-compatible pattern. |
| A4 | `fast-glob` synchronous API (`fg.sync`) works correctly in Next.js 16 Server Components at build time | Pattern 3 | If async is required, use `fg()` with await. Low risk — easy fix. |
| A5 | Zod v4 `z.enum(['a', 'b', 'c'])` with string array works for `category` field | Code Examples | If Zod v4 enum API changed further, check zod.dev/v4. Low risk — verified via Context7. |

**Claims A3 is most actionable.** The spike (Wave 0, Plan 1) MUST validate: `next build` succeeds with rehype-pretty-code as string in `@next/mdx` Turbopack config.

---

## Open Questions (RESOLVED)

1. **Programmatic MDX compile vs. @next/mdx dynamic import for format files**
   - RESOLVED: Use Pattern 5 programmatic `@mdx-js/mdx` `compile()` + `run()` for per-format files. Dynamic template-literal imports fail Turbopack static analysis. Plans use `fs.readFileSync` + programmatic compile.

2. **next.config.ts vs. next.config.mjs for @next/mdx**
   - RESOLVED: Keep `next.config.ts`. Verified against local Next.js 16 docs — TypeScript config is fully supported for ESM plugin imports. No rename needed.

3. **gray-matter or @next/mdx export const for frontmatter**
   - RESOLVED: Use `gray-matter` for manifest generation (approach b). Faster — does not require importing every MDX file. Plans use `gray-matter` + `fast-glob` for the manifest module.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --reporter=verbose` |

Current baseline: 8 tests passing (LoginForm tests).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONTENT-01 | Frontmatter fields validated by Zod schema | unit | `npx vitest run src/lib/__tests__/content.test.ts -t "schema"` | ❌ Wave 0 |
| CONTENT-02 | Per-format files discoverable by manifest module | unit | `npx vitest run src/lib/__tests__/content.test.ts -t "formats"` | ❌ Wave 0 |
| CONTENT-03 | Build fails on invalid frontmatter (ZodError) | unit | `npx vitest run src/lib/__tests__/content.test.ts -t "invalid"` | ❌ Wave 0 |
| CONTENT-04 | thumbnail.avif path + mux_playback_id in schema | unit | covered by schema tests | ❌ Wave 0 |
| CONTENT-05 | 20+ seed resources discoverable | unit | `npx vitest run src/lib/__tests__/content.test.ts -t "seed count"` | ❌ Wave 0 |
| CONTENT-06 | New resource slug appears in manifest after adding folder | manual | N/A — verified by running `next build` | N/A |
| MKT-03 | /explore page renders without auth | smoke (manual) | `curl http://localhost:3000/explore` | N/A |
| GATE-01 | Free resource detail accessible without auth | smoke (manual) | `curl http://localhost:3000/explore/animation-fade-in-on-scroll` | N/A |
| GATE-01 | Premium resource detail returns 403 without auth | smoke (manual) | `curl http://localhost:3000/explore/ui-button-hover-glow` (premium) | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green + `next build` passes before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/content.test.ts` — covers CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05
- [ ] Spike validation script: `next build` with rehype-pretty-code in Turbopack config — covers A3

---

## Security Domain

ASVS categories applicable to Phase 3:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 3 has no auth flows |
| V3 Session Management | No | Public pages only |
| V4 Access Control | Yes (partial) | Server Component `is_premium` check → 403 for premium resources |
| V5 Input Validation | Yes | Zod schema validates all frontmatter at build time; slug from URL is validated against manifest (notFound() for unknown slugs) |
| V6 Cryptography | No | No secrets in Phase 3 content pipeline |

### Threat Patterns for Phase 3 Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via slug (`../../etc/passwd`) | Tampering | `notFound()` when slug not in manifest; manifest is built from known `content/resources/` paths only |
| Premium content scraping via direct URL | Elevation of Privilege | Server Component checks `is_premium` before rendering content; 403 returned for unknown auth |
| MDX code injection via seed files | Tampering | Seed files are in the git repo — no user-generated MDX in Phase 3; risk is dev-time only |

**Phase 3 access control note (GATE-01 vs D-09):** Free resources require no auth check. Premium resources in Phase 3 return a stub 403 — NOT a real auth gate (Phase 5 wires real paywall). The Phase 3 check is `if (resource.is_premium) return <PaywallStub />` — not an auth call. This is intentional per CONTEXT.md D-09.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/02-guides/mdx.md` — @next/mdx setup, Turbopack plugin constraints, gray-matter + globby recommendation, mdx-components.tsx requirement
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md` — async params pattern for Next.js 16
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.md` — Turbopack config, experimental.turbo removal
- `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md` — Turbopack feature support table
- Context7 `/websites/zod_dev_v4` — Zod v4 enum, object, array patterns
- `npm view` registry — package versions verified 2026-05-07

### Secondary (MEDIUM confidence)
- [Next.js 16.2 Turbopack blog post](https://nextjs.org/blog/next-16-2-turbopack) — Server Fast Refresh, 16.2 changes, no MDX-specific changes
- [rehype-pretty.pages.dev](https://rehype-pretty.pages.dev/) — serializable vs. function options for rehype-pretty-code

### Tertiary (LOW confidence)
- WebSearch results on "rehype-pretty-code turbopack Next.js 16 compatibility 2026" — corroborates serializable options constraint

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry; libraries verified against official docs
- Architecture (manifest module pattern): HIGH — verified against Next.js 16 official docs and established App Router patterns
- Turbopack + rehype-pretty-code: HIGH — verified against Next.js 16 local docs; spike still recommended before full rollout
- Dynamic MDX import for format files: MEDIUM — Turbopack static analysis behavior not directly tested in this session; spike required
- Pitfalls: HIGH for documented Next.js 16 breaking changes; MEDIUM for Turbopack dynamic import behavior

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (stable stack; Next.js minor releases could affect Turbopack MDX support)
