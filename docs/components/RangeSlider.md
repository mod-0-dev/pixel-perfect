# RangeSlider

A two-thumb range control on the same numeric contract as [`Slider`](Slider.md)
and [`NumberInput`](NumberInput.md). Spec:
[`RangeSlider.md`](../specs/RangeSlider.md).

```tsx
import { Field, RangeSlider } from 'pixel-perfect';
```

Put it in a [`Field`](Field.md) **with `group`**. The root is a `role="group"`,
which a `<label for>` cannot name, so the field names it through
`aria-labelledby` the way it names a `RadioGroup`. Each thumb is a native
slider named by `thumbLabels`. A screen reader hears "Price, group — Minimum,
slider, 20".

**Two native inputs, stacked, each spanning the full range.** The drag on a
thumb, pointer capture, touch, every keyboard row, `role="slider"` with its
value attributes, and right-to-left reversal are the platform's. This component
adds one thing the stacking takes away — a press on bare track — and clamps one
thing the platform cannot know about: the other thumb.

## Usage

```tsx
<Field label="Price" group>
  <RangeSlider
    min={0}
    max={500}
    step={10}
    defaultValue={[50, 250]}
    locale="en-GB"
    formatOptions={{ style: 'currency', currency: 'GBP' }}
    thumbLabels={['Minimum price', 'Maximum price']}
    name="price"
    onValueCommit={refetch}
  />
</Field>
```

Controlled, with the value read back as a tuple:

```tsx
const [range, setRange] = useState<[number, number]>([50, 250]);

<Field label="Price" group>
  <RangeSlider max={500} value={range} onValueChange={setRange} onValueCommit={refetch} />
</Field>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `readonly [number, number]` | — | Controlled. Snapped and ordered on the way in |
| `defaultValue` | `readonly [number, number]` | `[min, max]` | The whole range: what "no filter yet" means |
| `onValueChange` | `(value: [number, number]) => void` | — | **Continuous** — every input event during a drag. Always ordered |
| `onValueCommit` | `(value: [number, number]) => void` | — | **Once**, on release, key release or blur of either thumb, and only if the range changed |
| `min` | `number` | `0` | Also the stepping base, the way HTML does it |
| `max` | `number` | `100` | |
| `step` | `number` | `1` | Always snapped — there is no typing |
| `locale` | `string` | none | For `aria-valuetext` only, per thumb |
| `formatOptions` | `Intl.NumberFormatOptions` | none | Passed to `Intl.NumberFormat(locale, …)` |
| `thumbLabels` | `readonly [string, string]` | `['Minimum', 'Maximum']` | Each input's `aria-label` |
| `name` | `string` | — | On **both** inputs: `FormData.getAll(name)` is `[start, end]` |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | Thumbs 16 / 20 / 24 |
| `invalid` | `boolean` | field, then `false` | Sets `data-pp-tone="danger"` and `aria-invalid` on both inputs |
| `disabled` | `boolean` | field, then `false` | Both inputs |
| `className` / `style` | | — | Land on the root |

Everything else spreads onto the **root** — `aria-label` for a standalone
range, `data-*`. `ref` goes to the root too: there are two inputs and no reason
to prefer one, so this is the one slider whose `ref` is not an `<input>`.

`min`, `max`, `step`, `locale`, `formatOptions`, `value`, `defaultValue` and
`onValueChange` mean what they mean on `Slider`, with the value a pair.

## The thumbs cannot cross, and they may meet

Each input keeps the **full** `min`/`max`. Narrowing the start input's `max` to
the end's value would rescale its thumb travel, and the visible thumb would
drift off the native one beneath it — the known failure of this technique.
Instead a change that would cross is clamped to the other thumb's value before
it reaches state, so <kbd>End</kbd> on the start thumb stops at the end thumb.

A zero-width range — "exactly £50" — is a meaningful selection, so there is no
minimum gap. When the thumbs meet, the input on top is the one that can move
toward the open side (`data-thumb-top`), which is what lets a pair pushed to
`max` be pulled apart. A caller who needs a gap enforces it:

```tsx
<RangeSlider
  value={range}
  onValueChange={([lo, hi]) => setRange(hi - lo < 10 ? range : [lo, hi])}
/>
```

## A press on bare track

With both thumbs draggable wherever they are, a press on bare track reaches no
input. The root handles it: the pointer is mapped to a value (from the inline
start, so RTL is right), snapped, and given to the **nearer** thumb, whose input
is focused; the pointer is captured, so the drag continues until release, and
`onValueCommit` fires once. On a tie — the thumbs coincide — the press's side
decides.

## `onValueChange` vs `onValueCommit`

As on [`Slider`](Slider.md#onvaluechange-vs-onvaluecommit): the first fires on
every pixel of a drag, the second once when the user lets go.

```tsx
// ✗ one request per pointer move, for either thumb
<RangeSlider onValueChange={refetch} />

