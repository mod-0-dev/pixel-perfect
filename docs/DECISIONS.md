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

## D-025 — `--pp-measure-*`, and token enforcement for length-valued layout properties

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** Tier 0.2 tokens, Tier 0.7 lint; D-016 §5

Two findings from building `Container`.

**A third dimensional scale.** The measures `Container` constrains to — `40rem`,
`64rem`, `80rem` — exist on no scale in the library. Space is the rhythm
*between* boxes and tops out at `6rem`; size is how big a box is, indexed in
quarter-rems, and `40rem` there would be `--pp-size-160`. Measure answers a third
question: **how wide may content run before it stops being readable.**

So `--pp-measure-sm` / `-md` / `-lg`. Only `Container` may consume them
(RULES §1, D-001), but they are exported so a consuming app can align a
full-bleed section to the same measure without hardcoding it.

Rejected: leaving the three values raw in `Container.css`. RULES §3 says every
value comes from a token, and the one component allowed to break the sizing
rule is the last place to start making exceptions to the token rule.

**The linter never checked length-valued layout properties.** `max-inline-size`,
`block-size`, `min-block-size`, `max-block-size` and `flex-basis` all take a
length and none was in the raw-unit ban. It went unnoticed because
`max-inline-size` was banned outright as a *property*, so no file could reach
it — until `Container`, which is exempt from that ban and would therefore have
been free to hardcode `40rem` with nothing objecting.

They are now in the ban, with fixtures in `violations.css` so the self-test
observes the rule firing on each (D-009). Two pre-existing declarations were
caught, both legitimate, both exempted per-file rather than by weakening the
rule:

- **`VisuallyHidden`'s `block-size: 1px`.** D-016 §5 exempted this file's
  `inline-size: 1px` as part of a fixed technique. It named only the inline
  axis because only the inline axis was checked; the block half is the same
  declaration in the same technique. The exemption is extended, not widened.
- **`Skeleton`'s `block-size: 1em`.** One line of whatever type the skeleton
  sits in — a relative unit derived from an inherited token, not a magic
  number. Same family as `Icon`'s `1em` sizing (D-019).

**The general shape, which has now happened twice:** a ban expressed at the
property level hides the absence of a ban at the value level, and the gap only
becomes reachable when some component earns an exemption. Worth checking the
value rules whenever a property exemption is granted.

## D-026 — Settling is waited for before the screenshot budget, not inside it

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** D-013, D-017

The first CI run in the Tier 2 PR that actually *compared* baselines failed three
of twenty-one: `tokens`, `container` and `aspect-ratio`. Two distinct causes, and
neither was a visual regression.

### 1. `tokens.png` had been stale since Tier 1

It was authored in the Tier 0 commit and never re-authored. Tier 1 added eight
lines to `playground/app/tokens/page.tsx` and fifty-seven to the playground's
`globals.css`, growing the page by 92px — and the Tier 1 PR's final head was its
own authoring commit, which by design triggers no verifying run. So a stale
baseline merged to `main` and nothing compared it until now.

Verified rather than assumed: the tokens page renders **2413px on `origin/main`
(Tier 1) and 2413px on this branch**, against a committed baseline of 2321px.
Tier 2 did not touch it.

**This is D-013's documented wrinkle biting for real.** D-017 already says an
authoring commit should never be a PR's final head; that line was written as a
caution and is now a post-mortem. It is the rule that matters most in this
workflow and the easiest one to lose track of, because the PR looks green when
the authoring run stops failing.

### 2. Two pages could not capture a stable screenshot at all

`container` (~12,100px) and `aspect-ratio` (~11,500px) — the two tallest pages in
the playground — spent the whole of `toHaveScreenshot`'s 5-second budget in CI
alternating between two heights 14px and 8px apart, and never converged. The
error is "Failed to take two consecutive stable screenshots", which is not a
pixel diff: the comparison never ran.

It does not reproduce here. Six consecutive full-page captures of each page are
byte-identical, there is no `ResizeObserver` feedback loop (one initial callback
each, then silence), and the heights this container produces are exactly the
*lower* of each alternating pair. Per D-013 §3 the runner's Chromium build cannot
be installed here, so this environment cannot adjudicate it — the same conclusion,
reached again, about a different symptom.

**The fix is to settle before the budget rather than inside it.** `ready()` in
`screenshots.spec.ts` waited for network idle and `document.fonts.ready`, and
nothing waited for layout to stop moving after hydration. It now polls
`scrollHeight` until five consecutive animation frames agree, bounded at ~3s.
`toHaveScreenshot`'s timeout moves from 5s to 20s so that settling and comparison
are no longer competing for one budget.

**Both are waits, not tolerances.** `maxDiffPixelRatio` is untouched at 0.01 and
every pixel is still compared. A page that genuinely never settles still fails,
and fails as instability rather than as a diff against whichever of two heights
happened to be committed. With the settle step in place all three pages now
report "captured a stable screenshot" locally, leaving only the dimension
mismatch against their stale baselines.

`tokens.png`, `container.png` and `aspect-ratio.png` are deleted so CI authors
them. The two Tier 2 baselines were authored at the *other* height of their
alternating pair — 12115 against a settled 12101, 11530 against a settled 11522 —
so they could never have matched a settled capture.

**The lesson, which is D-013's lesson a third time.** Rounds 1 and 2 removed
fonts and rasterisation as variables; round 3 concluded the browser build itself
was the remainder and moved the authority for baselines to CI. This round says
the same thing about *time*: a screenshot taken before the page stops moving is
not a measurement, and waiting for it is not the same as tolerating a difference.

## D-027 — Tier 3 is approved in four groups; D-014's carve-out narrows to `Field`

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** D-014

D-014 relaxed Gate C to approve a group of specs at a time, then excluded
Tier 3 on the grounds that "`Field` and the overlay foundation are where API
mistakes get expensive," and instructed a revisit before Tier 3 was spec'd.

Revisited. The reason names two components; Tier 3 has sixteen. The exclusion
now covers the components the reason is actually about.

| Group | Components | Gate C |
| --- | --- | --- |
| 3A — Action core | 3.1–3.5 | one gate for the group |
| 3B — Field foundation | 3.6 `Label`, 3.7 `Field` | **individually** |
| 3C — Native inputs | 3.8–3.13 | one gate, after 3B is `done` |
| 3D — Composite inputs | 3.14–3.16 | one gate |

Tier 4 is untouched: 4.1 the overlay foundation is still approved on its own.

D-014's strongest argument applies here with more force than it did in Tier 1:
reviewing a group together "is the only way to catch the inconsistencies between
components that matter most." 3A's five components share a height scale, a focus
ring, a disabled semantic and a pressed semantic. Approving `Button` alone and
`Toggle` three sessions later is how `Toggle` ends up with `checked` where
`Button` has `pressed`.

Gate A is unaffected. Implementation remains one component at a time.

## D-028 — `--pp-control-*`, and `--pp-tone-solid-active`

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §3, D-015; Tier 0.2 tokens

Two token-layer additions Tier 3 could not start without.

**`--pp-control-*`, in a new hand-written `src/styles/tokens/control.css`.**
RULES §3 promised this set "when Tier 3 lands": height, inline padding, gap,
font size and radius, at `sm` / `md` / `lg`. A `Button`, an `Input` and a
`Select` in one row must be the same height or every form in every consuming app
is a pixel crooked, and nothing made that true — `Badge` picked `--pp-size-6`
for `md` and wrote it into its own stylesheet, which is fine for a chip that
answers to nobody.

Heights are 32 / 40 / 48, aliased onto `--pp-size-8` / `-10` / `-12`. All three
clear WCAG 2.2 SC 2.5.8 (24×24 CSS px) with no hit-area hack. `sm` and `md`
share a font size deliberately: a 12px control label is a readability problem,
not a size step.

**This is not the aliasing D-015 rejected.** D-015's argument was that a name
over `--pp-space-3` "would add a name and change nothing," because a space step
is identical in every theme and tone. `--pp-control-height-md` changes
something: it is the single definition five stylesheets read, and moving it
moves all five. RULES §3 carved this out in the same paragraph D-015 amends.

