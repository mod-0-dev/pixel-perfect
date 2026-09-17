# Center

Centres its children in the box it was given. Spec:
[`tier-2-layout.md` §2.5](../specs/tier-2-layout.md#25-center).

```tsx
import { Center } from 'pixel-perfect';
```

It does **not** constrain a measure. Centring a column of text by giving it a
max-width is `Container`'s job, and conflating the two is why "Center" means
three different things across the ecosystem.

## Usage

```tsx
<Center gap="3" style={{ '--pp-center-min-block-size': 'var(--pp-space-9)' }}>
  <Spinner size="lg" tone="accent" decorative />
  <Text tone="muted">Loading the task board…</Text>
</Center>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `axis` | `'inline' \| 'block' \| 'both'` | `'both'` | Mirrored as `data-axis` |
| `gap` | `'0' \| '1' \| … \| '9'` | `'0'` | Children stack vertically, so this is the gap between them |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `<div>` |

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-center-min-block-size` | `auto` | Minimum height to centre within |
| `--pp-center-gap` | per `gap` | Gap between children |

## There is no height prop

Block-axis centring needs a block size, and a `fill` component should not invent
one. It comes from the parent — a grid row, a flex parent with a height — or
from `--pp-center-min-block-size`. That is the same answer `Skeleton` gives to
the same problem ([D-016 §4](../DECISIONS.md)), and the sizing contract wins over
the convenience both times.

## Don't

```tsx
// ✗ Center does not constrain a measure. That is Container.
<Center><Text>{longArticleBody}</Text></Center>

// ✗ There is no height prop, and there will not be one. The type rejects this.
<Center minHeight="50vh">…</Center>
```
