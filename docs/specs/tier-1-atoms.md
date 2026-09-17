# Tier 1 — Atoms

| | |
| --- | --- |
| **Tier** | 1 |
| **Status** | approved at Gate C 2026-09-17 (D-015, D-016) — in `build` |
| **Components** | 1.1 `Text` · 1.2 `Heading` · 1.3 `Icon` · 1.4 `VisuallyHidden` · 1.5 `Separator` · 1.6 `Spinner` · 1.7 `Skeleton` · 1.8 `Badge` · 1.9 `Avatar` · 1.10 `Kbd` · 1.11 `Code` |
| **Depends on** | Tier 0 (`done`) |
| **Approval** | One gate for the group — see [D-014](../DECISIONS.md) |

### Progress

| Component | Status | Component | Status |
| --- | --- | --- | --- |
| 1.1 `Text` | `done` | 1.7 `Skeleton` | `spec` |
| 1.2 `Heading` | `done` | 1.8 `Badge` | `spec` |
| 1.3 `Icon` | `spec` | 1.9 `Avatar` | `spec` |
| 1.4 `VisuallyHidden` | `done` | 1.10 `Kbd` | `spec` |
| 1.5 `Separator` | `spec` | 1.11 `Code` | `spec` |
| 1.6 `Spinner` | `spec` | | |

Eleven components with no internal state (bar one), no keyboard interaction, and
no ARIA surface beyond correct semantics. They are specified together because
the only interesting questions here are the ones that cut *across* them: what
`size` means, what `tone` means, and which element each one renders. Approving
them one at a time would be eleven conversations about the same six decisions.

---

## Decisions this batch asks you to approve

Everything below is a deliberate deviation or an open choice. The rest of the
document is routine.

### 1. The token-layer gap — blocking

Specified as [D-015](../DECISIONS.md) (`proposed`). RULES §3 as written has no
compliant way to declare padding, radius or font size, because the semantic
layer is colour-only. **Nothing in this tier can be implemented until this is
settled.** The proposal is that "semantic tokens only" governs colour, and
dimensional primitives are consumed directly — which is what the linter has
enforced all along.

### 2. Typography needs more than three sizes

RULES §5 fixes `size` at `sm | md | lg`. A type scale cannot live inside three
steps: a UI needs a caption size (12px) *and* a default (14px) *and* a body size
(16px), and that is before any heading.

**Proposal:** `Text` takes `size?: 'xs' | 'sm' | 'md' | 'lg'`. `Heading` takes a
named visual scale independent of its semantic level. Every other component in
the library keeps `sm | md | lg` exactly.

The alternative — a `Caption` component, a `Lead` component — multiplies
components to avoid multiplying enum members, and each new one needs its own
`tone` and `weight` props anyway.

### 3. Text needs a colour role that is not a tone

Body copy is routinely muted or disabled. Those are not tones: there is no
"muted solid fill", and `[data-pp-tone="muted"]` would have to invent one.

**Proposal:** `Text` and `Heading` accept `tone?: 'neutral' | 'muted' |
'accent' | 'danger' | 'success' | 'warning'`. `neutral` and `muted` map to
`--pp-color-text` and `--pp-color-text-muted` directly; the other four set
`data-pp-tone` and read `--pp-tone-text`. The extra value is local to these two
components and does not touch the token layer.

Rejected: a separate `muted` boolean (two props controlling one colour), and
adding `muted` to the global tone set (a tone whose solid fill is meaningless).

### 4. `Skeleton` has no legitimate way to be a given height

A skeleton is a grey box of a specific size, and RULES §1 forbids it from
declaring one. This is the sharpest collision between the sizing contract and
reality in the whole tier.

**Proposal:** `Skeleton` is `fill`, so its inline size is the parent's problem
as usual. Its **block** size comes from one of two places: `lines={n}` derives
it from the type scale for text placeholders, and for everything else the parent
supplies it — a grid row, an `AspectRatio` (2.7), or the documented
`--pp-skeleton-block-size` custom property.

There is no `height` prop. `--pp-skeleton-block-size` is the escape hatch RULES
§3 already sanctions, and it keeps the decision in CSS where the parent's layout
lives.

### 5. `Badge` variants

RULES §5 fixes `variant` at `solid | outline | ghost | plain`. Mapped here as:
`solid` is a filled `--pp-tone-solid` chip, `outline` is a bordered transparent
chip, `ghost` is the tinted `--pp-tone-bg` chip most design systems call "soft",
and `plain` is text with no chrome. No `soft`, no `subtle`.

### 6. `Skeleton` and `Spinner` motion under `prefers-reduced-motion`

