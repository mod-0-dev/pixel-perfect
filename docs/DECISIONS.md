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

## D-012 — The playground is not a workspace member

**Date:** 2026-09-16 · **Status:** accepted · **Amends:** D-005

The library lives at the repository root, and `playground/` installs
independently (`npm --prefix playground install`) rather than as an npm
workspace.

The root-as-workspace-root layout broke twice: npm does not symlink the root
package into `node_modules`, so Next could not resolve `pixel-perfect`, and
changesets only sees workspace *members*, so it reported the library "not in the
workspace".

The obvious fix is a `packages/ui` monorepo. It was rejected because **npm
cannot install a git dependency from a subdirectory of a repository.** Moving the
library out of the root would leave publishing to a registry as the only way to
consume it, which is precisely the constraint worth avoiding while there is one
consumer and the API changes weekly.

So: library at the root, playground beside it with its own lockfile. The cost is
a second `npm ci` in CI and no dependency deduplication in the playground —
neither of which affects anything shipped.

**Revisit if** the app and library end up in one repo anyway, or a second
publishable package appears. At that point a workspace is right and the git
dependency route no longer matters.

## D-013 — Screenshot baselines are authored by CI, never locally

**Date:** 2026-09-16 · **Status:** accepted · **Amends:** D-006 (Tier 0.6)

`tests/visual/__screenshots__` is generated and committed by the CI job. Running
`npm run test:visual:update` locally and committing the result is wrong and will
fail CI. To rebaseline, delete the directory and push; CI regenerates it.

**Why.** Three rounds of narrowing, each fixing a real variable and each
insufficient:

1. The library ships a system font stack. The dev container and `ubuntu-latest`
   resolve it to different fonts, so text metrics differed. Fixed by pinning
   Inter and JetBrains Mono from npm in the playground. Page height changed,
   proving the fix landed — the delta did not close.
2. Selecting the same font file is not rasterising it the same way. Hinting and
   subpixel positioning come from the host's freetype and fontconfig. Disabling
   both halved the pixel diff (43,950 → 23,717) — the delta did not close.
3. The remainder was the browser itself. CI runs Chromium build 1243; this
   container pins 1194 in its image, and the Playwright CDN is blocked by egress
   policy, so the matching build cannot be installed. **No baseline produced
   here can ever match CI.**

That is not a threshold to loosen. It is a statement about which environment is
allowed to define truth, and the answer is the one that gates the merge.

**What was NOT done:** the failing tests were not deleted, skipped, or given a
tolerance wide enough to pass. They still run and still block. Only the
authority for the baseline moved.

**One wrinkle to know about.** A push made with `GITHUB_TOKEN` does not trigger
another workflow run, so the authoring commit lands with no checks of its own.
The baselines are authored but not yet compared; the next real push verifies
them. That suppression is what stops the authoring run from looping, so it is
worth keeping — but an authoring commit should never be left as a PR's final
head.

**`harness.spec.ts` is unaffected** and stayed green throughout — it asserts
behaviour (overflow detection, theme distinctness) rather than pixels, which is
also what caught the D-011 token bug. That is the split worth keeping: assert
behaviour where you can, and reserve pixels for what only pixels can catch.

## D-014 — Gate C approves a group of specs, not one component at a time

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** Gate A, Gate C, Definition of Done

The `/component` skill stops for API approval after every individual spec. For
the eleven Tier 1 atoms that is eleven round trips to approve eleven components
whose entire surface is a handful of presentational props.

Gate C now applies **per group**: one spec document covering a coherent set of
components, one approval. The groups are the roadmap tiers, subdivided where a
tier is large.

**Gate A is amended accordingly.** The WIP limit of 1 now applies to `build` and
`review` only. Any number of components in a group may sit in `spec` at once,
because a spec is a document and there is no such thing as a half-written
component in a document. Implementation remains strictly one at a time — that
is the limit that was actually protecting anything.

