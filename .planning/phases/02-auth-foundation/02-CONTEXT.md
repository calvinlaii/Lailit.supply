---
phase: 02-auth-foundation
created: 2026-05-06
status: ready
---

# Phase 2: Auth Foundation — Context

## What This Phase Must Deliver

Magic-link auth fully operational via Supabase + `@supabase/ssr`, the DAL pattern enforced, `proxy.ts` protecting authenticated routes, and session continuity across refresh/tabs. Establishes the security primitives Phase 4 webhooks will call into.

**Requirements in scope:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, GATE-05, EMAIL-02, EMAIL-03

---

## Decisions

### 1. Unknown Email Handling (AUTH-01)
**Decision:** Generic success — always show "Cek email kamu" regardless of whether the email exists.

- `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })` silently swallows no-user-found; the client can't tell the difference between "link sent" and "user doesn't exist"
- Never reveal whether an email address is in the system (prevents user enumeration attacks)
- UI shows the same "Kami sudah kirim link masuk ke email kamu. Cek folder spam juga ya." confirmation for all valid email submissions
- Only show a real error for invalid email format (client-side validation already in Phase 1 LoginForm)

### 2. Post-Login Redirect (AUTH-02)
**Decision:** Always redirect to `/dashboard` after magic link confirmation.

- `/auth/confirm` route handler calls `verifyOtp()` → on success, redirects to `/dashboard`
- No membership tier check at this stage — Phase 5 adds the paywall. Phase 2's job is to verify auth works end-to-end.
- On error (expired token, invalid hash), redirect to `/login?error=link-expired` with an inline error message on the login page

### 3. Dashboard Shell (AUTH-04)
**Decision:** Minimal authenticated stub — enough to verify auth end-to-end, not a full layout build.

Layout:
- Dedicated `(dashboard)` route group with its own layout
- `DashboardNav`: logo, user email from DAL, avatar initial, dropdown with "Keluar" (logout)
- Page body: heading "Dashboard", subtext "Selamat datang, {email}. Komponen segera hadir.", a subtle placeholder card
- Logout: Server Action calling `supabase.auth.signOut()` → redirect to `/`
- Full dashboard content is Phase 5 scope

### 4. Magic Link Email Template (EMAIL-02, EMAIL-03)
**Decision:** Use Supabase's default email template for the re-login flow.

- Supabase sends the OTP email through its built-in SMTP — no Resend in Phase 2
- Supabase email template must point to: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
- OTP expiry configured to 86400s (24 hours) in Supabase Auth settings
- Custom Resend React Email templates are Phase 4 scope (post-payment welcome email)

### 5. No Drizzle in Phase 2
**Decision:** Defer Drizzle ORM to Phase 4.

- Phase 2 needs zero custom DB queries — Supabase Auth handles everything
- Installing Drizzle now without a schema to migrate against is premature
- Phase 4 introduces `webhook_events`, `memberships` tables — add Drizzle then

---

## Architecture Constraints (from STACK.md + AGENTS.md)

### Files to Create
```
src/lib/supabase/
  client.ts       # createBrowserClient — use in 'use client' components only
  server.ts       # createServerClient — use in Server Components, Server Actions, Route Handlers
  admin.ts        # createClient with service-role key — webhook handlers only (Phase 4)
  middleware.ts   # token refresh helper called from proxy.ts
src/lib/dal.ts    # getUser() wrapped in React cache() — the ONLY way to get identity server-side
proxy.ts          # NOT middleware.ts — Next.js 16 rename
src/app/auth/confirm/route.ts           # GET handler: verifyOtp → redirect
src/app/(dashboard)/layout.tsx          # Dashboard route group layout
src/app/(dashboard)/dashboard/page.tsx  # Minimal authenticated stub
src/components/dashboard/dashboard-nav.tsx  # TopNav for authenticated area
```

### Critical Rules (non-negotiable)
1. **`proxy.ts` not `middleware.ts`** — Next.js 16 renamed it; wrong name = proxy never runs
2. **`await cookies()`** — cookies(), headers(), params are ALL async in Next.js 16
3. **`getUser()` never `getSession()`** — getSession() reads cookies without verifying JWT signature; always use getUser() for authorization decisions
4. **Never module-scope Supabase client** — instantiate per-request in Server Components and Route Handlers (Vercel Fluid compute leaks sessions across requests otherwise)
5. **Service-role key is server-only** — `SUPABASE_SERVICE_ROLE_KEY` has NO `NEXT_PUBLIC_` prefix; admin.ts must be `server-only`
6. **DAL is `server-only`** — `src/lib/dal.ts` imports `server-only` package at top to prevent client-side use

### Environment Variables Needed
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx  # publishable key, not legacy anon
SUPABASE_SERVICE_ROLE_KEY=eyJ...                         # never NEXT_PUBLIC_, server-only
NEXT_PUBLIC_SITE_URL=https://lailit.supply               # used in emailRedirectTo
```

### Supabase Project Config (manual steps before code)
1. Create Supabase project (if not yet done)
2. Auth → Email Templates → Magic Link → set to: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
3. Auth → Configuration → OTP Expiry → set to `86400` (24 hours)
4. Authentication → URL Configuration → add `http://localhost:3000` to Redirect URLs

---

## Two Magic Link Flows (Phase 2 implements #2 only)

**Flow 1 — Post-payment (Phase 4):**
- Mayar webhook fires → admin `generateLink()` with service-role → embed in Resend email → same `/auth/confirm` handler
- NOT in Phase 2

**Flow 2 — Existing user re-login (Phase 2):**
- User enters email on `/login` (LoginForm from Phase 1)
- Server Action: `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/auth/confirm' } })`
- Supabase sends default magic link email
- User clicks → `/auth/confirm?token_hash=...&type=email` → `verifyOtp()` → redirect to `/dashboard`

---

## proxy.ts Route Protection

Routes to protect:
- `/dashboard` and all `/dashboard/*` — redirect unauthenticated to `/login`
- `/account` — reserved for Phase 4 but protect now

Matcher:
```ts
export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*'],
}
```

Token refresh runs on ALL routes (not just protected ones) so sessions stay fresh.

---

## LoginForm Integration (Phase 1 artifact)

`src/components/marketing/login-form.tsx` already exists with:
- Email validation (Indonesian error: "Masukkan email kamu dulu.")
- No-op submit (Phase 1 stub)

Phase 2 wires the form to a Server Action. The component stays `'use client'`; the Server Action lives in `src/app/(marketing)/login/actions.ts`.

---

## What's NOT in Phase 2

- Custom Resend email templates (Phase 4)
- Membership/tier database schema (Phase 4)
- Dashboard content grid (Phase 5)
- Account page (Phase 4)
- Drizzle ORM (Phase 4)
- Row Level Security policies (Phase 4 — after memberships table exists)

---

## Prior Phase Carry-Forward

- Phase 1 installed shadcn/ui v4 (base-nova style, @base-ui/react) — confirmed working; Phase 2 continues on this
- `src/lib/utils.ts` (`cn` helper) already exists from Phase 1
- shadcn components available: button, input, label, badge, card, sheet
- Vitest already configured — Phase 2 should add auth-related unit tests
