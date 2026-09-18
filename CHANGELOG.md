# pixel-perfect

## 0.2.0

### Minor Changes

- ca2c923: Add `Input` (3.8): a single-line text control on the shared control surface,
  and the first of Tier 3C.
  
  It reads `size`, `required`, `disabled` and the invalid state from the `Field`
  above it through `useField()`, and works standalone when there is no field. One
  precedence rule everywhere: an explicit prop beats the field, which beats the
  default — including `disabled={false}` inside a disabled field, which does
  enable the control.
  
  `value`, `defaultValue` and `onChange` go straight to the DOM. That is the
  fullest compliance with the controlled-and-uncontrolled rule rather than an
  exception to it: React's own inputs already implement it, and wrapping them
  would hand you an `onChange` taking a bare string, which `react-hook-form`
  cannot register and which cannot read `event.target.validity`.
  
  **It renders two elements, because an `<input>` does not fill.** A block element
  with no width declaration fills its parent — except a form control, which has an
  intrinsic inline size from the HTML `size` attribute and measures 185px inside a
  600px parent. The root is a one-cell grid, the control stretches into it, and no
  width is declared anywhere. `ref` and every native prop go to the `<input>`;
  `className` and `style` go to the root, which is the box you are styling.
  
  Focus draws two different things: the one library-wide ring outside the box, and
  a tone-shifted border inside it — so an invalid field stays red while you are
  fixing it instead of losing its error state the moment you click into it.
  
  `size` is the control scale and never the HTML attribute, which counts
  characters. `type` is an allow-list; `checkbox`, `radio`, `range`, `file` and
  the button types are other components, and `color` and `hidden` are not text
  fields.

## 0.1.0

### Minor Changes

- 6d265e8: Add `AspectRatio` (2.7): reserves a box of a given shape before its content
  loads, so an image or embed does not shift the page when it arrives.
  
  The root is a grid with the child at `1 / 1`, because a single grid item
  stretches on the inline axis by default — so the child fills both axes without
  the component ever declaring `inline-size`. `ratio` is required; there is no
  ratio that is right when you did not think about it.
- 3b7edec: Add `Avatar` (1.9): an image with initials fallback, required `name`, and `data-state` for load status.
- 3b7edec: Add `Badge` (1.8): a status chip with `variant`, `tone` and `size`, sized by its content.
- f3bcbfa: Add `ButtonGroup` (3.4): related buttons rendered as one attached unit, with a
  required `label` and `orientation`.
  
  It is the attached case and only the attached case — a group that merely spaces
  buttons out *is* `<Cluster gap="2">`, so there is no `attached` prop. It does
  not manage selection: one-of-many is a `RadioGroup`, several-of-many is a row of
  `Toggle`s.
  
  It styles its children by descendant selector rather than cloning them with
  props, so `asChild` children and mixed `Button` / `IconButton` contents work.
  Every button keeps its own tab stop, deliberately not the APG toolbar's roving
  tabindex — that is `Toolbar` (6.6).
- f3bcbfa: Add `Button` (3.1): an action control with `variant`, `tone`, `size`, a
  `loading` state and `asChild`. It hugs its label — there is no `fullWidth`
  prop; stretch it from the parent.
  
  Two things it brings that outlive it:
  
  - **`--pp-control-*` tokens.** Height, inline padding, gap, font size and
    radius for every control in the library, so a `Button` and an `Input` at
    `size="md"` are the same height by construction. Retune all controls at once
    by setting `--pp-control-height-md` rather than a per-component property.
  - **`--pp-tone-solid-active`**, a new semantic token for the pressed state of a
    solid fill, verified at 4.5:1 against its on-solid text in both themes and
    all five tones.
  
  `loading` sets `aria-disabled` rather than `disabled`, so the button keeps its
  place in the tab order — a browser blurs a focused element the instant it is
  disabled, which loses a keyboard user's place mid-submit. `type` defaults to
  `"button"`, not HTML's `"submit"`.
- 6d265e8: Add `Center` (2.5): centres its children in the box it was given, on either axis
  or both.
  
  It does not constrain a measure — that is `Container` — and it has no height
  prop. Block size comes from the parent or from `--pp-center-min-block-size`, the
  same answer `Skeleton` gives to the same problem.
- 6d265e8: Add `Cluster` (2.2): a horizontal row that wraps, with `gap`, `align`,
  `justify` and `wrap`.
  
  Wrapping is the default and needs no container query — flex resolves it
  continuously against the space available, so the same `Cluster` is correct in a
  240px sidebar and a 960px page without being told which it is in.
  
  `align` defaults to `center` rather than `Stack`'s `stretch`: a row of
  mixed-height things reads correctly centred, and that is nearly every row.
