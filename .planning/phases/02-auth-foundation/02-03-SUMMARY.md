---
phase: 02-auth-foundation
plan: "03"
subsystem: dashboard-shell
tags: [dashboard, auth-gate, server-component, server-action, shadcn, avatar, dropdown-menu]
dependency_graph:
  requires:
    - src/lib/dal.ts (getUser — from 02-01)
    - src/lib/supabase/server.ts (createClient — from 02-01)
  provides:
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - src/components/dashboard/dashboard-nav.tsx
    - src/components/dashboard/user-menu.tsx
    - src/components/dashboard/dashboard-stub-card.tsx
    - src/app/(dashboard)/dashboard/actions.ts
  affects:
    - Phase 5 dashboard grid builds on top of (dashboard) route group layout
    - Phase 4 may add /account route in same (dashboard) route group
tech_stack:
  added:
    - shadcn avatar (src/components/ui/avatar.tsx)
    - shadcn dropdown-menu (src/components/ui/dropdown-menu.tsx)
  patterns:
    - Server Component auth gate in layout.tsx via getUser() from DAL
    - 'use client' island isolation — DashboardNav (Server) wraps UserMenu (Client)
    - Logout as Server Action via form action={signOut} — JS-free fallback
    - React cache() deduplication — getUser() called in layout + page, single network request
key_files:
  created:
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - src/components/dashboard/dashboard-nav.tsx
    - src/components/dashboard/user-menu.tsx
    - src/components/dashboard/dashboard-stub-card.tsx
    - src/app/(dashboard)/dashboard/actions.ts
    - src/components/ui/avatar.tsx
    - src/components/ui/dropdown-menu.tsx
  modified: []
decisions:
  - "DashboardNav is a Server Component — UserMenu is the 'use client' island for dropdown interactivity; this keeps the nav tree server-rendered"
  - "Logout uses form action={signOut} not client-side router.push — works without JavaScript per plan spec"
  - "getUser() called twice (layout + page) — React cache() deduplication means single network round-trip"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-06"
  tasks_completed: 2
  tasks_total: 2
  files_created: 8
  files_modified: 0
---

# Phase 02 Plan 03: Dashboard Shell Summary

**One-liner:** Minimal authenticated dashboard shell with Server Component auth gate, DashboardNav + UserMenu Client island, logout Server Action, and editorial stub page using DAL-verified identity.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install shadcn avatar+dropdown-menu, signOut action, DashboardNav, UserMenu | d8e159e | ui/avatar.tsx, ui/dropdown-menu.tsx, actions.ts, dashboard-nav.tsx, user-menu.tsx |
| 2 | Dashboard layout (auth gate), dashboard page, stub card | f86d803 | layout.tsx, dashboard/page.tsx, dashboard-stub-card.tsx |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- Linter auto-adjusted `user-menu.tsx`: changed `<DropdownMenuItem asChild>` to `<DropdownMenuItem className="p-0">` with `<form className="w-full">` inside. This is semantically equivalent — the form wraps the button correctly. No behavior change.
- Test failures from 02-02 parallel executor's `login-form.tsx` changes (2 failing tests: `clears error when user types after an error` and `error message is linked to input via aria-describedby`) are out of scope for 02-03. These were introduced by the 02-02 parallel executor's modifications to `src/components/marketing/login-form.tsx` and `src/components/marketing/__tests__/login-form.test.tsx`. Logged to `deferred-items.md`.

## Verification Results

1. `npm run build` — exits 0, TypeScript compiles without errors, /dashboard renders as Dynamic (server-rendered)
2. `grep -c "'use client'" src/app/(dashboard)/layout.tsx` — 0 (Server Component confirmed)
3. `grep -c "getUser" src/app/(dashboard)/layout.tsx` — 2 (import + call)
4. `grep -c "redirect" src/app/(dashboard)/layout.tsx` — 2 (import + call)
5. `grep "getSession" src/app/(dashboard)/layout.tsx` — 0 results (never use getSession)
6. `grep -c "SEGERA HADIR" src/components/dashboard/dashboard-stub-card.tsx` — 1
7. `grep -c "Keluar" src/components/dashboard/user-menu.tsx` — 2 (button text + aria-label)
8. `grep -c "'use client'" src/components/dashboard/dashboard-nav.tsx` — 0 (Server Component)
9. `grep -c "'use client'" src/components/dashboard/user-menu.tsx` — 1 (Client island confirmed)
10. `grep -c "'use server'" src/app/(dashboard)/dashboard/actions.ts` — 1

## Threat Flags

None — all STRIDE mitigations from the plan's threat register were applied:
- T-02-10: getUser() from DAL in layout.tsx verifies JWT server-side; redirect('/login') on null
- T-02-11: signOut() calls supabase.auth.signOut() which invalidates server-side session
- T-02-12: Dashboard page only displays user.email (already known to user — no sensitive data)
- T-02-13: Double auth gate — proxy.ts runs updateSession, layout.tsx calls getUser() independently

## Known Stubs

- `src/app/(dashboard)/dashboard/page.tsx` — stub page is intentional per plan spec. Shows "SEGERA HADIR" card. Full dashboard content grid is Phase 5 scope. Stub communicates future promise via editorial card with dashed border, not empty state.
- `src/components/dashboard/dashboard-stub-card.tsx` — editorial placeholder card. Intentional stub; Phase 5 replaces with full resource grid.

## Self-Check: PASSED

Files verified:
- FOUND: src/app/(dashboard)/layout.tsx
- FOUND: src/app/(dashboard)/dashboard/page.tsx
- FOUND: src/components/dashboard/dashboard-nav.tsx
- FOUND: src/components/dashboard/user-menu.tsx
- FOUND: src/components/dashboard/dashboard-stub-card.tsx
- FOUND: src/app/(dashboard)/dashboard/actions.ts
- FOUND: src/components/ui/avatar.tsx
- FOUND: src/components/ui/dropdown-menu.tsx

Commits verified:
- FOUND: d8e159e (feat(02-03): install shadcn avatar+dropdown-menu, add signOut action, DashboardNav and UserMenu)
- FOUND: f86d803 (feat(02-03): add dashboard layout with auth gate, stub page, and DashboardStubCard)
