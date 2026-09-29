---
'pixel-perfect': minor
---

Add `KeyHints` (6.7): three gestures for the keyboard reader. Hold a key
to see every control's shortcut drawn on the control; press a key to
label every control on screen and type the label to focus it; press a
key for the sheet of every shortcut. Declare a shortcut on its control
with `data-pp-hotkey` or register a command with `useKeyHint`; chords
are `mod+shift+n`, sequences `g i`; every single key is a prop and
`null` turns it off. `formatKeys` for your own keycaps.
