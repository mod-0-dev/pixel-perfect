# Icon

Consistent sizing, colour and accessible-name handling for any SVG. Ships no
icons. Spec: [`tier-1-atoms.md` §1.3](../specs/tier-1-atoms.md#13-icon).

```tsx
import { Icon } from 'pixel-perfect';
```

## Usage

```tsx
<Icon decorative><ChevronRight /></Icon>

<Icon label="Blocked" size="sm"><AlertCircle /></Icon>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | Accessible name; sets `role="img"` |
| `decorative` | `true` | — | `aria-hidden`; the icon means nothing on its own |
| `size` | `'sm' \| 'md' \| 'lg' \| 'inherit'` | `'inherit'` | `inherit` is `1em`; the steps are 16 / 20 / 24px |
| `children` | `ReactNode` | — | **Required.** The SVG |

**Exactly one of `label` or `decorative` is required, by type.** Omitting both
or passing both is a compile error.

Plus every `<span>` attribute except `role`, `aria-label` and `aria-hidden`,
which the component owns. `ref` goes to the root.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-icon-size` | `1em` or per `size` | Box size |
| `--pp-icon-color` | `currentColor` | The wrapper's `color`; SVGs drawn with `currentColor` follow it |

`fill` and `stroke` are never forced. Draw your SVGs with `currentColor`.

## Don't

```tsx
// ✗ Compile error, deliberately.
<Icon><Search /></Icon>

// ✗ An icon that does something is a control.
<Icon label="Close" onClick={close}><X /></Icon>   // IconButton (3.2)
```
