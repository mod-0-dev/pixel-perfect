# Grid

Two-dimensional layout in three modes. Spec:
[`tier-2-layout.md` §2.3](../specs/tier-2-layout.md#23-grid).

```tsx
import { Grid } from 'pixel-perfect';
```

## Usage

```tsx
// auto-fit: reflows continuously, no query, no breakpoint.
<Grid minItemInlineSize="16rem" gap="4">
  {workstreams.map((w) => <Card key={w.id} title={w.name} />)}
</Grid>

// A fixed column count.
<Grid columns={3} gap="4">…</Grid>

// A raw track template, for the asymmetric cases neither covers.
<Grid columns="auto minmax(0, 1fr)" gap="3" align="start">
  <Avatar name={entry.actor} size="sm" />
  <Text size="sm" truncate>{entry.message}</Text>
</Grid>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `columns` | `number \| string` | — | A number is `repeat(n, minmax(0, 1fr))`; a string goes to `grid-template-columns` unchanged |
| `minItemInlineSize` | `string` | — | `repeat(auto-fit, minmax(<value>, 1fr))` |
| `gap` | `'0' \| '1' \| … \| '9'` | `'0'` | A step of `--pp-space-*`. Mirrored as `data-pp-gap` |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | `align-items`. No `baseline` — it is meaningless across tracks |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `<div>` |

`columns` and `minItemInlineSize` are **mutually exclusive in the type**, not by
precedence. Passing both is a mistake, and silently picking a winner hides it
until someone wonders why their column count is ignored.

The active mode is mirrored as `data-mode="fixed" | "template" | "auto" | "none"`.

## Every generated track is `minmax(0, 1fr)`

Never bare `1fr`. `1fr` carries a `min-content` floor, so one long unbreakable
string in one cell pushes the whole grid past its container — the exact failure
[RULES §1](../RULES.md) exists to prevent, arriving through the back door.

If you write your own template, write `minmax(0, 1fr)` yourself.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-grid-template-columns` | per props | Track list |
| `--pp-grid-gap` | per `gap` | Gap between items |

`--pp-grid-template-columns` beats the props and works **from an ancestor**,
which is only true because the component writes a private property rather than
this one. Writing the public name into an inline style would make it
unoverridable and the escape hatch decorative — see
[D-024](../DECISIONS.md), which was found by a failing test rather than review.

## Container behavior

`minItemInlineSize` is the container-native mode: `auto-fit` + `minmax` reflows
continuously against the grid's own inline size, with no query, no breakpoint,
and no knowledge of the viewport. One column at 240px, two at 480px, four at
960px — from one declaration.

`columns={3}` is honest about being fixed. Three columns in a 240px sidebar are
three squashed columns, and that is the caller's decision.

## Don't

```tsx
// ✗ Fixed columns in a container you do not control.
<Grid columns={4}>{cards}</Grid>          // use minItemInlineSize

// ✗ Both modes at once. The type rejects this.
<Grid columns={3} minItemInlineSize="16rem" />

// ✗ Bare 1fr in a hand-written template: one long word in one cell and the
//   grid overflows its container.
<Grid columns="1fr 1fr" />                // minmax(0, 1fr) minmax(0, 1fr)

// ✗ display:grid is not role="grid". The ARIA grid pattern is a data widget
//   with a keyboard contract this component does not implement.
<Grid role="grid">…</Grid>

// ✗ Grid places items but must not re-order them. Reading order is DOM order.
<Grid columns={2}><Second style={{ gridColumn: 1 }} /><First /></Grid>
```

## Spans

Not supported, deliberately. `style={{ gridColumn: 'span 2' }}` covers it at the
call site until something in the library needs more. Revisit at `Table` (5.4).
