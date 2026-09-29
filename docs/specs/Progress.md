# 5.3 `Progress`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-080; its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` |
| **RSC** | `server` — no state, no effect, no handler; the motion is CSS |
| **Depends on** | T0 |
| **APG pattern** | [`progressbar`](https://www.w3.org/TR/wai-aria-1.2/#progressbar) — a role, not a widget: nothing here takes focus or a key |

The determinate half of what `Spinner` (1.6) began: "an indeterminate busy
indicator; determinate progress is `Progress` (5.3)". A bar, from the
start of the line to its end, filled as far as the value says.

## Purpose

How far along a thing is: an upload, a wizard's steps, a quota. It is a
bar because a bar is the one shape that reads a fraction at a glance,
and because it is the one that fills a column — a ring hugs, and the
indeterminate ring already exists.

It also does the indeterminate case, because a bar that is a bar until
the size of the work is known and then keeps its place on the page is
better than a spinner that is swapped for a bar when the first byte
lands. With no `value` it sweeps; given one it fills.

It deliberately does **not**: render a label or a number (a label and a
`Text` beside it are a `Cluster`, composed, and named by `aria-labelledby`
— composition over configuration, RULES §5.6); take a `variant`; or come
as a ring (`Spinner` is the ring, and a determinate ring is a rare thing
a chart library draws better).

---

## Decisions this spec asks you to approve

### 1. `value` present is determinate; absent is indeterminate; `max` defaults to 100

```tsx
<Progress label="Uploading" value={40} />
<Progress label="Uploading" value={3} max={5} />
<Progress label="Connecting" />
```

No `indeterminate` boolean beside a `value`: two props for one state are
two props to keep in step, and a `value` of `undefined` already says the
size of the work is unknown. `value` is clamped to `[0, max]`; a `max`
that is not a positive finite number falls back to 100 (and warns in
development). `aria-valuemin="0"`, `aria-valuemax={max}` and
`aria-valuenow={value}` are written when determinate; when indeterminate
`aria-valuenow` is **omitted**, which is what ARIA 1.2 says an
indeterminate progressbar does (the same reading NumberInput §5 verified
for `spinbutton`). `aria-valuetext` passes through for a value that is
not a percentage ("3 of 5 steps").

`data-state="determinate" | "indeterminate"` on the root. `indeterminate`
is already in RULES §4's vocabulary (a checkbox's third state);
`determinate` extends it under §4's extension rule, because "the value is
known" is a real state the stylesheet switches on and a consumer may
style, and `:not([data-state="indeterminate"])` is a worse spelling of it
(D-080 §1).

### 2. A name is required at the type level: `label`, or `aria-labelledby`

```ts
type ProgressProps = ProgressBase & (
  | { label: string; 'aria-labelledby'?: never }
  | { 'aria-labelledby': string; label?: never }
)
```

A `progressbar` without a name is an axe failure and a screen reader
saying "progress bar, 40 percent" of nothing. Spinner's union is
`label | decorative`; a progress bar has no decorative case — it exists
to report a number, and a number of nothing is not decoration. `label`
writes `aria-label`; the page-visible label beside a bar is the
consumer's `Text`, and `aria-labelledby` points at it, so the name is
said once. Nothing is rendered visually hidden.

### 3. The fill is a flex item, so it animates in every browser and follows the direction

