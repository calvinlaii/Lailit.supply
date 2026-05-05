# Phase 1: Marketing Surface - Pattern Map

**Mapped:** 2026-05-05
**Files analyzed:** 11 (new/modified)
**Analogs found:** 3 / 11 (codebase is a fresh CNA starter — 3 source files exist; all new files pattern from these)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/layout.tsx` | layout | request-response | `src/app/layout.tsx` (self — modify) | exact |
| `src/app/globals.css` | config/styles | transform | `src/app/globals.css` (self — modify) | exact |
| `src/app/(marketing)/layout.tsx` | layout | request-response | `src/app/layout.tsx` | role-match |
| `src/app/(marketing)/page.tsx` | page (Server Component) | request-response | `src/app/page.tsx` | role-match |
| `src/app/(marketing)/pricing/page.tsx` | page (Server Component) | request-response | `src/app/page.tsx` | role-match |
| `src/app/(marketing)/login/page.tsx` | page (Server Component) | request-response | `src/app/page.tsx` | role-match |
| `src/app/(marketing)/legal/privacy-policy/page.tsx` | page (Server Component) | request-response | `src/app/page.tsx` | role-match |
| `src/app/(marketing)/legal/terms-and-conditions/page.tsx` | page (Server Component) | request-response | `src/app/page.tsx` | role-match |
| `src/components/marketing/top-nav.tsx` | component | event-driven (hamburger state) | `src/app/page.tsx` | partial |
| `src/components/marketing/hero-animated-demo.tsx` | component | transform (CSS animation) | none | no analog |
| `src/components/marketing/footer.tsx` | component | request-response | `src/app/page.tsx` | partial |

---

## Pattern Assignments

### `src/app/layout.tsx` (modify existing)

**Analog:** `src/app/layout.tsx` (lines 1–33)

**Required changes** (both are hard requirements from UI-SPEC.md):
1. Change `lang="en"` to `lang="id"` (line 27)
2. Add OG/favicon metadata fields

**Imports pattern** (lines 1–3 — keep as-is):
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
```

**Font wiring pattern** (lines 5–13 — keep as-is):
```typescript
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

**Metadata pattern** (lines 15–18 — replace content, keep shape):
```typescript
export const metadata: Metadata = {
  title: "lailit.supply — Komponen kreatif untuk developer Indonesia",
  description: "Animasi siap pakai, lima format kode, satu langganan.",
};
```

**RootLayout pattern** (lines 20–33 — change lang, keep className structure):
```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"  // CHANGED from "en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

---

### `src/app/globals.css` (modify existing)

**Analog:** `src/app/globals.css` (lines 1–26)

**Required changes** (hard requirements from UI-SPEC.md):
1. DELETE the entire `@media (prefers-color-scheme: dark)` block (lines 15–20) — conflicts with D-01 (light-first, no dark mode)
2. Replace `font-family: Arial, Helvetica, sans-serif` with `var(--font-geist-sans)` on the `body` rule
3. Add Phase 1 design token declarations (custom properties for radius, shadcn CSS variables, reduced-motion rule)

**Keep — the `@import` and `@theme` block** (lines 1–13):
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

**Delete this block entirely** (lines 15–20):
```css
/* DELETE — conflicts with D-01 (light-first, no dark mode at MVP) */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

**Replace `body` rule and add new tokens** (lines 22–26 become):
```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans);  /* CHANGED from Arial */
}

/* Phase 1 radius tokens */
:root {
  --radius: 12px;        /* cards */
  --radius-sm: 8px;      /* buttons, inputs */
  --radius-full: 9999px; /* pill badge */
}

/* Reduced motion: disable all transitions site-wide */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

**Tailwind v4 note:** `@import "tailwindcss"` (line 1) is the v4 way — NOT `@tailwind base/components/utilities`. Keep it. The `@theme inline` block (lines 8–13) is Tailwind v4's CSS-first config — keep it. No `tailwind.config.js` exists or should be created.

---

### `src/app/(marketing)/layout.tsx` (new)

**Analog:** `src/app/layout.tsx` (role-match — same Server Component layout shape)

**Pattern:** A Server Component that wraps children with `<TopNav />` and `<Footer />`. Does NOT redeclare fonts (those live only in root layout). Does NOT have an `<html>` or `<body>` tag (nested layout).

**Copy this shape from `src/app/layout.tsx` lines 20–33, strip html/body tags:**
```tsx
import { TopNav } from "@/components/marketing/top-nav";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <TopNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
```

**Key points:**
- `id="main"` pairs with the skip link `<a href="#main">Lewati ke konten utama</a>` declared in UI-SPEC accessibility contract
- `flex-1` makes main take remaining height (root body is `flex flex-col`)
- No `export const metadata` here — each page declares its own
- This is a Server Component (no `'use client'` — layouts default to server)
- Route group `(marketing)` parentheses mean the folder name does NOT appear in the URL