The Tier 0 reset globally crushes animation duration to `0.01ms`. For these two
components the animation *is* the information — a frozen spinner reads as a
broken page.

**Proposal:** both declare a reduced-motion variant inside `pp.components`
rather than inheriting the global crush. `Spinner` swaps rotation for a slow
opacity pulse; `Skeleton` drops the sweep and keeps a static tint. Neither ever
becomes fully static, and neither flashes.

---

## Conventions applied to every component in this tier

Stated once here rather than eleven times below.

- Forwards `ref` to the root element.
- `className` and `style` are merged onto the root, never replaced.
- Remaining props are spread onto the root, so `aria-*`, `data-*`, `id`, `title`
  and event handlers pass through.
- `<Name>Props` is exported. No `any`; no unexported type in a public signature.
- CSS lives in `@layer pp.components`, uses logical properties throughout, and
  declares no `width`, `max-width`, `min-width` or `margin`.
- Every component exposes component-scoped custom properties as its override
  API, listed per component below.
- All are server components (no `'use client'`) except `Avatar`, which needs
  state to track image load failure.
- `asChild` is offered only where composition genuinely requires it: `Text`,
  `Heading`, `VisuallyHidden`. Nowhere else — an `asChild` on `Badge` is an
  invitation to put a button inside it.
- **`asChild` works in Server Components**, but only because `Slot` attaches a
  ref exclusively when one exists. Any element carrying a ref throws during a
  server render, and `forwardRef` passes `null` when the consumer gave none.
  Found by the playground prerender of `VisuallyHidden`; pinned by a unit test.

### The shared size scale

Where a component takes `size`, it means these values. Stated once so `Badge`
`sm` and `Avatar` `sm` cannot drift apart.

| `size` | Block size | Font size | Padding-inline |
| --- | --- | --- | --- |
| `sm` | `1.25rem` | `--pp-font-size-1` | `--pp-space-1` |
| `md` | `1.5rem` | `--pp-font-size-1` | `--pp-space-2` |
| `lg` | `1.75rem` | `--pp-font-size-2` | `--pp-space-2` |

These are chip-scale values, correct for `Badge`, `Kbd`, `Code`, `Spinner` and
`Avatar`. They are deliberately *not* control-scale: a `Button` at `md` is
`2rem` tall and belongs to the `--pp-control-*` set that arrives with Tier 3
(D-015). Keeping the two apart now avoids a rename later.

---

## 1.1 `Text`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none (not interactive) |

### Purpose

Body copy with a typography scale, a colour role and truncation. It does **not**
do headings (1.2), inline code (1.11), or spacing between paragraphs — two
`Text` elements in a row are spaced by the `Stack` (2.1) that contains them.

### Sizing contract justification

`fill`. Text is block-level flow content; it occupies the inline space it is
given and wraps. Block-level with no `width` declaration plus `min-inline-size: 0`,
so it shrinks correctly inside a flex or grid parent instead of forcing overflow.

### Anatomy

```
<p class="pp-text" data-pp-tone="danger">
  └── (children)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-text` | `<p>` | `<span>` etc. via `asChild` |

The stylesheet declares no `display`: the `<p>` is block-level natively, and an
`asChild` child keeps its own. Consequence: single-line `truncate` needs a
block box, so it does not clip on an inline `asChild` element. Multi-line
clamping sets its own display and works on either.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | `--pp-font-size-1` … `-4`. Extension approved in decision 2 |
| `tone` | `'neutral' \| 'muted' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'neutral'` | Decision 3 |
| `weight` | `'regular' \| 'medium' \| 'semibold' \| 'bold'` | `'regular'` | |
| `align` | `'start' \| 'center' \| 'end'` | — | Logical; maps to `text-align: start/center/end` |
| `truncate` | `boolean \| number` | — | `true` clamps to one line with an ellipsis; a number clamps to that many lines |
| `asChild` | `boolean` | `false` | Render the single child instead of `<p>` |

No `color`, no `muted` boolean, no `as`.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| tone | `data-pp-tone` (non-neutral, non-muted only) | Rewires `--pp-tone-*` |
| truncated | — | `-webkit-line-clamp` / `text-overflow: ellipsis` |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-text-color` | per `tone` | Text colour |
| `--pp-text-size` | per `size` | Font size |
| `--pp-text-line-height` | `--pp-line-height-normal` | Leading |
| `--pp-text-weight` | per `weight` | Font weight |

### Keyboard interaction

None. Not focusable.

### Accessibility notes

Renders a `<p>`, so it is a paragraph to assistive technology. `truncate` hides
text visually but leaves it in the accessible name and in the DOM, so a screen
reader gets the full string — the ellipsis is a visual affordance only. Colour
is never the sole carrier of meaning: `tone="danger"` on prose is decoration,
and the sentence must still say what is wrong.

`tone="muted"` uses `--pp-color-text-muted`, which the Tier 0 contrast check
holds at ≥ 4.5:1 on step 3 in both themes (D-008).

### Container behavior

No `@container` rules. Wraps naturally at any width; `truncate` clamps.

### Usage

```tsx
<Stack gap="2">
  <Text weight="medium">Privacy policy v4.pdf</Text>
  <Text size="sm" tone="muted" truncate={2}>
    Adds the analytics disclosure the store review flagged.
  </Text>
