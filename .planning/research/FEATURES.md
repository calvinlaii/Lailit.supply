# Feature Research

**Domain:** Subscription-based creative dev component library (multi-format: Framer, Webflow, HTML, JSX, TSX) targeting Indonesian/SEA creative developers
**Researched:** 2026-05-05
**Confidence:** HIGH (table stakes verified across 5 direct competitors; differentiators verified via Osmo, Aceternity, Magic UI, Tailwind UI, Relume; SEA-specific assumptions MEDIUM)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete and lailit.supply will lose to Osmo/Aceternity on day one.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Dashboard with category filters** | Every competitor (Osmo "Vault", Aceternity "Explore", Relume "Components") leads with a browseable gallery. Without it, the product is just a marketing site. | MEDIUM | Server-rendered grid of resource cards (avif thumbnail + title + tags + free/paid badge). Filter by category (animation, navigation, hero, etc.). Next.js App Router with `searchParams` for filter state. Pagination or infinite scroll at ~50+ items. |
| **Resource detail page** | Single source of truth per component: preview, code blocks, description, usage notes. This is the "product page" — broken detail pages = no purchases. | MEDIUM | Route per resource (`/r/[slug]`). MDX-driven content per spec. Layout: hero preview → description → tabbed code blocks → install/usage steps → related resources. |
| **Code copy button per format** | Industry standard since shadcn/ui. Every code block in Aceternity, Magic UI, Osmo has a one-click copy with toast confirmation. Friction here = abandon. | LOW | Copy button in tab header, `navigator.clipboard.writeText()`, success toast. Track copy events server-side (later, for "trending"). |
| **Multiple code formats with tab switcher** | Osmo splits Webflow/HTML, Tailwind UI splits React/Vue/HTML, Aceternity has Manual + CLI tabs. Tabs are the de-facto pattern; users scan and click their stack. | MEDIUM | Tab component (Radix UI or custom) per resource. State persists per session (remember "user prefers TSX") — small wins like this matter. lailit.supply needs 5 tabs (Framer, Webflow, HTML, JSX, TSX) which is more than any competitor. |
| **Magic-link auth (passwordless)** | Modern indie SaaS standard (Linear, Vercel, Cal.com all use it). Indonesian users especially appreciate skipping password creation on mobile. Mandatory because Mayar webhook → magic link is the entire auth flow per PROJECT.md. | MEDIUM | Resend for email delivery, Supabase Auth for token verification. Email template must be Indonesian-localized for trust. 24-hour token expiry. |
| **Free tier + paid gating** | Osmo has a 20-resource free demo, Aceternity has 200 free + 100 Pro, Magic UI has free OSS + paid blocks. Free tier IS the lead magnet. Without it, no acquisition. | MEDIUM | Boolean `is_free` per resource. Server-side gate on resource detail page: free → render code; paid + not member → render paywall CTA. Never gate on client only (defeated by view-source). |
| **Mayar.id checkout integration** | Project-specific table stake (per PROJECT.md). Indonesian users will not use Stripe; Mayar QRIS/e-wallet/bank transfer is the only viable path. | MEDIUM | Hosted Mayar checkout link → webhook on success → Supabase user upsert + magic link send via Resend. Idempotent webhook handler. |
| **Billing/subscription management** | Users need to cancel, update payment, see invoices. Mayar Customer Portal handles this; we just link to it. Hiding billing controls = chargebacks. | LOW | "Manage billing" button in user menu → SSO link to Mayar Customer Portal. No custom billing UI needed at MVP. |
| **Webhook → account auto-creation** | Per PROJECT.md: pay → webhook → account created → magic link. This eliminates the dual-funnel problem (signup AND pay). Must be reliable. | MEDIUM | Mayar webhook signature verification, Supabase admin client, idempotency key on `mayar_payment_id`. Critical path — needs retries and observability. |
| **Responsive mobile dashboard** | 70%+ of Indonesian web traffic is mobile (per typical SEA stats). Desktop-only dashboard = half your users bounce. | MEDIUM | Mobile-first grid (1 col → 2 col → 3 col). Touch-friendly tap targets. Code blocks horizontally scrollable on small screens. |
| **Pricing page with plan comparison** | Standard SaaS pattern. Without clear pricing, conversion drops 30%+. Must show what's free vs paid clearly. | LOW | Static page. Two-column comparison (Monthly Rp X / Lifetime Rp Y). FAQ section addresses Indonesian-specific concerns (refunds, IDR, payment methods). |
| **404 / no-access pages** | Osmo has a dedicated `/no-access` page for non-members hitting premium URLs. Friendly fallback > generic 404. | LOW | Custom not-found and unauthorized pages with CTA back to pricing/login. |
| **Email transactional (welcome, receipt)** | Users expect a welcome email after payment and a receipt. Resend already in stack. | LOW | Three templates: magic link, welcome (after first login), payment receipt. Localized Bahasa Indonesia preferred. |
| **Search across resources** | Even if not Cmd-K, users expect to type and find. Tailwind UI, Aceternity, Magic UI, Relume all have search. Browsing 100+ resources without search is painful. | MEDIUM | Bare minimum: filter by name/tag in dashboard URL params. Cmd-K (see Differentiators) is the upgrade. |