---

### `src/app/(marketing)/page.tsx` (new)

**Analog:** `src/app/page.tsx` (role-match — same Server Component page shape)

**Pattern:** Server Component, imports marketing sub-components, composes the home page. No `'use client'`. No data fetching (static).

**Copy this structural shape from `src/app/page.tsx` lines 1–65:**
```tsx
import { HeroSection } from "@/components/marketing/hero-section";
import { ValuePropsGrid } from "@/components/marketing/value-props-grid";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "lailit.supply — Komponen kreatif untuk developer Indonesia",
  description: "Animasi siap pakai, lima format kode, satu langganan.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropsGrid />
      <PricingTeaser />
    </>
  );
}
```

**Container class pattern** (from `src/app/page.tsx` line 6 — adapt to spec):
The existing page uses `max-w-3xl`. Phase 1 spec uses `max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12`. Apply this container in each section component, not at the page level (sections may have full-bleed backgrounds).

**Page-level spacing** (from UI-SPEC Page Layouts `/` section):
```tsx
// Between sections: py-24 (96px mobile) lg:py-32 (128px desktop)
// Applied to the wrapping div inside each section component
```

---

### `src/app/(marketing)/pricing/page.tsx` (new)

**Analog:** `src/app/page.tsx` (role-match)

**Same Server Component page shape.** Imports `PricingCardGrid`.

```tsx
import { PricingCardGrid } from "@/components/marketing/pricing-card-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Harga — lailit.supply",
  description: "Akses penuh ke seluruh komponen. Pilih bulanan atau lifetime.",
};

export default function PricingPage() {
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto">
        <header className="text-center mb-12">
          {/* h1 "Harga" + sub-headline */}
        </header>
        <PricingCardGrid />
        <p className="text-center text-sm text-neutral-500 mt-8">
          Harga sudah termasuk PPN. Pembayaran diproses oleh Mayar.id.
        </p>
      </div>
    </div>
  );
}
```

**Stubbed CTA pattern** (UI-SPEC CTA state, pricing cards):
```tsx
<a
  href="#"
  aria-disabled="true"
  data-stub="true"
  title="Segera hadir"
  className="... cursor-not-allowed opacity-50 pointer-events-none"
>
  Berlangganan Bulanan
</a>
```

---

### `src/app/(marketing)/login/page.tsx` (new)

**Analog:** `src/app/page.tsx` (role-match)

**Server Component page.** Login form state (client-side validation) lives in `<LoginForm />` which is a `'use client'` component.

```tsx
import { LoginForm } from "@/components/marketing/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk — lailit.supply",
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-20">
      <LoginForm />
    </div>
  );
}
```

**Form no-op pattern** (UI-SPEC D-15):
```tsx
// Inside LoginForm ('use client'):
<form onSubmit={(e) => e.preventDefault()}>
  {/* wired in Phase 2 */}
</form>
```

---

### `src/app/(marketing)/legal/privacy-policy/page.tsx` and `terms-and-conditions/page.tsx` (new)

**Analog:** `src/app/page.tsx` (role-match)

**Both follow the same shape — Server Component pages.** Breadcrumb + heading + placeholder prose.

```tsx
import { LegalPageLayout } from "@/components/marketing/legal-page-layout";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — lailit.supply",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout>
      <Link
        href="/"
        className="text-sm text-neutral-500 hover:text-neutral-950 mb-8 inline-block"
      >
        ← Kembali ke beranda
      </Link>
      <h1 className="text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em]">
        Kebijakan Privasi
      </h1>
      <p className="text-sm text-neutral-500 mt-2">
        Terakhir diperbarui: 5 Mei 2026
      </p>
      <article className="mt-8 prose prose-neutral max-w-none">
        {/* placeholder legal copy with [TODO: legal review] markers */}
      </article>
    </LegalPageLayout>
  );
}
```

**`Link` import pattern** (from `src/app/page.tsx` line 1 which uses `Image` — same next/* import style):
```tsx
import Link from "next/link";
// next/* imports always from the "next/..." subpath, never from "next"
```

---

### `src/components/marketing/top-nav.tsx` (new)

**Analog:** `src/app/page.tsx` (partial — shares JSX/Tailwind patterns but nav needs `'use client'` for Sheet state)

**This component has two layers:**
- The nav shell is a Server Component
- The mobile `Sheet` (hamburger) requires `'use client'`

**Pattern: Split into a server wrapper + client drawer, OR mark the whole file `'use client'`.** For Phase 1 simplicity, mark `'use client'` on the whole file (nav is small, interactivity requirement is clear).

**Imports pattern:**
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
```

**Active link pattern** (from UI-SPEC Interaction States — Nav link active state):
```tsx
const pathname = usePathname();

// Apply underline when current route matches
<Link
  href="/pricing"
  className={`text-sm text-neutral-950 underline-offset-4 hover:underline ${
    pathname === "/pricing" ? "underline" : ""
  }`}
>
  Harga
</Link>
```

**Touch target pattern** (from UI-SPEC spacing exception — hamburger 44x44px):
```tsx
<SheetTrigger asChild>
  <button
    className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 lg:hidden"
    aria-label={isOpen ? "Tutup menu" : "Buka menu"}
    aria-expanded={isOpen}
  >
    {isOpen ? <X size={24} /> : <Menu size={24} />}
  </button>
</SheetTrigger>
```

**Container class** (from UI-SPEC container rules + nav h-16):
```tsx
<nav className="sticky top-0 z-50 h-16 border-b border-neutral-200 bg-white">
  <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center justify-between">
    {/* logo left, links right */}
  </div>