Rejected: `primitives.css` (a primitive defined in terms of another primitive is
how a two-tier token layer stops being two-tier) and `_shared/` (D-020 put the
`gap` scale there because it maps an *attribute*; these are named values a
consuming app retunes globally, which is the token layer's job).

**`--pp-tone-solid-active`.** The tone set shipped `--pp-tone-solid` and
`-solid-hover` and nothing for the pressed state, so the loudest control in the
library could not darken under the finger. Generated as a second step in the
same direction as hover, so rest → hover → pressed reads as one progression.

It is **not** a ramp step. Steps 11 and 12 are text solved against step 3;
reusing one as a fill would make the pressed state of a button and the colour of
muted text the same value by accident. It carries step 9's guarantee — 4.5:1
against its on-solid text — asserted in the generator *and* independently in
`check-contrast.mjs`, which is now 170 assertions rather than 160. A pressed
button that loses its label is visible for 120ms and is therefore exactly the
kind of failure nobody catches by looking.

## D-029 — The focus ring is an outline, in one colour, declared in `pp.components`

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §6 (implementation)

`--pp-color-focus-ring` has existed since Tier 0.2 and nothing used it, because
nothing before `Button` could be focused. Settled once, for every interactive
component that follows.

**`outline`, not `box-shadow`.** Outline follows `border-radius`, costs no
layout, and survives an ancestor's `overflow: hidden` — which matters the moment
a button sits inside `Scroller` (2.8) or a Tier 4 popover. Tier 0.7 banning
`outline: none` and `outline: 0` was the same decision made in advance.

**Declared in `pp.components` even though `reset.css` already declares it.**
The reset's rule is `:where(:focus-visible)` in `pp.reset` — zero specificity,
lowest layer — so a consuming app's `button { outline: none }` takes it away.
Repeating it on `.pp-button` puts it in a layer the app's unlayered CSS still
beats deliberately, but not by accident.

**One colour library-wide: `--pp-color-focus-ring`, not `--pp-tone-focus`.**
The checkable reason: `check-contrast.mjs` asserts exactly one ring pairing —
focus ring vs page background, ≥ 3:1 — against `--pp-color-focus-ring`. The five
`--pp-tone-focus` values are asserted against nothing, and an unverified colour
on the one affordance RULES §6 names by hand is not a trade this library makes,
least of all when D-008 is the reason anyone should trust its palette. The
design reason: a ring answers "where am I", and the same answer every time is
easier to find.

`--pp-tone-focus` keeps a job — the tone-shifted *border* on a focused form
control in 3B/3C, which is inside the control where the ring is outside it. Any
future use of it as a ring colour ships with five new assertions, not without
them.

Guarded by a browser assertion in `tests/visual/harness.spec.ts`: the outline
colour of a focused `danger` button equals that of a focused `accent` one.

## D-030 — Tier 3A rulings, approved as a batch

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** RULES §4, §5

Everything Gate C approved for the action core that is not D-027, D-028 or
D-029.

**1. `loading` sets `aria-disabled`, not `disabled`.** A browser blurs a focused
element the instant it becomes disabled, so the conventional "disable while
submitting" pattern takes focus away from a keyboard or screen-reader user at
the exact moment they pressed Save and drops them at the top of the document.
`loading` keeps the button focusable and the component swallows click and
Enter/Space itself. `disabled` remains the native attribute, because a
permanently unavailable control genuinely should leave the tab order.

**2. The loading label is hidden with `opacity`, and this was found the hard
way.** It shipped as `visibility: hidden`, which looks identical and is wrong:
`visibility: hidden` and `display: none` both remove the label from the
**accessibility tree**, so a button announced as "Save" becomes a button
announced as nothing at the moment it starts working — defeating ruling 1
entirely. Only `opacity` hides it visually and keeps the name.

The jsdom test asserting `toHaveAccessibleName('Save')` **passed against the
broken version**, because name computation in jsdom does not consult layout. It
was caught by the browser assertion in `tests/visual/harness.spec.ts`, and that
assertion has since been re-run against the defect to confirm it fails on the
right symptom (element not found / no accessible name) rather than incidentally.

The general shape, which D-025 also named: a check expressed in the wrong
environment hides the absence of a check. Anything about what a screen reader
perceives — names, roles, hidden-ness — has to be asserted where layout exists.

**3. `type` defaults to `"button"`, not HTML's `"submit"`.** RULES §5 forbids
inventing a `type` prop; passing the native attribute through is not that, and
its default is a real decision. HTML's default silently submits the nearest form
from every "add a row", "cancel" and disclosure toggle placed inside one.
Submitting is opted into.

**4. No `iconStart` / `iconEnd`. Children compose.** The root is a flex
container with `--pp-control-gap-*` applied, and `Icon` defaults to `1em`, so an
icon in children is spaced and sized with no API at all. A button that takes
icons as props grows `iconSize` and `iconTone` within a year (RULES §5.6). This
continues the convention `Badge`'s docs already used.

**5. `data-state="on" | "off"` joins the RULES §4 vocabulary**, scoped to
`aria-pressed` controls. `checked` / `unchecked` stays scoped to `aria-checked`
ones. The two words then track the two ARIA properties exactly, which is what
makes the boundary between `Toggle` (3.5) and `Switch` (3.12) visible in the DOM
without reading our source.

**6. `Link` takes `underline`, not `variant`.** None of `solid | outline |
ghost | plain` describes anything a text link does, and redefining the word for
one component is the failure D-014 says group review exists to catch.
`underline?: 'always' | 'hover' | 'none'` names something the vocabulary has no
word for — the same ground `gap` was admitted on in D-020. Default `'always'`,
because colour alone fails WCAG 1.4.1. `Link` takes no `size` either: it is
inline text and takes the size of the text around it.

**7. `ButtonGroup` is always attached, and its Deps cell was wrong.** A group
that merely spaces buttons *is* `<Cluster gap="2">`, and D-004 rejected `Box`
for exactly that. So `ButtonGroup` is the attached case only — collapsed
borders, end radii, one visual unit — and there is no `attached` prop.

It therefore cannot compose `Cluster` (`Cluster` is `fill`, `ButtonGroup` is
`hug`), and `ROADMAP.md` listed Deps `3.1, 2.2`. Corrected to `3.1`.

It uses `role="group"` with every button its own tab stop, **not** the APG
Toolbar pattern's roving tabindex. Roving is right for a dense toolbar of twenty
controls and wrong for three attached buttons, where it costs a keyboard user an
arrow-key discovery step to reach what one Tab would have reached. `Toolbar`
(6.6) is the roving component, and this is why it is a separate entry.

**8. `asChild` with `disabled` is best-effort.** An `<a>` has no `disabled`
attribute, so the combination emits `aria-disabled`, `data-disabled`,
`tabIndex={-1}` and swallows activation. Genuinely weaker than native
`disabled`, and documented as such. Making it a type error was rejected: it
turns a documented soft edge into a hard wall in the one case real apps hit
constantly, and the workaround people reach for is worse than the thing
prevented.

**9. `Button` is a client component because of its click handler.** It uses no
hooks. `npm run lint:rules` decides `'use client'` by scanning for hooks, so it
would not have caught the directive's absence — and a Server Component may not
hand a function to a DOM element's event handler, which `loading` requires.
Recorded because the next person to tidy up the unused-looking directive needs
the reason. `Link` (3.3) and `ButtonGroup` (3.4) have no handler of their own
and stay `server`.

**10. Defaults.** `Button` is `variant="solid" tone="neutral"` — a button that
does not look pressable is a button nobody clicks, which is why this diverges
from `Badge`'s `ghost`: a badge is decoration and may recede. Hierarchy comes
from `tone`, so the rule an app ends up following is *one accent button per
view*, which is enforceable by eye precisely because the default is not accent.
`IconButton` and `Toggle` default to `ghost`, being overwhelmingly secondary
affordances; those are the batch's two deliberate inconsistencies and they are
named here so they stay decisions rather than drift.

## D-031 — `IconButton` build findings: the D-019 exemption, and props that outlive their types

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** D-019

**The `inline-size` exemption extends to a fourth file.** D-019 permitted
`inline-size` in `Icon`, `Spinner` and `Avatar` — "explicit and narrow: three
files, all `hug`, all square" — on the grounds that an intrinsically square
box's inline size is a restatement of its block size, not the "how much of my
parent do I take" decision RULES §1 reserves for the parent. `IconButton` is a
fourth of exactly that kind: both axes are `--pp-control-height-<size>`.

Rejected: `aspect-ratio: 1` with no `inline-size`, which passes the lint
untouched. D-019 already refused that trade for `Icon` — it satisfies the letter
of the rule while saying the same thing less clearly — and taking it here would
make the exemption *look* narrower without actually narrowing it. An exemption
that is visible in `.stylelintrc.json` is reviewable; one that is routed around
is not.

**`Omit<Props, 'asChild'>` removes a prop from the type and not from the
object.** `IconButton` omits `asChild` because `children` is already spoken for
— it is the SVG, so there is no slot left for a delegate element. The first
implementation omitted it from `IconButtonProps` and then spread `...props` into
`Button`, so a JS caller, or a spread of a wider props object, still reached
`Button`'s `asChild`. `Button` then delegated to the `<Icon>` element and
rendered a `<span>` carrying a button's class list, a button's `aria-label` and
none of a button's semantics.

Found by a test written to assert the *type* error, which rendered the broken
markup instead of the expected button and failed on `role="button"` not
existing. The prop is now destructured off explicitly, and the test asserts both
halves: that it does not typecheck, and that the runtime drops it.

**The standing rule:** when a component narrows an inherited props type, every
prop it removes must also be removed from what it forwards. A type is a claim
about callers who typecheck, and a component library has callers who do not.

## D-032 — One `useControllableState`, and the `'use client'` rule is scoped to what ships

**Date:** 2026-09-17 · **Status:** accepted · **Amends:** Tier 0.7 lint

Two rulings from `Toggle`, the library's first component with state of its own.

**`src/internal/useControllableState.ts`.** RULES §5.5 requires controlled *and*
uncontrolled support from every stateful component — "Both, always. No
exceptions." — which means `Toggle`, `Checkbox`, `Switch`, `Select`,
`NumberInput`, `Slider`, `Tabs`, `Accordion`, `Combobox` and `Dialog` all need
the same logic. Written ten times it will be ten subtly different ideas of what
`undefined` means.

The contract it fixes: `value !== undefined` is controlled and the component
stores nothing; otherwise uncontrolled, seeded from `defaultValue`; and
`onChange` fires in **both** modes, because a controlled consumer needs it to
update and an uncontrolled one needs it to observe.

It also warns, in development, when a component changes mode mid-life — usually
from `value={maybeUndefined}`. That failure is completely silent otherwise: the
component simply stops responding and nothing says why. React warns for its own
inputs; a library reimplementing the behaviour should too. The warning lives in
an effect rather than in render, so StrictMode's double render does not double
it.

`process.env.NODE_ENV` is declared locally and guarded with `typeof`. The
package builds with `types: []`, and the library may be loaded unbundled where
`process` genuinely does not exist — the same class of hazard RULES §7 addresses
for `window`.

**The `'use client'` rule now skips files the package build excludes.** A test
for a controlled component needs an owner with `useState`, and RULES §5.5 makes
controlled support compulsory, so every Tier 3 test file would otherwise carry a
`'use client'` directive that means nothing and protects nothing. The rule is
about RSC correctness of what ships, and `tsconfig.build.json` already says what
ships; the linter now uses the same boundary.

**The narrowing is asserted in both directions**, because scoping a rule too
widely looks exactly like a passing lint. `tests/lint-fixtures/` gained a
colocated test file using client-only React, and `test-lint.mjs` asserts the
rule fires **exactly once** across the fixture tree — for the shipped component
beside it. Widening the scope makes it fire twice; over-narrowing makes it fire
zero times; both were run and both fail. This is D-009's rule applied to a
change in a rule rather than to a new one.

## D-033 — An attached group collapses borders by dropping one, not by negative margin

**Date:** 2026-09-17 · **Status:** accepted

The standard way to build a segmented control is `margin-inline-start: -1px` on
every child after the first, so adjacent borders overlap into one. RULES §2
forbids a component applying margin, D-018 permits `margin: 0` and nothing else,
and the linter refuses the declaration outright.

`ButtonGroup` does not need an exemption, because the overlap was never the
point — a single edge was. Every child but the first drops its **leading border
on the group's own axis** (`border-inline-start-width: 0` when horizontal,
`border-block-start-width: 0` when vertical), so the seam is its neighbour's
trailing border and there was never a doubled edge to collapse.