### Differentiators (Competitive Advantage)

Features that set lailit.supply apart. Each maps to PROJECT.md's Core Value: "premium, multi-platform component library built specifically for Indonesian/SEA creative dev market."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multi-format code (5 tracks)** | THE primary differentiator. Osmo = Webflow + HTML/CSS/JS only. Aceternity/Magic UI = React only. Tailwind UI = React/Vue/HTML. **Nobody ships Framer + Webflow + HTML + JSX + TSX.** This is the wedge. | HIGH | Content cost: each resource needs 5 implementations. Authoring tooling (MDX components like `<CodeTabs framer={...} webflow={...} />`) reduces friction. Some resources may legitimately ship in only 2-3 tracks (mark unavailable tracks gracefully). |
| **Live preview per component** | Aceternity inlines React previews; Osmo uses videos. Live preview > static screenshot for animations. lailit.supply ships animation-heavy content — preview is non-negotiable for "show, don't tell." | HIGH | Two patterns: (1) sandboxed iframe with a per-resource demo route (works for all 5 formats since output is HTML+JS), (2) inline React rendering for JSX/TSX. Recommend iframe approach for MVP — uniform across all 5 formats, isolated CSS, easier authoring. Preload thumbnail (avif) → click-to-load iframe to keep dashboard fast. |
| **Command-K fuzzy search** | Aceternity and Tailwind UI ship Cmd-K. Linear-style command palette is power-user catnip and signals product polish. SEA users notice this — it differentiates "premium" from "another resource list." | MEDIUM | Use `cmdk` (the de-facto React library by pacocoursey, used in shadcn/ui's command component). Index resources client-side (~200 items fits easily in JSON). Fuzzy match on name + tags + category. Keyboard nav + enter-to-navigate. Indonesian language fuzzy match handled by simple normalization. |
| **Save/bookmark system** | Users curate their own collection. Sticky feature — once you have 20 saved items, you don't churn. Relume has private libraries; Osmo has nothing similar. Deepens engagement vs competitors. | MEDIUM | `bookmarks` table (`user_id`, `resource_id`, `created_at`). Heart icon on cards toggles. Dedicated `/saved` page. Server actions for toggle. Auth-required (no bookmarks for anonymous free-tier users, simplifies). |
| **Trending sort** | Magic UI and Aceternity sort components by popularity. Social proof drives discovery. SEA users especially trust "what others use." Enables "Top 10" curation later. | LOW | Track `copy_count` per resource (server action on copy button). Sort key = weighted recency × copies. Cron or weekly recompute. No need for real-time. |
| **Discord community access** | Per PROJECT.md (replaces Osmo's Slack). Community = retention engine + word-of-mouth. SEA developers organize on Discord more than Slack/Twitter. Free tier could see "Members-only Discord" lock for upsell. | LOW (integration) / MEDIUM (moderation) | Display invite link on dashboard for paying members only. Discord roles synced via webhook (Mayar payment → Discord bot grants "member" role) — defer role sync to v1.1 if it slows MVP; manual invite link is fine to start. |
| **Regular content updates / changelog page** | Relume's "Component Day" (first Monday of every month) is famous and drives retention. Osmo posts "what's new" weekly. Visible cadence = perceived value for the subscription. | LOW | `/changelog` route rendering an MDX file. Sort by date. Each entry: date + new resources + improvements. RSS feed for power users. Email blast on major drops (uses Resend + a `subscribers_to_changelog` table or just all members). |
| **Indonesian-localized UX** | Mayar payment methods (QRIS, GoPay, OVO, ShopeePay), IDR pricing display, Bahasa Indonesia copy in checkout/onboarding emails. **No competitor speaks Indonesian.** This is the moat. | LOW | i18n not needed at MVP — single Bahasa Indonesia version of marketing/checkout copy. UI/code labels stay English (developer audience). IDR formatting via `Intl.NumberFormat('id-ID', { style: 'currency' })`. |
| **Per-format install instructions** | Aceternity has step-by-step installation per component. Indonesian devs new to Framer/Webflow benefit from "How to add this to your Framer project" snippets. Reduces support burden. | LOW | Optional MDX section per resource with format-specific install steps. Reuses existing tab structure. |
| **Lifetime tier alongside monthly** | Per PROJECT.md and confirmed by competitor research: Osmo, Aceternity, Magic UI, Tailwind UI, Hover.dev all offer lifetime. Indonesian users with limited recurring-subscription tolerance respond to one-time pricing. | LOW | Two Mayar products. Lifetime → permanent `members.tier = 'lifetime'`. Monthly → `tier = 'monthly'` + recurring webhook. Same gating logic ignores tier (both unlock everything). |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems at MVP scale. Per PROJECT.md "Out of Scope" + research-validated additions.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Team seat management** | Agencies and studios will ask. Higher ARPU per account is tempting. | Per-seat billing requires invitation flows, role management, seat-count enforcement, transferred-seat edge cases, and Mayar doesn't natively support per-seat metering. Can blow up MVP scope by weeks. | Defer to v2 (already in PROJECT.md Out of Scope). At MVP, individual lifetime/monthly only. If agency asks, sell N individual seats manually for now. |
| **In-browser code editor / Sandpack playground** | Aceternity-style "edit and see live" is impressive demo material. | Sandpack/StackBlitz integration adds 2-4MB to page weight, complex iframe sandboxing, and most users never edit — they copy. Optimizes for the wrong job-to-be-done. | Live preview iframe (read-only) covers 95% of the value. CodeSandbox link as escape hatch for power users (deferred). Already deferred in PROJECT.md. |
| **CLI tool (`npx lailit add`)** | shadcn/ui popularized this. Aceternity and Magic UI ship CLIs. | CLI requires versioned component registry, dependency resolution, framework-specific install logic per format, and a public CDN/npm package. Massive infra. lailit.supply's multi-format model (Framer, Webflow) doesn't even fit a CLI cleanly. | Copy-paste is the simplest UX and works across all 5 formats uniformly. CLI is Phase 4 (post-traction) per PROJECT.md. |
| **AI-powered semantic search / "AI design assistant"** | "AI" sells. Investors love it. 21st.dev/Magic markets AI-driven UI generation. | Adds embeddings infrastructure, vector DB, ongoing OpenAI/Anthropic costs (eats margin on Indonesian price points), and the value over Cmd-K fuzzy is marginal at 100-200 resources. | Cmd-K with fuzzy + tag filtering covers the search need. Revisit when catalog hits 1000+ resources. |
| **Real-time collaboration / shared collections** | "Slack for designers"-style features. Sounds delightful in roadmap reviews. | Requires presence, websockets, conflict resolution, collaborative state management — months of work for a v1. Saved bookmarks alone deliver 80% of the perceived value. | Personal bookmarks + Discord community = social layer covered. Sharing collections deferred. |
| **Custom theming / "make it your own"** | Some users want to recolor components before copying. | Adding a theme picker per component requires CSS variable surfacing per resource, preview re-rendering, and explodes content surface. Tailwind classes already make customization trivial post-copy. | Document where to change colors in each component's MDX. Power users edit after pasting. |
| **User-submitted components / community marketplace** | Network effects, scaling content. | Moderation burden, IP issues, quality variance, payout systems. Drowns the curation that makes the product premium. | Curated, owner-authored content only at MVP. Feature requests via Discord. User submissions could become a v3 marketplace product, separate from core library. |
| **Multi-language i18n for UI** | "Bahasa Indonesia for everything!" feels right for SEA market. | Developer audience is English-comfortable for tooling/code. Translating UI doubles content maintenance for marginal lift. Code/JSX/CSS terminology is English universally. | Bahasa Indonesia for marketing copy, checkout, transactional emails (high-trust touchpoints). English for app UI. Best of both. |
| **Annual subscription tier at MVP** | Standard SaaS pattern; 20% discount drives commitment. | Per PROJECT.md: "20% discount complexity without MVP signal." Adds a third Mayar product, billing-cycle math in customer service, prorated upgrade paths. | Monthly + Lifetime only at MVP. Add annual after 3-6 months of churn data justifies the discount level. |
| **In-app comments / reviews per component** | Social proof, validation. | Moderation, spam, low engagement at small user base, makes empty states embarrassing. | Discord channel per major category (e.g., #navigation, #animations) achieves discussion at zero infra cost. |
| **Public API for resources** | "Devs love APIs." | Versioning, rate limits, auth tokens, breaking-change policy — none generates revenue. The product is the dashboard. | None needed. If someone really wants programmatic access, they have a CLI request — see CLI anti-feature. |

## Feature Dependencies

```
Magic-Link Auth ──requires──> Mayar Webhook → Account Creation
                                  │
                                  └──requires──> Mayar Checkout Integration

Free Tier + Paid Gating ──requires──> Auth (to know who's a member)
                          ──requires──> Resource Catalog (something to gate)

Resource Detail Page ──requires──> MDX Content Pipeline
                       │
                       └──requires──> Multi-Format Code Block Component

Live Preview ──requires──> Resource Detail Page
              ──requires──> Sandboxed iframe route per resource

Save/Bookmark ──requires──> Auth
                ──requires──> Resource Catalog

Cmd-K Search ──requires──> Resource Catalog (indexable)
              ──enhances──> Dashboard browsing

Trending Sort ──requires──> Copy/View tracking events
                ──requires──> Resource Catalog
                ──enhances──> Dashboard browsing

Discord Community ──requires──> Auth (to gate invite to paying members)

Changelog Page ──enhances──> Retention (signals ongoing value)
                ──requires──> Content authoring (MDX)

Billing Management ──requires──> Mayar Customer Portal (linked, not built)
                     ──requires──> Auth

Multi-Format Tabs ──conflicts──> CLI Tool (a CLI assumes one format per package)
```

### Dependency Notes

- **Auth gates almost everything paid:** Build auth + Mayar webhook FIRST. Bookmarks, billing, Discord access, and paywall enforcement all depend on knowing who the user is.
- **Resource Catalog is the spine:** Dashboard, Detail Page, Search, Bookmarks, Trending, Live Preview all read from the same content layer (MDX in repo, indexed at build time). Get the MDX schema right early — schema migrations across 100+ MDX files are painful.
- **Mayar Webhook is single point of failure:** If webhook fails, paying customer doesn't get access. Must be idempotent, signature-verified, observable, and have a manual recovery path (admin "resend magic link" action).
- **Live Preview enhances but doesn't gate Detail Page:** Detail page can ship with thumbnail-only first, then layer iframe preview after. Don't let live preview block MVP shipping.
- **Cmd-K enhances Dashboard browsing:** Both serve discovery. Search is mandatory (table stake), Cmd-K is the upgrade form.
- **Multi-Format Tabs conflict with CLI Tool:** A CLI tool typically targets one ecosystem (npm/React). lailit.supply's 5-format model is fundamentally a copy-paste model. Choosing copy-paste is choosing NOT to build a CLI — keep this clear.
- **Trending Sort requires event tracking from day one:** Even if Trending isn't built at MVP, instrument copy events early so historical data exists when the feature ships.

## MVP Definition

### Launch With (v1) — Phase 1-3 of roadmap

Ruthless minimum to validate "Indonesian creative devs will pay Mayar for a multi-format component library."

- [ ] **Marketing site + pricing page** — without this, no traffic converts
- [ ] **Resource catalog (20-30 resources, MDX in repo)** — minimum content to feel like a real product (Osmo launched with similar scale)
- [ ] **Dashboard with category filters** — primary browsing surface
- [ ] **Resource detail page with multi-format tabs (5 formats)** — the actual product
- [ ] **Code copy button per format** — the actual transaction
- [ ] **Free tier (5-10 resources permanently free, server-gated)** — lead magnet
- [ ] **Mayar.id checkout (monthly + lifetime products)** — revenue path
- [ ] **Mayar webhook → user creation + magic link send via Resend** — auth path
- [ ] **Magic-link login flow** — return user path
- [ ] **Paid resource gating (server-side)** — the paywall
- [ ] **Mayar Customer Portal link in user menu** — billing self-service
- [ ] **Mobile-responsive layout** — SEA traffic majority
- [ ] **Localized Bahasa Indonesia checkout/email copy** — trust signal
- [ ] **Basic search (URL filter by tag/name)** — at 30 resources, browsable; at 100, mandatory
- [ ] **Static thumbnail preview per resource (avif)** — visual scan
- [ ] **404 / no-access pages** — graceful failure
- [ ] **Discord invite link for members** — community = retention engine

### Add After Validation (v1.x) — Phase 4-6

Once first 50 paying members exist and traffic > 1k/mo.

- [ ] **Live preview per component (iframe)** — trigger: complaints in Discord that videos/thumbnails aren't enough; or: see retention dip on detail pages
- [ ] **Cmd-K fuzzy search** — trigger: catalog > 50 resources OR power-user feedback
- [ ] **Save/bookmark system** — trigger: member feedback "I want to come back to specific items"
- [ ] **Trending sort + copy event tracking** — trigger: enough copy data exists (~500 copies) to be meaningful
- [ ] **Changelog page + monthly content drops** — trigger: 2-3 months of consistent content additions
- [ ] **Discord role auto-sync (Mayar webhook → Discord bot)** — trigger: manual invite-link flow becomes burdensome (~50+ members)
- [ ] **Annual subscription tier** — trigger: enough churn data to set discount level confidently
- [ ] **Per-format install instructions** — trigger: support questions about "how do I install this in Framer"

### Future Consideration (v2+) — Phase 7+

Defer until product-market fit (sustained MRR, organic word-of-mouth, content cadence proven).

- [ ] **Team plan / per-seat billing** — defer: per PROJECT.md, requires custom seat logic; no MVP signal it's needed
- [ ] **CLI tool (`npx lailit add`)** — defer: Phase 4 differentiator per PROJECT.md, only valuable for JSX/TSX format which is 2/5 of catalog
- [ ] **In-browser playground / Sandpack** — defer: complex infra; live preview iframe covers the job
- [ ] **Headless CMS for content team** — defer: per PROJECT.md, MDX in repo sufficient until content team grows beyond 1-2 people
- [ ] **AI-powered semantic search** — defer: revisit at 1000+ resources
- [ ] **International payment gateway (Stripe)** — defer: per PROJECT.md, IDR-only at launch; add when SEA expansion validated
- [ ] **Public API** — defer: no revenue path; CLI substitutes for power-user need

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Multi-format code tabs (5 formats) | HIGH | HIGH | P1 |
| Mayar checkout + webhook + magic link | HIGH | HIGH | P1 |
| Resource catalog + detail page (MDX) | HIGH | MEDIUM | P1 |
| Dashboard with filters | HIGH | MEDIUM | P1 |
| Free tier + paid gating | HIGH | MEDIUM | P1 |
| Code copy button | HIGH | LOW | P1 |
| Mobile-responsive | HIGH | MEDIUM | P1 |
| Pricing page | HIGH | LOW | P1 |
| Basic search (filter by tag) | MEDIUM | LOW | P1 |
| Discord invite for members | MEDIUM | LOW | P1 |
| Static thumbnails | HIGH | LOW | P1 |
| Live preview (iframe per resource) | HIGH | HIGH | P2 |
| Cmd-K fuzzy search | MEDIUM | MEDIUM | P2 |
| Save/bookmark system | MEDIUM | MEDIUM | P2 |
| Trending sort | MEDIUM | LOW | P2 |
| Changelog page | MEDIUM | LOW | P2 |
| Per-format install instructions | MEDIUM | LOW | P2 |
| Discord role auto-sync | LOW | MEDIUM | P2 |
| Annual subscription tier | MEDIUM | LOW | P3 |
| Team plan / per-seat | LOW | HIGH | P3 |
| CLI tool | LOW | HIGH | P3 |
| In-browser playground | LOW | HIGH | P3 |
| AI search | LOW | HIGH | P3 |
| Public API | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (Phase 1-3)
- P2: Should have, add when validated (Phase 4-6, v1.x)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | Osmo.supply | Aceternity UI | Magic UI | Tailwind UI / Plus | Hover.dev | Relume | lailit.supply (planned) |
|---------|-------------|---------------|----------|--------------------|-----------| -------|--------------------------|
| **Format coverage** | Webflow + HTML/CSS/JS | React + Next.js + Tailwind + Framer Motion | React + Tailwind + Framer Motion | React + Vue + HTML | React + Tailwind + Framer Motion | Webflow + Figma | **5: Framer + Webflow + HTML + JSX + TSX** |
| **Pricing model** | Quarterly + Yearly + Lifetime | Free OSS + Pro lifetime ($199) | Free OSS + Pro lifetime ($149) | Lifetime only ($299) | Lifetime only | Free + Subscription | Monthly + Lifetime (IDR-native via Mayar) |
| **Free tier** | 20-resource demo | 200+ free components | 150+ free OSS | None (paid only) | None (paid only) | Yes (forever-free tier) | 5-10 free resources (TBD) |
| **Dashboard / browse** | Yes (Vault) | Yes (Explore) | Yes | Yes | Yes | Yes | Yes |
| **Code copy button** | Yes | Yes | Yes (copy + CLI) | Yes | Yes | Yes (1-click) | Yes |
| **Live preview** | Video previews | Inline React preview | Inline React preview | Static + linked demo | Static + linked demo | Live in Webflow | Iframe per resource (planned v1.x) |
| **Cmd-K search** | Unverified | Yes (⌘K) | Yes | Yes | Unverified | Yes | Yes (planned v1.x) |
| **Save/bookmark** | No | No | No | No | No | Yes (private libraries) | Yes (planned v1.x) |
| **Trending / popular sort** | Curated highlights | Yes | Yes | No | No | Curated highlights | Yes (planned v1.x) |
| **Community** | Slack (private) | Discord | Discord | None | None | Limited | Discord (P1) |
| **Regular updates / changelog** | Weekly | Frequent | Frequent | Periodic | Regular | Monthly "Component Day" | Monthly content drop (planned) |
| **CLI tool** | No | Yes (Pro) | Yes | No | No | Chrome extension instead | No (deliberate; multi-format model) |
| **Localization** | English only | English only | English only | English only | English only | English only | **Bahasa Indonesia checkout/emails (UNIQUE)** |
| **Indonesian payment** | None (Stripe-equivalent) | None | None | None | None | None | **Mayar QRIS/e-wallet/bank (UNIQUE)** |

**Key takeaways:**
1. **No competitor occupies the multi-format niche.** Every competitor is single-ecosystem (React-only or Webflow-only). lailit.supply's 5-format play is uncontested.
2. **No competitor speaks Indonesian or accepts IDR-native payments.** This is a structural moat, not a feature.
3. **Lifetime pricing is universal among premium libraries.** Validates Lifetime as essential for MVP.
4. **Cmd-K, copy buttons, free tiers are universal.** These ARE table stakes — confirmed.
5. **Live preview is split** (videos vs inline React) — pick one and execute well; iframe-based approach generalizes across all 5 formats.
6. **Bookmark/save is rare** — only Relume has it. Easy differentiator that increases retention.

## Sources

**Primary competitor research (HIGH confidence):**
- [Osmo Supply](https://www.osmo.supply/) — direct reference product per PROJECT.md
- [Osmo Plans & Pricing](https://www.osmo.supply/plans)
- [Osmo Vault](https://www.osmo.supply/product/vault)
- [Osmo Community](https://www.osmo.supply/product/community)
- [Aceternity UI](https://ui.aceternity.com/)
- [Aceternity Components](https://ui.aceternity.com/components)
- [Aceternity Pro](https://ui.aceternity.com/pro)
- [Magic UI](https://magicui.design/)
- [Magic UI GitHub](https://github.com/magicuidesign/magicui)
- [Tailwind Plus](https://tailwindcss.com/plus)
- [Hover.dev Pricing](https://www.hover.dev/pricing)
- [Hover.dev Components](https://www.hover.dev/components)
- [Relume Pricing](https://www.relume.io/pricing)
- [Relume Components](https://www.relume.io/components)
- [Relume Resources Docs](https://www.relume.io/resources/docs/how-to-use-the-relume-webflow-library)

**Payment/auth pattern research (MEDIUM confidence):**
- [Mayar.id](https://mayar.id/)
- [Mayar Software & SaaS](https://mayar.id/software-and-saas)
- [Mayar Subscription Strategy Blog](https://blog.mayar.id/4-strategi-menjual-subscription-bagi-bisnis-saas/)
- [Mayar SaaS Subscription How-to](https://blog.mayar.id/langkah-langkah-membuat-produk-saas-subscription-dengan-mayar-untuk-optimalisasi-penjualan-software/)

**Technical pattern research (MEDIUM confidence):**
- [LogRocket: React iframes best practices](https://blog.logrocket.com/best-practices-react-iframes/)
- [web.dev: Sandboxed iframes](https://web.dev/articles/sandboxed-iframes)
- [DEV: Live Component Preview for React](https://dev.to/barelyhuman/live-component-preview-for-react-c37)

**Community / market context (LOW-MEDIUM confidence):**
- [Untitled UI: 14 Best React UI Libraries 2026](https://www.untitledui.com/blog/react-component-libraries)
- [Top SaaS Discord Communities 2026](https://www.raftlabs.com/blog/saas-communities)
- [SaaSFrame Dashboard examples](https://www.saasframe.io/categories/dashboard)

---
*Feature research for: subscription-based creative dev component library (multi-format, SEA market)*
*Researched: 2026-05-05*
