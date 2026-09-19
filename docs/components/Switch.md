# Switch

An on/off control whose effect is **immediate**. Spec:
[`tier-3c-inputs.md` §3.12](../specs/tier-3c-inputs.md).

```tsx
import { Field, Switch } from 'pixel-perfect';
```

Put it in a [`Field`](Field.md), with `orientation="horizontal"`. The field owns
the label, the description, the error and every ARIA relationship between them,
and `Switch` reads its `size`, `required`, `disabled` and invalid state from it
through `useField()`. It works standalone too, and then the props are yours.

It renders no label of its own — see **Don't**.

## Switch, Checkbox, or Toggle?

Three controls, one question each, and getting it wrong is the most common
mistake with this component.

| | Question it answers | Announced as |
| --- | --- | --- |
| `Switch` | Is this setting on? **The effect happens now.** | `switch`, `aria-checked` |
| [`Checkbox`](Checkbox.md) | Is this value part of what I am about to submit? | `checkbox`, `aria-checked` |
| [`Toggle`](Toggle.md) | Is this button currently held down? (bold, italic, a filter) | `button`, `aria-pressed` |

If there is a Save button, it is a checkbox. If it lives in a toolbar beside
other buttons, it is a toggle.

## Usage

```tsx
<Field
  label="Ship on merge"
  description="Deploys to production as soon as a PR lands."
  orientation="horizontal"
>
  <Switch onCheckedChange={setShipOnMerge} />
</Field>
```

Controlled:

```tsx
const [shipOnMerge, setShipOnMerge] = useState(false);

<Switch checked={shipOnMerge} onCheckedChange={setShipOnMerge} aria-label="Ship on merge" />
```

Standalone, where you supply the name yourself:

```tsx
<Switch aria-label="Enable row" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | `boolean` | — | Controlled |
| `defaultChecked` | `boolean` | `false` | Uncontrolled |
| `onCheckedChange` | `(checked: boolean) => void` | — | Fires in both modes |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The track's **block** size: 16 / 20 / 24, inline twice it |
| `invalid` | `boolean` | field, then `false` | Sets `aria-invalid` and the danger tone |
| `disabled` | `boolean` | field, then `false` | Native |
| `required` | `boolean` | field, then `false` | Native — the switch must be on to submit |
| `className` / `style` | | — | Land on the **root**, which is the box |

Plus every other `<input>` attribute — `name`, `value`, `onChange`, `onBlur`,
`aria-*` — all of which land on the `<input>` itself. `type` and `role` are not
among them: they are fixed to `checkbox` and `switch`, and values passed anyway
are dropped. `ref` gives you the `<input>`, not the wrapper. Exported as
`SwitchProps`.

`onChange` is deliberately **not** replaced by `onCheckedChange`. Both fire, so
`react-hook-form`'s `register()` works unchanged.

There is no `'indeterminate'`. A switch is binary; the third state is
`Checkbox`'s.

## The precedence rule

```ts
const size     = sizeProp     ?? field?.size     ?? 'md';
const required = requiredProp ?? field?.required ?? false;
const disabled = disabledProp ?? field?.disabled ?? false;
const invalid  = invalidProp  ?? field?.invalid  ?? false;
```

Explicit prop, then the field, then the default — including `disabled={false}`
inside a disabled `Field`, which does enable this one. "Explicit wins" is a rule
you can hold in your head; "explicit wins except for disabled" is one you have
to look up.

## Size, geometry, and WCAG 2.5.8

The track is 32×16 / 40×20 / 48×24 — a 2:1 ratio on `--pp-size-4/5/6`, **not**
the 32 / 40 / 48 control scale — so a `md` switch is exactly as tall as a `md`
checkbox in the same form.

Every other length is derived from the track's block size, so overriding one
property moves all four:

| | Derivation | `md` |
| --- | --- | --- |
| Track inline size | `block × 2` | 40px |
| Thumb inset | `(block − one size step) / 2` | 2px |
| Thumb | `block − 2 × inset` | 16px |
| Travel | `inline − block` | 20px |

The travel is the same distance whatever the inset is, because the inset is
subtracted at the start of the track and added back at the end.

`sm` and `md` are under SC 2.5.8's 24×24 minimum on the block axis, and conform
through the **spacing exception**: a 24px circle centred on each target must not
intersect its neighbour's. Stacked at `gap="3"` the centres are 28px apart at
`sm`; at `gap="2"` they are exactly 24px, which is tangent circles and an
argument with an auditor rather than a pass.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-switch-track-inline-size` | `block-size × 2` | The track's length |
| `--pp-switch-track-block-size` | `--pp-size-4/5/6` | The track's height — and the thumb, the inset and the travel, which derive from it |
| `--pp-switch-track-bg` | `--pp-color-bg-surface` | The **off** track |
| `--pp-switch-track-bg-checked` | `--pp-tone-solid` | The **on** track |
| `--pp-switch-thumb-bg` | `--pp-color-text-muted` off, `--pp-tone-on-solid` on | The thumb, in both states |
| `--pp-switch-thumb-inset` | `(block − one size step) / 2` | The gap between the thumb and the track's edge |

