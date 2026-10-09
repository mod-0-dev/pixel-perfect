# Table

A semantic table in a named region that scrolls: rows and columns of
data the reader scans, with the native element's semantics and nothing
that needs a data layer. Spec: [`Table.md`](../specs/Table.md).

```tsx
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '@mod-0-dev/pixel-perfect';
```

A Server Component. Sorting and selection are hooks: the header says how
it is sorted (`sort`), the row says it is selected (`selected`), and
deciding either is your client component's job.

## Usage

A table must have a name: `caption` (rendered as the `<caption>`, and the
region's name), or `aria-label`, or `aria-labelledby` pointing at a
heading.

```tsx
<Table caption="Invoices for September">
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Customer</TableHead>
      <TableHead align="end">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.id}</TableCell>
        <TableCell>{row.customer}</TableCell>
        <TableCell align="end">{row.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell align="end">{total}</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

Narrower than its columns, the region scrolls inside its own box, never
the page; it is a tab stop so a keyboard user can scroll it, and its
name is what they hear. Wider, the table stretches to it.

Sorting and selection, from your client component:

```tsx
<TableHead align="end" sort={sort.column === 'amount' ? sort.direction : 'none'}>
  <Button variant="plain" size="sm" onClick={() => sortBy('amount')}>Amount</Button>
</TableHead>

<TableRow selected={selected.has(row.id)}>
  <TableCell><Checkbox checked={selected.has(row.id)} onCheckedChange={…} aria-label={`Select ${row.id}`} /></TableCell>
  …
</TableRow>
```

`size` is the row's density; `striped` paints even rows on the sunken
surface for a wide table the eye loses its row in.

```tsx
<Table caption="Members" size="sm" striped>…</Table>
```

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `Table` | `<div role="region" tabindex="0">` around `<table>` | `caption`, `size`, `striped`, `tableProps` |
| `TableHeader` | `<thead>` | On the sunken surface |
| `TableBody` | `<tbody>` | |
| `TableFooter` | `<tfoot>` | Sunken, medium weight: totals |
| `TableRow` | `<tr>` | `selected` |
| `TableHead` | `<th scope="col">` | `align`, `sort` |
| `TableCell` | `<td>` | `align`, `wrap` |

Every cell uses tabular figures, so a column of numbers lines up by
digit; `align="end"` puts them where numbers go. A cell does not wrap
unless you say `wrap`: an id or a date broken across two lines is worse
than a region that scrolls. Say it on the prose column:

```tsx
<TableCell wrap>{row.description}</TableCell>
```

## Accessibility

The native table: a screen reader announces the column header with each
cell. The region is named by the caption (one id, both ends) and is
focusable so it can be scrolled from the keyboard. `sort` is written as
`aria-sort`. A selected row has no `aria-selected` (not allowed on a row
outside a grid); the checkbox you put in it carries the state.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-table-border-color` | `--pp-color-border-subtle` | The frame and the hairlines |
| `--pp-table-radius` | `--pp-radius-3` | The frame's corners |
| `--pp-table-header-bg` | `--pp-color-bg-sunken` | The header and the footer |
| `--pp-table-stripe-bg` | `--pp-color-bg-sunken` | Even rows when striped |
| `--pp-table-selected-bg` | `--pp-tone-bg` | A selected row, in the accent ramp |
| `--pp-table-padding-block` | per `size` | Every cell |
| `--pp-table-padding-inline` | per `size` | Every cell |

## Anatomy

```
<div class="pp-table" role="region" tabindex="0" aria-labelledby="…">
  └── <table class="pp-table__table">
        ├── <caption class="pp-table__caption">
        ├── <thead class="pp-table__header">  <tr class="pp-table__row">  <th class="pp-table__head">
        ├── <tbody class="pp-table__body">    <tr class="pp-table__row">  <td class="pp-table__cell">
        └── <tfoot class="pp-table__footer">
```

## Don't

```tsx
// ✗ Data. Pass rows; a data layer is a library of its own.
<Table rows={invoices} columns={columns} />

// ✗ No name. The types reject it; the region's tab stop would say nothing.
<Table>…</Table>

// ✗ A width on a column. Let the content size it and align the numbers.
<TableHead style={{ width: 120 }}>Amount</TableHead>

// ✗ A Scroller around it. It is one.
<Scroller><Table caption="…">…</Table></Scroller>
```
