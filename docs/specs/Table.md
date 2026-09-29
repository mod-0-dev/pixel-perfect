# 5.4 `Table`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `review` — written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-081; awaiting its CI-authored baseline (D-013) |
| **Sizing contract** | `fill` |
| **RSC** | `server` — no state, no effect, no handler |
| **Depends on** | T2 (`done`): nothing here re-invents a layout; the region is the one scroll container the tier said it would wait for (tier-2-layout §Scroller) |
| **APG pattern** | [`table`](https://www.w3.org/WAI/ARIA/apg/patterns/table/) — the native element's semantics, not the `grid` widget: nothing here takes a key |

A semantic table: rows and columns of data the reader scans, with the
native element's semantics — a screen reader announces the column header
with the cell — and nothing that needs a data layer. Sorting and
selection are *hooks*: the header says how it is sorted and the row says
it is selected; deciding either is the consumer's.

## Purpose

Records with the same fields: invoices, members, files. Not a layout
(`Grid` is), not a list of cards, not a spreadsheet (the ARIA `grid`
widget, with its roving focus, is a different component the roadmap
does not have).

It deliberately does **not**: hold data (`rows={…}` and `columns={…}`
are a data layer, and a data layer is a library of its own); sort or
select (a Server Component cannot, and the consumer's client component
can, with `sort` and `selected` to say so); or take a `variant`.

---

## Decisions this spec asks you to approve

### 1. A semantic table in a named region that scrolls

```tsx
<Table caption="Invoices for September">
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead align="end">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV-0091</TableCell>
      <TableCell align="end">1,240.00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

Eight parts, named exports (RULES §5.6): `Table` (the region and the
`<table>`), `TableHeader` (`<thead>`), `TableBody` (`<tbody>`),
`TableFooter` (`<tfoot>`), `TableRow` (`<tr>`), `TableHead` (`<th
scope="col">`), `TableCell` (`<td>`). The caption is a prop of the root,
not a part (§2).

The root is `<div role="region" tabindex="0">` around the `<table>`, and
it scrolls on the inline axis. A table with five columns does not fit a
240px sidebar, and the two ways to make it fit — break every word, or
collapse the columns into stacked pairs — both destroy what a table is
for. So it scrolls, inside its own box, and never the page. The region
is focusable so a keyboard user can scroll it, and it is named (§2) so
the tab stop says what it is. That is the one tab stop on a table that
does not overflow, and it is accepted: a Server Component cannot know
whether the table overflows, and a region that is focusable only
sometimes is the thing a screen reader user cannot predict (Roselli's
pattern; D-081 §1).

### 2. `caption` is a prop, and it names the region; a name is required at the type level

```ts
type TableProps = TableBase & (
  | { caption: ReactNode; 'aria-label'?: never; 'aria-labelledby'?: never }
  | { 'aria-label': string; caption?: never; 'aria-labelledby'?: never }
  | { 'aria-labelledby': string; caption?: never; 'aria-label'?: never }
)
```

The region takes its name from the caption: `<caption id>` and
`aria-labelledby` on the region, one `useId`. A Server Component has no
context, so a `<TableCaption>` part could not hand its id to the root;
the caption is a prop of the root instead, the one place this library
prefers configuration, because the alternative is a region whose name
the consumer must wire by hand. A table with a visible title elsewhere
names the region by `aria-labelledby`; one with none says `aria-label`.
One of the three is required (D-081 §2).

### 3. The table is stretched by a grid, never by a width

A `<table>` is shrink-to-fit: `width: auto` is its content's width, so a
short table would sit in the start of its region with the region's frame
running on past it. `width: 100%` is what RULES §1 bans. The region is
`display: grid`, and the table is its one item: an item stretches to its
track, and the track is the region — unless the table's min-content is
wider, when the track is that and the region scrolls it. One rule
(`display: grid`), both cases, no width, no allowance (D-081 §3).

### 4. Hairlines between rows, the header on the sunken surface, the foot the same

Every cell carries a hairline at its block-end, except the last row's:
the header's line under it, the body's between rows, the footer's above
it by the body's last row. `border-collapse: separate` with
`border-spacing: 0`, because collapsed borders double at the seams and
resolve by rules nobody can read. The header and the footer are
`--pp-color-bg-sunken`, the header's text `--pp-font-size-2`, medium,
muted, `white-space: nowrap` (a heading that wraps is a column nobody
can read). The region has a hairline frame and `--pp-radius-3`, Card's
edge, so a table in a `Card` body reads as the card's content and a
table on the page reads as a bounded thing.

### 5. `size` is the row's density; `striped`, `selected`, `align` and `sort` are the hooks

| `size` | Cell padding (block / inline) | Body text |
| --- | --- | --- |
| `sm` | `--pp-space-1` / `--pp-space-3` | `--pp-font-size-2` |
| `md` | `--pp-space-2` / `--pp-space-4` | `--pp-font-size-3` |
| `lg` | `--pp-space-3` / `--pp-space-4` | `--pp-font-size-3` |

- `striped` on the root: every even body row on `--pp-color-bg-sunken`,
  for a wide table the eye loses its row in. `data-striped`.
- `selected` on a row: `data-state="selected"` and `data-pp-tone="accent"`,
  so `--pp-tone-bg` paints it in the accent ramp with no colour named
  here (D-007). No `aria-selected`: on a `row` outside a `grid` it is not
  allowed, and the consumer's `Checkbox` in the row carries the state
  for assistive technology.
- `align` on a cell or a head: `start | center | end`, `data-align`;
  numbers go `end`. Every cell has `font-variant-numeric: tabular-nums`
  so a column of numbers lines up by digit. A head starts where its
  column does: `text-align: start` on the head itself, because the UA
  stylesheet centres a `th` on the element and a value inherited from
  the table does not reach past it.
- A cell does not wrap unless told to: `white-space: nowrap`, and
  `wrap` on a prose cell (`data-wrap`) lets it. An id, a date or an
  amount broken across two lines is worse than a region that scrolls,
  and the region is there to scroll (D-081 §6).
- `sort` on a head: `ascending | descending | none`, written as
  `aria-sort`. The button that changes it is the consumer's, inside the
  head.

---

## Sizing contract justification

`fill`: the region is a block that takes its parent's width,
`min-inline-size: 0`; inside it the table is stretched by the grid (§3)
or scrolled. Its height is its rows'.

## Anatomy

```
<div class="pp-table" role="region" tabindex="0" aria-labelledby="…" data-size="md" data-striped?>
  └── <table class="pp-table__table">
        ├── <caption class="pp-table__caption" id="…">
        ├── <thead class="pp-table__header">
        │     └── <tr class="pp-table__row">
        │           └── <th class="pp-table__head" scope="col" data-align? aria-sort?>
        ├── <tbody class="pp-table__body">
        │     └── <tr class="pp-table__row" data-state="selected"?>
        │           └── <td class="pp-table__cell" data-align?>
        └── <tfoot class="pp-table__footer">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Table | `pp-table` | `<div role="region">` | The scroll container, focusable, named |
| table | `pp-table__table` | `<table>` | Stretched by the grid |
| caption | `pp-table__caption` | `<caption>` | From the `caption` prop |
| TableHeader | `pp-table__header` | `<thead>` | Sunken |
| TableBody | `pp-table__body` | `<tbody>` | |
| TableFooter | `pp-table__footer` | `<tfoot>` | Sunken, medium weight |
| TableRow | `pp-table__row` | `<tr>` | `selected` |
| TableHead | `pp-table__head` | `<th scope="col">` | `align`, `sort` |
| TableCell | `pp-table__cell` | `<td>` | `align`, `wrap` |

## Props

**`Table`**: `caption?: ReactNode` (or `aria-label` / `aria-labelledby`,
one required), `size?: Size` (`md`), `striped?: boolean`,
…`ComponentPropsWithoutRef<'div'>` less `role`. The `<table>` element
takes `tableProps?: ComponentPropsWithoutRef<'table'>` for the rare
attribute that belongs on it.
**`TableRow`**: `selected?: boolean`, …`<'tr'>`.
**`TableHead`**: `align?`, `sort?: 'ascending' | 'descending' | 'none'`,
`scope` defaults to `col`, …`<'th'>`.
**`TableCell`**: `align?`, `wrap?: boolean`, …`<'td'>`.
**`TableHeader`**, **`TableBody`**, **`TableFooter`**: …`<'thead' | 'tbody' | 'tfoot'>`.

Exported types: `TableProps`, `TableHeaderProps`, `TableBodyProps`,
`TableFooterProps`, `TableRowProps`, `TableHeadProps`, `TableCellProps`,
`TableAlign`, `TableSort`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| selected row | `data-state="selected"`, `data-pp-tone="accent"` | The accent surface |
| striped | `data-striped` on the root | Even rows sunken |
| sorted head | `aria-sort` | None of its own; the consumer's button shows the arrow |
| region focused | `:focus-visible` | The one ring |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-table-border-color` | `--pp-color-border-subtle` | The frame and the hairlines |
| `--pp-table-radius` | `--pp-radius-3` | The frame's corners |
| `--pp-table-header-bg` | `--pp-color-bg-sunken` | The header and the footer |
| `--pp-table-stripe-bg` | `--pp-color-bg-sunken` | Even rows when striped |
| `--pp-table-selected-bg` | `--pp-tone-bg` (accent) | A selected row |
| `--pp-table-padding-block` | per `size` | Every cell |
| `--pp-table-padding-inline` | per `size` | Every cell |

**Contrast, computed at the gate (D-048 §1).** Body text is the page's
pairing on `bg-raised`; the header's muted text on `bg-sunken` is
neutral 11 / 3, asserted; a selected row's text is the page's colour on
the accent `bg` step (step 3), the pairing every `ghost` Button hover
already carries. The frame and the hairlines are `border-subtle`, no
obligation (D-050).

## Keyboard interaction

The region is a tab stop; arrow keys scroll it when it overflows. Nothing
inside is focusable unless the consumer put a control there.

## Accessibility notes

- The native `<table>`, `<thead>`, `<th scope="col">`: a screen reader
  announces the header with each cell. `role="region"` with a name on
  the scroll container, `tabindex="0"` (§1).
- `aria-sort` from `sort`; the consumer's button in the head is what a
  keyboard user activates.
- No `aria-selected` on a row (§5).
- **Manual walkthrough:** Tab to the region, hear its name; arrow right
  scrolls the 240px cell; a screen reader reads "Amount, 1,240.00" in a
  body cell.

## Container behavior

`fill` at every width. Narrower than its columns' minimum, the region
scrolls; wider than their maximum, the table stretches to it.

## Usage

```tsx
<Table caption="Members" size="sm" striped>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
      <TableHead align="end" sort="descending">
        <Button variant="plain" size="sm" onClick={…}>Joined</Button>
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {members.map((m) => (
      <TableRow key={m.id} selected={selected.has(m.id)}>
        <TableCell>{m.name}</TableCell>
        <TableCell><Badge>{m.role}</Badge></TableCell>
        <TableCell align="end">{m.joined}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Don't

- Don't pass data; pass rows. `rows={…}` is a data layer.
- Don't put a table in a `Scroller`; it is one.
- Don't give a column a width; let the content size it, and `align` the
  numbers.
- Don't make a row a link by wrapping it; put a `Link` in a cell.

## Testing notes

- **Unit:** the region, focusable, named by the caption (one id, both
  ends), by `aria-label`, by `aria-labelledby`; the elements each part
  renders, `scope="col"` on a head; `size` and `striped` on the root;
  `align` and `sort`; `selected`; `tableProps` on the `<table>`; a
  nameless table rejected at the type level; refs, `className` and
  `style` on every part; axe both themes with a sorted head and a
  selected row.
- **Browser:** at 240px the region scrolls and its box is its parent's;
  at 960px the table's width is the region's; every cell but the last
  row's has a 1px block-end line; the header's surface and text; the cell
  padding per `size`; a striped table's even rows; a selected row's
  surface in the accent ramp; `align="end"`; tabular figures; the ring
  on the focused region; a head's text starts; a cell in the narrow
  cell is one line and a `wrap` cell more.
- **Break checks (D-035 §3):** drop `display: grid` (the table narrower
  than the region at 960px); drop the hairline rule; drop the header's
  surface; drop the selected row's surface; drop the head's `text-align:
  start` (the UA's centre).
- **Screenshot:** the invoices table per cell, plus sizes, striped,
  selected and a footer outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **A sticky header?** Vertical scrolling needs a height, and a `fill`
   component has none; the consumer's `Scroller` with a height owns it.
   Recommend not now.
2. **Column widths?** Not by prop. `Grid` spans were left to be revisited
   here (D-022 §10); a table sizes its columns by content, and a width is
   the consumer's `<col style>` through `tableProps` if it must.
3. **A `TableCaption` part?** No: §2.
