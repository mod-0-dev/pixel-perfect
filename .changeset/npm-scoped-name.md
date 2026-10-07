---
"@mod-0-dev/pixel-perfect": minor
---

The package is published to npm as `@mod-0-dev/pixel-perfect` (the unscoped name belongs to someone else). Import from `@mod-0-dev/pixel-perfect`, `@mod-0-dev/pixel-perfect/theme` and `@mod-0-dev/pixel-perfect/styles.css`; a git dependency keyed `pixel-perfect` should be re-keyed to the new name. Relative imports inside `dist/` now name their file, so the package loads under Node, webpack 5 and TypeScript's `nodenext` resolution as well as Vite and Turbopack.
