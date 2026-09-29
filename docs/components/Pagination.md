# Pagination

Which page of many, and a way to the others: previous, next, and a window
of page numbers around the current one with the first and the last always
reachable. Spec: [`Pagination.md`](../specs/Pagination.md).

```tsx
import { Pagination } from 'pixel-perfect';
```

A client component. It pages nothing itself: `onPageChange` says which
page was asked for, and you fetch or filter.

## Usage

```tsx
const [page, setPage] = useState(1);
<Pagination count={pageCount} page={page} onPageChange={setPage} />
```

`count` is the number of pages; the arithmetic from items and a page size
is yours:

```tsx
const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
```

When the page lives in the URL, give every page a link. The current page
becomes text, and `onPageChange` still fires for a router that
intercepts:

```tsx
<Pagination count={pageCount} page={current} getHref={(p) => `?page=${p}`} />
```

The window shows the first and last page, the current one and its
neighbours, and an ellipsis where it skips: `1 … 5 6 7 … 12`. It keeps the
same number of slots as the page moves, so the row does not change width.
`siblingCount` and `boundaryCount` widen it.

**It reads its container.** Narrower than about 28rem — a sidebar, a
card's foot — the numbers are gone and it is "6 of 12" between the
arrows. Nothing to configure; give it a narrow parent and it is the
compact one.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `count` | `number` | — | Pages |
| `page` / `defaultPage` / `onPageChange` | | `1` | Controlled and uncontrolled |
| `siblingCount` | `number` | `1` | Pages each side of the current |
| `boundaryCount` | `number` | `1` | Pages at each end |
| `getHref` | `(page) => string` | — | Pages become links |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The Buttons' size |
| `label` | `string` | `'Pagination'` | The landmark's name |
| `disabled` | `boolean` | `false` | |

## Accessibility

A `<nav>` named by `label`; `aria-current="page"` on the current page;
previous and next are icon buttons named "Previous page" and "Next
page", disabled at the ends. "6 of 12" is always in the tree, visually
hidden in the full form, so a screen reader hears the count. No roving
focus: every control is an ordinary button or link.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-pagination-gap` | `--pp-space-1` | Between controls |
| `--pp-pagination-current-bg` | `--pp-tone-bg-active` (accent) | The current page |

The compact threshold is 28rem and is not a custom property: a container
query cannot read one.

## Anatomy

```
<nav class="pp-pagination" aria-label="Pagination">
  └── <ul class="pp-pagination__list">
        ├── <li class="pp-pagination__item pp-pagination__item--control"> <button class="pp-button pp-icon-button pp-pagination__control">
        ├── <li class="pp-pagination__item pp-pagination__item--page"> <button class="pp-button pp-pagination__page" aria-current="page">
        ├── <li class="pp-pagination__item pp-pagination__ellipsis" aria-hidden="true">
        ├── <li class="pp-pagination__item pp-pagination__status">
        └── <li class="pp-pagination__item pp-pagination__item--control"> <button … aria-label="Next page">
```

## Don't

```tsx
// ✗ Items and a page size. Pass the number of pages.
<Pagination items={rows} pageSize={20} />

// ✗ A prop to make it compact. Give it a narrow parent; it reads its container.
<Pagination count={12} compact />

// ✗ Two of them for one list.
<Pagination count={12} page={p} /> … <Pagination count={12} page={p} />
```