</Stack>
```

### Don't

```tsx
// ✗ Text does not space itself. The parent owns the gap.
<Text style={{ marginBottom: 16 }}>…</Text>

// ✗ There is no width prop, and there will not be one.
<Text width="50%">…</Text>

// ✗ tone is not a way to make red text mean "error" on its own.
<Text tone="danger">{fieldValue}</Text>   // say what is wrong in words
```

---

## 1.2 `Heading`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | 1.1 |
| **APG pattern** | none |

### Purpose

A heading whose **visual size is decoupled from its semantic level**. Document
outline order is a structural decision; how big the text looks is a design one,
and tying them together is why every app eventually has an `<h4>` styled to look
like an `<h2>`.

### Sizing contract justification

`fill`, for the same reason as `Text`.

### Anatomy

```
<h2 class="pp-heading" data-pp-tone="accent">
  └── (children)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-heading` | `<h1>`–`<h6>` | Chosen by `level` |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | — | **Required.** Renders the matching tag. No default: guessing a document's outline is not something a component can do |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | derived from `level` | `--pp-font-size-4` … `-9`. Decision 2 |
| `tone` | as `Text` | `'neutral'` | |
| `weight` | as `Text` | `'semibold'` | |
| `align` | as `Text` | — | |
| `truncate` | `boolean \| number` | — | |
| `asChild` | `boolean` | `false` | |

Default `size` by `level`: 1 → `3xl`, 2 → `2xl`, 3 → `xl`, 4 → `lg`, 5 → `md`,
6 → `sm`. Set `size` explicitly to break the coupling.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| tone | `data-pp-tone` | Rewires `--pp-tone-*` |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-heading-color` | per `tone` | Text colour |
| `--pp-heading-size` | per `size` | Font size |
| `--pp-heading-weight` | `--pp-font-weight-semibold` | Weight |
| `--pp-heading-line-height` | `--pp-line-height-tight` | Leading |
| `--pp-heading-letter-spacing` | `--pp-letter-spacing-tight` | Tracking |

### Keyboard interaction

None.

### Accessibility notes

`level` is required precisely so the semantic outline is always a deliberate
choice. A page with one `<h1>` and correctly nested descendants is the goal;
this component cannot enforce that, but by refusing to default `level` it
refuses to make it accidental.

Tight leading at the largest sizes is checked against WCAG 1.4.12: line height
stays at or above 1.2, and the token is overridable.

### Container behavior

No `@container` rules in the component. Fluid heading sizes were considered and
rejected — a heading that resizes with its container makes two cards of
different widths disagree about the page's hierarchy.

### Usage

```tsx
<Heading level={1}>Northwind Go 4.0</Heading>

{/* Semantically a sub-heading, visually small. */}
<Heading level={3} size="sm" tone="muted">Readiness by workstream</Heading>
```

### Don't

```tsx
// ✗ Do not pick a level for its size. That is what size is for.
<Heading level={5}>A visually small but structurally top-level title</Heading>

// ✗ Do not use Text with a big size where a heading belongs.
<Text size="lg" weight="bold">Section title</Text>
```

---

## 1.3 `Icon`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none |

### Purpose

A wrapper that gives any SVG consistent sizing, colour and accessible-name
handling. It ships **no icons** — the consumer brings their own set. It exists
so that "is this icon decorative or meaningful?" is answered at the type level
every single time, rather than remembered.

### Sizing contract justification

`hug`. `inline-flex`, sized by `1em` so it matches the text it sits beside
without being told the font size. `size` overrides that with a fixed step for
the cases where an icon stands alone.

### Anatomy

```
<span class="pp-icon" aria-hidden="true">
  └── (the consumer's <svg>)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-icon` | `<span>` | The SVG child is styled via `.pp-icon > svg` |

### Props

```ts
type IconProps = IconBase & (
  | { label: string; decorative?: never }
  | { decorative: true; label?: never }
)
```

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | Accessible name. Sets `role="img"` and `aria-label` |
| `decorative` | `true` | — | Sets `aria-hidden="true"` and removes it from the tree |
| `size` | `'sm' \| 'md' \| 'lg' \| 'inherit'` | `'inherit'` | `inherit` is `1em` |
| `children` | `ReactNode` | — | **Required.** The SVG |