</nav>
```

---

### `src/components/marketing/footer.tsx` (new)

**Analog:** `src/app/page.tsx` (partial — shares JSX/Tailwind patterns; purely static Server Component)

**Pattern:** Static Server Component, no state, no `'use client'`.

**Imports pattern:**
```tsx
import Link from "next/link";
```

**Structure pattern** (from UI-SPEC Footer copywriting contract):
```tsx
export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* tagline column + 3 link columns */}
        </div>
        <div className="mt-12 border-t border-neutral-200 pt-8">
          <p className="text-sm text-neutral-500">
            © 2026 lailit.supply. Dibuat di Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

---

### `src/components/marketing/hero-animated-demo.tsx` (new)

**Analog:** None — no CSS animation components exist in the codebase.

**Pattern source:** UI-SPEC Hero Animation Spec section (pure CSS, zero JS, Server Component).

**Implementation contract:**
- No `'use client'` directive
- No imports except potentially nothing (pure JSX + CSS)
- Animation lives entirely in CSS keyframes (can be in a `<style>` tag or in `globals.css`)
- `role="img"` + `aria-label` on the outer container (accessibility contract)
- `@media (prefers-reduced-motion: reduce)` disables animation in CSS

**Shell pattern:**
```tsx
// Server Component — no 'use client'
export function HeroAnimatedDemo() {
  return (
    <div
      role="img"
      aria-label="Demo animasi tombol magnetic hover"
      className="relative w-full max-w-[960px] mx-auto aspect-video border border-neutral-200 rounded-[12px] bg-white overflow-hidden"
      style={{ padding: "64px" }}
    >
      {/* CSS-only animation: orbiting cursor + scaling button */}
      {/* All motion via CSS @keyframes — see globals.css additions */}
    </div>
  );
}
```

**CSS keyframes** (add to `globals.css` as `@keyframes` rules, not Tailwind utilities — Tailwind v4 does not replace custom `@keyframes`):
```css
@keyframes orbit-cursor {
  0%   { transform: translate(80px, 0); }
  25%  { transform: translate(0, -80px); }
  50%  { transform: translate(-80px, 0); }
  75%  { transform: translate(0, 80px); }
  100% { transform: translate(80px, 0); }
}

@keyframes button-pulse {
  0%, 100% { transform: scale(1) translateX(0); }
  25%       { transform: scale(1.04) translateX(4px); }
  75%       { transform: scale(1.04) translateX(-4px); }
}

.hero-demo-cursor {
  animation: orbit-cursor 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.hero-demo-button {
  animation: button-pulse 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hero-demo-cursor,
  .hero-demo-button {
    animation: none;
  }
}
```

---

## Shared Patterns

### TypeScript component export pattern
**Source:** `src/app/page.tsx` (line 3) and `src/app/layout.tsx` (line 20)
**Apply to:** All new components and pages

```typescript
// Pages: default export (Next.js requirement)
export default function PageName() { ... }

// Components: named export preferred (enables tree-shaking + explicit imports)
export function ComponentName() { ... }
```

### Path alias pattern
**Source:** `tsconfig.json` (line 22)
**Apply to:** All import statements

```typescript
// Always use @/* alias — never use relative paths like ../../../
import { Foo } from "@/components/marketing/foo";
import { cn } from "@/lib/utils";  // shadcn utility (created by shadcn init)
```

### Tailwind v4 class usage pattern
**Source:** `src/app/globals.css` (lines 8–13) + `src/app/page.tsx` (lines 5–62)
**Apply to:** All components

```
// v4 uses @theme inline for CSS custom properties — reference them as Tailwind tokens
// Classes observed in starter: flex, flex-col, items-center, justify-center, gap-*, max-w-*,
// w-full, h-*, px-*, py-*, text-*, font-*, leading-*, tracking-*, bg-*, border-*, rounded-*
// 
// Tailwind v4 DOES NOT use tailwind.config.js
// Arbitrary values use [value] syntax: max-w-[1200px], aspect-[16/9], text-[1.75rem]
```

