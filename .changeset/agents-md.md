---
'pixel-perfect': minor
---

Ship `dist/AGENTS.md` for the coding agent in your app: setup, the rules that
change what an agent writes (no width or margin on a component, layout through
the primitives, `tone`/`variant`/`size`, named parts, `asChild`), the banned
list, and an index of every component — with every component's doc and the
rules beside it in `dist/docs/`. Point your agent at it; for Claude Code, add
`@node_modules/pixel-perfect/dist/AGENTS.md` to your app's `CLAUDE.md`.
