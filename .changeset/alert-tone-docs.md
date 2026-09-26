---
'pixel-perfect': patch
---

Correct `Alert`'s documentation, and say where the checkable controls take a
tone (D-059). No runtime behaviour changes.

- **An `Alert`'s tone does not reach the `Button`s and `Link`s inside it.** The
  0.7.0 entry said it did. Each writes its own `data-pp-tone` from its default
  (`neutral` / `accent`), and the nearest context wins — so pass `tone` to them
  yourself. Bare text and `currentColor` do take the alert's hue.
- **`live` only announces reliably on an alert that is already mounted.** For a
  message that appears by mounting, `{saved && <Alert live="polite">}` may be
  read twice or not at all; keep a `role="status"` element mounted and render
  the alert inside it with `live` off. The `tone` and `live` JSDoc now say so.
- **`Checkbox`, `Radio` and `Switch` take a tone from an ancestor.** There is no
  `tone` prop — the root's own is reserved for `invalid` — so set
  `data-pp-tone` on the `Field`; `invalid` still wins.
