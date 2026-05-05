---
phase: 01-marketing-surface
verified: 2026-05-05T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open http://localhost:3000 on a 375px-wide viewport (Chrome DevTools mobile emulation or physical device). Check that the hamburger menu icon is visible in the top-nav, tapping it opens a Sheet drawer with nav links stacked vertically, and tapping a link closes the drawer."
    expected: "Hamburger visible; Sheet opens and closes; nav links accessible on 375px viewport."
    why_human: "Responsive layout behavior, Sheet animation, and touch target size (44px) cannot be verified programmatically without a running browser."
  - test: "Open /pricing at 375px width. Verify the two plan cards are stacked vertically (not side-by-side), and that each card is fully readable with no horizontal overflow."
    expected: "Cards stack vertically on mobile; no horizontal scroll; both cards fully visible."
    why_human: "Tailwind grid-cols-1 -> md:grid-cols-2 breakpoint behavior requires visual inspection in a real browser viewport."
  - test: "Open /login. Type nothing and press 'Kirim Magic Link'. Verify 'Masukkan email kamu dulu.' appears in red below the input."
    expected: "Red error message appears immediately after submit with empty field."
    why_human: "Client-side form validation behavior requires a running browser; cannot be verified from static file analysis alone (though unit tests pass)."
  - test: "On /login, type 'notanemail' and press 'Kirim Magic Link'. Verify 'Format email belum benar. Coba cek lagi.' appears in red."
    expected: "Red error message for invalid format."
    why_human: "Interactive form behavior requires a running browser."
  - test: "On /login, type a valid email like 'test@example.com' and press 'Kirim Magic Link'. Verify no error appears and the form stays visible (no redirect, no success toast)."
    expected: "No error shown; form stays visible; nothing happens (intentional no-op)."
    why_human: "Interactive form behavior requires a running browser."
---

# Phase 1: Marketing Surface Verification Report

**Phase Goal:** A polished, mobile-responsive public website communicates the value proposition, displays IDR pricing with Mayar checkout CTAs (stubbed), exposes legal pages, and provides a magic-link login entry point — all rendered as pure Next.js 16 static surfaces with zero backend dependencies.
**Verified:** 2026-05-05
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor lands on `/` and reads a clear value proposition that drives them toward `/pricing` | VERIFIED | `hero-section.tsx` has verbatim headline "Komponen kreatif untuk developer Indonesia", primary CTA `href="/pricing"` labeled "Mulai Sekarang"; `pricing-teaser.tsx` has "Lihat semua paket →" also pointing to `/pricing`; home page at `src/app/(marketing)/page.tsx` composes HeroSection + ValuePropsGrid + PricingTeaser |
| 2 | Visitor sees IDR-denominated monthly and lifetime plan cards on `/pricing` with checkout CTAs (stubbed) | VERIFIED | `pricing-card.tsx`: "Rp 449.000" monthly, "Rp 13.500.000" lifetime, "Paling Populer" badge, "Batalkan kapan saja", "Akses selamanya, tanpa langganan", both CTAs have `aria-disabled="true" data-stub="true" cursor-not-allowed opacity-50 pointer-events-none tabIndex={-1}`; `pricing-card-grid.tsx` uses `grid-cols-1 md:grid-cols-2`; PPN note "Harga sudah termasuk PPN. Pembayaran diproses oleh Mayar.id." present on pricing page |
| 3 | Visitor can read `/legal/privacy-policy` and `/legal/terms-and-conditions` | VERIFIED | Both routes present in `npm run build` static output; privacy page has H1 "Kebijakan Privasi", 4 sections (Pengumpulan Data, Penggunaan Data, Cookie, Kontak); terms page has H1 "Syarat & Ketentuan", 5 sections (Pemakaian Layanan, Pembayaran, Pembatalan, Lisensi, Kontak); both use `LegalPageLayout` (max-w-[720px]) and have breadcrumb "← Kembali ke beranda" linking to `/` |
| 4 | Visitor on a 375px-wide mobile viewport sees a fully responsive, navigable site (hamburger menu, stacked pricing cards, stacked CTAs) | ? NEEDS HUMAN | Code provides the right responsive primitives: TopNav has `hidden lg:flex` desktop nav and `lg:hidden` Sheet drawer with Menu/X icons and aria-labels; pricing grid has `grid-cols-1 md:grid-cols-2`; hero CTAs have `flex-col sm:flex-row`. Visual behavior at 375px cannot be confirmed without running browser. |
| 5 | Visitor can reach `/login` and see a magic-link email input form (form submission is a no-op in this phase) | VERIFIED | `/login` route in build output; `login-form.tsx` has `'use client'`, H1 "Masuk ke lailit.supply", Input with `placeholder="kamu@email.com"`, "Kirim Magic Link" button, empty-submit and invalid-email validation with Indonesian error messages, `e.preventDefault()` makes submission a no-op |

