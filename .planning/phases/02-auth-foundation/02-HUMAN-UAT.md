---
status: partial
phase: 02-auth-foundation
source: [02-VERIFICATION.md]
started: 2026-05-06T00:00:00Z
updated: 2026-05-06T00:00:00Z
---

## Current Test

[awaiting human testing — requires live Supabase project with env vars configured]

## Prerequisite: Supabase Setup

Before these tests can run, complete the following in the Supabase dashboard:

1. Create a Supabase project at supabase.com
2. Copy `.env.local.example` to `.env.local` and fill in real values
3. Auth → Email Templates → Magic Link → set URL to:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
4. Auth → Configuration → OTP Expiry → set to `86400`
5. Authentication → URL Configuration → add `http://localhost:3000` to Redirect URLs

## Tests

### 1. Full magic-link login flow end-to-end
expected: Enter a registered email on /login → see "Cek email kamu" success state → receive email → click link → land on /dashboard as authenticated user.
result: [pending]

### 2. Session continuity across new tab and hard refresh (AUTH-03)
expected: After logging in, open a new tab to /dashboard — session persists. Press Cmd+Shift+R (hard refresh) on /dashboard — session persists. No re-login required.
result: [pending]

### 3. Logout invalidates session (AUTH-04)
expected: Click "Keluar" in DashboardNav dropdown → redirected to / → attempting to visit /dashboard redirects back to /login.
result: [pending]

### 4. Link-expired error state renders correctly
expected: Visit /login?error=link-expired → inline red alert appears below login card heading with text "Link kamu sudah kedaluwarsa." and "Minta link baru di bawah." — input form still usable to request a new link.
result: [pending]

### 5. Unauthenticated /dashboard redirects to /login (auth gate)
expected: Open incognito browser → visit http://localhost:3000/dashboard → immediately redirected to /login (no flash of dashboard content).
result: [pending]

### 6. Unregistered email shows identical success state (user enumeration prevention, AUTH-01)
expected: Enter an email address that has no Supabase account → see the same "Cek email kamu" success state as a registered email. No "Email tidak ditemukan" or different response.
result: [pending]

### 7. Expired/invalid token redirects to /login?error=link-expired
expected: Click a magic link with an expired or tampered token_hash → redirected to /login?error=link-expired → inline error alert appears.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
