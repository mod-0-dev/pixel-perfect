# pixel-perfect

## 0.8.0

### Minor Changes

- 52e4f30: Add `RangeSlider` (3.17): a two-thumb range control on the same numeric
  contract as `Slider` and `NumberInput`, for a price band, a day window, an
  acceptable range. The two-thumb case was deferred from `Slider` with two
  blockers named, and this component exists to solve those two and nothing else.
  
  - **Two native `<input type="range">` elements, stacked, each spanning the full
    `min`–`max`.** The drag on a thumb, pointer capture, touch, every keyboard
    row, `role="slider"` with its value attributes, and right-to-left reversal
    are all the platform's.
  - **The inputs are transparent and the thumbs you see are ours.** So the focus
    ring is drawn on the focused thumb alone, by a sibling selector, with nothing
    suppressed — no `outline: none` anywhere. It is also the first slider thumb
    in the library a test can measure.
  - **A press on bare track moves the nearer thumb and keeps dragging it.** The
    `pointer-events` layering that makes both thumbs draggable takes the track
    press away from the inputs, so the root handles it: maps the pointer to a
    value, RTL-aware, picks the nearer thumb, focuses its input and captures the
    pointer until release.
  - **The thumbs cannot cross, and the clamp is on the value.** Each input keeps
    the full range so its travel stays aligned with our thumb; a change that
    would cross is clamped to the other thumb's value. When the two meet, the
    input on top is the one that can move toward the open side
    (`data-thumb-top`), so a pair pushed to `max` can be pulled apart.
  - **The value is a tuple**, `[start, end]`, always ordered, defaulting to
    `[min, max]`. No minimum gap: a zero-width range is a meaningful selection.
  - **`thumbLabels`** (default `['Minimum', 'Maximum']`) names each thumb; the
    group is named by `<Field group>`. `name` goes on both inputs, so
    `FormData.getAll(name)` is `[start, end]`.
  - `onValueChange` fires continuously and `onValueCommit` once, as on `Slider`.
    `size`, `invalid` and `disabled` read from the field; `--pp-range-slider-*`
    mirror `--pp-slider-*`.

### Patch Changes

- 8d088df: Correct `Alert`'s documentation, and say where the checkable controls take a
  tone (D-059). No runtime behaviour changes.
  
  - **An `Alert`'s tone does not reach the `Button`s and `Link`s inside it.** The
    0.7.0 entry said it did. Each writes its own `data-pp-tone` from its default
    (`neutral` / `accent`), and the nearest context wins — so pass `tone` to them
    yourself. Bare text and `currentColor` do take the alert's hue.
  - **`live` only announces reliably on an alert that is already mounted.** For a
    message that appears by mounting, `{saved && <Alert live="polite">}` may be
    read twice or not at all; keep a `role="status"` element mounted and render
    the alert inside it with `live` off. The `tone` and `live` JSDoc now say so.
  - **`Checkbox`, `Radio` and `Switch` take a tone from an ancestor.** There is no
    `tone` prop — the root's own is reserved for `invalid` — so set
    `data-pp-tone` on the `Field`; `invalid` still wins.

## 0.7.0

### Minor Changes

- 26c8334: Add `Alert` (5.2) — a bordered, tone-coloured block for something that happened
  or something that is true. The first component of Tier 5, and what 3.16 `Form`'s
  error summary is built from.
  
  - **`role="alert"` is opt-in.** The component is named `Alert` and is not an
    ARIA alert until you say so: an assertive live region interrupts, and a live
    region announces *changes* to a region that already existed — so one rendered
    into the initial HTML has no change to announce and may be read twice or not
    at all. `live` is `off` (no role), `polite` (`role="status"`) or `assertive`
    (`role="alert"`). `role` rather than a bare `aria-live` attribute, because
    both roles also imply `aria-atomic`.
  - **`onDismiss` reports the intent and hides nothing.** No `open`, no internal
    state, so the component stays a Server Component and a dismissed banner is
    something your app can remember across a reload. The caller unmounts it, and
    owns where focus goes next.
  - **No `variant`, and the rejections were measured.** An `Alert` is the only
    component whose children are arbitrary, so the tone context inherits into
    your `Button`s and `Link`s. A `solid` fill puts `--pp-tone-text` at
    **1.04–1.16:1** in the light theme — not low contrast, invisible — and a
    `plain` one is 1.10:1 against the page, which is not a block at all. One
    treatment ships: `--pp-tone-bg` with a `--pp-tone-border` edge.
  - **Every pairing was computed before the build and every one is already
    asserted by `lint:contrast`**: title 14.02–14.35 light / 12.76–12.98 dark,
    body and dismiss glyph 4.59 in both themes, edge 3.04–3.08 against its own
    fill and 3.40 / 3.66 against the page. The fill is step 3 *because* that is
    the step those checks are named after.
  - **No default icons.** `icon` takes your SVG and wraps it in
    `<Icon decorative>`; the library ships none of its own.
  - **`title` renders a `<div>`, not a heading** — the right level is `h2` in a
    page banner and `h3` inside a card, and the component knows neither. Pass a
    `Heading` as `title` when the alert really is a section of the document. It
    also reclaims the name from HTML's `title` tooltip attribute, which is
    omitted from the props type.
  - No `size`; `--pp-alert-padding-block` / `-inline` are the escape.
