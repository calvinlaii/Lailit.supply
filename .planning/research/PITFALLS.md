# Pitfalls Research

**Domain:** Subscription-based component library SaaS (Indonesian/SEA market) — Next.js 15 App Router + Supabase + Mayar.id
**Researched:** 2026-05-05
**Confidence:** HIGH (Next.js docs, Supabase docs, verified webhook patterns) / MEDIUM (Mayar.id-specific behavior — under-documented, must verify in implementation)

---

## Critical Pitfalls

### Pitfall 1: Mayar.id webhooks have NO documented signature verification

**What goes wrong:**
Mayar's official webhook docs (https://docs.mayar.id/integration/webhook) describe payload shape but document no HMAC signature, no `X-Signature` header, no shared secret, and no IP allowlist. This means a public `/api/webhooks/mayar` endpoint can be POSTed to by anyone — an attacker can fabricate `payment.received` events to grant themselves premium access for free.

**Why it happens:**
Developers copy a Stripe-style webhook implementation (`stripe.webhooks.constructEvent(...)`) and assume the same primitives exist. With Mayar, they don't. The team trusts the payload because it "comes from Mayar's IP."

**How to avoid:**
Layered defense, applied in order:
1. **Token-in-URL pattern:** Configure Mayar's webhook URL with a long-lived secret in the path itself: `/api/webhooks/mayar/[secret]`. Reject any request where `[secret] !== process.env.MAYAR_WEBHOOK_SECRET`. The secret never travels in headers an attacker could guess.
2. **Cross-verify with Mayar API:** On every webhook, call Mayar's "Get Transaction" API with the `data.id` from the payload and compare `status` and `amount`. If they don't match, reject. This makes forgery require API credentials, not just the URL.
3. **Source IP allowlist (defense-in-depth):** If Mayar publishes webhook source IPs (request from support), pin them in middleware. Don't make this the only check — IPs can change without notice.
4. **Treat the body as untrusted until cross-verified.** Never grant access purely on what the webhook says.

**Warning signs:**
- A test request with curl + a hand-crafted JSON body succeeds in granting premium access.
- The webhook handler grants access before any Mayar API call.
- Logs show webhook events from IPs you don't recognize.

**Phase to address:**
Phase 3 (Payments & Webhooks). This is the single highest-priority security item for the project. Verify with a deliberate "forge a payment" pen-test before going live.

---

### Pitfall 2: Duplicate webhook processing creates ghost subscriptions and double credits

**What goes wrong:**
Mayar (like every webhook provider) may retry a delivery if your endpoint times out, returns 5xx, or if the connection drops mid-response. If your handler processes the same `data.id` twice, you can end up with: two membership rows, two welcome emails sent, expiry pushed forward by two billing cycles, or — worst — two charges considered for the same payment.

**Why it happens:**
The handler does `INSERT INTO memberships (...)` instead of an idempotent upsert. Or it sends the magic-link email *before* persisting the dedup row, so a retry re-sends.

**How to avoid:**
1. **`webhook_events` ledger table** with `mayar_event_id TEXT PRIMARY KEY` (use `data.id`). Insert this row first inside the same transaction as the business logic. `INSERT ... ON CONFLICT (mayar_event_id) DO NOTHING RETURNING id` — if no row returned, you've already processed this event; return 200 immediately without re-running side effects.
2. **All side effects (email, access grant) happen AFTER the dedup INSERT commits.** Never email before persisting.
3. **Return 200 quickly even on duplicate** so Mayar stops retrying.
4. Use `upsert` with `ON CONFLICT` for membership state changes too — the ledger guards once, the membership row guards twice.

