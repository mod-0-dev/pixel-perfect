---
'pixel-perfect': patch
---

Fix `VisuallyHidden` widening the page from inside a horizontally scrolled
region. Its box was absolute with no inset, so past the region's edge it was
positioned against the nearest positioned ancestor — often the viewport —
escaped the region's clip and gave the document a phantom horizontal
scrollbar (a `Spinner`'s label made a page 514px wide on a 390px phone). It
now takes `inset-inline-start: 0`, which keeps it inside its containing block;
the block axis keeps its static position, so screen readers still scroll to
the right place. Every component that embeds one — `Spinner`, `Stepper`,
`ThemeToggle`, `KeyHints`, `Field` with `labelHidden`, `CodeBlock` — is fixed
with it.