- 253eed7: Add `Form` (3.16): a `<form>` that summarises the errors your app found and
  refuses a second submission while the first is pending. It does not validate
  and holds no field values.
  
  - **Error summary.** `errors: FormError[]` (`{ target, message }`) renders a
    danger `Alert` as the form's first child, with one link per error. Each link
    is a real `#target` href, so it works without JavaScript. With JavaScript,
    following a link focuses the control and scrolls its whole field, label
    included, into view. A group `Field` is targeted by its own `id`, and the
    checked radio (or the first one) gets focus.
  - **`Field` is unchanged.** Targets are `Field`'s existing `controlId`, so each
    message is passed twice: to the `Field` and to the summary.
  - **Focus moves to the summary after a submit that produced errors**, including
    one that resolves after `pending`, and when the form mounts with errors. It
    never moves for errors set without a submit, such as validation on blur.
  - **`pending` cancels any submit while set**, including a React 19 `action`, and
    disables nothing, so focus stays on the button that was pressed.
  - **`noValidate` defaults to `true`.** Native validation would cancel the submit
    for an empty required field before your `onSubmit` ran.
  - `gap` uses the shared space scale (default `'5'`), and `--pp-form-gap` overrides it.
  - Test setups on jsdom need an `Element.prototype.scrollIntoView` stub.

### Patch Changes

- 6e97ea8: **The focus ring is now solved against every surface it can be drawn on, not
  just the page** (roadmap 0.11, D-056).
  
  `--pp-color-focus-ring` was solved and asserted against step 1 alone, three
  lines above an `edge` that has been solved against steps 1, 2 **and** 3 since
  D-050. Its other neighbours were real the whole time: `--pp-color-bg-surface` is
  step 2 and shipped at 2.94 / 2.85 from Tier 3A, and any toned surface is step 3,
  where `Alert` (5.2) put a focusable control at 2.74–2.77 light and 2.54–2.57
  dark — against WCAG 1.4.11's 3:1.
  
  - The ring solves against all five hues' steps 1–3, not only neutral's. A
    border's surfaces are neutral, because a danger-toned input sits on the page;
    a ring's are not, because it is drawn on whatever the focused thing sits on.
  - Light moves L 66.18% → 63.34%, dark L 49.70% → 53.99%. **Worst pairing in the
    library: 2.54:1 → 3.06:1**, both themes, all five hues, all three surfaces.
  - `npm run lint:contrast` goes from 242 assertions to **293**, including a
    cross-hue set for the one ring colour that actually ships.
  - The `/tokens` gallery now renders `focus`, `edge` and `edge-strong` — the
    three solved off-ramp steps it had never drawn, so a change to the only tokens
    with a stated contrast obligation moved no pixel in any screenshot.
  
  Nothing but the ring's colour changes. No component CSS was touched.

## 0.6.0

### Minor Changes

