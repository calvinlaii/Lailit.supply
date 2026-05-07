# Phase 3: Content Pipeline — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md.

**Date:** 2026-05-07
**Phase:** 03-content-pipeline
**Areas discussed:** Seed content, Explore page, Resource detail, Video & thumbnails

---

## Seed Content

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder dulu | MDX files dengan frontmatter valid + kode dummy | ✓ |
| Real component code | Konten MDX asli disiapkan user | |

**Categories selected:** Animation, UI Components, Layout, Interactions (all 4)

---

## Explore Page

| Decision | Options | Selected |
|----------|---------|----------|
| URL | /explore vs /components | /explore |
| Layout | Dense 3-4 kolom vs relaxed 2-3 kolom | Dense 3-4 kolom |
| Filter | Ada filter kategori vs tidak | Ya, filter kategori |

---

## Resource Detail

| Option | Description | Selected |
|--------|-------------|----------|
| Full layout + tab structure | Format tabs, syntax highlight, copy button, lock icon | ✓ |
| Simple MDX render | Hanya render MDX content | |

---

## Video & Thumbnails

| Decision | Options | Selected |
|----------|---------|----------|
| Mux video | Placeholder dulu vs Mux sekarang | Placeholder dulu |
| Thumbnails | Placeholder image vs AVIF asli | Placeholder image |

---

## Claude's Discretion

- Slug naming convention untuk seed resources
- Exact number of resources per category
- Placeholder thumbnail color scheme
- Copy untuk paywall stub

## Deferred Ideas

- Real Mux video integration → Phase 5
- Real AVIF thumbnails → swap sebelum launch
- Hover video preview di cards → Phase 5
- Search/filter by tags → Phase 6
