# Radio / RadioGroup

One choice from a visible set. Spec:
[`tier-3c-inputs.md` §3.11](../specs/tier-3c-inputs.md).

```tsx
import { Radio, RadioGroup } from 'pixel-perfect';
```

`RadioGroup` owns the `name`, the value and the grouping semantics; `Radio` is
one option — the same box a [`Checkbox`](Checkbox.md) takes, with a round edge
and a dot. Put the group in a [`Field`](Field.md) with `group`, and each option
in a `Field` with `orientation="horizontal"`.

**There is no roving tabindex.** Radios sharing a `name` already implement the
[WAI-ARIA Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
in every browser. Writing our own means deleting that and rebuilding it.

## Usage

```tsx
<Field label="Deployment target" description="Applies on the next push." group>
  <RadioGroup defaultValue="preview">
    <Field label="Preview" orientation="horizontal">
      <Radio value="preview" />
    </Field>
    <Field label="Production" orientation="horizontal">
      <Radio value="production" />
    </Field>
  </RadioGroup>
</Field>
```

Controlled:

```tsx
const [target, setTarget] = useState('preview');

<RadioGroup value={target} onValueChange={setTarget}>…</RadioGroup>
```

Horizontal, which wraps rather than overflowing:

```tsx
<RadioGroup orientation="horizontal" defaultValue="eu">…</RadioGroup>
```

## Props — `RadioGroup`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` | — | Controlled. `''` is "nothing selected" |
| `defaultValue` | `string` | `''` | Uncontrolled |
| `onValueChange` | `(value: string) => void` | — | Fires in both modes. Never called with `''` |
| `name` | `string` | `useId()` | **Generated when omitted.** Grouping *is* the name |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | `Stack` or a wrapping `Cluster` |
| `gap` | `Space` | `'3'` | A space step. **Not `'2'`** — see *Size, and WCAG 2.5.8* |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | Published to every `Radio` |
| `required` | `boolean` | field, then `false` | Sets `required` on **every** radio |
| `disabled` | `boolean` | field, then `false` | |
| `invalid` | `boolean` | field, then `false` | `aria-invalid` and the danger tone |

`ref` gives you the group's root `<div>`. Every other prop lands there too.
`role` is not one of them: it is fixed to `radiogroup` and a value passed anyway
is dropped. Exported as `RadioGroupProps`.

## Props — `Radio`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` | **required** | What this option contributes. Never `''` |
| `size` | `'sm' \| 'md' \| 'lg'` | group, then field, then `'md'` | 16 / 20 / 24 |
| `invalid` | `boolean` | group, then field, then `false` | |
| `disabled` | `boolean` | group, then field, then `false` | **Per-option state goes here** |
| `required` | `boolean` | group, then field, then `false` | Native |
| `className` / `style` | | — | Land on the **root**, which is the box |

Plus every other `<input>` attribute — `onChange`, `onBlur`, `aria-*` — all of
which land on the `<input>` itself. `ref` gives you the `<input>`, not the
wrapper. `type` is fixed to `radio`. Exported as `RadioProps`.

**There is no `checked` or `defaultChecked`**, and that is deliberate: one
option cannot own the group's selection, and a radio that is told it is checked
while the group thinks otherwise is two sources of truth for one fact. Use the
group's `value` / `defaultValue`. Both render real `checked` attributes on the
server, so a form still works with no JavaScript.

`onChange` is deliberately **not** replaced by `onValueChange`. Both fire.
`react-hook-form`'s `register()` returns `{ name, ref, onChange, onBlur }` and
spreads them onto the control; a component that swallows `onChange` is one that
silently never registers.

## The precedence rule

An explicit prop beats the group, which beats the field, which beats the
default — for `size`, `required`, `disabled` and `invalid` alike, including
`disabled={false}` inside a disabled group.

**The group beats the field, and the field in question is the inner one.** In
the sanctioned arrangement each option has its own `Field` for its label, and
`useField()` inside the group returns *that* field, not the one wrapping the
group. A `Field` publishes resolved values and has no way to spell "not set", so
an unset inner field is indistinguishable from one set to the default. Reading
the group first is what carries the outer field's intent across the inner one.

The consequence is worth stating plainly:

```tsx
// ✗ Does nothing to the control — it only dims the label.
<Field label="Production" orientation="horizontal" disabled>
  <Radio value="production" />
</Field>

// ✓ Per-option state goes on the Radio.
<Field label="Production" orientation="horizontal">
  <Radio value="production" disabled />
</Field>
```

## The group owns the value

A radio is deselected when a **sibling** is selected, and the deselected radio
is told nothing — no change event, no anything. So per-radio state could only
ever be right about selection and wrong about deselection, which is the one case
radios exist for. The group is the element that knows both, so the group holds
the value and every `Radio` reads it.

This is also why `data-state` is **omitted rather than guessed** on a `Radio`
with no group above it, and why the stylesheet paints from `:checked` instead of
from the attribute — see **Anatomy**.

## Grouping is the `name`

Two groups with no `name` would be one group: selecting in either clears the
other, silently. `RadioGroup` generates a `name` from `useId()` when you do not
give it one, so this only bites bare `<Radio>`s.

Do not set `name` on a `Radio` inside a group. It wins over the group's, which
removes that option from its own group.

## Size, and WCAG 2.5.8

The boxes are 16 / 20 / 24 (`--pp-size-4/5/6`), so `sm` and `md` are under
SC 2.5.8's 24×24 minimum. They conform through the **spacing exception**: a 24px
circle centred on each target must not intersect its neighbour's.

| `size` | Box | Centre to centre at `gap="3"` | 24px circles |
| --- | --- | --- | --- |
| `sm` | 16px | 28px | clear |
| `md` | 20px | 32px | clear |
| `lg` | 24px | 36px | meets the minimum outright |

At `gap="2"` (8px) a column of `sm` radios puts centres exactly 24px apart —
tangent circles, which is an argument with an auditor rather than a pass. **The
default is a conformance floor, not taste**, and it is asserted in a test.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-radio-size` | `--pp-size-4/5/6` | The box — and the dot, which is half of it |
| `--pp-radio-bg` | `--pp-color-bg-surface` | Unselected fill |
| `--pp-radio-border-color` | `--pp-color-border` | Edge |
| `--pp-radio-dot-color` | `--pp-tone-on-solid` | The dot |

The selected fill is `--pp-tone-solid` and is not separately overridable: set
the tone, or set `--pp-radio-bg` inside a `:checked` scope of your own.

`RadioGroup` has no stylesheet. It renders a `Stack` or a `Cluster` and adds a
role, so its spacing is the `gap` prop and its layout is theirs.

## Anatomy

```
<div class="pp-stack pp-radio-group" role="radiogroup" data-orientation data-size>
  └── (children, laid out by the Stack or Cluster it renders)

<span class="pp-radio" data-size data-state? data-invalid? data-disabled?>
  ├── <input class="pp-radio__input" type="radio">     ← the box
  └── <span class="pp-radio__indicator" aria-hidden>   ← the dot
```

The **native input is the painted control** — `appearance: none`, styled
directly. Not a hidden input behind a `div role="radio"`, which has to rebuild
`:checked`, label-click, Space, the arrow keys, form reset and the accessibility
tree, and rebuilds them incompletely.

The dot is **always in the DOM** and scaled from 0, where
[`Checkbox`](Checkbox.md#anatomy) renders its mark conditionally. The reason is
the same one that puts the value on the group: React does not know whether a bare radio is checked, and a
component that does not know does not get to decide.

**The stylesheet reads `:checked`, not `data-state`** — a deliberate deviation
from RULES §4. `:checked` is not one of our private booleans; it is the
platform's own state, and it is right in exactly the cases React is not (a bare
radio, or anything the platform changes behind React's back). `data-state` is
still emitted for consumers whenever the group knows it, and both are asserted,
including that they agree.

The state is read with `:has()` **on the root**, because the dot is the input's
*sibling*: a custom property is only a channel between two elements when one is
an ancestor of the other, so the only element that can declare a value for both
the box and the dot is the one above them.

## Keyboard

| Key | Behavior |
| --- | --- |
| Tab | Enters the group at the selected radio, or the first if none is; **one tab stop** |
| Arrow Down / Right | Next radio, and selects it |
| Arrow Up / Left | Previous radio, and selects it |
| Space | Selects the focused radio |
| Enter | Nothing — native, and deliberate: Enter submits the form |

All of it native. Arrows wrap at both ends and skip disabled radios, and all
four answer regardless of `orientation` — a superset of the APG pattern rather
than a deviation from it.

## Don't

```tsx
// ✗ Two bare radios with no name are ONE group with every other bare radio on
//   the page. RadioGroup generates a name; use it.
<Radio value="a" /><Radio value="b" />

// ✗ No `checked` prop. The group owns the selection — pass `defaultValue` or
//   `value` to RadioGroup instead.
<Radio value="a" checked />

// ✗ Don't name a radio inside a group. Yours wins, and it takes that option
//   out of the group.
<RadioGroup name="target"><Radio value="a" name="other" /></RadioGroup>

// ✗ Don't rebuild the keyboard. Arrow keys already move and select; a handler
//   here fights the browser and loses on the edge cases.
<RadioGroup onKeyDown={rovingTabIndexHandler} />

// ✗ Don't disable one option through its Field. That dims the label and
//   leaves the control live — per-option state goes on the Radio.
<Field label="Production" orientation="horizontal" disabled>
  <Radio value="production" />
</Field>
```
