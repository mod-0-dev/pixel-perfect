# 5.5 `Pagination`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-082; its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` |
| **RSC** | `client` — holds the page when uncontrolled |
| **Depends on** | 3.1 `Button` (`done`): every control here is a `Button` or an `IconButton` |
| **APG pattern** | None of its own: a `<nav>` of links or buttons, `aria-current="page"` on the current one, the [navigation landmark](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html) |

Which page of many, and a way to the others: previous, next, and a window
of page numbers around the current one with the first and the last always
reachable. A `Table` or a list of `Card`s is the thing it pages.

## Purpose

A list too long for one screen is cut into pages, and the reader needs to
know where they are and get anywhere else in two presses. It is a
navigation landmark of buttons, or of links when the page is in the URL,
and nothing here fetches anything: `onPageChange` says which page was
asked for and the consumer gets it.

It deliberately does **not**: know how many items a page holds (`count`
is the number of pages; the arithmetic from items and a page size is one
line the consumer owns); offer a page-size picker (a `Select` beside it);
or take a `variant`.

---

## Decisions this spec asks you to approve

### 1. `count` pages, a window of `siblingCount` each side and `boundaryCount` at each end, an ellipsis where it skips

```tsx
<Pagination count={12} defaultPage={1} onPageChange={setPage} />
<Pagination count={12} page={page} onPageChange={setPage} />
```

Controlled and uncontrolled (RULES §5.5): `page` / `defaultPage` /
`onPageChange`. The numbers shown are the first `boundaryCount`, the last
`boundaryCount`, and `siblingCount` each side of the current page,
defaults 1 and 1; where the window does not touch a boundary an ellipsis
stands in, so 12 pages at page 6 read `1 … 5 6 7 … 12`, and at page 2 read
`1 2 3 … 12`. The window keeps a constant number of slots as the page
moves, so the row does not change width from page to page: near an edge
the siblings on the far side take the slots an ellipsis would have. The
arithmetic is MUI's, a known-good reference (D-082 §1).

### 2. Buttons by default; links when `getHref` says where a page lives

```tsx
<Pagination count={12} page={page} getHref={(p) => `/invoices?page=${p}`} />
```

Every control is a `Button` (`ghost` for a page, an `IconButton` for
previous and next). With `getHref`, each page is a `Link`-shaped `<a>`
rendered through `Button asChild`, so a page with a URL is a page a
reader can open in a new tab and a crawler can follow; `onPageChange`
still fires, for a router that intercepts. The current page is never a
link to itself: it renders as a `<span>` with the same class and
`aria-current="page"`, and previous or next at the end of the range is
a disabled button either way.

### 3. The current page is a pressed Toggle's surface; `aria-current="page"` is the state