- 3b7edec: Add `Code` (1.11): inline code that tracks its surrounding text size, with `tone` and an opt-in fixed `size`.
- 6d265e8: Add `Container` (2.4) — the only component in the library permitted to set
  `max-inline-size`, which is its entire job.
  
  Takes `size` (`40rem` / `64rem` / `80rem`) and `gutter`. The gutter defaults to
  a non-zero step where `gap` defaults to zero: a zero gap is a legitimate design,
  a zero page gutter is text against the edge of a phone screen.
  
  Adds `--pp-measure-sm/md/lg` to the token layer — a third dimensional scale,
  answering how wide content may run rather than how far apart boxes sit or how
  big a box is (D-025).
  
  Building it also found that the raw-unit lint never covered `max-inline-size`,
  `block-size`, `min-block-size`, `max-block-size` or `flex-basis`. It does now,
  with fixtures so the rule is observed firing.
- 5de2407: Add `Label` (3.6): the visible name of a form control, and the first half of the
  `Field` foundation.
  
  It rides the control scale rather than the text scale — `size` resolves
  `--pp-control-font-size-*`, the same token the input beside it reads — so a
  label and its field agree by construction. That makes `sm` and `md` the same
  type size deliberately: a control gets small by losing height and padding, and a
  12px label is not a smaller label.
  
  `required` renders an `aria-hidden` asterisk rather than visually-hidden text,
  because the control already announces the state and two announcements are worse
  than one. It is presentational: `Label` has no control to mark, so set
  `required` on the input too, or let `Field` set both.
  
  `invalid` exposes `data-invalid` and changes nothing visually. A field in error
  already has a red border, a red message and `aria-invalid`; a red label is the
  fourth signal and the only one made of colour alone. Restyle it in one selector
  if you disagree.
- 6d265e8: Add `Grid` (2.3) in three modes: `columns={n}` for a fixed count,
  `minItemInlineSize` for an `auto-fit` track that reflows with no query at all,
  and `columns="<template>"` for the asymmetric cases neither covers.
  
  `columns` and `minItemInlineSize` are mutually exclusive in the type rather than
  by precedence. Every generated track is `minmax(0, 1fr)` — bare `1fr` carries a
  `min-content` floor that lets one long string push the grid past its container.
  
  Also exports `gridTracks`, the pure track-list function, and establishes D-024:
  a component writes a private custom property and the stylesheet reads the public
  one first, so a consumer's override still works from an ancestor.
- 3b7edec: Add `Heading` (1.2): `h1`–`h6` by required `level`, with a visual `size` decoupled from it.
- f3bcbfa: Add `IconButton` (3.2): a square `Button` whose accessible name is required by
  the type. `label: string` is non-optional, so an unnamed icon button does not
  compile — which is why it is a separate component rather than a `Button` prop.
  
  Pass the raw SVG as children; it is wrapped in `<Icon decorative>` so the
  control is never named twice. `size` sets the box from `--pp-control-height-*`
  and passes through to `Icon`, so a 32px button holds a 16px icon with no second
  scale to keep in step.
  
  `variant` defaults to `"ghost"` rather than `Button`'s `"solid"`. It takes no
  `asChild`: `children` is already the SVG, so there is no slot for a delegate.
- 3b7edec: Add `Icon` (1.3): an SVG wrapper with `1em` sizing, `currentColor`, and a required `label` or `decorative` at the type level. Adds the `--pp-size-*` element-size scale to the token layer.
- 3b7edec: Add `Kbd` (1.10): a keycap with `size`.
- f3bcbfa: Add `Link` (3.3): a text link with `tone`, `underline` and `asChild`. Server
  component.
  
  `underline` defaults to `"always"` — colour alone fails WCAG 1.4.1, so a link
  in running text is underlined unless you opt out with `underline="hover"` for
  navigation lists. It takes no `variant` and no `size`: neither vocabulary has a
  word a link needs, and a link takes the size of the text around it.
  
  It declares no `display`, so it wraps across lines like any other inline text.
  
  Also extends the rule lint: `text-underline-offset` and
  `text-decoration-thickness` are length-valued properties that were not covered
  by the raw-unit ban, so component CSS could have hardcoded a pixel value in
  either without anything objecting.
