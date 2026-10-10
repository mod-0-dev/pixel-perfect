# 3.19 `InputGroup`

| | |
| --- | --- |
| **Tier** | 3 — Form & Action Core |
| **Status** | `review` — written and built 2026-10-10 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings in D-110 §7. Waits only on its CI-authored baselines (D-013) |
| **Sizing contract** | `fill` (the group); `hug` (an addon) |
| **RSC** | `client` — a Field read, a context provider and a press handler |
| **Depends on** | 3.8 `Input` (`done`), 3.7 `Field` (`done`), 3.2 `IconButton` (`done`) for the button case |
| **APG pattern** | None. A text field and, beside it, whatever controls the addons hold, each its own tab stop |

Added to the roadmap by D-110 §7, from the 2026-10-10 gap analysis. The 3C
spec turned `prefix` / `suffix` slots down on `Input` and said that an addon
"needs a wrapper, and a wrapper needs a layout, and that is a different
component with a different sizing story" (tier-3c-inputs.md §3.8). That
component was never built, so the library had no way to draw a search field
with a magnifier, a price with its currency, a password with a reveal, or a
filter with a clear button.

## Purpose

One box around an `Input` and the things that belong inside its edge: an
icon, a unit or prefix, a button that acts on the field. The group draws the
box; the `Input` gives its own up.

It deliberately does **not**: hold a `Textarea`, `Select`, `NumberInput`,
`Combobox` or `DatePicker` (each draws its own box, and the last three
already have addons of their own); attach a separate bordered segment
beside the field (that is a `ButtonGroup`-style seam, not an inset, and
nothing has asked for it); wire an addon's text into the `Input`'s
description (§5); or offer `start` / `end` props (§1).

---

## Decisions this spec asks you to approve

### 1. Parts in DOM order, no `side`

```tsx
<InputGroup>
  <InputGroupAddon><Icon decorative><Search /></Icon></InputGroupAddon>
  <Input aria-label="Search" />
  <InputGroupAddon>⌘K</InputGroupAddon>
</InputGroup>
```

The root is a flex row; the `Input` takes what the addons leave and each
addon hugs. Before and after are the source order, which the inline axis
already mirrors, so a right-to-left page needs nothing (RULES §1). Props
named `start` / `end` were weighed and not taken: they would be a second way
to say what the children already say, and a slot prop is the configuration
RULES §5.6 prefers composition over.

### 2. The group owns the box, so it owns the state the box shows

An invalid box is drawn in the danger tone, and a tone is a context on the
element that reads it (D-007). The `Input` already carries its invalid tone,
but on its own root, inside the group, where the group's edge cannot read
it. So the group resolves `size`, `invalid` and `disabled` itself — its
prop, then the `Field` above it, then the default — writes them on its root
(`data-pp-tone="danger"` included), and hands them to the `Input` through a
context the `Input` reads between its own prop and the field. Precedence for
the `Input` is therefore prop → group → field → default.

`readOnly` stays the `Input`'s prop, and the group reads it from the `Input`
with `:has(.pp-input[data-readonly])`, because a fill needs no tone.

### 3. One box and one ring

The group draws Input's surface on itself: `--pp-control-height-*` as a
minimum height, the inline padding, the radius, the edge
(`--pp-color-border`, 3:1) and the fill. Inside a group the `Input`'s control
has no border, no fill and no outline, and its height is the box's. The focus
ring and the tone-shifted focus edge (D-029, D-039 §4) move to the group with
`:has(.pp-input__control:focus-visible)` — the group is what the user sees as
the field. A button in an addon keeps its own ring, because it is its own
stop.

Spacing: the outer side of the first and last part keeps the control's inline
padding; between the `Input` and an addon is `--pp-control-gap-*`. An addon
holding a `Button` or `IconButton` sits `--pp-space-1` from the edge, because
the button already carries its own padding; the docs say to use a button one
size down, so it fits inside the box.

### 4. A press on the box focuses the field

A `mousedown` on the group that lands on nothing interactive — an icon, a
unit, the padding — focuses the `Input` and is default-prevented, so the field
does not blur and refocus on the way. A press on a link, button or field in an
addon is left alone. A consumer's `onMouseDown` runs first and can prevent it.
A disabled `Input` is not focused. `cursor: text` on the group says so; a
button keeps `pointer`.

