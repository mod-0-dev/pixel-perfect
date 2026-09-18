# Input

A single-line text control. Spec:
[`tier-3c-inputs.md` §3.8](../specs/tier-3c-inputs.md).

```tsx
import { Field, Input } from 'pixel-perfect';
```

Put it in a [`Field`](Field.md). The field owns the label, the description, the
error and every ARIA relationship between them, and `Input` reads its `size`,
`required`, `disabled` and invalid state from it through `useField()`. It works
standalone too — in a table cell, a toolbar, a search bar — and then the props
are yours to set.

## Usage

```tsx
<Field label="Email address" description="We only use this to sign you in.">
  <Input type="email" autoComplete="email" />
</Field>
```

Standalone, you supply the name yourself:

```tsx
<Input aria-label="Search orders" type="search" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `type` | see below | `'text'` | An allow-list, not every HTML input type |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The control scale — 32 / 40 / 48px |
| `invalid` | `boolean` | field, then `false` | Sets `aria-invalid` and the danger tone |
| `disabled` | `boolean` | field, then `false` | Native |
| `required` | `boolean` | field, then `false` | Native |
| `readOnly` | `boolean` | `false` | Native. Not the same as `disabled` — see below |
| `className` / `style` | | — | Land on the **root**, which is the box |

Plus every other `<input>` attribute — `placeholder`, `autoComplete`, `name`,
`value`, `defaultValue`, `onChange`, `aria-*` — all of which land on the
`<input>` itself. `ref` gives you the `<input>`, not the wrapper. Exported as
`InputProps` and `InputType`.

`onChange` is React's own: it receives an **event**, not a bare value, so
`react-hook-form`'s `register()` works and `event.target.validity` is readable.
Controlled and uncontrolled both come from React unchanged.

### `type`

`text`, `email`, `password`, `search`, `tel`, `url`, `number`, `date`,
`datetime-local`, `month`, `week`, `time`.

Deliberately absent: `checkbox` and `radio` (those are `Checkbox` and `Radio`),
`button` / `submit` / `reset` / `image` (that is `Button`), `range` (`Slider`),
`file` (`FileUpload`), `color` (a swatch, not a text surface), and `hidden`
(which needs no component at all).

## The precedence rule

An explicit prop beats the field, which beats the default:

```tsx
<Field label="Email" size="lg" disabled>
  <Input size="sm" disabled={false} />   {/* sm, and editable */}
</Field>
```

Including the awkward half: a control that opts out of a disabled field *is*
enabled. "Explicit wins" is a rule you can hold in your head; "explicit wins
except for disabled" is one you have to look up.

## Disabled vs read-only

| | Focusable | Selectable | Submitted | Looks |
| --- | --- | --- | --- | --- |
| `disabled` | no | no | no | dimmed text, sunken fill |
| `readOnly` | yes | yes | yes | sunken fill, ordinary text and border |

Use `readOnly` for a value the user should be able to read, copy and submit but
not edit. Use `disabled` for one that is not available at all.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-input-height` | `--pp-control-height-<size>` | Block size |
| `--pp-input-padding-inline` | `--pp-control-padding-inline-<size>` | Inline padding |
| `--pp-input-radius` | `--pp-control-radius` | Corners |
| `--pp-input-bg` | `--pp-color-bg-surface` | Fill |
| `--pp-input-border-color` | `--pp-color-border` | Edge |
| `--pp-input-color` | `--pp-color-text` | Text |
| `--pp-input-placeholder-color` | `--pp-color-text-muted` | Placeholder |

Set them on the component or on any ancestor — they are read through
`var(--pp-input-*, …)`, so an ancestor override still wins (D-024).

## Anatomy

```html
<span class="pp-input" data-size data-invalid data-disabled data-readonly>
  <input class="pp-input__control">
</span>
```

**Two elements, because an `<input>` does not fill.** RULES §1 says a block
element with no width declaration already fills its parent; that is true for a
`<div>` and false for a form control, which carries an intrinsic inline size
from the HTML `size` attribute — measured at 185px inside a 600px parent. A grid
item with auto width *does* stretch, so the root is a one-cell grid and no width
is declared anywhere. See [D-040](../DECISIONS.md#d-040).

State lives on the root, so you can style off it without knowing our internals:

```css
.pp-input[data-invalid] .pp-input__control { /* … */ }
```

## Don't

```tsx
// ✗ A placeholder is not a label. It disappears on the first keystroke and
//   leaves the field with no accessible name.
<Input placeholder="Email address" />

// ✓
<Field label="Email address">
  <Input placeholder="you@example.com" />
</Field>
```

```tsx
// ✗ `size` is the control scale, never the HTML attribute — that one counts
//   characters, which is a control sizing itself. It is not in the props type.
<Input size={40} />
```

```tsx
// ✗ type="number" is allowed and is still usually the wrong tool: it mutates
//   its value on a scroll wheel over a focused field, rejects a locale decimal
//   comma, and reports value === '' for anything it cannot parse — so `1,5`
//   typed in a German locale is silently lost.
<Input type="number" />

// ✓ until NumberInput (3.14), which is type="text" for these reasons
<Input inputMode="numeric" pattern="[0-9]*" />
```

```tsx
// ✗ Don't reach for the wrapper. className and style already land on it, and
//   the state attributes are there for exactly this.
<div className="my-input-wrapper"><Input /></div>
```