The union is the point: omitting both is a **type error**, satisfying the RULES
§6 requirement that icon-only controls cannot ship without a name. Passing both
is also a type error.

### State

None.

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-icon-size` | `1em` or per `size` | Inline and block size |
| `--pp-icon-color` | `currentColor` | `fill` / `stroke` of the child SVG |

### Keyboard interaction

None. Never focusable — an interactive icon is an `IconButton` (3.2).

### Accessibility notes

`currentColor` means contrast is inherited from the text context and is already
verified at the token layer. `flex-shrink: 0` prevents an icon collapsing inside
a tight `Cluster`, which is the most common icon layout bug.

The SVG child should carry `focusable="false"` for older engines; the wrapper
cannot add it without cloning the element, so it is documented rather than
enforced.

### Container behavior

None.

### Usage

```tsx
<Icon decorative><ChevronRight /></Icon>

<Icon label="Blocked" size="sm"><AlertCircle /></Icon>
```

### Don't

```tsx
// ✗ Type error, and deliberately so.
<Icon><Search /></Icon>

// ✗ An icon that does something is a control, not an icon.
<Icon label="Close" onClick={close}><X /></Icon>   // use IconButton (3.2)
```

---

## 1.4 `VisuallyHidden`

| | |
| --- | --- |
| **Sizing contract** | `n/a` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none |

### Purpose

Content available to assistive technology and hidden from sight. Used for
skip links, live-region text, and the words that make an icon-only control
comprehensible.

### Sizing contract justification

`n/a`. It has no visual box to size.

### Anatomy

```
<span class="pp-visually-hidden">
  └── (children)
```

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | For when the hidden content must be a different element |

### Styling API

None. A component whose appearance is overridable defeats its purpose.

### Accessibility notes

Uses the `clip-path: inset(50%)` technique with `position: absolute`,
`inline-size: 1px`, `block-size: 1px`, `overflow: hidden` and
`white-space: nowrap`. `display: none` and `visibility: hidden` are wrong: they
remove the content from the accessibility tree, which is the opposite of the
intent.

**Not** focus-revealing. A skip link that appears on focus is a different
component with different behaviour; conflating them produces a utility that
sometimes becomes visible and surprises people. Revisit if a `SkipLink` is added
at Tier 6.

The `1px` dimensions here are the one place in the library where a raw length is
correct: they are not a design value but part of a fixed technique, and RULES §1
forbids `width`, not `inline-size: 1px` on a component that renders no visual
box. Flagged for your explicit sign-off, since it reads like a violation.

### Usage

```tsx
<button>
  <Icon decorative><X /></Icon>
  <VisuallyHidden>Close dialog</VisuallyHidden>
</button>
```

### Don't

```tsx
// ✗ Not a way to hide things you might show later. That is conditional render.
<VisuallyHidden>{isCollapsed ? details : null}</VisuallyHidden>
```

---

## 1.5 `Separator`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | [Separator](https://www.w3.org/WAI/ARIA/apg/patterns/separator/) |

### Purpose

A rule between two groups of content, in either orientation. It is **not** a
spacer: it draws a line, and the space around it belongs to the parent's `gap`.

### Sizing contract justification

`fill`. A horizontal separator spans its parent's inline size; a vertical one
spans the parent's block size and takes its thickness from the border token.
Neither declares a width.

### Anatomy

```
<hr class="pp-separator" data-orientation="horizontal">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-separator` | `<hr>` or `<div>` | `<hr>` when decorative, `<div role="separator">` when not |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | |
| `decorative` | `boolean` | `true` | `true` → `<hr aria-hidden="true">`; `false` → `<div role="separator" aria-orientation>` |

Decorative by default, because the overwhelming majority of rules in a UI are
visual grouping that the heading structure already conveys. Announcing every one
of them is noise.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| orientation | `data-orientation` | Switches which axis carries the border |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-separator-color` | `--pp-color-border-subtle` | Line colour |
| `--pp-separator-thickness` | `--pp-border-width-1` | Line thickness |

### Accessibility notes

A vertical separator sets `aria-orientation="vertical"` only when
`decorative={false}`; on an `aria-hidden` element it would be meaningless.
`<hr>` is used for the decorative case because a browser's default mapping is
already correct and needs only `aria-hidden` to silence it.

### Container behavior

A vertical separator needs a parent that establishes a block size — a flex row
with `align-items: stretch` is the usual case. Documented, not enforced: a
component cannot size itself out of a parent that has not committed to a height.

