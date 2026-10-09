# Breadcrumb

Where the reader is, and the way back up: a trail of links from the root
to here, the last one the page itself and not a link. Spec:
[`Breadcrumb.md`](../specs/Breadcrumb.md).

```tsx
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbEllipsis } from '@mod-0-dev/pixel-perfect';
```

A Server Component. A navigation landmark named "Breadcrumb", an ordered
list, `aria-current="page"` on the last item, exactly as the APG pattern
says.

## Usage

```tsx
<Breadcrumb>
  <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbLink href="/projects">Projects</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbPage>Design system</BreadcrumbPage></BreadcrumbItem>
</Breadcrumb>
```

The last item is `BreadcrumbPage`: a span, not a link, because a link to
where you are moves nothing. You decide which item is last.

With a router, put its link inside `BreadcrumbLink` with `asChild`:

```tsx
<BreadcrumbLink asChild><NextLink href="/projects">Projects</NextLink></BreadcrumbLink>
```

A long trail you want shorter is cut where you say, with an ellipsis
that a screen reader hears as "More levels":

```tsx
<BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
<BreadcrumbEllipsis />
<BreadcrumbItem><BreadcrumbLink href="/a/b/c">Tokens</BreadcrumbLink></BreadcrumbItem>
```

The hidden levels' affordance — a `DropdownMenu` on the ellipsis — is
yours; put a `DropdownMenuTrigger` inside a `BreadcrumbEllipsis`.

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `Breadcrumb` | `<nav aria-label="Breadcrumb">` around `<ol>` | `label` renames it |
| `BreadcrumbItem` | `<li>` | The separator is drawn after every item but the last |
| `BreadcrumbLink` | a `Link`, or its child with `asChild` | Muted; the page's colour on hover |
| `BreadcrumbPage` | `<span aria-current="page">` | The last item |
| `BreadcrumbEllipsis` | `<li>` with "…" | Named "More levels"; `label` renames it |

No separator part: the stylesheet draws one between every pair of items
from `--pp-breadcrumb-separator`, `"/"` by default. A slash is
symmetric, so right-to-left needs nothing; a chevron is a property away,
and its mirror under `[dir="rtl"]` is yours.

A long trail wraps at a separator into lines of whole crumbs. It never
scrolls and a crumb never breaks mid-label.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-breadcrumb-separator` | `"/"` | The glyph between items |
| `--pp-breadcrumb-gap` | `--pp-space-2` | Each side of the separator |
| `--pp-breadcrumb-color` | `--pp-color-text-muted` | Links and the separator |
| `--pp-breadcrumb-current-color` | `--pp-color-text` | The page |

## Anatomy

```
<nav class="pp-breadcrumb" aria-label="Breadcrumb">
  └── <ol class="pp-breadcrumb__list">
        ├── <li class="pp-breadcrumb__item"> <a class="pp-link pp-breadcrumb__link">
        ├── <li class="pp-breadcrumb__item pp-breadcrumb__ellipsis">
        └── <li class="pp-breadcrumb__item"> <span class="pp-breadcrumb__page" aria-current="page">
```

## Don't

```tsx
// ✗ The last crumb as a link. It is the page.
<BreadcrumbItem><BreadcrumbLink href="/here" aria-current="page">Here</BreadcrumbLink></BreadcrumbItem>

// ✗ Separators in the markup. The stylesheet draws them, out of the tree.
<BreadcrumbItem>Home</BreadcrumbItem><li>/</li>

// ✗ An array of crumbs. Render items.
<Breadcrumb items={[{ href: '/', label: 'Home' }]} />
```