- 934f578: **A control's boundary now meets WCAG 1.4.11.** `--pp-color-border` measured
  1.55:1 against the page in the light theme, where `--pp-color-bg-surface` *is*
  `--pp-color-bg-page` — so a text field's fill is literally the page and the
  border was the only thing identifying the control. Every control in Tiers 3A–3C
  shipped below the 3:1 floor.
  
  - Two **off-ramp** solved primitives per hue, joining `-focus`, `-on-solid` and
    `-solid-active`: `--pp-palette-<hue>-edge` (≥3:1 against every neutral
    surface) and `-edge-strong` (≥4.5:1). The 1–8 ramp is untouched, because a
    conforming neutral border lands at L 0.633 — below step 8's fixed L 0.780 —
    so putting it at step 7 inverts the ramp.
  - `--pp-color-border` and `--pp-color-border-strong` (and their `--pp-tone-*`
    counterparts, in all five hues) re-point at those steps.
    `--pp-color-border-subtle` deliberately does **not**: a divider is not a user
    interface component, and a 3:1 divider is a black line across the page. RULES
    §3 now states which to reach for.
  - `npm run lint:contrast` gains the border-vs-surface pairings it never had —
    170 → 242 assertions — and now also asserts the semantic **mapping** by name,
    so re-pointing a token back at a ramp step fails the build instead of
    silently returning every control to 1.55:1.
  - `Spinner`'s track moves to the decorative step — at 3:1 it read as a ring
    rather than an arc. `Skeleton`'s sweep, `Badge`'s outline and `Kbd`'s keycap
    keep the new edge on purpose; the skeleton's dark sweep is wider than its
    light one as a result, which is recorded rather than "fixed", because the
    symmetric version left the dark bars barely visible.
  - Every **disabled** control drops to `--pp-color-border-subtle`. WCAG exempts
    inactive components, and leaving them on the live edge erases the difference
    the exemption exists to allow.
  
  **Visually breaking in a minor release:** every bordered control has a darker,
  clearly visible edge in both themes. Override `--pp-<component>-border-color`
  per component, or re-point `--pp-color-border` in your own layer, if you were
  relying on the old hairline.
- 23b7551: Add `NumberInput` (3.14) — a numeric text field with steppers, bounds, a step,
  and formatting that is correct outside en-US. The first component of Tier 3D.
  
  - **`type="text"` with `role="spinbutton"`, never `type="number"`.** That input
    mutates its value on a scroll wheel over a focused field, rejects a locale
    decimal comma, and reports `value === ''` for anything it cannot parse, so
    `1,5` in a German locale is silently lost. It also cannot hold `1.234,5`,
    which rules it out a second time the moment formatting exists.
  - **`null` is empty; `undefined` is uncontrolled.** `value={undefined}` already
    means "uncontrolled" to the shared state hook, so an empty *controlled* field
    spelled that way switches modes silently and stops answering to its owner.
    `number | null` makes it a type error at the call site instead.
  - **`min`, `max` and `step` are applied on commit — blur, a stepper, an arrow
    key, Enter — and never while you are typing.** At `step={10}`, snapping per
    keystroke turns `1` into `10` before the `5` arrives, so `15` cannot be typed
    at all. The snap is rounded to `step`'s own precision, so a `step={0.1}` field
    produces `0.3` rather than `0.30000000000000004`. Text that is not a number
    reverts rather than clearing: a typo should not destroy data nobody asked to
    delete.
  - **Formatting is opt-in, and that is a hydration ruling.** `Intl.NumberFormat`
    with no locale resolves the runtime's — Node's on the server, the user's in
    the browser — so an ambient locale breaks server/client agreement in a
    component that never mentions the viewport. Without `locale` the display is
    `String(value)`. With one, parsing is derived from the *same* formatter via
    `formatToParts`, so separators and non-Latin digits round-trip without a
    hardcoded list.
  - **The steppers are plain buttons and are not tab stops.** `IconButton` is
    square on the control scale, so two stacked is 80px of button in a 40px
    control — the reuse is arithmetically impossible. `type="button"` is set and
    tested, because a `<button>` in a `<form>` defaults to `submit`. They disable
    at the bound they reach, and on an empty field the first press commits the
    bound that exists rather than starting from an invisible zero.
  - **The control is the surface and the steppers overlay it**, which is `Select`'s
    structure with two buttons instead of one chevron. The first build put the
    surface on the wrapper and drew the ring with `:has()`, which rendered two
    concentric focus rings — the reset draws one on the inner input too. Four
    components now read `--pp-control-*` and are the same height in a row.
  
  `Intl.NumberFormat` is constructed during render with an explicit locale or not
  at all, so the markup is identical on the server and the client.
