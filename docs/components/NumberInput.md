# NumberInput

A numeric text field with steppers, bounds, a step, and formatting that is
correct outside en-US. Spec:
[`tier-3d-composite.md` §3.14](../specs/tier-3d-composite.md).

```tsx
import { Field, NumberInput } from 'pixel-perfect';
```

Put it in a [`Field`](Field.md). The field owns the label, the description, the
error and every ARIA relationship between them, and `NumberInput` reads its
`size`, `required`, `disabled` and invalid state from it through `useField()`.
It works standalone too, and then the props are yours to set.

**It is `type="text"` with `role="spinbutton"`, never `type="number"`.** That
input mutates its value on a scroll wheel over a focused field, rejects a locale
decimal comma, and reports `value === ''` for anything it cannot parse — so
`1,5` typed in a German locale is silently lost. It also cannot hold `1.234,5`,
which makes formatting impossible for a second, independent reason.

## Usage

```tsx
<Field label="Quantity" description="Up to 10 per order.">
  <NumberInput min={1} max={10} defaultValue={1} />
</Field>
```

Controlled, with the empty value spelled `null`:

```tsx
const [quantity, setQuantity] = useState<number | null>(1);

<Field label="Quantity">
  <NumberInput min={1} max={10} value={quantity} onValueChange={setQuantity} />
</Field>
```

Formatted, which needs a locale:

```tsx
<Field label="Budget">
  <NumberInput
    locale="de-DE"
    formatOptions={{ style: 'currency', currency: 'EUR' }}
    min={0}
    step={0.5}
  />
</Field>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number \| null` | — | Controlled. `null` is empty |
| `defaultValue` | `number \| null` | `null` | Uncontrolled seed |
| `onValueChange` | `(value: number \| null) => void` | — | Fires on **commit**, never per keystroke |
| `min` | `number` | unbounded | Clamped on commit. Also the stepping base |
| `max` | `number` | unbounded | Clamped on commit |
| `step` | `number` | `1` | Snapped on commit; decides `inputMode` |
| `locale` | `string` | none | Absent means no formatting at all — see below |
| `formatOptions` | `Intl.NumberFormatOptions` | none | Passed to `Intl.NumberFormat(locale, …)` |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The control scale |
| `invalid` | `boolean` | field, then `false` | Sets `data-pp-tone="danger"` and `aria-invalid` |
| `disabled` | `boolean` | field, then `false` | Native attribute; both steppers disabled |
| `required` | `boolean` | field, then `false` | Native attribute |
| `readOnly` | `boolean` | `false` | Steppers disabled, arrow keys inert, value still submitted |
| `incrementLabel` | `string` | `'Increase'` | Accessible name for the up stepper |
| `decrementLabel` | `string` | `'Decrease'` | Accessible name for the down stepper |
| `className` / `style` | | — | Land on the **root**, which is the box |

Everything else spreads onto the `<input>`: `name`, `placeholder`, `onBlur`,
`aria-*`. `ref` goes to the `<input>`, not to the wrapper.

`size` is the control scale, never the HTML `size` attribute — that one counts
characters and is a control sizing itself. It is absent from the props type and
never set.

## `null` is empty. `undefined` is uncontrolled.

They are not the same word, and the difference is the one thing worth reading
this page for.

```tsx
// ✗ `quantity` is optional, so this is `undefined` the first time the field is
//   blank — which switches the component to uncontrolled mid-life. It stops
//   answering to you, and nothing says why.
<NumberInput value={form.quantity} onValueChange={setQuantity} />

// ✓
<NumberInput value={form.quantity ?? null} onValueChange={setQuantity} />
```

The type makes the wrong version an error at the call site rather than a
behaviour change at runtime.

## Clamping and snapping happen on commit

`min`, `max` and `step` are applied on blur, on a stepper press, on an arrow key
and on <kbd>Enter</kbd> — **never while you are typing**.

Snapping per keystroke is the defect every hand-rolled number field ships with.
With `step={10}`, typing `1` would become `10` before the `5` arrived, so `15`
could not be typed at all. With `min={10}`, typing `5` would jump the caret past
the digit still being written.

Text that is not a number **reverts** to the last committed value on blur. A
typo should not silently destroy data you did not ask to delete. An empty field
is parseable as "nothing" and commits `null`.

## Formatting is opt-in, and needs a locale

`new Intl.NumberFormat()` with no locale resolves the *runtime's* — Node's on
the server, the user's in the browser. `1234.5` would render `1,234.5` from a
container in en-US and `1.234,5` in a German browser, which is a hydration
mismatch in a component that never mentions the viewport.

| `locale` | Display | Parsing |
| --- | --- | --- |
| absent | `String(value)` | strict `Number()` |
| `"de-DE"` | `Intl.NumberFormat("de-DE", formatOptions)` | that locale's separators |

Parsing is derived from the *same* `Intl.NumberFormat` as the display: the
separators and the digits are discovered with `formatToParts`, never hardcoded,
so a locale nobody here has heard of round-trips, and so does a numbering system
that is not Latin.

The field is **not reformatted while it has focus**. Your text is yours until
you leave; it is normalised on blur.