Two things fall out of it, both asserted in the browser:

**The rules are per-axis, not a blanket "drop the leading border".** A vertical
group that also dropped the inline-start border would lose its left edge
entirely. Breaking the vertical rule to use the inline axis fails the assertion
on the right symptom, which is how it was checked.

**Solid children keep their border.** A solid button's border is
`transparent`, so dropping it merges two adjacent fills into one shape with no
seam at all. They keep the border and tint it with `--pp-tone-solid-active`
(D-028) — the pressed step, which is the one colour in the tone set guaranteed
to read against the fill on either side of it.

**And a stacking rule.** Buttons sit edge to edge, so a focus ring drawn at
`outline-offset` is painted underneath whichever neighbour comes after it in
source order. The focused child is raised with `--pp-z-raised`. It is the only
reason this component touches `z-index`, and it uses the token per RULES §3.

**Not the APG Toolbar pattern.** `role="group"` with every button its own tab
stop, rather than roving tabindex. Roving is right for a dense, persistent
toolbar of twenty controls and wrong for three attached buttons, where it costs
a keyboard user an arrow-key discovery step to reach what one Tab would have
reached. `Toolbar` (6.6) is the roving component; that is why it is a separate
roadmap entry, and this divergence is recorded per RULES §6.

## D-034 — A label's type scale is the control scale, not the text scale

**Date:** 2026-09-18 · **Status:** accepted · **Extends:** D-028, D-015

`Text` has four size steps (`xs sm md lg`, D-016 §1). Controls have three
(`sm md lg`, D-028). `Label` sits directly above or beside a control, and the
thing it has to agree with is the control, not the prose around it — so `size`
resolves `--pp-control-font-size-<size>`, the same token the `Input` beneath it
will read.

This is D-028's argument moved from height to type. A `Button`, an `Input` and a
`Select` must be the same height at `size="md"` or every form is a pixel
crooked; a label and its field must be the same type size for exactly the same
reason, and "agree by construction rather than by vigilance" is the whole point
of the `--pp-control-*` set existing at all. Every component in 3C and 3D
follows this: a form's text comes from the control scale.

**The visible consequence is that `sm` and `md` labels are the same font size**,
because `--pp-control-font-size-sm` and `-md` are both `--pp-font-size-2`. That
is not a gap in the ramp, it is the ramp: a control gets small by losing height
and padding, and a 12px label is not a smaller label, it is a worse one.

Asserted in the browser by comparing a `Label`'s computed `font-size` with a
`Button`'s at the same `size`, rather than against a number. A numeric
assertion still passes after someone hardcodes one of the two; the comparison
is the only form of the test that fails when they stop sharing a token.

## D-035 — `Label` build findings: the Matrix duplicates ids, and two tests that could not fail

**Date:** 2026-09-18 · **Status:** accepted

Three things found while building `Label`, all by a test failing rather than by
review. The first one is the one that matters for every remaining Tier 3
component.

**1. A playground page cannot demonstrate `htmlFor` inside a `Matrix`.** The
harness renders the same subtree six times (3 widths × 2 themes), so every `id`
inside it exists six times, and `for` resolves to the first match in the
document. Five of the six labels then name a control in another cell, and the
sixth is the only one that works. Caught by a browser assertion on the
accessible name returning `""`.

This is not a `Label` problem — `Field`, `Input`, `Checkbox`, `Radio`, `Switch`
and `Select` all render ids, and all of them will hit it. **The convention: a
component page demonstrates appearance inside the Matrix and association
outside it, once, where the ids are unique.** The alternative — teaching
`Matrix` to suffix ids per cell — was rejected: it would have to rewrite props
of arbitrary children, which is the cloning-children anti-pattern D-033's
component already refused, and it would hide a constraint that is real.

**2. `getClientRects()` on a block element returns one rect, not one per line.**
The test asserting that a wrapping label keeps its asterisk on the last line
counted the label's own rects and got `1` for a label visibly wrapping in three.
Line boxes come from a `Range` over the contents. It then had to be narrowed
further to a Range over the **text node**, because a Range over the whole label
includes the indicator, so the thing being compared against moves whenever the
indicator moves — an indicator given its own line reported a 2px delta instead
of a line height.