The two track fills are separate properties because the states are: setting one
leaves the other alone. `--pp-switch-thumb-bg` is the exception — it is one
property and it applies to both states, so setting it gives up the automatic
inversion.

## Anatomy

```
<span class="pp-switch" data-size data-state data-invalid? data-disabled?>
  ├── <input class="pp-switch__input" type="checkbox" role="switch">  ← the track
  └── <span class="pp-switch__thumb" aria-hidden>                     ← the thumb
```

The **native input is the painted track** — `appearance: none`, styled directly.
`role="switch"` on a native checkbox is the APG construction: the semantics, the
keyboard and the form participation stay, and only the announced role changes.

`data-state` is `checked` / `unchecked` — the RULES §4 vocabulary tracking
`aria-checked`, which is the boundary D-030 §5 drew against `Toggle`'s
`on` / `off`. Unlike [`Radio`](Radio.md), the stylesheet reads that attribute
rather than `:checked`: every change to a switch is an event on that switch, so
there is no case where React does not know the state (D-048 §3).

The thumb moves with `inset-inline-start` rather than `translate`, because
`translate` is physical: a thumb translated rightwards would run toward the
track's *start* in an RTL layout.

## The off state is a thumb, not a track colour

Off is the same resting surface and edge an unchecked checkbox takes, with a
`--pp-color-text-muted` thumb at the start of the track. On fills the track with
`--pp-tone-solid` and the thumb becomes `--pp-tone-on-solid`, at the end.

Both thumb-on-track pairings are ones `npm run lint:contrast` verifies in every
hue and both themes. The `--pp-color-border-strong` track the spec originally
called for is not: measured against the real ramp it is 1.97:1 on the page in
the light theme, and a surface-coloured thumb on it is 1.97:1 too — so the part
WCAG 1.4.11 most clearly asks for, the thing that says which way the switch is
set, was the part that failed. See D-048 §1.

## Keyboard

| Key | Behavior |
| --- | --- |
| Tab | Moves focus to the switch |
| Space | Flips it |
| Enter | Nothing — native, and deliberate: Enter submits the form |

APG lists Enter as optional for switches. It is not implemented: a switch lives
in a form, and a switch that eats Enter is a form the keyboard cannot submit
from.

## Don't

```tsx
// ✗ A switch inside a form with a Save button is a checkbox. The user flips
//   it, nothing happens, and they have no way to know why.
<form>
  <Switch /> <Button type="submit">Save</Button>
</form>

// ✗ Not Toggle. Toggle is aria-pressed — a button that stays down.
//   Switch is aria-checked — a setting that is on.
<Switch>Bold</Switch>

// ✗ No `label` prop. A switch with its own label is a second Field, and a
//   worse one — it owns no description, no error and no aria-describedby.
<Switch label="Ship on merge" />

// ✗ Standalone and unlabelled is a 40×20 target with no accessible name:
//   WCAG 2.5.8 and 4.1.2 in one line.
<Switch />

// ✗ Don't look for it by the checkbox role. It is announced as a switch.
getByRole('checkbox');   // null
getByRole('switch');     // this
```