**The Definition of Done is amended.** Its first box, "`docs/specs/<Name>.md`
exists", is satisfied by a dedicated section in a group spec
(`docs/specs/tier-<n>-<group>.md`). Eleven files that each exist to hold two
tables is worse than one document that can be read end to end, and reviewing a
group together is the only way to catch the inconsistencies between components
that matter most — a `size` that means one thing in `Badge` and another in
`Text`.

**What is not relaxed.** Every section of the template is still filled in for
every component. The gate is still a hard stop: no implementation lands in the
same turn as the spec it implements.

**This does not extend to Tiers 3 and 4.** `Field` and the overlay foundation
are where API mistakes get expensive, and they are approved individually.
Revisit this entry before spec'ing Tier 3.

## D-015 — "Semantic tokens only" governs colour; dimensional primitives are consumed directly

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §3

RULES §3 says components consume semantic tokens only, and names `--pp-space-3`
as a primitive. The semantic layer defines colour and focus-ring tokens and
nothing else. There is therefore **no compliant way for a component to declare
padding, radius, font size, line height, duration or z-index** — which every
Tier 1 atom needs on its first line of CSS.

This was found by trying to spec `Badge`, not by reading the rules.

**Resolution.** The "semantic tokens only" requirement governs **colour**.
Dimensional primitives — `--pp-space-*`, `--pp-radius-*`, `--pp-font-size-*`,
`--pp-line-height-*`, `--pp-font-weight-*`, `--pp-letter-spacing-*`,
`--pp-border-width-*`, `--pp-duration-*`, `--pp-easing-*`, `--pp-shadow-*`,
`--pp-z-*` — are consumed directly by components. `--pp-palette-*` remains
banned outright.

**Why colour is the special case.** A colour token must resolve differently per
theme and per tone: that is the entire point of the semantic layer, and the
reason D-011 exists. `--pp-space-3` is `0.75rem` in light mode, in dark mode,
and under every tone. Interposing `--pp-space-inset-md: var(--pp-space-3)`
between the component and the scale adds a name to learn and changes nothing.

**The linter already worked this way.** `scripts/lint-rules.mjs` bans
`--pp-palette-*` and nothing else; stylelint bans raw units in dimensional
properties, which any `var()` satisfies. The enforced rule has always been this
one. The prose was aspirational and the code was right — this entry makes the
prose match, rather than writing a linter to enforce a rule that would have made
the library unbuildable.

**What this does not license.** A hardcoded `12px`, `0.75rem` or `#fff` in
component CSS remains a bug. Every value still comes from a token.

**Two follow-ons, deliberately not done now:**

- **Control sizing is a genuine semantic need, and arrives with Tier 3.** What
  makes a `Button`, an `Input` and a `Select` line up at `size="md"` is not that
  they each picked `--pp-space-2`; it is that they share one definition of how
  tall a medium control is. A `--pp-control-height-*` / `-padding-inline-*` /
  `-font-size-*` set will be added when the first two components that must agree
  exist. Adding it now, with nothing to align, would be guessing.
- **Density, if it ever ships, is a context and not a token rename.** The
  mechanism is `[data-pp-density]` rewiring a small set of custom properties,
  exactly as `[data-pp-tone]` does in D-007 — not a parallel semantic scale.

Per-component tuning already has an answer that predates this entry: RULES §3
requires every component to expose component-scoped custom properties
(`--pp-badge-padding-inline`) as its override API. That covers the case a
dimensional semantic layer would have served, without a second global vocabulary.

## D-016 — Tier 1 vocabulary exceptions, approved as a batch

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §1, §5

The Tier 1 spec (`docs/specs/tier-1-atoms.md`) asked for seven rulings at Gate
C. All were accepted as proposed. Recorded here so each is a precedent rather
than a line in a spec nobody re-reads.

1. **Typography gets more than three sizes.** `Text` takes
   `size: xs | sm | md | lg`; `Heading` takes `size: sm | md | lg | xl | 2xl | 3xl`,
   defaulting from its semantic `level`. Every other component keeps
   `sm | md | lg` exactly. A type scale cannot live in three steps; a `Caption`
   component to avoid a fourth enum member multiplies components instead.
