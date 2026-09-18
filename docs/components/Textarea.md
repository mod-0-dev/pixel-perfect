# Textarea

A multi-line text control on the same surface as [`Input`](Input.md). Spec:
[`tier-3c-inputs.md` §3.9](../specs/tier-3c-inputs.md).

```tsx
import { Field, Textarea } from 'pixel-perfect';
```

Put it in a [`Field`](Field.md). The field owns the label, the description, the
error and every ARIA relationship between them, and `Textarea` reads its `size`,
`required`, `disabled` and invalid state from it through `useField()`. It works
standalone too, and then the props are yours to set.

It is not a rich-text editor and not a code editor — 5.12 `CodeBlock` is the
read-only one, and neither of them is this.

## Usage

```tsx
<Field label="Release notes" description="Markdown is supported.">
  <Textarea rows={6} />
</Field>
```

Growing with the content, instead of scrolling inside a fixed box:

```tsx
<Field label="Release notes">
  <Textarea rows={3} autoResize />
</Field>
```

Standalone, you supply the name yourself:

```tsx
<Textarea aria-label="Notes" rows={2} />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `rows` | `number` | `3` | Native. Also the floor `autoResize` never goes below |
| `autoResize` | `boolean` | `false` | Grows with content. Forces `resize: none` |
| `resize` | `'none' \| 'vertical'` | `'vertical'` | No `horizontal` — see **Don't** |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The control scale — type and padding, never a height |
| `invalid` | `boolean` | field, then `false` | Sets `aria-invalid` and the danger tone |
| `disabled` | `boolean` | field, then `false` | Native |
| `required` | `boolean` | field, then `false` | Native |
| `readOnly` | `boolean` | `false` | Native. Not the same as `disabled` |
| `className` / `style` | | — | Land on the **root**, which is the box |

Plus every other `<textarea>` attribute — `placeholder`, `name`, `value`,
`defaultValue`, `onChange`, `maxLength`, `aria-*` — all of which land on the
`<textarea>` itself. `ref` gives you the `<textarea>`, not the wrapper. Exported
as `TextareaProps`.

## The precedence rule

An explicit prop beats the field, which beats the default — for `size`,
`required`, `disabled` and `invalid` alike, including `disabled={false}` inside
a disabled `Field`, which really does enable the control. "Explicit wins" is a
rule you can hold in your head; "explicit wins except for disabled" is one you
have to look up.

## Auto-resize

Opt-in, and implemented in JavaScript: on every input the control's height is
reset to `auto`, `scrollHeight` is read, and the result is written back to
`block-size`.

The reset is the whole mechanism. `scrollHeight` is max(content, client), so
measuring against a height the component wrote itself can only ratchet upward —
the control would grow with the text and never shrink when it is deleted. The
reset is also where the `rows` floor comes from, for free: with no height of its
own the element falls back to `rows`, and `scrollHeight` cannot report less than
that. There is no second source of truth for the minimum to drift from.

It re-measures on `ResizeObserver` too, because a width change reflows the text
and changes the height it needs. Only on a **width** change: writing
`block-size` is itself a resize, so watching height would re-enter forever.

**CSS `field-sizing: content` is deliberately not used**, even where it is
supported. Shipping both means two different resize behaviours depending on the
browser, and the one that is easy to test is the one that is not running for
your users. One mechanism, one behaviour; revisit when support is ubiquitous and
the JavaScript can be deleted outright rather than kept as a fallback.

Auto-resize changes the element's height while typing. That is a visual change
and not a content change, so nothing is announced and there is no live region.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-textarea-padding-block` | derived — see below | Block padding |
| `--pp-textarea-padding-inline` | `--pp-control-padding-inline-<size>` | Inline padding |
| `--pp-textarea-radius` | `--pp-control-radius` | Corners |
| `--pp-textarea-bg` | `--pp-color-bg-surface` | Fill |
| `--pp-textarea-border-color` | `--pp-color-border` | Edge |
| `--pp-textarea-color` | `--pp-color-text` | Text |
| `--pp-textarea-placeholder-color` | `--pp-color-text-muted` | Placeholder |
| `--pp-textarea-min-block-size` | `auto` | A floor in CSS rather than in `rows` |

There is deliberately **no `--pp-textarea-height`**. The height is `rows`, the
content, or yours to set — a component that writes one takes the block axis away
from you silently.

The block padding is computed rather than picked off the space scale:

```css
(control-height − line box − borders) / 2
```

which is 3.8 / 7.8 / 10.2px at `sm` / `md` / `lg`. The space scale can express
the first two and cannot express the third, so `lg` would be 4.4px short or
3.6px over — the largest control being the one that visibly disagrees with the
`Button` beside it. Deriving it from the tokens `Input` already reads makes a
one-row `Textarea` exactly an `Input`'s height by construction. See
[D-043](../DECISIONS.md#d-043).

Set any of them on the component or on any ancestor — they are read through
`var(--pp-textarea-*, …)`, so an ancestor override still wins (D-024).

## Anatomy

```html
<span class="pp-textarea" data-size data-resize data-auto-resize data-invalid
      data-disabled data-readonly>
  <textarea class="pp-textarea__control"></textarea>
</span>
```

**Two elements, because a `<textarea>` does not fill.** RULES §1 says a block
element with no width declaration already fills its parent; that is true for a
`<div>` and false for a form control — measured at 182px inside a 600px parent.
A grid item with auto width *does* stretch, so the root is a one-cell grid and
no width is declared anywhere. See [D-040](../DECISIONS.md#d-040).

The block axis is a different question, and RULES §1 does not govern it. `rows`
stays, and `autoResize` writes `block-size`; `Skeleton`'s `lines` is the
precedent (D-025).

State lives on the root, so you can style off it without knowing our internals:

```css
.pp-textarea[data-invalid] .pp-textarea__control { /* … */ }
```

## Don't

```tsx
// ✗ There is no `horizontal`, and this is why. A user-widened textarea
//   overflows the Field's grid column and takes the layout with it — the one
//   thing the sizing contract exists to prevent, handed to the end user as a
//   drag handle.
<Textarea style={{ resize: 'horizontal' }} />
```

```tsx
// ✗ autoResize with rows={1} is a control that jumps a line the moment anyone
//   types, and collapses again on backspace. rows is the floor, so give it one.
<Textarea autoResize rows={1} />

// ✓
<Textarea autoResize rows={3} />
```

```tsx
// ✗ A placeholder is not a label. It disappears on the first keystroke and
//   leaves the field with no accessible name.
<Textarea placeholder="Release notes" />

// ✓
<Field label="Release notes">
  <Textarea placeholder="What changed?" />
</Field>
```

```tsx
// ✗ Don't set a height. The component has no --pp-textarea-height for the same
//   reason: rows is the API for "how tall", and a fixed height turns a control
//   that grows into a box that scrolls.
<Textarea style={{ height: 200 }} />

// ✓
<Textarea rows={8} />
```
