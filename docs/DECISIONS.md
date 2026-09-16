# Decisions

Append-only log of rulings that shape the library. One entry per decision.
Consistency across sessions depends on this file — an undocumented precedent is
not a precedent.

Record an entry whenever: a rule in `docs/RULES.md` is bent, a convention is
established, a component is deferred or rejected, or a dependency is adopted.

---

## D-001 — Components never declare their own width

**Date:** 2026-09-16 · **Status:** accepted

Original proposal was "every component is 100% width." Adopted in refined form:
no component declares `width`, `max-width`, `min-width`, or `margin`; each
declares a `fill` or `hug` contract at design time, never as a prop.

`width: 100%` was rejected as the implementation because it resolves against an
indefinite basis in flex/grid, fights `gap`, and requires `box-sizing`
vigilance. A block element with no width declaration fills its parent correctly
in every layout context.

Literal 100% for all components was rejected because intrinsically-sized
controls (Button, Checkbox, Badge, Avatar, Switch) are a real category —
stretching them is broken, not principled.

An escape-hatch `width` prop was rejected: escape hatches become the default
within a month and the invariant dies.

**Consequences:** `Container` is the only component permitted to set
`max-width`. Layout primitives (Tier 2) are load-bearing and must land early.
Responsive behavior inside components uses `@container`, never viewport media
queries. Enforced by lint (Tier 0.7).

## D-002 — Tier 4 behavior comes from Radix / Base UI

**Date:** 2026-09-16 · **Status:** accepted

Overlays, menus, combobox, and date picker delegate focus management,
dismissable layers, typeahead, and ARIA wiring to established headless
primitives. We own 100% of markup, class names, and styling.

**Rationale:** writing our own focus traps and layer management is years of
accessibility edge cases already solved upstream. Tiers 1–3 and 5 remain
zero-dependency.

## D-003 — No polymorphic `as` prop

**Date:** 2026-09-16 · **Status:** accepted

Polymorphic components destroy TypeScript inference and produce unreadable
error messages. Where composition genuinely requires changing the rendered
element, use Radix-style `asChild` render delegation.

## D-004 — No `Box`, no `Spacer`

**Date:** 2026-09-16 · **Status:** accepted

`Box` with style props is the mechanism by which sizing and spacing rules
erode. `Spacer` is redundant with `gap`. Space between elements is expressed by
layout primitives; space inside an element is that element's padding.

## D-005 — Standalone package, `tsc` + lightningcss, no bundler

**Date:** 2026-09-16 · **Status:** accepted

The library ships as a standalone package (`pixel-perfect`) rather than a
workspace package inside the consuming app. A standalone package can be vendored
into a workspace later with a one-line move; extracting a workspace package into
a standalone one is considerably worse.

Build is plain `tsc` (ESM + declarations, no bundling) plus `lightningcss` to
bundle the stylesheet.

**Rationale:** `tsc` preserves `'use client'` directives at the top of emitted
files, which bundlers routinely hoist or strip — a silent, painful failure mode
in Next.js. Not bundling also preserves per-module tree-shaking for consumers,
who bundle anyway. The cost is two build steps instead of one; the benefit is no
bundler between us and RSC correctness.

## D-006 — Gate C is relaxed for Tier 0 foundations

**Date:** 2026-09-16 · **Status:** accepted

The `/component` skill's Gate C (write the spec, stop, get API approval before
implementation) applies in full to components. For Tier 0 foundations it is
applied in relaxed form: implement, then present for review.

**Rationale:** there are zero consumers. Renaming a token today is a `sed`; the
same rename after thirty components is a migration. The gate exists to make
expensive mistakes cheap, and at Tier 0 they are already cheap.

**This expires when Tier 0 does.** Token names reviewed and accepted here are
treated as a stable API from Tier 1 onward.

## D-007 — Tone is a CSS custom-property context, not a prop-to-class mapping

**Date:** 2026-09-16 · **Status:** accepted

Components set `data-pp-tone="danger"` on their root and style themselves with
`var(--pp-tone-solid)`, `var(--pp-tone-text)`, and friends. `semantic.css`
rewires the whole `--pp-tone-*` set per tone in one block.