**3. A test named for the space character could not fail on the space
character.** Putting a literal space back before the indicator left that browser
test green: a space only orphans the glyph when the last line is nearly full, so
the layout it asserts is not sensitive to it. The test was rewritten to assert
what it can actually prove — the indicator shares the last line of the text, and
fails by a full line height when given `display: block` — and the space guard
was left where it can fail every time, in the jsdom test asserting the label's
text content directly.

This is the second time a break-it-and-watch check has found a test that could
not fail (D-009, and the Tier 3A focus test). It is the check earning its place
rather than a coincidence: **a test is not verified by passing, only by failing
on the symptom it names.**

## D-036 — `Field` is configuration, not a compound API

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** RULES §5.6

RULES §5.6 prefers `<Card><Card.Header/></Card>` over configuration props, and
warns that more than ~10 props probably means two components. `Field` takes
eleven and stays one component.

**`aria-describedby` has to be computed, and a compound API makes it a runtime
discovery problem.** With props, `Field` knows at render whether a description
and an error exist and builds the exact token list in one pass. With
subcomponents it must have children register themselves through context — an
effect, a state update, and a first render where the control's `describedby` is
wrong — or point at ids that may not exist yet. A token pointing at a missing
element is ignored silently by assistive tech, so that failure is invisible in
testing and total in use.

**The anatomy is invariant.** A field is a label, a description, a control and an
error, in that order, always. Composition earns its keep where structure varies;
here it would only buy the caller the ability to put the error above the label,
which is a design regression the library should not offer.

`Card` (5.1) remains compound — its slots really are optional and independent,
and nothing about `Card.Header` has to know whether `Card.Footer` rendered.

**Consequence:** every input in 3C and 3D is `<Field label="…"><Input /></Field>`
and never `<Field.Label>`. If a future component needs the compound form, that
is a new component, not a second API on this one.

## D-037 — `Field` build findings

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** `docs/specs/Field.md` §3, §10

Five findings, four of them from a test or a build failing rather than from
review.

**1. §10's escape hatch did not work, and `controlId` replaces it.** The spec
said a caller needing a specific control id should override it through the
render prop: `{(control) => <input {...control} id="email" />}`. That overrides
the id the control receives but not the `for` on the label `Field` has already
rendered, so the label points at nothing and the control has no accessible name
— silently. `Field` now takes `controlId`, which wires both sides. It is
`controlId` and not `id` for the reason §10 gave in the first place: `id`
spreads onto the root like it does on every other component, and a prop that
lands somewhere other than where it says is worse than no prop. A test asserts
the failure mode still exists for anyone who tries the old route.

**2. A render prop cannot cross the server/client boundary.** `Field` is a
client component, and a Server Component passing `children` as a *function*
fails the Next.js build outright: "Functions cannot be passed directly to Client
Components". Found by the playground prerender, the same way D-024's `Slot` ref
bug was.

The escape hatch is therefore **client-only**, and that is now documented in the
spec, the docs page and the component. The ordinary path is unaffected —
`<Field label="…"><Input /></Field>` passes an element, which serializes fine —
and this is one more reason controls read context rather than being handed
props: context has no such restriction.

**3. `exactOptionalPropertyTypes` applies to the build, not to `npm test`.**
`FieldControlProps` is assembled in one pass with `undefined` for every value
that does not apply, which needs `?: T | undefined` rather than `?: T`. Only
`tsc -p tsconfig.build.json` says so.

**4. A failing `tsc` silently serves a stale stylesheet, and two break-it checks
verified nothing.** `npm run build` is `build:js && build:css`, so a type error
leaves `dist/pixel-perfect.css` untouched; the playground then rebuilds and
serves the *previous* CSS, and a check that breaks a rule and watches a test
still pass concludes the test is worthless when in fact the break never
shipped. Two of this component's checks did exactly that.

**The rule, for every browser check from here on: prove the break is in the
served CSS before believing the result.** A `curl` of the stylesheet the page
links, grepped for the broken declaration, is the whole of it. And grep the
*served* file, not `dist/` — lightningcss does not minify, Next.js does, so
`grid-column: 2` and `grid-column:2` are both correct answers in different
files, and a pattern that assumes one silently reports zero for the other.

**5. Two CSS declarations were lying about being load-bearing.** `Field`'s
horizontal arrangement explicitly placed the control and the label at
`grid-column: 1 / 2; grid-row: 1`. Removing both changed nothing in the browser:
they are the first two items in source order, and pinning only the description
and the error to column 2 makes auto-placement produce the identical grid. The
explicit rules were deleted. A declaration that can be removed with no observable
effect is not documentation, it is a claim of a dependency that does not exist.

## D-038 — The release pipeline has never run; `blocked` is its real status

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** ROADMAP 0.8, Gate B

Found by checking CI on `main` before starting Tier 3C, which no session had
done since the workflow was written.

**Two workflows run on a push to `main`. Only one of them was ever looked at.**
`CI` — lint, typecheck, test, build, token freshness, visual regression — is
green on every merge and is what gates the PRs. `Release` has failed on **all
five merges to `main`**: `a39117e` (Tier 0), `3b7edec` (Tier 1), `6d265e8`
(Tier 2), `f3bcbfa` (Tier 3A), `5de2407` (Tier 3B). It has never succeeded once.

```
##[error]HttpError: GitHub Actions is not permitted to create or approve
pull requests.
```

`changesets/action` versions the package, writes `CHANGELOG.md`, commits, and
force-pushes `changeset-release/main` — all of which worked every time — and
then calls the API to open the version PR, which the repository's Actions policy
forbids. `.github/workflows/release.yml` already grants `pull-requests: write`;
the job-level permission is not the thing saying no. The repository or
organisation setting **Settings → Actions → General → Workflow permissions →
"Allow GitHub Actions to create and approve pull requests"** is.

**1. The failure mode is the dangerous kind: it looks like it worked.** Every
step that produces visible output succeeded, the release branch really is pushed
and up to date, and the only thing missing is the PR that would let a human
merge it. So `main` carries version `0.0.0`, no `CHANGELOG.md` and no git tag
after twenty-six components, and the branch that would fix all three has been
sitting force-pushed and unmerged since 2026-09-17.

`docs/RELEASING.md` says that without `PUBLISH_TO_NPM` "the repo still gets
versions, a CHANGELOG and git tags, which is all a git dependency needs." That
sentence is false as written and has been since it was written: the `Tag release`
step is gated on `hasChangesets == 'false'`, which is only ever true *after* the
version PR merges, and the version PR has never existed. Nothing tags anything.

**2. 0.8 is `blocked`, not `done`.** The Definition of Done says a thing that
cannot be completed "goes to `blocked` with a stated reason — never to `done`."
0.8's deliverables were reviewed as files — a workflow, a config, a docs page —
and the file existing was taken for the pipeline working. It is the same mistake
D-009 names for linters: **a pipeline that has never been observed succeeding
provides no evidence about anything**, and the observation is one `gh run list`
away.

The component work is unaffected. Every `Changeset added` box was ticked
truthfully: 27 changesets exist and are correct, including one each for `Label`
and `Field` under generated names. They are pending, not missing.

**3. A blocked release pipeline does not gate component work**, and this is an
explicit ruling rather than an oversight, because Tier 0's heading says
"Nothing else may start until this tier is `done`" and Gate B says "Tier 0 must
be fully `done` before any component starts." Read literally, 0.8 turning
`blocked` halts the roadmap.

That reading is wrong, and the reason is the one Tier 0's rule was written for:
the tier gates component work because **components are built on it** — tokens,
layers, the test harness, the lint. Nothing about `Input` depends on a version
number or a git tag. The consuming app installs from a git ref, which resolves
without tags. The blast radius of shipping Tier 3C with the release pipeline
broken is that the changeset count goes from 27 to 33.

**So Gate B reads: every foundation a component *consumes* must be `done`.**
0.8 and 0.10 are release and documentation infrastructure, and neither is
consumed by a component. If this exception is ever load-bearing for something
else, it needs its own entry — it is not a general licence to start work on top
of a broken foundation.

**4. Fixing it is the user's call, because every route is outward-facing.**
Enabling the setting changes repository policy; a PAT adds a secret with more
authority than `GITHUB_TOKEN`; committing the version directly to `main` from CI
removes the human review step that the version PR exists to provide. Recorded
here rather than resolved.

**Chosen 2026-09-18: enable the repository setting.** A PAT grants more authority
than `GITHUB_TOKEN` to solve a problem that is not about authority, and
committing the version straight to `main` deletes the gate the version PR exists
to be. The workflow is written correctly for the flow it assumes; one toggle
makes the assumption true:

```
gh api -X PUT repos/mod-0-dev/pixel-perfect/actions/permissions/workflow \
  -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=true
```

`default_workflow_permissions` stays `read` deliberately. It is already `read`,
and the workflow declares `contents: write` for itself — which is why it could
push `changeset-release/main` every time it failed — so widening the default
would grant authority nothing asked for.

**Nothing else in the pipeline is broken, verified before the toggle rather than
after.** `origin/changeset-release/main` already carries the correct output:
`0.0.0` → `0.1.0` with a generated `CHANGELOG.md`, from a config with
`baseBranch: main` and `commit: false`. Every step but the last has succeeded on
every merge for five merges. Worth establishing first, because a fix applied to a
pipeline with two faults looks exactly like a fix that did not work.

**Observed succeeding 2026-09-18, and 0.8 is `done`.** The setting reads
`can_approve_pull_request_reviews: true`, the rerun of the `main` Release run
completed green, and it produced the artifact rather than merely exiting zero:
PR **#6** `chore(release): version packages`, from `changeset-release/main`,
carrying `0.0.0` → `0.1.0` and a generated `CHANGELOG.md`. Checked in that order
deliberately — a green run and a created PR are different claims, and this entry
exists because the first was never checked at all.

**`Tag release` observed the same day, and the pipeline is now proven end to
end.** Merging PR #6 (`ce456d1`) ran Release once more with no changesets left,
so the step finally executed instead of being skipped:

| Evidence | Result |
| --- | --- |
| Release run 35346875708 | `success` |
| step `Changesets` / `Tag release` | `success` / **`success`** |
| `git ls-remote --tags origin` | `v0.1.0`, `v0.1.0^{}` |
| `package.json` on `main` | `0.1.0` |
| `CHANGELOG.md` on `main` | present |
| `.changeset/*.md` remaining | none — all 27 consumed |

The tag was read from `ls-remote` rather than inferred from the step's exit code,
for the same reason the version PR was checked rather than the run's colour: a
step succeeding and an artifact existing are different claims, and mistaking one
for the other is the entire content of this entry.

**A predicted failure mode did not happen, and the prediction was wrong for a
checkable reason.** `git push --follow-tags` pushes only *annotated* tags, so
lightweight ones would have produced a green step and no tag — a silent failure
shaped exactly like the one being fixed. `@changesets/git` runs
`git tag <name> -m <name>`, and `-m` makes the tag annotated, so `--follow-tags`
carries it. Confirmed in the dependency's source before the run finished, and
then in the peeled `v0.1.0^{}` ref afterwards. Worth recording because the guess
was reasonable and still wrong: the source settled it in one grep.

**The whole episode, in one line:** a workflow that had never once succeeded sat
behind a `done` status for five merges, and the check that found it — `gh run
list` — costs a second and had never been run. The Definition of Done gained
nothing from this that D-009 did not already say about linters; what it gained
is a second domain where the rule holds. **Infrastructure is `done` when it has
been observed producing its artifact, not when its config file exists.**

## D-039 — Tier 3C rulings, approved as a batch

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** RULES §5.1, §5.3; D-019; ROADMAP 3.11

Gate C for the six native inputs
([`tier-3c-inputs.md`](specs/tier-3c-inputs.md)). Twelve rulings were put up and
all twelve accepted; three were amended at the gate and are recorded in the
spec's §13. The ones that are precedents rather than local choices:

**1. `ref` and rest props go to the control; `className` and `style` go to the
root.** RULES §5.1 forwards `ref` to the root element and §5.3 spreads the
remaining props onto it. For `Checkbox`, `Radio`, `Switch` and `Select` the root
is a decorative wrapper, so a literal reading hands the caller a ref to a
`<span>` and spreads `placeholder` onto it.

The principle: **the root is the box, the control is the element.** Anything
describing appearance goes to the box; anything functional goes to the element.
A ref to a form control is used to focus it, read `.value`, call
`setCustomValidity()` and hand to `react-hook-form` — a ref to the wrapper does
none of them. For `Input` and `Textarea` the two are the same node and this
collapses to RULES §5 unchanged.

The props type stays `ComponentPropsWithoutRef<'input'>`, so the split is
invisible: the caller sees input props and gets input props.

Rejected: a `wrapperProps` escape hatch, which is the first of `inputProps`,
`labelProps` and `indicatorProps` — the configuration sprawl RULES §5.6 exists
to stop.

**2. The native input is the painted control.** `appearance: none` on the real
`<input>`, styled directly, with the mark as an `aria-hidden` sibling. Not a
hidden input behind a `<div role="checkbox">`, which has to rebuild `:checked`,
`:indeterminate`, label-click, Space, form reset, autofill and the accessibility
tree, and rebuilds them incompletely.

**3. The mark is an inline `Icon`, not a CSS asset — and the first answer was
wrong.** The spec originally ruled for a colourless `mask-image` data URI, plus
a lint rule parsing inside the URI for `fill=`, `stroke=` and `#`, plus the
exemption to go with it. That measured against the wrong constraint: the
`<input>` is void, but the **indicator is a `<span>` and takes children**. So the
mark is an SVG path in the markup, inside `Icon` (1.3), coloured by
`currentColor` from a token.

It deletes a proposed lint rule and a proposed exemption, and it makes the path
reviewable in a diff rather than URL-encoded in a stylesheet. The whole cost is
about sixty bytes of markup per control.

**Worth generalising:** the rejected options were all CSS mechanisms, and the
question was never a CSS question. A ruling that proposes a new lint rule to
make itself safe is evidence the mechanism is wrong, not that the linter is
missing a feature.

**4. Undersized checkable controls pass 2.5.8 on spacing, not on the label.**
The boxes are 16/20/24 (`--pp-size-4/5/6`), so `sm` and `md` are under WCAG 2.2
SC 2.5.8's 24×24 minimum. They conform through the **spacing exception** — a
24px circle centred on each target does not intersect its neighbour's — which,
unlike the label argument, does not depend on a label existing.

**This is why `RadioGroup`'s `gap` defaults to `"3"` and not `"2"`.** At 8px a
column of `sm` radios puts centres exactly 24px apart: tangent circles, touching
at a point, which is an argument with an auditor rather than a pass. 12px clears
it at every size (28 / 32 / 36). The default is load-bearing and asserted in a
test — the third time a default has been (D-020's `gap="0"`, D-022 §6's
`gutter="5"`, now this one).

**5. `RadioGroup` implements no roving tabindex, overturning `ROADMAP.md` 3.11.**
Radios sharing a `name` already implement the APG Radio Group pattern in every
browser, including wrapping, Home/End and skipping disabled members. Writing our
own means removing that and rebuilding it. This is RULES §8's argument pointed
at the browser rather than at Radix, and D-030 §7's `ButtonGroup` ruling a second
time.

**Consequence: `RadioGroup` generates a `name` from `useId()` when none is
given.** Grouping *is* the `name` attribute, so two unnamed groups on one page
are one group and selecting in either clears the other — silent, and exactly the
kind of thing that ships.

Native radios also answer all four arrow keys regardless of orientation, which is
a superset of APG rather than a deviation. Recorded so the next reader of the APG
page does not "fix" it.

**6. Text controls use no state hook.** `Input`, `Textarea` and `Select` pass
`value` / `defaultValue` / `onChange` straight to the DOM. This is the fullest
compliance with RULES §5.5, not an exception to it: React's inputs already
implement the exact contract D-032 wrote down, and wrapping them would hand
callers an `onChange` taking a value instead of an event — unusable by
`react-hook-form`, and unable to read `event.target.validity`.

`Checkbox`, `Switch` and `RadioGroup` do use `useControllableState`, because
RULES §4 needs the state during render to emit `data-state`, and a native
checkbox's checkedness is not available to the render that has to describe it.

**7. The `inline-size` exemption extends to three more files.** `Checkbox`,
`Radio` and `Switch` join `Icon`, `Spinner`, `Avatar` (D-019) and `IconButton`
(D-031). All `hug`, all intrinsically sized, all explicit in `.stylelintrc.json`
rather than routed around with `aspect-ratio`. `Switch` is the first that is not
square — a 2:1 track is as intrinsic as a 1:1 box.

