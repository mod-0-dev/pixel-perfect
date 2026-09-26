# 3.17 `RangeSlider`

| | |
| --- | --- |
| **Tier** | 3 — Form & Action Core |
| **Status** | `done` — built and closed 2026-09-26, the day `Form` was `done` and Gate A opened. Gate C passed 2026-09-22 **by delegation** (D-057): every recommendation below adopted as written. Build findings in D-060. The screenshot baseline was CI-authored on the PR branch and compared green on the re-run (D-013) |
| **Sizing contract** | `fill` |
| **RSC** | `client` — `useField()`, `useControllableState`, pointer handlers |
| **Depends on** | 3.15 `Slider` — the numeric contract (3D §1), `snapToRange` / `numberIO`, and the track-and-fill structure (D-052 §1) |
| **APG pattern** | [Slider (Multi-Thumb)](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/) — two native `slider`s in a `group`; one divergence, §5 |

The two-thumb case deferred from 3.15, with both blockers named in D-052 §5.
This spec's job is to solve those two and nothing else, so it is short where
`Slider` already ruled and long where it did not.

## Purpose

Picks a **range** — a lower and an upper number between two bounds — on the
numeric contract of 3D §1. A price filter, a date-window in days, an acceptable
temperature band.

It deliberately does **not**: take more than two thumbs; enforce a minimum gap
between them (the thumbs may meet; §4); render a readout, ticks or labels (3D
§3.15's reasoning, unchanged); or go vertical.

---

## Decisions this spec asks you to approve

### 1. Two native inputs, stacked, and the thumbs you see are ours

The keyboard, the drag, pointer capture, touch and `role="slider"` still come
from two `<input type="range">` elements, each spanning the full `min`–`max`,
stacked in the root's one grid cell. That is the technique D-052 §5 assumed and
it keeps everything 3D §7 valued.

**What changes from `Slider`: the inputs are `opacity: 0`, and the two thumbs a
user sees are spans of ours**, positioned at each value. That one move dissolves
the first blocker:

- **The ring.** A transparent input's `:focus-visible` outline is transparent
  with it. Nothing is suppressed — no `outline: none`, no `outline-width: 0`,
  nothing Tier 0.7 bans or D-051 §3 had to argue around — and the ring is drawn
  on *our* thumb span by a sibling selector:

  ```css
  .pp-range-slider__control[data-thumb="start"]:focus-visible
    ~ .pp-range-slider__thumb[data-thumb="start"] { outline: … }
  ```

  RULES §6 bans suppressing a ring *without a replacement*. This is a
  replacement, on the element that actually has the user's attention.
- **Observability.** D-052 §4 found the platform's thumb is not observable from
  script — `getComputedStyle` on the pseudo-element returns the host's box — so
  `Slider`'s thumb centring is covered by screenshot alone. Our thumb is an
  element. Its position, its ring and its colours are all assertable in the
  browser suite, which is the first time a slider thumb in this library can be
  tested rather than looked at.
- **The vendor surface shrinks further.** The native thumbs are invisible, so
  3D §8's duplicated `-webkit-` / `-moz-` blocks only have to size them to match
  ours and set `pointer-events` (§2). No colours, no borders.

**Why the native thumbs are still sized.** They are the hit targets for a drag.
They are sized to exactly our thumb's size, and our thumb is positioned with the
platform's own formula — centre at `thumb / 2 + p × (track − thumb)` — so the
invisible native thumb is always underneath the visible one:

```css
inset-inline-start: calc(var(--_start) * (100% - var(--_thumb-size)));
```

`inset-inline-start` on a `position: relative` span, not `translate`, because
`translate` is physical and would run the wrong way in RTL (D-048 §4). A native
range input reverses in RTL, and the logical property reverses with it.

**Consistency cost, stated.** `Slider` rings the whole control; `RangeSlider`
rings a thumb. D-029's "the same answer every time" is about the ring's colour
and it holds — same colour, width and offset. The *placement* differs because
the question differs: with one thumb, "which part has focus" has one answer;
with two it is the only thing the ring is for. APG's multi-thumb example
rings the thumb. `Slider` is not changed by this spec.

### 2. A track press moves the nearer thumb and keeps dragging it

The second blocker. With two full-width inputs stacked, the upper one takes
every click. The standard fix is `pointer-events: none` on the inputs and
`pointer-events: auto` on their thumb pseudo-elements, so each thumb is
draggable wherever it is — **and that is what takes the track click away**,
because a press on bare track now reaches no input at all.

It reaches the root. So the root handles `pointerdown` when its target is not
one of the inputs:

1. map the pointer's inline position to a value — measured from the inline
   start, so `direction: rtl` flips it (read from `getComputedStyle` at event
   time, never at module scope), and inset by half a thumb at each end, the
   same formula as §1;
2. snap it (`snapToRange`, shared with `Slider`) and pick the **nearer** thumb;
   on a tie — the thumbs coincide — the press's side of them decides;
3. set that thumb's value, focus its input with `preventScroll`, and
   `setPointerCapture` on the root so the drag continues until release;
4. commit (`onValueCommit`) on `pointerup`.

**This is pointer maths we own**, which 3D §7 was glad to avoid. It is bounded:
the thumbs' own drag, every key and every ARIA attribute remain native, and what
we own is the one gesture the stacking removed. The alternative — a press on the
track that does nothing — is a regression from every single-thumb slider,
including ours.

`touch-action: pan-y` on the root, so a vertical swipe across the control still
scrolls the page and a horizontal one drags.

### 3. The thumbs cannot cross, and the clamp is on the value, not the element

Each input keeps the **full** `min`/`max` — narrowing the start input's `max` to
the end's value would rescale its thumb travel and break §1's alignment, which
is the known failure of this technique. Instead, a change to the start is
clamped to `≤ end` and a change to the end to `≥ start` before it reaches state.
React restores a controlled input whose change was rejected, so pressing End on
the start thumb leaves it at the end thumb's value rather than at `max`.

**Stacking order when they meet.** When both values are equal, one input covers
the other, and the covered thumb cannot be grabbed. The start input is on top
when the shared value is above the range's midpoint, the end input otherwise —
so the thumb on top is always the one that can move toward the open side. When
they do not coincide their native thumbs do not overlap and the order is
immaterial. `data-thumb-top="start|end"` on the root carries it, per RULES §4.

### 4. The value is a tuple, and the thumbs may meet

```ts
value?: readonly [number, number];
defaultValue?: readonly [number, number];   // default [min, max]
onValueChange?: (value: [number, number]) => void;
onValueCommit?: (value: [number, number]) => void;
```

`[min, max]` as the default, because the whole range selected is what "no
filter yet" means, and it is the only default that needs no midpoint argument.
The platform has no two-thumb element to agree with, so `Slider`'s "sit where a
bare `<input type="range">` would" does not transfer.

A value outside `[min, max]` or with `start > end` is snapped and ordered on the
way in, and the tuple handed to callbacks is always ordered. **No
`minStepsBetweenThumbs`**: a zero-width range is a meaningful selection ("exactly
£50"), and a caller who needs a gap enforces it in `onValueChange`.

### 5. Names come from `thumbLabels`; the group's name comes from `Field`

Two sliders need two names. `thumbLabels?: [string, string]`, default
`['Minimum', 'Maximum']`, becomes each input's `aria-label`. The root is
`role="group"` and takes the field's `aria-labelledby`, so a screen reader hears
"Price, group — Minimum, slider, 20". This is the APG multi-thumb example's
naming exactly.

**It needs `<Field group>`**, the `RadioGroup` wiring (Field.md §9): a
`role="group"` is not labelable, so `for` has nothing to point at. Standalone,
the caller gives the root an `aria-label`.

**The one APG divergence: the announced bounds are the full range.** APG has the
start thumb report `aria-valuemax` equal to the end thumb's value. On a native
range input `aria-valuemax` is the `max` attribute's, ARIA in HTML says authors
should not override it, and §3 is why `max` stays full. What a user hears is
"Minimum, 20, range 0 to 100"; the thumb then stops at the other thumb's value.
`aria-valuetext` with `locale` is per thumb, as in `Slider`.

### 6. The focus ring crosses the fill, and 5% of it is below 3:1 there

Computed at the gate against the committed primitives (D-048 §1). The ring is
`--pp-focus-ring-width` outside `--pp-focus-ring-offset` around a thumb, so it
is a circle that crosses the track line on both sides of the thumb:

| Ring against | Light | Dark |
| --- | --- | --- |
| page (`neutral-1`) | 3.42 | 3.68 |
| unfilled track (`--pp-color-bg-sunken`) | 3.08 | ≥ 3.08 |
| fill (`--pp-tone-solid`, step 9), across the five hues | **1.41 – 1.83** | **1.63 – 2.89** |

At `md` the ring's circumference is about 88px and the track is 4px thick, so
**one ~4px arc on the fill side of each thumb** is below 3:1; the other ~95% of
the ring is on the page or the unfilled track and clears it. 1.4.11 asks that
the indicator be perceivable, and a ring of which 95% contrasts is; 2.4.13
(AAA, not claimed) would measure it by area and it would still pass on the 2px
perimeter test. **Proposed: accept, and record it in DECISIONS with these
numbers**, rather than give the thumb a surface-coloured halo (a `box-shadow`,
which D-029 chose outline over) or break the fill under the ring.

`Slider` does not have this: its ring surrounds the whole control over the page.

### 7. `name` goes on both inputs

`name="price"` sets `name` on both, so `FormData.getAll('price')` is
`['20', '80']`, start first — source order. One prop rather than
`[string, string]`, because a range is one field; a caller who wants
`price_min` / `price_max` reads the tuple from `onValueChange`.

---

## Sizing contract justification

`fill`, for `Slider`'s reason (D-040): the root is `display: grid`, one cell,
and the track stretches into it with no width declared. The thumbs are
intrinsically square and take `inline-size` from the size scale — the D-019
exemption `Slider` already holds; `RangeSlider.css` joins the same override list.

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

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-range-slider` | `<span>` | `role="group"`, grid, state attributes, the two fractions. `ref`, `className`, `style` and the rest props land here |
| Track | `pp-range-slider__track` | `<span>` | Ours, as in `Slider`. `pointer-events: none` |
| Fill | `pp-range-slider__fill` | `<span>` | Grid **column two** of `start% (end − start)% 1fr` — RTL-correct with nothing declared (D-052 §1) |
| Control | `pp-range-slider__control` | `<input type="range">` ×2 | `opacity: 0`, `pointer-events: none`; native thumbs `pointer-events: auto` |
| Thumb | `pp-range-slider__thumb` | `<span>` ×2 | Ours. `pointer-events: none`, so presses reach the native thumb beneath. Carries the ring |

**The inputs precede the thumbs in source order** because the ring selector is a
subsequent-sibling combinator. It is not `:has()`, which would also work in the
browser and does not exist in jsdom, so a unit test could not see it.

**The fractions are unitless and always written** (D-024: private, and never
conditional, so a nested slider cannot inherit them). The fill multiplies by
`100%`; the thumbs by `100% - thumb`.

**Where the ref goes.** `Slider` forwards `ref` to its input (D-039 §1: the
control is the prop target). There are two inputs here and no reason to prefer
one, so `ref` and the rest props go to the root — RULES §5.1's default.
`startProps` / `endProps` are not offered; the inputs' attributes are covered by
§5's labels and §7's `name`.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `readonly [number, number]` | — | Controlled (§4) |
| `defaultValue` | `readonly [number, number]` | `[min, max]` | |
| `onValueChange` | `(value: [number, number]) => void` | — | Continuous, as in `Slider` |
| `onValueCommit` | `(value: [number, number]) => void` | — | On release, key-up or blur of either thumb, and only on a change (`Slider`'s guard) |
| `min` / `max` / `step` | `number` | `0` / `100` / `1` | 3D §1 |
| `locale` / `formatOptions` | | none | `aria-valuetext` per thumb |
| `thumbLabels` | `readonly [string, string]` | `['Minimum', 'Maximum']` | §5 |
| `name` | `string` | — | On both inputs (§7) |
| `size` | `Size` | field, then `'md'` | Thumb 16 / 20 / 24, as `Slider` |
| `invalid` | `boolean` | field, then `false` | |
| `disabled` | `boolean` | field, then `false` | Both inputs |
| `className` / `style` | | — | Root |
| …rest | `ComponentPropsWithoutRef<'span'>` | — | `aria-label` standalone, `data-*` |

`ref` → `HTMLSpanElement`. Fourteen props — over RULES §5.6's "~10", so the
count is accounted for rather than waved at: eight are 3D §1's shared numeric
contract, four more are `Slider`'s existing set (`onValueCommit`, `size`,
`invalid`, `disabled`), `name` is explicit only because on `Slider` it is a rest
prop landing on the one input and here it has to reach two, and `thumbLabels` is
the one genuinely new prop. §5.6's warning is that the count means two
components; this is already the second one.

No `readOnly`, for `Slider`'s reason (D-049 §4's shape).

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Invalid | `data-invalid`, `data-pp-tone="danger"`, `aria-invalid` on both inputs | As `Slider` |
| Disabled | `data-disabled`, `disabled` on both | As `Slider` (D-050's decorative step) |
| Focus | `:focus-visible` on one input | Ring on that thumb (§1) |
| Stacking | `data-thumb-top` | Which input is on top (§3) |
| Value | the two fractions, `aria-valuenow` (native) | Fill between the thumbs |

## Styling API

`Slider`'s set, renamed, and the same defaults — a caller who has themed one has
the vocabulary for the other:

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-range-slider-track-color` | `--pp-color-bg-sunken` | Unfilled track |
| `--pp-range-slider-fill-color` | `--pp-tone-solid` | Between the thumbs |
| `--pp-range-slider-thumb-color` | `--pp-color-bg-surface` | Thumb fill |
| `--pp-range-slider-thumb-border-color` | `--pp-color-border` | Thumb edge |
| `--pp-range-slider-thumb-size` | `--pp-size-4 / -5 / -6` | Both thumbs, visible and native |
| `--pp-range-slider-track-size` | `--pp-space-1`, `--pp-space-2` at `lg` | Track |
| `--pp-range-slider-height` | `--pp-control-height-<size>` | Control block size |

Thumb, border and track pairings are `Slider`'s and are asserted already
(3D §3.15). The one new pairing is §6's.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| Tab / Shift+Tab | Start thumb, then end thumb — source order, as APG |
| → / ↑, ← / ↓ | ± `step` on the focused thumb, stopping at the other thumb (§3) |
| Page Up / Page Down | Native larger step, same stop |
| Home / End | `min` / `max`, or the other thumb's value if that comes first |

Native on every row, with §3's clamp applied to the result. RTL reverses ← and →
as in `Slider`.

## Accessibility notes

`role="group"` named by the field; each input a native `slider` named by
`thumbLabels`. §5's one divergence. `aria-describedby` from the field goes on
**both** inputs — the description and error are about the range, and a user
landing on either thumb should hear them.

**Manual walkthrough:** Tab to each thumb and confirm the ring is on that thumb
alone; arrow the start thumb into the end thumb and confirm it stops; press Home
on the end thumb and confirm it stops at the start thumb; click bare track on
either side and between, and confirm the nearer thumb jumps and follows the
drag; bring both to `max` and confirm the pair can be pulled apart; repeat in an
RTL container.

## Container behavior

No `@container` rules. Fills. `Slider`'s "don't" about narrow containers applies
doubly — two thumbs need twice the travel to be usable.

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
```

## Testing notes

- **The ring is on the focused thumb and on nothing else**, asserted in the
  browser on our span — `outline-style`, not `outline-width` (D-054 §1) — and
  polled, not read in the same frame (D-052 §3).
- **Our thumb is over the native one.** Asserted by pressing the centre of each
  visible thumb with `locator.click` (it scrolls; D-052 §2) and dragging: the
  value that moves must be that thumb's. This is the assertion the break of §1's
  formula fails.
- **Track press in RTL** moves the nearer thumb in the mirrored direction.
- **The crossing clamp**, by keyboard and by drag, and **the stuck pair at
  `max`** (§3) — the case every hand-built range slider ships broken.
- **Break checks:** swap `inset-inline-start` for `translate` (RTL test fails);
  drop `data-thumb-top` (stuck-pair test fails); make the fractions conditional
  (nested-slider test fails, D-024's hazard a fourth time); remove
  `pointer-events: auto` from one engine's thumb block (drag test fails in that
  engine — Chromium only here, so the Firefox half is covered by `lint:rules`'
  mixed-prefix rule, D-051 §4).

## Open questions

Resolve before Gate C.

1. **§6 — accept the ~5% of ring below 3:1 where it crosses the fill?**
   Recommendation: yes, with the numbers recorded. The alternatives each break a
   ruling (D-029's outline) or draw something odd (a gap in the fill).
2. **§1 — ring placement differs from `Slider`'s.** Recommendation: accept for
   this component and leave `Slider` alone. If you want them identical, the
   honest direction is `Slider` adopting our thumb too — a separate change, not
   folded in here.
3. **§2 — track press continues dragging.** Recommendation: yes, to match every
   single-thumb slider. The smaller alternative is "jump, then the user grabs the
   thumb", which removes the capture code and is a visible regression.
