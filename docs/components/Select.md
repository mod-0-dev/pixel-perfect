# Select

The native `<select>` on the shared control surface, with our chevron. Spec:
[`tier-3c-inputs.md` §3.13](../specs/tier-3c-inputs.md).

```tsx
import { Field, Select } from 'pixel-perfect';
```

Put it in a [`Field`](Field.md). The field owns the label, the description, the
error and every ARIA relationship between them, and `Select` reads its `size`,
`required`, `disabled` and invalid state from it through `useField()`. It works
standalone too, and then the props are yours to set.

**The platform popup is kept, and that is the whole argument for this component.**
`appearance: none` repaints the closed box and nothing else, so the open list
stays the operating system's — a wheel on iOS, a listbox on desktop, correct
with a screen reader and in a right-to-left locale without us writing a line.
The custom listbox, with typeahead, async options and multi-select, is
`Combobox` (4.11).

## Usage

```tsx
<Field label="Environment" description="Where this deploys.">
  <Select placeholder="Choose one…">
    <option value="preview">Preview</option>
    <option value="production">Production</option>
  </Select>
</Field>
```

Options are `children`, so an `<optgroup>` and a disabled option are just markup:

```tsx
<Select placeholder="Choose a region…">
  <optgroup label="Europe">
    <option value="eu-west">eu-west-1</option>
  </optgroup>
  <optgroup label="North America">
    <option value="us-west" disabled>us-west-2 — at capacity</option>
  </optgroup>
</Select>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `placeholder` | `string` | — | Renders a disabled, hidden `<option value="">` and selects it |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The control scale — 32 / 40 / 48px |
| `invalid` | `boolean` | field, then `false` | Sets `aria-invalid` and the danger tone |
| `disabled` | `boolean` | field, then `false` | Native |
| `required` | `boolean` | field, then `false` | Native |
| `multiple` | `never` | — | A type error. Multi-select is `Combobox` (4.11) |
| `className` / `style` | | — | Land on the **root**, which is the box |

Plus every other `<select>` attribute — `name`, `value`, `defaultValue`,
`onChange`, `autoComplete`, `aria-*` — all of which land on the `<select>`
itself. `ref` gives you the `<select>`, not the wrapper. Exported as
`SelectProps`.

`onChange` is React's own: it receives an **event**, not a bare value, so
`react-hook-form`'s `register()` works and `event.target.value` is readable.
Controlled and uncontrolled both come from React unchanged.

## The precedence rule

An explicit prop beats the field, which beats the default:

```tsx
<Field label="Environment" size="lg" disabled>
  <Select size="sm" disabled={false} />   {/* sm, and operable */}
</Field>
```

Including the awkward half: a control that opts out of a disabled field *is*
enabled. "Explicit wins" is a rule you can hold in your head; "explicit wins
except for disabled" is one you have to look up.

## The placeholder

`placeholder` renders a `<option value="" disabled hidden>` first and makes it
the initial selection. The third of those is work rather than a description: the
HTML *ask for a reset* algorithm selects the first option **that is not
disabled**, so left alone a disabled placeholder is skipped and you silently get
option two. The component seeds `defaultValue=""` when you have given neither
`value` nor `defaultValue`, which selects it through the `value` setter, where
no such exclusion exists. Give either one and yours wins.

A `required` select whose placeholder is still selected fails constraint
validation on submit, because the placeholder's value is the empty string. That
is the browser's mechanism, not ours.

The muted text comes from `:has(option[data-pp-placeholder]:checked)` — the
platform's own state — so it stays correct after a `form.reset()` and after a
write through the ref, neither of which tells React anything. `data-placeholder`
on the root is for you to style off, and it is **only present when the select is
controlled**, because that is the only case in which React knows. See
[D-049](../DECISIONS.md#d-049).

## No open state, no read-only

There is no `data-state="open"`. The native popup's openness is not observable
from script, and an attribute that is wrong half the time is worse than not
having one.

There is no `readOnly` either. HTML has no `readonly` for `<select>`, and faking
one with `pointer-events` leaves the control fully operable from the keyboard.
A value the user may read but not change is `disabled` plus a hidden input, or
it is not a select.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-select-height` | `--pp-control-height-<size>` | Block size |
| `--pp-select-padding-inline` | `--pp-control-padding-inline-<size>` | Both edges **and** the chevron's reserved room |
| `--pp-select-radius` | `--pp-control-radius` | Corners |
| `--pp-select-bg` | `--pp-color-bg-surface` | Fill |
| `--pp-select-border-color` | `--pp-color-border` | Edge |
| `--pp-select-color` | `--pp-color-text` | Text |
| `--pp-select-placeholder-color` | `--pp-color-text-muted` | Placeholder text |
| `--pp-select-indicator-color` | `--pp-color-text-muted` | Chevron |

Set them on the component or on any ancestor — they are read through
`var(--pp-select-*, …)`, so an ancestor override still wins (D-024).

## Anatomy

```html
<span class="pp-select" data-size data-placeholder data-invalid data-disabled>
  <select class="pp-select__input">
    <option value="" disabled hidden data-pp-placeholder>…</option>
  </select>
  <span class="pp-icon pp-select__indicator" aria-hidden="true"><svg/></span>
</span>
```

**Two elements, because a form control does not fill.** A native `<select>` is
the worst of the three surfaces: it sizes to its *longest option*, which measured
52px inside a 600px parent. A grid item with auto width does stretch, so the root
is a one-cell grid and no width is declared anywhere
([D-040](../DECISIONS.md#d-040)). The chevron stacks in the same cell, offset
with `inset-inline-end` so it moves to the other side of the box in an RTL
layout, and `pointer-events: none` so every click reaches the control underneath.

State lives on the root, so you can style off it without knowing our internals:

```css
.pp-select[data-invalid] .pp-select__input { /* … */ }
```

## Don't

```tsx
// ✗ No options prop. An array cannot express an optgroup, a disabled option
//   or a data-* attribute without us inventing a schema (RULES §5.6).
<Select options={[{ label: 'Preview', value: 'preview' }]} />

// ✓
<Select>
  <option value="preview">Preview</option>
</Select>
```

```tsx
// ✗ multiple is a type error. A multi-select has a different keyboard model
//   and a different visual; it is Combobox (4.11). It is stripped at runtime
//   too, so ignoring the type gets you a single select rather than a mess.
<Select multiple />
```

```tsx
// ✗ A placeholder is not a label. It is the empty state of the value, and a
//   select with no field around it has no accessible name at all.
<Select placeholder="Environment" />

// ✓
<Field label="Environment">
  <Select placeholder="Choose one…" />
</Field>
```

```tsx
// ✗ `size` is the control scale. On a <select> the HTML attribute means "show
//   this many rows", which turns it into a list box — a different widget with
//   a different keyboard model. It is not in the props type and never set.
<Select size={5} />
```

```tsx
// ✗ Don't read data-placeholder on an uncontrolled Select. It is absent there
//   on purpose: React is never told about a change the DOM made by itself, and
//   an attribute that is right until the user touches it is worse than none.
//   Style the state with :has(option[data-pp-placeholder]:checked) instead.
<Select placeholder="Choose one…" />
```
