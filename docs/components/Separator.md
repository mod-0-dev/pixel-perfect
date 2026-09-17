# Separator

A rule between two groups of content, horizontal or vertical. Spec:
[`tier-1-atoms.md` §1.5](../specs/tier-1-atoms.md#15-separator).

```tsx
import { Separator } from 'pixel-perfect';
```

## Usage

```tsx
<Stack gap="4">
  <Text>Engineering</Text>
  <Separator />
  <Text>Design</Text>
</Stack>

<Cluster gap="3">
  <Text>Draft</Text>
  <Separator orientation="vertical" />
  <Text>12 KB</Text>
</Cluster>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Mirrored as `data-orientation` |
| `decorative` | `boolean` | `true` | `true` → `aria-hidden`; `false` → exposed as a separator, with `aria-orientation` when vertical |

Always renders `<hr>`, which is a separator natively. Plus every `<hr>`
attribute except the ARIA ones the component owns. `ref` goes to the root.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-separator-color` | `--pp-color-border-subtle` | Line colour |
| `--pp-separator-thickness` | `--pp-border-width-1` | Line thickness |

A vertical separator stretches to its flex row (`align-self: stretch`). In a
non-flex parent it has no height to stretch to; that is the parent's to give.

## Don't

```tsx
// ✗ A separator is not a gap.
<Separator style={{ marginBlock: 24 }} />
```