- f78db62: Add `Select` (3.13) — the native `<select>` on the shared control surface, with
  our chevron. Tier 3C is complete.
  
  - **The platform popup is kept.** `appearance: none` repaints the closed box and
    nothing else, so the open list stays the operating system's: a wheel on iOS, a
    listbox on desktop, correct with a screen reader and in a right-to-left locale
    with no code of ours involved. The custom listbox — typeahead, async options,
    multi-select — is `Combobox` (4.11). `multiple` is a type error, and is
    stripped at runtime for the caller who ignores the type.
  - **`placeholder` seeds `defaultValue=""` rather than relying on `selected`.**
    The HTML *ask for a reset* algorithm picks the first option **that is not
    disabled**, so a disabled placeholder is skipped and the browser silently
    selects option two. Seeding routes through the `value` setter, which has no
    such exclusion. Give `value` or `defaultValue` and yours wins.
  - **The placeholder is painted from `:has(option[data-pp-placeholder]:checked)`,
    not from an attribute.** This control holds no state, so an uncontrolled
    select's selection changes without React being told — as do `form.reset()` and
    a write through the ref. `data-placeholder` is on the root for consumers to
    style off, and only when the select is controlled; it is omitted rather than
    guessed otherwise.
  - The chevron is `--pp-color-text-muted`: 5.10:1 on the light surface, 5.12:1 on
    the dark one, against the 3:1 WCAG 1.4.11 asks of the graphic that identifies
    a control — which it is, now that the platform's own arrow is gone. Measured
    before the component was written; both pairings are ones the token layer
    already verifies.
  - Options are `children`, so `<optgroup>` and disabled options are just markup.
    `--pp-select-padding-inline` moves both edges and the chevron's reserved room
    together, so a long value truncates before it reaches the glyph.
  - No `readOnly`: HTML has none for `<select>`, a `pointer-events` fake leaves the
    control operable from the keyboard, and `disabled` alone drops the value from
    the form.
- 23b7551: Add `Slider` (3.15) — a single-thumb range control on `<input type="range">`.
  Tier 3D's second and last component.
  
  - **The native element is the painted control.** Arrow keys, Home/End,
    Page Up/Down, step-on-drag, pointer capture including drag-outside-and-back,
    touch, `role="slider"` with the value attributes, and right-to-left reversal
    all come from the platform; the component installs no key handler at all. That
    is what keeps Tier 3 at zero runtime dependencies.
  - **The track is ours and the thumb is the platform's.** The filled portion is a
    **grid column**, not a `linear-gradient`: a gradient needs `to right`, which
    fills from the wrong end in an RTL layout where the native control reverses,
    and it would have to be written twice because the WebKit and Firefox track
    pseudo-elements cannot share a selector list. Grid columns follow the inline
    axis, so RTL is correct with nothing declared about it.
  - **`onValueCommit`, because React does not expose the native `change` event for
    a range input.** `onChange` maps to *input*, so it fires on every pixel of a
    drag; without a commit callback the only way to avoid a request per pixel is
    to reimplement pointer and key release handling. A commit fires only when the
    value actually changed, so tabbing past a slider sends nothing.
  - **Single-thumb only.** A two-thumb range is a separate component: two
    overlapping inputs each draw `:focus-visible` across the whole track, and
    moving the ring onto the thumb pseudo-element needs `outline: none`, which
    this library bans outright.
  - **No `readOnly`** — the attribute is defined for text-like controls and the
    browser ignores it on a range, so offering it would be a promise the platform
    refuses to keep. No `required` either: a slider always has a value.
  - `min`, `max`, `step`, `locale`, `formatOptions`, `value`, `defaultValue` and
    `onValueChange` mean exactly what they mean on `NumberInput` — one numeric
    contract, two controls, shared in one internal module rather than implemented
    twice.
  
  The rule lint gains a rule with this component: **no selector list may mix a
  `-webkit-` and a `-moz-` pseudo-element.** An unknown pseudo-element invalidates
  the entire list in the engine that does not know it, so grouping the two thumb
  blocks silently unstyles Firefox while looking correct in Chrome.

## 0.5.0

### Minor Changes

- 85ac430: Add `Radio` and `RadioGroup` (3.11) — one choice from a visible set, on the
  native input, painted with `appearance: none`.
  
  - **No roving tabindex.** Radios sharing a `name` already implement the APG
    Radio Group pattern in every browser, and `RadioGroup` generates that `name`
    from `useId()` so two unnamed groups are not silently one group.
  - The group owns the value, because a radio that is deselected by a sibling is
    told nothing — `value` / `defaultValue` / `onValueChange` on the group, no
    `checked` prop on the option.
  - 16 / 20 / 24 from the size scale, and `gap` defaults to `"3"` because that is
    the floor at which WCAG 2.5.8's spacing exception holds for `sm`.
  - The stylesheet paints from `:checked` rather than from `data-state`, so a
    radio the platform changes behind React's back is still painted correctly.
  - Reads `size`, `required`, `disabled` and invalid state from `Field` through
    the group; an explicit prop always wins, including `disabled={false}`.
