# 5.6 `Breadcrumb`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-083; its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` |
| **RSC** | `server` — no state, no effect, no handler |
| **Depends on** | 3.3 `Link` (`done`): every crumb but the last is a `Link` |
| **APG pattern** | [Breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/): a `<nav>` named "Breadcrumb", an ordered list, `aria-current="page"` on the last |

Where the reader is, and the way back up: a trail of links from the root
to here, the last one the page itself and not a link.

## Purpose

A page deep in a hierarchy — a file in a folder in a project, a setting
in a section — shows its ancestors so the reader can go up one level or
to the top in one press. It is a navigation landmark, so a screen
reader user can jump to it; it is an ordered list, so the order is
announced; and the last item is the page, marked `aria-current` and not
a link, because a link to where you are is a lie.

It deliberately does **not**: know the route (the consumer renders the
crumbs; a router's `Link` goes in by `asChild`); collapse itself (a
`BreadcrumbEllipsis` is a part the consumer places where the trail is
cut, with the cut's own affordance — a `DropdownMenu` of the hidden
levels — theirs); or take a `variant`, `tone` or `size`.

---

## Decisions this spec asks you to approve

### 1. Five parts, named exports; the separator is the stylesheet's

```tsx
<Breadcrumb>
  <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbLink href="/projects">Projects</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbPage>Design system</BreadcrumbPage></BreadcrumbItem>
</Breadcrumb>
```