Slider draws its fill as a grid column (`grid-template-columns:
var(--_fill) 1fr`), direction-correct with nothing said about direction.
A progress bar's fill *moves* — 40 becomes 55 — and a grid track does not
interpolate in Safari, so a bar built that way would jump there and
slide elsewhere. `flex-basis` interpolates everywhere and a flex row
follows the writing direction the same way a grid does, so the fill is
`flex: 0 0 var(--_pp-progress-fill)`, written by the component as an
inline custom property (Slider's device), transitioned over
`--pp-duration-normal`. In RTL the fill grows from the right edge with
no rule for it (D-080 §2).

### 4. Indeterminate sweeps a segment; reduced motion pulses the whole bar

Two fifths of the track slides from before the start to past the end,
over `--pp-duration-slow × 4`, forever, clipped by the track. It moves
by `inset-inline-start`, animated from `-40%` to `100%` — a logical
property, so it sweeps from the start in both directions, where a
`translate` would need a second keyframe set for RTL.

Under `prefers-reduced-motion: reduce` a frozen segment reads as a hung
page (Spinner, decision 6), so the segment becomes the whole bar and
pulses in opacity between 1 and 0.4 over `--pp-duration-slow × 5`, the
same signal Spinner gives. The determinate fill's transition is `none`
under reduced motion — declared here, because a shorthand in
`pp.components` outranks the reset's crush (D-062 §5).

### 5. `size` is the bar's thickness; `tone` is the fill's colour, `accent` by default

| `size` | Thickness |
| --- | --- |
| `sm` | `--pp-space-1` (4px) |
| `md` | `--pp-space-2` (8px) |
| `lg` | `--pp-space-3` (12px) |

The track is `--pp-tone-border-subtle` (Spinner's ring), the fill
`--pp-tone-solid` (Spinner's arc), both resolved in the root's
`data-pp-tone` scope, so a `success` bar at 100 and a `danger` bar for a
failed upload need no rule of their own. The default tone is `accent`,
where Spinner's is `neutral`: a spinner sits inside a control and takes
the control's colour, and a bar stands alone on the page, where a grey
fill reads as disabled (D-080 §3). Contrast: the fill is a solid step 9
on the page, the pairing every solid button already carries; the track is
the decorative step, no obligation by design (D-050).

---

## Sizing contract justification

`fill`: a bar's whole point is to span the line its parent gives it;
`display: flex` on a block, no width declaration, `min-inline-size: 0`
(RULES §1). Its height is its `size`.

## Anatomy

```
<div class="pp-progress" role="progressbar" data-state="determinate" data-size="md" data-pp-tone="accent"
     aria-label="Uploading" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"
     style="--_pp-progress-fill: 40%">
  └── <div class="pp-progress__fill">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-progress` | `<div>` | The track; carries the role and the values |
| fill | `pp-progress__fill` | `<div>` | The filled part, or the sweeping segment |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number` | — | Determinate when given; clamped to `[0, max]` |
| `max` | `number` | `100` | Positive and finite, else 100 |
| `label` | `string` | — | `aria-label`; one of `label` / `aria-labelledby` is required |
| `aria-labelledby` | `string` | — | The id of the visible label |
| `aria-valuetext` | `string` | — | Passes through; for a value that is not a percentage |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Thickness |
| `tone` | `Tone` | `'accent'` | The fill |

…`ComponentPropsWithoutRef<'div'>` less `children` and `role`. Exported:
`ProgressProps`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| determinate | `data-state="determinate"` | The fill at `value / max` |
| indeterminate | `data-state="indeterminate"` | A segment sweeping |
| reduced motion | — | No transition; the whole bar pulsing when indeterminate |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-progress-track-color` | `--pp-tone-border-subtle` | The track |
| `--pp-progress-fill-color` | `--pp-tone-solid` | The fill |
| `--pp-progress-size` | `--pp-space-1/2/3` | Thickness |
| `--pp-progress-radius` | `--pp-radius-full` | The caps |
| `--pp-progress-duration` | `--pp-duration-normal` | The fill's transition |

## Keyboard interaction

None. A progressbar is not focusable.

## Accessibility notes

- `role="progressbar"`; a name is required at the type level (§2).
- `aria-valuenow` only when determinate (§1); `aria-valuetext` for a
  non-percentage reading.
- No live region: a bar that announced every percent would be
  unbearable. The consumer announces the end ("Upload complete") in a
  `Toast` or an `Alert` with `role="status"`.
- **Manual walkthrough:** with a screen reader, a labelled bar at 40 reads
  "Uploading, progress bar, 40%"; the indeterminate one reads the name and
  the role with no number.

## Container behavior

`fill` at every width; the thickness never changes with the width.

## Usage

```tsx
<Stack gap="1">
  <Cluster justify="between">
    <Text id="upload-label" size="sm">Uploading photos</Text>
    <Text size="sm" tone="muted">40%</Text>
  </Cluster>
  <Progress aria-labelledby="upload-label" value={40} />
</Stack>

<Progress label="Connecting" />
<Progress label="Step 3 of 5" value={3} max={5} aria-valuetext="Step 3 of 5" size="sm" />
<Progress label="Failed" value={100} tone="danger" />
```

## Don't

- Don't render a bar with no name; the types will not let you.
- Don't pass `value` for work whose size you do not know; leave it off.
- Don't make it announce: no `aria-live` on it.
- Don't give it a width; a bar fills. Put it in a `Container`.

## Testing notes

- **Unit:** the role, the name from `label` and from `aria-labelledby`;
  `aria-valuemin/max/now` and `data-state="determinate"` with a value;
  no `aria-valuenow` and `data-state="indeterminate"` without; clamping
  and the inline fill variable; a bad `max` falls back and warns;
  `aria-valuetext` through; `size` and `tone` on the root, `accent` by
  default; ref, `className` and a consumer's `style` merged with the fill
  variable; a nameless bar rejected at the type level; axe both themes.
- **Browser:** the fill's width is 40% of the track's; the track's height
  per `size` is the token; the fill's colour is `--pp-tone-solid` in the
  accent scope and the track's `--pp-tone-border-subtle`; the fill's
  transition names `flex-basis` at the normal duration; in RTL the fill's
  end edge is the track's; the indeterminate segment's position changes
  between two reads; under reduced motion the segment is the whole bar,
  its animation the pulse, and the fill's transition none; the bar fills
  its cell at three widths.
- **Break checks (D-035 §3):** drop the fill's `flex-basis` (the 40%);
  drop the sweep (the segment does not move); drop the reduced-motion
  block (the pulse); drop the `lg` thickness (the heights).
- **Screenshot:** a labelled bar per cell plus the sizes, tones, ends and
  the indeterminate one outside the matrix.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **A `showValue` prop?** No: composition (§Usage). Recommend no.
2. **A ring?** No: `Spinner` is the ring; a determinate ring is a chart.
3. **A `success` tone at 100 automatically?** No: the consumer knows
   whether 100 means done or means full. Recommend no.
