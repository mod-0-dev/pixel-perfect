# Kbd

A rendered keyboard key. Spec:
[`tier-1-atoms.md` §1.10](../specs/tier-1-atoms.md#110-kbd).

```tsx
import { Kbd } from 'pixel-perfect';
```

## Usage

```tsx
<Cluster gap="1">
  <Kbd>⌘</Kbd>
  <Kbd>K</Kbd>
</Cluster>

<Text>Press <Kbd>Esc</Kbd> to close.</Text>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 20 / 24 / 28px tall |

Plus every `<kbd>` attribute. `ref` goes to the root. Mirrored as `data-size`.

Symbol-only legends (`⌘`, `⌥`) are ambiguous to a screen reader. Where it
matters, pass an `aria-label`, or spell the modifier out.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-kbd-bg` | `--pp-color-bg-sunken` | Background |
| `--pp-kbd-color` | `--pp-color-text` | Legend |
| `--pp-kbd-border-color` | `--pp-color-border` | Border |
| `--pp-kbd-radius` | `--pp-radius-1` | Corners |
| `--pp-kbd-padding-inline` | per `size` | Inline padding |

## Don't

```tsx
// ✗ Not a code element. Inline code is Code.
<Kbd>npm install</Kbd>

// ✗ A chord is composition, not a prop.
<Kbd keys={['⌘', 'K']} />
```
