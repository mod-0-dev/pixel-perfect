---
"pixel-perfect": minor
---

Add `Link` (3.3): a text link with `tone`, `underline` and `asChild`. Server
component.

`underline` defaults to `"always"` — colour alone fails WCAG 1.4.1, so a link
in running text is underlined unless you opt out with `underline="hover"` for
navigation lists. It takes no `variant` and no `size`: neither vocabulary has a
word a link needs, and a link takes the size of the text around it.

It declares no `display`, so it wraps across lines like any other inline text.

Also extends the rule lint: `text-underline-offset` and
`text-decoration-thickness` are length-valued properties that were not covered
by the raw-unit ban, so component CSS could have hardcoded a pixel value in
either without anything objecting.
