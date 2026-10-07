# SegmentedControl

Exactly one of a few options, drawn as an attached row of buttons.
Spec: [`SegmentedControl.md`](../specs/SegmentedControl.md).

```tsx
import { SegmentedControl, SegmentedControlItem } from 'pixel-perfect';
```

A client component. Underneath it is a radio group: one tab stop, arrows
that move **and** select, a `name` and a value that submit with a form. A
screen reader hears "Theme, radio group. Light, radio button, checked, 2
of 3". It looks like a [`ButtonGroup`](ButtonGroup.md) of outline buttons
because it is drawn by the same stylesheet, with the checked segment
filled solid.

## Usage

```tsx
<SegmentedControl label="Theme" value={theme} onValueChange={setTheme} size="sm">
  <SegmentedControlItem value="system">System</SegmentedControlItem>
  <SegmentedControlItem value="light">Light</SegmentedControlItem>
  <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
</SegmentedControl>
```

In a form, put it in a [`Field`](Field.md) with `group`: the field's
label names it, its description and error describe it.

```tsx
<Field label="Billing period" group>
  <SegmentedControl name="period" defaultValue="monthly">
    <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
    <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
  </SegmentedControl>
</Field>
```

An icon-only segment is named by its icon: `<Icon label="Align left">`.

## Which one

| You want | Use |
| --- | --- |
| Exactly one of two to five short options, all visible | `SegmentedControl` |
| Exactly one of a longer list, or options with descriptions | [`RadioGroup`](Radio.md) |
| Exactly one of many, in little space | [`Select`](Select.md) |
| Several of a few, each on or off | a [`ButtonGroup`](ButtonGroup.md) of [`Toggle`](Toggle.md)s |
| Actions that sit together | a `ButtonGroup` of `Button`s |
| Panels, one shown at a time | [`Tabs`](Tabs.md) |

## Props

**`SegmentedControl`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | The group's name, unless a `Field` names it |
| `value` | `string` | — | Controlled. `''` is nothing selected |
| `defaultValue` | `string` | `''` | Uncontrolled |
| `onValueChange` | `(value: string) => void` | — | Both modes. Never `''` |
| `name` | `string` | generated | What the form submits under |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The control scale |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | |
| `disabled` | `boolean` | field, then `false` | |
| `required` | `boolean` | field, then `false` | |

Plus every `<div>` attribute except `role`. `ref` is the root.

**`SegmentedControlItem`**: `value` (required, never `''`), `disabled`,
`children` (the segment's content and the radio's name). `className` and
`style` go on the segment; `ref` and every other prop go on the radio, as
with [`Radio`](Radio.md). No `checked`: the group owns the value.

No `tone` and no `variant`: the checked segment is the neutral solid fill,
the one whose contrast against the page is solved (5.90:1 light, 7.07:1
dark), and a single choice has no semantic colour.

## Keyboard

The browser's radio group, which is the
[APG Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) pattern:
Tab lands on the checked segment (or the first), the arrows move and
select and wrap, a disabled segment is skipped, Shift+Tab leaves.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-segmented-control-checked-bg` | `--pp-tone-solid` | The checked segment's fill and border |
| `--pp-segmented-control-checked-color` | `--pp-tone-on-solid` | Its text |
| `--pp-button-group-radius` | `--pp-control-radius` | The outer corners |

And Button's `--pp-button-*` on every segment: the root carries
`pp-button-group` and each segment `pp-button`. The checked segment is
painted from `:checked`, so a form reset repaints it too; `data-state=
"checked" | "unchecked"` is on each segment for your own selectors.

## Anatomy

```
<div class="pp-button-group pp-segmented-control" role="radiogroup" aria-label="Theme">
  └── <label class="pp-button pp-segmented-control__item" data-state="checked">   × n
        ├── <input class="pp-segmented-control__input" type="radio">
        └── <span class="pp-button__content">Light</span>
```

## Don't

```tsx
// ✗ A ButtonGroup of Toggles for one choice. Pressed buttons announce
//   "pressed", never "2 of 3", and a pressed one that will not un-press
//   is not a toggle.
<ButtonGroup label="View">
  <Toggle pressed>Day</Toggle>
  <Toggle>Week</Toggle>
</ButtonGroup>
// ✓
<SegmentedControl label="View" defaultValue="day">…</SegmentedControl>

// ✗ Several may be on. That is a ButtonGroup of Toggles.
<SegmentedControl label="Text style">Bold · Italic · Underline</SegmentedControl>

// ✗ Seven options. It never wraps; that is a Select or a RadioGroup.

// ✗ An unnamed group. It warns; give it a label or a Field.
<SegmentedControl>…</SegmentedControl>
```
