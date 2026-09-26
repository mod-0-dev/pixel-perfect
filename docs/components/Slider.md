# Slider

A single-thumb range control on `<input type="range">`. Spec:
[`tier-3d-composite.md` §3.15](../specs/tier-3d-composite.md).

```tsx
import { Field, Slider } from 'pixel-perfect';
```

Put it in a [`Field`](Field.md). The field owns the label, the description, the
error and every ARIA relationship between them, and `Slider` reads its `size`,
`disabled` and invalid state from it through `useField()`. It works standalone
too, and then the props are yours to set.

**The native element is the painted control.** Arrow keys, <kbd>Home</kbd> /
<kbd>End</kbd>, <kbd>Page Up</kbd> / <kbd>Page Down</kbd>, step-on-drag, pointer
capture including drag-outside-and-back, touch, `role="slider"` with the value
attributes, and right-to-left reversal all come from the platform. This
component adds no key handler at all.

**Single-thumb only.** A two-thumb range slider is a separate component, not a
prop: [`RangeSlider`](RangeSlider.md). [Why](#why-range-is-a-separate-component)
below.

## Usage

```tsx
<Field label="Volume">
  <Slider min={0} max={11} defaultValue={7} />
</Field>
```

With a commit callback, which is what you want for anything expensive:

```tsx
<Field label="Budget" description="Adjust to filter results.">
  <Slider
    max={500}
    step={25}
    locale="en-GB"
    formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
    onValueChange={setLocal}
    onValueCommit={refetch}
  />
</Field>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number` | — | Controlled. A thumb is always somewhere, so there is no empty state |
| `defaultValue` | `number` | midpoint | The platform's own default, snapped and clamped |
| `onValueChange` | `(value: number) => void` | — | **Continuous** — every input event during a drag |
| `onValueCommit` | `(value: number) => void` | — | **Once**, on pointer release, key release or blur, and only if the value changed |
| `min` | `number` | `0` | Also the stepping base, the way HTML does it |
| `max` | `number` | `100` | |
| `step` | `number` | `1` | Always snapped — there is no typing |
| `locale` | `string` | none | For `aria-valuetext` only; this control displays no text |
| `formatOptions` | `Intl.NumberFormatOptions` | none | Passed to `Intl.NumberFormat(locale, …)` |
| `size` | `'sm' \| 'md' \| 'lg'` | field, then `'md'` | Thumb 16 / 20 / 24 |
| `invalid` | `boolean` | field, then `false` | Sets `data-pp-tone="danger"` and `aria-invalid` |
| `disabled` | `boolean` | field, then `false` | Native attribute |
| `className` / `style` | | — | Land on the **root**, which is the box |

Everything else spreads onto the `<input>`: `name`, `onBlur`, `aria-*`. `ref`
goes to the `<input>`.

`min`, `max`, `step`, `locale`, `formatOptions`, `value`, `defaultValue` and
`onValueChange` mean exactly what they mean on
[`NumberInput`](NumberInput.md) — one numeric contract, two controls.

## `onValueChange` vs `onValueCommit`

React maps `onChange` on a range input to the *input* event, so it fires on
every pixel of a drag; the native `change` event — the one that means "the user
let go" — is not separately exposed.

```tsx
// ✗ one request per pointer move
<Slider onValueChange={refetch} />

// ✓
<Slider onValueChange={setLocal} onValueCommit={refetch} />
```

A commit fires only when the value actually changed, so tabbing past a slider
sends nothing.

## No `readOnly`, and no `required`

`readOnly` is defined for text-like controls and the browser **ignores it on a
range**, so offering the prop would be a promise the platform refuses to keep.
A slider that must not move is `disabled`. (Same ruling as
[`Select`](Select.md)'s missing `readOnly`.)

`required` would gate nothing: a slider always has a value, so it can never be
empty.

## Why range is a separate component

A two-thumb slider built from two overlapping range inputs — the technique that
keeps everything in the list at the top of this page — puts two full-width
inputs on top of each other. Each is `:focus-visible` across the whole track, so
focusing the minimum thumb would draw a ring around the entire control including
the maximum thumb, and moving the ring onto the thumb pseudo-element would mean
`outline: none`, which this library bans outright. Clicking the track is the
second half: the `pointer-events` layering that makes both thumbs draggable is
what takes the track click away from the inputs.

[`RangeSlider`](RangeSlider.md) solves both — the inputs are transparent and the
thumbs you see are its own, so the ring is drawn on a thumb with nothing
suppressed, and a track press is routed to the nearer thumb by the root. Neither
answer transfers back here: with one thumb, the platform's ring around the whole
control is the right placement, and a single input takes its own track clicks.

## Accessibility

`role="slider"`, `aria-valuenow`, `aria-valuemin` and `aria-valuemax` are the
native element's and are maintained by the browser — this component sets none of
them. It adds `aria-valuetext` when `locale` is given, which is the case APG
names the attribute for: a slider labelled "Budget" that announces "50" when it
means "£50".

`aria-orientation` is not set: the pattern's default is horizontal and there is
no vertical mode.

A slider's accessible name is required. Inside a `Field` you get it; standalone,
supply `aria-label`.

**Target size.** The thumb is 16 / 20 / 24, under WCAG 2.2 SC 2.5.8's 24px at
`sm` and `md`. The relief is the **spacing** exception: a single-thumb slider
has exactly one target, so no 24px circle centred on it can intersect another.
The whole control box is also a pointer target — clicking the track moves the
thumb — and it is `--pp-control-height-*` tall at every size.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-slider-height` | `--pp-control-height-<size>` | Block size of the control |
| `--pp-slider-track-size` | `--pp-space-1` (`--pp-space-2` at `lg`) | Track thickness |
| `--pp-slider-track-color` | `--pp-color-bg-sunken` | Unfilled track |
| `--pp-slider-fill-color` | `--pp-tone-solid` | Filled portion |
| `--pp-slider-thumb-size` | `--pp-size-4 / -5 / -6` | Thumb |
| `--pp-slider-thumb-color` | `--pp-color-bg-surface` | Thumb fill |
| `--pp-slider-thumb-border-color` | `--pp-color-border` | Thumb edge |

Set them on the component or on any ancestor — they are read before the private
fallbacks, so an ancestor override still wins (D-024).

## Anatomy

```
<span class="pp-slider" data-size data-invalid? data-disabled? data-pp-tone? style="--_pp-slider-fill: 42%">
  ├── <span class="pp-slider__track" aria-hidden="true">
  │     └── <span class="pp-slider__fill">
  └── <input type="range" class="pp-slider__control">
```

**The track is ours and the thumb is the platform's.** The filled portion is a
*grid column* rather than a `linear-gradient`: a gradient needs `to right`,
which fills from the wrong end in an RTL layout where the native control
reverses, and it would have to be written twice because the WebKit and Firefox
track pseudo-elements cannot share a selector list. Grid columns follow the
inline axis, so RTL is right with nothing declared about it.

The fill is a percentage of the whole track while the thumb travels a track
shorter by its own width, so the two disagree by at most the thumb's radius —
always underneath the thumb, and the same approximation every native slider
makes.

## Don't

```tsx
// ✗ onValueChange fires on every pixel of a drag.
<Slider onValueChange={refetch} />

// ✗ A slider cannot express a precise number and the user cannot type one.
//   Anything a person would read off a receipt is a NumberInput.
<Field label="Invoice total"><Slider min={0} max={100000} /></Field>

// ✗ readOnly is ignored by the platform on a range input.
<Slider readOnly />

// ✗ There is no `range` or `values` prop. Two thumbs is RangeSlider.
<Slider value={[20, 80]} />
```
