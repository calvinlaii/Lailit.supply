---
plan: 03-06
status: awaiting-human-uat
completed_auto: 2026-05-07
---

# Plan 03-06 Summary

## Automated Checks — All PASS

| Check | Result |
|-------|--------|
| `npx next build` | ✅ exit 0 — 31 pages (20 SSG resource pages + /explore + others) |
| `npx vitest run` | ✅ 16/16 tests green (8 content + 8 LoginForm) |
| `npx tsc --noEmit` | ✅ 0 errors |
| `index.mdx` count | ✅ 20 |
| `is_premium: false` count | ✅ 12 |
| `is_premium: true` count | ✅ 8 |
| No `.mdx` in `src/app/` | ✅ 0 |
| CONTENT-06 (new resource auto-discovery) | ✅ verified + cleaned up |
| Premium content gate | ✅ "Konten Premium" visible, no code leaked |

## Awaiting Human UAT

Start dev server: `npx next dev`

**Check 1 — /explore catalog (MKT-03, GATE-01):**
1. Open http://localhost:3000/explore in a browser (no login)
2. Verify: 20 resource cards in responsive grid
3. Each card: gradient thumbnail, title, "Gratis"/"Premium" badge, category label
4. Click "Animation" chip → only animation resources (no page reload)
5. Click "Semua" → all 20 resources
6. No login prompt, no redirect

**Check 2 — Free resource detail (CONTENT-01, CONTENT-02, GATE-01):**
1. Click a "Gratis" card (e.g. "Fade In On Scroll")
2. Verify URL: /explore/animation-fade-in-on-scroll
3. "← Kembali ke Jelajahi" back link present
4. FormatTabBar shows only formats for this resource
5. Click different format tabs → code content switches
6. CopyButton: click → Check icon for ~2s then reverts

**Check 3 — Premium resource detail (D-09, GATE-01):**
1. Click a "Premium" card (e.g. "Spring Bounce")
2. Verify URL: /explore/animation-spring-bounce
3. "Konten Premium" heading visible
4. "Lihat Paket Harga" button → /pricing
5. NO code content visible

**Check 4 — Build exit 0 (already verified above)**

**Check 5 — Invalid frontmatter fails build (CONTENT-03):**
1. Remove `title:` line from any index.mdx
2. `npx next build` → must fail with slug name in error
3. Restore line