**8. `Input` allows `type="number"`, and `NumberInput` will not use it.**
Excluding a type the platform supports, to push callers toward a component that
does not exist until 3.14, is hostile for the months in between. `file` and
`hidden` do join the exclusion list — the first is `FileUpload` (5.10), the
second needs no component.

The finding underneath: `type="number"` mutates its value on a scroll wheel over
a focused field, rejects a locale decimal comma, and reports `value === ''` for
anything it cannot parse, so `1,5` in a German locale is silently lost.
`NumberInput` (3.14) is `type="text"` with `inputMode="numeric"`, and `Input`'s
docs say so now rather than surprising someone a tier later.

## D-040 — `Input` build findings: a form control does not fill

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** RULES §1 (statement of mechanism); `docs/specs/tier-3c-inputs.md` §3.8, §3.9, §3.11, §3.13

Four findings, three of them from a measurement or a deliberate break rather
than from review. The first invalidates a sentence in RULES §1 and changes the
anatomy of three components.

**1. RULES §1's mechanism is false for form controls.** The rule's argument
against `width: 100%` is that it is unnecessary:

> A block element with no width declaration already fills its parent, and does
> so correctly in every layout context.

That is true of a `<div>` and false of every control in this tier, which carries
an intrinsic inline size from the HTML `size` / `cols` attribute. Measured inside
a 600px parent, before a line of the component was written:

| Element | `display: block` | grid item | flex item |
| --- | --- | --- | --- |
| `<input>` | **185px** | 600px | **185px** |
| `<textarea>` | **182px** | 600px | — |
| `<select>` | **52px** | 600px | — |
| `<p>` (control) | 600px | 600px | — |

**The fix needs no exemption.** The root is a `<span>` that is `display: grid`
and the control stretches into its single cell, so no width is declared anywhere
and the layout does the job RULES §1 assigns to the parent — which is D-021's
ruling ("a layout primitive may size the boxes it creates") applied by a
component to its own one child.

Flexbox is not an alternative and was measured rather than assumed: a flex item
does not stretch on the main axis without `flex-grow`.

**Consequence: `Input` and `Textarea` were specified as single-element
components and are not.** Every component in 3C has a wrapper, which makes
D-039 §1's prop split uniform across the group rather than a per-component rule.
`RULES.md` §1 keeps its rule — *don't declare width* — and its stated mechanism
now has a named exception.

**2. `Exclude<HTMLInputTypeAttribute, …>` bans nothing.** React types an input's
`type` as a union of literals ending in `(string & {})`, so that custom values
stay assignable. `'checkbox'` is assignable to `string & {}`, which means
`Exclude` removes the literal and lets the value straight back in — the spec's
props table was a type that did not typecheck anything. Replaced with an explicit
allow-list, which also documents what the component supports.

**The general shape:** a subtractive type over a union with a string escape hatch
subtracts nothing. Additive is the only form that holds.

**3. Two browser assertions could not fail, and one was hiding a real bug.**
Both focus tests compared a *valid* control's border against an *invalid* one's
and called the difference the focus shift. Those two differ because of
`data-invalid`, not because of focus, so deleting the focus rule from the
stylesheet entirely left all seven Input tests green. Isolating focus requires
comparing the **same control** at rest and focused; nothing else does.

Rewriting them found the bug. `.pp-input[data-invalid] .pp-input__control` is
0-3-0 and outranks `.pp-input__control:focus-visible` at 0-2-0, so **focus never
shifted the border on an invalid control** and `--pp-tone-focus` reached valid
controls only — silently undoing half of D-039 §4, the ruling that spends the
token D-029 reserved.

State is now declared on the **root**, where the custom property inherits down
and the control's own `:focus-visible` declaration wins for that element. The
precedence the design wanted, expressed as inheritance rather than as a
specificity race. **Standing rule for the rest of the tier: a state declaration
goes on the root, never on a descendant selector, because the descendant form
quietly outranks the control's own pseudo-classes.**

This is the fourth time a break-it-and-watch check has found a test that could
not fail (D-009, the Tier 3A focus test, D-035 §2–3). It is no longer evidence
about those tests; it is evidence that **a test's value is established by
watching it fail, and a suite where that has never been done is unmeasured.**

**4. `font-family: inherit` was redundant, and the linter said so first.**
Stylelint rejected it — the rule requires `var(--pp-font-family-*)` — and the
right answer was neither to comply nor to widen the rule. `reset.css` already
gives form controls `font: inherit`, at `:where()` zero specificity, which is
deliberate: a consuming app that sets its own font on inputs *should* win, and
redeclaring it in `pp.components` would take that away. The line was deleted.
D-037 §5's lesson, reached from the other direction — there the declaration was
load-bearing-looking and inert, here the linter pointed at it first.

## D-041 — The screenshot list is asserted against the registry, not kept in step by hand

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** D-012 (consequence), Tier 0.6

`Input` shipped with a playground page, a registry entry and **no screenshot
baseline**, and CI went green on it.

`tests/visual/screenshots.spec.ts` holds a hand-maintained `PAGES` list that
duplicates `playground/app/components/registry.ts`. The duplication is forced
and cannot be removed: the playground is not a workspace member (D-012), it has
its own lockfile, and neither side can import the other. The spec carried a
comment about it:

> Keep this list in step with `playground/app/components/registry.ts`. The two
> cannot share a module — the playground is not a workspace member (D-012) — so
> a component page without a screenshot here is a Definition of Done miss.

**The comment was correct, predicted the exact failure, and could not prevent
it.** `input` was added to the registry and not to `PAGES`. No screenshot test
was generated, so the visual job compared twenty-eight baselines that all still
matched, reported success, and skipped the authoring step — because there was
nothing new to author.

**The failure is silent in the one way that matters: a missing baseline normally
fails loudly, but only for a test that exists.** Tier 0.6's whole design assumes
that a new component produces a new screenshot test whose baseline is absent,
which CI then authors (D-017). A component that produces no test at all walks
straight through that mechanism, and the Definition of Done's "visual regression
snapshots committed" box goes unmet with every check green.

**`tests/unit/playground-registry.test.ts` asserts the invariant in both
directions** — every registry slug has a screenshot entry, and every screenshot
entry has a page. It runs in `npm test`, so it gates the same PRs CI does.

It also asserts that both lists are non-empty, because both directional checks
are vacuously true if either regex stops matching — which is precisely how a
rewrite of either file would disable this test without anyone noticing. Verified
by deleting the `input` entry and watching it fail by name, not merely by
watching it pass.

**The general rule, now stated for the third time in this log:** D-009 said rules
that are not tested decay into rules that are not enforced; D-028 said
cross-component agreement should be structural rather than vigilant. **A comment
asking a future reader to keep two files in step is neither.** Where
deduplication is genuinely impossible — and here it genuinely is — the agreement
gets a test, not a paragraph.

## D-042 — A baseline authored after its PR merges is lost, and `main` cannot author one

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** D-013, D-017, D-041

D-041 gave the registry/`PAGES` drift a test and added `input` to `PAGES`. It
did not land the baseline, and the baseline did not land itself.

**The sequence, from the run logs:** PR #9 merged at 13:09:28. Its visual job
started at 13:09:31 — three seconds *after* the merge — authored `input.png`,
and pushed it to the PR branch at 13:11:30, two minutes after that branch had
stopped mattering. The file was real the whole time, sitting on a merged branch
at `1b72878`, reachable from no ref anyone would look at. So `v0.2.0` shipped
`Input` with "visual regression snapshots committed" unmet for the second time,
by a different mechanism than the first.

**Then `main` went red and could not recover.** Every push since ran the visual
job against a missing baseline, authored it, and had the push rejected:

> `remote: error: GH006: Protected branch update failed for refs/heads/main.`
> `remote: - Changes must be made through a pull request.`

Everything upstream green, failure at the last step, an Actions write vetoed by
repository policy — **D-038's shape exactly, in a different workflow, eight
hours later.** Twice makes it a pattern worth naming: *a CI step that writes to
the repository is a step repository policy can veto, and it will look like a
working pipeline until someone reads the last line of a job that mostly passed.*

**Repaired in two places.** The baseline lands through a pull request, where —
because the file now exists — CI *compares* it instead of authoring it, which is
the verification D-013 asks for and an authoring run by construction cannot
give. And the authoring step is gated on `github.event_name == 'pull_request'`,
with a `main`-side step that fails naming the missing file rather than
attempting a push policy forbids.

