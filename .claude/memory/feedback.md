---
name: Feedback
description: Calvin's working style preferences and guidance for future sessions
type: feedback
originSessionId: 3f12d2c7-e94f-40e4-82f1-aba274ba9dca
---
Always follow Figma design exactly when building UI — use Figma MCP tools to get screenshots and design context before implementing.

**Why:** Calvin works from a Figma file and expects the implementation to match pixel-level decisions (spacing, font sizes, colors).

**How to apply:** Before implementing any UI component, fetch the Figma node screenshot and design context. Use node IDs from the Figma URL. The full detail page is node 37:10273.

---

When the user mentions a commit hash, always check `git fetch --all` first before saying the commit doesn't exist.

**Why:** The collaborator pushes directly to GitHub remote without syncing locally — commits exist on remote but not in local git history.

**How to apply:** Always `git fetch origin` before `git log --all | grep <hash>`.

---

The project uses GSD workflow — read .planning/STATE.md at session start if doing phase work.

**Why:** Phases are architecturally ordered and skipping them causes problems.

**How to apply:** For any feature work, check if there's a relevant phase plan in .planning/ first.
