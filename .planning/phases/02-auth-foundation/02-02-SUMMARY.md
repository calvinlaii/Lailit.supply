---
phase: 02-auth-foundation
plan: "02"
subsystem: login-flow
tags: [magic-link, server-action, useActionState, auth-confirm, react-19]
dependency_graph:
  requires:
    - src/lib/supabase/server.ts (02-01)
    - src/lib/dal.ts (02-01)
  provides:
    - src/app/(marketing)/login/actions.ts
    - src/app/auth/confirm/route.ts
    - src/components/marketing/login-error-alert.tsx
  affects:
    - src/components/marketing/login-form.tsx (modified — now wired to Server Action)
    - src/app/(marketing)/login/page.tsx (modified — async searchParams)
    - Phase 4 webhook handler can reuse /auth/confirm route handler pattern
tech_stack:
  added: []
  patterns:
    - React 19 useActionState for Server Action form wiring
    - Discriminated union return type for Server Action state (idle/success/error)
    - shouldCreateUser: false prevents user enumeration (AUTH-01 mitigation)
    - origin extracted from request.url for redirect (not from query params) (T-02-08 mitigation)
    - Async searchParams (Next.js 16) in Server Component login page
key_files:
  created:
    - src/app/(marketing)/login/actions.ts
    - src/app/auth/confirm/route.ts
    - src/components/marketing/login-error-alert.tsx
  modified:
    - src/components/marketing/login-form.tsx
    - src/app/(marketing)/login/page.tsx
    - src/components/marketing/__tests__/login-form.test.tsx
    - src/components/dashboard/user-menu.tsx
decisions:
  - "400 errors from signInWithOtp treated as success — prevents user enumeration when shouldCreateUser:false rejects unknown emails (AUTH-01)"
  - "origin for redirects extracted from request.url not query params — prevents open redirect (T-02-08)"
  - "useActionState with function wrapper for action prop — client-side validation runs before dispatching to Server Action"
  - "useActionState mocked in tests via vi.mock('react') — avoids Next.js request scope errors from cookies() in test environment"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-06"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 4
---

# Phase 02 Plan 02: LoginForm Wiring + Magic Link Confirm Route Summary

**One-liner:** React 19 useActionState wired to signInWithMagicLink Server Action with Mengirim loading state, Cek email kamu success state, link-expired inline alert, and /auth/confirm GET handler completing the full magic-link auth flow.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Server Action and auth/confirm route handler | c42fee3 | actions.ts, auth/confirm/route.ts |
| 2 | Update LoginForm, add LoginErrorAlert, update login page | 65af750 | login-form.tsx, login-error-alert.tsx, login/page.tsx, login-form.test.tsx, user-menu.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Build] Fixed asChild prop incompatibility in user-menu.tsx**
- **Found during:** Task 2 — npm run build failed with TypeScript error
- **Issue:** `src/components/dashboard/user-menu.tsx` (created by parallel wave 02-03) used `<DropdownMenuItem asChild>` — but the shadcn v4 component built on `@base-ui/react/menu` does not support the Radix UI `asChild` prop pattern
- **Fix:** Removed `asChild`, rendered `<form>` and `<button>` directly inside `<DropdownMenuItem className="p-0">` with explicit padding classes on the button
- **Files modified:** `src/components/dashboard/user-menu.tsx`
- **Commit:** 65af750

**2. [Rule 1 - Bug] Updated login-form.test.tsx for Phase 2 Server Action wiring**
- **Found during:** Task 2 — npm test threw unhandled exception
- **Issue:** Pre-existing test "shows no error when submitted with valid email (no-op)" triggered the Server Action `signInWithMagicLink` which called `cookies()` outside a Next.js request scope in the test environment. Also, `useActionState` form action wiring through React internals caused two tests ("clears error after typing" and "aria-describedby") to fail because the form's custom action function didn't run on submit in jsdom.
- **Fix:** Mocked `@/app/(marketing)/login/actions` and `react`'s `useActionState` so tests run with synchronous state management and no request-scope dependencies. Added 2 new tests for errorParam/link-expired behavior.
- **Files modified:** `src/components/marketing/__tests__/login-form.test.tsx`
- **Commit:** 65af750

## Verification Results

1. `npm run build` — exits 0, TypeScript compiles without errors
2. `npm test` — 20 tests pass (18 original + 2 new link-expired tests), 0 errors
3. `grep -c "useActionState" src/components/marketing/login-form.tsx` — 2 (import + usage)
4. `grep -c "useState" src/components/marketing/login-form.tsx` — 3 (import + email + validationError)
5. `grep "getSession" src/app/auth/confirm/route.ts` — 0 results
6. `grep -c "shouldCreateUser: false" src/app/(marketing)/login/actions.ts` — 2 (code + comment)
7. `grep -c "Cek email kamu" src/components/marketing/login-form.tsx` — 1
8. `grep -c "Link kamu sudah kedaluwarsa" src/components/marketing/login-error-alert.tsx` — 1

## Known Stubs

None — all plan outputs are fully wired. The Server Action calls the real Supabase client (which requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local to work at runtime).

## Threat Flags

No new threat surface introduced beyond what was in the plan's threat model.

Applied STRIDE mitigations:
- T-02-06: shouldCreateUser: false + 400 errors treated as success — user enumeration prevented
- T-02-07: token_hash passed to supabase.auth.verifyOtp() for server-side JWT validation
- T-02-08: origin from request.url (not query params) — hardcoded redirect targets /dashboard and /login?error=link-expired

## Self-Check: PASSED

Files verified:
- FOUND: src/app/(marketing)/login/actions.ts
- FOUND: src/app/auth/confirm/route.ts
- FOUND: src/components/marketing/login-error-alert.tsx
- FOUND: src/components/marketing/login-form.tsx (modified)
- FOUND: src/app/(marketing)/login/page.tsx (modified)

Commits verified:
- FOUND: c42fee3 (feat: Server Action and auth/confirm route handler)
- FOUND: 65af750 (feat: LoginForm wiring + LoginErrorAlert + login page)
