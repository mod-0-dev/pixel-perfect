---
'pixel-perfect': minor
---

**A pressed `Toggle` is its tone's solid fill.** It was the soft end of the
background ramp, 1.26:1 against the page in the light theme, so in a row of
toggles (a toolbar's Bold and Italic) pressed and not pressed were hard to
tell apart. Pressed is now `--pp-tone-solid` with `--pp-tone-on-solid` text,
and hovering it darkens to `--pp-tone-solid-hover`. A disabled pressed toggle
keeps a subtle edge, so it still reads as pressed. `--pp-toggle-bg-on` and
`--pp-toggle-color-on` still override both, and now default to the solid
tokens.

**Breaking, at the type level.** `Toggle` has no `solid` variant, because
pressed is the solid fill and a solid toggle would look the same on and off.
Use `ghost` (the default), `outline` or `plain`. An untyped `variant="solid"`
is drawn as `ghost` with a development warning. `ToggleVariant` is exported.
Keep `tone="warning"` off a Toggle: its solid is 1.87:1 against the page in
the light theme.

`Toolbar` is now tested and documented with a `SegmentedControl` inside it.
Its arrows walk the segments without selecting them, as the APG toolbar
example walks its alignment group, and `Space` selects the focused one.
