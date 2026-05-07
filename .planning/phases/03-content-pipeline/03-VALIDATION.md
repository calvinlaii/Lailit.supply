---
phase: 3
slug: 03-content-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

Current baseline: 8 tests passing (Phase 2 LoginForm tests). Phase 3 adds content.test.ts.

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green + `next build` passes
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CONTENT-01, CONTENT-03 | Invalid frontmatter throws ZodError, fails build | unit | `npx vitest run src/lib/__tests__/content.test.ts -t "schema"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CONTENT-02, CONTENT-05 | Manifest discovers all format files; seed count ≥ 20 | unit | `npx vitest run src/lib/__tests__/content.test.ts -t "formats"` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | CONTENT-05, CONTENT-06 | 20 seed folders exist with index.mdx and format files | unit | `npx vitest run src/lib/__tests__/content.test.ts -t "seed count"` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | CONTENT-01, CONTENT-04 | Zod schema validates all seed frontmatter; thumbnail + mux_playback_id fields present | unit | `npx vitest run src/lib/__tests__/content.test.ts -t "schema"` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | CONTENT-04, MKT-03 | ThumbnailPlaceholder + VideoPlaceholder render without errors | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | GATE-01 | PaywallStub renders for is_premium resources; ResourceCard shows Free/Premium badge | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 2 | CONTENT-02, MKT-03 | CategoryFilterRow filters by category client-side; FormatTabBar renders only available_formats tabs | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 2 | CONTENT-02 | CopyButton copies code to clipboard; CodeBlock renders Shiki-highlighted HTML | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 3 | MKT-03, GATE-01 | /explore page renders without auth (curl 200) | smoke (manual) | `curl http://localhost:3000/explore` | N/A | ⬜ pending |
| 03-05-02 | 05 | 3 | GATE-01, CONTENT-02 | Free resource detail renders full tabs; premium resource returns PaywallStub (no code) | smoke (manual) | `curl http://localhost:3000/explore/{free-slug}` | N/A | ⬜ pending |
| 03-06-01 | 06 | 4 | All | `next build` passes with no errors | build | `npx next build` | N/A | ⬜ pending |
| 03-06-02 | 06 | 4 | All | Vitest full suite green | unit | `npx vitest run --reporter=verbose` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/content.test.ts` — stubs for CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05
- [ ] `next build` validation with `rehype-pretty-code` as string name in Turbopack config — covers Assumption A3

*Wave 0 is embedded in Plan 03-01 Task 1 (MDX infra setup).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| /explore page renders without login | MKT-03 | Browser rendering | `curl http://localhost:3000/explore` — expect 200, HTML contains "Jelajahi Komponen" |
| Free resource detail accessible | GATE-01 | Browser rendering | `curl http://localhost:3000/explore/{free-slug}` — expect 200, HTML contains format tab labels |
| Premium resource returns paywall | GATE-01, D-09 | Server Component rendering | `curl http://localhost:3000/explore/{premium-slug}` — expect 200 with PaywallStub copy, NO code content in body |
| Category filter works | MKT-03, D-06 | Client-side interaction | Manual browser test: click each category chip, verify grid filters correctly |
| Format tab switching works | CONTENT-02, D-08 | Client-side interaction | Manual browser test: click each format tab on a free resource, verify code content changes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
