# 3.18 `SegmentedControl`

| | |
| --- | --- |
| **Tier** | 3 — Form & Action Core |
| **Status** | `review` — written and built 2026-10-07 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-107 §3; awaiting its CI-authored baselines (D-013) |
| **Sizing contract** | `hug` |
| **RSC** | `client` — `useId`, `useControllableState` and a context provider |
| **Depends on** | 3.4 `ButtonGroup` (`done`) for the seams, 3.11 `Radio` / `RadioGroup` (`done`) for the semantics, 3.7 `Field` (`done`) for the name |
| **APG pattern** | [Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), implemented by the browser (D-039 §5) |

Exactly one of a few options, drawn as an attached row of buttons:
System · Light · Dark, Day · Week · Month, the width presets on the
playground's stage.

Added to the roadmap by D-107 §3. `ButtonGroup.md` sent this case to "a
`RadioGroup` styled as buttons", which the library could not draw, so
`ThemeToggle.md` and the playground's own two switchers used a
`ButtonGroup` of `Toggle`s instead: three `aria-pressed` buttons, of
which pressing the pressed one did nothing. A screen reader heard
"System, toggle button, pressed" and never "1 of 3", and a toggle that
will not un-press is not a toggle.

## Purpose

A single choice among two to five short options, where every option
should be visible at once and the choice applies as soon as it is made
or is submitted with a form. It is a radio group: one tab stop, arrows
that move and select, a `name` and a value that submit.

It deliberately does **not**: allow several choices (a row of `Toggle`s
in a `ButtonGroup` is that); take a `tone` or a `variant` (§2); wrap
(an attached set that wraps has the wrong corners on four segments —
more options than fit is a `Select`); or act as navigation (a set of
views with their own URLs is links, and a set of panels is `Tabs`).

---

## Decisions this spec asks you to approve

### 1. Native radios, painted as an attached row of buttons

```tsx
<SegmentedControl label="Theme" value={theme} onValueChange={setTheme} size="sm">
  <SegmentedControlItem value="system">System</SegmentedControlItem>
  <SegmentedControlItem value="light">Light</SegmentedControlItem>
  <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
</SegmentedControl>
```

The root is `role="radiogroup"`; each item is a `<label>` holding a
real `<input type="radio">` and the option's content. The input is
transparent and pinned inside its segment; a click or a tap anywhere on
the segment is a click on the radio, which is the platform's own label
activation, and the label's text is the radio's name. (Covering the
segment with the input was the first draft: an absolutely placed form
control keeps its intrinsic size under `inset: 0`, as a replaced element
does, and stretching it would take an `inline-size` exemption from
RULES §1 that the label already makes unnecessary.) Radios sharing a `name`
already are the APG pattern in every browser (D-039 §5): one tab stop,
arrows that move **and** select, wrapping, disabled members skipped, a
value that submits and a form reset that works. No roving tabindex is
written; the `name` is generated with `useId()` when none is given.