2. **`Text` and `Heading` accept `tone="muted"`.** It maps to
   `--pp-color-text-muted` and is local to those two components. It is not added
   to the global tone set, because a tone whose solid fill is meaningless is not
   a tone.
3. **`Skeleton` uses `shape`, not `variant`.** `solid | outline | ghost | plain`
   are visual treatments of a tone, and none of them describes a circle.
   Reusing the word for a different axis of meaning is worse than a new prop.
4. **`Skeleton` has no height prop.** Block size comes from `lines`, from the
   parent's layout, or from `--pp-skeleton-block-size`. The sizing contract
   wins over the one component with the strongest case against it.
5. **`VisuallyHidden` declares `inline-size: 1px`.** It renders no visual box;
   the value is part of a fixed technique, not a design decision. Exempted from
   the stylelint `inline-size` ban for that one file, and nowhere else.
6. **`Avatar` load status is uncontrolled only.** RULES §5.5 governs state a
   user can change. Whether an image loaded is the browser's fact, and an app
   overriding it produces an avatar that lies.
7. **`AvatarGroup` is added to the roadmap as 5.13.** Wanted by the consuming
   app; a Tier 5 composition, not an atom.

## D-017 — CI authors baselines for new screenshot tests, not only for an empty directory

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** D-013

D-013 authored baselines only when `tests/visual/__screenshots__` was empty. Every
component adds a screenshot test, so under that rule each one would require
deleting the directory and re-authoring every baseline — including ones that
were verifying fine — and would leave the PR with an authoring commit as its
head after every component.

The visual job now runs the comparison first. If it fails **and** the only
change is new, previously untracked files under `__screenshots__` (Playwright
writes the actual for a missing baseline), those are authored baselines: commit
and push them. If any *existing* baseline differs, that is a regression and the
job fails as before.

The invariant from D-013 is intact: no baseline is ever produced anywhere but
CI. What changed is that "new test" and "changed pixels" are distinguished
instead of both being treated as "delete everything and start over".

The `GITHUB_TOKEN` push still triggers no run, so an authoring commit is still
authored-but-unverified until the next real push. That next push now happens
naturally — it is the next component.

## D-018 — `margin: 0` is permitted; non-zero margin is not

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §2 (enforcement only)

The stylelint config banned the `margin` properties outright. `Text` renders a
`<p>`, which carries a user-agent margin of `1em 0` that the deliberately
minimal reset does not touch. Left alone, two `Text` elements in a `Stack`
would be spaced by the parent's `gap` *plus* the browser's margin — precisely
the double-spacing bug RULES §2 exists to prevent.

The rule was always "a component adds no outer margin". Removing a margin the
browser added is not adding one; it is the only way to honour the rule for
elements the UA styles. So `margin` and the logical margin properties are now
gated on **value**: `0` is allowed, anything else is a violation. Physical
`margin-top/right/bottom/left` remain banned outright, because the logical
property is always the correct one. `Container` additionally allows `auto`,
which is how it centres and is the reason it exists.

Rejected: resetting `p` and heading margins globally in `reset.css`. That
would restyle every paragraph in the consuming app, which is what a library
reset must never do. The fix belongs on the class, not the element.

The lint self-test moves `margin` from the property-ban expectations to the
value-ban expectations, so the rule is still observed firing.

## D-019 — An element-size scale, and `inline-size` for intrinsically square components

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** Tier 0.2 tokens; RULES §1 enforcement

Two things `Icon` needed on its first line of CSS, and `Spinner`, `Avatar`
and `Badge` need right after it.

**`--pp-size-3` … `--pp-size-12`.** The space scale is a curated ramp for the
gaps *between* boxes; it has no 1.25rem or 1.75rem, and it should not — those
are not spacing steps. Boxes need their own scale. Sizes are indexed in
quarter-rems so the number reads as a length (`--pp-size-8` is 2rem), which is
a different indexing philosophy from space on purpose: a size is a dimension
you reason about numerically, a space step is a rhythm you pick from a ramp.
Tier 3's `--pp-control-height-*` will alias into this scale.