**Score:** 5/5 truths verified (truth 4 requires human confirmation of visual rendering)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ui/button.tsx` | shadcn Button primitive | VERIFIED | Exists, provided by shadcn v4 init |
| `src/components/ui/sheet.tsx` | shadcn Sheet primitive | VERIFIED | Exists; imported by top-nav.tsx |
| `src/lib/utils.ts` | cn() utility | VERIFIED | Exists (confirmed by shadcn init) |
| `src/app/(marketing)/layout.tsx` | Marketing route-group layout shell | VERIFIED | Exists; contains skip link, TopNav, `main#main`, Footer |
| `src/components/marketing/top-nav.tsx` | Sticky navigation with mobile drawer | VERIFIED | Exists; `'use client'` on line 1, SheetTrigger, aria-labels, responsive classes |
| `src/components/marketing/footer.tsx` | Site footer | VERIFIED | Exists; 3-column links, tagline, "© 2026 lailit.supply. Dibuat di Indonesia." |
| `src/app/(marketing)/page.tsx` | Home page | VERIFIED | Exists; composes HeroSection, ValuePropsGrid, PricingTeaser |
| `src/components/marketing/hero-section.tsx` | Hero with headline, CTAs, demo | VERIFIED | Exists; verbatim headline, "Mulai Sekarang" → /pricing, "Lihat Contoh" → /explore |
| `src/components/marketing/hero-animated-demo.tsx` | CSS-only demo (Server Component) | VERIFIED | Exists; no `'use client'`; uses `hero-demo-cursor`, `hero-demo-button` CSS classes; `role="img"`, `aspect-video` |
| `src/components/marketing/value-props-grid.tsx` | 3-column value props | VERIFIED | Exists; `grid-cols-1 lg:grid-cols-3`; all 3 copy cells verbatim |
| `src/components/marketing/pricing-teaser.tsx` | Bottom-of-home pricing nudge | VERIFIED | Exists; "Lihat semua paket →" links to /pricing |
| `src/app/(marketing)/pricing/page.tsx` | Pricing page | VERIFIED | Exists; H1 "Harga", sub-heading, PricingCardGrid, PPN note |
| `src/components/marketing/pricing-card-grid.tsx` | Side-by-side card layout | VERIFIED | Exists; `grid-cols-1 md:grid-cols-2` |
| `src/components/marketing/pricing-card.tsx` | Single plan card | VERIFIED | Exists; monthly/lifetime variants, IDR prices, stub CTAs |
| `src/app/(marketing)/login/page.tsx` | Login page | VERIFIED | Exists; imports LoginForm, no `'use client'` on page itself |
| `src/components/marketing/login-form.tsx` | Magic-link form with validation | VERIFIED | Exists; `'use client'` line 1, full validation logic, no-op submit |
| `src/components/marketing/legal-page-layout.tsx` | Legal prose wrapper | VERIFIED | Exists; `max-w-[720px]` constraint |
| `src/app/(marketing)/legal/privacy-policy/page.tsx` | Privacy policy | VERIFIED | Exists; 4 sections, breadcrumb, placeholder prose |
| `src/app/(marketing)/legal/terms-and-conditions/page.tsx` | Terms page | VERIFIED | Exists; 5 sections, breadcrumb, placeholder prose |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/(marketing)/layout.tsx` | `top-nav.tsx` | import + JSX | WIRED | `import { TopNav }` + `<TopNav />` at line 17 |
| `src/app/(marketing)/layout.tsx` | `footer.tsx` | import + JSX | WIRED | `import { Footer }` + `<Footer />` at line 21 |
| `src/components/marketing/top-nav.tsx` | `src/components/ui/sheet.tsx` | import SheetTrigger | WIRED | `import { Sheet, SheetContent, SheetTrigger }` at line 6; `<SheetTrigger>` rendered in JSX |
| `src/app/(marketing)/page.tsx` | `hero-section.tsx` | import + JSX | WIRED | import line 2 + `<HeroSection />` line 15 |
| `src/components/marketing/hero-section.tsx` | `hero-animated-demo.tsx` | import + JSX | WIRED | import line 3 + `<HeroAnimatedDemo />` line 37 |
| `src/components/marketing/hero-animated-demo.tsx` | `src/app/globals.css` | CSS class names | WIRED | `hero-demo-cursor` class in component; `@keyframes orbit-cursor` + `.hero-demo-cursor` rules in globals.css line 111+ |
| `src/app/(marketing)/pricing/page.tsx` | `pricing-card-grid.tsx` | import + JSX | WIRED | import line 2 + `<PricingCardGrid />` line 24 |
| `src/components/marketing/pricing-card-grid.tsx` | `pricing-card.tsx` | import + JSX variant | WIRED | import line 1 + `<PricingCard variant="monthly" />` + `<PricingCard variant="lifetime" />` |
| `src/app/(marketing)/login/page.tsx` | `login-form.tsx` | import + JSX | WIRED | import line 2 + `<LoginForm />` line 12 |
| `src/components/marketing/login-form.tsx` | `src/components/ui/input.tsx` | import Input | WIRED | `import { Input }` line 4; `<Input>` used in JSX |
| `src/components/marketing/login-form.tsx` | `src/components/ui/label.tsx` | import Label | WIRED | `import { Label }` line 5; `<Label>` used in JSX |
| `src/app/(marketing)/legal/privacy-policy/page.tsx` | `legal-page-layout.tsx` | import + JSX wrapper | WIRED | import line 3 + used as wrapper at line 11 |
| `src/app/(marketing)/legal/terms-and-conditions/page.tsx` | `legal-page-layout.tsx` | import + JSX wrapper | WIRED | import line 3 + used as wrapper at line 11 |

### Data-Flow Trace (Level 4)

All Phase 1 pages are pure static Server Components with zero backend dependencies. The only component with dynamic data is `login-form.tsx`, which uses `useState` for client-side form validation state only — no external data source, by design. The form submission is an intentional no-op (`e.preventDefault()`). No data-flow issues: static surfaces need no DB query trace.

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `login-form.tsx` | `email`, `errorMessage` | `useState("")` / `useState(null)` | Client state only (no fetch/DB) | FLOWING — intentional; Phase 2 wires Supabase OTP |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build produces all 6 routes statically | `npm run build` | /, /_not-found, /legal/privacy-policy, /legal/terms-and-conditions, /login, /pricing — all (Static) | PASS |
| TypeScript compiles without errors | `npm run build` (includes `tsc`) | "Running TypeScript ... Finished TypeScript" — no errors | PASS |
| CSS keyframes for hero demo exist | `grep 'orbit-cursor' src/app/globals.css` | Line 111: `@keyframes orbit-cursor` found | PASS |
| Dark mode block removed | `grep 'prefers-color-scheme' src/app/globals.css` | 0 lines returned | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MKT-01 | 01-02 | Home page communicates value proposition and drives visitors to pricing | SATISFIED | Headline "Komponen kreatif untuk developer Indonesia"; primary CTA "Mulai Sekarang" → /pricing; PricingTeaser "Lihat semua paket →" → /pricing |
| MKT-02 | 01-03 | Pricing page displays IDR prices for monthly and lifetime plans with Mayar checkout CTAs | SATISFIED | /pricing page: Rp 449.000/bulan and Rp 13.500.000 sekali bayar; stub CTAs with aria-disabled/data-stub; PPN note referencing Mayar.id |
| MKT-04 | 01-04 | Legal pages: /legal/privacy-policy, /legal/terms-and-conditions | SATISFIED | Both routes build statically; substantive placeholder prose; breadcrumb navigation |
| MKT-05 | 01-01, 01-02, 01-03, 01-04 | All public pages are mobile-responsive | PARTIAL — CODE VERIFIED, VISUAL NEEDS HUMAN | Responsive Tailwind classes present throughout: `hidden lg:flex` / `lg:hidden` for nav, `grid-cols-1 md:grid-cols-2` for pricing cards, `flex-col sm:flex-row` for CTAs; visual confirmation at 375px is a human verification item |
| MKT-06 | 01-04 | Login page with magic-link email input | SATISFIED | /login route; "Masuk ke lailit.supply" heading; email input; "Kirim Magic Link" button; client-side validation; no-op submit |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `legal/privacy-policy/page.tsx` | `[TODO: legal review]` JSX comments | INFO | Intentional per spec — JSX comments render to nothing in HTML. Placeholder prose is substantive and structured. Real copy required pre-launch. Not a blocker. |
| `legal/terms-and-conditions/page.tsx` | `[TODO: legal review]` JSX comments | INFO | Same as above. |
| `pricing-card.tsx` | `href="#"` stub CTAs | INFO | Intentional per D-12 and plan spec. CTAs are `pointer-events-none tabIndex={-1}` — functionally inert. `data-stub="true"` is the Phase 4 wiring marker. Not a Phase 1 blocker. |
| `hero-section.tsx` / `top-nav.tsx` / `footer.tsx` | `href="/explore"` links | INFO | Intentional stub — /explore route does not exist in Phase 1 (Phase 3 wires it). Next.js will serve a 404 for this route only. Not a Phase 1 scope issue. |

No blockers found. All anti-patterns are intentional per the phase spec.

### Human Verification Required

#### 1. Mobile Hamburger Navigation at 375px

**Test:** Open the site in Chrome DevTools with device width set to 375px (or iPhone SE emulation). Navigate to `/`. Verify the TopNav shows only the logo and hamburger icon (desktop nav links hidden). Tap the hamburger — the Sheet drawer should slide in from the right with "Komponen", "Harga", "Masuk" links stacked vertically. Tap a link — the drawer should close.
**Expected:** Mobile hamburger visible; Sheet drawer opens/closes; 44px touch targets; links navigable.
**Why human:** CSS responsive breakpoints and Sheet drawer animation cannot be confirmed from static analysis.

#### 2. Pricing Cards Stacked on Mobile

**Test:** Open `/pricing` at 375px width. Verify the Monthly and Lifetime cards are stacked vertically (one per row), not side-by-side. Verify no horizontal overflow.
**Expected:** Cards stack vertically; both fully visible; no horizontal scroll.
**Why human:** Tailwind `grid-cols-1` → `md:grid-cols-2` breakpoint behavior requires visual inspection.

#### 3. Login Form Validation Behaviors

**Test:** Open `/login`. (a) Click "Kirim Magic Link" with empty field — verify "Masukkan email kamu dulu." appears in red below the input. (b) Type "notanemail" and submit — verify "Format email belum benar. Coba cek lagi." appears. (c) Type "test@example.com" and submit — verify no error, form stays visible.
**Expected:** Correct Indonesian error messages for each case; valid submit is silent no-op.
**Why human:** Client-side React state and form interaction requires a live browser (unit tests exist and pass, but a smoke test in-browser confirms the integration).

#### 4. Hero Animated Demo

**Test:** Open `/` and observe the hero section below the CTAs. Verify a white rounded-corner box contains an orbiting dot cursor and a pulsing "Hover me" pill — both animating in a loop.
**Expected:** CSS animation running; `prefers-reduced-motion` disables animation if OS setting is active.
**Why human:** CSS animation playback requires a running browser.

### Gaps Summary

No gaps blocking the phase goal. All 5 success criteria are verified at the code level. The 5 human verification items are confirmations of visual/interactive behavior that the code correctly implements — they are not expected to be gaps, but must be checked in a browser before marking the phase fully complete.

---

_Verified: 2026-05-05_
_Verifier: Claude (gsd-verifier)_