**What is not repaired, because the repository cannot repair it.** `main` has no
required status checks; PR #9 was mergeable before a single check existed. The
workflow comment that "an authoring commit should never be the final head of a
PR" describes an ordering that nothing enforces and nothing in this repository
can enforce. That is a branch-protection setting, and it is the root cause.

**Required status checks were considered and deliberately declined** (2026-09-18).
Requiring the two CI jobs would close the race, but it collides with the way
baselines are authored: a push made with `GITHUB_TOKEN` starts no workflow run,
so the authoring commit becomes a head SHA that the required checks never report
on, and the PR blocks until someone pushes again — a manual nudge once per new
component, 68 components ahead of us. The version that avoids the nudge needs a
PAT or App token with `contents: write` standing in the repository secrets, and
that credential was judged not worth its blast radius for this.

So the race is accepted, and **the `main`-side guard is the mitigation rather
than a second line of defence.** If it is ever deleted as redundant, this class
of failure goes back to being silent. Its shell was checked by running the
classify logic against an untracked baseline and watching it exit 1 naming the
file; its `if:` condition is verified only by YAML parse, because no run since
has had a missing baseline on `main` to trigger it. First real merge that skips
it while `new == 'false'` is the confirmation — PR #10 recorded exactly that.

**And the lesson that generalises past screenshots:** D-041 ruled that where
deduplication is impossible, the agreement gets a test. This adds the limit of
that ruling — **a test that two lists agree is not a test that the artifact the
lists describe exists.** `tests/unit/playground-registry.test.ts` passed at
every moment described above, correctly, while the baseline it was written to
protect was absent from `main`.

## D-043 — `Textarea` build findings: padding derived from the control scale

**Date:** 2026-09-18 · **Status:** accepted · **Extends:** D-028, spec §10

### 1. The space scale cannot express this component's padding, so it is computed

A one-row `Textarea` should be exactly as tall as an `Input` at the same size.
That is D-028's agreement — a `Button`, an `Input` and a `Select` agree by
construction rather than by vigilance — applied to the axis D-028 never had to
think about, because every control before this one declared a fixed height.

The padding that produces it is `(height − line box − borders) / 2`:
**3.8 / 7.8 / 10.2px** at `sm` / `md` / `lg`. `--pp-space-1` and `--pp-space-2`
land within half a pixel of the first two. **Nothing on the scale is within
1.8px of the third** — the neighbours are 8px and 12px — so `lg` would be 4.4px
short or 3.6px over, and the largest control would be the one visibly
disagreeing with the `Button` beside it.

So it is a `calc()` over the same tokens `Input` reads. No hardcoded length, no
new token, and the agreement is structural rather than a number someone eyeballed
once. Verified by replacing the calc with `--pp-space-2` and watching the browser
assertion fail at `sm` by 8.39px — the exact 4.2px-per-side error the arithmetic
predicts — with the broken value confirmed in the **served** stylesheet first,
per D-037 §4.

**The general point:** a scale exists to stop people inventing values, and this
is the case where an increment genuinely is not on it. The answer is to derive
the value from the tokens that already encode the constraint, not to round to the
nearest step and let a 3.6px disagreement ship as if it were a design decision.

### 2. `rows` is the floor because the measurement resets first, not because anything enforces it

`measure()` writes `block-size: auto`, reads `scrollHeight`, writes it back. Both
halves of the spec's §10 claim fall out of the reset:

- **It shrinks.** `scrollHeight` is max(content, client), so measuring against a
  height the component wrote itself can only ratchet upward — the control grows
  with the text and never comes back when it is deleted. Verified by deleting the
  reset and watching the control stay at 152px after being emptied, against a
  62px floor.
- **It never goes below `rows`.** With no height of its own the element falls
  back to its `rows` height, and `scrollHeight` cannot report less than that.
  There is no minimum stored anywhere to drift from the attribute. Verified by
  making `autoResize` ignore `rows`, which left the empty control 22.375px — one
  line — shorter than the fixed control beside it.

Borders are read as `offsetHeight − clientHeight` rather than from
`getComputedStyle`: that difference *is* the border box minus the padding box, it
needs no parsing that can return `NaN` for a logical property an engine spells
differently, and it costs one layout read instead of two.

### 3. The `ResizeObserver` watches width only, and that is not an optimisation

Writing `block-size` is itself a resize. An observer that re-measures on any size
change re-enters its own callback forever. Width is the only dimension that is a
*reason* to re-measure — it reflows the text and changes the height the content
needs — so width is the only one that triggers it.

### 4. `--pp-textarea-placeholder-color` is in the component and not in the spec

The spec §3.9 lists seven custom properties and this is an eighth. `Input` ships
`--pp-input-placeholder-color`, both controls style `::placeholder` the same way
and for the same solved-contrast reason (D-008), and a caller who can retint one
surface's placeholder but not its sibling's would be looking at an oversight,
which is what this was. Recorded rather than left as a silent superset.

### 5. Five unit tests and four browser assertions were broken on purpose

The precedence rule, the chained `onInput`, the auto-resize teardown, the merged
`ref` and the Tab-does-not-insert guard each failed on exactly one test when
broken; the padding calc, the auto-resize reset and the `rows` floor each failed
in the browser on the assertion named for them. **This is the fifth component in
a row where that check has been run, and the first where it found nothing wrong**
— which is worth recording, because the check earning its place four times and
then coming up empty once is what a working practice looks like, not a reason to
stop running it.

## D-044 — `Checkbox` build findings: a private custom property is not private

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** `docs/specs/tier-3c-inputs.md` §3.10

Four findings. The first is a mechanism the library had half-written down and
had not stated, and it will recur in `Radio`, `Switch` and `Select` — every
component whose anatomy includes another component's root element.

**1. `--_size` collided with `Icon`'s `--_size`, and an `lg` checkbox drew a
16px mark in a 24px box.**

The indicator is an `Icon`, so that element carries both `.pp-checkbox__indicator`
and `.pp-icon`. Checkbox read its own box size down there:

```css
.pp-checkbox { --_size: var(--pp-size-6); }          /* lg */
.pp-checkbox__indicator { --pp-icon-size: var(--_size); }   /* resolved to 1em */
```

`Icon.css` declares `--_size: 1em` on `.pp-icon`, on that same element, and it is
right to — that is D-024's always-emit rule, the one `Field.css` cites for nested
fields. So the inherited value was shadowed by Icon's own, and `var(--_size)`
resolved to Icon's `1em` rather than to Checkbox's `--pp-size-6`.

**The leading underscore is a naming convention and nothing else.** CSS has no
component scope for custom properties: they inherit, and any element may
redeclare any of them. Two components that both use `--_size` collide on any
element that carries both their classes.

The fix is not a rename. A custom property is substituted at computed-value time
on the element where it is **declared**, so the value is resolved on Checkbox's
own root and the result inherits down:

```css
.pp-checkbox { --_mark-size: var(--pp-checkbox-size, var(--_size)); }
.pp-checkbox__indicator { --pp-icon-size: var(--_mark-size); }
```

**Standing rule, and the other half of D-024:** *always emit your own private
properties on your own root* (D-024) — **and resolve them there too, never
inside another component's element.** Reading `--_anything` inside a subtree you
do not own is reading whatever that subtree happens to mean by the name. The
public `--pp-<component>-*` API is the only safe channel across a component
boundary, which is what it is for.

Found by an assertion written to make the `--pp-icon-size` line load-bearing —
not by review, and not by looking at the page, where a 16px check inside a 24px
box looks like a design choice.

**2. A controlled `checked="indeterminate"` lost its dash on the first click.**

A click's activation behaviour clears the `indeterminate` DOM property. React
restores `checked` for a controlled input after the handler returns, but
`indeterminate` is not a prop it rendered, so nothing restores it — and a parent
that ignores `onCheckedChange` never re-renders, so the effect that sets it does
not run either. The third state, silently gone, in the one component that exists
to hold it.

Re-asserted at the end of the change handler, using the **render-time** value.
The ordering is what makes that correct rather than lucky: React batches the
update and flushes it after the handler, so when the state really does change the
effect runs afterwards and wins; when nothing changes, nothing runs afterwards
and this is the last word.

**3. `flex-shrink: 0` was inert, and the test paired with it could not fail.**

Both were written on `Icon`'s precedent (D-019's "an icon that shrinks inside a
tight Cluster is the commonest icon bug"). Removing the declaration and rebuilding
changed nothing: the box measured 20px in a **non-wrapping** `Cluster` at 240px
beside an unbreakable neighbour. So did adding `min-inline-size: 0`.

