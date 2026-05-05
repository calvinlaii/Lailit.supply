---
phase: 01-marketing-surface
plan: 04
subsystem: marketing-pages
tags: [login, legal, form-validation, tdd, accessibility]
dependency_graph:
  requires:
    - 01-01 (shadcn primitives, marketing layout shell)
  provides:
    - /login page with client-side validated magic-link form (no-op)
    - /legal/privacy-policy page with placeholder prose
    - /legal/terms-and-conditions page with placeholder prose
    - LegalPageLayout component (max-w-[720px] prose wrapper)
    - LoginForm component ('use client', email validation)
  affects:
    - Phase 2: LoginForm wiring to supabase.auth.signInWithOtp
tech_stack:
  added:
    - vitest (test runner)
    - "@testing-library/react" (component testing)
    - "@testing-library/user-event" (user interaction simulation)
    - "@vitejs/plugin-react" (vitest React plugin)
    - jsdom (test environment)
  patterns:
    - TDD Red-Green cycle for client-side form validation
    - Client Component ('use client') for stateful form, Server Components for pages
    - aria-describedby linking error message to input for accessibility
    - 'use client' boundary at component level, not page level
key_files:
  created:
    - src/components/marketing/login-form.tsx
    - src/app/(marketing)/login/page.tsx
    - src/components/marketing/legal-page-layout.tsx
    - src/app/(marketing)/legal/privacy-policy/page.tsx
    - src/app/(marketing)/legal/terms-and-conditions/page.tsx
    - src/components/marketing/__tests__/login-form.test.tsx
    - vitest.config.ts
  modified:
    - package.json (added test devDependencies and test script)
decisions:
  - LoginForm uses a plain <button type="submit"> instead of shadcn Button to avoid importing a 'use client' primitive into an already-client component unnecessarily; styling matches Button spec exactly
  - Input component's aria-invalid attribute triggers built-in error styling via aria-invalid:border-destructive in shadcn v4; explicit border-red-600 class override is additive for robustness
  - Vitest installed at worktree level for TDD execution; vitest.config.ts uses __dirname-based path alias resolution
  - Legal prose uses JSX comment {/* [TODO: legal review] */} so markers survive TypeScript compilation and appear in source but not rendered HTML
metrics:
  duration: "4 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  files_created: 7
  files_modified: 1
---

# Phase 1 Plan 04: Login Form + Legal Pages Summary

**One-liner:** Magic-link login form with Indonesian client-side validation (TDD Red-Green), no-op submit for Phase 2 wiring, plus static privacy policy and terms pages with placeholder prose and breadcrumb navigation under LegalPageLayout (max-w-[720px]).

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 (RED) | Failing tests for LoginForm validation | d664351 | src/components/marketing/__tests__/login-form.test.tsx, vitest.config.ts, package.json |
| 1 (GREEN) | LoginForm + login page implementation | d52d629 | src/components/marketing/login-form.tsx, src/app/(marketing)/login/page.tsx |
| 2 | LegalPageLayout + legal pages | 0c76ed7 | src/components/marketing/legal-page-layout.tsx, src/app/(marketing)/legal/privacy-policy/page.tsx, src/app/(marketing)/legal/terms-and-conditions/page.tsx |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

