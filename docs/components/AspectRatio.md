# AspectRatio

Reserves a box of a given shape before its content loads. Spec:
[`tier-2-layout.md` §2.7](../specs/tier-2-layout.md#27-aspectratio).

```tsx
import { AspectRatio } from 'pixel-perfect';
```

Inline size comes from the parent exactly as always; block size is
`aspect-ratio` applied to it. That is not the component choosing a size — it is
choosing a **shape**, with the size still entirely the parent's.

## Usage

```tsx
<AspectRatio ratio={16 / 9}>
  <img src={asset.url} alt={asset.description} />
</AspectRatio>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `ratio` | `number` | — | **Required.** `16 / 9`, `1`, `4 / 3`. There is no ratio that is right when you did not think about it |

Plus every `<div>` attribute. No `asChild` — a substituted root would lose the
shape.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-aspect-ratio` | per `ratio` | The ratio |
| `--pp-aspect-ratio-radius` | `--pp-radius-0` | Corner rounding of the clipped box |

## How it stretches its child

The root is a grid and the child is placed at `1 / 1` with `block-size: 100%`.
A single grid item stretches on the inline axis by default, so the child fills
both axes **without the component ever declaring `inline-size`** — which it is
not allowed to do and, unlike `Icon` ([D-019](../DECISIONS.md)), has no case for.

`img`, `video`, `iframe`, `canvas` and `svg` children get `object-fit: cover`.
`fill` would distort, and `contain` would letterbox inside the very box that
exists to stop letterboxing.

## Accessibility

No role. The child keeps its own semantics — an `<img>` still needs its `alt`,
an `<iframe>` its `title`. Reserving the box does not describe what goes in it.

## Don't

```tsx
// ✗ Two children. The second is placed on top of the first.
<AspectRatio ratio={1}><img /><Badge /></AspectRatio>

// ✗ A ratio to force a height on arbitrary content. It will be clipped.
<AspectRatio ratio={3}><Text>{body}</Text></AspectRatio>

// ✗ No ratio. The type rejects this.
<AspectRatio><img /></AspectRatio>
```