### Usage

```tsx
<Stack gap="4">
  <Text>Engineering</Text>
  <Separator />
  <Text>Design</Text>
</Stack>

<Cluster gap="3">
  <Text>Draft</Text>
  <Separator orientation="vertical" />
  <Text>12 KB</Text>
</Cluster>
```

### Don't

```tsx
// ✗ A separator is not a gap.
<Separator style={{ marginBlock: 24 }} />
```

---

## 1.6 `Spinner`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none (see notes on `status` vs `progressbar`) |

### Purpose

An indeterminate busy indicator. Determinate progress is `Progress` (5.3).

### Sizing contract justification

`hug`. A fixed square at each `size`, `inline-flex` so it sits on a text
baseline inside a button or a `Cluster`.

### Anatomy

```
<span class="pp-spinner" data-pp-tone="accent" role="status">
  ├── <svg class="pp-spinner__track" aria-hidden="true">
  └── <span class="pp-visually-hidden">Loading</span>   (when labelled)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-spinner` | `<span>` | |
| track | `pp-spinner__track` | `<svg>` | An arc on a ring, rotated |

### Props

```ts
type SpinnerProps = SpinnerBase & (
  | { label: string; decorative?: never }
  | { decorative: true; label?: never }
)
```

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | Announced via `role="status"` and visually hidden text |
| `decorative` | `true` | — | `aria-hidden`; for a spinner inside an already-labelled control |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Shared size scale |
| `tone` | `Tone` | `'neutral'` | |

Same discriminated union as `Icon`. A spinner inside a `Button` that already
says "Saving…" is `decorative`; a spinner alone on a page needs a `label`.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| always spinning | — | Continuous rotation |
| reduced motion | — | Opacity pulse instead of rotation |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-spinner-size` | per `size` | Box size |
| `--pp-spinner-color` | `--pp-tone-solid` | Arc colour |
| `--pp-spinner-track-color` | `--pp-tone-border` | Ring behind the arc |
| `--pp-spinner-duration` | `--pp-duration-slow` × 2 | Rotation period |

### Accessibility notes

`role="status"` (an implicit `aria-live="polite"`) rather than
`role="progressbar"`: there is no value to report, and a progressbar without
`aria-valuenow` is a worse lie than a status message.

**Reduced motion (decision 6).** The Tier 0 reset crushes all animation to
`0.01ms`, which would freeze the arc mid-rotation and read as a hung page. This
component declares its own `prefers-reduced-motion: reduce` block inside
`pp.components` and substitutes a 2-second opacity pulse between 1 and 0.4 — a
continuous, non-vestibular signal that something is still happening.

### Container behavior

None.

### Usage

```tsx
<Spinner label="Loading tasks" />

<Button disabled>
  <Spinner decorative size="sm" />
  Saving…
</Button>
```

### Don't

```tsx
// ✗ If you know the percentage, say the percentage.
<Spinner label={`${percent}% uploaded`} />   // use Progress (5.3)
```

---

## 1.7 `Skeleton`

| | |
| --- | --- |
| **Sizing contract** | `fill` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none |

### Purpose

A placeholder for content that has not arrived. It exists to hold layout still,
so the page does not jump when data lands.

### Sizing contract justification

`fill`, with the block-size caveat in decision 4. Inline size comes from the
parent like every other `fill` component; block size comes from `lines`, from
the parent's layout, or from `--pp-skeleton-block-size`.

This is the tier's hardest case and it is worth being explicit: a skeleton
*should* match the size of the thing it stands in for, and the sizing contract
says a component may not decide that. The contract wins. The parent that knows
the real content's size is the parent that should state it.

### Anatomy

```
<div class="pp-skeleton" data-shape="text" aria-hidden="true">
  └── (nothing — it is a box)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-skeleton` | `<div>` | |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `shape` | `'text' \| 'block' \| 'circle'` | `'block'` | Not `variant` — see below |
| `lines` | `number` | `1` | `shape="text"` only. Derives block size from the type scale |
| `radius` | `'sm' \| 'md' \| 'lg' \| 'full'` | per `shape` | |

`shape` rather than `variant` is deliberate. RULES §5 fixes `variant` to
`solid | outline | ghost | plain`, which are *visual treatments of a tone*. A
skeleton has no tone and none of those four words describe a circle. Reusing
`variant` for a different axis of meaning is worse than adding a well-named prop.
**Flagged for approval.**

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| shape | `data-shape` | Radius and block-size derivation |
| reduced motion | — | Static tint, no sweep |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-skeleton-block-size` | per `shape`/`lines` | Height. **The documented way to size a `block` skeleton** |
| `--pp-skeleton-color` | `--pp-color-bg-sunken` | Base tint |
| `--pp-skeleton-highlight` | `--pp-color-bg-raised` | Sweep colour |
| `--pp-skeleton-radius` | per `radius` | Corner radius |

