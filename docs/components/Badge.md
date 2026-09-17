# Badge

A small, non-interactive label for status or category. Spec:
[`tier-1-atoms.md` §1.8](../specs/tier-1-atoms.md#18-badge).

```tsx
import { Badge } from 'pixel-perfect';
```

## Usage

```tsx
<Badge tone="danger">Blocked</Badge>
<Badge tone="success" variant="solid" size="sm">Approved</Badge>
<Badge tone="warning" variant="outline">
  <Icon decorative><Clock /></Icon>
  In review
</Badge>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'ghost'` | |
| `tone` | `'neutral' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'neutral'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 20 / 24 / 28px tall |

Plus every `<span>` attribute. `ref` goes to the root. Mirrored as
`data-variant`, `data-pp-tone`, `data-size`.

| `variant` | Background | Border | Text |
| --- | --- | --- | --- |
| `solid` | tone solid | — | on-solid |
| `outline` | — | tone border | tone text |
| `ghost` | tone tint | tone border, subtle | tone text, strong |
| `plain` | — | — | tone text |

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-badge-bg` | per `variant` | Background |
| `--pp-badge-color` | per `variant` | Text |
| `--pp-badge-border-color` | per `variant` | Border |
| `--pp-badge-radius` | `--pp-radius-full` | Corners |
| `--pp-badge-padding-inline` | per `size` | Inline padding |

## Don't

```tsx
// ✗ A badge you can click is a button.
<Badge onClick={filter}>Blocked</Badge>

// ✗ hug means hug. It will not stretch, and there is no prop to make it.
<Badge style={{ width: '100%' }}>Blocked</Badge>

// ✗ Colour is not the message. Say the word.
<Badge tone="danger" />
```
