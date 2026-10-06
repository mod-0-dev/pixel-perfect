---
'pixel-perfect': patch
---

Fix `Combobox` overflowing a parent narrower than about 256px: its box's
`1fr` track took the native input's intrinsic width as its minimum, so the
control could not shrink — it overflowed a 240px column and pushed a phone's
page sideways. The track is `minmax(0, 1fr)`, and the input shrinks with it.
Fix `AppShell`'s skip link reading `--pp-font-size-sm`, a token that does not
exist, so its size silently fell back to the inherited one; it reads
`--pp-font-size-2`. A new rule in `npm run lint` fails any component
stylesheet that reads a `--pp-*` property nothing defines.