### Accessibility notes

`aria-hidden="true"` on every skeleton. A screen reader gains nothing from being
told there are four grey rectangles. The *container* is responsible for
announcing the wait — `aria-busy="true"` on the region, and a live-region
message if the wait is long. Documented here because it is the part everyone
forgets, and the skeleton cannot do it from the inside.

**Reduced motion (decision 6):** the sweep is removed and the base tint is kept.
A static placeholder is legible; an animated one is not essential information,
so unlike `Spinner` it can stop entirely.

### Container behavior

None of its own. Placement inside a grid or an `AspectRatio` (2.7) is how a
non-text skeleton gets its shape.

### Usage

```tsx
<div aria-busy="true">
  <Stack gap="2">
    <Skeleton shape="text" lines={1} />
    <Skeleton shape="text" lines={3} />
  </Stack>
</div>

{/* The parent decides the height. */}
<AspectRatio ratio={16 / 9}><Skeleton /></AspectRatio>
```

### Don't

```tsx
// ✗ There is no height prop and no width prop.
<Skeleton height={200} width="50%" />

// ✗ A bare skeleton says nothing to a screen reader. Mark the region busy.
<Skeleton shape="text" lines={4} />
```

---

## 1.8 `Badge`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none |

### Purpose

A small, non-interactive label for status or category. **The canonical `hug`
case** — the component that proves stretching everything to full width would
have been wrong.

It is not a chip (no dismiss), not a tag input, and not a button. A badge that
needs an `onClick` is a `Button` with `size="sm"`.

### Sizing contract justification

`hug`. `inline-flex`, sized entirely by its content and padding. Stretching a
status pill across a table cell is the exact failure D-001 was written to
prevent.

### Anatomy

```
<span class="pp-badge" data-pp-tone="danger" data-variant="ghost">
  ├── (optional leading Icon)
  └── (children)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-badge` | `<span>` | |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `'solid' \| 'outline' \| 'ghost' \| 'plain'` | `'ghost'` | Decision 5 |
| `tone` | `Tone` | `'neutral'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Shared size scale |

Default `ghost` because a page of solid badges is a page with no visual
hierarchy; `solid` should be reachable for and therefore mean something.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| tone | `data-pp-tone` | Rewires `--pp-tone-*` |
| variant | `data-variant` | Background / border / colour combination |

| `variant` | Background | Border | Text |
| --- | --- | --- | --- |
| `solid` | `--pp-tone-solid` | none | `--pp-tone-on-solid` |
| `outline` | transparent | `--pp-tone-border` | `--pp-tone-text` |
| `ghost` | `--pp-tone-bg` | `--pp-tone-border-subtle` | `--pp-tone-text-strong` |
| `plain` | none | none | `--pp-tone-text` |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-badge-bg` | per `variant` | Background |
| `--pp-badge-color` | per `variant` | Text |
| `--pp-badge-border-color` | per `variant` | Border |
| `--pp-badge-radius` | `--pp-radius-full` | Corner radius |
| `--pp-badge-padding-inline` | per `size` | Inline padding |

### Accessibility notes

No role. A badge is text with a background, and a `<span>` reads it correctly.

**Colour is never the only signal.** "Blocked" in a red badge must say the word
"Blocked". Every tone/variant pairing meets 4.5:1 in both themes by construction
(D-008), but a colour-blind user reading only the shape gets nothing.

If a badge conveys a count that changes, the *container* owns the live region —
the badge does not announce itself.

### Container behavior

None. Never wraps internally: `white-space: nowrap`, so a badge either fits or
overflows visibly rather than becoming two lines of one word. The parent
`Cluster` (2.2) wraps.

### Usage

```tsx
<Badge tone="danger">Blocked</Badge>
<Badge tone="success" variant="solid" size="sm">Approved</Badge>
<Badge tone="warning" variant="outline">
  <Icon decorative><Clock /></Icon>
  In review
</Badge>
```

### Don't

```tsx
// ✗ A badge you can click is a button.
<Badge onClick={filter}>Blocked</Badge>

// ✗ hug means hug. It will not stretch, and there is no prop to make it.
<Badge style={{ width: '100%' }}>Blocked</Badge>
```

---

## 1.9 `Avatar`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `client` |
| **Depends on** | 1.3 |
| **APG pattern** | none |

### Purpose

A person's picture, with a graceful fallback when there is no image or the image
fails to load. **The only client component in this tier**, and only because
image load failure is runtime state that no amount of CSS can observe.

