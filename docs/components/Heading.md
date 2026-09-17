# Heading

A heading whose visual size is decoupled from its semantic level. Spec:
[`tier-1-atoms.md` §1.2](../specs/tier-1-atoms.md#12-heading).

```tsx
import { Heading } from 'pixel-perfect';
```

## Usage

```tsx
<Heading level={1}>Northwind Go 4.0</Heading>

{/* Semantically a sub-heading, visually small. */}
<Heading level={3} size="sm" tone="muted">Readiness by workstream</Heading>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | — | **Required.** Renders `h1`–`h6` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | from `level` | 1→`3xl` … 6→`sm` |
| `tone` | as `Text` | `'neutral'` | |
| `weight` | as `Text` | `'semibold'` | |
| `align` | `'start' \| 'center' \| 'end'` | — | Logical |
| `truncate` | `boolean \| number` | — | One line with ellipsis, or clamp to N lines |
| `asChild` | `boolean` | `false` | `level` still drives the default size |

Plus every heading attribute. `ref` goes to the root element. Mirrored on the
DOM as `data-level`, `data-size`, `data-tone`, `data-weight`, `data-align`,
`data-truncate`, plus `data-pp-tone` for the four context tones.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-heading-color` | per `tone` | Text colour |
| `--pp-heading-size` | per `size` | Font size |
| `--pp-heading-weight` | `--pp-font-weight-semibold` | Weight |
| `--pp-heading-line-height` | `--pp-line-height-tight` | Leading |
| `--pp-heading-letter-spacing` | `--pp-letter-spacing-tight` | Tracking |

Headings wrap with `text-wrap: balance` so a two-line title never orphans one
word. Truncation switches balancing off.

## Don't

```tsx
// ✗ Do not pick a level for its size. That is what size is for.
<Heading level={5}>A visually small but structurally top-level title</Heading>

// ✗ Do not use Text with a big size where a heading belongs.
<Text size="lg" weight="bold">Section title</Text>
```
