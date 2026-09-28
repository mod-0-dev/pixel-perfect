---
'pixel-perfect': minor
---

Add `AlertDialog` (4.5): `Dialog` with two rules changed. A press on the
scrim does not close it, and focus lands on `AlertDialogCancel`, the safe
button. Compound — `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`,
`AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogCancel`,
`AlertDialogAction` — as named exports; `role="alertdialog"`. Dialog's
stylesheet draws it (every part carries both classes, so every
`--pp-dialog-*` override applies) and its ceiling is `--pp-measure-xs`
through `--pp-alert-dialog-max-inline-size`. With no `Cancel` the panel
takes focus and development warns. Built on `@radix-ui/react-alert-dialog`.
