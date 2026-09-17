# Skeleton

A placeholder for content that has not arrived. Spec:
[`tier-1-atoms.md` §1.7](../specs/tier-1-atoms.md#17-skeleton).

```tsx
import { Skeleton } from 'pixel-perfect';
```

## Usage

```tsx
<div aria-busy="true">
  <Stack gap="2">
    <Skeleton shape="text" />
    <Skeleton shape="text" lines={3} />
  </Stack>
</div>

{/* The parent decides the height. */}
<AspectRatio ratio={16 / 9}><Skeleton /></AspectRatio>

{/* Or the custom property does. */}
<Skeleton style={{ '--pp-skeleton-block-size': 'var(--pp-size-12)' }} />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `shape` | `'text' \| 'block' \| 'circle'` | `'block'` | Not `variant` — see D-016 |
| `lines` | `number` | `1` | `text` only |
| `radius` | `'sm' \| 'md' \| 'lg' \| 'full'` | by shape | text `sm`, block `md`, circle `full` |

**There is no `height` or `width` prop.** Inline size is the parent's. Block
size: `text` derives it from `lines` and the type scale; `circle` defaults to
40px; `block` is `auto` — size it with the parent's layout or
`--pp-skeleton-block-size`.

Plus every `<div>` attribute except `children` and `aria-hidden`, which is
always `true`. `ref` goes to the root. Mirrored as `data-shape`,
`data-radius`, `data-lines`.

## Accessibility

Every skeleton is `aria-hidden`. The **container** owns the announcement: put
`aria-busy="true"` on the region that is loading, and a live message if the
wait is long. The skeleton cannot do that from the inside.

## Motion

A shimmer sweeps across. Under `prefers-reduced-motion: reduce` it stops and
the base tint stays — a static placeholder is fully legible.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-skeleton-block-size` | by shape | Height of `block` and `circle` |
| `--pp-skeleton-color` | `--pp-color-border-subtle` | Base tint |
| `--pp-skeleton-highlight` | one step lighter than the base, per theme | Sweep colour |
| `--pp-skeleton-radius` | by `radius` | Corners |

## Don't

```tsx
// ✗ No height prop, no width prop.
<Skeleton height={200} width="50%" />

// ✗ A bare skeleton says nothing to a screen reader. Mark the region busy.
<Skeleton shape="text" lines={4} />
```