The current page carries `aria-current="page"` and is drawn the way
Toggle draws `on`: `--pp-tone-bg-active` in the accent scope, by writing
Button's private variables the way Toggle does (Toggle.css's layering
argument). No `solid` accent button: a page number is not the view's one
primary action (Button §3.1's hierarchy note), and a solid page among
ghosts reads as a call to action.

### 4. Narrower than its row, it is "3 of 12" with previous and next — by a container query

A row of nine controls at `md` is about 26rem. In a 240px sidebar it
wraps into two ragged lines or overflows, and neither is a pagination.
The root is a size container (`container-type: inline-size`, Split's
device, D-022) and below `28rem` the page numbers and the ellipses are
`display: none` and a `pp-pagination__status` — "3 of 12" — is shown
between the arrows. Nothing is measured in JavaScript and the form is
the container's, not the viewport's: the same component is the compact
one in a sidebar and the full one in the main column of the same page.
The sizing contract is `fill` **because of this**: a container query
needs the root's inline size to be the parent's, and a hugging row would
be its own content's width in every container (D-082 §2).

The status text is present in both forms — visually hidden in the full
one, where `aria-current` already says the page but a screen reader
walking the landmark still hears the count — and visible in the compact
one.

### 5. Previous and next are `IconButton`s with a logical chevron

`<IconButton label="Previous page">` and `"Next page"`, `ghost`, the
chevron from Select's drawing pointed along the inline axis. The icon
faces the start for previous and the end for next: under a `dir="rtl"`
ancestor it is mirrored (`scale: -1 1`), so the arrow points the way the
pages run with no second SVG. `[dir="rtl"]` and not `:dir(rtl)`, because
the build rewrites `:dir()` into a `:lang()` list that matches languages
rather than the attribute (D-082 §4).

---

## Sizing contract justification

`fill`: a block, no width declaration, `min-inline-size: 0`, so the
container query (§4) reads the parent's width. The row inside is a flex
row with `justify-content: center`; the landmark spans the line and the
controls sit in the middle of it. A `Cluster` around it with `justify`
places it elsewhere.

## Anatomy

```
<nav class="pp-pagination" aria-label="Pagination" data-size="md" data-state="…">
  └── <ul class="pp-pagination__list">
        ├── <li class="pp-pagination__item pp-pagination__item--control"> <button class="pp-button pp-icon-button pp-pagination__control" aria-label="Previous page">
        ├── <li class="pp-pagination__item pp-pagination__item--page"> <button class="pp-button pp-pagination__page" aria-current="page"?>  (or <a>, or <span> for the current page with getHref)
        ├── <li class="pp-pagination__item pp-pagination__ellipsis" aria-hidden="true">…
        ├── <li class="pp-pagination__item pp-pagination__status">3 of 12   (visually hidden in the full form)
        └── <li class="pp-pagination__item pp-pagination__item--control"> <button … aria-label="Next page">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-pagination` | `<nav>` | The landmark, the size container |
| list | `pp-pagination__list` | `<ul>` | A flex row, centred |
| item | `pp-pagination__item` | `<li>` | `--control`, `--page`; the compact form hides the page items, not the buttons in them |
| control | `pp-pagination__control` | `IconButton` | Previous, next |
| page | `pp-pagination__page` | `Button` / `<a>` / `<span>` | `aria-current="page"` on the current |
| ellipsis | `pp-pagination__ellipsis` | `<li aria-hidden>` | |
| status | `pp-pagination__status` | `<li>` | "3 of 12"; visible only in the compact form |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `count` | `number` | — | Pages. Required; less than 1 renders one page |
| `page` | `number` | — | Controlled |
| `defaultPage` | `number` | `1` | Uncontrolled |
| `onPageChange` | `(page: number) => void` | — | |
| `siblingCount` | `number` | `1` | Pages each side of the current |
| `boundaryCount` | `number` | `1` | Pages at each end |
| `getHref` | `(page: number) => string` | — | Pages become links |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The Buttons' size |
| `label` | `string` | `'Pagination'` | The landmark's name |
| `disabled` | `boolean` | `false` | Every control |

…`ComponentPropsWithoutRef<'nav'>` less `children` and `aria-label`.
Exported: `PaginationProps`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| current page | `aria-current="page"` | The pressed surface |
| at the first / last page | `disabled` on previous / next | Button's disabled |
| compact | the container, not an attribute | Numbers hidden, the status shown |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-pagination-gap` | `--pp-space-1` | Between controls |
| `--pp-pagination-current-bg` | `--pp-tone-bg-active` (accent) | The current page |
| `--pp-pagination-compact` | `28rem` | Not a custom property: a container query cannot read one (Split.css). The threshold is fixed |

**Contrast, computed at the gate (D-048 §1).** Every control is a
`Button`, whose pairings are asserted; the current page is Toggle's
`on` surface with the page's text, the pairing Toggle asserts. The
status text is `--pp-color-text-muted` on the page.

## Keyboard interaction

Tab through the controls; every page is a button or a link. No roving
focus: a pagination is a short list of ordinary controls, not a
composite widget (APG's "navigation" example).

## Accessibility notes

- `<nav aria-label="Pagination">`; `aria-current="page"` on the current
  page; previous and next named by `IconButton`'s `label`.
- The status ("3 of 12") is always in the tree, visually hidden in the
  full form, so the count is heard.
- A disabled previous or next is a disabled `Button` (native `disabled`,
  or `aria-disabled` as a link).
- **Manual walkthrough:** Tab to the landmark's first control, hear
  "Previous page, button, dimmed"; the current page reads "current page,
  6, button"; at 240px the numbers are gone and "3 of 12" is read.

## Container behavior

`fill`. Below `28rem` the compact form (§4); above it the full one.

## Usage

```tsx
const [page, setPage] = useState(1);
<Pagination count={pageCount} page={page} onPageChange={setPage} />

// In the URL:
<Pagination count={pageCount} page={Number(searchParams.page ?? 1)} getHref={(p) => `?page=${p}`} />
```

## Don't

- Don't pass items and a page size; pass `count`.
- Don't put it in a hugging row to "make it smaller"; it reads its
  container and becomes the compact form itself.
- Don't give it a `label` that repeats "navigation"; the role says it.

## Testing notes

- **Unit:** the landmark and its name; the window for 12 pages at 1, 2,
  6, 11 and 12 with the defaults, and with `siblingCount={2}` and
  `boundaryCount={2}`; a constant slot count as the page moves;
  `aria-current` on the current page; previous disabled at 1 and next
  at `count`; a click and the arrows call `onPageChange`, and move the
  page when uncontrolled and not when controlled; `getHref` renders
  links with hrefs and the current page as a `<span>`; `size` on every
  Button; `disabled`; `count < 1`; the status text; ref, `className`,
  `style`; axe both themes, as buttons and as links.
- **Browser:** at 480px and 960px the numbers are shown and the status
  is visually hidden; at 240px the numbers and ellipses are gone and the
  status is visible; the current page's surface is the accent
  `bg-active`; the row is centred in the landmark; in RTL the chevrons
  are mirrored; the ring on a page button.
- **Break checks (D-035 §3):** drop `container-type` (240px shows the
  numbers); drop the current page's surface; drop the RTL mirror; drop
  `justify-content: center` (the row sits at the start).
- **Screenshot:** the pagination at page 6 of 12 per cell — compact at
  240 — plus the sizes, the link form and the RTL one outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **A `showFirstLast` pair of arrows?** No: the boundaries are always
   in the window. Recommend no.
2. **A page-size picker?** No: a `Select` beside it.
3. **A `compact` prop to force the small form?** No: the container
   decides, and a consumer who wants it small gives it a narrow parent.