### Typography class pattern
**Source:** `src/app/page.tsx` (lines 16–28) translated to Phase 1 spec values
**Apply to:** All text elements across all marketing pages

```tsx
// Display (hero h1): text-[3rem] lg:text-[6rem] font-semibold leading-[1.05] tracking-[-0.03em]
// Heading (h1 on interior pages, h2): text-[1.75rem] lg:text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.02em]
// Body: text-base font-normal leading-[1.5]          (16px, weight 400)
// Label: text-sm font-normal leading-[1.45]          (14px, weight 400)
// Muted text: add text-neutral-500
// FORBIDDEN: font-medium (500), font-bold (700), italic
```

### Next.js `Link` vs `<a>` pattern
**Source:** `src/app/page.tsx` (line 39, uses `<a>` for external links)
**Apply to:** All navigation elements

```tsx
// Internal navigation: always next/link
import Link from "next/link";
<Link href="/pricing">Harga</Link>

// External links: <a> with rel="noopener noreferrer" + target="_blank"
<a href="https://..." target="_blank" rel="noopener noreferrer">...</a>

// Stubbed CTAs (pricing page): <a aria-disabled="true" data-stub="true">
```

### Server Component default pattern
**Source:** `src/app/layout.tsx` (no 'use client' directive = Server Component by default)
**Apply to:** All page files and stateless components

```typescript
// NO 'use client' directive = Server Component (default in Next.js App Router)
// Add 'use client' ONLY when the component uses: useState, useEffect, usePathname,
// event handlers (onClick, onChange, onSubmit), browser APIs
//
// Phase 1 'use client' components: top-nav.tsx (Sheet state), login-form.tsx (form validation)
// All others are Server Components
```

### Focus-visible accessibility pattern
**Source:** UI-SPEC Interaction States (all interactive elements)
**Apply to:** All buttons, links, inputs in all components

```tsx
// Always use focus-visible (not focus) to avoid focus rings on mouse click
className="... focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
```

### Skip link pattern
**Source:** UI-SPEC Accessibility Contract
**Apply to:** `src/app/(marketing)/layout.tsx`

```tsx
// First focusable element on every page — visible only on focus
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral-950 focus:border focus:border-neutral-200 focus:rounded-lg"
>
  Lewati ke konten utama
</a>
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/components/marketing/hero-animated-demo.tsx` | component | transform (CSS animation) | No animation components exist in the codebase. Implement from UI-SPEC Hero Animation Spec directly. |
| `src/components/marketing/value-props-grid.tsx` | component | request-response | No grid-layout components exist. Implement as pure Tailwind CSS grid (no shadcn primitive needed). |
| `src/components/marketing/pricing-teaser.tsx` | component | request-response | No teaser/CTA section components exist. Implement from UI-SPEC Pricing Teaser copy contract. |
| `src/components/marketing/hero-section.tsx` | component | request-response | No hero components exist. Composes HeroAnimatedDemo + CTAs from UI-SPEC Home layout spec. |
| `src/components/marketing/pricing-card-grid.tsx` | component | request-response | No card grid components exist. Uses shadcn `Card`+`Badge`+`Button` per UI-SPEC. |
| `src/components/marketing/pricing-card.tsx` | component | request-response | No card components exist (shadcn `Card` is the primitive). |
| `src/components/marketing/login-form.tsx` | component | event-driven | No form components exist. Uses shadcn `Form`+`Input`+`Label`+`Button`+`Card`. |
| `src/components/marketing/legal-page-layout.tsx` | component | request-response | No layout wrapper components exist. Pure Server Component with max-w-[720px] prose wrapper. |

---

## Critical Executor Pre-flight Checklist

Before writing any component, the executor MUST complete these in order:

1. **Run `npx shadcn@latest init`** — selects `new-york` style, `neutral` base color, `cssVariables: true`. This creates `src/components/ui/`, `src/lib/utils.ts` (with `cn()`), and updates `globals.css` with shadcn CSS variable declarations. Do NOT write components before this runs — they'll import non-existent `@/components/ui/*` paths.

2. **Run `npx shadcn@latest add button card badge input label form sheet`** — installs the 7 primitives needed for Phase 1 components.

3. **Modify `src/app/globals.css`** per pattern above (delete dark-mode block, fix font-family, add radius tokens, add reduced-motion rule, add `@keyframes` for hero animation).

4. **Modify `src/app/layout.tsx`** — change `lang="en"` to `lang="id"`, update metadata.

5. **Only then** write marketing components and pages.

---

## Metadata

**Analog search scope:** `src/app/` (all 3 files in the directory)
**Files scanned:** 3 (`src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`) + `tsconfig.json`, `package.json`, `next.config.ts`
**Pattern extraction date:** 2026-05-05