### 5. An addon's text is not wired to the Input

A unit in an addon ("EUR") is seen and not announced: a screen reader reads
the `Input`'s name. Wiring every addon into `aria-describedby` was weighed
and not taken — an addon holding a "Show password" button would then
describe the field as "Show password", and an icon would describe it as
nothing. The docs' first "don't" puts the unit in the label instead, and a
consumer can still pass `aria-describedby` to the `Input`.

---

## Sizing contract justification

`fill`, as `Input`: a field takes the inline space its parent gives it. The
root is block-level flex with no width declaration and `min-inline-size: 0`;
the `Input` inside is `flex: 1 1 0`, so it shrinks past its intrinsic 20
characters (D-040). An addon is `flex: none` and hugs its content.

## Anatomy

```
<div class="pp-input-group" data-size="md" [data-invalid] [data-disabled] [data-pp-tone="danger"]>
  ├── <span class="pp-input-group__addon">…</span>
  ├── <span class="pp-input" …><input class="pp-input__control"></span>
  └── <span class="pp-input-group__addon">…</span>
</div>
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-input-group` | `div` | The box. `ref`, `className`, `style`, rest |
| Addon | `pp-input-group__addon` | `span` | Any number, before or after the `Input` |
| Input | `pp-input` | `Input` | Exactly one, the consumer's own |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `Size` | field, then `'md'` | Box and `Input` |
| `invalid` | `boolean` | field, then `false` | Danger tone on the box; `aria-invalid` on the `Input` |
| `disabled` | `boolean` | field, then `false` | The `Input`'s, not an addon button's |

`InputGroupAddon` takes `<span>` attributes only. No `variant`, no `tone`:
the box is Input's surface, and its tone is its validity.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Focused | `:has(.pp-input__control:focus-visible)` | The ring outside the box; the edge in `--pp-tone-focus` |
| Invalid | `data-invalid`, `data-pp-tone="danger"` | Danger edge; danger focus edge while focused |
| Disabled | `data-disabled` | Sunken fill, subtle edge, muted addons (exempt from 1.4.11, D-050) |
| Read-only | `:has(.pp-input[data-readonly])` | Sunken fill |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-input-group-height` | `--pp-control-height-*` | Minimum height |
| `--pp-input-group-border-color` | `--pp-color-border` | Edge |
| `--pp-input-group-radius` | `--pp-control-radius` | Corners |
| `--pp-input-group-bg` | `--pp-color-bg-surface` | Fill |

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| Tab | The `Input`, then each control in an addon, in DOM order |
| Everything else | The `Input`'s or the addon control's own |

No roving focus: a field and a button beside it are separate stops in every
library this was compared with, and a clear button reached by Tab is the
expected way to reach it.

## Accessibility notes

The `Input` keeps every relationship the `Field` gives it (id, label,
description, error). A decorative icon is `Icon decorative`; a meaningful one
is named. A button in an addon needs its own name, which `IconButton`'s
required `label` enforces. Contrast: the edge is `--pp-color-border` (3:1),
addon text is `--pp-color-text-muted` (4.5:1). Forced colours keep the
group's real border and its outline ring (D-110 §2).

## Container behavior

None. A narrow container narrows the `Input`; the addons never wrap or
shrink.

## Usage

See the docs page, [`InputGroup.md`](../components/InputGroup.md).

## Don't

```tsx
// ✗ the unit only in the addon — say it in the label too (§5)
// ✗ a Select, Textarea or NumberInput inside (Purpose)
// ✗ a button at the group's own size (§3)
```

## Manual keyboard walkthrough

1. Tab into a search group: the ring is drawn around the whole box, not the
   text area inside it.
2. Tab again in a password group: focus moves to "Show password", which draws
   its own ring; the box's ring goes.
3. Space toggles the reveal; Shift+Tab returns to the field.
4. Click the magnifier or the "EUR": the field takes focus.

## Open questions

None open. §1–§5 are recommendations adopted under D-069 §1, listed in the PR
for reversal before merge.