**`inline-size` is permitted in `Icon`, `Spinner` and `Avatar`.** RULES §1 bans
components from deciding how much of the parent to occupy. A 20px icon is not
deciding that — its inline size is intrinsic, like a glyph's, and equals its
block size. Declaring it as `block-size` plus `aspect-ratio: 1` would satisfy
the letter of the lint while saying the same thing less clearly, and the child
SVG still needs `inline-size: 100%` to fit its box. So the exemption is
explicit and narrow: three files, all `hug`, all square. `Badge` is `hug` but
not square and gets no exemption — it is sized by its content.

## D-020 — `gap` is the fourth fixed-vocabulary prop, valued as a space-scale index

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §5

RULES §5 fixes the prop vocabulary at `variant` / `tone` / `size` and forbids
synonyms per component. Tier 2 needs a way to say how far apart a layout
primitive holds its children, and none of the three could carry it: `size`
already means chip-scale in Tier 1 and means max-width scale in `Container`, so
a third meaning was not available, and `spacing` is on the linter's banned list.

`gap` joins the vocabulary as the fourth term. It is taken **only by layout
primitives**, it means *the distance between this component's children*, and it
takes a step of the space scale as a string:

```tsx
<Stack gap="4">   /* var(--pp-space-4) */
```

`type Space = '0' | '1' | … | '9'` lives in `src/types.ts` beside `Tone`, `Size`
and `Variant`.

**Why a string.** `gap={4}` reads like a length, and the first question anyone
asks is whether it is 4px or step 4. `gap="4"` reads like an index because it is
one, and the prop value is spelled identically to the token, so the mapping
needs no documentation. The Tier 1 docs already wrote it this way in every usage
example, months before the component existed.

Rejected: a t-shirt alias set (`gap="md"`), which layers a second vocabulary
over a scale that already has names; and a free length (`gap="12px"`), which
puts an untokenised value in the API.

**Default `"0"`, and the default is load-bearing.** The scale is mapped once in
`src/components/_shared/layout.css` as `[data-pp-gap="n"] { --_pp-gap: … }`,
rather than ten rules in each of five stylesheets. Custom properties inherit, so
a nested layout primitive would pick up its parent's gap — except that `gap`
defaults to `"0"`, so every gap-taking component always emits `data-pp-gap` and
always redeclares the property on its own root. A unit test asserts the nesting
case directly, because the day someone makes `gap` optional-with-no-attribute is
the day every nested `Stack` silently inherits.

A zero default is also the honest one: a `Stack` with no rhythm is a legitimate
thing, and CSS's own default is `0`. Silently inserting space would be the layout
equivalent of the UA margin D-018 exists to strip.

## D-021 — A layout primitive sizes the boxes it creates; it still may not size itself

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §1 (clarification)

RULES §1 says sizing and placement belong to **the parent**. Tier 2 is the
parent. So `gap`, `grid-template-columns`, `flex-basis` on a named slot, and
`min-inline-size: 0` on a child are this tier doing the job the rule assigned
it — not eight exceptions to the rule.

The line, stated precisely so the `Split` and `Grid` stylesheets are not read as
violations later:

> A layout primitive may size the boxes it creates for its children. It may not
> size itself.

All eight Tier 2 components are `fill`. None declares `inline-size`. `Container`
is the only one that touches `max-inline-size`, which is its entire reason to
exist and was already carved out in `.stylelintrc.json` and D-018 before the
component was specified.

**A corollary worth naming:** no Tier 2 component takes `tone` or `variant`, and
none declares a background, border, colour or shadow. A layout primitive has no
visual treatment. If you want a bordered box, that is `Card` (5.1), and it will
compose a `Stack` inside itself rather than becoming one.

## D-022 — Tier 2 rulings, approved as a batch

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §1, §5, §6

The Tier 2 spec (`docs/specs/tier-2-layout.md`) asked for rulings at Gate C
under D-014. `gap` and the sizing clarification were substantial enough for
their own entries (D-020, D-021); the token addition has D-023. The rest were
accepted as proposed and are recorded here so each is a precedent.