### Sizing contract justification

`hug`. A fixed square per `size`. An avatar that fills its container is not an
avatar.

### Anatomy

```
<span class="pp-avatar" data-pp-tone="accent" data-state="loaded">
  ├── <img class="pp-avatar__image" alt="">      (while loading / when loaded)
  └── <span class="pp-avatar__fallback">MR</span> (while loading / on error)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-avatar` | `<span>` | Carries the accessible name |
| image | `pp-avatar__image` | `<img>` | `alt=""`; the root names it |
| fallback | `pp-avatar__fallback` | `<span>` | Initials or an `Icon` |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `string` | — | **Required.** The accessible name, and the source of generated initials |
| `src` | `string` | — | Omit for a fallback-only avatar |
| `fallback` | `ReactNode` | initials from `name` | Override the generated initials |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Shared size scale |
| `tone` | `Tone` | `'neutral'` | Fallback background |
| `onLoadingStatusChange` | `(status: 'loading' \| 'loaded' \| 'error') => void` | — | For a group component to coordinate |

`name` is required rather than `alt` being optional, because an avatar with no
accessible name is a decorative blob that still takes up space in the reading
order. Deriving initials from it means the common case needs one prop.

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| loading | `data-state="loading"` | Fallback shown; no layout shift when the image arrives |
| loaded | `data-state="loaded"` | Image shown, fallback removed |
| error / no `src` | `data-state="error"` | Fallback shown permanently |

Uncontrolled only. There is no controlled loading state and there should not be:
the browser owns whether an image loaded, and letting an app claim otherwise
produces an avatar that lies. This is the one documented exception to RULES §5.5,
which governs *user*-controllable state — load status is not that.

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-avatar-size` | per `size` | Box size |
| `--pp-avatar-radius` | `--pp-radius-full` | Corner radius (square avatars: set to `--pp-radius-2`) |
| `--pp-avatar-bg` | `--pp-tone-solid` | Fallback background |
| `--pp-avatar-color` | `--pp-tone-on-solid` | Fallback text |

### Keyboard interaction

None. Not focusable. An avatar that opens a profile is a `Link` or `Button`
wrapping one.

### Accessibility notes

The root carries the accessible name and the `<img>` carries `alt=""`, so the
name is announced once rather than twice. The fallback initials are
`aria-hidden` for the same reason — "MR" read aloud is noise when "Mara
Ellison" is already the name.

Fallback contrast is `--pp-tone-on-solid` on `--pp-tone-solid`, a pairing the
Tier 0 check holds at ≥ 4.5:1 in both themes (D-008).

Initials are derived as the first character of the first and last
whitespace-separated parts, uppercased, using `Intl.Segmenter` where available
so that scripts outside the Latin alphabet and multi-codepoint graphemes are not
sliced in half. Mononyms yield one character. Consumers who need different rules
pass `fallback`.

### RSC

`'use client'` is required: `useState` for load status and an `onError` handler
on the image. Documented in the file header. Server render emits the fallback,
which is also the first client render, so there is no hydration mismatch — the
image swap happens on the load event, after hydration.

### Container behavior

None.

### Usage

```tsx
<Avatar name="Mara Ellison" src="/people/mara.jpg" />

{/* No image: initials on a tone. */}
<Avatar name="Samuel Okafor" tone="accent" size="sm" />

{/* Unassigned. */}
<Avatar name="Unassigned" fallback={<Icon decorative><User /></Icon>} />
```

### Don't

```tsx
// ✗ No name means no accessible name. Type error.
<Avatar src="/people/mara.jpg" />

// ✗ Overlapping avatar stacks are a layout concern, not an Avatar prop.
<Avatar name="Mara Ellison" overlap={-8} />
```

**Note for the roadmap:** an `AvatarGroup` (overlapping stack with a `+3`
overflow badge) is wanted by the consuming app and is not on the roadmap. It is
a Tier 5 composition, not an atom. Proposed as a new item rather than smuggled
in here.

---

## 1.10 `Kbd`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none |

### Purpose

A rendered keyboard key. Used in shortcut hints, command palettes and help text.

### Sizing contract justification

`hug`. A key is as wide as its legend.

### Anatomy

```
<kbd class="pp-kbd">⌘</kbd>
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-kbd` | `<kbd>` | |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Shared size scale |

Deliberately three props short of interesting. A chord is composed, not
configured: `<Kbd>⌘</Kbd><Kbd>K</Kbd>` in a `Cluster`, not `<Kbd keys={['⌘','K']} />`.

### State

None.

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-kbd-bg` | `--pp-color-bg-sunken` | Background |
| `--pp-kbd-color` | `--pp-color-text` | Legend |
| `--pp-kbd-border-color` | `--pp-color-border` | Border |
| `--pp-kbd-radius` | `--pp-radius-1` | Corner radius |