`Breadcrumb` (`<nav aria-label="Breadcrumb">` around an `<ol>`),
`BreadcrumbItem` (`<li>`), `BreadcrumbLink` (a `Link`, `neutral`,
underlined on hover, muted), `BreadcrumbPage` (`<span
aria-current="page">`, the page's text colour, medium weight), and
`BreadcrumbEllipsis` (`<li>` with "…" and an accessible name, for a
trail the consumer cut). No `BreadcrumbSeparator` part: a separator
between every pair of items is a fact of the list, not content, so it
is drawn by the stylesheet (`li:not(:last-child)::after`) from
`--pp-breadcrumb-separator`, `"/"` by default. A slash is symmetric,
so RTL needs nothing; a consumer who sets `"›"` sets its mirror under
`[dir="rtl"]` themselves (D-083 §1). It is not in the accessibility
tree and a screen reader never hears "slash, slash, slash".

### 2. The last crumb is the page: not a link, `aria-current="page"`

`BreadcrumbPage` renders a `<span>` with `aria-current="page"`, never a
link, because the pattern says so and because a link to the current
page moves nothing. The consumer decides which item is last; the
component does not count children (a Server Component with no context
could not, and should not).

### 3. `BreadcrumbLink` is a `Link` with a crumb's colour; `asChild` for a router

A crumb is `Link` with `tone="neutral"` and `underline="hover"`, its
colour `--pp-color-text-muted` through Link's own `--pp-link-color`
hook, and the page's text colour on hover. `asChild` passes through to
`Link`'s, so `<BreadcrumbLink asChild><NextLink href>…</NextLink>
</BreadcrumbLink>` is the router's link with the crumb's class.

### 4. `fill`; a long trail wraps, never scrolls and never shrinks its words

The list is a flex row that wraps: a trail wider than its container
breaks onto a second line at a separator, and every crumb stays whole,
because a wrapped flex item takes its max-content width on its new line.
A crumb breaks inside itself only when it alone is wider than the line,
and then it should, rather than spill: there is no `white-space: nowrap`
(the first draft had one; D-083 §3). A breadcrumb in a 240px sidebar is
two lines of whole crumbs, which reads; the alternatives — a scrolling
trail, or a trail cut off — do not. The contract is `fill` because a
landmark spans its line and the wrap needs the parent's width.

---

## Sizing contract justification

`fill`: a block, no width declaration, `min-inline-size: 0`; the list
wraps inside it (§4).

## Anatomy

```
<nav class="pp-breadcrumb" aria-label="Breadcrumb">
  └── <ol class="pp-breadcrumb__list">
        ├── <li class="pp-breadcrumb__item"> <a class="pp-link pp-breadcrumb__link">
        ├── <li class="pp-breadcrumb__item pp-breadcrumb__ellipsis" aria-label="More levels">…   (optional)
        └── <li class="pp-breadcrumb__item"> <span class="pp-breadcrumb__page" aria-current="page">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Breadcrumb | `pp-breadcrumb` | `<nav>` | `label`, "Breadcrumb" |
| list | `pp-breadcrumb__list` | `<ol>` | Wraps |
| BreadcrumbItem | `pp-breadcrumb__item` | `<li>` | The separator is its `::after`, except the last's |
| BreadcrumbLink | `pp-link pp-breadcrumb__link` | `<a>` or `asChild` | Muted; the page's colour on hover |
| BreadcrumbPage | `pp-breadcrumb__page` | `<span>` | `aria-current="page"` |
| BreadcrumbEllipsis | `pp-breadcrumb__item pp-breadcrumb__ellipsis` | `<li>` | Named "More levels" |

## Props

**`Breadcrumb`**: `label?: string` (`'Breadcrumb'`), …`<'nav'>` less
`aria-label`. **`BreadcrumbItem`**: …`<'li'>`. **`BreadcrumbLink`**:
`asChild?`, …`LinkProps` less `tone` and `underline`. **`BreadcrumbPage`**:
…`<'span'>`. **`BreadcrumbEllipsis`**: `label?: string` (`'More levels'`),
…`<'li'>` less `children`.

Exported types: `BreadcrumbProps`, `BreadcrumbItemProps`,
`BreadcrumbLinkProps`, `BreadcrumbPageProps`, `BreadcrumbEllipsisProps`.

## State

None. `aria-current="page"` is the only state, and it is the consumer's.

## Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-breadcrumb-separator` | `"/"` | The glyph between items |
| `--pp-breadcrumb-gap` | `--pp-space-2` | Each side of the separator |
| `--pp-breadcrumb-color` | `--pp-color-text-muted` | Links and the separator |
| `--pp-breadcrumb-current-color` | `--pp-color-text` | The page |

**Contrast, computed at the gate (D-048 §1).** Muted text and the
page's text on the page background, both asserted pairings; the
separator is muted text.

## Keyboard interaction

Tab through the links. The page is not focusable.

## Accessibility notes

- `<nav aria-label="Breadcrumb">`, an `<ol>`, `aria-current="page"` on
  the last item (APG).
- The separator is a pseudo-element: not in the tree.
- `BreadcrumbEllipsis` has an accessible name ("More levels"); a consumer
  who makes it a menu trigger puts a `DropdownMenuTrigger` inside it.
- **Manual walkthrough:** jump to the "Breadcrumb" landmark; hear "list,
  3 items"; the last reads "Design system, current page".

## Container behavior

`fill`; the trail wraps at separators below its width, crumbs whole.

## Usage

```tsx
<Breadcrumb>
  <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbEllipsis />
  <BreadcrumbItem><BreadcrumbLink href="/projects/1">Design system</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbPage>Tokens</BreadcrumbPage></BreadcrumbItem>
</Breadcrumb>

// With a router:
<BreadcrumbLink asChild><NextLink href="/projects">Projects</NextLink></BreadcrumbLink>
```

## Don't

- Don't make the last crumb a link. `BreadcrumbPage` is a span.
- Don't put separators in the markup; the stylesheet draws them.
- Don't pass an array of crumbs; render items.
- Don't truncate crumbs, and don't stop them wrapping; a trail wraps at
  its separators, and a crumb wider than the line wraps its words.

## Testing notes

- **Unit:** the landmark and its name; the `<ol>` and `<li>`s in order;
  a link's href, class and `neutral` tone, `underline="hover"`; the
  page's `aria-current` and no href; the ellipsis's name; `asChild` on a
  link; refs, `className` and `style` on every part; axe both themes.
- **Browser:** the separator after every item but the last
  (`::after` content `"/"`), muted; a link muted at rest, the page's
  colour on hover, underlined only on hover; the page's colour and
  weight; at 240px a five-crumb trail is two lines of whole crumbs and
  spills nothing; at 960px one line; in RTL the first crumb is at the
  right; a custom separator through the property.
- **Break checks (D-035 §3):** drop the separator (`content`); drop
  `flex-wrap` (the trail spills); drop the page's weight; drop the
  separator's colour (the page's colour). `white-space: nowrap` was the
  fourth and caught nothing, which is D-083 §3.
- **Screenshot:** the trail per cell, plus the ellipsis, the custom
  separator and RTL outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **A `maxItems` that collapses automatically?** No: the consumer
   knows which levels matter, and the collapsed levels want a menu the
   consumer wires. `BreadcrumbEllipsis` is the affordance.
2. **A chevron by default?** No: a slash is symmetric and needs no
   mirror. Recommend the slash, the chevron a property away.