1. **`align` and `justify` are fixed across the tier.**
   `align: start | center | end | stretch | baseline` → `align-items`;
   `justify: start | center | end | between | around | evenly` →
   `justify-content`. The logical keywords, so RTL needs no extra work —
   `flex-start` and `flex-end` appear in neither the API nor the CSS. The
   `space-` prefix is dropped because `between` is the only value in the set
   that would carry it.

2. **`Split` collapses at a named container breakpoint, not a free length.**
   `collapseBelow: 'sm' | 'md' | 'lg' | 'never'` → `30rem` / `45rem` / `60rem`,
   compiled to three static `@container` blocks selected by
   `[data-collapse-below]`.

   This is a CSS limit, not a preference: **a container query condition cannot
   read a custom property.** `@container (max-inline-size: var(--x))` is not
   valid and cannot be made so, which makes `collapseBelow="42rem"`
   unimplementable rather than merely awkward.

   The every-layout `flex-basis: 0; flex-grow: 999; min-inline-size: 50%`
   sidebar pattern was considered. It is genuinely continuous and needs no query
   at all, but its threshold is a ratio of the sidebar's width to the
   container's, so "collapse at 45rem" becomes arithmetic performed by the
   caller. Three named breakpoints say what happens.

   The rule targets the slots, never the root: an element cannot query its own
   container, so the collapse is expressed as "make the children full width"
   rather than "change my own flex-direction".

3. **`Split` has no `side` prop.** `Split.Sidebar` and `Split.Main` render in
   DOM order; a right-hand sidebar is written by putting `Split.Main` first. The
   alternative is `order`, which desynchronises reading order from visual order
   — the textbook accessibility defect — and a prop whose only function is to
   create one is not worth the two lines it saves. The `@container` rule changes
   `flex-basis` only, so reading order is DOM order in both layouts.

4. **`Grid` accepts a raw track template.** `columns?: number | string`: a
   number is `repeat(n, minmax(0, 1fr))`, a string goes to
   `grid-template-columns` unchanged. Mutually exclusive with
   `minItemInlineSize`, enforced in the type rather than by precedence.

   The case against was real — a raw passthrough is an untokenised value in a
   public API, invisible to the linter because it is a prop and not a
   stylesheet, and it is the crack through which `Box` returns. It was accepted
   because the alternative is not "callers use tokens", it is callers
   hand-rolling the same `grid-template-columns` in their own stylesheet, which
   is what the consuming app does today in two places and what this tier exists
   to stop. **A prop we can see beats a stylesheet we cannot.**

   Every generated track is `minmax(0, 1fr)`, never `1fr`: `1fr` has a
   `min-content` floor, so one long unbreakable string in one cell blows the
   whole grid out of its container.

5. **`Container` measures are `40rem` / `64rem` / `80rem`.** A reading measure,
   an app page, a dashboard. The consuming app's current `72rem` becomes `lg` at
   `80rem` — settled now at ten call sites rather than later at eighty. Anything
   else is `--pp-container-max-inline-size`.

   `Container` also declares `container-type: inline-size`. It is the anchor for
   the whole `@container` strategy: without a query container near the top of
   the tree, a component's `@container` rules resolve against whatever ancestor
   happens to have one.

6. **`Container`'s `gutter` defaults to `"5"`, where `gap` defaults to `"0"`.**
   The asymmetry is deliberate. A zero gap is a legitimate design; a zero page
   gutter is text against the edge of a phone screen, which is a bug every time.

7. **`Scroller` requires `label`.** It renders `role="region"`, `aria-label` and
   an unconditional `tabIndex={0}`. A scrollable region a keyboard user can
   reach is WCAG 2.1.1; a focusable region with no accessible name is a 4.1.2
   failure. RULES §6 says the type system should make an accessible name
   impossible to omit, so there is no unlabelled form.

   `tabIndex={0}` is unconditional rather than conditional on the region having
   no focusable children: deciding that at runtime means inspecting children on
   every render, and the extra stop is harmless where the shadow is correct and
   essential where it is not.