The reason is that a flex item's automatic minimum size is its content's, and
this one's content is an `<input>` with a definite `inline-size`. `Icon` needs
the declaration because its child is an SVG at `inline-size: 100%`, which
contributes nothing to a min-content measurement; a real length contributes all
of it. **Borrowing a precedent is not the same as sharing its cause.**

Both deleted, under D-037 §5 — a declaration that can be removed with no
observable effect is a claim of a dependency that does not exist — and the test
with it, since it was strictly redundant with the size assertions that do fail.
The first version of the demo made it worse than redundant: `Cluster` wraps by
default, so it was a squeeze test with no squeeze in it.

**4. Sixth break-it check, and a note on what counts as a break.** Ten breaks
were made. Eight failed on exactly the test named for them — the `type` strip,
the `indeterminate` effect (five tests at once), the mark's `pointer-events`, the
focus border, the size scale, the source order of `disabled` against `checked`,
the change-handler re-assert of §2, and the naive negation below.

Two failed nothing, and that pair is §3: the check found the declaration inert
and then found that the test written beside it could not fail either. §1 was not
found by a break at all — it was found by writing an assertion to make an
existing line load-bearing, which is the cheaper half of the same habit.

One "break" failed nothing and was **not** a finding: replacing
`setChecked(event.target.checked)` with `setChecked(checked !== true)` is an
equivalent correct implementation, not a defect, so a green suite was the right
answer. The mistake a person actually makes is `setChecked(!checked)` —
`!'indeterminate'` is `false`, a "select all" that deselects everything on its
first click — and that one failed two tests immediately.

**Worth keeping:** a break-it check measures a test only if the break is a bug.
Mutating code until something goes red measures nothing, and a green result from
a correct mutation is not evidence of an unmeasured test.

**5. The served-CSS rule (D-037 §4) earned its keep on the path, not the
minification.** The first served-CSS grep reported zero matches for a declaration
that was present, because Next.js serves the library stylesheet from
`/_next/static/chunks/*.css` and the pattern assumed `/_next/static/css/`. A
check that silently reports "absent" for "looked in the wrong place" is the same
failure shape D-037 §4 was written about, one level up: **verify the verifier by
seeing it find the thing before you trust it not finding the thing.**

## D-045 — The pointer over a checkbox row comes from `Field`, not from the control

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** `docs/specs/Label.md` §5, `docs/specs/tier-3c-inputs.md` §3.10 (Styling API, State)

Found by a repository sweep rather than by a test — which is itself the
finding, and is why a test now exists.

**Label spec §5 described a mechanism that could not work.** `Label` declares
`cursor: var(--pp-label-cursor, inherit)` so that a control which makes its
whole row a click target can ask for the pointer without a `.pp-checkbox
.pp-label` selector. The spec, the docs page, `Label.css` and the Label
playground page all said `Checkbox`, `Radio` and `Switch` would set
`--pp-label-cursor: pointer` on their own root and let it inherit.

Two things were wrong with that, and `Checkbox` shipped `done` with both:

1. `Checkbox.css` never set it. Nothing asserted the claim, so nothing noticed.
2. It could not have worked if it had. Inside a `Field` the label is the
   control's **sibling** — `.pp-field__control > .pp-checkbox` beside
   `.pp-field__label` — and a custom property inherits **downward only**. A
   value on the control's root reaches the control's descendants and nobody
   else. The mechanism D-007 and D-044 rely on was invoked on an element it
   cannot start from.

**The fix keeps the mechanism and moves the declaration to the only element
that can make it.** The common ancestor of the control and its label is the
`Field`, and `orientation="horizontal"` is *defined* (Field spec §8) as the
checkbox arrangement. So:

```css
.pp-field[data-orientation="horizontal"]:not([data-disabled]) {
  --pp-label-cursor: pointer;
}
```

That is `Field` using `Label`'s public styling API on itself — the one channel
D-044 permits across a component boundary — and not a cross-component
selector. `Field` still restyles no child; it sets a property the child
published for exactly this. Not on a disabled row: a disabled control cannot
take focus, clicking its label does nothing, and a pointer would promise a
click that does not happen. The control beneath already shows `not-allowed`.

`Checkbox`, `Radio` and `Switch` set nothing, and the spec sections that said
they would are corrected. A row assembled by hand — a `Cluster` around an input
and a `Label` — sets the property on the row, which is what the Label playground
page has done since 3.6 and now says so.

**Asserted in the browser**, as a computed `cursor` on the label element itself:
`pointer` on a horizontal field, not `pointer` on a vertical one, not `pointer`
on a disabled horizontal one. Broken on purpose before it was trusted (D-035
§3): with the declaration flipped to `inherit` — confirmed in the *served*
stylesheet first, per D-037 §4 — it failed on exactly the symptom it names,
`Expected: "pointer", Received: "auto"`. It fails the same way if the
declaration moves back onto the control, which is the whole point: the previous version of this claim lived
only in prose, in four places, for two components, and was false in all four.

**The general rule, which D-044 stated for reading and this states for
writing:** a custom property is only a channel between two elements when one is
an ancestor of the other. "Set it on my root and let it inherit" is correct for
a component's own parts and meaningless for its siblings. Before a spec promises
that component A will set a property component B reads, check that B is inside
A. `Radio`, `Switch` and `Select` all compose into `Field` beside a `Label`, and
all three would have copied this.

**Also corrected in the same sweep, none needing a ruling:** `Button.tsx` and the
Button playground page said the loading label is hidden with `visibility`,
which D-030 §2 found the hard way is the one thing it must not be — the CSS was
right and the prose was not. `docs/RELEASING.md` still said the release
pipeline had never run and 0.8 was `blocked`, two releases after D-038 proved it
end to end. The 3C spec's `Checkbox` section listed a `--pp-checkbox-bg-checked`
property that was never built and described a `mask` the §13 amendment had
already replaced with an inline `Icon`. And the playground registry listed
components in implementation order, so the home page navigation read 1.3, 1.5,
1.8, 1.10, 1.6 — it is in roadmap order now, with the screenshot list beside it.

## D-046 — `Scroller` `both` measures and shades both axes; the inline axis is `data-overflow-inline`

**Date:** 2026-09-18 · **Status:** accepted · **Amends:** `docs/specs/tier-2-layout.md` §2.8 (State)

`orientation="both"` promised two scrolling axes and delivered one. The
component measured only `scrollTop`, reported it as `data-overflow`, and the
stylesheet's `both` rules shaded the block edges only. Content past the inline
edge of a `both` region had no shadow and no attribute — the exact failure
`Scroller` exists to prevent, on half of its widest case. Raised in the sweep
that produced D-045, as a gap rather than a defect, because nothing promised
otherwise in a test; it is a defect, because the prop promised it.

**One attribute cannot name the edges of two axes.** `"start" | "end" |
"both"` describes one axis. So `both` reports the block axis as `data-overflow`
— the default orientation's axis, and unchanged for `vertical` — and the inline
axis as `data-overflow-inline` beside it. The inline attribute exists only on
`both`: on `horizontal`, `data-overflow` already *is* the inline axis, and a
second attribute for the same axis would be a second source of truth.

**The stylesheet is one property per edge, not one rule per combination.**
The first version wrote a rule for each orientation × overflow pair — eight
rules for two axes, and `both` would have needed sixteen. Now four gradient
layers are always declared and each is sized by a private property that
defaults to `0`; a zero-sized layer paints nothing, so showing an edge is one
declaration. The two axes cannot collide because they never share a rule.

Both axes are now measured on every event regardless of orientation; the
second read costs nothing, and the attributes decide what is reported. The
state setter returns the previous object when neither axis changed, so a scroll
that crosses no edge does not re-render.

**Asserted in the browser as shaded edges, not attributes.** The count of
non-zero background layers is what is checked — two at rest, four mid-scroll —
because attributes alone would pass against a stylesheet that ignores them,
which is precisely what the shipped version did for the inline axis.
Broken on purpose before it was trusted: with the `data-overflow-inline` rules
renamed so the stylesheet ignores the attribute — confirmed in the served CSS
first — the attribute assertions still passed and the edge count failed,
`Expected: 2, Received: 1`. That is the shipped defect reproduced, and the
only assertion that would have caught it.

Minor bump: a new attribute in the rendered DOM.