// ✓
<RangeSlider onValueChange={setLocal} onValueCommit={refetch} />
```

## Accessibility

The root is `role="group"`, named by the field or by your `aria-label`. Each
input is a native `slider` named by `thumbLabels` and described by the field's
description and error — both of them, because both are about the range.

**One divergence from the APG multi-thumb pattern, deliberately.** APG has the
start thumb announce `aria-valuemax` equal to the end thumb's value. On a native
range input the announced bounds are the `max` attribute's, ARIA in HTML says
authors should not override them, and the full range is what keeps the thumbs
aligned (above). What a user hears is "Minimum, 20, range 0 to 100"; the thumb
then stops at the other thumb's value.

**The focus ring is on the thumb**, not around the whole control as on `Slider`,
because with two thumbs "which one has focus" is the only thing the ring is for.
Same colour, width and offset as every other ring in the library. Where the ring
crosses the filled track it is below 3:1 for about 5% of its circumference; the
numbers and the reasons for accepting that are in the spec (§6).

**Target size.** The thumbs are 16 / 20 / 24, under WCAG 2.2 SC 2.5.8's 24px at
`sm` and `md`. Two thumbs can touch, so the spacing exception `Slider` relies on
does not hold when they meet; the whole control is `--pp-control-height-*` tall
and a track press routes to the nearer thumb, so the target that matters is the
control, not the thumb.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-range-slider-height` | `--pp-control-height-<size>` | Block size of the control |
| `--pp-range-slider-track-size` | `--pp-space-1` (`--pp-space-2` at `lg`) | Track thickness |
| `--pp-range-slider-track-color` | `--pp-color-bg-sunken` | Unfilled track |
| `--pp-range-slider-fill-color` | `--pp-tone-solid` | Between the thumbs |
| `--pp-range-slider-thumb-size` | `--pp-size-4 / -5 / -6` | Both thumbs, visible and native |
| `--pp-range-slider-thumb-color` | `--pp-color-bg-surface` | Thumb fill |
| `--pp-range-slider-thumb-border-color` | `--pp-color-border` | Thumb edge |

`Slider`'s set, renamed, with the same defaults. Set them on the component or on
any ancestor (D-024).

## Anatomy

```
<span class="pp-range-slider" role="group" data-size data-thumb-top="start|end"
      data-invalid? data-disabled? data-pp-tone?
      style="--_pp-range-slider-start: 0.2; --_pp-range-slider-end: 0.8">
  ├── <span class="pp-range-slider__track" aria-hidden="true">
  │     └── <span class="pp-range-slider__fill">
  ├── <input type="range" class="pp-range-slider__control" data-thumb="start" aria-label="Minimum">
  ├── <input type="range" class="pp-range-slider__control" data-thumb="end"   aria-label="Maximum">
  ├── <span class="pp-range-slider__thumb" data-thumb="start" aria-hidden="true">
  └── <span class="pp-range-slider__thumb" data-thumb="end"   aria-hidden="true">
```

The inputs are `opacity: 0` with `pointer-events: none`; their native thumbs
are sized to ours and take `pointer-events: auto`, so a press on a visible thumb
lands on the native one beneath it. The visible thumbs are placed with the
platform's own formula — centre at `thumb / 2 + p × (track − thumb)` — using
`inset-inline-start`, so they reverse with the inputs in RTL.

## Testing in jsdom

The track press reads the root's and a thumb's `getBoundingClientRect()`, which
jsdom returns as zeros, so a press there maps to `min`. Stub both on the
elements under test, or assert the mapping in a browser; the library's own unit
tests do the former and its browser suite the latter.

## Don't

```tsx
// ✗ Without `group`, Field points a <label for> at a role="group", which is
//   not labelable, and the range has no accessible name.
<Field label="Price"><RangeSlider /></Field>

// ✗ Two Sliders for one range. Nothing stops the minimum passing the maximum,
//   and they are two fields to a screen reader.
<Slider value={lo} … /><Slider value={hi} … />

// ✗ Every pixel of a drag, twice as often as a Slider could.
<RangeSlider onValueChange={refetch} />

// ✗ Narrow containers. Two thumbs need twice the travel to be usable; a
//   240px sidebar gives each step of a 0–500 range under half a pixel.
<Split.Sidebar><Field label="Price" group><RangeSlider max={500} /></Field></Split.Sidebar>
```