**Rationale:** the alternative is every component shipping five near-identical
CSS blocks, one per tone, and every new tone touching every component. Here,
adding a tone is a single block in `semantic.css` and zero component changes.
Consumers can also scope a tone to a subtree, or define their own, without us
knowing about it.

## D-008 — Token contrast is solved numerically and verified independently

**Date:** 2026-09-16 · **Status:** accepted

`scripts/generate-tokens.mjs` builds twelve-step OKLCH ramps in which the steps
carrying an accessibility obligation are solved for their contrast target:
focus ring ≥ 3:1 on step 1, solid fill ≥ 4.5:1 on its on-solid text, muted text
≥ 4.5:1 on step 3, body text ≥ 7:1 on step 3. `scripts/check-contrast.mjs`
re-derives every ratio from the committed CSS and fails the build on a
violation, so the guarantee does not depend on the generator being correct.

Three findings from building it, kept as standing rules:

- **Per-hue solid lightness.** One global lightness for the solid fill makes
  amber brown. Perceived lightness is not uniform across hues.
- **Never generate exactly to a threshold.** Solving to precisely 4.5:1 fails an
  independent check at 4.4999:1. The generator targets the threshold × 1.02.
- **Muted text is solved against step 3, not step 2.** It appears on component
  backgrounds as often as on the page, and step 3 is the harder target.

Body text uses a fixed lightness with an asserted floor rather than a solve:
solving it to exactly 7:1 produced a mid-grey that passes and reads as disabled.

## D-009 — The linter has its own test suite

**Date:** 2026-09-16 · **Status:** accepted

`tests/lint-fixtures/` holds one deliberate violation per rule, and
`npm run lint:self-test` asserts every rule still fires. It also asserts that
`tone` is *not* flagged, so the banned-prop list cannot quietly swallow approved
vocabulary.

**Rationale:** both linters passed cleanly the first time they were run — one
against a components directory that did not exist yet, the other against a
stylesheet with no components in it. A linter that has never been observed
failing provides no evidence about anything. Rules that are not tested decay
into rules that are not enforced, which is how "no component sets its own
width" becomes a comment in a README.

## D-010 — Themes bind to any element, not to `:root`

**Date:** 2026-09-16 · **Status:** accepted · **Amends:** D-008

Token themes were originally declared on `:root` and `:root[data-pp-theme]`.
Building the playground proved that unworkable: with themes pinned to the
document root, two themes cannot be rendered side by side, and a real app cannot
have a dark sidebar in a light page or a light popover over a dark one.

`primitives.css` and `semantic.css` now emit four blocks — `:root` (light
default), `[data-pp-theme="light"]`, `:root:not([data-pp-theme])` under
`prefers-color-scheme: dark`, and `[data-pp-theme="dark"]`. Custom properties
inherit, so the nearest ancestor carrying the attribute wins and themes nest
arbitrarily in both directions.

Light has to be re-declared explicitly. Without it, nesting only works one way:
a dark subtree inside a light page, never the reverse.

**This is why the playground exists.** The flaw was invisible in the token files
and obvious within minutes of trying to render both themes at once.

## D-011 — Every theme scope carries the complete semantic set

**Date:** 2026-09-16 · **Status:** accepted · **Amends:** D-010

D-010 re-declared the *palette* per theme scope and was verified by reading the
CSS. A Playwright assertion then showed both themes computing the same
background: the dark subtree was rendering light colours.

`var()` is substituted where the declaration sits, not where the token is used.
So:

```css
:root { --pp-color-bg-page: var(--pp-palette-neutral-1); }
```

computes to a concrete light colour at `:root` and inherits into dark subtrees
**as that light colour**. Re-declaring `--pp-palette-neutral-1` on a dark
descendant changes nothing, because the semantic token was already resolved.

Every theme scope therefore carries the complete semantic set, not just its
differences. `semantic.css` is generated from `scripts/semantic-tokens.mjs` for
that reason — the repetition is required, and hand-maintaining four copies of
seventy tokens would not survive a month.

Tone blocks are unaffected: `[data-pp-tone]` sits on a descendant of the theme
element, so the palette resolves correctly where those declarations appear.

**The lesson generalises.** Any token defined as an indirection to another token
must be re-declared at every scope where the target changes. Reading the CSS
would never have caught this; only a computed-style assertion in a real browser
did.