Rejected: buttons with `role="radio"` and a roving tabindex (Radix
`ToggleGroup`'s single mode). It is a correct pattern and a rebuild of
what a native radio already is — and it submits nothing.

### 2. The checked segment is solid, and there is no `tone`

Computed before choosing (D-047 §3's lesson), in the library's palette:

| Selected-state fill against the page | light | dark |
| --- | --- | --- |
| `Toggle`'s pressed fill, `tone-bg-active` (neutral 5) | **1.26:1** | **1.49:1** |
| `tone-solid`, neutral 9 | 5.90:1 | 7.07:1 |
| `tone-solid`, warning 9 | **1.87:1** | 10.63:1 |

The fill is what tells a selected segment from the one beside it — the
states sit next to each other, which is the case WCAG 1.4.11 asks 3:1
of — so `Toggle`'s pressed look cannot be the selected look here. The
checked segment is `--pp-tone-solid` with `--pp-tone-on-solid` text
(the pairing every hue's solid already asserts at 4.5:1), its border
the same fill, and its hover holds the fill: pressing a checked radio
does nothing, and a hover that promised otherwise would lie.

No `tone`: a single choice carries no semantic colour, and warning's
solid fails 3:1 against the page in light. The root sets
`data-pp-tone="neutral"`, so an ancestor's tone context (an `Alert`'s)
does not reach it (D-059). A brand that wants an accent selection has
`--pp-segmented-control-checked-bg` and `-checked-color`.

No `variant`: the unchecked segments are `outline`'s — transparent on
the surface, `--pp-tone-border` (solved to 3:1, D-050) and muted text —
because that is the treatment against which a solid segment reads.

### 3. Built on `ButtonGroup`'s seams and `Button`'s box, by the two-class contract

The root carries `pp-button-group pp-segmented-control` and each item
`pp-button pp-segmented-control__item` with `data-variant="outline"`
and `data-size` — the two-class contract (D-070 §1). The heights, the
padding, the type, the one-border seam (D-033) and the end radii are
the code that draws a `ButtonGroup` of outline `Button`s, not a copy
of it; this stylesheet adds the checked fill, where the radio sits and the
focus ring. An item is a `<label>`, so `Button.css`'s `:focus-visible`
never matches it: the ring is drawn on the item from
`:has(:focus-visible)` and the item is raised with `--pp-z-raised`, as
`ButtonGroup` raises a focused button.

### 4. Named by `label`, or by the `Field` around it

`label` is the radiogroup's `aria-label`. Inside a `Field` with
`group`, the field's label names it instead (`aria-labelledby`), and
its description and error describe it — `RadioGroup`'s wiring exactly.
`label` given inside a field wins. Neither is a development warning:
the type cannot see a context, so it cannot require one of two sources
(D-031's other half).

### 5. Paints from `:checked`, emits `data-state` for consumers

The same deviation from RULES §4 as `Radio`, for the same cause
(D-047 §2): a radio deselected by its sibling is told nothing, and a
native form reset changes the selection behind React's back. The item
paints from `:has(.pp-segmented-control__input:checked)`; `data-state=
"checked" | "unchecked"` is emitted on the item for consumers whenever
the group knows it, and omitted outside one.

### 6. The parts are named exports

`SegmentedControl` and `SegmentedControlItem` (RULES §5.6). The item
splits like a native control (D-039 §1): `ref` and the rest of its
props go to the `<input>`; `className` and `style` go to the `<label>`.

---

## Sizing contract justification

`hug`: an inline-flex row as wide as its segments, `ButtonGroup`'s
rule. It never wraps and never stretches; a set wider than its parent
overflows, which says it has too many options.

## Anatomy

```
<div class="pp-button-group pp-segmented-control" role="radiogroup" aria-label="Theme"
     data-orientation="horizontal" data-size="sm" data-pp-tone="neutral">
  ├── <label class="pp-button pp-segmented-control__item" data-variant="outline" data-size="sm" data-state="checked">
  │     ├── <input class="pp-segmented-control__input" type="radio" name=":r1:" value="system" checked>
  │     └── <span class="pp-button__content">System</span>
  └── <label class="pp-button pp-segmented-control__item" … data-state="unchecked">…
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| SegmentedControl | `pp-button-group pp-segmented-control` | `<div role="radiogroup">` | The row; ButtonGroup's seams |
| SegmentedControlItem | `pp-button pp-segmented-control__item` | `<label>` | Button's box; the checked fill; the ring |
| input | `pp-segmented-control__input` | `<input type="radio">` | Transparent, pinned inside the label; the label activates it |
| content | `pp-button__content` | `<span>` | Button's content box: an icon and text are spaced by its gap |

## Props

**`SegmentedControl`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | The radiogroup's name. Or the enclosing `Field`'s (§4) |
| `value` | `string` | — | Controlled. `''` is nothing selected |
| `defaultValue` | `string` | `''` | Uncontrolled |
| `onValueChange` | `(value: string) => void` | — | Both modes (D-032). Never `''` |
| `name` | `string` | `useId()` | Grouping is the `name` (D-039 §5) |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | The control scale |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | ButtonGroup's column; `aria-orientation` when vertical |
| `disabled` | `boolean` | field, then `false` | Every segment |
| `required` | `boolean` | field, then `false` | `aria-required` on the group, `required` on every radio |

…`ComponentPropsWithoutRef<'div'>` less `role`, `defaultValue`,
`onChange` and `aria-label`. Exported: `SegmentedControlProps`.

**`SegmentedControlItem`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` | **required** | Never `''` |
| `disabled` | `boolean` | group, then `false` | This segment |
| `children` | `ReactNode` | — | The segment's content and the radio's name |
| `className` / `style` | | — | On the `<label>` |

…every other `<input>` attribute, on the `<input>`; `ref` is the
input. No `checked` or `defaultChecked` — the group owns the value
(D-047 §1). Exported: `SegmentedControlItemProps`.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| checked | `:checked`; `data-state="checked"` on the item | `--pp-tone-solid` fill, on-solid text, the fill as border |
| unchecked | `data-state="unchecked"` | Outline: transparent, `--pp-tone-border`, muted text; hover `--pp-tone-bg-hover` |
| focus | `:focus-visible` on the input | The library ring on the item, raised |
| disabled | `data-disabled` on the item and the group | Button's disabled outline |
| invalid | `aria-invalid` from the field's error | None of its own; the field's error says it |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-segmented-control-checked-bg` | `--pp-tone-solid` | The checked segment's fill and border |
| `--pp-segmented-control-checked-color` | `--pp-tone-on-solid` | Its text |
| `--pp-button-group-radius` | `--pp-control-radius` | The two outer corners (ButtonGroup's) |

…and every `--pp-button-*` property, on the items.

**Contrast, computed at the gate (D-048 §1).** Checked: on-solid on
solid, ≥ 4.5:1 in every hue, asserted; the fill against the page,
5.90 / 7.07 (§2). Unchecked: neutral 11 on the page, asserted; the
boundary, `edge` on steps 1–3, asserted (D-050).

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Into the group at the checked segment, or the first when none is; out of it |
| `ArrowRight` / `ArrowDown` | The next segment, selected; wraps |
| `ArrowLeft` / `ArrowUp` | The previous segment, selected; wraps |
| `Space` | Selects the focused segment when none is checked |

The browser's, cross-checked against APG Radio Group: all four arrows
in either orientation is a superset of the pattern (D-039 §5); under
RTL the browser mirrors the horizontal arrows.

## Accessibility notes

- "Theme, radio group. System, radio button, checked, 1 of 3."
- An icon-only segment is named by its content: an `Icon` with `label`
  (the type requires a label or `aria-hidden`, 1.3) names the radio.
- The hit area is the whole segment, by label activation. 2.5.8 is met
  by size, 32px tall at `sm`.
- **Manual walkthrough:** Tab lands on "Light, radio button, checked,
  2 of 3"; ArrowRight selects "Dark", and the page goes dark; ArrowRight
  wraps to "System"; Shift+Tab leaves; Tab returns to "System".

## Container behavior

None of its own: `hug`, never wraps. In a container narrower than its
segments it overflows, which the harness flags; the fix is fewer or
shorter options, or a `Select`.

## Usage

```tsx
<Field label="Billing period" group>
  <SegmentedControl defaultValue="monthly" name="period">
    <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
    <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
  </SegmentedControl>
</Field>
```

## Don't

```tsx
// ✗ A ButtonGroup of Toggles for one choice: "pressed" buttons, no "1 of 3".
<ButtonGroup label="View"><Toggle pressed>Day</Toggle><Toggle>Week</Toggle></ButtonGroup>

// ✗ Several may be on at once. That is the ButtonGroup of Toggles.
<SegmentedControl label="Style">…Bold…Italic…</SegmentedControl>

// ✗ Seven options. It does not wrap; that is a Select.
```

## Out of scope, recorded

- **Inside a `Toolbar`.** A Toolbar's roving finds every radio as a
  control of its own, and its arrows move focus without selecting.
  Not designed for or tested here.
- **Animated thumb.** The fill moves at once; a sliding thumb is
  motion with nothing to say.

## Tests

- **Unit:** the radiogroup, its name from `label` and from a `Field`,
  the warning with neither; the items' radios, shared generated name,
  values, the checked one; controlled and uncontrolled, `onValueChange`
  once per change and never `''`; `disabled` on the group and an item;
  `required`; `size` from the field; `orientation`; the prop split
  (ref and rest to the input, `className`/`style` to the label); no
  `checked` on the item; `data-state`; a form submitting the value;
  axe in both themes.
- **Browser:** the segments attached with one seam and the end radii;
  the checked fill and text resolved to neutral's solid and on-solid
  (their 3:1 against the page is `lint:contrast`'s, not a pixel read); a click on the label's text selects; Tab lands
  on the checked segment, ArrowRight selects the next and wraps; the
  ring on the item and above its neighbour; a form reset repaints from
  `:checked`; as tall as a `Button` of each size; the same width in
  every Matrix cell.
