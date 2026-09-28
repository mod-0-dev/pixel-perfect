---
'pixel-perfect': minor
---

Add `Breadcrumb` (5.6): a navigation landmark and an ordered list of
`BreadcrumbItem`s — `BreadcrumbLink`s (a neutral `Link`, underlined on
hover), a `BreadcrumbPage` with `aria-current`, and a named
`BreadcrumbEllipsis` where a trail is cut. The separator is the
stylesheet's, out of the accessibility tree; a long trail wraps at a
separator into lines of whole crumbs. A Server Component.