### Accessibility notes

`<kbd>` is the correct element and needs no ARIA. Symbol-only legends (`⌘`, `⌥`)
are ambiguous to a screen reader; where the meaning matters, pair the symbol with
`VisuallyHidden` text, or spell the modifier out. Documented rather than
enforced — the component cannot know whether the surrounding sentence already
says "Command".

Minimum block size is `1.25rem` even at `sm`, so a single-character key stays
square rather than collapsing to a sliver.

### Usage

```tsx
<Cluster gap="1">
  <Kbd>⌘</Kbd>
  <Kbd>K</Kbd>
</Cluster>
```

### Don't

```tsx
// ✗ Not a code element. Inline code is Code (1.11).
<Kbd>npm install</Kbd>
```

---

## 1.11 `Code`

| | |
| --- | --- |
| **Sizing contract** | `hug` |
| **RSC** | `server` |
| **Depends on** | T0 |
| **APG pattern** | none |

### Purpose

**Inline** code — an identifier, a path, a flag — set in the mono face with a
subtle background. Block code with highlighting is `CodeBlock` (5.12), which has
a peer dependency and a completely different set of problems.

### Sizing contract justification

`hug`. Inline content sized by its text. It sits inside a paragraph, so it must
not be block-level.

### Anatomy

```
<code class="pp-code" data-pp-tone="neutral">--pp-space-3</code>
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| root | `pp-code` | `<code>` | |

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Shared size scale |
| `tone` | `Tone` | `'neutral'` | For `danger` in error messages |

### State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| tone | `data-pp-tone` | Rewires `--pp-tone-*` |

### Styling API

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-code-bg` | `--pp-tone-bg` | Background |
| `--pp-code-color` | `--pp-tone-text-strong` | Text |
| `--pp-code-radius` | `--pp-radius-1` | Corner radius |
| `--pp-code-font-size` | `0.9em` | Relative to surrounding text |

Font size is `0.9em`, not a scale step: the mono face has a larger x-height than
the sans face, so matched point sizes look mismatched. Being relative also means
inline code inside a `Heading` scales with it. `size` overrides this with a fixed
step for standalone use.

### Accessibility notes

`<code>` is the correct element. Long identifiers use `overflow-wrap:
anywhere` so a path cannot force a horizontal scrollbar on the whole page — the
one place this component is allowed an opinion about layout, and it is a
defensive one.

Background and text meet 4.5:1 in both themes at every tone (D-008).

### Container behavior

None.

### Usage

```tsx
<Text>
  Regenerate with <Code>npm run tokens</Code> after editing the script.
</Text>

<Text tone="danger">
  <Code tone="danger">launchDate</Code> must be an ISO date.
</Text>
```

### Don't

```tsx
// ✗ Multi-line code is not this component.
<Code>{`function a() {\n  return 1\n}`}</Code>   // use CodeBlock (5.12)
```

---

## Open questions — resolve before Gate C passes

1. **D-015** (the token gap) — accept, or specify a dimensional semantic layer
   instead? **Blocking: nothing can be implemented either way until this lands.**
2. **`size` on `Text` gains `xs`, and `Heading` uses a six-step named scale.**
   Accept the typography exception to RULES §5, or hold the line at three steps?
3. **`tone="muted"` on `Text` and `Heading`.** Accept as a component-local
   value, or add `muted` to the global tone set?
4. **`Skeleton` uses `shape`, not `variant`.** Accept the new prop name?
5. **`Skeleton` has no height prop**, and is sized by `lines`, the parent, or a
   custom property. Accept, or is this the case that justifies an exception?
6. **`VisuallyHidden` declares `inline-size: 1px`.** It renders no visual box, so
   this is technique rather than design — but it is literally a width
   declaration and needs your explicit sign-off.
7. **`Avatar` load status is uncontrolled only**, an exception to RULES §5.5.
   Accept?
8. **`AvatarGroup`** is wanted by the consuming app and is not on the roadmap.
   Add it as a Tier 5 item?

## Implementation order once approved

Dependency order, one at a time under the Gate A limit:

`VisuallyHidden` → `Text` → `Heading` → `Icon` → `Separator` → `Badge` →
`Kbd` → `Code` → `Spinner` → `Skeleton` → `Avatar`

`VisuallyHidden` is first because `Spinner` and `Avatar` both consume it, and it
is the smallest possible component to walk the whole Definition of Done with
before anything harder depends on that process working.