## Native form submission

Without `locale` the displayed text is `String(value)`, so a `name` submits a
plain number and <kbd>Enter</kbd> submits the *clamped* value rather than the
typed one.

**With `locale` set, native submission carries localised text** — `1.234,5`, not
`1234.5`. That is inherent: the box holds what the user reads. If you submit
natively, either leave `locale` off or read the value from `onValueChange`.

## The steppers

Two `<button type="button">` elements inside the box. They are **not tab stops**:
<kbd>↑</kbd> and <kbd>↓</kbd> do exactly the same job, and six number fields
would otherwise carry eighteen tab stops. They keep accessible names, so a
pointer user and a screen reader user in browse mode both keep them.

They disable at the bound they reach, so the control says stepping has stopped
working instead of appearing to ignore a press. On an empty field the first
press commits the bound that exists — `min` going up, `max` going down.

There is no press-and-hold auto-repeat.

## Keyboard

| Key | Behavior |
| --- | --- |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Step by `step`, clamped |
| <kbd>Page Up</kbd> / <kbd>Page Down</kbd> | Step by `step × 10` |
| <kbd>Home</kbd> / <kbd>End</kbd> | `min` / `max`, when they are given |
| <kbd>Enter</kbd> | Commit the typed text; the form still submits |
| <kbd>Tab</kbd> | **One** stop per field |

Nothing is bound to the scroll wheel, deliberately.

## Accessibility

`role="spinbutton"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and
`aria-valuetext`. The bounds are emitted only when you give them — an unbounded
field does not claim bounds — and `aria-valuenow` is **omitted while there is no
value**, which covers an empty field and a half-typed `1.`. ARIA 1.2 permits
this; announcing a number that is not what is in the box is worse than
announcing nothing.

A spinbutton's accessible name is required. Inside a `Field` you get it; standalone,
supply `aria-label` or an axe check will tell you.

## Styling

Component-scoped custom properties, per RULES §3:

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-number-input-height` | `--pp-control-height-<size>` | Block size |
| `--pp-number-input-padding-inline` | `--pp-control-padding-inline-<size>` | Both inline edges |
| `--pp-number-input-radius` | `--pp-control-radius` | Corners |
| `--pp-number-input-bg` | `--pp-color-bg-surface` | Fill |
| `--pp-number-input-border-color` | `--pp-color-border` | Edge |
| `--pp-number-input-color` | `--pp-color-text` | Text |
| `--pp-number-input-placeholder-color` | `--pp-color-text-muted` | Placeholder |
| `--pp-number-input-stepper-color` | `--pp-color-text-muted` | Stepper glyphs |

Set them on the component or on any ancestor — they are read before the private
fallbacks, so an ancestor override still wins (D-024).

## Anatomy

```
<span class="pp-number-input" data-size data-invalid? data-disabled? data-readonly? data-pp-tone?>
  ├── <input class="pp-number-input__control" role="spinbutton" type="text">
  └── <span class="pp-number-input__steppers">
        ├── <button class="pp-number-input__stepper" data-direction="increment">
        └── <button class="pp-number-input__stepper" data-direction="decrement">
```

Both children share one grid cell. **The `<input>` is the surface** — it carries
the border, the fill, the radius and the focus ring, and reserves room at its
inline end with `padding-inline-end`. The steppers sit over that room. This is
[`Select`](Select.md)'s structure with two buttons instead of one chevron, so
the ring surrounds exactly the box you see, with the steppers inside it.

Each stepper is square at half the control height — 16 / 20 / 24. On the block
axis that is under WCAG 2.2 SC 2.5.8's 24px at `sm` and `md`; the relief is the
criterion's **Equivalent** exception, since the field itself sets the same value
and is a full-size target. You can always just type the number.

`className` and `style` land on the root; everything else lands on the control.
`--pp-number-input-padding-inline` moves both edges *and* the reserved room
together, so widening the padding never runs digits under the buttons.

## Don't

```tsx
// ✗ A placeholder is not a label. It disappears on the first keystroke and
//   leaves the field unnamed.
<NumberInput placeholder="Quantity" />

// ✓
<Field label="Quantity"><NumberInput placeholder="0" /></Field>

// ✗ `formatOptions` alone does nothing. Without a locale there is no
//   formatter, because an ambient one cannot survive hydration.
<NumberInput formatOptions={{ style: 'percent' }} />

// ✓
<NumberInput locale="en-GB" formatOptions={{ style: 'percent' }} />

// ✗ `undefined` is uncontrolled, not empty.
<NumberInput value={maybeUndefined} onValueChange={set} />

// ✗ It is not an Input with a hint. It parses, clamps, snaps and formats.
<Input type="number" />

// ✗ There is no `precision` prop, and there will not be one: it is `step`
//   restated in a second unit, and two props that can contradict each other
//   about the same thing is how a component becomes unpredictable.
<NumberInput step={0.1} precision={3} />

// ✓ display precision belongs to Intl, where it is already defined
<NumberInput locale="en-US" formatOptions={{ maximumFractionDigits: 3 }} step={0.1} />
```
