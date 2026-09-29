---
'pixel-perfect': minor
---

Add `AppShell` (6.3): the frame a layout wraps its pages in. `header`,
`sidebar` and `footer` slots around `children` in the page's `<main>`, a
skip link to the content rendered first, `Split` as the middle row so the
sidebar stacks above the content when the shell is narrow — by its own
width, never the viewport's — and `sticky` to keep the header in view. It
fills the block size its parent gives it and never sets the viewport's.