- f11d6ee: Add `Switch` (3.12) — an on/off control whose effect is immediate, on the native
  input, painted with `appearance: none`.
  
  - `role="switch"` on a native `<input type="checkbox">`, which is the APG
    construction: the semantics, the keyboard and the form participation stay, and
    only the announced role changes. `data-state="checked|unchecked"` is the line
    against `Toggle`, which is `aria-pressed`.
  - **The off state is a thumb, not a track colour.** The specified
    `--pp-color-border-strong` track measured 1.97:1 on the page in the light
    theme, and a surface thumb on it 1.97:1 too, so the thing that says which way
    the switch is set was the part that failed WCAG 1.4.11. Off is now the
    library's resting control surface with a `--pp-color-text-muted` thumb (5.10:1
    light, 5.49:1 dark); on is `--pp-tone-solid` with a `--pp-tone-on-solid` thumb.
    Both are pairings the token layer already verifies.
  - A 2:1 track at the checkable block sizes — 32×16 / 40×20 / 48×24 — so a `md`
    switch is exactly as tall as a `md` checkbox beside it. The thumb, the inset
    and the travel all derive from the track's block size, so one override moves
    all four.
  - The thumb moves with `inset-inline-start`, not `translate`: a translated thumb
    travels rightwards in every writing mode and would run the switch backwards
    in RTL.
  - Reads `size`, `required`, `disabled` and invalid state from `Field`; an
    explicit prop always wins, including `disabled={false}`.

## 0.4.0

### Minor Changes

- ecab9f0: `Scroller` with `orientation="both"` now measures and shades both axes. It
  reports the block axis as `data-overflow`, as before, and the inline axis as a
  new `data-overflow-inline` attribute; all four edges draw a shadow when content
  lies beyond them. As shipped, `both` measured the block axis only and the inline
  edge had no shadow and no attribute. `vertical` and `horizontal` are unchanged
  and carry no inline attribute. See D-046.

### Patch Changes

- ecab9f0: A `Field` with `orientation="horizontal"` — the checkbox arrangement — now shows
  a pointer cursor over its label, so the whole row reads as the click target it
  is. It sets `Label`'s `--pp-label-cursor` on its own root; a disabled field does
  not, because clicking a disabled control's label does nothing.
  
  `Label`'s documentation said `Checkbox` would set this property on its own root.
  It never did, and it could not have reached the label from there: inside a
  `Field` the label is the control's sibling, and a custom property only inherits
  downward. See D-045.

## 0.3.0

### Minor Changes

- e860b48: Add `Checkbox` (3.10) — a binary or tri-state checkbox on the native input,
  painted with `appearance: none` and marked by an inline `Icon`.
  
  - 16 / 20 / 24 from the size scale, not the 32 / 40 / 48 control scale. `sm` and
    `md` conform to WCAG 2.5.8 through the spacing exception, which is the same
    geometry behind `RadioGroup`'s `gap` default.
  - `checked` / `defaultChecked` / `onCheckedChange` with a third state the caller
    owns: clicking an indeterminate box produces `true`, never `'indeterminate'`.
    The native `onChange` is chained rather than replaced, so `register()` from
    `react-hook-form` still works.
  - Reads `size`, `required`, `disabled` and invalid state from `Field`; an
    explicit prop always wins, including `disabled={false}`.
- 897c388: Add `Textarea` (3.9): a multi-line text control on the same surface as `Input`,
  with opt-in auto-resize.
  
  It reads `size`, `required`, `disabled` and the invalid state from the `Field`
  above it through `useField()`, works standalone when there is no field, and
  follows the same precedence rule as every control in this tier: an explicit prop
  beats the field, which beats the default — including `disabled={false}` inside a
  disabled field, which does enable the control. `value`, `defaultValue` and
  `onChange` go straight to the DOM, as they do for `Input`.
  
  `autoResize` grows the control with its content and never below `rows`. The
  measurement resets `block-size` to `auto` before reading `scrollHeight`, which
  is both halves of the mechanism: `scrollHeight` is max(content, client), so
  measuring against a height the component wrote itself could only ratchet upward
  and never shrink — and the reset is also where the `rows` floor comes from, with
  no second source of truth to drift from. It re-measures on width changes only;
  writing `block-size` is itself a resize, so watching height would re-enter
  forever. CSS `field-sizing: content` is deliberately not used: shipping both
  means two resize behaviours depending on the browser, and the one that is easy
  to test is the one that is not running for your users.
  
  `resize` is `'vertical'` or `'none'`. There is no `'horizontal'` — a
  user-widened textarea overflows the `Field`'s grid column and takes the layout
  with it, which is the one thing the sizing contract exists to prevent.
  
  The vertical padding is derived from `--pp-control-*` rather than picked off the
  space scale, because the scale cannot express the 10.2px `lg` needs. The payoff
  is that a one-row `Textarea` is exactly an `Input`'s height at every size, by
  construction rather than by anyone checking.

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