8. **`asChild` on five of the eight.** `Stack`, `Cluster`, `Grid`, `Container`
   and `Center` — a single element wrapping children, where the element
   genuinely varies (a `Stack` of nav links wants to be a `<ul>`, a `Container`
   around a page a `<main>`). Not `Split`, `AspectRatio` or `Scroller`, each of
   which owns structure or behaviour a substituted root would break.

9. **`Stack` has no `justify`.** Distributing children along the block axis
   needs a block size, and a `fill` component does not have one. Whoever owns
   the height owns the distribution.

10. **`Grid` ships without span support.** `style={{ gridColumn }}` covers it at
    the call site until something in the library needs it. Revisit at `Table`
    (5.4).

## D-023 — `--pp-color-shadow-edge`, a semantic token for fading gradients

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** Tier 0.2 tokens

`Scroller` (2.8) draws scroll shadows: a gradient from a translucent dark to
transparent, shown at whichever edge has content beyond it. The semantic layer
had nothing that fits, and no compliant way to derive one.

- `--pp-color-bg-scrim` is a modal overlay at 0.55 alpha — an order of magnitude
  too heavy.
- `--pp-color-border-strong` is opaque, so the gradient would be a hard grey bar.
- `--pp-shadow-1..3` are complete `box-shadow` values, not colours.
- `color-mix()` is on the stylelint banned-value list for every colour property,
  and a raw `oklch()` in component CSS is a hardcoded colour. There is no third
  option.

So: one token, per theme, in `scripts/semantic-tokens.mjs`.

| Theme | Value |
| --- | --- |
| light | `oklch(15% 0.01 258 / 0.14)` |
| dark | `oklch(0% 0 0 / 0.5)` |

Dark carries roughly 3.5× the alpha, because a soft edge is nearly invisible
against a near-black surface. That is the same asymmetry `--pp-shadow-*` already
encodes, and the same reason D-011 gave for elevation inverting between themes.

**It carries no contrast obligation and `check-contrast.mjs` gains no assertion
for it.** A decorative gradient is neither text nor a UI boundary, so there is no
threshold to meet. Worth saying out loud, because every other colour token in the
library has one and a future reader will wonder whether this one was missed.

**This is the second Tier 0 amendment, and it has D-015's shape:** a component
reached RULES §3, found the compliant vocabulary did not contain the thing it
needed, and the gap was invisible until something tried to use it. The general
lesson is already in D-015 — the prose and the enforced rule drift apart, and
only building against them finds out which is wrong.

## D-024 — A component never writes its own public override property inline

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §3

RULES §3 requires every component to expose component-scoped custom properties
(`--pp-grid-template-columns`) as its override API, and D-007's whole mechanism
depends on a consumer being able to set one on an ancestor.

`Grid` is the first component whose props produce a *computed value* rather than
a fixed enum, so it is the first that has to write a custom property from
JavaScript. Written naively:

```tsx
style={{ ...style, '--pp-grid-template-columns': template }}
```

That is an inline declaration. Nothing on an ancestor can outrank an inline
style, so **the documented escape hatch is dead for every `Grid` that takes a
prop** — which is every `Grid`. The property would still exist, still be
documented, and never once take effect.

**The rule.** A component writes a *private* property (`--_pp-grid-tracks`), and
the stylesheet reads the public one first:

```css
grid-template-columns: var(--pp-grid-template-columns, var(--_pp-grid-tracks, none));
```

The consumer's override then wins from anywhere, including an ancestor, and the
prop remains the default. This matches how `--pp-stack-gap` already behaves —
`Stack` writes an attribute and the stylesheet maps it, so the question never
arose there.

**Consequence: the private property must always be written, never conditionally.**
Custom properties inherit, so a propless `Grid` nested inside a three-column one
would lay itself out in three columns. `Grid` writes `none` in that case. This is
the same hazard as D-020's gap scale and has the same answer — *always emit* —
which is now twice, and therefore a pattern rather than a coincidence.

Found by a unit test written to assert the opposite behaviour, not by review.
