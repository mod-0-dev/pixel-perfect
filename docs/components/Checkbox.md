# Checkbox

A binary or tri-state checkbox, painted by us and operated by the browser. Spec:
[`tier-3c-inputs.md` §3.10](../specs/tier-3c-inputs.md).

```tsx
import { Checkbox, Field } from 'pixel-perfect';
```

Put it in a [`Field`](Field.md), with `orientation="horizontal"`. The field owns
the label, the description, the error and every ARIA relationship between them,
and `Checkbox` reads its `size`, `required`, `disabled` and invalid state from it
through `useField()`. It works standalone too, and then the props are yours.

It renders no label of its own — see **Don't**.

## Usage

```tsx
<Field label="Email me about releases" orientation="horizontal">
  <Checkbox />
</Field>
```

Controlled, which is what the third state requires:

```tsx
const [checked, setChecked] = useState<CheckedState>('indeterminate');

<Field label="All notifications" orientation="horizontal">
  <Checkbox checked={checked} onCheckedChange={setChecked} />
</Field>
```

Standalone, where you supply the name yourself:

```tsx
<Checkbox aria-label="Select row" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | `boolean \| 'indeterminate'` | — | Controlled |
| `defaultChecked` | `boolean \| 'indeterminate'` | `false` | Uncontrolled |
| `onCheckedChange` | `(checked: CheckedState) => void` | — | Fires in both modes. Never called with `'indeterminate'` |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | 16 / 20 / 24 — the size scale, not the control scale |
| `invalid` | `boolean` | field, then `false` | Sets `aria-invalid` and the danger tone |
| `disabled` | `boolean` | field, then `false` | Native |
| `required` | `boolean` | field, then `false` | Native — the box must be checked to submit |
| `className` / `style` | | — | Land on the **root**, which is the box |

Plus every other `<input>` attribute — `name`, `value`, `onChange`, `onBlur`,
`aria-*` — all of which land on the `<input>` itself. `type` is not one of them:
it is fixed to `checkbox` and a value passed anyway is dropped. `ref` gives you
the `<input>`, not the wrapper. Exported as `CheckboxProps`, with the state type
as `CheckedState`.

`onChange` is deliberately **not** replaced by `onCheckedChange`. Both fire.
`react-hook-form`'s `register()` returns `{ name, ref, onChange, onBlur }` and
spreads them onto the control; a component that swallows `onChange` is one that
silently never registers.

## The precedence rule

An explicit prop beats the field, which beats the default — for `size`,
`required`, `disabled` and `invalid` alike, including `disabled={false}` inside a
disabled `Field`, which really does enable the control. "Explicit wins" is a rule
you can hold in your head; "explicit wins except for disabled" is one you have to
look up.

## The third state

`'indeterminate'` is the "select all" summary of other checkboxes. Two rules
follow from that, and both are deliberate:

- **Only the caller can set it.** Clicking an indeterminate box produces `true`,
  never `'indeterminate'`. That is what the platform does, and it is what the
  case wants — a "select all" whose first click selects nothing would be broken.
- **Space cycles two states, not three.** APG's tri-state note says all three;
  we diverge. Letting a user *choose* mixed produces a control claiming a state
  its children contradict.

It is a DOM property with no HTML attribute, so it is applied from an effect.
That is also why it cannot cause a hydration mismatch: the server and the first
client render both emit an unchecked box, and the third state arrives after.

`aria-checked="mixed"` is **not** written by hand. The native input carries the
role and the state, and the browser derives `mixed` from the property — so
reading the attribute in a test returns `null`. Assert the checked state instead
(`toBeChecked({ indeterminate: true })` in Playwright, `toBePartiallyChecked()`
in jest-dom).

## Size, and WCAG 2.5.8

The boxes are 16 / 20 / 24 (`--pp-size-4/5/6`), **not** the 32 / 40 / 48 control
scale. A checkbox is a box, not a control surface with a height.

That puts `sm` and `md` under SC 2.5.8's 24×24 minimum, and they conform through
the **spacing exception**: a 24px circle centred on each target must not
intersect its neighbour's. Stacked at `gap="3"` the centres are 28px apart at
`sm`; at `gap="2"` they are exactly 24px, which is tangent circles and an
argument with an auditor rather than a pass. This is the same geometry behind
`RadioGroup`'s `gap` default of `"3"` (D-039 §4).

The spacing argument is used rather than "the label is part of the target"
because it does not depend on a label existing.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-checkbox-size` | `--pp-size-4/5/6` | The square — and the mark, which tracks it |
| `--pp-checkbox-radius` | `--pp-radius-1` | Corners. Squarer than `--pp-control-radius` on purpose |
| `--pp-checkbox-bg` | `--pp-color-bg-surface` | Unchecked fill |
| `--pp-checkbox-border-color` | `--pp-color-border` | Edge |
| `--pp-checkbox-mark-color` | `--pp-tone-on-solid` | The mark, set as `color` and read by the SVG as `currentColor` |

The checked fill is `--pp-tone-solid` and is not separately overridable: set the
tone, or set `--pp-checkbox-bg` inside a `[data-state="checked"]` scope of your
own.

## Anatomy

```
<span class="pp-checkbox" data-size data-state data-invalid? data-disabled?>
  ├── <input class="pp-checkbox__input" type="checkbox">          ← the box
  └── <span class="pp-icon pp-checkbox__indicator" aria-hidden>   ← the mark
        └── <svg><path/></svg>                                       check or dash
```

The **native input is the painted control** — `appearance: none`, styled
directly. Not a hidden input behind a `div role="checkbox"`, which has to rebuild
`:checked`, `:indeterminate`, label-click, Space, form reset, autofill and the
accessibility tree, and rebuilds them incompletely.

The mark is markup, not a `mask-image` data URI: the `<input>` is void, but the
indicator is a `<span>` and takes children. The path is reviewable in a diff, and
it made a proposed lint rule unnecessary (D-039 §3).

`data-state` is `checked` / `unchecked` / `indeterminate` — the RULES §4
vocabulary tracking `aria-checked`, which is the boundary D-030 §5 drew against
`Toggle`'s `on` / `off`.

## Keyboard

| Key | Behavior |
| --- | --- |
| Tab | Moves focus to the checkbox |
| Space | Toggles |
| Enter | Nothing — native, and deliberate: Enter submits the form |

## Don't

```tsx
// ✗ No `label` prop. A checkbox with its own label is a second Field, and a
//   worse one — it owns no description, no error and no aria-describedby.
<Checkbox label="Email me about releases" />

// ✗ Standalone and unlabelled is a 20px target with no accessible name:
//   WCAG 2.5.8 and 4.1.2 in one line.
<Checkbox />

// ✗ Don't try to enter the third state from a click. `onCheckedChange` is
//   never called with 'indeterminate'; the parent computes it from its
//   children and hands it down.
<Checkbox onCheckedChange={(c) => setChecked(c === true ? 'indeterminate' : c)} />

// ✗ Don't read aria-checked to find out whether it is mixed. Nothing writes
//   that attribute — the browser derives it from a DOM property.
expect(el).toHaveAttribute('aria-checked', 'mixed');   // null
expect(el).toBePartiallyChecked();                     // this
```