**[Rule 3 - Infrastructure] Vitest test infrastructure installed**
- **Found during:** Task 1 (TDD RED phase)
- **Issue:** Project had no test runner; TDD task requires running failing tests before implementation
- **Fix:** Installed vitest + @testing-library/react + @testing-library/user-event + jsdom + @vitejs/plugin-react as devDependencies; added vitest.config.ts with @/* alias resolution
- **Files modified:** package.json, vitest.config.ts (new)
- **Impact:** Build unaffected; test infrastructure available for all future plans

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `e.preventDefault()` (no-op form submit) | src/components/marketing/login-form.tsx | 17 | Phase 1 spec (D-15): login form is UI-only; supabase.auth.signInWithOtp wired in Phase 2 |
| Legal placeholder prose | src/app/(marketing)/legal/privacy-policy/page.tsx | multiple | [TODO: legal review] markers throughout; real legal copy supplied by founder pre-launch |
| Legal placeholder prose | src/app/(marketing)/legal/terms-and-conditions/page.tsx | multiple | [TODO: legal review] markers throughout; real legal copy supplied by founder pre-launch |

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary surface introduced beyond what the plan's threat model covers. LoginForm is client-side only with e.preventDefault(); no data leaves the browser in Phase 1.

## TDD Gate Compliance

- RED gate: `test(01-04)` commit d664351 — failing tests committed before implementation
- GREEN gate: `feat(01-04)` commit d52d629 — all 6 tests pass after implementation
- REFACTOR gate: Not needed — implementation is clean

## Verification Results

```
Build: PASS
Routes in output: /, /_not-found, /legal/privacy-policy, /legal/terms-and-conditions, /login
TypeScript: PASS (no errors)
Tests: 6/6 PASS
```

### Acceptance Criteria

- [x] `grep "'use client'" src/components/marketing/login-form.tsx` matches line 1
- [x] `grep "use client" src/app/(marketing)/login/page.tsx` returns ZERO lines (Server Component)
- [x] `grep "Masuk ke lailit.supply" src/components/marketing/login-form.tsx` matches
- [x] `grep "Kami akan kirim link masuk ke emailmu" src/components/marketing/login-form.tsx` matches
- [x] `grep "kamu@email.com" src/components/marketing/login-form.tsx` matches
- [x] `grep "Kirim Magic Link" src/components/marketing/login-form.tsx` matches
- [x] `grep "Masukkan email kamu dulu." src/components/marketing/login-form.tsx` matches
- [x] `grep "Format email belum benar. Coba cek lagi." src/components/marketing/login-form.tsx` matches
- [x] `grep "Belum punya akun" src/components/marketing/login-form.tsx` matches
- [x] `grep "e.preventDefault" src/components/marketing/login-form.tsx` matches
- [x] `grep 'aria-describedby' src/components/marketing/login-form.tsx` matches
- [x] `grep 'role="alert"' src/components/marketing/login-form.tsx` matches
- [x] `grep "text-red-600" src/components/marketing/login-form.tsx` matches
- [x] `grep "border-red-600" src/components/marketing/login-form.tsx` matches
- [x] `grep "use client" src/components/marketing/legal-page-layout.tsx` returns ZERO lines
- [x] `grep "max-w-[720px]" src/components/marketing/legal-page-layout.tsx` matches
- [x] `grep "Kebijakan Privasi" src/app/(marketing)/legal/privacy-policy/page.tsx` matches
- [x] `grep "Terakhir diperbarui: 5 Mei 2026" src/app/(marketing)/legal/privacy-policy/page.tsx` matches
- [x] `grep "Kembali ke beranda" src/app/(marketing)/legal/privacy-policy/page.tsx` matches
- [x] `grep 'href="/"' src/app/(marketing)/legal/privacy-policy/page.tsx` matches
- [x] `grep "TODO: legal review" src/app/(marketing)/legal/privacy-policy/page.tsx | wc -l` returns 6 (≥4)
- [x] `grep "Pengumpulan Data" src/app/(marketing)/legal/privacy-policy/page.tsx` matches
- [x] `grep "Penggunaan Data" src/app/(marketing)/legal/privacy-policy/page.tsx` matches
- [x] `grep "Syarat" src/app/(marketing)/legal/terms-and-conditions/page.tsx` matches
- [x] `grep "Pemakaian Layanan" src/app/(marketing)/legal/terms-and-conditions/page.tsx` matches
- [x] `grep "Pembatalan" src/app/(marketing)/legal/terms-and-conditions/page.tsx` matches
- [x] `grep "Lisensi" src/app/(marketing)/legal/terms-and-conditions/page.tsx` matches
- [x] `npm run build` exits 0, routes /login, /legal/privacy-policy, /legal/terms-and-conditions appear

## Self-Check: PASSED
