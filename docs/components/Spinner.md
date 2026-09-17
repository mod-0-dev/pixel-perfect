# Spinner

An indeterminate busy indicator. If you know the percentage, use `Progress`
(5.3). Spec: [`tier-1-atoms.md` §1.6](../specs/tier-1-atoms.md#16-spinner).

```tsx
import { Spinner } from 'pixel-perfect';
```

## Usage

```tsx
<Spinner label="Loading tasks" />

<Button disabled>
  <Spinner decorative size="sm" />
  Saving…
</Button>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | Announced via `role="status"`; visually hidden |
| `decorative` | `true` | — | `aria-hidden`; for a spinner inside an already-labelled control |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 16 / 20 / 24px — the icon scale |
| `tone` | `'neutral' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'neutral'` | |

**Exactly one of `label` or `decorative` is required, by type.**

Plus every `<span>` attribute except `role` and `aria-hidden`. `ref` goes to
the root. Mirrored as `data-size`, `data-pp-tone`.

## Motion

Rotates continuously. Under `prefers-reduced-motion: reduce` it becomes a slow
opacity pulse of the whole ring — a continuous, non-vestibular signal that
something is still happening. It never freezes.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-spinner-size` | per `size` | Box size |
| `--pp-spinner-color` | tone solid | Arc colour |
| `--pp-spinner-track-color` | tone border | Ring behind the arc |
| `--pp-spinner-duration` | 720ms | Rotation period |

## Don't

```tsx
// ✗ If you know the percentage, say the percentage.
<Spinner label={`${percent}% uploaded`} />   // Progress (5.3)

// ✗ Compile error, deliberately.
<Spinner />
```