- 5de2407: Add `Field` (3.7): a labelled control with its description, its error, and the
  ARIA relationships between them — wired once instead of at every call site.
  
  `Field` owns the ids, associates the label, points `aria-describedby` at
  whichever of the description and the error actually rendered, and passes `size`,
  `required`, `disabled` and the invalid state to both the label and the control.
  `error` is the invalid state; there is no `invalid` prop to contradict it, and an
  empty string is a valid field rather than an empty message.
  
  Controls read their wiring from the exported `useField()` hook rather than being
  cloned, so a control still works standalone, keeps working when you wrap it in
  something, and can be one of your own. Precedence is the same everywhere:
  an explicit prop beats the field, which beats the default.
  
  For a control the library does not own, `children` may be a render prop —
  `{(control) => <input {...control} />}`. Note that a function cannot cross the
  server/client boundary, so that form requires the calling component to be a
  Client Component; passing an element works from anywhere.
  
  Also adds `orientation="horizontal"` for the checkbox arrangement, `group` for
  controls that are not labelable, `labelHidden`, and `controlId` for when the
  control's id has to be a known value.
- 6d265e8: Add `Scroller` (2.8), completing Tier 2. An overflow container that reports
  which edge has content beyond it, as `data-overflow` in the DOM and as a
  gradient shadow.
  
  `label` is required: a scrollable region a keyboard user can reach is WCAG
  2.1.1, and a focusable region with no accessible name is a 4.1.2 failure.
  
  The only client component in the tier — scroll position is a browser fact.
  It uses `ResizeObserver` unguarded, so jsdom test suites need a stub; the
  Scroller docs page has one.
- 3b7edec: Add `Separator` (1.5): a horizontal or vertical rule, decorative by default, drawn with a single logical border.
- 3b7edec: Add `Skeleton` (1.7): text, block and circle placeholders with a reduced-motion-safe shimmer and no height prop.
- 3b7edec: Add `Spinner` (1.6): an indeterminate busy indicator with a required `label` or `decorative`, and a reduced-motion pulse.
- 6d265e8: Add `Split` (2.6): a fixed pane beside a flexible one, collapsing to stacked
  when the container — not the viewport — gets narrow.
  
  Compound: `Split.Sidebar` and `Split.Main`, each taking `asChild` so they can be
  landmarks. There is no `side` prop; a right-hand sidebar is `Split.Main` written
  first, because `order` would desynchronise reading order from visual order.
  
  `collapseBelow` is named (`sm` / `md` / `lg` / `never`) rather than a free
  length, because a container query condition cannot read a custom property.
- 6d265e8: Add `Stack` (2.1), the first Tier 2 layout primitive, and the shared `gap` scale
  the rest of the tier is built on.
  
  `Stack` is a flex column with a gap and a cross-axis `align`. `gap` is a new
  fixed-vocabulary prop taking a step of the space scale as a string —
  `gap="4"` resolves to `--pp-space-4` (D-020). It defaults to `"0"`, which is
  load-bearing: the scale is mapped onto an inheriting custom property, so the
  attribute must always be emitted or a nested layout silently inherits its
  parent's rhythm.
  
  Also exports the `Space`, `Align` and `Justify` vocabulary types, and adds a
  `--pp-color-shadow-edge` semantic token for the fading gradients `Scroller`
  (2.8) will need (D-023).
- 3b7edec: Add `Text` (1.1): body copy with `size`, `tone`, `weight`, `align`, `truncate` and `asChild`.
- a39117e: Foundations: OKLCH design tokens with contrast solved rather than eyeballed,
  cascade layers, a minimal non-invasive reset, and the rule lint that enforces
  the sizing contract.
  
  Consumers import one stylesheet:
  
  ```ts
  import "pixel-perfect/styles.css";
  ```
  
  Themes bind to any element via `data-pp-theme`, so a dark sidebar in a light
  page works. Tone is a CSS context via `data-pp-tone`. No components yet.
- f3bcbfa: Add `Toggle` (3.5): a button that stays pressed, with
  `pressed` / `defaultPressed` / `onPressedChange` — controlled and uncontrolled,
  both, always. Switching between the two mid-life now warns in development
  rather than going silently inert.
  
  It is `aria-pressed`, not `aria-checked`, and exposes `data-state="on" | "off"`.
  That vocabulary is reserved for pressed controls; `checked` / `unchecked` stays
  with `Switch` and `Checkbox`, so what a control *is* reads off the DOM.
  
  Takes no `loading`: a toggle's effect is immediate by definition.
- 3b7edec: Add `VisuallyHidden` (1.4): content for assistive technology only, with `asChild`.