**Warning signs:**
- Two welcome emails arrive for one payment.
- `memberships.expires_at` jumps by 2 months instead of 1 after a single renewal.
- `webhook_events` table has duplicate event IDs (impossible if PK is set correctly — if you see this, the column isn't unique).

**Phase to address:**
Phase 3 (Payments & Webhooks). Test by manually replaying a webhook payload from the Mayar dashboard's "Retry" feature.

---

### Pitfall 3: Race conditions between concurrent webhooks for the same user

**What goes wrong:**
A user pays, then immediately upgrades tier. Mayar fires `payment.received` and `membership.changeTierMemberRegistered` within milliseconds. Both webhook handlers run concurrently on Vercel serverless (different cold instances). Both read the user row, both write — last write wins, and the user's tier is whichever handler finished last, not whichever event happened last.

**Why it happens:**
Webhook delivery order is not guaranteed. Serverless concurrency means handlers run in parallel without shared memory locks. Naive read-modify-write loses the race.

**How to avoid:**
1. **Use `SELECT ... FOR UPDATE`** inside a transaction when reading membership state to mutate. Postgres serializes the writers.
2. **Always include `event_received_at` (timestamp from payload) in the comparison** before applying state. Reject the update if the incoming event is older than the row's `last_event_at` — out-of-order delivery becomes a no-op instead of a regression.
3. **Use a single writer pattern:** queue webhooks into a job table, process them serially per user. Heavier but bulletproof. Optional for MVP.
4. **Avoid optimistic UI in this flow** — the user's tier is whatever the latest authoritative webhook says, period.

**Warning signs:**
- User reports "I upgraded to lifetime but my dashboard says monthly."
- Logs show two webhooks for the same user within 1 second.
- `memberships.tier` value contradicts `memberships.last_event_at` event type.

**Phase to address:**
Phase 3 (Payments & Webhooks). Trigger by manually firing two events in rapid succession via Mayar's test feature.

---

### Pitfall 4: Webhook arrives before the user record exists (DB transaction ordering)

**What goes wrong:**
The webhook handler tries to attach a membership to a user, but the user row hasn't been created yet (or the email lookup misses because Mayar's `customerEmail` is normalized differently than what's in Supabase). The handler silently fails or creates a partial row, leaving the user paid but locked out.

**Why it happens:**
The architecture is "pay → webhook → create user." So the webhook IS the user-creation event. But code is often written assuming the user already exists, then bolted onto the webhook later. Edge cases: same email signed up to free tier earlier, casing differences, trailing whitespace, plus-aliasing.

**How to avoid:**
1. **The webhook is the source-of-truth for user creation.** Use `auth.admin.createUser({ email, email_confirm: true })` in the handler, then trigger the magic link send. If the user already exists (free-tier signup), upsert their `memberships` row and trigger a "your account is now premium" magic link.
2. **Normalize email aggressively:** lowercase, trim, strip dots from gmail addresses (or don't — but be consistent). Store both `email` and `email_normalized` columns.
3. **Wrap user creation + membership insert in a single transaction.** If membership insert fails, user creation rolls back. Avoid partial state.
4. **If user creation fails (e.g. already exists), the handler must still succeed and update the existing user.** Don't return 4xx — Mayar will retry forever.

**Warning signs:**
- "Paid but can't log in" support tickets.
- Users with NULL membership rows.
- Auth users with no membership row at all.

**Phase to address:**
Phase 3 (Payments & Webhooks). Test the four scenarios: brand-new user, existing free-tier user, user with capitalized email, user with `+tag` alias.

---

### Pitfall 5: Trusting `supabase.auth.getSession()` on the server

**What goes wrong:**
Server Components, Route Handlers, and `proxy.ts` call `supabase.auth.getSession()` and use `session.user.id` to gate premium content. **This is spoofable.** Supabase's official guidance: `getSession()` reads directly from the cookie and the cookie can be tampered with. An attacker swaps in a victim's `user.id` and accesses their premium content.

**Why it happens:**
Tutorials older than ~2024 use `getSession()` everywhere. AI-generated code copies this pattern. The Supabase JS console even warns about this on the server now, but the warning is easy to ignore.

**How to avoid:**
1. **Always `supabase.auth.getUser()` on the server** — it round-trips to Supabase Auth to verify the JWT. It costs an extra request, but it's the only secure option.
2. **Never trust `session.user`** on the server, even after `getUser()` — use the `user` object that `getUser()` returns directly.
3. **Centralize in a DAL** (Data Access Layer): a single `verifySession()` function wrapped in React's `cache()` that calls `getUser()` once per render pass. Documented in Next.js auth guide.
4. In `proxy.ts` (formerly `middleware.ts`), still call `getUser()` — but treat it as "optimistic" check. Real authorization happens at the data fetch layer.

**Warning signs:**
- Code references `session.user.id` in a Server Component.
- No `supabase.auth.getUser()` call in any server-side code path that returns paid content.
- `proxy.ts` only checks cookie presence, not validity.

**Phase to address:**
Phase 2 (Auth foundation). Bake the DAL pattern in from the first dashboard route.

---

### Pitfall 6: Next.js 15.5+ uses `proxy.ts`, not `middleware.ts`

**What goes wrong:**
You scaffold `middleware.ts` in the project root following old Stack Overflow answers. It runs and matches routes, but starting in Next.js 16 (with deprecation warnings in 15.5), the file convention is `proxy.ts`. Mixing both, or naming it wrong, results in either silent failure or build-time deprecation warnings that break CI.

**Why it happens:**
The rename happened in the 15→16 transition. Training data and most tutorials still say "middleware." The project's `AGENTS.md` already warns: "This is NOT the Next.js you know."

**How to avoid:**
1. **Use `proxy.ts` at the project root.** Export `proxy` (named) or default. Same matcher syntax.
2. Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` before writing.
3. **Don't run business logic in proxy** — Vercel docs note proxy may be deployed to CDN edges and "should not attempt relying on shared modules or globals." Use it for redirects/rewrites/optimistic auth only.
4. **Pair `proxy.ts` with route-level `getUser()` checks** — proxy isn't a security boundary on its own.

**Warning signs:**
- Build warnings about deprecated `middleware` convention.
- Auth gates that work locally but fail in production (proxy didn't pick up).
- Two files: `middleware.ts` AND `proxy.ts` (only one runs, behavior depends on Next.js version).

**Phase to address:**
Phase 2 (Auth foundation). Set the file naming and matcher correctly from day one.

---

### Pitfall 7: Client-side-only access gating leaks paid content via API

**What goes wrong:**
The dashboard hides premium resource cards with `{user.tier === 'premium' && <Card />}`. But the resource detail page fetches from `/api/resources/[slug]` which has no auth check — the URL is guessable from the slug, and free users (or anyone) can hit the API directly to read premium MDX content, video URLs, and code snippets.

**Why it happens:**
Hiding UI feels like "access control." It's actually obfuscation. The data layer is the real boundary.

**How to avoid:**
1. **Authorization at the data layer, not the UI layer.** Every Route Handler returning premium data starts with `const session = await verifySession(); if (!session.isPremium) return new Response(null, { status: 403 })`.
2. **Premium MDX content is NOT bundled into the public client JS.** Render it server-side only, then send the HTML — never ship the raw MDX source to non-paying users.
3. **Code blocks: render to HTML with Shiki on the server, gate the resulting HTML behind auth.** Don't ship the code as a JSON response that any logged-out user can fetch.
4. **Test with curl, not the browser.** A logged-out curl to `/api/resources/premium-thing` must return 403, not the content.

**Warning signs:**
- A logged-out browser tab can `fetch('/api/resources/[slug]')` and get JSON content back.
- Network tab shows premium MDX content downloaded before auth check.
- The `pages source` view of a premium page shows the actual code in the HTML for non-members.

**Phase to address:**
Phase 4 (Paywalled content delivery). Add a `pen-test-data-leak.md` checklist as part of phase exit criteria.

---

### Pitfall 8: Lifetime users break "is membership active?" checks

**What goes wrong:**
Standard membership check: `membership.status === 'active' && membership.expires_at > NOW()`. Lifetime users have `expires_at = NULL` (or a sentinel like `2099-12-31`). The first check fails → lifetime users get locked out the moment the schema is correct.

**Why it happens:**
The "active monthly subscriber" model is designed first; lifetime is bolted on later as an edge case. The query gets written without considering NULL semantics in Postgres (`NULL > NOW()` returns `NULL`, which is falsy).

**How to avoid:**
1. **Model lifetime explicitly.** Add `tier ENUM('free', 'monthly', 'lifetime')`. Access check: `tier IN ('monthly', 'lifetime') AND (tier = 'lifetime' OR expires_at > NOW())`.
2. **Single helper function `hasAccessTo(userId, resourceId)`** — never inline access logic. Easier to fix once when wrong.
3. **Test matrix:** free user, expired monthly, active monthly, lifetime, canceled-but-not-yet-expired. Every access path must pass all five.
4. **Migration plan when tiers change** (e.g. adding annual): the helper is the only place that changes.

**Warning signs:**
- A lifetime user complains their access was revoked.
- The access query has `expires_at IS NOT NULL AND expires_at > NOW()` (the `IS NOT NULL` clause is a smell).
- No test covering the lifetime-tier path.

**Phase to address:**
Phase 3 (Payments & Webhooks) when the tier model is designed; verify in Phase 4 (content gating).

---

### Pitfall 9: Cancellation immediately revokes access (instead of at expiry)

**What goes wrong:**
User clicks "Cancel" in Mayar Customer Portal. Mayar fires `membership.memberUnsubscribed`. Handler sets `membership.status = 'canceled'`. Access check rejects them immediately. User paid through end-of-month and is locked out on day 5. Refund request, chargeback, bad review.

**Why it happens:**
Naive "canceled = no access" mapping. The semantics from the user's POV are different: cancel = "don't auto-renew," not "revoke now."

**How to avoid:**
1. **Three states are distinct:** `status` (active | canceled | expired) and `expires_at` (timestamp). Access requires `(status = 'active' OR (status = 'canceled' AND expires_at > NOW())) AND expires_at > NOW()`.
2. **`memberUnsubscribed` webhook does NOT change `expires_at`.** Only `memberExpired` does.
3. **UI: show "Your access expires on May 31" after cancellation, not "Access revoked."**
4. **Send a "We're sorry to see you go" email at cancel time + a "Your access ends today" reminder 3 days before expiry.** Win-back attempt at the right moment.

**Warning signs:**
- A `canceled` user can't access content even though `expires_at` is in the future.
- Users churning and immediately requesting refunds.
- No `memberExpired` event handler, only `memberUnsubscribed`.

**Phase to address:**
Phase 3 (Payments & Webhooks). Test the full lifecycle: subscribe → cancel mid-cycle → verify access until expiry → verify lockout after expiry.

---

### Pitfall 10: Magic link tokens expire in 1 hour by default — too short for casual users

**What goes wrong:**
User pays at 10pm, Mayar webhook sends magic link, user is busy and checks email at 1am. Link is dead. Now they need to manually request a new one — but they don't even have a password to fall back on. Silent churn before they ever logged in.

**Why it happens:**
Supabase default for `Email OTP Expiration` is 3600 seconds. Reasonable for security-paranoid B2B apps, too short for paid consumer flows.

**How to avoid:**
1. **Bump to 24 hours (86400s)** in Supabase Auth settings → Email Provider. Supabase caps this at 86400. Document the security tradeoff in `Key Decisions`.
2. **The link is one-time use** — even with a long expiry, it can only be redeemed once. The risk surface is "someone else read the user's email AND clicked first within 24h," which is comparable to most magic-link products.
3. **Friendly expiry page** at `/auth/expired` with a "Send me a new link" form — never dead-end.
4. **Send the magic link immediately on payment, plus a 30-min reminder email if not yet redeemed.** Reduces the cliff.

**Warning signs:**
- "Link expired" support tickets within 24h of payment.
- Users with payment record but no `last_sign_in_at` after 48h.
- Multiple magic-link requests from same email within an hour (frustration signal).

**Phase to address:**
Phase 2 (Auth foundation). Decide expiry once, document in `Key Decisions`.

---

### Pitfall 11: Vercel Fluid compute reuses Supabase clients across users

**What goes wrong:**
You instantiate `const supabase = createServerClient(...)` at module scope (top of file, outside the handler). Vercel's Fluid compute keeps the function instance warm and serves multiple users from the same instance. The Supabase client (initialized with the *first* user's cookies) is reused — User B's request reads User A's session. Massive auth bypass.

**Why it happens:**
JavaScript devs idiomatically pull setup out of the request handler for "performance." It works on traditional servers (one request at a time per process). It's catastrophic in serverless-with-warm-instances.

**How to avoid:**
1. **Always create the Supabase client INSIDE the request handler / Server Component / Server Action.** Never at module scope.
2. **Follow the official `@supabase/ssr` pattern exactly:** factory function `createClient()` is called per-request and reads `cookies()` from `next/headers`.
3. **Lint rule (custom):** flag `createServerClient` calls outside function scope.
4. **Test in production-like environment** (Vercel preview deploys), not just `next dev` which doesn't show this.

**Warning signs:**
- `createServerClient(...)` at the top of a file outside any function.
- A constant `supabase` exported from a module.
- Two users see each other's data, randomly, hard-to-reproduce.

**Phase to address:**
Phase 2 (Auth foundation). Lock down the pattern in the first auth helper file.

---

## Moderate Pitfalls

### Pitfall 12: MDX with all 5 code formats inlined balloons the bundle

**What goes wrong:**
Every resource ships with Framer + Webflow + HTML + JSX + TSX code blocks. Naively imported, all five strings become part of the client bundle for every resource page. Dashboard listing 100 resources → multi-MB JS download.

**How to avoid:**
- Render code blocks server-side with `rehype-pretty-code` + Shiki at build/request time. Ship pre-highlighted HTML, not the raw source plus a runtime highlighter.
- Use `next/dynamic` for the format-tab switcher; only the active format's HTML is in the DOM.
- Code-split by resource — each resource page is its own chunk via App Router file-based routing.

**Phase to address:** Phase 4 (Content delivery).

---

### Pitfall 13: No syntax highlighting on a code-heavy product feels broken

**What goes wrong:**
Plain `<pre><code>` with no highlighting on a *developer* component library product. Users compare to Osmo/Tailwind UI/etc and judge instantly.

**How to avoid:**
- Shiki via `rehype-pretty-code` at build time.
- Pin `vscode-textmate >= 9.3.1` (older versions break in Next.js 15+).
- Test with Turbopack (default in Next.js 16) — some rehype plugins don't accept function options through Turbopack's Rust serialization. Verify before committing.

**Phase to address:** Phase 4 (Content delivery).

---

### Pitfall 14: Search index doesn't refresh when MDX content updates

**What goes wrong:**
Cmd-K fuzzy search uses a precomputed index built at deploy time. Admin adds a new MDX file, deploys, but search misses it because the index build script ran before the MDX was added (or wasn't re-run).

**How to avoid:**
- Build the search index in `getStaticProps`-equivalent (Server Component data fetching) at request time with `revalidate: 3600`, or
- Run index build as part of the build script (`postbuild`), and verify it picks up all `*.mdx` files.
- Smoke test: every new MDX gets a 1-line check in CI: "search for the new title returns the new page."

**Phase to address:** Phase 5 (Search).

---

### Pitfall 15: Video previews block dashboard load

**What goes wrong:**
Each resource card has a `<video autoplay loop muted>` of a 2-5MB MP4. 30 cards on the dashboard = 60-150MB downloaded before LCP. Indonesian mobile networks (the target market!) hit this hardest — users abandon before page renders.

**How to avoke:**
- Show static AVIF poster image first; lazy-load video on hover (desktop) or in-viewport intersection (mobile).
- Use `<video preload="none" poster="...">` — explicitly opt out of pre-fetching.
- Limit preview videos to <500KB each (heavily compressed, 5-second loops). MP4 H.264 is universally supported; AV1 is smaller but breaks on iOS.
- Defer loading any video below the fold via Intersection Observer.

**Phase to address:** Phase 4 (Content delivery / dashboard performance).

---

### Pitfall 16: Resource grid loads all 200 resources at once

**What goes wrong:**
Initial dashboard query: `SELECT * FROM resources` → returns 200 rows → 200 cards rendered → 200 video previews → death.

**How to avoid:**
- Paginate or virtualize from day one. `LIMIT 24 OFFSET ?` + cursor pagination, or use `react-virtuoso` for windowed rendering.
- Even at 100 resources, prefer virtualization — DOM size affects scroll performance on mid-range Android.

**Phase to address:** Phase 4 (Dashboard).

---

### Pitfall 17: Forgetting to send your own confirmation email

**What goes wrong:**
Mayar sends a "payment received" email automatically. Developer assumes that's the entire confirmation. But it doesn't say "your magic link is in another email" — user confused, support ticket.

**How to avoid:**
- Send your own branded "Welcome to lailit.supply — here's your magic link" email immediately after webhook processing, via Resend.
- Don't rely on Mayar's email content for product onboarding messaging.
- Single email containing magic link + "what to do next" — fewer emails, less confusion.

**Phase to address:** Phase 3 (Payments) / Phase 6 (Onboarding email).

---

### Pitfall 18: ISR / CDN caching leaks one user's session to another

**What goes wrong:**
A page with `export const revalidate = 60` (or any static caching) is rendered with User A's `Set-Cookie` in the response. CDN caches the response. User B hits the same URL and receives User A's auth cookie.

**How to avoid:**
- **`export const dynamic = 'force-dynamic'`** on every authenticated page. No exceptions.
- Public landing/marketing pages can be static; anything that reads the auth cookie cannot.
- Lint/grep CI rule: any file that imports `cookies` from `next/headers` must declare `dynamic = 'force-dynamic'`.

**Phase to address:** Phase 2 (Auth foundation).

---

## Minor Pitfalls

### Pitfall 19: Too-short layouts cache user data

In App Router, `app/(dashboard)/layout.tsx` doesn't re-render on client-side navigation. If you fetch `getUser()` in the layout and use the result in nested pages, the data goes stale. Fix: fetch user data in pages and leaf components, not layouts (per Next.js auth guide).

### Pitfall 20: `cookies()` not awaited

Next.js 15.3+: `cookies()` returns a Promise. Old code `cookies().get(...)` silently returns `undefined` for `.get()`. Must `(await cookies()).get(...)`. Build errors are loud; runtime silence is dangerous. TypeScript helps if `strict: true`.

### Pitfall 21: Env vars accidentally shipped to client

`NEXT_PUBLIC_*` is shipped to the browser. `MAYAR_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` must NOT have that prefix. A misnamed env var leaks the keys to the kingdom.

### Pitfall 22: Discord invite link rotation

Discord invite links can be set to expire or be revoked. Hardcoding `discord.gg/xyz` in MDX means a future revocation breaks it everywhere. Centralize in env var or a single config file.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip webhook idempotency in MVP "we'll add it before launch" | Ship payment flow 2 days faster | Double-charges, ghost subscriptions, lost trust | NEVER. Cheaper to build it on day one. |
| Use `getSession()` instead of `getUser()` "for performance" | Avoids extra HTTP round-trip per request | Auth bypass via cookie spoofing | NEVER on the server. Client-side `getSession()` is fine. |
| Skip rendering MDX server-side; hydrate on client | Simpler initial setup | Bundle bloat, paid content leaks to client | MVP only if all content is free. Refactor before paid tier ships. |
| Hardcode tier checks inline (`if (tier === 'monthly')`) | Easy to write | Adding annual/lifetime touches every file | MVP if only free + lifetime. Refactor once 3rd tier appears. |
| No grace period for failed payments | Simpler logic | High involuntary churn from expired cards | MVP-only, but document and revisit by month 2. |
| Skip search index in MVP, use SQL ILIKE | 1 day saved | Slow on 100+ resources, no fuzzy matching | OK if launching with <30 resources. |
| Single Mayar account for testing + production | Faster setup | Real-money mistakes during dev | NEVER. Use Mayar's sandbox or separate test account from day one. |
| Inline component preview videos as `<video src="...">` | Trivially simple | Multi-MB load on dashboard | NEVER for the dashboard grid. OK on detail pages. |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Mayar.id | Trusting webhook payload directly | Cross-verify via Mayar API on every event |
| Mayar.id | Assuming HMAC signature header exists | Use URL-secret pattern; signature is not provided |
| Mayar.id | Not handling `membership.changeTierMemberRegistered` | Treat tier changes as first-class event, not a payment.received variant |
| Mayar.id | Not handling `payment.reminder` (29-min nudge) | Optional, but a UX win — show "complete your payment" banner |
| Supabase | Using deprecated `@supabase/auth-helpers-nextjs` | Use `@supabase/ssr` (auth-helpers is end-of-life) |
| Supabase | `createServerClient` at module scope | Always inside the request handler / RSC |
| Supabase | `getSession()` on server | `getUser()` on server, always |
| Supabase | Magic link redirect URL not whitelisted | Add prod and preview URLs to `Auth → URL Configuration → Redirect URLs` BEFORE first deploy |
| Supabase | RLS off "to debug faster" | RLS on from day one; service-role key for legit admin paths |
| Resend | Magic link email landing in spam | Set up SPF, DKIM, DMARC; use a custom domain (not gmail.com) for `from:` |
| Resend | No "from" domain verification | Verify domain BEFORE first send; unverified domains get aggressive spam-flagged |
| Vercel | Webhook timeouts (10s on Hobby) | Long-running webhook work → respond 200 fast, queue background processing |
| Vercel | Edge runtime can't talk to Supabase service-role | Webhook handler in Node.js runtime (`export const runtime = 'nodejs'`) |
| Discord | Revoked invite link | Single source of truth (env or config), monitor invite health |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `SELECT *` on resources without LIMIT | Slow dashboard, high egress cost | Cursor pagination, projection (only needed columns) | 100+ resources |
| All preview videos autoplay | Dashboard LCP > 4s on 4G | Poster image + on-hover/in-view video load | 20+ cards visible at once |
| Build-time MDX → SSG with no incremental | 5min+ deploy times | App Router with `revalidate` or on-demand revalidation | 50+ MDX files |
| Shiki highlighting at runtime on client | Flash of unstyled code, large JS payload | Build-time / request-time server highlighting | Any code-heavy page |
| Webhook handler does sync email send | Vercel timeout on slow Resend response, Mayar retries | Queue email, return 200 first | Any flaky downstream service |
| Bookmark/save state via fetch on every card | Dashboard makes 30+ API calls per render | Batch fetch user's bookmarks once, hydrate from local state | 20+ cards |
| `getUser()` called in 5 places per render | 5x latency to Supabase Auth per page | Wrap in React `cache()` — single request per render | Always (free fix) |
| Image optimization disabled `unoptimized={true}` | 5MB AVIF served raw to mobile | Use `next/image` properly, accept Vercel's image cost | Any page with thumbnails |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public webhook endpoint with no auth | Attacker grants self premium access | URL-secret pattern + Mayar API cross-verification (mandatory) |
| `getSession()` on server for auth checks | Cookie spoofing → access another user's data | Always `getUser()` on server |
| Premium MDX content in client bundle | Free user inspects bundle, gets premium content | Server-render MDX, gate HTML at API level |
| Service-role Supabase key in `NEXT_PUBLIC_*` | Total DB compromise | Strict env naming convention + CI check |
| RLS disabled on `resources` table | Direct PostgREST access reads premium content | RLS on, with `auth.jwt() ->> 'tier'` policies |
| Webhook handler logs full payload | Customer email/PII in log retention | Log `data.id` only; redact PII |
| Magic link URL contains user ID in plain query | URL leaked via referer → account takeover | Use Supabase's PKCE flow (default in `@supabase/ssr`) |
| No CSRF protection on Server Actions | Cross-origin form submission alters user state | Next.js 15 default Server Action protection ON; verify `Origin` header in custom routes |
| API routes return full user object | Email, phone, billing exposed | Use DTO pattern — return only what UI needs |
| Discord invite shared on public landing without rate limit | Spam bots flood server | Gate Discord invite behind member dashboard, rotate periodically |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Access revoked" wording on cancellation | Refund requests | "Access continues until [date]" |
| Magic link expired with no recovery flow | Support ticket / silent churn | `/auth/expired` page with "Resend" button |
| No copy-to-clipboard feedback | User unsure if click registered | Toast + button state change for 1.5s |
| Video preview autoplays with sound | Hostile experience | `muted` attribute mandatory |
| Cmd-K not discoverable | Most users miss search | Hint badge near top of dashboard, focus trap on `/` |
| No "save for later" — bookmarks stored only in-memory | Lost on refresh | Persist bookmarks to DB, sync across devices |
| Premium-only badge invisible on free users | Confusion about what's locked | Lock icon visible to all; "Upgrade" CTA for non-members |
| Dashboard empty for free users | Looks broken | Show free-tier resources prominently, lock icon on premium |
| All resources lumped together | Hard to find anything | Category filters + tag filters + search |
| No "what's new" section | Returning users don't see updates | "Recently added" rail above main grid |

---

## "Looks Done But Isn't" Checklist

- [ ] **Webhook handler:** Often missing idempotency — verify a replayed payload from Mayar dashboard does NOT create duplicates.
- [ ] **Webhook handler:** Often missing cross-verification — verify a hand-crafted curl POST to the endpoint does NOT grant premium.
- [ ] **Webhook handler:** Often missing async work — verify processing completes within 5s (well under Vercel's 10s Hobby limit).
- [ ] **Auth check:** Often using `getSession()` — grep for `getSession` in any file under `app/` and replace with `getUser`.
- [ ] **Auth check:** Often missing on Route Handlers — every `route.ts` returning user-specific data must call `verifySession()`.
- [ ] **Premium content delivery:** Often gates UI but not API — curl-test every premium resource API while logged out (must be 403).
- [ ] **Cancellation flow:** Often revokes immediately — verify a canceled user retains access until `expires_at`.
- [ ] **Magic link:** Often defaults to 1h expiry — bump to 24h in Supabase settings.
- [ ] **Discord link:** Often hardcoded — centralize and verify accessible only to authenticated members.
- [ ] **Search:** Often misses new MDX — add new MDX, deploy, verify it appears in cmd-K results.
- [ ] **Video previews:** Often autoplay all — verify Network tab shows lazy load (not eager).
- [ ] **Resource grid:** Often unpaginated — count DOM nodes; should not exceed ~30 visible cards.
- [ ] **MDX bundle:** Often ships raw source — view-source on a premium page logged out should NOT contain the code.
- [ ] **`proxy.ts` not `middleware.ts`:** Verify file is named `proxy.ts` and Next.js 16 doesn't warn.
- [ ] **`force-dynamic`:** Verify every authenticated page declares `export const dynamic = 'force-dynamic'`.
- [ ] **Email deliverability:** Verify magic-link emails land in Inbox, not Spam, on Gmail + Yahoo + Outlook.
- [ ] **Lifetime users:** Verify access works for `expires_at = NULL` users.
- [ ] **Tier change race:** Verify two webhooks fired simultaneously result in correct tier, not last-write-wins.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Forged webhook granted premium to attacker | MEDIUM | Audit `webhook_events` for events without matching Mayar API record; revoke memberships from those user IDs; rotate webhook URL secret; force re-auth all sessions. |
| Duplicate webhook processed (double-grant) | LOW | One-off SQL: deduplicate by `mayar_event_id`; recompute `expires_at` from latest valid event. |
| `getSession()` deployed to production | HIGH | Audit every Server Component / Route Handler; replace with `getUser()`; if data leak suspected, force logout all sessions; audit logs for cross-user access patterns. |
| Premium content leaked via API | HIGH | Plug the API hole; rotate any leaked content if possible (changing video URLs); honest comms to paying members; consider partial refund as goodwill. |
| Lifetime users locked out | LOW | Hotfix the access query; backfill any lost-access support tickets with apology + extension. |
| Cancellation revoked access early | MEDIUM | Identify affected users via `memberships.canceled_at < expires_at AND access_revoked_at < expires_at`; restore access to original `expires_at`; refund partial fees + apology. |
| Magic link expiry dead-ended users | LOW | Add `/auth/expired` page; backfill outreach to users who paid but never logged in. |
| Vercel client reuse leaked sessions | CRITICAL | Hotfix to move client creation inside handlers; force logout all sessions; audit access logs for cross-user data fetches; consider disclosure to affected users. |
| Search index missing new MDX | LOW | Trigger rebuild; document the indexing schedule in `Key Decisions`. |
| Video preview perf regression | LOW | Add lazy loading + `preload="none"`; verify Lighthouse score returns to baseline. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Mayar webhook signature missing | Phase 3 (Payments) | Hand-crafted curl POST returns 401, not 200 |
| 2. Duplicate webhook processing | Phase 3 (Payments) | Replay same event from Mayar dashboard — no duplicate side effects |
| 3. Race conditions between webhooks | Phase 3 (Payments) | Fire two webhooks for same user in <100ms — final state matches latest event |
| 4. Webhook before user exists | Phase 3 (Payments) | Test 4 scenarios: new user, existing free user, capitalized email, +alias |
| 5. `getSession()` on server | Phase 2 (Auth) | grep for `getSession\(\)` in `app/**/*.ts` returns 0 results in server contexts |
| 6. `proxy.ts` vs `middleware.ts` | Phase 2 (Auth) | File is `proxy.ts`; build is warning-free on Next 16 |
| 7. Client-side gating only | Phase 4 (Content) | curl-test logged-out: every premium API returns 403 |
| 8. Lifetime user access bug | Phase 3 (Payments) | Test user with `tier = 'lifetime'` accesses premium content |
| 9. Cancellation = immediate revoke | Phase 3 (Payments) | Cancel a sub mid-cycle; access works until `expires_at` |
| 10. Magic link too-short expiry | Phase 2 (Auth) | Supabase setting set to 86400; documented in `Key Decisions` |
| 11. Vercel client reuse | Phase 2 (Auth) | Lint/CI rule prevents `createServerClient` at module scope |
| 12. MDX bundle bloat | Phase 4 (Content) | Bundle analyzer: each resource page <50KB JS |
| 13. No syntax highlighting | Phase 4 (Content) | Visual smoke test on every code block |
| 14. Stale search index | Phase 5 (Search) | New MDX → deploy → cmd-K finds it within revalidation window |
| 15. Video previews block load | Phase 4 (Dashboard) | Lighthouse mobile score ≥80; no video bytes before LCP |
| 16. Unpaginated grid | Phase 4 (Dashboard) | DOM has ≤30 card nodes initially; scroll loads more |
| 17. Missing welcome email | Phase 3 (Payments) / Phase 6 (Onboarding) | E2E test: pay → 2 emails received within 60s |
| 18. ISR caching auth | Phase 2 (Auth) | Every authenticated page declares `dynamic = 'force-dynamic'` |
| 19-22. Minor pitfalls | Phase 2 (Auth) / ongoing | Code review checklist |

---

## Sources

**Verified (HIGH confidence):**
- Next.js 15/16 official docs (`node_modules/next/dist/docs/`):
  - `01-app/02-guides/authentication.md`
  - `01-app/03-api-reference/03-file-conventions/proxy.md`
  - `01-app/02-guides/upgrading/version-16.md`
- Supabase official docs:
  - [Supabase SSR client creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
  - [Supabase Auth advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
  - [Supabase passwordless email login](https://supabase.com/docs/guides/auth/auth-email-passwordless)
  - [Supabase Next.js auth helpers migration to SSR](https://supabase.com/docs/guides/troubleshooting/how-to-migrate-from-supabase-auth-helpers-to-ssr-package-5NRunM)
- [Supabase: getSession vs getUser security](https://github.com/supabase/auth-js/issues/898)
- [Supabase SSR attack vector discussion](https://github.com/orgs/supabase/discussions/23224)
- [Mayar webhook documentation](https://docs.mayar.id/integration/webhook) — note: under-documented; many of our recommendations compensate for missing details

**Verified (MEDIUM confidence):**
- [Hookdeck — Webhook idempotency guide](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency)
- [Webhook best practices: retry, idempotency, error handling](https://dev.to/henry_hang/webhook-best-practices-retry-logic-idempotency-and-error-handling-27i3)
- [Handling payment webhooks reliably](https://medium.com/@sohail_saifii/handling-payment-webhooks-reliably-idempotency-retries-validation-69b762720bf5)
- [Rehype Pretty Code (Shiki) — code highlighting](https://rehype-pretty.pages.dev/)
- [Next.js Image optimization (AVIF/WebP)](https://nextjs.org/docs/app/getting-started/images)
- [Subscription cancellation grace period best practices](https://signeasy.com/blog/engineering/grace-periods)
- [Payment grace period in subscription billing](https://www.subscriptionflow.com/2025/06/payment-grace-period/)

**Domain context (MEDIUM confidence):**
- [Mayar.id homepage / payment methods](https://mayar.id/)
- [Mayar.id Indonesian SME context](https://idwebhost.com/blog/mengenal-mayar-id/)

**Negative findings (verified):**
- Mayar.id documentation does NOT specify webhook signature verification, retry behavior, IP allowlist, or shared secrets. Multiple fetches of `docs.mayar.id/integration/webhook` and `docs.mayar.id/llms.txt` confirm absence. This is the basis for the URL-secret + cross-verification recommendation in Pitfall 1.

---
*Pitfalls research for: Subscription-based component library SaaS — lailit.supply*
*Researched: 2026-05-05*
