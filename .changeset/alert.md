---
'pixel-perfect': minor
---

Add `Alert` (5.2) — a bordered, tone-coloured block for something that happened
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
