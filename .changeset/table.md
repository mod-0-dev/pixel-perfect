---
'pixel-perfect': minor
---

Add `Table` (5.4): a semantic table in a named, focusable region that
scrolls on the inline axis; `Table` / `TableHeader` / `TableBody` /
`TableFooter` / `TableRow` / `TableHead` / `TableCell` as named exports.
`caption` names the region; `size` is the row's density; `striped`;
`selected` on a row; `align` and `sort` (`aria-sort`) on cells. The table
is stretched to its region by a grid, never by a width. A Server
Component.
