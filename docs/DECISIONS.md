# Decisions

Append-only log of rulings that shape the library. One entry per decision.
Consistency across sessions depends on this file — an undocumented precedent is
not a precedent.

Record an entry whenever: a rule in `docs/RULES.md` is bent, a convention is
established, a component is deferred or rejected, or a dependency is adopted.

---

<a id="d-001"></a>

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

<a id="d-002"></a>

## D-002 — Tier 4 behavior comes from Radix / Base UI

**Date:** 2026-09-16 · **Status:** accepted

Overlays, menus, combobox, and date picker delegate focus management,
dismissable layers, typeahead, and ARIA wiring to established headless
primitives. We own 100% of markup, class names, and styling.

**Rationale:** writing our own focus traps and layer management is years of
accessibility edge cases already solved upstream. Tiers 1–3 and 5 remain
zero-dependency.

<a id="d-003"></a>

## D-003 — No polymorphic `as` prop

**Date:** 2026-09-16 · **Status:** accepted

Polymorphic components destroy TypeScript inference and produce unreadable
error messages. Where composition genuinely requires changing the rendered
element, use Radix-style `asChild` render delegation.

<a id="d-004"></a>

## D-004 — No `Box`, no `Spacer`

**Date:** 2026-09-16 · **Status:** accepted

`Box` with style props is the mechanism by which sizing and spacing rules
erode. `Spacer` is redundant with `gap`. Space between elements is expressed by
layout primitives; space inside an element is that element's padding.

<a id="d-005"></a>

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

<a id="d-006"></a>

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

<a id="d-007"></a>

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

<a id="d-008"></a>

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

<a id="d-009"></a>

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

<a id="d-010"></a>

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

<a id="d-011"></a>

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

<a id="d-012"></a>

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

<a id="d-013"></a>

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

<a id="d-014"></a>

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

<a id="d-015"></a>

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

<a id="d-016"></a>

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

<a id="d-017"></a>

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

<a id="d-018"></a>

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

<a id="d-019"></a>

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

<a id="d-020"></a>

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

<a id="d-021"></a>

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

<a id="d-022"></a>

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

<a id="d-023"></a>

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

<a id="d-024"></a>

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

<a id="d-025"></a>

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

<a id="d-026"></a>

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

<a id="d-027"></a>

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

<a id="d-028"></a>

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

<a id="d-029"></a>

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

<a id="d-030"></a>

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

<a id="d-031"></a>

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

<a id="d-032"></a>

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

<a id="d-033"></a>

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

<a id="d-034"></a>

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

<a id="d-035"></a>

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

<a id="d-036"></a>

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

<a id="d-037"></a>

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

<a id="d-038"></a>

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

<a id="d-039"></a>

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

<a id="d-040"></a>

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

<a id="d-041"></a>

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

<a id="d-042"></a>

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

<a id="d-043"></a>

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

<a id="d-044"></a>

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

<a id="d-045"></a>

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

<a id="d-046"></a>

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

<a id="d-047"></a>

## D-047 — `Radio` build findings: the group owns the value, and the stylesheet does not

**Date:** 2026-09-19 · **Status:** accepted · **Amends:** RULES §4 (one narrow
deviation); `docs/specs/tier-3c-inputs.md` §3.11 (State, Props — `Radio`)

Five findings. The first two are the same fact reaching the API and the
stylesheet from opposite ends, and both start from something the platform does
that no other control in this tier does.

### 1. A deselected radio is told nothing, so no radio may hold the state

`Checkbox` mirrors the DOM into React state safely because every change to a
checkbox is a change event *on that checkbox*. A radio's **deselection** happens
when a sibling is selected, and fires nothing at all — no event, no callback,
no anything. Per-radio state could therefore only ever be right about selection
and wrong about deselection, which is the one case radios exist for.

So `RadioGroup` holds the value and every `Radio` reads `group.value === value`.

**Consequence, and it narrows the spec's props table: `Radio` has no `checked`
and no `defaultChecked`.** The spec said its rest props were
`ComponentPropsWithoutRef<'input'>` minus `type`; those two are now omitted as
well. One option cannot own the group's selection, and an option that is told it
is checked while the group thinks otherwise is two sources of truth for one
fact — the thing D-036 refused to build into `Field`.

Nothing is lost by it. `RadioGroup`'s `defaultValue` renders a real `checked`
attribute on the server, so a form still works with JavaScript off, which is the
only case a per-option default was for.

### 2. The stylesheet reads `:checked`, not `data-state` — a deviation from RULES §4

RULES §4 says visual state is exposed on the DOM as `data-*` and that our own
CSS styles off those attributes. This component paints from `:checked` instead,
and emits `data-state` for consumers only.

The reason is §1 one level down. React can describe this control's state only
when a `RadioGroup` owns it. A bare `<Radio>` has no owner, and anything the
platform changes behind React's back — a native form reset is the everyday
case — leaves the attribute stale. Painting from a stale or absent attribute is
a box that is wrong on the screen; painting from `:checked` is right in every
case, because `:checked` is not one of our private booleans. It is the
platform's own state, visible to every consumer, and RULES §4's actual target —
"a boolean class that consumers can't see" — is not what this is.

`data-state` is **omitted rather than guessed** when there is no group. Absent
is a fact; wrong is a lie.

**And the state is read on the root with `:has()`, which is the first use of it
in the library.** The dot is the input's *sibling*, so D-045 applies directly: a
custom property is only a channel between two elements when one is an ancestor
of the other. The only element that can declare `--_bg` for the box and `--_dot`
for the dot is the one above both, and `:has()` is what lets that element read a
state living below it. Declaring on the root also keeps D-040 §3's standing
rule: the input's own `:focus-visible` still wins for the input, because a
declaration on an element beats a value it inherited.

**Asserted by the only test that can tell the two mechanisms apart** — a bare
radio, where they diverge. Replacing `:has(.pp-radio__input:checked)` with
`[data-state="checked"]` failed exactly that one assertion and left the other
seventeen green, correctly: inside a group the attribute and the platform agree,
and a test in a group would have passed against the defect.

### 3. A tone-9 dot on the surface is 1.87:1, so the selected radio fills

The spec's State table described the selected radio as a `--pp-tone-solid`
*border* with a visible dot, leaving the box on `--pp-color-bg-surface`. Against
the real tokens that dot is **1.87:1 in the light theme's `warning` tone** —
against a 3:1 requirement for a graphic that carries state, and nothing in
`lint:contrast` would have caught it, because no check in the library pairs a
tone step with the neutral surface.

| Pairing | light `warning` | light `danger` | light `accent` | dark, worst of five |
| --- | --- | --- | --- | --- |
| tone-9 dot on neutral-1 surface | **1.87** | 4.83 | 4.86 | 6.00 |
| tone-on-solid dot on tone-9 fill | ≥ 4.5 | ≥ 4.5 | ≥ 4.5 | ≥ 4.5 |

So the selected radio fills with `--pp-tone-solid` and the dot is
`--pp-tone-on-solid` — the one mark-on-fill pairing the token layer already
verifies, in every hue and both themes, and the same pairing `Checkbox`'s mark
uses. The spec's §3.11 State row is corrected.

**The general point:** the spec chose between two conventional radio designs on
appearance, at a gate where nobody had the numbers. One of them is not
available at AA across a tone set this library lets consumers pick from, and the
way to find that out is to compute it rather than to look at it.

### 4. The change handler's guard was inert

`if (event.target.checked) group?.select(value)` read as a careful check and
guarded nothing: the platform fires `change` only for the radio being selected,
and React reaches the handler from a `click` on that control. Removing the
condition left all 34 unit tests and all 18 browser assertions green, in jsdom
and in Chromium.

Deleted under D-037 §5. Note what this is **not**: D-044 §4 ruled that a green
suite after a *correct* mutation is not evidence of an unmeasured test, and this
mutation is correct. It is a finding about the code, not about the tests — the
line beside it, `if (event.defaultPrevented) return`, was broken in the same way
and failed its test immediately.

### 5. Seventh test that could not fail, and a harness that could not either

**The test.** "Clicking the dot selects the radio beneath it" clicked the centre
of an *unselected* radio — where the dot is `transform: scale(0)` and has a
zero-sized box, so nothing could intercept the pointer there. Deleting
`pointer-events: none` left it green. Rewritten to click a **selected** radio,
where the dot is drawn, and to assert **focus** rather than selection: clicking
a radio that is already selected is a no-op by design, but the dot is a `<span>`
and is not focusable, so if it takes the click focus lands nowhere. That version
fails on the declaration being removed.

**The harness.** Three break-it results in this build were garbage, and the
cause was not the breaks. A `next start` left over from a previous cycle kept
serving HTML that pointed at a chunk filename the new build had already deleted,
so the page loaded with **no stylesheet at all** and every computed colour came
back `transparent` or `rgb(0, 0, 0)`. One of those runs "failed" a `Checkbox`
test that this build never touched, which is what gave it away.

Two rules come out of it, both extending D-037 §4 and D-044 §5:

- **The served-CSS check must be verified in both directions before it is
  trusted.** Two of the patterns used here matched in both the broken and the
  unbroken build — one because the minifier strips the quotes from
  `[data-state="checked"]`, one because it asserted that a rule existed rather
  than that it had moved. A check that cannot report "absent" is not a check.
- **Let the test runner own the server.** Playwright's `webServer` builds and
  starts in one step, so the build under test and the server serving it cannot
  drift apart. A hand-started server that survives a rebuild is not a stale
  stylesheet — it is no stylesheet.

**Sixteen breaks in total**, nine in jsdom and seven in the browser, each
verified present in the served build before its result was read. Fourteen failed
on exactly the test named for them. The other two are §4 and §5 above.

### 6. `ci.yml` gains `workflow_dispatch`, because D-042's last step had no mechanism

The `visual` job authors a missing baseline and pushes it with `GITHUB_TOKEN`,
which by design starts no workflow run. Its own comment states the consequence
and the limit:

> The baselines are therefore authored but not yet COMPARED; the next real push
> verifies them. … it does mean an authoring commit should never be the final
> head of a PR, and nothing here can enforce that.

`radio.png` landed exactly there: authored on the branch, with no run of its own
to compare it. Leaving it as the head means the first comparison happens on
`main` after the merge, which is the shape D-042 was written about — a baseline
whose correctness nobody checked until it was too late to check it cheaply.

Getting a comparison run takes another commit, and the two commits available
were both wrong: an empty one to kick CI is banned outright, and a real one
would have to be invented. `workflow_dispatch` is the third option and the
supported one. It is one line, it is safe against the job's existing gates —
authoring is already conditioned on `github.event_name == 'pull_request'`, and
the `main`-side guard only fires when a baseline is genuinely missing — and it
makes the manual step D-042 accepted ("push once more afterwards") something a
person or an agent can actually perform, once per new component, for the 67
components after this one.

**It does not close the race D-042 declined to close.** Required status checks
are still absent and still collide with `GITHUB_TOKEN` authoring; this adds a
way to run the checks on demand, not a way to require them.

<a id="d-048"></a>

## D-048 — `Switch` build findings: the off state failed the contrast the on state passed

**Date:** 2026-09-19 · **Status:** accepted · **Amends:**
`docs/specs/tier-3c-inputs.md` §3.12 (State, Styling API)

Four findings and one measurement that belongs to the whole library rather than
to this component.

### 1. `--pp-color-border-strong` is 1.97:1, and the spec put the state indicator on it

The spec's State table painted the off track `--pp-color-border-strong` with a
`--pp-color-bg-surface` thumb, and gave a good reason for the fill: "an off
switch has to read as *off* rather than as *disabled*, and a sunken fill next to
a genuinely disabled switch is indistinguishable from it."

The reason survives. The colour does not. Against the real ramp:

| Pairing | light | dark |
| --- | --- | --- |
| track `neutral-8` vs the page | **1.97** | 3.28 |
| surface thumb on a `neutral-8` track | **1.97** | 3.28 |
| **muted thumb on a surface track (shipped)** | **5.10** | **5.49** |
| **on-solid thumb on a tone-solid track (shipped)** | **≥ 4.50** | **≥ 4.50** |

WCAG 1.4.11 asks for 3:1 on "visual information required to identify user
interface components **and states**", and on a switch the thing that says which
way it is set is the thumb. So the part the requirement is most clearly about
was the part that failed, in the theme most people use.

**What ships instead:** the off track is the library's resting control
surface — the same `--pp-color-bg-surface` fill and `--pp-color-border` edge an
unchecked `Checkbox` takes — with the thumb at `--pp-color-text-muted`. On, the
track fills `--pp-tone-solid` and the thumb becomes `--pp-tone-on-solid`. Both
thumb-on-track pairings are ones `check-contrast.mjs` **already asserts**, in
every hue and both themes ("muted text vs page bg" and "solid vs on-solid"), so
this component adds no assertion of its own and depends on none that is missing.
An ink token painting a small solid mark is the precedent `Checkbox`'s mark and
`Radio`'s dot already set.

**The spec's objection is answered rather than overruled.** Off and disabled are
still told apart, and by a stronger signal than a track colour: a live off
switch has a 5.10:1 thumb and a disabled one a 1.77:1 thumb. 1.4.11 exempts
inactive components from the contrast the live one meets, so the two states are
*supposed* to differ exactly there. Asserted in the browser as a comparison
between the two rather than as a number.

**This is D-047 §3 a second time, on a different pairing**: the spec chose
between two conventional designs on appearance, at a gate where nobody had the
numbers, and one of them is not available at AA. Twice is a pattern, and the
rule it generalises to is *compute the pairing before the gate, not after the
build*.

### 2. The library-wide finding underneath it, which is NOT this component's to fix

The table above has a second reading. `--pp-color-border` is **1.55:1** against
the page in the light theme and `--pp-color-border-strong` is 1.97:1 — so the
resting edge of every control in this tier (`Input`, `Textarea`, `Checkbox`,
`Radio`, and this switch's own track) sits below 1.4.11's 3:1.

**Nothing in `check-contrast.mjs` pairs a border step with a surface**, which is
the same missing check class D-047 §3 named and did not add. Its ten `CHECKS`
are all ink-on-fill or the focus ring; a border is neither.

The neutral ramp has nothing between `neutral-8` (1.97) and `neutral-9` (5.90),
and `neutral-9` is `--pp-tone-solid` — the *on* colour. So there is no
arrangement of the existing tokens that gives a conforming resting boundary
while keeping off and on distinguishable in the neutral tone. **The fix is a
token-layer change** (a step, a re-point, or a new semantic name), plus the
missing check, plus a re-baseline of every screenshot in the repository. That is
Tier 0.2 work touching six shipped components, and doing it inside a Switch
build would be exactly the unilateral widening the DoD's "minimal fix" rule
exists to stop.

**Switch is the one control in the tier that does not depend on that edge**,
and it is worth saying why the gap is recorded here rather than inherited. An
unchecked `Checkbox`'s border *is* the information 1.4.11 asks for — take it
away and there is nothing left to see. An off switch has a 5.10:1 thumb sitting
on it, which identifies both the control and its state against the page; the
edge helps and is not what carries the requirement. That is a consequence of
§1's amendment rather than a reason for it.

Recorded here with the numbers so the next person does not have to re-derive
them, and so that "the borders are fine" is not something anyone concludes from
a green `lint:contrast` again.

### 3. It paints from `data-state`, and D-047 §2 does not transfer

`Radio`'s stylesheet reads `:checked` because a radio is deselected when a
sibling is selected and is told nothing, so React cannot describe a bare radio's
state. **Every change to a switch is an event on that switch.** The attribute is
never absent and never guessed, so RULES §4 applies unamended and the deviation
stays where it was earned.

The point worth keeping: D-047 §2 is a ruling about *radios*, not a new house
style for checkable controls. A deviation is scoped to its cause, and the way to
tell is whether the cause is present.

### 4. `translate` is physical, so the thumb is offset instead

A thumb moved with `translate: 20px` travels toward the *right* in every
writing mode. In an RTL layout the track's end is on the left, so the switch
would run backwards — on at the start, off at the end — which RULES §1's "RTL
should work without a single extra line" forbids and which no LTR test can see.

The thumb is `position: relative` with `inset-inline-start`, which is the same
movement expressed on the inline axis and mirrored by the engine. The browser
suite sets `dir="rtl"` on the demo and asserts the thumb crosses to the other
side of the track's centre — the only assertion in the file that can tell the
two mechanisms apart, and it fails when the declaration is swapped back.

### 5. Sixteen breaks, and the eighth assertion that could not fail

Seven source mutations and nine stylesheet mutations, every stylesheet break
verified present in the **served, minified** chunk before its result was read
(D-037 §4), with Playwright's `webServer` owning the build and the server
throughout (D-047 §5). Fifteen failed on exactly the test named for them.

The fifteenth did not, and the test was the defect. "Disabled beats checked"
compared a **disabled on** track with a **live off** track, and those differ
because of `data-state` whatever the disabled rule says — so deleting the whole
`[data-disabled]` block left the assertion green. It now compares a disabled on
switch with a **live on** one, which needed a second demo on the playground page
to compare against, and it fails on its own message when the block is removed.

Eighth time this check has found an assertion that could not fail, and the
pattern is the same one every time: **two things being compared that already
differ for another reason.** D-040 §3 found it in a focus test, D-047 §5 in a
pointer test, and it is worth stating as a thing to look for rather than a thing
to rediscover — when an assertion says "A is not B", ask what else is different
about A and B.

---

<a id="d-049"></a>

## D-049 — `Select` build findings: a disabled placeholder is never the default selection

**Date:** 2026-09-20 · **Status:** accepted · **Amends:**
`docs/specs/tier-3c-inputs.md` §3.13 (Props, State, Styling API)

Six findings. The first is a spec instruction that cannot be carried out as
written, and the second is the deviation it forces.

### 1. "A disabled, hidden, selected-by-default `<option>`" is three attributes of which only two are attributes

The spec's Props table describes `placeholder` as rendering "a disabled, hidden,
selected-by-default `<option value="">`". Two of those three are attributes you
write. The third is not, and the HTML standard actively prevents it: the *ask
for a reset* algorithm sets the selectedness of

> the first `option` element in the element's list of options in tree order
> **that is not disabled**

So a disabled placeholder is skipped and the browser selects the option after
it. The control renders looking correct — there is a value in the box — and it
is the wrong one, chosen by nobody, with no error anywhere. In plain HTML the
usual fix is a literal `selected` attribute, which is not available here:
React warns on `selected` and wants `value` / `defaultValue` on the `<select>`.

**What ships:** the component seeds `defaultValue=""` when the caller has given
neither `value` nor `defaultValue`. That routes through the `value` **setter**,
whose definition has no disabled exclusion — it selects the first option whose
value matches, full stop — so the placeholder is selected *and* unreachable
afterwards, which is what the spec wanted. A caller who gives either prop keeps
it; React errors on a `<select>` carrying both, so the seed has to be
conditional rather than a default.

**The same bug has a second door, and it was open.** `value` and `defaultValue`
originally reached the element through the prop spread, which is written after
the seed and therefore wins. `<Select placeholder="…" defaultValue={maybeUndefined} />`
is an ordinary thing to write — an optional initial value — and there the key
*exists* with the value `undefined`, so the spread overwrote the seed with
`undefined` and handed the caller option two again. Both props are now
destructured out and written back below the spread, where nothing can undo
them. The guard that decides the seed and the guard that applies it have to
read the same thing, and "absent" and "present and undefined" are not the same
thing to a spread.

The finding generalises past this component: **a spec sentence that mixes
attributes with behaviour is worth re-reading as a list of things that must
each be made true.** "Disabled" and "hidden" were free; "selected by default"
was the work, twice.

### 2. It paints the placeholder from `:checked`, and D-047 §2's shape transfers where D-048 §3's reasoning says it should

`Radio` reads `:checked` in CSS because a radio's *deselection* fires nothing,
so React cannot describe a bare radio's state. `Switch` does not, because every
change to a switch is an event on that switch. D-048 §3 drew the rule from the
pair: **a deviation is scoped to its cause, and the way to tell is whether the
cause is present.**

Here a different cause is present, and it is spec §2's own ruling. The text
controls hold no state and pass `value` straight to the DOM, so an uncontrolled
`Select`'s selection lives in the DOM and changes without this render being
told. Three cases make a React-side mirror wrong rather than merely stale:

| | fires a React change event |
| --- | --- |
| the user picks an option | yes |
| `form.reset()` | **no** |
| `ref.current.value = …` | **no** |

An attribute written from the initial value is right until the first of those
and wrong afterwards — and the second and third are the ones a consumer is least
likely to suspect. So:

- **The stylesheet paints from `:has(option[data-pp-placeholder]:checked)`**,
  the platform's own state, which is correct in all three rows.
- **`data-placeholder` is emitted only when the select is controlled**, where
  React genuinely knows, and **omitted rather than guessed** otherwise. That is
  D-047 §2's second half applied unchanged.

`[data-pp-placeholder]` rather than `[value=""]`, because a caller's own
`<option value="">None</option>` is a real choice and must not be painted as an
absent one. The marker is on the option we render and nothing else.

Proved by the only demo that can tell the two mechanisms apart: an uncontrolled
select whose text is muted while its root carries no attribute at all. Swapping
the `:has()` rule for `.pp-select[data-placeholder] .pp-select__input` fails
exactly those two assertions and leaves the other eighteen green.

### 3. The chevron's colour was computed at the gate, and the border gap under it is D-048 §2's, not a new one

D-048 §1 ended with *compute the pairing before the gate, not after the build*.
This is the first component to run that way, and the numbers came out before a
line of CSS existed:

| Pairing | light | dark | needs |
| --- | --- | --- | --- |
| **chevron `--pp-color-text-muted` on the surface** | **5.10** | **5.12** | 3.0 |
| placeholder text, same pairing | 5.10 | 5.12 | 4.5 |
| value text `--pp-color-text` on the surface | 15.73 | 14.32 | 4.5 |
| `--pp-color-border` on the surface | 1.55 | 2.12 | 3.0 |
| disabled text/chevron on the sunken fill | 1.77 | 3.28 | exempt |

The chevron is the one new pairing, and it matters more here than a decorative
glyph would: `appearance: none` takes the platform's own arrow away, so ours is
the graphic that identifies the control as a select rather than a text field —
squarely what WCAG 1.4.11 asks 3:1 of. `--pp-color-text-muted` on
`--pp-color-bg-surface` is a pairing `check-contrast.mjs` **already asserts**
in both themes ("muted text vs page bg" and "muted text vs subtle bg"), so this
component adds no assertion and leans on none that is missing.

Row four is **D-048 §2's library-wide gap, inherited rather than introduced**:
the resting edge of every control in 3C is below 3:1 in the light theme, the
neutral ramp has nothing between `neutral-8` (1.97) and `neutral-9` (5.90), and
the fix is a token-layer change plus the missing border-vs-surface check plus a
re-baseline of every screenshot. `Select` changes neither the token nor the
check, and recording the number again here is so that a green `lint:contrast`
on this component is not read as the gap having closed. With 3C now complete,
that work has no component left to widen.

Row five is exempt under 1.4.11's inactive-component clause, the same way every
other disabled control in this tier is.

### 4. No `readOnly`, and that is HTML's ruling rather than ours

`Input` has a read-only state and the spec's State table for this component says
the shared states behave "as `Input`". There is no read-only here, because
**HTML has no `readonly` for `<select>`** — the attribute is not in the
element's content model and does nothing. The two usual fakes both fail: a
`pointer-events` block leaves the control fully operable from the keyboard, and
`disabled` alone drops the value from the submitted form. A value the user may
read but not change is a `disabled` select plus a hidden input, which is the
caller's composition, not a prop.

Stated because the absence otherwise reads as an oversight in a tier where five
of six controls have the state.

### 5. Ninth assertion that could not fail, and the same shape as the other eight

Seventeen deliberate breaks — seven in the source, ten in the stylesheet, every
stylesheet break verified present in the **served, minified** chunk before its
result was read (D-037 §4), with Playwright's `webServer` owning the build and
the server throughout (D-047 §5). Sixteen failed on the test named for them,
one of them §1's second door: restoring the spread order failed both
placeholder-selection assertions, which is what found it.

The one that did not was the RTL test, and the test was the defect. It asserted
which side of the control's centre the chevron sat on and called that proof of
`inset-inline-end` over `right` — but which side is `place-self: center end`'s
doing, and the grid mirrors that by itself. Swapping the declaration left the
chevron on the correct side in RTL and every assertion green.

What the offset actually decides is the direction the glyph is pulled back in:
in RTL the box's inline end is its *left* edge, so `right` pulls the chevron
further left, clean off the control, while `inset-inline-end` pulls it inward by
the same distance the LTR layout gets. The test now measures the inset from the
inline-end edge and requires it equal in both directions — and it keeps the
side-of-centre check, because that one does fail if `place-self` changes, so the
comment now claims what each half asserts rather than both claiming the same
thing.

Same shape as the eight before it (D-040 §3, D-047 §5, D-048 §5): **two things
compared that already differ for another reason.** Here the second reason was a
property nobody had thought to name.

### 6. A Playwright section filter is a case-insensitive substring, and a wrong match waits out the clock

The browser suite locates a matrix cell with
`page.locator('section', { hasText: 'Disabled' })`. `hasText` with a string
matches **case-insensitively**, and the section above it on the page says "the
placeholder is disabled, hidden" — so the filter resolved to the wrong section,
the selector inside it matched nothing, and the test failed on a 30-second
timeout rather than on its message.

A locator that finds nothing reports the same way whether the component is
broken or the filter is: a wall of retry logging and no assertion. **Filter on a
phrase that appears once**, and prefer one from the section's own argument over
one from its heading, since a heading is the sentence most likely to be echoed
elsewhere on the page. The section's `hasText` is `'no read-only'` now.

---

<a id="d-050"></a>

## D-050 — A control's boundary is a solved token, not a ramp step

**Date:** 2026-09-20 · **Status:** accepted · **Amends:** `docs/RULES.md` §3
(a new bullet); `src/styles/tokens/*` (generated); `Spinner`, `Skeleton`, and
the disabled state of every control in Tier 3. **Closes:** D-048 §2.

`--pp-color-border` was ramp step 7 and measured **1.55:1** against the page in
the light theme. WCAG 1.4.11 asks 3:1 of "visual information required to
identify user interface components", and in the light theme
`--pp-color-bg-surface` **is** `--pp-color-bg-page` — both `neutral-1` — so a
text field's fill is literally the page and the border is the only thing that
identifies it. Every control in Tiers 3A–3C shipped below the floor.

### 1. It could not be fixed inside the ramp, and the generator says why

Steps 1–8 are a fixed, monotonic lightness ramp; only `focus`, 9, 11 and 12 are
solved. Solving a neutral border for 3:1 in the light theme lands at **L 0.633**
— *below* step 8's fixed **L 0.780**. Substituting it at position 7 inverts the
ramp and trips the generator's own `assertMonotonic`, so there is no
re-pointing of existing steps that works. That is D-048 §2's "no arrangement of
the existing tokens fixes it", with the specific reason.

The generator had already ruled on this shape, in its own words:

> *Focus ring — its own token, not step 8. Hanging the 3:1 UI-contrast
> requirement on a ramp step tears a hole in the ramp.*

So two **off-ramp** solved primitives join `-focus`, `-on-solid` and
`-solid-active`, one pair per hue per theme. **The 1–8 ramp is untouched.**

| | light | dark | solved against |
| --- | --- | --- | --- |
| `--pp-palette-<hue>-edge` | L 0.633 | L 0.536 | ≥ 3:1 on steps 1, 2 **and** 3 |
| `--pp-palette-<hue>-edge-strong` | L 0.534 | L 0.635 | ≥ 4.5:1 on the same three |

Solved against all three surfaces rather than the hardest one today, because a
border has two sides and the semantic layer puts a different neutral step on
them per theme — page (1), surface (1 light / 2 dark), sunken (3 light / 1
dark), raised (1 light / 3 dark). Solving against only the current worst case
would go quietly wrong the first time `bg-surface` is re-pointed. The surfaces
are always neutral, even for a toned border: a danger-toned input sits on the
page, not on a red one.

`direction` keeps as much of the old ramp's lightness as the target allows, so
the edge is the least-dark conforming colour rather than the darkest the search
range permits.

### 2. The semantic names carry the split, and no fourth name was added

`--pp-color-border` was **already** the control-edge token in practice — seven
of its nine uses were control boundaries — and `--pp-color-border-subtle` was
already the decorative one. So the existing names were re-pointed rather than
joined by a `--pp-color-border-interactive`:

| token | before | after | obligation |
| --- | --- | --- | --- |
| `--pp-color-border-subtle` | `neutral-6` | `neutral-6` | **none** — dividers, skeletons |
| `--pp-color-border` | `neutral-7` | `neutral-edge` | **≥ 3:1** |
| `--pp-color-border-strong` | `neutral-8` | `neutral-edge-strong` | **≥ 4.5:1** |

…and the same three for `--pp-tone-border-*` in all five hues.

**A fourth name was rejected**, and the reason is the failure mode rather than
the tidiness: two tokens that sound alike, where one conforms and one does not,
make every future component a silent coin-flip. Re-pointing makes the
conforming value the *default* and leaves `-subtle` as the explicit opt-out for
decoration. RULES §3 now states which is which, because it is no longer a
matter of taste.

**`border-strong` had to move too, or the names would invert.** A conforming
`border` at 3.40:1 beside a step-8 `border-strong` at 1.97:1 makes "strong" the
weaker of the two, and `Toggle`'s hover — which steps from one to the other —
would *lighten* on hover. The generator now asserts `edge-strong` beats `edge`
against every surface rather than trusting the targets to imply it.

### 3. The check that was missing, and the half of it that was missing too

D-048 §2 named the gap: "nothing in `check-contrast.mjs` pairs a border step
with a surface". Six pairings are added — edge and edge-strong against steps 1,
2 and 3 — taking the file from 170 assertions to 242.

Run against the steps `--pp-color-border` resolved to *before* the fix, those
six report **1.40 – 2.04:1** across every hue and both themes. The check was
written first and watched go red on the real numbers, which is D-035 §3's rule
applied at the token layer: a missing check class reads exactly like a passing
one, and the only way to tell them apart is to make it fail.

**The second half is new and is the one that would have caught the gap from the
other direction.** Everything in that file verifies `primitives.css`, and
components never name a primitive (RULES §3) — they read `--pp-color-border`,
which is a *mapping* in `semantic.css` that the checker could not see. Re-point
the mapping back at a ramp step and all 230 value assertions stay green while
every control returns to 1.55:1. So the mapping is now asserted by name, for
all four tokens across five hues. Verified by re-pointing `--pp-tone-border` at
step 7 and watching five assertions fail.

### 4. Four components opted out, each measured rather than assumed

Re-pointing a token changes everything that reads it, so every non-control user
was checked rather than left to inherit a decision made for controls.

- **`Spinner`** → `--pp-tone-border-subtle`. The track went 1.55 → 3.40:1,
  which puts it within a hair of the arc drawn over it: the component reads as
  a ring with a slightly darker segment rather than as an arc going round. A
  track is decoration behind a mark.
- **`Skeleton`** → **kept, after the fix was built and rejected on sight.** Its
  dark highlight reads `--pp-color-border`, so the sweep went from 1.30:1 to
  **2.09:1** against the light theme's 1.24:1, and the obvious move was to put
  both ends on decorative steps that swap roles per theme. That was written,
  and it brought the sweep back to 1.46:1 — and left the dark bars barely
  distinguishable from the surface, which is precisely what the file's own
  comment had recorded years of nobody reading it ago: *"bg-sunken on a surface
  was barely visible in light mode"*. **The right number, optimised against the
  wrong constraint.** Shimmer symmetry between themes is not what governs
  whether the component reads; the base's legibility is, and nothing requires a
  decorative sweep to hit a ratio at all. Reverted, with the asymmetry recorded
  where the next person will find it.

  The general point is the one D-047 §3 and D-048 §1 make from the other
  direction. Those computed a pairing too late; this computed one on time and
  then optimised it without asking what it governed. **A measurement is only
  useful once you have said what decision it is allowed to make** — and the way
  to tell is to build the thing and look at it.
- **`Badge` outline** → kept. 1.55 → 3.40:1 makes an outline badge that was
  nearly invisible in the light theme actually visible, and it is what now
  distinguishes `outline` from `subtle`. A look change, chosen rather than
  inherited.
- **`Kbd`** → kept. A keycap with a legible edge is more keycap-like, not less.

**And every disabled control dropped to `--pp-color-border-subtle`.** This is
not tidying: 1.4.11 exempts inactive components, and leaving a disabled control
on the same edge as a live one erases the difference the exemption exists to
allow — the same difference D-048 §1 relied on to tell an off switch from a
disabled one. `Button` already did this for its disabled `outline` variant;
`Input`, `Textarea`, `Select`, `Checkbox`, `Radio` and `Switch` now match it.
The precedent existed and only one component was following it.

### 5. Re-baselining 33 screenshots is a window in which nothing is verified

A token change alters every pixel of every page, so all 34 baselines are deleted
and CI **authors** the replacements (D-013, D-042) with nothing to compare
against. For that one commit the visual suite verifies nothing, and a layout
regression riding along with the colour change would be committed as the new
truth, silently.

Three things stand in for it:

1. **The 128 functional browser assertions are not baseline-based** and all
   pass. They cover heights, fill ratios, insets and overflow directly.
2. **`lint:css` forbids a colour token in a length position**, so a
   colour-only change structurally cannot move a box.
3. **`tests/visual/__screenshots__/dimensions.json`**, recorded *before* the
   deletion (including `select.png`, which merged to `main` as #19 while this
   was in flight and had to be deleted with the rest), plus a unit test asserting every authored baseline matches the
   geometry that existed beforehand. A pure colour change moves no pixel
   boundary; if a page got taller, something other than colour moved.

The third is redundant with `toHaveScreenshot` whenever baselines exist — it
reports a size mismatch clearly on its own. Its entire value is in windows like
this one, and those recur with every re-baseline, which is why it is committed
rather than run once and thrown away.

**It fired on its first real use, and the answer was worth the trouble.** Of the
34 baselines CI authored, 33 were pixel-identical in geometry and one was not:
`input.png` came back **51px taller**. That is the shape of a layout regression
hiding in a colour change, which is the exact thing this guard exists to refuse
to wave through.

It was not one. The input playground page's disabled/read-only paragraph is two
lines longer in this diff, because §4 changed what that paragraph has to say.
Proven rather than assumed, by rendering the page with the new prose and with
the old one: **5090 against 5039 — 51px, to the pixel.** (The absolute heights
differ from CI's 5118 and 5067 because glyph rasterisation differs between
machines, which is why D-013 makes baselines CI's to author. The *delta* is
identical in both places, which is the number the guard is actually about.)

The manifest entry was then updated deliberately, which is the path the test's
own comment describes. **The tension is real and worth naming:** the guard
cannot tell "this page's content changed on purpose" from "this page's layout
regressed", and neither can a screenshot baseline — so it adds a second thing to
remember whenever a page changes height. It earns that by being the only thing
in the repository that can say no during an authoring window, and by making the
answer here a measurement instead of a shrug.

### 6. A generated file claimed a guarantee that nothing produced and nothing checked

`primitives.css`'s header described its own ramp as:

> `6-7   borders: subtle, interactive`
> `8     strong border and focus ring   (>= 3:1 on step 1)`

Step 8 is a fixed lightness at **1.97:1** on step 1, and the focus ring had
already been moved to its own solved token *precisely because step 8 could not
carry the requirement* — the generator says so twelve lines further up. So the
header asserted a contrast guarantee that was wrong by a third, about a token
that was no longer the focus ring, in the file every future token decision
starts from.

Nothing read it and nothing checked it, which is what let it survive from Tier 0
through nine components. It is the D-045 class — prose disagreeing with code —
in the one place where the prose is the specification. The header now says which
steps carry an obligation and which explicitly do not, and the obligations it
names are the ones `check-contrast.mjs` asserts.

<a id="d-051"></a>

## D-051 — `NumberInput` build findings: the structure Select had already solved, and a keypad with no minus key

**Date:** 2026-09-21 · **Status:** accepted · **Amends:** `tier-3d-composite.md`
§5, §8, §9, §3.14; Definition of Done (§5)

### 1. The empty value had to be `null`, and the type is what enforces it

Spec §2 ruled it and the build confirmed the mechanism is real rather than
theoretical. `useControllableState` (D-032) reads `value !== undefined` as
"controlled", so `value={undefined}` cannot also mean "empty" — an empty
controlled field spelled that way silently becomes uncontrolled, and the
component stops answering to its owner with no error.

D-032 already warns about this at runtime. The finding worth recording is that
**the type removes the need for the warning**: with `value?: number | null`,
`value={form.quantity}` on an optional field is a compile error at the call
site, which is the same bug caught a build earlier and without a console.

### 2. The spec's `inputMode` rule was wrong in the direction it was warning about

§5 improved on 3C §13.5's fixed `inputMode="numeric"` by deriving it, and the
derivation it wrote down was:

```
Number.isInteger(step) && (min === undefined || min >= 0)   // ✗
```

That makes an **unbounded** integer field `numeric`. An unbounded field accepts
negatives, and the iOS numeric keypad has no minus key — so the one field that
most needs a sign is the one the rule hands a keypad that cannot produce it.
The paragraph immediately above it makes exactly this argument about the decimal
separator and then fails to apply it to the sign.

Shipped as `Number.isInteger(step) && min !== undefined && min >= 0`: `numeric`
is claimed only when a bound says the value cannot be negative.

**The general shape:** a condition written as a list of exemptions (`undefined
|| >= 0`) reads as generous and is actually a claim. "Unknown" and "known to be
non-negative" are not the same case, and `||` had quietly merged them.

### 3. The surface belongs on the control, and Select had already said so

Spec §9's headline claim was that `NumberInput` *inverts* the control surface:
the steppers sit inside the box, therefore the border, the fill and the radius
move to the wrapper, the `<input>` goes transparent, and the focus ring is drawn
on the root with `:has(.pp-number-input__control:focus-visible)`.

Built that way, **the control rendered with two concentric focus rings.**
`reset.css` declares `:where(:focus-visible) { outline: … }` on every focusable
element, so the inner input took a ring of its own inside the one on the root.
No unit test could see it: jsdom implements neither `:has()` nor the cascade
that produces the second outline. It was found by a browser assertion written
to check the ring was on the root, which reported the root's ring correctly and
the input's ring as a surprise.

The only way to keep the inverted structure was `outline-width: 0` on the inner
input — legal, because the stylelint ban covers the `outline` **shorthand** at
`none | 0` and the raw-unit rule only catches `outline-width` with a unit. That
is **D-025's shape for the third time**: a ban expressed at the property level
hiding the absence of one at the value level, reachable as soon as a component
has a reason to go there.

**So the structure was replaced rather than the ban worked around.** `Select`
(3.13) had already solved "a control with something at its inline end": one grid
cell, the control in it carrying the surface and reserving room with
`padding-inline-end`, and the thing at the end placed over that room.
`NumberInput` is that, with two buttons instead of one chevron and
`pointer-events: auto` on them where the chevron took `none`.

The ring is then the control's own, it surrounds exactly the box the user sees,
the steppers are inside it, and nothing in this component has to undo anything
in the reset.

**§9's conclusion survived and its reasoning did not.** A shared `.pp-control`
base class is still rejected — because the four surfaces differ in what each
reserves at its inline end, which is the reason 3C §1 itself gave — not because
this one inverts. The lesson is narrower than "look before you specify": the
spec reached for a novel mechanism (`:has()` on a wrapper) for a problem the
previous component in the same tier had a working answer to, and the novelty is
what carried the defect. **Check whether the last component solved it before
deciding that this one is different.**

A consequence worth keeping: the stepper is square at `calc(height / 2)`, which
is 16 / 20 / 24 — the checkable three's scale from D-039 §8, arrived at by
construction rather than by being written down a second time.

### 4. A browser assertion that cannot run is worse than none

Spec §8 said the Slider vendor-pseudo-element duplication would be guarded by
reading "the thumb's computed size at `md` … in both Chromium and Firefox
projects". `playwright.config.ts` defines **one** project, chromium, and this
environment ships one browser. The assertion as specified could never have run,
and a test that silently does not exist reads exactly like a test that passes.

Replaced with a **source rule** in `lint:rules`: no selector list in component
CSS may mix a `-webkit-` and a `-moz-` pseudo-element. That is a static check of
the precise failure mode — an unknown pseudo-element invalidates the entire
selector list in the engine that does not know it — it runs everywhere, and it
gets a fixture in the linter's own self-test (D-009). Landing with `Slider`.

**The rule of thumb this yields:** before a spec promises a guard, name the
mechanism that runs it. "Asserted in both engines" was a sentence, not a plan.

### 5. One Definition of Done line is attested by reasoning, not by evidence

§5 took `role="spinbutton"` knowingly — it replaces the implicit `textbox` role,
and some screen reader / browser pairs announce character-by-character editing
less well in a spinbutton. Open question 2 said the decision should be made from
a VoiceOver/NVDA walkthrough rather than from the paragraph arguing for it.

**No screen reader is available in this environment, so that walkthrough has not
happened.** The Definition of Done's "keyboard interaction … walkthrough
recorded in the spec" is recorded; the *screen-reader* half of §5's stated cost
is not measured. It is written here rather than ticked, because the difference
between "checked" and "argued for" is the whole reason the checklist exists.

What was checked in a real browser: the computed role, the accessible name, the
presence of `aria-valuemin` / `aria-valuemax` only when bounded, and the absence
of `aria-valuenow` while the box holds no number.

### 6. Three test bugs, and two of them were assertions that could not fail

The browser suite failed five of nine on its first run. One was the defect in §3
above. The other four were the tests:

- **The height comparison took `.first()`** on each page and compared an `sm`
  `Input` with an `md` `NumberInput`, reporting 32-vs-40 as a violation of the
  D-028 agreement it was written to protect. Now selects `[data-size="md"]` on
  both sides.
- **The border assertion read `borderTopColor` from the wrapper**, which after
  §3 has no border — so it returned `currentColor` and reported "unchanged on
  focus" for a border that was shifting correctly one node down. **An assertion
  pointed at the wrong element is D-035 §3's failure in the other direction:**
  it cannot fail for the right reason, and it happened to fail for the wrong
  one only because the structure changed underneath it.
- **The invalid-tone assertion claimed the colour was unchanged on focus.** The
  contract (D-039 §4) is that the *tone* is unchanged — `--pp-tone-border` to
  `--pp-tone-focus` is a different step in the same ramp. Now asserts that a
  focused invalid control does not look like a focused valid one.
- **The fill assertion measured against `.matrix__viewport`'s `clientWidth`**,
  which excludes a border and **keeps padding** — so the harness's own 12px
  inline padding read as a component that filled 214 of 238. Now measures the
  parent's content box, and additionally asserts the three cells produce three
  different widths, so it cannot pass on a control that ignores its container.

Two of the four would have passed forever against a correct component and a
wrong reference. The standing lesson from D-035 §3 is "break it and watch the
test fail"; this adds the mirror — **when a test fails, establish which of the
two is wrong before changing either.** Here the score was one component defect
to four test defects.

<a id="d-052"></a>

## D-052 — `Slider` build findings: the gradient that was never written, and a flake the reset had been hiding

**Date:** 2026-09-21 · **Status:** accepted · **Amends:** `tier-3d-composite.md`
§8, §3.15; Tier 0.7 lint (rule 6); `ROADMAP.md` (3.17)

### 1. The track is ours and the thumb is the platform's, and that split deleted most of §8

Spec §8 was written expecting the filled portion of the track to be a
`linear-gradient` on the native track pseudo-element. Three problems, all
visible before a line was written:

- `linear-gradient(to right, …)` is **physical**. A native range input reverses
  in an RTL layout — the value increases leftward — so the fill would run from
  the wrong end, in the one place the component otherwise gets RTL for free.
- It would have to be **written twice**, because
  `::-webkit-slider-runnable-track` and `::-moz-range-track` cannot share a
  selector list.
- Firefox has `::-moz-range-progress` and paints the filled portion itself, so
  there would be a third treatment of the same idea in one engine only.

**So the track and the fill are two spans of ours in the root's grid cell, and
the fill is a grid COLUMN sized by the percentage.** Grid columns follow the
inline axis, so RTL is correct with nothing declared about direction, and the
gradient is written zero times instead of twice.

What is left of the vendor surface is the thumb, plus making the native track
invisible so ours shows through. §8's duplication ruling still governs those
and is still right; it simply governs a third of what it was written for.

Two consequences worth keeping:

- **The thumb is centred without a negative margin**, which RULES §2 forbids
  outright. WebKit aligns the thumb to the *top* of the native track box, so
  every recipe on the internet reaches for a negative `margin-block-start`.
  Giving that box the thumb's own block size centres it with no margin at all.
- **The fill and the thumb disagree by up to the thumb's radius**, because the
  fill is a percentage of the whole track and the thumb travels a track shorter
  by its own width. The error is `(0.5 - p) × thumb`, largest at p = 0 and p = 1
  where the fill is empty or complete, so the seam is always underneath the
  thumb. Left as is, deliberately: insetting the track by half a thumb makes the
  line stop short of the control's edges, and every native slider spans the full
  width and insets only the thumb.

### 2. `page.mouse` takes viewport coordinates and does not scroll

Two browser assertions — a click on the track, and a drag that should commit
once — reported the component as inert. `locator.click()` scrolls the element
into view first; the raw `page.mouse` API does not, and `boundingBox()` on an
element 6,000px down a playground page returns a y that is simply off-screen.
The clicks landed on nothing.

The component was correct throughout: the same click, after
`scrollIntoViewIfNeeded()`, moves the value from 5 to 9. Filed as a finding
rather than a fixed typo because the failure reads exactly like a real defect —
"clicking the track does nothing" is the first thing anyone would believe about
a slider whose native input might be covered.

### 3. The reset's reduced-motion crush is a transition, and a same-frame read loses the race

The focus-ring assertion failed with `:focus-visible` matching, `outline-style:
solid`, and `outline-width: 0px` — a combination that should be impossible.

`reset.css` crushes transitions under `prefers-reduced-motion` to
`all 0.00001s` rather than removing them, and `playwright.config.ts` pins
`reducedMotion: 'reduce'` for every run. **Ten microseconds is still a
transition**, so `outline-width` is briefly its previous value, and a
`getComputedStyle` in the same frame reads the *old* number. Measured: 0px
immediately after `focus()`, 2px fifty milliseconds later.

It only reproduced once an unrelated `scrollIntoViewIfNeeded()` shifted the
timing by a frame — which is what a latent flake looks like from outside: green
for weeks, then red on a change that had nothing to do with it.

**Every one-shot `getComputedStyle` read immediately after a state change in
this suite is exposed to this.** The four added in D-051 and this entry are now
`expect.poll`, which retries. The pre-existing ones were left alone rather than
rewritten blind; they are named here so the next person who sees an
impossible-looking computed value knows where to look first.

A narrower lesson than "tests are flaky": **a duration crushed to almost zero is
not the same as no transition**, and the difference is invisible until something
reads a computed value synchronously.

### 4. A third assertion that could not fail, found by breaking the thing it named

`the thumb is centred on the track it draws` compared the control's centre with
the track span's. Both are ours; neither involves the thumb. The deliberate
break that should have caught it — `block-size: var(--_track-size)` on
`::-webkit-slider-runnable-track`, which drops the thumb off the line — left the
test green.

**The thumb's box is not observable from script.** Chromium's
`getComputedStyle(el, '::-webkit-slider-thumb')` returns the HOST element's
metrics (measured: 40 × 1200, which is the input's own box), and no layout API
reaches a UA-painted pseudo-element. There is no PNG decoder in the dependency
tree either, so a pixel probe is not available.

So the test was **renamed and scoped to the half it can check** — the line is
centred on the control — and thumb centring is covered by the screenshot
baseline, with the break that would catch it recorded in the test's own comment.
Scoping an assertion to what it actually proves is the honest repair; leaving
the name would have been the D-045 class of bug inside a test.

That is the third assertion in two components (D-051 §6 had two) found by
running the break rather than by review. The break check is not a formality.

### 5. `RangeSlider` is now a roadmap item, with its blockers written down

Spec §7 deferred the two-thumb case and said it should become its own item. It
is **3.17**, `planned`, and its Notes cell names both unsolved problems so the
deferral does not have to be rediscovered: two overlapping inputs each draw
`:focus-visible` across the whole track, and moving the ring onto the thumb
pseudo-element requires `outline: none`, which Tier 0.7 bans and D-029 banned on
purpose; and the `pointer-events` layering that makes both thumbs draggable is
what takes a track click away.

The tracked-item denominator moves from **78 to 79**.

---

<a id="d-053"></a>

## D-053 — `Alert` build findings: the first surface that is not the page, and the ring nobody had measured off it

**Date:** 2026-09-21 · **Status:** accepted · **Amends:** `docs/specs/Alert.md`
§Anatomy, §Container behavior; `ROADMAP.md` (5.2 `Deps`)

Tier 5's first component, and the first in the library whose own surface is a
tinted step 3 with other people's controls sitting on it. That one structural
fact produced most of what follows.

### 1. A variant table was rejected on measurement, and the measurement was taken at the gate

`Badge` and `Button` share a four-variant table and reusing it a third time was
the obvious move. `Alert` takes none, and the argument is numbers.

**An `Alert` is the only component in the library whose children are
arbitrary.** A `Badge` holds a word; a `Button` holds a label; an `Alert` holds
whatever the caller writes, which in practice is prose with a `Link` in it and
a `Cluster` of `Button`s under it. The tone context (D-007) inherits into all
of it. So the question is not how the box should look but what each box does to
the controls inside it:

| Rejected | Measured |
| --- | --- |
| `solid` (`--pp-tone-solid` fill) | `--pp-tone-text` — what a `plain` `Button` and a `Link` resolve to inside the inherited context — is **1.04–1.16:1** light, **1.10–1.46:1** dark. Not low contrast: invisible |
| `plain` (no fill, no border) | `--pp-tone-bg` against the page is **1.10–1.12:1** light, **1.19–1.20:1** dark. Without the edge there is no block, only slightly tinted prose |
| `outline` (no fill) | Nothing carries the tone at a glance, which is the tone's only job |

One treatment ships: the tint **and** the edge, with `tone` the only axis. The
precedent is D-030 §6, where `Link` was given neither `variant` nor `size` — a
fixed vocabulary says what a prop must be *called* when it exists, not that
every component must have one.

This is D-048 §1's rule finally applied on the first try: the pairing computed
before the build rather than discovered after it. Every pairing the component
introduces is one `lint:contrast` already asserts, and the fill is
`--pp-tone-bg` (step 3) rather than `--pp-tone-surface` (step 2) **because**
step 3 is the step those checks are named after.

### 2. The focus ring has only ever been verified against the page

`--pp-color-focus-ring` is one colour library-wide (D-029) and
`check-contrast.mjs` asserts exactly one pairing for it — against `neutral-1`,
where it is 3.06:1. Against the surfaces that actually exist:

| Ring against | Light | Dark |
| --- | --- | --- |
| `neutral-1` (page) — the asserted pairing | 3.06 | 3.06 |
| `neutral-2` (`--pp-color-bg-surface`) — already shipping | 2.94 | 2.85 |
| `<hue>-3` (`Alert`'s fill) | **2.74–2.77** | **2.54–2.57** |

Against 1.4.11's 3:1. `Button.css`'s header already recorded that the five
`--pp-tone-focus` values "are asserted against nothing"; the half nobody had
noticed is that the ring that *is* asserted is asserted against one background
out of three, and that `bg-surface` was already below the line before this
component existed.

**Recorded and deliberately not fixed here**, which is D-048 §2's shape with
the timing corrected — measured before the build rather than after. It cannot
be fixed inside a component: overriding `--pp-color-focus-ring` inside
`.pp-alert` would put a second, unverified ring colour in the library, which is
the one thing D-029 exists to prevent. It goes on the roadmap as its own item,
**0.11**, with the two missing checks (`focus vs 2`, `focus vs 3`) landing
beside the token change so the fix and the assertion arrive together — the
D-050 pattern.

**One sentence of this section was wrong and is corrected by D-055.** It said
the ring's value was "identical in both themes", and concluded from that that
the fix needed a per-theme or two-tone ring plus a re-baseline of all 35
screenshots. The ring has been per theme since 0.2 — light L 66.18%, dark
L 49.70% — and the sizing of the work that followed from the error was wrong in
the same direction. The measurements in the table above are unaffected; they
were taken from the parsed theme blocks, which were right. The claim about the
*cause* came from reading a grep, and that is the difference between the two.

### 3. The root is flex, not the three-column grid the spec drew

Spec §Anatomy specified `grid-template-columns: auto minmax(0, 1fr) auto` with
the parts placed in those columns. Built that way, **an alert with no icon
starts 12px in from its own padding edge** — `--pp-alert-gap`, paid for the
empty track it left behind. A grid gaps between *tracks*; whether anything is
in them is not part of the question.

Flex gaps only between items that exist, so an absent slot costs nothing, and
the arrangement needs no explicit placement and no `:has()`. Measured both
ways: the faithful grid returns 12px where the flex row returns 0, and the
alert that *does* have an icon is inset by exactly the icon plus the gap —
which is what says the measurement is reading the right thing rather than
reading zero for a different reason.

**The generalisation:** a layout whose parts are optional wants a container
that spaces *items*, not one that reserves *tracks*.

### 4. `min-inline-size: 0` sizes the box and nothing else

The browser suite's first run failed one of six. The box measurement beside it
— the alert's width against its parent's — passed, and the playground harness
flagged four of six cells as overflowing.

Both were right. `min-inline-size: 0` lets the flex item shrink below its
automatic minimum, so the alert's own **edges** stayed inside its parent; the
**glyphs** of an unbreakable URL went on painting past them. The two are
separate guarantees and the spec's §Container behavior had treated them as one,
claiming the declaration made the arrangement "true for an unbreakable string
rather than merely true for prose".

`overflow-wrap: anywhere` on the root is what makes it true — `anywhere` rather
than `break-word` because it also shrinks the min-content size, and inherited,
so the title is covered by the same declaration. `Badge` and `Button` do the
opposite (`white-space: nowrap`) and are right to: they hug their own content.
This one fills a column and holds someone else's prose.

D-051 §6's mirror, exercised: **when a test fails, establish which of the two is
wrong before changing either.** Here the component was.

### 5. Seventeen breaks, and the two that taught something

Eleven source breaks and six CSS breaks. Fifteen failed on exactly the test
named for them. The other two:

**An assertion pointed at the one hue where its two colours are the same.**
"The focus ring inside an alert is the one library-wide ring" read
`.pp-alert__dismiss` with `.first()`, which is the page's `accent` alert — and
`--pp-tone-focus` for `accent` **is** `--pp-palette-accent-focus`, the value
`--pp-color-focus-ring` resolves to. It compared a colour with itself. Giving
the ring `var(--pp-tone-focus)` changed nothing and the test stayed green. It
reads the `danger` alert now, where the two differ, and `outline-style` is
asserted beside the width because "solid, 0px" is D-052 §3's impossible
combination. This is D-048 §5's rule from the other side: **when an assertion
says A equals B, ask what would make them differ.**

**And one declaration that nothing observes, stated rather than claimed.**
Removing `min-inline-size: 0` changes not one number in the suite. With
`overflow-wrap: anywhere` the text's min-content size is one character, and
every alert on the playground page sits in a *column* flex container, where the
automatic minimum size does not apply on the inline axis at all. It stays
because RULES §1 defines `fill` as including it, and it earns its keep in the
arrangements the page does not contain — a row flex item, a grid cell, content
that cannot break. What changed is the comment: the test now says what it
checks instead of implying a guarantee it does not carry, which is D-051 §4's
lesson applied to prose rather than to a missing project.

### 6. `role="alert"` is opt-in, and the component is named after the thing it does not do by default

An assertive live region interrupts whatever the screen reader is saying. Three
facts pushed the default to `off`:

- **A live region announces changes to a region that already existed.** An
  `Alert` server-rendered into the initial HTML has no change to announce; the
  behaviour ranges from silence to a double read.
- **A region that is always present is never news** — a permanent "test mode"
  banner would re-announce on every navigation that re-mounts it.
- **`Field` already ruled on this shape** (`Field.md` §5): no `role`, no
  `aria-live` on the error, because a string that is both live and referenced
  by `aria-describedby` is announced twice by several screen readers.

`live` takes ARIA's own words — `off` / `polite` / `assertive` — and maps to no
role / `role="status"` / `role="alert"`. Roles rather than a bare `aria-live`
attribute, because both roles also imply `aria-atomic`. And `off` is the
*absence* of a role rather than `aria-live="off"`, which is still a live region
that happens to be muted.

The cost is named rather than hidden, as `Field` §5 named its own: mounting an
element that already carries `role="alert"` is the *less* reliable way to
announce something. The reliable mechanism is a region that exists first and
receives text afterwards, which is `Toast`'s (4.12) architecture. For `Form`'s
error summary the fallback is focus, which needs no new API — `ref` is
forwarded and `tabIndex` spreads.

### 7. The component holds no state, and that is what keeps it `server`

`onDismiss` is an event-handler prop, not a state prop: it renders the close
button and calls back, and the caller unmounts the alert. Nothing is stored, so
RULES §5.5's controlled/uncontrolled pair is not triggered — the cheapest way
to satisfy it is not to be stateful — and no `'use client'` is needed.

Rejected: `open` / `defaultOpen` / `onOpenChange`. More API, client-only, and it
puts the alert's visibility somewhere the app cannot see, which is wrong for the
case that actually matters: a dismissed banner has to stay dismissed across a
reload.

Rendering `IconButton` (which is `'use client'`) does not change the ruling —
D-032 already scoped the lint rule to what ships rather than to what is
imported. The consequence is documented rather than prevented: the component
passing `onDismiss` must itself be a client component, because a function
cannot cross the RSC boundary. The playground page proves both halves — every
example is rendered by the Server Component page except the dismissible ones,
which live in a client child.

### 8. `title` is reclaimed from HTML's tooltip attribute, and renders a `<div>`

`ComponentPropsWithoutRef<'div'>` already has a `title: string` — the tooltip.
Two props cannot share a name, so it is `Omit`ed and redeclared as a
`ReactNode`. A tooltip on a block of prose is not a pattern; a heading line is.
Asserted in both directions: the title renders in `.pp-alert__title`, and the
root never grows a `title` attribute.

A `<div>` and not a heading, because the right level is `h2` in a page banner
and `h3` inside a card and the component knows neither — `Heading` (1.2) exists
precisely because visual level and semantic level are different decisions.
`title={<Heading level={3}>…</Heading>}` is the opt-in, and needs no extra prop.

### 9. Two tracking corrections

`ROADMAP.md` listed 5.2's **Deps** as `1.3, 2.2`. It composes `Icon` (1.3) and
`IconButton` (3.2), and does **not** compose `Cluster` — actions are `children`
spaced by a layout primitive the caller chooses, which is RULES §5.6 working as
intended. Corrected to `1.3, 3.2` at approval.

And the library ships no tone icons. `icon` is a slot taking the caller's SVG,
wrapped in `<Icon decorative>` here so sizing and `aria-hidden` are guaranteed
rather than requested. The apparent counter-example is `Select`'s chevron
(D-039 §3) and it is not one: `appearance: none` *deletes* the arrow the
platform drew, and a select without one is not identifiable as a select. An
alert loses nothing by having no glyph. The dismiss X is the same case as the
chevron — `IconButton` cannot be constructed without children — and not a
fourth opinion about what "danger" looks like.

---

<a id="d-054"></a>

## D-054 — `outline-width` is not the property that says a ring is drawn, and a guard with no way to be regenerated stops guarding

**Date:** 2026-09-21 · **Status:** accepted · **Amends:** D-050 §5 (the
dimensions manifest); `tests/visual/harness.spec.ts` (NumberInput, Slider)

Two CI failures on `Alert`'s pull request, neither of them `Alert`'s.

### 1. Two assertions that passed here and failed in CI, and the component was right both times

`NumberInput` and `Slider` each asserted that an **unfocused** control carries
no ring, as `expect(getComputedStyle(el).outlineWidth).toBe('0px')`. CI returned
`3px`. Both also fail on `main`, so they predate the branch they surfaced on.

CSS says the computed `outline-width` of an element whose `outline-style` is
`none` is zero. Chromium reports the **specified** width instead — `medium`,
which is `3px` — and whether it does depends on the build. This container
returns `0px` and the runner returns `3px`, with nothing different about the
component in between.

So `outline-width` answers "how thick would the line be", not "is there a line".
The property that answers the second question is `outline-style`, and that is
what "no ring" is asserted on now. Where a ring **is** expected both are
checked, because a `solid` ring of zero width is D-052 §3's impossible
combination and is exactly the shape that reads as a pass.

The same trap was caught three hours earlier in `Alert`'s own ring assertion
(D-053 §5) and the generalisation was not made then. It is now: **a focus-ring
assertion reads `outline-style`; the width is a second question, never the
first.**

### 2. The drift guard fired at the limit it was given, and was the only thing that noticed

`tests/unit/screenshot-dimensions.test.ts` counts baselines with no recorded
geometry and fails at three, on the stated reasoning that "an unrecorded page is
unguarded, and the count going up silently is how a guard stops guarding".
`number-input.png` and `slider.png` shipped unrecorded with Tier 3D;
`alert.png` made three.

The guard was right and the manifest had no way to be updated. D-050 §5 says to
"regenerate the manifest deliberately", and regenerating it meant hand-editing
JSON — so it was not edited at all for two components. `scripts/record-dimensions.mjs`
(`npm run dimensions`) is that missing half.

It **adds missing entries only**. Overwriting an existing one is how a guard is
made to bless the drift it exists to catch, so `--all` is an explicit flag and
belongs immediately *before* a deliberate re-baseline, never after one. It reads
committed baselines, because those are CI's (D-013) — a locally rendered PNG is
a different Chromium build and two to four pixels shorter, and recording one
writes this machine's geometry in as the truth.

**The rule:** a guard whose manifest cannot be regenerated by a command will
stop being regenerated. Ship the command with the guard.

---

<a id="d-055"></a>

## D-055 — The ring was already per theme. A grep was read as a fact

**Date:** 2026-09-21 · **Status:** accepted · **Corrects:** D-053 §2;
`docs/specs/Alert.md` §9; `ROADMAP.md` (0.11)

D-053 §2 measured the focus ring against three surfaces and reported the
numbers correctly. It then explained *why* the gap could not be closed cheaply:

> the ring's value is identical in both themes, so moving it darker fixes light
> and breaks dark; the real fixes are a per-theme ring or a two-tone ring, both
> Tier 0.2 work plus a re-baseline of all 35 screenshots.

Every clause after the comma is false.

`--pp-palette-accent-focus` is **L 66.18% in the light theme and L 49.70% in the
dark one**, and has been since 0.2 — the generator solves it per theme, with its
own search direction for each. What both themes had in common was not a value;
it was a *target*: each was solved against **step 1 only**, three lines above an
`edge` that D-050 had already taught to solve against steps 1, 2 and 3.

So the fix is to give the ring the same treatment `edge` already had, and
nothing else. Light moves 66.18% → 63.34%, dark 49.70% → 53.99%, and the worst
pairing in the library goes from 2.54:1 to 3.06:1. No per-theme mechanism was
needed, because it was already per theme. No two-tone ring. And **no
re-baseline**: a focus ring paints only on `:focus-visible`, no baseline page
holds a focused element, and the token gallery renders steps 1-12 and nothing
else — so the change moves zero pixels in 37 screenshots.

**Where the error came from, because that is the part worth keeping.** The
measurements were taken by parsing the theme blocks and were right. The causal
claim came from a `grep -n` that printed two matching lines, at 64 and 273, with
the same value — and 273 was read as "the dark block" when it was
`[data-pp-theme="light"]`. A grep shows you lines; it does not show you which
scope they are in. **Every number in D-053 §2 was measured; the one sentence
that was not measured is the one that was wrong**, and it was the sentence that
sized the work.

The estimate was wrong in the expensive direction — it made a contained token
fix look like a tier-level project, and it was published in a spec, a decisions
entry, a roadmap row and a pull request before anyone tried it. **The rule:
prose that sizes a piece of work is a claim, and it gets checked like one.**

---

<a id="d-056"></a>

## D-056 — 0.11: the ring's surfaces are every hue's, and a gallery that did not draw what it called solved

**Date:** 2026-09-21 · **Status:** accepted · **Amends:** Tier 0.2 token layer;
`scripts/generate-tokens.mjs`; `scripts/check-contrast.mjs`;
`playground/app/tokens` · **Corrected by its own investigation:** D-055

Roadmap item **0.11**, opened by `Alert` (D-053 §2). The gap: the focus ring was
solved and asserted against **step 1 only**, three lines above an `edge` that
D-050 had already taught to solve against steps 1, 2 and 3.

### 1. The check was written first and watched go red

D-050 §3's habit. Two per-hue pairings (`focus vs 2`, `focus vs 3`) and one
cross-hue set, added before the generator was touched: **40 violations**, at
2.94 / 2.85 on step 2 and 2.74–2.77 / 2.54–2.57 on step 3, which are the figures
D-053 §2 predicted at `Alert`'s gate. 242 assertions → **293**.

### 2. The ring's surfaces are every hue's; a border's are neutral

`solveEdge` takes a neutral-only surface set, and its comment explains why: "a
danger-toned input sits on the page, not on a red one." That is true of a
**border**, which sits between a control and the page. It is false of a **ring**,
which is drawn on whatever the focused thing is sitting on — and since `Alert`
(5.2) that can be a red one.

So the ring solves against all five hues' steps 1–3 rather than neutral's. The
spread is 0.03 between hues, which is small and is the difference between 2.74
and 2.77 — between failing and failing by more. The cross-hue assertion in
`check-contrast.mjs` describes what actually ships: `--pp-color-focus-ring` is
accent's step (D-029), and the pairing that decides whether a focused control is
visible inside a **danger** alert is accent's ring on danger's surface, which no
per-hue loop can see.

**Result:** light 66.18% → 63.34%, dark 49.70% → 53.99%. Worst pairing in the
library **2.54:1 → 3.06:1**, both themes, all five hues, all three surfaces.

### 3. The one thing that made this look expensive was never measured

See **D-055**. The estimate in D-053 §2 — a per-theme or two-tone ring, plus a
re-baseline of 35 screenshots — came from reading a `grep` rather than the file,
and was wrong in the expensive direction. The ring had been per theme since 0.2.

### 4. The token gallery rendered every step except the ones with an obligation

`/tokens` draws steps 1–12 and `on-solid`. `focus`, `edge` and `edge-strong` —
the three steps that carry an explicit WCAG target, and the only three that are
deliberately **off-ramp** — were drawn by nothing. Its own prose said "the focus
ring are solved for their contrast targets" above a page that did not show it.

The practical consequence: a change to any of the three moved **zero pixels in
37 screenshots**, so the visual suite could not regress the only tokens with a
stated guarantee. That is 0.11's own failure mode one layer up — a value nothing
looked at — and it is why this item changes a playground page as well as a
generator.

They are drawn on **step 3**, the surface each is hardest against, and as a
line, because a line is what all three are. `tokens.png` is the single baseline
this item re-authors; every other screenshot is untouched, which is the claim
the manifest now guards rather than the claim this entry makes.

---

<a id="d-057"></a>

## D-057 — Gate C for 3.16 `Form` and 3.17 `RangeSlider`: approved by delegation

**Date:** 2026-09-22 · **Status:** accepted · **Amends:** `docs/specs/Form.md`,
`docs/specs/RangeSlider.md` (status lines)

Both specs were brought to Gate C together, each with its own open questions and
a recommendation on every one. The approval was **"you know best"**: the user
delegated the decisions rather than reviewing them.

Recorded as that, and not as a review, because the difference is the whole
reason the gate exists. Gate C is a second pair of eyes on an API before it is
permanent; a delegated approval is one pair of eyes. What that means for the
builds that follow:

- **Every recommendation in both specs is adopted as written.** `Form`: each
  message passed twice rather than a `Field` change (§3); focus on mount with
  errors (§5); an English `errorTitle` default. `RangeSlider`: the ~5% of ring
  below 3:1 where it crosses the fill is accepted with its numbers (§6); ring
  placement differs from `Slider`'s and `Slider` is left alone (§1); a track
  press continues dragging (§2).
- **An assumption the spec made that the build falsifies is a stop, not a
  workaround.** Two are unverified at the gate and named here so they are
  checked first: that a transparent native thumb with `pointer-events: auto`
  under `pointer-events: none` on its input still takes a drag in Chromium
  (RangeSlider §1–§2), and that React restores a controlled range input whose
  change was clamped to the same state value (§3). If either fails, the build
  reports it and returns to the user before choosing an alternative.
- **Any ruling made during the build that the specs did not anticipate is
  written here as a finding**, as every build so far has done — delegation widens
  what has to be written down, it does not narrow it.

---

<a id="d-058"></a>

## D-058 — `Form` build findings: a successful submit that no effect could see

**Date:** 2026-09-22 · **Status:** accepted · **Amends:** `docs/specs/Form.md`
§5, Sizing contract justification; `src/test/setup.ts`

### 1. Spec §5's mechanism leaked on the one outcome nobody tests: success

§5 said the "awaiting a result" flag is cleared when an effect sees errors, or
when `pending` goes from `true` to `false`. A **synchronous submit that
succeeds** does neither: `errors` stays empty, `pending` is never set, no
effect has anything to react to — so the flag stays set, and the next error
from **blur validation** is taken for that submit's answer and steals focus.
That is §5's second row, the one the spec called the case that fails
silently, reached by a route the table did not list.

Found by writing that row's test, not by review. The fix: after the caller's
`onSubmit` returns, a `setTimeout(0)` clears the flag unless `pending` is now
set. A task, not a microtask, so it runs after React has flushed whatever the
handler scheduled; `pending` is read from a ref synced in a layout effect.

**The race this opens was measured, not reasoned about.** `useActionState`'s
`isPending` must already be `true` by the time the timer fires, or an action's
errors would arrive after the flag was cleared and focus would not move. The
browser suite submits a real React 19 action twice and asserts one call **and**
focus on the summary afterwards; it passes. Four unit breaks were run (no flag,
no timer, timer ignoring `pending`, focusing a group root directly) and each
failed exactly the test named for it.

### 2. Flex column, not the grid the spec drew

The Sizing section said `display: grid`. A form is `Stack`'s shape — a column
with a gap from D-020's scale — and `Stack` is a flex column, so `Form` is one
too. With single-column content the two lay out identically; the difference is
which primitive a reader compares it to. The browser suite measures the gap
between the summary and the first field against `--pp-space-5`, and fails when
the `gap` declaration is removed.

### 3. A second jsdom stub, documented for consumers

jsdom has no `Element.prototype.scrollIntoView`, and following a summary link
calls it. Stubbed in `src/test/setup.ts` beside the `ResizeObserver` stub, for
the same reason: the API exists in every targeted browser, and guarding
production code against a test environment's gap has it backwards. The Form docs
page tells consumers testing in jsdom to add the same stub.

### 4. A required field's label cannot be found by an exact label match

`getByLabel('Email', { exact: true })` finds nothing for a `required` `Field`,
because Playwright matches the label's text, and that text includes the
`aria-hidden` asterisk. The accessible name is correct (`textbox "Email"`,
checked with an ARIA snapshot); the browser tests use `getByRole` with a name.
Recorded because it reads exactly like a broken label association, which is the
first thing anyone would believe about it.

### 5. Three browser breaks, each caught by its own test

Removing `tone="danger"` from the links, scrolling the control instead of its
field, and removing the `gap` declaration each failed the one test named for it,
with the break confirmed in the served build (D-037 §4) and the other seven
tests still passing.

### Addendum, 2026-09-22 — D-057's two assumptions, checked before the `RangeSlider` build

Checked with throwaway probes outside the repo while `Form` sits in `review`
(Gate A holds the `RangeSlider` build itself):

- **A transparent native thumb still takes a drag — in Chromium.** Two stacked
  `<input type="range">`, `opacity: 0`, `pointer-events: none`, with
  `pointer-events: auto` on `::-webkit-slider-thumb`: dragging at the start
  thumb's position moved only the start input (20 → 50) and focused it;
  dragging at the end thumb's moved only the end input (80 → 60); and a press on
  bare track hit-tested to the **root**, not to either input — which is exactly
  the event spec §2 routes by hand. **Firefox is unverified**: the environment
  ships one browser (D-051 §4), so the `-moz-` half rests on the technique's
  wide use and on `lint:rules`' mixed-prefix rule, not on a run.
- **React restores a clamped controlled range input, including when the clamp
  leaves state unchanged.** Clamping a change of 90 to 50 wrote 50 back to the
  DOM; a second change of 95, clamped to the same 50 so that no state update
  happened at all, still left the element at 50. That is the case spec §3 relied
  on and the one a hand-rolled controlled input usually gets wrong. Checked in
  jsdom; the build re-asserts it in the browser.

Neither is a stop. The build proceeds as specified once `Form` is `done`.

---

<a id="d-059"></a>

## D-059 — Nothing interactive inherits an `Alert`'s tone, `live` was recommended for the case it cannot serve, and "set the tone" says where

**Date:** 2026-09-26 · **Status:** accepted · **Corrects:** `docs/specs/Alert.md`
§1, §2, §4, the props and Styling tables and the usage example;
`docs/components/Alert.md`; `Alert.tsx` and `Alert.css` comments; `ROADMAP.md`
(Current state); the 0.7.0 changelog entry, by a patch changeset ·
**Extends:** `docs/components/{Checkbox,Radio,Switch}.md`,
`docs/specs/tier-3c-inputs.md` §3.10

Three findings from Launchpad consuming `Select`, `Switch` and `Alert`. None
changes shipped behaviour; all three corrected text that described behaviour
the library does not have.

### 1. `Button` and `Link` keep their own tone inside an `Alert`

The spec, the stylesheet's header, the source comment on the root's
`data-pp-tone`, the docs' props table, the roadmap and the 0.7.0 changelog all
said the alert's tone context "inherits into" the caller's `Button`s and
`Link`s. It does not. `Button` defaults `tone` to `neutral` and `Link` to
`accent`, and both write `data-pp-tone` from that default on every render —
as do `Badge`, `Code`, `Spinner` and `Avatar`. D-007's mechanism is inheritance,
and the nearest `[data-pp-tone]` wins, so the component's own default beats the
alert's context every time. What does inherit is bare text and anything
painting from `currentColor`. `Text` and `Heading` write a context only for a
coloured tone, so at their default they paint `--pp-color-text`, not the
alert's hue either.

Launchpad found it: a danger `Alert` with a "Try again" `Button` inside, which
rendered grey. Grey was the right answer there, so the app passes nothing — but
the library had promised red.

**The fix is the text, not the behaviour.** Making `Button` inherit when `tone`
is absent would recolour every `Button` and `Link` in every consumer that ever
sits inside any tone context — a `Field` error, a `Badge`, an invalid control's
root — and is an API change for Gate C, not a correction. It is not proposed.
A test now pins the real behaviour (`Alert.test.tsx`, "does NOT tone the
Buttons and Links a caller puts inside it"), so if it ever changes, the docs
fail with it. The existing dismiss test was renamed from "inherits" to "is
passed" the alert tone, which is what `Alert` does.

**§1's `solid` rejection survives re-measurement**, with a new premise. A
`plain` `Button`'s own neutral step 11 and a `Link`'s own accent step 11 land
on each hue's step 9 at **1.05–1.16:1** light and **1.09–1.47:1** dark, because
step 11 is solved to one lightness in every hue — the same figures as the
alert's own `--pp-tone-text`. And the re-measurement found the spec's ranges
silently left out `warning`, whose light step 9 puts step 11 at **2.73** /
**1.94**: still under 4.5:1, so the conclusion is unchanged, but "across all
five hues" was false and now says which hue is outside the range.

### 2. `live="polite"` was recommended for a mount

Spec §2 and the docs page both said, correctly, that a live region announces
changes to a region that already existed and that mounting one is the less
reliable way to announce anything. The table two lines above recommended
`polite` for "something that appeared because the user did something" — which
in React means `{done && <Alert live="polite">}`, the case the paragraph had
just ruled out — and the spec's usage example was exactly that.

Launchpad's reset confirmation is that case. It keeps a `<div role="status">`
mounted and renders the alert inside it with `live` off, so the alert's arrival
is the change. The table now recommends `polite` and `assertive` for an alert
that stays mounted while its content changes; the example, the prop's JSDoc and
a new "don't" show the persistent region. The component cannot fix this itself:
announcing on mount would need an effect that inserts the text after the region
exists, and that makes a Server Component a client one. `Toast` (4.12) is the
real answer and stays planned.

No screen reader was available to measure the mount case, so the docs keep the
existing wording — "may be read twice or not at all" — and claim nothing more.

### 3. "Set the tone" on the checkable three now says where

`Checkbox` and `Radio` docs said the checked fill follows the tone: "set the
tone". There is no `tone` prop on either, or on `Switch`, and there should not
be: tier-3c §4 reserves each control root's `data-pp-tone` for `invalid`, so a
`tone` prop would need a precedence rule against `invalid` — an API question for
a gate, and one Gate A would refuse while `Form` sits in `review`.

The docs now say: the tone goes on an ancestor, and the `Field` takes it (it
spreads onto its root). Nothing else in the field reads it — the label and
description use text tokens and the error sets its own `danger` — and `invalid`
still wins because the control's root is the nearer context. Launchpad met this
as a visible change: its `role="switch"` stand-in was accent, `Switch` is
neutral by default, and the app kept neutral to match its radios.

---

<a id="d-060"></a>

## D-060 — `RangeSlider` build findings: the safety net that hid the wire, and a stacking rule the spec had only written for the coincident case

**Date:** 2026-09-26 · **Status:** accepted · **Amends:** `docs/specs/RangeSlider.md`
§3, §Testing notes; `.stylelintrc.json` (D-019 exemption list);
`docs/components/Slider.md`, `Slider.tsx` header

Built as specified, on the day Gate A opened. D-057's two unverified
assumptions had already been checked before the build (D-058 addendum), and
both held in the browser suite again — a transparent native thumb under
`pointer-events: auto` takes a drag, and React restores a clamped controlled
input including when the clamp leaves state unchanged. What follows is what the
spec did not anticipate.

### 1. A value assertion could not tell the native thumb from the root's safety net

Spec §Testing notes promised the assertion that §1's placement formula is for:
press the centre of each visible thumb and drag, and "the value that moves must
be that thumb's" — the break being the formula itself. Written that way it
passed, and the break would **not** have failed it.

If our thumb drifts off the native one, or the native thumb takes no pointer
events, a press on the visible thumb lands on bare track. Bare track reaches
the root, and §2's routing moves the **nearer** thumb to the pressed value and
captures the drag. The nearer thumb is the one under the pointer, the pressed
value is where it already sits, and the drag follows from there: the same
thumb, moved to the same place. The routing is a safety net that rescues
exactly the two defects the test exists to catch, and a value assertion cannot
tell the net from the wire.

So the test asserts the **hit test** first: `document.elementFromPoint` at each
visible thumb's centre must be that thumb's own input, and between them it
must be the root. Then it drags. `pointer-events: auto` removed from the
`-webkit-` thumb block fails on the hit test (and takes the stuck-pair test
with it, which also presses a thumb); a value read alone stayed green. The
spec's other break for this test — the formula, run as physical `left` — is
right in LTR and so passes the LTR hit test too; it is the RTL test that
catches it, on our thumbs' positions. D-035 §3's rule from the other
direction: a mechanism that degrades gracefully needs a test that can see the
degradation, or the graceful part is what gets tested.

### 2. The stacking rule is on the pair's midpoint, not only on the coincident value

Spec §3 said which input is on top when the thumbs **coincide**: the start
input above the range's midpoint, the end input below it, so the thumb on top
can always move toward the open side. It then said that when they do not
coincide "the order is immaterial", which is true of the inputs and not of the
thumbs: with `step={1}` on a 0–100 range the native thumbs overlap at any two
values within a thumb's width of each other, and the upper input takes every
press in the overlap.

The rule is applied to the **pair's own midpoint** against the range's. For a
coincident pair that is the spec's rule exactly; for a partially overlapping
pair it puts the same thumb on top that the spec's reasoning would — the one
with room to move away — and when the thumbs are clear of each other it
decides nothing, as before. `data-thumb-top` carries it, and the unit test
pins a pair at `[100, 100]` to `start`, which is the case every hand-built
range slider ships stuck. The z-order is a rule in the stylesheet, not the
attribute alone, so the browser break that catches its absence is the deleted
`z-index` line, not the deleted attribute: dropping the attribute fails on an
attribute assertion, which proves nothing about whether the pair can be pulled
apart.

### 3. The public thumb size is resolved into the private property once, not at each use

`Slider.css` reads `var(--pp-slider-thumb-size, var(--_thumb-size))` at the
one declaration that draws the thumb. Here the thumb's size is read in three
places that must agree — the native thumb, our thumb, and the `100% − thumb`
travel in each thumb's inset — so `--_thumb-size` is defined as
`var(--pp-range-slider-thumb-size, var(--pp-size-5))` on the root and the
three read the private name. D-024's requirement is that the public property
is read first and from any ancestor; it is, once, and an override that reached
one of the three and not the others would have been the misalignment §1
exists to prevent.

### 4. `preventDefault` on the root's pointerdown, and why a spec that said "focus its input" needed it

A `pointerdown` whose default is not prevented also runs the browser's own
focus step, which focuses the nearest focusable ancestor of the target — here
nothing, so focus goes to `<body>` — *after* the handler has already focused
the thumb's input, and starts a text selection across the page on the way.
The handler prevents the default once it has decided to route the press, and
only then: a caller's `onPointerDown` runs first and can prevent it to stand
the routing down, which the unit test asserts.

### 5. Two test defects, both in the tests

The first run of the unit suite failed three of forty-one, all in the
track-press group, and all for one reason: the tests dispatched `pointerdown`
and `pointermove` through `dispatchEvent` rather than through `fireEvent`, so
nothing wrapped them in `act()`. In a browser a discrete event's state update
flushes in a microtask before the next event can arrive; in the test the next
press ran against the previous render's closures and read the value from
before the press. The component was right; the tests were re-dispatched
through `fireEvent`, which wraps each in `act()`. D-051 §6's rule — when a test
fails, establish which of the two is wrong before changing either — and this
time it was the test both times.

The second was §1's, found by reading the passing test rather than by running
it, which is the exception rather than the pattern and is recorded as such.

**Five browser breaks, each caught by the test named for it**, with the
other assertions in the group still passing: physical `left` for
`inset-inline-start` (the RTL test); the `z-index` line under
`data-thumb-top` (the stuck pair); `pointer-events: auto` off the `-webkit-`
thumb (the hit test, and the stuck pair); the ring declarations (the ring
test); and the crossing clamp (both cannot-cross tests). The unit break the
spec names — a fraction written only when non-zero — fails the `[0, 0]` case.

**One run did not fit, and it is recorded rather than smoothed over.** In the
first pass of the clamp break the ring test failed alongside the two clamp
tests. The clamp is not on the ring's path, and it did not reproduce: six
repeats on the intact build, three under the same break in isolation and a
second full run of the group under the break all passed. The cause was not
established. The assertion is already polled (D-052 §3) and reads
`outline-style` (D-054 §1); if it fails again, this is where to start.

### 6. Three claims on the docs page are argued, not measured

- **WCAG 2.2 SC 2.5.8.** `Slider` relies on the spacing exception — one
  target, nothing for a 24px circle to intersect. Two thumbs can touch, so the
  exception does not hold when they meet. The docs say the target that matters
  is the control, which is `--pp-control-height-*` tall and routes any press
  to the nearer thumb. That is an argument about targets, not a measurement of
  one, and it is written as such.
- **Firefox.** The `-moz-` half of the thumb blocks — sizing and
  `pointer-events: auto` — rests on the technique's wide use and on
  `lint:rules`' mixed-prefix rule, as D-058's addendum said. The environment
  still ships one browser (D-051 §4).
- **The ring across the fill** is accepted at the gate's numbers (spec §6,
  D-057). The build moved nothing that would change them: same ring tokens,
  same fill step, same thumb sizes.

### 7. Tracking

- `RangeSlider.css` joins the D-019 `inline-size` exemption in
  `.stylelintrc.json`, as its spec said it would. The thumbs are intrinsically
  square and sized from the size scale; nothing else in the file declares one.
- `Slider.md`'s "Why there is no range" is now "Why range is a separate
  component" and points here; `Slider.tsx`'s header no longer says the
  two-thumb case is deferred. D-045's rule: a claim about another component is
  a link to where it is asserted, not a restatement.
- `range-slider.png` was unrecorded in `dimensions.json` until CI authored
  it. **This entry first said "the guard's tolerance is three unrecorded
  baselines and this makes one"; it made three.** `form.png` and `tokens.png`
  were already unrecorded — `Form`'s baseline was authored after D-054 §2's
  manifest and `/tokens` was re-baselined by 0.11 — so the authored file was
  the third and the guard failed the first CI run after the authoring commit,
  exactly as D-054 §2 says it should. `npm run dimensions` recorded all three
  from the committed PNGs (form 4090, range-slider 6158, tokens 3144 tall).
  The count in the first draft was read off the manifest without counting
  the directory against it, which is the check the guard exists to make.

---

<a id="d-061"></a>

## D-061 — Tier 4 is built on Radix Primitives; Gate C for 4.1 and 4.2 approved by delegation; the overlay exception to RULES §1

**Date:** 2026-09-26 · **Status:** accepted · **Amends:** D-002 (the slash
comes out); RULES §1 (the `Container` consequence), §8; Tier 0.2 tokens
(`--pp-measure-xs`); `.stylelintrc.json`; `docs/specs/overlay-foundation.md`
§3, §5, §9, Anatomy; `docs/specs/Popover.md` (status)

### 1. Radix Primitives, decided

D-002 said "Radix / Base UI". The 4.1 spec measured both against the registry
and the platform on 2026-09-26 (spec §1, with the table) and chose Radix:
stable 1.x/2.x packages, small per package, React 19 peers, and — the
deciding reason — its `asChild` and `data-state` / `data-side` / `data-align`
are the names D-003 and RULES §4 fixed for this library before Tier 4
existed, so a component built on it emits the library's vocabulary with no
translation. Base UI is `1.0.0-rc.0` and broke its own API in that release;
the platform's anchor positioning is in 25 of the 35 `browserslist` targets
and jsdom implements none of `showModal`, `showPopover` or `inert`.

RULES §8 now says Radix Primitives. Revisit when CSS anchor positioning reaches
the `defaults` set; 4.1 §5's logical vocabulary is what makes that revisit
cheap.

### 2. Approved by delegation, twice, and the second one before the spec existed

The 4.1 spec went to Gate C with four open questions and a recommendation on
each. The approval was **"do it so that it is pixel perfect"** — a
delegation, recorded as D-057 recorded the last one: one pair of eyes, every
recommendation adopted as written.

4.1 §9 says the foundation is built with 4.2 `Popover`, tested through it, in
one PR. So the 4.2 spec was written **after** that message and approved under
the same delegation, which is a step further than D-057 went: the user has
not seen it. Two things follow. Every decision in `Popover.md` is listed in
the closing report as something to revert before merge, not after. And the
spec stays inside rulings that already exist — Radix's own compound shape,
RULES §5.5's controlled pair, D-020's `Space` for its offsets — so that a
reversal is a reversal of a default, not of an invention.

### 3. An overlay has no parent in flow, so it takes its ceiling from the measure scale

RULES §1's rule is that the parent sizes the child, and a Tier 4 panel's
parent is `<body>`. A popover holding a `Field` — every control in this
library fills — would grow to the viewport. The roadmap row for 4.2 promised
"sizing contract exception — documented in spec"; this is it, stated once for
the tier rather than once per component:

- An overlay panel may declare `max-inline-size` (logical, never
  `max-width`), and its default comes from the **measure scale** — the
  vocabulary for "how wide may content run" — which gains
  `--pp-measure-xs: 20rem` for this class of box. The token comment said
  "only `Container` may consume these"; it now names the overlays too.
- `max-block-size` is the available height floating-ui reports, so a tall
  panel scrolls inside itself.
- `.stylelintrc.json` gains a per-file override for `max-inline-size`, the
  shape D-019's `inline-size` exemption already has. Nothing in flow ever
  qualifies, and the RULES §1 consequence says so.

### 4. Two corrections to the 4.1 spec, made at the 4.2 spec and before any build

- **The theme goes on the overlay's own root, not on a `.pp-portal` wrapper.**
  Radix's `Portal` composes `Presence`, which keeps its single child mounted
  only while that child's own animation runs. A wrapper of ours with no
  animation would unmount the instant `open` turned false and take the
  content's exit animation with it. `data-pp-theme` on the content root
  resolves every token identically and adds no element.
- **`data-side` stays physical.** Radix spreads consumer props after its own,
  so a logical `data-side` of ours would win — and lose the placed side,
  since `onPlaced` is not on the composed primitives. The attribute is a
  paint-time fact for paint-time rules; the `side` *prop* is the logical
  half, and that is the half RULES §1 asks for.

Both are in the spec text with "amended" markers rather than rewritten, so
the reasoning that was wrong stays readable.

### 5. Offsets are steps of the space scale

Radix's `sideOffset` and `collisionPadding` are pixel numbers. A `8` in a
component's JavaScript is the `8px` RULES §3 bans in its CSS, one file over.
Both are typed `Space` (D-020's index) and resolved to pixels on the trigger
element at open time by `resolveSpace`, which reads the token's computed value
and converts its unit. The break check for this one is recorded in advance as
**not observable** — the token resolves to the number the hardcode would have
been — so the guard is the type, and the docs page's "don't" shows the pixel
form so a reviewer knows what to reject.

---

<a id="d-062"></a>

## D-062 — `Popover` build findings: a compound you cannot dot into from the server, a gallery that dismissed itself, and a reset that does not reach the component layer

**Date:** 2026-09-26 · **Status:** accepted · **Amends:** RULES §5.6;
`docs/specs/Popover.md` §1, §5, §6; `docs/specs/overlay-foundation.md` §6;
`docs/components/Popover.md`

The first Tier 4 build, and 4.1's Gate D walked through it (4.1 §9). Five
findings, three of which corrected the spec.

### 1. The parts are named exports, because React forbids dotting into a client module from a Server Component

The spec's shape was `<Popover><Popover.Trigger/>…</Popover>`, built with
`Object.assign(Root, { Trigger, … })` as `Split` is. The playground's Popover
page — a Server Component, as every Next App Router page is by default —
failed to prerender with "Element type is invalid … got: undefined". The
cause is in React's flight proxy, in its own words: **"You cannot dot into a
client module from a server component. You can only pass the imported name
through."** A client reference is resolved on the other side as
`module[name]`, and `Popover.Trigger` has no name of its own to resolve.

`Split` gets away with it because it is a Server Component. Every Tier 4
component is `'use client'`, so for the whole tier the parts are **named
exports** — `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverTitle`,
`PopoverDescription`, `PopoverClose` — one spelling that works on both sides
of the boundary. RULES §5.6 now says so. The `Card.Header` example it still
opens with is right for a server compound and wrong for a client one, which
is the distinction the rule was missing.

### 2. Six non-modal popovers open at once dismiss each other, by design

The gallery section opens one popover per Matrix cell with `defaultOpen`.
Built plainly, all six were closed by the time the page settled: each one's
auto-focus on mount is a "focus outside" for the one before it, and the last
one's unmount cascade returns focus to a trigger, which is outside the last.
That is the dismissable layer doing its job — a non-modal popover is a
one-at-a-time thing — and the gallery is not a use, it is a gallery. Its six
take Radix's three escape hatches through `PopoverContent` (`onOpenAutoFocus`,
`onFocusOutside`, `onInteractOutside`, each `preventDefault`ed) and are marked
`data-gallery` so the interactive tests can find the one panel they opened.
An app never needs those handlers for one popover; the docs page does not
mention them, and that is deliberate.

**Found through a stale server, and the detour is worth recording.** The
first probe reported the six triggers `open` and no panel in the DOM, with a
500 on a JavaScript chunk — a `next start` from an earlier probe was still
serving an older build under the new one. Two probes were spent on a
"defect" that was a port. The probe script now kills its server's process
group; the lesson is D-051 §6's: when a test fails, establish which of the two
is wrong before changing either — and "the two" includes the harness.

### 3. No scope, no attribute

A popover opened on the playground page proper carries no `data-pp-theme`:
the page sets no scope, the default theme is `:root:not([data-pp-theme])`,
and there is nothing to copy. The attribute is written only when a scope
exists — an invented `light` would be a claim the trigger's DOM does not
make, and would shadow an app that themes through `prefers-color-scheme`.
The browser test asserts the absence on the page and the presence in the
Matrix's dark cells and the dark region.

### 4. A modal popover closes on an outside press, and swallows it

Spec §6 said outside pointer events are disabled for `modal`, and implied the
press was blocked outright. Radix's modal popover *closes* on it — a dialog
overlay's behaviour — while the press never reaches what was under it
(`pointer-events: none` on the body). The test that expected the panel to
stay open was wrong on the first half and right on the second; it now asserts
both: the panel closes, and the button under the press was not pressed. The
spec, the docs page and the playground copy say the same.

### 5. The reset's reduced-motion crush does not reach an animation declared in `pp.components`

The 4.1 and 4.2 specs both said the reset would make open and close instant
under `prefers-reduced-motion`. Measured under Playwright's pinned
`reducedMotion: 'reduce'`: **0.14s**. `reset.css` sets `animation-duration:
0.01ms` at zero specificity in the lowest layer; the `animation` shorthand in
`Popover.css`, in `pp.components`, outranks it. That is what the reset's own
comment says — components "opt into essential motion by declaring their own
transition inside pp.components" — and it is why RULES §3 puts the obligation
on every animated component rather than on the reset. `Popover.css` now
declares `animation: none` under reduced motion — `none` rather than a
crushed duration, so Radix's `Presence` unmounts a closing panel at once.
`Slider`'s D-052 §3 case was a *transition on the reset's own rule*, which is
why the crush reached it; the generalisation the specs made from it was
wrong, and both are amended with markers.

### 6. Verified, as promised in the 4.1 spec rather than assumed

- **The z-index token reaches the element that stacks.** Radix's positioned
  wrapper reads the panel's computed `z-index` and carries the same value:
  1200 on both, asserted.
- **Tree-shaking.** In the playground's production build the chunk holding
  Radix's popover code (70,635 bytes) is referenced by the Popover page's
  payload and by neither the Button page's nor the RangeSlider page's.
  Checked by chunk name in the prerendered HTML, because Next loads
  page-specific client chunks through the flight payload rather than
  `<script>` tags — the first draft of this check grepped the tags and
  proved nothing.
- **`resolveSpace`.** `sideOffset="2"` measured 8px between trigger and
  panel; the token's computed value, converted, is 8.
- **A `position: fixed` panel captures correctly in a full-page screenshot**
  (the 4.2 spec's stated unknown): the page is not scrolled when captured,
  so viewport coordinates are document coordinates. Collision avoidance is
  computed against the *viewport*, so a trigger near the bottom of the
  first screen flips its panel upward; the gallery sits above that line and
  the panels are placed below their triggers.

### 7. Five browser breaks and one unit break, each caught by the test named for it

`directionOf` pinned to `ltr` (the RTL test); the theme attribute dropped
from the panel (the theme test, and the gallery test with it); the `z-index`
line (the stacking test); the reduced-motion rule (the reduced-motion test);
and, in the unit suite, the `aria-labelledby` wiring (the name test, and axe
with it). The break the spec predicted would **not** be observable — a
hardcoded `8` in place of `resolveSpace` — was run and was not: ten of ten
passed, because the token resolves to the number the hardcode is. The guard
for that one is the `Space` type and the docs page's "don't", as D-061 §5
said. One break had to be run twice: removing the attribute outright left an
unused variable, the build's `noUnusedLocals` refused it, and the first run
proved nothing about the test. A break that does not compile is not a break.

---

<a id="d-063"></a>

## D-063 — The playground shows one theme at a time, chosen by a switcher; the screenshot suite captures both

**Date:** 2026-09-26 · **Status:** accepted · **Amends:** Tier 0.4
(playground), Tier 0.6 (visual regression); `.claude/skills/component/SKILL.md`
(the playground line of the build step); `tests/visual/harness.spec.ts`,
`tests/visual/screenshots.spec.ts`; every screenshot baseline

Asked for directly: a way back to the component list from a component page,
an index that is not a bare list of names, and a theme switcher in place of
the side-by-side light and dark columns. Done as one change because the
three touch one file set — the playground's chrome — and one baseline set.

### 1. One theme at a time is how an app is themed

The Matrix rendered every subtree six times: three widths in a light column
and the same three in a dark one, each column a `[data-pp-theme]` scope. That
was honest coverage and it doubled every page, put every "wide" cell in a
column that scrolled, and showed the library in a way no app ever does. An app
sets `data-pp-theme` once, on `<html>` or on a wrapper (D-010), and the
whole page follows.

The playground now does the same. The chrome carries a `ButtonGroup` of
three `Toggle`s — System, Light, Dark — that sets or clears the attribute on
`<html>` and stores the choice under one key; a `beforeInteractive` script in
the layout applies the stored choice before the first paint, so a dark page
never flashes light, and `<html>` takes `suppressHydrationWarning` for the
one attribute React must not correct. `System` sets nothing and lets
`:root:not([data-pp-theme])` follow `prefers-color-scheme`, which is the
library's own default. The Matrix renders the three widths once.

### 2. Coverage moves, it does not shrink

- **Screenshots: two per page.** `screenshots.spec.ts` stores the choice
  before each page loads — the way a returning user's browser would — and
  captures `<page>-light.png` and `<page>-dark.png` — the index included,
  since it is now a page worth looking at. The Definition of Done's
  "correct in light and dark themes" is met by the pair, and a page that is
  wrong in one theme fails exactly one baseline, which names the theme.
- **Browser assertions that compared the two columns now switch.** A
  `setTheme` helper presses the switcher and waits for `<html>` to carry the
  attribute; the `Switch` contrast test, the harness self-check and the
  Popover gallery use it. The self-check's D-010 guard is stronger than
  before: it asserts the background changes on switching, survives a reload
  from the stored choice, and clears under System.
- **Counts halve.** Every assertion that counted six cells, six groups or six
  panels counts three, and its comment says why.

### 3. Every baseline is re-authored, and the manifest is recorded afterwards

Every page's geometry changes, so every baseline is deleted and CI authors
the new set on this branch (D-013); the filenames change with the theme
suffix. `dimensions.json` is **left as it was** rather than emptied: the
guard passes locally against zero present files, and `npm run dimensions`
records the new set from the committed PNGs once they exist and drops the
stale entries — which means one CI run between the authoring commit and the
recording commit fails the guard's unguarded count, exactly as D-054 §2 and
D-060 §7 describe. Recorded here so the red run is read as the procedure,
not as a regression. D-050 §5's geometry guard cannot protect this
transition, because the geometry is meant to move.

### 4. The index and the chrome

The home page groups the components by tier, with the tier's one-line
argument above each group and a card per component: number, name, a summary
of what it is. The cards are links styled with the library's tokens and
nothing else — the raised surface, a subtle edge that becomes the control
boundary on hover, and the reset's focus ring. A hero above states what the
library is and four facts about it. The chrome on every page carries the
wordmark, the three places, the switcher, and on a component page a
breadcrumb back to the index and links to the previous and next component
in roadmap order. Nothing in the chrome writes an id (D-035 §1).

<a id="d-064"></a>

## D-064 — Gate C for 4.3 `Tooltip` approved by delegation; an inverse surface joins the tokens; RULES §4 gains an extension rule

**Date:** 2026-09-27 · **Status:** accepted · **Amends:** RULES §4;
Tier 0.2 tokens (`--pp-color-bg-inverse`, `--pp-color-text-inverse`);
`scripts/check-contrast.mjs`; `.stylelintrc.json`;
`docs/specs/Tooltip.md` (status) · **Extends:** D-015, D-057, D-061 §5,
`docs/specs/overlay-foundation.md` §3

### 1. Approved by delegation, the third time

The spec went to Gate C with six open questions and a recommendation on
each. The approval was **"If you think it's pixel perfect go ahead"** — a
delegation, recorded as D-057 and D-061 §2 recorded the last two: one pair
of eyes, every recommendation adopted as written. Compound shape with an
optional provider (§1); a description, never a name (§2); the inverse
surface (§3); Radix's three `data-state` values (§4); no arrow (§9); delays
in milliseconds (§7). What that means for the build is D-057's list, and
§7 below names the assumptions checked first.

### 2. An inverse surface is a semantic, and it is two tokens

A tooltip is read against whatever it floats over and must not be mistaken
for a panel the user can act on, and the library had no token for that:
`--pp-color-bg-raised` is the page's own surface, `--pp-tone-solid` is a
mid grey that reads as a disabled control, and `--pp-color-text` used as a
*background* is a token reached for by its lightness rather than its
meaning — the thing RULES §3 lets `Skeleton` do only because it is not
choosing a boundary. Tier 0.2 gains **`--pp-color-bg-inverse`** (neutral
12) and **`--pp-color-text-inverse`** (neutral 1), identical in both themes
by name and inverted by the ramp: step 12 is near-black in light and
near-white in dark.

`lint:contrast` asserts the pair **under its own name**, value and mapping.
The value is the body-text pair reversed and contrast is symmetric, so the
number was already green two lines up — it is asserted again anyway,
because a check nobody can find by the token's name is a check nobody
re-reads when the token changes (D-050 §1 from the other side). 293
assertions → 305: the value once per hue and theme, the mapping twice.

### 3. `data-state` may be extended by a real state, never replaced

RULES §4 fixed `open|closed`. Radix's `Tooltip` writes `closed`,
`delayed-open` and `instant-open`, and the third is the one paint-time fact
the stylesheet needs: a tooltip that opened because the pointer swept from
a neighbour must not animate in again, or a toolbar flickers. Normalising
to `open|closed` by spreading our own attribute after Radix's (which wins,
D-061 §4) would erase the fact for no gain. RULES §4 now says a component
may add a value that carries a real state; the closed half stays `closed`,
so a consumer's "is it open" is `:not([data-state="closed"])`.

### 4. The overlay exception, applied

`.stylelintrc.json`'s `Popover.css` override — `max-inline-size` allowed,
nothing else relaxed — now names `Tooltip.css` too. D-061 §3's exception is
per file by design: the list of files that may declare a ceiling is the
list of overlays, and it grows one component at a time.

### 5. A provider is fine when it is optional and carries behaviour an app cannot get otherwise

4.1 §3 declined an `OverlayProvider` because one context for one prop most
apps never set is the D-036 objection. `TooltipProvider` is different on
both counts: it carries Radix's skip delay — after one tooltip has shown,
a neighbour opens at once — which is behaviour, not configuration, and an
app cannot get it any other way; and it is **optional**. `Tooltip` reads a
context of ours and, when none is above it, renders Radix's provider itself
with the defaults. Radix throws without a provider; ours does not. The
ruling for the tier: a provider may exist when it is optional and carries
behaviour, and 4.12 `Toast`'s region will be measured against that.

### 6. A hover-intent delay is a number, not a token

D-061 §5 said a `8` in a component's JavaScript is the `8px` RULES §3 bans
in its CSS, one file over — because a token names it. Nothing names a
700ms hover delay: the motion scale is for how long a change takes to draw
and tops out at 360ms, and minting `--pp-delay-tooltip` for a number no
stylesheet would ever read is D-015's "a name that changes nothing".
`delayDuration` and `skipDelayDuration` are milliseconds, with Radix's 700
and 300 as defaults because there is no measurement behind a different
number. The boundary, stated: a JavaScript number is a hardcode when a
token already names the quantity, and a plain number otherwise.

### 7. Checked first at the build, not worked around

Three things the spec assumes and could not verify on paper (spec §8). As
D-057 put it, an assumption the build falsifies is a stop, not a
workaround:

- a natively `disabled` trigger — whether Chromium fires the `pointermove`
  the trigger opens on; the docs page states the measured result;
- three `defaultOpen` tooltips coexist in the Matrix, because `defaultOpen`
  dispatches no open event;
- `instant-open` after a skip actually skips the entry animation, and
  `delayed-open` after a rest plays it.

<a id="d-065"></a>

## D-065 — `Tooltip` build findings: a test harness that waits on a timer nobody advances, a text token that must not be redefined, and a scroll that closes what focus just opened

**Date:** 2026-09-27 · **Status:** accepted · **Amends:**
`docs/specs/Tooltip.md` §3, §8, Testing notes; `docs/components/Tooltip.md`

The first build on 4.1 alone. Seven findings; none changes the API the spec
was approved with, three changed what the spec said would be measured.

### 1. Testing Library's async wrapper waits on a real `setTimeout(0)` and advances only Jest's fake timers

Every user-event call in the unit suite hung. Not user-event's own delay
(`delay: null` changed nothing) and not React's `act` (narrowing
`toFake` to `setTimeout` alone changed nothing): `@testing-library/react`'s
`asyncWrapper` drains the microtask queue after each interaction by awaiting
a `setTimeout(resolve, 0)` — and advances fake timers past it **only when a
`jest` global exists**. Under vitest's fake timers that zero-length timer is
never fired by anyone, and the await never returns.

The fix is `vi.useFakeTimers({ shouldAdvanceTime: true })`: real time
carries the wrapper's timer while `act(() => vi.advanceTimersByTime(ms))`
moves Radix's delays deliberately. The `act` is not optional either — the
delay's callback sets React state outside any event, and an unwrapped
advance leaves the open scheduled but unrendered. Both are on the docs page,
because a consumer's test hits the same wall with the same library.

### 2. `--pp-color-text` is not redefined on the panel, and the first draft did

The panel's ink is `--pp-color-text-inverse`, and the first draft also
redefined `--pp-color-text` to it on the panel so that anything inside
reading the text token would paint the inverse too. That would have made
`Kbd` — the one component the spec's own usage puts in a tooltip —
unreadable: `Kbd` paints `--pp-color-text` on its own `bg-sunken` surface,
which is the page's, so inverse ink on a page-coloured chip. `Text` has no
surface of its own and would have needed the redefinition. One of the two
loses, and the one that loses is the one a tooltip has no reason to hold:
a tooltip's content is plain text, `Text` in a tooltip is a "don't", and
`Kbd` keeps its own surface — on a near-black tooltip a light chip reads
as a key, which is the point of it.

### 3. Scroll-then-focus opens a tooltip and closes it a frame later

Half the browser suite failed on the first run with the tooltip found in
`data-state="closed"` or not found at all, and the sides test passed for
no reason it could name. A scroll event is dispatched on the frame after
the scroll, and Radix closes a tooltip when an ancestor of its trigger
scrolls (spec §6). `scrollIntoViewIfNeeded()` followed by `focus()` in one
breath therefore opens the tooltip and closes it one frame later; the sides
test passed only because its triggers were already in view. The suite's
`focusToOpen` waits two frames between the two. Same family as D-062 §2's
stale server: when a test fails, establish which side is wrong before
changing either, and "the harness" includes the order it does things in.

### 4. A controlled tooltip's "toggle" button re-opens it

The controlled demo had one button flipping `open`. The press on it is an
outside press, and the dismissable layer tells the owner `onOpenChange(false)`
**before** the click handler runs — so a flip reads "closed" and sets
`true`, and the tooltip never closes from that button. The demo has two
buttons that each *say* a state. Recorded because the same shape — an
outside control that toggles a dismissable overlay — will come up at
`Dialog` and `DropdownMenu`, and the answer is the same: say the state,
do not flip it.

### 5. One `pointermove` on a neighbour is swallowed while the pointer is "in transit"

Playwright's `hover()` moves the mouse in one jump. Leaving the first
trigger opens Radix's grace area towards its panel and marks the pointer in
transit; the single `pointermove` that then lands on the neighbour reaches
the neighbour's handler *first* (React's root listener) while transit is
still set, and is ignored — the document listener that clears transit runs
after it. A real hand produces dozens of events; the second one opens the
neighbour. The test moves in ten steps, and the unit test fires the
document-level move before reaching the neighbour, which is the order a
pointer takes. Neither is a workaround: a one-event sweep is not a thing a
pointer does.

### 6. Verified, as the spec promised (§8) rather than assumed

- **A natively disabled trigger opens its tooltip in Chromium.** The
  browser fires `pointermove` on a disabled `<button>`; the docs page states
  it, with Firefox named as the browser that does not.
- **Three `defaultOpen` tooltips coexist** in the Matrix. A default open
  dispatches no `tooltip.open` event.
- **`instant-open` skips the entry animation and `delayed-open` plays it**,
  measured under `reducedMotion: 'no-preference'` — the config pins
  `'reduce'` for every other test, which is right, and would have hidden
  the one thing §4 rests on. Two tests lift the pin and nothing else does.
- **The z-index token reaches the element that stacks**: 1400 on the panel
  and on Radix's wrapper.
- **Tree-shaking.** The chunk holding `@radix-ui/react-tooltip` (18,061
  bytes) is referenced by the Tooltip page's payload and by none of the
  Button, IconButton or Popover pages', checked by chunk name in the
  prerendered HTML as D-062 §6 did.
- **axe's `region` rule flags a portalled tooltip**, on the whole body,
  because it sits outside every landmark — by design, and a popover passes
  the same rule only because axe exempts a dialog. The unit assertion
  disables that one rule with the reason beside it; the role, the
  description and the name it must not replace stay asserted.

### 7. Five browser breaks and one unit break, each caught by the test named for it

Applied together and run once: `directionOf` pinned to `ltr` (the RTL
test); the theme attribute dropped from the panel (the theme test, and the
gallery test with it); the `z-index` line (the stacking test: `auto`
against `1400`); the reduced-motion rule (that test: `pp-tooltip-in`
against `none`); the `instant-open` rule (both motion tests). Two others
failed as collateral — a panel measured mid-animation is 0.96 of its width
— which is what makes a combined run a check on the named tests and not
on the failure count. In the unit suite, the fallback provider removed
makes every no-provider test throw Radix's own error, the named one among
them. The break the spec recorded in advance as not observable — a bare
`4` in place of `resolveSpace` — was not run: D-062 §7 ran it for the same
mechanism and it was not.

<a id="d-066"></a>

## D-066 — An authoring run masked a regression, because `git status` cannot see a mismatch; the index page's baseline is tied to the registry; a placed box is a still box

**Date:** 2026-09-27 · **Status:** accepted · **Amends:** `.github/workflows/ci.yml`
(classify step); `scripts/record-dimensions.mjs` (`--rebaseline`, the index
count); `tests/unit/screenshot-dimensions.test.ts`; `tests/visual/harness.spec.ts`
(Popover and Tooltip side tests); `.claude/skills/component/SKILL.md` (build
step) · **Extends:** D-013, D-017, D-042, D-054 §2, D-063 §3

Asked for after the Tooltip PR's visual job went red on a re-run of the
authoring commit: "make sure it doesn't ever happen again". Three things,
each fixed where it lives.

### 1. CI's "changed" was false on every run that ever happened

The visual job classified a run by `git status --porcelain` on the
baseline directory: untracked files meant "a new test asking for a
baseline", modified files meant "a regression". But Playwright never
modifies a baseline it disagrees with — it writes `<name>-actual.png` and
`<name>-diff.png` under `test-results/` and leaves the committed file as it
was. `git status` on that directory can therefore only ever see new files;
`changed` had been `false` since D-017 wrote it, and the regression check
was reached only on a run with **no** new files.

So run 128, which added `Tooltip`'s two baselines, reported the index page
19px taller in both themes, then classified the run as "new only",
authored the two tooltip baselines and pushed — with the check that would
have failed it skipped. The authoring commit triggers no run (D-042), and
the next one, a manual re-run, had no new files and failed on the index.
The regression had been on the branch for an hour with a green tick.

The classify step now reads the mismatch from Playwright's own output: a
`-diff.png` anywhere under `test-results/` is a regression, and nothing is
authored on a red run. A missing baseline writes `-actual.png` alone, so
the two cases are told apart by the one file only a mismatch produces.

### 2. The index page's baseline records how many components it listed

The failure itself was legitimate: the index draws one card per registry
entry (D-063 §4), `Tooltip` added one, and its baseline had to move. But a
component's PR never touches the index page, so nothing said so, and the
component's own baseline — the one the Definition of Done names — cannot
catch it. Two additions:

- `npm run dimensions` writes `components: N` beside each index entry's
  geometry, and `tests/unit/screenshot-dimensions.test.ts` fails when the
  registry lists a different number than the baseline was authored with,
  naming the command. This runs in `npm test`, locally and in the checks
  job, before any browser is involved.
- `npm run dimensions -- --rebaseline <page>` is the deliberate re-baseline
  as one command: it deletes the page's two baselines *and* their manifest
  entries in the same step, so the window between deleting and re-recording
  is one the guard skips rather than one it fails — the red run D-063 §3
  accepted by design is no longer part of the procedure. The `/component`
  skill's build step now says: adding the registry entry means running it
  in the same commit.

### 3. A placed box is a still box

The same re-run also reported the RTL half of the Popover **and** Tooltip
side tests failing with the panel's box at x = 0, then passing on retry.
Radix parks a panel at `translate(0, -200%)` until floating-ui has placed
it, and `toBeVisible` is satisfied by an off-screen box, so a read in that
window is the origin. The Tooltip test had already waited for the parking
transform to go; it was not enough, which says the first placed position
is not always the final one. Both suites now read the box through one
helper that trusts it only once x and y are positive and unchanged across
two reads a frame apart. This was a flake in the harness, not in either
component, and it predated `Tooltip`: the Popover test was unchanged.

<a id="d-067"></a>

## D-067 — Gate C for 4.4 `Dialog` approved by delegation; a modal's scrim is the other half of the overlay exception

**Date:** 2026-09-27 · **Status:** accepted · **Amends:** RULES §1 (the
`Container` consequence); `.stylelintrc.json`; `docs/specs/Dialog.md`
(status) · **Extends:** D-057, D-061 §3, D-064 §4

### 1. Approved by delegation, the fourth time

The spec went to Gate C with eight open questions and a recommendation on
each. The approval was **"Build it so it's pixel perfect"** — a delegation,
recorded as D-057, D-061 §2 and D-064 §1 recorded the others: one pair of
eyes, every recommendation adopted as written. No `modal` prop (§2);
`--pp-measure-sm` and no `size` (§3); the scrim scrolls and the panel does
not (§4); `DialogTitle` is a `<div>` (§6); no automatic close button (§5);
`aria-modal="true"` written by us (§6); the no-trigger focus restore (§7);
the gallery in contained cells (§10). What that means for the build is
D-057's list, and the spec's §11 names what is checked first.

### 2. A modal's scrim is the viewport-sized box, and `inset: 0` is how a box is that box

D-061 §3 let an overlay panel declare a ceiling because it has no parent in
flow to size it. A modal has the same problem one level up: the box the
viewport gives it — the scrim, which positions the panel, dims the page and
scrolls when the panel is taller — is a box nothing in flow provides. So a
scrim may declare `position: fixed; inset: 0`, logical and one property,
and that is the exception's other half. RULES §1's consequence says so;
`.stylelintrc.json`'s overlay override (`max-inline-size` allowed, nothing
else relaxed) names `Dialog.css` as it named `Tooltip.css` (D-064 §4).
Nothing in flow ever qualifies, and the panel itself declares no position:
it is a grid item, centred by the scrim.

<a id="d-068"></a>

## D-068 — `Dialog` build findings: a hug panel is as wide as its content asks, an explicit `undefined` erases what Radix wired, and a page a dialog hides is a page a role locator cannot see

**Date:** 2026-09-27 · **Status:** accepted · **Amends:**
`docs/specs/Dialog.md` §3, §11, Usage; `docs/components/Dialog.md`

The first modal. Seven findings; two corrected the spec, one corrected the
first draft of the component, and the rest are what the spec promised
would be verified.

### 1. A hug panel is as wide as its content asks, not as wide as its ceiling

The spec's gallery section said the wide cell would show the panel "at its
40rem ceiling with scrim on either side". It showed it at 26rem: a hug panel
is a grid item sized by its content's max-content width, and a title, a
one-line description, a `Field` and two buttons ask for about 416px. That is
the contract working, not failing — `Popover`'s "a two-button confirmation
is two buttons wide" — and the spec's own §3 argument ("a dialog holding a
`Field` would grow to the viewport") was wrong about *why* the ceiling is
needed: a `fill` child cannot widen a hug parent; a paragraph can. The
gallery's description is now a sentence long enough to want more than
40rem, so the wide cell shows the ceiling and the narrow cells show the
shrink; the docs page says a short form is about 26rem and a paragraph
reaches the ceiling.

### 2. `min-inline-size: 0` lets the panel shrink; `overflow-wrap` is what makes the string wrap

Spec §3 said `min-inline-size: 0` keeps an unbreakable string from pushing
the panel past its ceiling "instead of wrapping inside it". Half right: it
lets the panel shrink below its content's minimum, and the string then runs
*out* of the panel, because nothing told it to break. `overflow-wrap:
anywhere` on the panel is the other half, and a dialog that shows a path or
a URL — a rename, a share — needs it. Both are declared; the 320px test puts
one such path in the description and asserts the panel's `scrollWidth`
does not exceed its `clientWidth`. Dropping either fails it.

### 3. An explicit `undefined` erases what Radix wired

The first draft passed `aria-label={ariaLabel}` and
`aria-labelledby={ariaLabelledby}` to Radix's `Content` unconditionally.
Radix sets `aria-labelledby` to its Title's id *before* spreading the
consumer's props, so an `aria-labelledby={undefined}` after it erased the
name: every titled dialog was nameless, and axe said so
(`aria-dialog-name`) before any human would have. Both are now spread only
when given — the `exactOptionalPropertyTypes` pattern every Tier 4 root
already uses for Radix's optionals, seen from the other side. A prop
forwarded as "whatever the caller passed" is not the same as a prop not
forwarded.

### 4. A page a dialog hides is a page a role locator cannot see

Radix's `aria-hidden` sweep removes everything outside the panel from the
accessibility tree, and Testing Library's `getByRole` and Playwright's
`getByRole` honour it: the trigger a test just clicked stops resolving the
moment the dialog opens, and a test that holds a role locator for it hangs.
The unit suite reads the owner's `<output>` by text while the dialog is
open; the browser suite's `open` helper returns the trigger as a text
locator. On the docs page, because a consumer's test hits the same thing on
its first `getByRole` after opening.

### 5. Verified, as §11 promised

- **`contain: layout` holds the scrim to the cell**: each gallery scrim's
  box is its stage's box, and each panel is centred in its stage, at all
  three widths.
- **A page under three scroll locks is still a page**: its `scrollHeight`
  exceeds the viewport, so the full-page capture has a height to capture.
  The capture itself is CI's (D-013).
- **Radix's close handler is as read**: with the restore removed, a
  trigger-less dialog's close lands focus on `<body>`, in jsdom and in
  Chromium (the break checks below).
- **The RTL scrollbar compensation** measured 0: headless Chromium hides
  scrollbars, so there was nothing to compensate. The source of
  `react-remove-scroll-bar` writes `padding-right` and `margin-right`
  unconditionally, so on a classic scrollbar under `dir="rtl"` the page
  shifts by the bar's width while a dialog is open. Recorded on the docs
  page as a gap, per spec §9; there is no switch for it.
- **The sweep and a portal from inside**: a `Popover` opened from the open
  dialog is found by a role query (so it is not hidden) and is at
  `--pp-z-popover`, above the scrim; a second `Dialog` is a later sibling
  at the same `--pp-z-overlay`, and Escape closes only it.
- **axe passes on an open dialog with no rule disabled**, in both themes.
  The `region` rule D-065 §6 had to switch off for a tooltip does not fire:
  a dialog is exempt, and the scrim has no content of its own.
- **Tree-shaking**: the chunk holding `@radix-ui/react-dialog` (22,011
  bytes) is referenced by the Dialog page's payload and by none of the
  Button, Popover or Tooltip pages'.

### 6. Two usage typos in the spec

`justify="space-between"` is `between` in this library's `Justify`
vocabulary, and `Heading`'s `size` is `sm`, not `"4"`. Corrected in the
spec's usage block; the playground and the docs page use the real names.

### 7. Six browser breaks and two unit breaks, each caught by the test named for it

The first combined run was a wash: dropping the reduced-motion rule slowed
every gallery dialog's exit, the helper that closes the gallery pressed
Escape three times faster than three exits, and thirteen tests failed on
setup. The helper now waits each dialog out before the next press — an
exit still running is still the topmost layer — and the breaks ran in two
rounds. Round one: the panel's `z-index` (the layer test, `auto` against
`1100` — observable after all, because the assertion compares the computed
value to the token, not two elements to each other); the theme attribute
(the theme test); the grid centring replaced by the logical `translate`
(the RTL test: the panel never settled at a placed position — off the left
edge, a full width off centre, as spec §4 predicted); `min-inline-size: 0`
and `overflow-wrap` (the 320px test, 41px too wide); the no-trigger restore
(the focus test). Round two: the reduced-motion rule alone (that test). In
the unit suite: `aria-modal` (the name test) and the restore (the
no-trigger test). Collateral failures — the tall-dialog test once the panel
was `position: fixed` and no longer overflowed the scrim, the gallery's
wide panel mid-animation — are what a combined run costs and why the named
test is what is read.

<a id="d-069"></a>

## D-069 — A standing delegation for the rest of the roadmap; a component waiting only on its CI-authored baseline does not hold the WIP limit; one parked idea

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `.claude/skills/component/SKILL.md`
(Gate A, Gate C); ROADMAP.md (WIP limit, a parked idea) · **Extends:** D-014,
D-057, D-061 §2, D-064 §1, D-067 §1

### 1. Gate C is satisfied in advance, for every remaining item

Four components in a row were approved by delegation with the same words,
and the user has now said so for the rest: *"Tired of approving single
components. Just build and keep in mind the pixel perfect mentality."*
That is a standing delegation. Gate C's purpose — a second pair of eyes on
an API before it is permanent — is not served by asking a question whose
answer is known, so from here:

- **Every spec is still written**, to the template, with its decisions and
  its open questions each carrying a recommendation. The spec is the
  record a reversal is made against and the document the build is checked
  against; none of that depends on who approves it.
- **Every recommendation is adopted as written**, and the build starts in
  the same session. The spec's decisions are listed in the PR body, as
  D-061 §2 required for a spec written after its delegation, so the user
  reverses before merge what they would have reversed at the gate.
- **The assumptions a spec names are still checked first** (D-057), and a
  ruling the spec did not anticipate is still a DECISIONS finding.

The delegation ends when the user says so, or when a spec would bend a
RULE: that still stops and asks, because a rule is not a default.

### 2. A component whose only open box is the CI-authored baseline does not count against the WIP limit

The WIP limit is one item in `build` or `review`. Since D-013 every
component sits in `review` for one box it cannot close itself — the
baseline CI authors on the next run — and that wait is CI's, not the
work's. Holding the next build for it serialises components behind a
five-minute job. So: an item in `review` with every box checked but the
baseline (and, from D-066, the index re-baseline that rides with it) does
not hold the limit. One PR may then close several components with one
authoring run and one recording commit. Everything else about the limit
stands: one item in `build` at a time, and a `review` with any *other* box
open still holds it.

### 3. Parked: a modifier key that composes the components' display

The user's idea, recorded so it is not lost: holding a modifier (Ctrl, or
another) while using the page would switch the components into
combinations that expose more of what they can do, in one simple gesture.
Parked at the user's request until the components exist; when it is
picked up it is a Tier 6 item with a spec of its own, because it touches
every component's state vocabulary (RULES §4) at once.

<a id="d-070"></a>

## D-070 — `AlertDialog` build findings: one stylesheet draws two components, and a Cancel-less alert dialog leaves focus outside its own trap

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/AlertDialog.md`
(status) · **Extends:** D-030 §10 (IconButton's two classes), D-068

Built under the standing delegation (D-069 §1), every recommendation
adopted. Three findings, none against the spec.

### 1. Two classes per part is how one stylesheet draws two components

`AlertDialog` is `Dialog` with two rules changed, and its parts carry
Dialog's class first and their own second (`pp-dialog pp-alert-dialog`),
the way `IconButton` carries `pp-button pp-icon-button`. `AlertDialog.css`
is one rule — the smaller ceiling, through its own property. The browser
suite asserts the contract by what it *buys*, resolved: the scrim is the
viewport, the layers are the tokens, the motion is `none` under reduced
motion; dropping `pp-dialog` from the panel fails that test (`auto`
against `1100`). The alternative, a copy of Dialog.css, is the drift
D-045 wrote about: two files that must agree and nothing that checks it.

### 2. Without a Cancel, Radix leaves focus outside the trap

Radix's alert dialog prevents the focus scope's autofocus and focuses its
Cancel part. With no Cancel rendered that is `undefined?.focus()` and
focus stays on the trigger — *outside* a trapped scope, with the rest of
the page `aria-hidden`. The panel now takes focus itself in that case, and
development warns that a Cancel is missing: a decision the user cannot
decline is not a decision. The break check (fallback removed) fails the
named test with focus still on the trigger.

### 3. Verified

Focus lands on Cancel and returns to the trigger; a scrim press leaves the
dialog open and presses nothing under it; Action closes after its
`onClick`; the gallery's three scrims are the size of their cells; axe
passes with no rule disabled on `role="alertdialog"`. The chunk holding
`@radix-ui/react-alert-dialog` (14,028 bytes) is referenced by the
AlertDialog page's payload only. 13 unit and 5 browser assertions; one
browser break and two unit breaks, each caught by its named test.

<a id="d-071"></a>

## D-071 — `Drawer` rulings and build findings: a token on the anchored axis, no new package, and Radix's scroll lock strips a padded body of its gutter

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/Drawer.md`
(status), the playground's root layout · **Extends:** D-061 §3 (the overlay
sizing exception), D-067 §2, D-068, D-070 §1

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. Two rulings the spec relies on, then the findings.

### 1. The anchored axis is a token, not the content's

D-061 §3 lets an overlay take a `max-inline-size` from the measure scale
because nothing in flow constrains a portalled box. A sheet needs the
exception one step further: an edge-anchored panel has one dimension the
viewport gives it (a side drawer is the full height) and one that must be
*chosen* — and a hug panel around a navigation list, a `Stack` of `fill`
items, would be as wide as its longest label. So `.pp-drawer` declares
`inline-size: min(var(--pp-drawer-size, var(--pp-measure-xs)), 100%)` for
`start` / `end`, and `block-size: min(var(--pp-drawer-size, 50%), 100%)`
for `top` / `bottom`: a length on the anchored axis, logical, from the
measure scale, capped at the scrim. `.stylelintrc.json` names `Drawer.css`
in the group allowed `inline-size` and `block-size`, the D-019 shape. The
tokens are the escape; there is no `size` prop, for Dialog §3's reason.

### 2. No new package: a drawer is Dialog's primitive, placed

Radix has no drawer. 4.1 §2's "one package per component" was written for
primitives Radix has; for one it does not, the reading is: build on the
package the nearest component already brought in, when the semantics are
its semantics. A drawer is a modal dialog with a different placement —
same role, trap, lock, layer and escape — so it is `@radix-ui/react-dialog`
with its scrim carrying `pp-dialog__scrim pp-drawer__scrim` (D-070 §1's
two-class contract), so Dialog.css draws the viewport box, the layer, the
fill, the fade and the scrim's reduced-motion rule, and `Drawer.css`
changes only the placement, the gutter and the panel. A third-party
drawer with drag physics (vaul) was the alternative and is declined: a
drag-to-dismiss gesture is a surface of its own, and the primitive is
already the drawer minus placement. The build adds no chunk: the Drawer
page's payload references the chunk Dialog's does.

### 3. The side resolves at open time, so the thing that resolves it mounts at open time

`start` / `end` resolve against the trigger's direction (4.1 §5). The first
draft resolved them in `DrawerContent`, which is mounted with the page,
so a `dir` set after load — the RTL browser test sets one — never reached
it, and `start` was on the left in a right-to-left page. The surface
(scrim and panel) is now one component rendered as the portal's child, so
it mounts when the drawer opens; it resolves the side in a layout effect
on mount, before paint. The rule for the tier: **resolve a logical side
in a component that mounts on open, never in one that mounts with the
page.** `Popover` and `Tooltip` were never exposed — Radix positions them
on open — but a placement this component owns is its own to time.

### 4. Radix's focus scope skips links when it auto-focuses on mount

A navigation drawer's first tabbable is a link, and Radix's `FocusScope`
removes links from its mount-autofocus candidates (`removeLinks`), so the
first focus is the first *button* — here, `Close`. The APG asks for the
first focusable; Radix's reading is that a link auto-focused and then
`Enter`-ed navigates away from a dialog the user did not read, which is
defensible, and it is what every other Radix dialog does. Recorded, not
fought: the unit and browser tests expect `Close`, and the docs page says
where focus lands. A consumer who wants the link takes `onOpenAutoFocus`.

### 5. The reduced-motion rule needs the side in its selector

`Drawer.css` sets the entry animation per `[data-side]` at (0,2,0). The
first draft's reduced-motion rule was a bare `.pp-drawer { animation:
none }` at (0,1,0), which lost, and two tests said so: the motion test
read a keyframe name, and the gallery test measured a panel mid-slide.
The rule is now `.pp-drawer[data-side], .pp-drawer[data-state="closed"][data-side]`.
Same lesson as D-062 §5 from the other side: an `animation` set on a
qualified selector must be unset on one at least as qualified.

### 6. Radix's scroll lock rewrites a padded body's gutter to zero

Every Radix modal mounts `react-remove-scroll`, whose scrollbar
compensation styles `body[data-scroll-locked]`. In its default gap mode
it reads the body's **margins** and writes them as the body's **top, left
and right padding** (`padding-left: 0px; padding-top: 0px; padding-right:
0px` for the usual `margin: 0`), plus `position: relative`. A page that
carries its gutter on `<body>` — the playground did, `padding:
var(--pp-space-6)` — loses it while a Dialog, AlertDialog or Drawer is
open: the content shifts up and left by the gutter, the document shrinks
by it, and a page scrolled to its end has its `scrollY` clamped. The
Drawer's tall-panel test caught it as the clamp (the trigger sits at the
bottom of the page); Dialog's counterpart never scrolled that far and
never saw it, and neither did the eye, because the scrim covers the shift.

Three things follow. The library cannot undo it: no CSS can restore an
author's declared value from another rule, and Radix's dialog exposes no
`RemoveScroll` option. The playground pads a wrapper (`.shell`, the body's
former padding box, so every baseline's geometry is unchanged) and the
body has `padding: 0`. And the Dialog docs page — the one AlertDialog's
and Drawer's defer to — records the gap next to the RTL scrollbar one:
**put the page gutter on a wrapper inside the body, never on the body.**
The Drawer's tall test now also asserts the document's height across the
open, so a future lock that shrinks the page fails by name.

*Amended the same day, from CI run 141:* the Dialog page's baselines,
authored on run 137, had been captured **under the lock** — the gallery's
three modal dialogs are open at load, so the page in the PNG had lost its
top and left gutter — and the moved gutter changed them by exactly that.
CI classified it as a regression and authored nothing (D-066 §1 doing
its job). The pair is re-baselined (`npm run dimensions -- --rebaseline
dialog`) so CI authors them again with the gutter where it belongs; the
AlertDialog and Drawer pages, whose galleries are modal too, had no
baseline yet and are authored right the first time.

### 7. The facing edge is an inset shadow

The edge a drawer shows the page carries a hairline; the edge on the
viewport is flush. That is one physical border side (`border-left` for a
drawer on the right), and RULES §1 bans the physical border properties
with no logical spelling of "the edge away from the viewport". So the
hairline is an inset `box-shadow` of `--pp-border-width-1`, in the same
declaration as the elevation shadow; the panel's corners are rounded on
the same side. Physical, like `data-side`, because the side already was.

### 8. Verified

Each side is flush with its edge, the token on the anchored axis and the
viewport on the other; `start` is on the right under `dir="rtl"`; a side
drawer at 320px is the full width; a tall panel scrolls itself, the scrim
does not, and the page keeps its height and offset across open, wheel and
close; focus lands on `Close` and returns to the trigger; the panel's
animation is `none` under reduced motion; the theme crosses the portal;
the gallery holds three, contained. 14 unit and 7 browser tests; four
browser break checks (`justify-items: right` dropped, `resolveSide`
pinned to LTR, the side drawers' `inline-size` dropped, the reduced-motion
rule dropped), each caught by its named test.

<a id="d-072"></a>

## D-072 — `DropdownMenu` rulings: `align` starts, `data-highlighted` joins RULES §4, and one stylesheet's three allowances

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/RULES.md` §4
(the attribute list), `.stylelintrc.json`, `docs/specs/DropdownMenu.md`
(status) · **Extends:** D-061 §3 and §5, D-062 §2, D-070 §1, D-071 §3 and §6

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. Three rulings the spec relies on, then the
findings.

### 1. A menu's `align` defaults to `start`

The tier's table (4.1 §5) gives `align` the default `center`, and `Popover`
took it. A menu is a list read from its start edge: centred under a short
trigger its labels begin left of the button and its far edge hangs past
it, and every native menu hangs from the trigger's start edge. So
`DropdownMenuContent` defaults `align` to `start` — the one component
default that departs from the table, and the table's own words allow it
("per component"). `side` stays `bottom`, `sideOffset` is one step (four
pixels: a list belongs to its button more closely than a panel does).

### 2. `data-highlighted` is the fifth data attribute of RULES §4

Radix writes `data-highlighted` on the row the pointer is over or the
arrow keys reached, and moves DOM focus there. RULES §4 named eight
attributes and the `data-state` values; the highlighted row is a state
none of them carries, and it cannot ride on `data-state`, because a
checkable row's `data-state` is `checked | unchecked | indeterminate`.
Added to the list, for a menu now and a listbox (4.11) later: the row's
highlight is one attribute, wherever a row can be highlighted. Styled as
the soft Button's hover pair, and the focus ring joins it under
`:focus-visible` — the browser's heuristic keeps the ring off
pointer-driven focus, so a mouse user sees the fill alone and a keyboard
user sees both. No `outline: none` was needed anywhere.

### 3. Three allowances for one stylesheet, and why each

`.stylelintrc.json` gains a `DropdownMenu.css` override: `max-inline-size`
(the overlay exception, D-061 §3, as for Popover), `inline-size` (the two
marks — the check, the dot — and the chevron are sized boxes, as Icon's
and Checkbox's are, D-019's shape), and `margin-inline-start: auto`,
which no component file had. The shortcut and the chevron sit at the end
of a row whose *other* children are the consumer's, in any number, so
neither a grid template nor `justify-content` can place them without
wrapping what the consumer wrote; `auto` on the trailing child is the one
declaration that does, and Container's override already admits `auto` for
the same reason (centring is a margin's job). RULES §2's "no outer
margins" is about a component's own edges, and this margin is inside one.

### 4. The gutter exists only where a mark can appear

A menu mixing plain and checkable rows must align its labels, and a menu
of plain commands must not carry an empty column. `:has()` on the panel —
`.pp-dropdown-menu:has([role="menuitemcheckbox"], [role="menuitemradio"])`
— sets one custom property that every row and label read as their
start padding. `:has()` is in every browserslist target and `Select` and
`Radio` used it first. The browser suite measures both menus: eight pixels
in the plain one, twenty-eight in the mixed one, on every row and label.

### 5. The direction goes up to the root as Radix's `dir`

For a popover the direction resolves one prop. For a menu it decides which
arrow key opens a submenu, which closes it, which side the submenu appears
on and how the roving focus group reads its keys — all of them Radix's,
all keyed on the root's `dir`, which Radix otherwise assumes `ltr`. So the
root holds `dir` as state and the content, mounted on open (D-071 §3),
reads `directionOf(trigger)` in a layout effect and sets it. The RTL row
of the playground opens its submenu to the left on `ArrowLeft`, its
chevron flipped by the `dir` Radix writes on the panel, with nothing said
by the caller. `SubContent`'s `alignOffset` is minus its own top edge
(border and padding, read from the element), so the first sub-item sits on
its trigger's row whatever `--pp-dropdown-menu-padding` a consumer set.

### 6. The uncontrolled half is ours

Radix's `CheckboxItem` and `RadioGroup` are controlled-only. RULES §5.5 has
no exceptions, so both take `defaultChecked` / `defaultValue` through
`useControllableState`, the Tier 3 hook, and the indicator reads the
resolved value from a context of ours rather than from Radix's — which is
also what lets an indicator with no children draw the right mark (check,
dash, dot) for the row it is in.

### 7. Findings from the build

- **A key pressed before the entry focus lands is lost.** Radix focuses the
  first item a frame after the list mounts (its roving group's entry
  focus); the browser tests' opener now waits for that focus before it
  returns, or the next `ArrowDown` reaches the wrong row. Same shape as
  D-065's `focusToOpen`.
- **A modal menu hides the trigger from role queries** while it is open
  (D-068 §4 again): the opener returns a CSS locator, and the unit test for
  a controlled menu reads the trigger's text, not its role. The docs page
  says so under "Testing in jsdom".
- **axe's `region` rule flags any portalled menu** — the list lands in
  `<body>` outside every landmark, and unlike a `dialog` a `menu` is not
  exempt. Disabled for the open-menu check, with the reason in the test and
  on the docs page; the rules that matter (roles, names, `aria-*`) run.

### 8. Verified

The z-index token reaches Radix's wrapper and the list is named by its
trigger; `align="start"` puts the list on the trigger's start edge four
pixels below it; every row is 32px, a plain menu has no gutter and a mixed
one insets rows and labels alike with the mark in the gutter on the row's
centre line; the highlighted row is the hover token resolved and typeahead
moves it; the submenu opens on `ArrowRight` to the right in LTR and on
`ArrowLeft` to the left in RTL, its first item on its trigger's row, the
chevron flipped; `Enter` activates, closes and returns focus; an outside
press on a modal menu closes it and does not land; a long label wraps in
the ceiling and a long list scrolls itself with the page still; the theme
crosses; the gallery holds three. 16 unit and 10 browser tests. Break
checks in §9.

### 9. Break checks

Five, each caught by its named test: the `dir` hand-off dropped (the RTL
submenu opened on the wrong key, `toHaveCount` on the submenu failed); the
`:has()` gutter dropped (the alignment test and the gallery's inset); the
ceiling dropped (the long label ran past the measure); the reduced-motion
rule dropped (`animationName` was the keyframe); the submenu's
`alignOffset` zeroed (the first sub-item four pixels below its trigger's
row). The tone attribute's break is a unit test's (`data-pp-tone`).

<a id="d-073"></a>

## D-073 — `ContextMenu` rulings: a menu's parts are built once, Gate B under the batch, and a region that renders a `<div>`

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `.claude/skills/component/SKILL.md`
(Gate B), `docs/specs/ContextMenu.md` (status) · **Extends:** D-069 §2, D-070 §1,
D-072

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. The twelve parts of a menu are one implementation, in `src/internal/menu/parts.tsx`

Radix composes `@radix-ui/react-menu` twice — a dropdown menu and a
context menu — with different scopes, so `DropdownMenuItem` cannot render
inside a `ContextMenu`. But nothing in an item, a checkable item, a radio
group, an indicator, a group, a label, a separator, a shortcut or a
submenu is about how the menu opened. The D-070 §1 contract keeps the CSS
in one place; a second copy of 4.7's parts would have kept the *behaviour*
in two — the tone attribute, the uncontrolled halves, the indicator's
marks, the group's name, the submenu's row alignment — which is D-045's
drift with a different face. So an internal factory takes either Radix
namespace and returns the library's parts for it, typed against
`@radix-ui/react-dropdown-menu`'s shapes (the context menu's are the same
shapes with another scope), and each component exports them under its own
names with its own `displayName`s and guard message. Both components'
unit suites ran unchanged after the move. A `MenuPrimitives` interface is
the seam: a future menubar composes the same primitive and gets the same
parts.

### 2. Gate B reads a `review` waiting only on its baseline as `done`, under the batch

4.8 depends on 4.7, which was in `review` with every box checked but the
CI-authored baseline. D-069 §2 carved that wait out of the WIP limit
because it is CI's, not the work's; the same reasoning applies to Gate B,
whose purpose is that a dependent builds on a final API — and 4.7's API
was final. Holding 4.8 for two CI cycles (an authoring run, then a compare
run) would have serialised the batch behind exactly the wait D-069 §2
removed. Recorded in the skill's Gate B text, scoped to the D-069 batch;
outside it, `done` means `done`.

### 3. The trigger is a region that renders a `<div>`, through Radix's `asChild`

Radix's trigger is a `<span>`. A region wraps the thing the menu is about —
a card, a row, a canvas — which is block content, and an inline box around
block content is not a box a layout can reason about. The component
renders Radix's trigger `asChild` onto its own `<div
class="pp-context-menu__trigger">`, or onto the consumer's element with
`asChild` of its own: two slots deep, one element rendered, and Radix's
handlers, `data-state` and `data-disabled` land on it. It is *not* made
focusable: `Shift+F10` opens a context menu at the focused element, and
the thing inside the region is what should be focusable; a tab stop on a
box that does nothing when focused is a cost every keyboard user pays.
The docs page says so twice, and once more that every command in a
context menu needs a visible way in.

### 4. No stylesheet, no `side`, and Radix's two pixels

`AlertDialog` changed two rules and had a two-rule file; this component
changes none and ships no CSS file — a file that changes nothing is where
drift starts. Radix places the list to the right of the press point,
aligned to its top, flipping at collisions, fixed inside its content in
physical terms, which is how every platform opens a context menu in every
direction; so `Content` has no `side`, `align` or `sideOffset`. Radix's
own `sideOffset: 2` is hardcoded in its source and cannot be tokenised
from here: the list starts two pixels right of the pointer, recorded as
Radix's number, not ours.

### 5. `defaultOpen` exists because RULES §5.5 has no exceptions

Radix's root has no `defaultOpen` — a context menu has no point to open at
until a press. The root holds `open` through `useControllableState` and
hands Radix the controlled pair, so both halves exist; `defaultOpen` opens
the list at the document's origin, which the docs page calls of little
use. What the pair is for is closing from outside.

### 6. Findings from the build

- **A list opened at a point is anchored to viewport coordinates**, so in
  a 900px viewport the gallery's lower lists are shifted up to fit. The
  full-page screenshot resizes the viewport to the page and floating-ui
  re-places them at their points — D-062 §2's finding for Popover, from
  the other side. The gallery test sets a tall viewport so it measures
  what the screenshot shows; the gallery opens each list with a
  `contextmenu` event dispatched at a point inside its region after mount,
  since `defaultOpen` has no point.
- **Opened from the keyboard, the entry focus lands on the first item**
  (Radix's `isUsingKeyboardRef`), so `Shift+F10` then `Enter` activates
  the first command; opened by a press, the list itself holds focus and
  the first `ArrowDown` reaches the first item. Both tested.
- **A submenu needs room on its side**: pressed near a region's left edge
  in the RTL row, the submenu had none on the left and flipped right; the
  test presses near the right edge. Not a bug — the collision handling
  doing its job — but a thing a test must know.

### 7. Verified

A secondary press opens the list at the pointer (its top-left two pixels
right of the point) with 4.7's row height and the z-index token on the
wrapper, and the region reports `data-state`; `Shift+F10` on the focused
region opens it with the first item focused, `Enter` acts, closes and
returns focus; the RTL region's submenu opens on `ArrowLeft`, to the left,
the chevron flipped; a disabled region opens nothing and a controlled one
closes from outside; the theme crosses; the gallery holds three, each at a
point inside its region. 9 unit and 6 browser tests; three break checks
(DropdownMenu's class dropped from the content — the z-index read `auto`
and the row lost its height; the `dir` hand-off dropped — the RTL submenu
opened on the wrong key; the region as Radix's `<span>` — the unit test),
each caught by its named test.

<a id="d-074"></a>

## D-074 — `Tabs` rulings: `active | inactive` joins RULES §4, the page's direction is the component's, and a kept panel hides itself

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/RULES.md` §4
(the `data-state` values), `docs/specs/Tabs.md` (status) · **Extends:** D-061 §5
and §6, D-064 §3, D-072 §2

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The first Tier 4 component that is not an overlay.

### 1. `data-state="active | inactive"` is the selected-of-several state

Radix writes it on a tab and its panel. RULES §4 had `open | closed` for
shown-or-not and `on | off` for pressed; a selected tab is neither — its
panel is shown *because* it is selected, and it is chosen, not pressed.
Added to the vocabulary, the way D-064 §3 added the tooltip's two, and
for the same reason: a real state with no existing word. It is the pair
for anything that selects one of a set from now on.

### 2. Radix's `dir` attribute is removed, and its value is read at mount

Radix's tabs root writes `dir` on its element, `ltr` unless told, which
inside a right-to-left page flips the whole strip to left-to-right — on
the server, before any script could correct it. The root is rendered
`asChild` onto an element of ours that sets `dir={undefined}` after
Radix's props: Radix's Slot lets the child's value win, and an undefined
one is no attribute at all. The tabs inherit the page's direction, on the
server and on the client, with no flash. The value Radix's arrow keys need
(`ArrowLeft` is "next" in RTL) is read from the element in a layout
effect at mount and handed to Radix as `dir`, before paint. A direction
that changes after mount is not tracked, 4.1 §3's ruling for the theme.
The rule for the tier's non-overlays: **a component in flow never writes
a direction; it reads the page's when it needs the value.**

### 3. An inactive panel is an empty, hidden element, and a kept one hides itself

Radix renders every panel's element always — empty and `hidden` while
inactive, so `aria-controls` always resolves — and the children of the
selected one only. `keepMounted` (Radix's `forceMount`, named for what it
is for) keeps a panel's children rendered so a form does not lose what
was typed; but `forceMount` also drops `hidden`, and leaves two panels
showing: Radix expects the consumer to hide the inactive one. The
component does it: the root mirrors the selected value (Radix exposes it
to nothing outside its parts) and a kept panel sets `hidden` from the
mirror, so it is hidden exactly when a fresh one would be empty. Found by
the unit test, which asked for `hidden` and did not get it; the browser
test had passed by counting the *fresh* panel's `hidden` and was
corrected to count both.

### 4. The bar sits on the hairline: a pseudo-element hung one hairline past the edge

The list draws a hairline on its far edge; the selected tab draws a
two-pixel bar on the same edge. Adjacent, the two read as a three-pixel
bar where the tab is selected and one pixel elsewhere; overlapping, the
bar *is* the line for that tab's width, which is what every tab strip
means. A tab cannot extend into its list's border without a negative
margin (RULES §2), so the bar is `::after`: a zero-size box at
`inset-block-end: -1px` (the hairline's width, as a token) with a
two-pixel `border-block-end`, logical, so the column form uses
`border-inline-end` and `inset-inline-end`. The browser test reads the
pseudo-element's offset and the tab's and list's edges and asserts the
bar's outer edge is the list's outer edge.

### 5. The strip scrolls and the list grows

A row of tabs wider than its container must neither wrap nor overflow
the page. The list sits in a strip of the component's own, a
flex row with `overflow-x: auto`, and is a flex item in it: `flex-grow: 1`
makes it at least the strip, and a flex item's automatic minimum size —
its min-content, which for a row of non-wrapping tabs is all of them —
means it is never narrower than its tabs. So its hairline runs under
every tab and not only the visible ones. The first break check dropped
`flex-shrink` and caught nothing, which is how the minimum-size half was
found to be the mechanism; the checks now make the strip a block (the
list becomes the strip's width and its tabs overflow it) and drop
`flex-grow` (a short list's hairline stops at its last tab).
`min-inline-size: max-content` would say the same and is banned by the
value list. Not `Scroller`, which is a
labelled, focusable region for content and would add a tab stop a strip
does not need. The strip clips, so the tab's focus ring is inset.

### 6. Verified

A tab is the medium control height; the selected label is the text
colour and an unselected one muted, resolved; the bar is two pixels of
the accent's solid step with its outer edge on the list's; the arrows
select in automatic mode, skip a disabled tab, and `Tab` reaches the
panel; manual mode selects on `Enter`; at 240px the strip scrolls, the
page does not, and the hairline ends where the last tab does; the column
form is beside its panel with the bar on its inline-end edge and
`ArrowDown` moving; a kept panel keeps what was typed and a fresh one
does not, both hidden; the RTL strip reads right to left with no `dir` of
its own and `ArrowLeft` is next; the transition is none under reduced
motion. 10 unit and 6 browser tests.

### 7. Break checks

Five, each caught by its named test: the pseudo-element's overhang zeroed
(the bar's outer edge no longer the list's); the strip made a block (the
hairline stopped short of the last tab at 240px); the list's `flex-grow`
dropped (a short strip's hairline stopped at its last tab); the direction
pinned to `ltr` (the RTL strip's `ArrowLeft` went the wrong way); the
reduced-motion rule dropped (the transition measured). Two lessons on the
checks themselves: dropping `flex-shrink` caught nothing (§5), and a
mutation that leaves an import unused fails the library build the browser
suite's server runs first, which reads as the server not starting.

<a id="d-075"></a>

## D-075 — `Accordion` rulings: `multiple` not `type`, `collapsible` on by default, the heading level asked once, and a button that fills its heading

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/Accordion.md`
(status) · **Extends:** Alert.md §6, D-062 §5, D-074 §2 and §3

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The second Tier 4 component in flow.

### 1. `multiple` is a boolean, and the value's shape follows it

Radix's root takes `type: 'single' | 'multiple'`; RULES §5 reserves
`type`. So the prop is `multiple?: boolean`, and `AccordionProps` is a
discriminated union on it — `string` values and a `collapsible` for one,
`string[]` for many — so `onValueChange` is typed to match and a
consumer cannot hand a single accordion an array. The component
branches on it to give Radix the `type` it wants.

### 2. `collapsible` defaults to `true`

Radix's default is `false`: the strict APG reading, where exactly one
panel is always open and the open heading is `aria-disabled`. The
expectation a user brings is that a section they opened, they can close;
that is the default here, and `collapsible={false}` is the strict form.

### 3. The heading's level is the root's, once, and defaults to `3`

Alert.md §6 ruled that a component cannot know the right heading level,
and rendered a `div`. An accordion's headings *must* be headings (APG)
and are all one level, so the level is asked once, on the root
(`headingLevel`, `2`–`6`), and the trigger renders the heading around
itself — Radix's `Header` part folded into it, because a trigger outside
a heading is the one shape the pattern forbids and a part nobody may
omit is not a part. It defaults to `3`, unlike `Heading`'s required
`level`: an accordion under a page's `h2` is `h3` far more often than
not, and a wrong default here is an outline nit, not an inaccessible
control.

### 4. A button's `width: auto` is shrink-to-fit whatever its `display`; the heading is a grid

The first draft made the trigger `display: flex`, expecting a block-level
box to fill its heading. It did not: a `<button>`'s `width: auto` is
shrink-to-fit even as a block-level flex container, and the browser test
measured a label-wide button in a full-width item. A width is banned, so
the heading is `display: grid` and the button, its one grid item,
stretches to the track. The rule, for every full-width button the
library draws from here: **a button fills its parent as a grid item, not
by its own display.**

### 5. Findings from the build

- **Radix omits `aria-controls` on a closed trigger** (the region is in
  the DOM, empty and hidden, labelled by the trigger either way). The
  unit test asked for it closed and did not get it; it now asks for it
  open. Recorded on the spec and the docs page.
- **`forceMount` shows the panel**, as for Tabs (D-074 §3): the root
  mirrors the open value — a string or an array — and a kept panel sets
  `hidden` from it. A kept panel does not animate closed, because Radix's
  exit runs on unmount and a kept panel never unmounts; the docs say so.
- **Playwright will not press an `aria-disabled` control**: the strict
  accordion's open heading is one, and the test that proves a press does
  nothing forces the press.
- **A `Presence` exit under real motion keeps a closing panel's children
  mounted** for the duration, which the kept-panel test met when the
  reduced-motion rule was dropped for its break check: the fresh panel's
  input still held its value a frame later. Collateral of the check, not
  a defect (D-035 §3's note on combined runs).

### 6. Verified

The trigger is at least the large control height, fills its item, is an
`h3` with no margin and the body type size; the hairlines are one pixel
above the root and below each item; the chevron turns 180° on the open
item and its transition is none under reduced motion; the content's
animation is none, its overflow hidden, its padding on the body; single
opens one and closes the other and the open one closes, strict keeps one
open and marks it `aria-disabled`; the arrows move between headings and
skip a disabled one, `Home` / `End` reach the ends, `Enter` toggles;
multiple keeps two open under level-four headings; a kept panel keeps
what was typed, hidden while closed, and a fresh one empties. 12 unit and
4 browser tests; five break checks (the chevron's turn, the
reduced-motion rule, the heading's grid, the `hidden` mirror, `multiple`
ignored), each caught by its named test.

<a id="d-076"></a>

## D-076 — `Combobox` rulings: the consumer filters and is told why the text changed, a value from outside is named by `getLabel`, one allowance for the list's floor, and the listbox inside a presentation panel

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `.stylelintrc.json`,
`DropdownMenu.css` (the gutter selector), `docs/specs/Combobox.md` (status) ·
**Extends:** D-061 §1 and §3, D-070 §1, D-072 §2, D-073 §1

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The one Tier 4 component with no primitive under
its behaviour.

### 1. The consumer renders the options that match, and `onInputValueChange` says why the text changed

The component does not filter: it owns the text, the selection, the open
state, the highlight and the keyboard, and reports the text. A built-in
filter would need every label in JavaScript, a match rule, a debounce,
and would still be wrong for options from a server; rendering the matches
is one line over an array and makes the server case ordinary.

The first build reported the text alone, and the first test that selected
an option and reopened the list found one match: the text was the
selected label, and the consumer had filtered on it. So the callback is
`onInputValueChange(text, reason)`, `reason` being `input` (typed),
`select` (set to a label, or cleared, by a selection) or `value`
(following a value set from outside), and the documented pattern filters
on `input` only — after a selection the query is empty and a reopened
list shows everything. Downshift reports the same thing by the same
name; a combobox that does not filter has exactly this one thing to say.

### 2. A value from outside is named by `getLabel`

An option's label is read from it when it is chosen, which covers every
selection the user makes. A `defaultValue` or a controlled `value` set by
a form has no option to read — the list is closed and its children are
not mounted — so `getLabel(value)` names it, for the input's text and for
a token, and the value itself is shown without it. A registration
context cannot help: an unrendered option cannot register. Object values
(`{ value, label }`) were the alternative and are declined: strings post
in forms and compare, and a label is asked for only when the option is
not there.

### 3. The list's floor is Radix's anchor width, one value `.stylelintrc.json` admits

A list narrower than its field is a list that looks unrelated to it;
`min-inline-size: var(--radix-popper-anchor-width)` is the floor, and the
menu's ceiling sits above it — where the field is wider than the measure,
the floor wins, which CSS resolves in the floor's favour by rule. The
value list for `min-inline-size` allows `0` alone (RULES §1's intent: no
component sizes itself); the Combobox override admits this one value
besides, named, because it is the anchor's width and not the
component's. `DropdownMenu.css`'s gutter selector gains `[role="option"]`
so a listbox's options align like checkable rows: they can be chosen.

### 4. The listbox sits inside a presentation panel, and the empty row beside it

axe's `aria-required-children` (a real WCAG 1.3.1 failure) fails a
`listbox` holding anything but options and groups, and the consumer's
"nothing matches" row has to sit somewhere. So Radix's content — the
panel DropdownMenu.css draws, which Radix would make a `dialog` — is a
`presentation` wrapper with its `tabindex` removed, the options go in a
`listbox` of the panel's own (the input's `aria-controls`, the naming,
`aria-multiselectable`, `aria-busy`), and any `ComboboxEmpty` among the
list's children is rendered after it. Found by the axe test's "open with
only the empty row" case, which is why that case is in the test.

### 5. The listbox is named as its input is

A listbox needs a name (axe's `aria-input-field-name`, and the user's
ear). Read when the list mounts: the input's `aria-label`, or its
`aria-labelledby`, or the `<label>` it has — a `Field`'s — by id; and a
development warning when there is none. No `label` prop on the list: the
input is already named, and two names for one control drift.

### 6. Focus never leaves the input

The highlight is `aria-activedescendant` on the input and `data-highlighted`
on the option (D-072 §2's listbox, as promised), moved over the DOM's
enabled options when a key is pressed — so a consumer's filtering,
grouping and disabling are honoured with nothing registered — and a move
asked for before the list is mounted waits for the mount. The list
refuses `pointerdown`, so a press in it does not blur the field; Radix's
`onFocusOutside` is prevented outright (focus is always outside the
content) and `onInteractOutside` when the press is in the box. The
control's ring is the box's, through `:has()` on the focused input, so a
token's remove button rings itself.

### 7. Verified

The control is the medium control height, the list is at least the
control's width under a narrow field and exactly it under a wide one, and
the highlighted option scrolls into view down a long list; a press in the
list does not blur the input, a click takes, the box rings for the input
and a token's button rings itself and removes on `Enter`; a selected
option is marked in the gutter with every label aligned; the chevron
turns and is still under reduced motion; `loading` shows the spinner and
marks the listbox busy until the options arrive; the theme crosses; the
gallery holds three open lists, each its control's width. 13 unit and 5
browser tests. Break checks in §8.

### 8. Break checks

Five, each caught by its named test: the list's `pointerdown` refusal
dropped (a press in the list blurred the input); the floor dropped (the
list under the narrow field was narrower than it, and the gallery's
three too); `[role="option"]` dropped from the menu's gutter selector (a
selected option's mark sat on its label); the scroll-into-view dropped
(the seventeenth option was highlighted out of view); `getLabel` ignored
(a value from outside showed as its code, in the input and as a token —
the unit tests).

<a id="d-077"></a>

## D-077 — `Toast` rulings: an event, not an element; an `Alert` that floats; `live`, not `type`; and what Radix's announcer is

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `.stylelintrc.json`
(`Toast.css` in the `inline-size` group), `src/test/setup.ts` (pointer
capture), `docs/specs/Toast.md` (status) · **Extends:** Alert.md §2 and §5,
D-061 §3, D-070 §1, D-071 §1

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. One provider, one hook, no `<Toast>` element

A toast is an event, not a place in the tree. `ToastProvider` owns the
queue and the region; `useToast()` returns `toast`, `dismiss` and
`update`. Radix ships the element; this library ships the event, and
does not also export the element under its own names, because two APIs
for one thing are two APIs to keep in step. A progress toast is
`update(id, …)`, not a controlled element.

### 2. A toast is an `Alert` that floats

Every toast carries `pp-alert pp-toast` and its parts carry `Alert`'s
classes, so `Alert.css` draws the surface, the tone, the layout and the
dismiss button (D-070 §1, the third component drawn by another's
stylesheet) and `Toast.css` adds the region, the shadow, the motion and
the swipe. Alert §2's ruling is the reason this component exists — a
region that exists first and receives text afterwards is the reliable
announcement — and Alert §3 and §5 hold: the tone is never the only
signal, and there are no default icons.

### 3. `live`, not `type`; `limit` at three; the region a token wide at a logical corner

Radix's `type: 'foreground' | 'background'` is RULES §5's reserved word;
`Alert` already says `live: 'polite' | 'assertive'`, so the toast says
it too, `assertive` by default (a toast is almost always the result of
what the user just did). `limit` defaults to three, with the rest
waiting in order: a failing form must not wallpaper the screen. The
region is fixed at `placement` — logical, `bottom-end` by default — its
inline size `--pp-toast-width` (`--pp-measure-xs`) capped at the viewport:
D-061 §3's exception in D-071 §1's form, the anchored axis of a floating
box taking a token, with `Toast.css` in the `inline-size` group. The
region takes no pointer events; its toasts do.

### 4. The motion is from the block edge, and every placement stacks newest nearest its edge

A toast slides in from the edge it is anchored to — the block edge, so
top placements slide down and bottom placements up — and nothing in the
motion is physical; the swipe, Radix's, is the one physical thing and is
resolved from the region's direction at mount. The first draft reversed
the *bottom* lists to put the newest nearest the edge and had it
backwards: DOM order is oldest first, a bottom list grows upward from its
edge, so it already reads down to its newest; it is the *top* list that
needs `column-reverse`. The browser test measured the second toast above
the first, and the rule is now stated as the list growing away from its
edge.

### 5. What Radix's announcer is, and what the toast element is not

Radix renders a visually hidden `role="status"` region, `aria-live` per
`live`, holding the toast's text prefixed by the provider's `label`, for
one second on arrival and then not at all; the toast element itself
carries no live role, so it is not read twice. The spec's first draft
gave the element `role="status"` as well; the unit test asked for it and
Radix had not written it. Corrected in the spec, the docs and the test,
which now reads the announcer inside its second.

### 6. Findings from the build

- **jsdom has no pointer capture**, which Radix's swipe asks of the
  element under a pointer; `hasPointerCapture` and its two companions are
  stubbed in the test setup, as `scrollIntoView` and `ResizeObserver` are,
  and the docs page tells consumers to do the same.
- **No animation in jsdom means Radix's Presence unmounts a closing toast
  at once**; the provider still forgets it after the leave duration, read
  from `--pp-duration-fast` where the region sits.
- **Every provider on a page listens for the hotkey**, and each focuses
  its own list; the playground has eight, so `F8` there focuses the last
  registered. An app has one. The browser test finds whichever list took
  focus and dismisses a toast in it.
- **A closed toast's place is taken by a queued one**, so a test that
  counts open toasts after a dismissal counts wrong; it asserts the
  dismissed toast is gone instead.

### 7. Verified

The region is at the bottom-end corner, the token wide, its gutter the
token, taking no pointer events while its toasts do; a toast fills it;
the newest is nearest the edge; the `z-index` is the token; the motion is
none under reduced motion; the limit shows three of five and a dismissal
lets the fourth in; `F8` focuses a list, `Tab` reaches a toast's button
and `Escape` dismisses it; four placements sit at their logical corners
and `bottom-end` is the bottom left under `dir="rtl"`; the gallery holds
a toast per cell fixed inside its stage, the region the cell or the token
wide. 8 unit and 4 browser tests. Break checks in §8.

### 8. Break checks

Five, each caught by its named test: `pointer-events: none` dropped from
the region (the dead-zone read); the bottom list reversed (the newest
above the older); the limit ignored (five open, not three); the swipe
pinned to `right` (the right-to-left stage's toast said `right`); the
reduced-motion rule dropped (the enter animation measured, and the
gallery read no toasts mid-motion — collateral of the un-reduced run,
D-035 §3).

<a id="d-078"></a>

## D-078 — `CommandPalette` rulings: made of the tier, the first match highlighted, focus back to whatever had it, and `mod` decided when pressed

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `.stylelintrc.json`
(`CommandPalette.css` in the `inline-size` group), `src/internal/overlay/focus.ts`
(`always`), `docs/specs/CommandPalette.md` (status) · **Extends:** D-070 §1,
D-071 §1, D-073 §1 and §2, D-076 §4 and §6

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The last of Tier 4.

### 1. Made of the tier, and the listbox's highlight is one hook

No package is added: the modal and its scrim are Dialog's through the
two-class contract (`pp-dialog pp-command-palette`), the rows are
DropdownMenu's through its item class and the panel writing the row's
private variables (`--_row`, `--_inline`, `--_mark`, Toggle's device for
Button's), the shortcuts are `Kbd`s, and the highlight is Combobox's —
factored out of it into `src/internal/listbox.ts` (`useActiveOption`,
`optionsOf`) so both move the same highlight over the same DOM the same
way (D-073 §1's argument, for behaviour). Combobox's suite ran unchanged
after the move.

### 2. The first match is highlighted as the user types — the one place Combobox's rule is reversed

Combobox highlights nothing when its list opens (Combobox §4): its `Enter`
with nothing highlighted submits a form, and a first match taken by
surprise is a wrong city. A palette's `Enter` runs a command and its whole
point is `Enter` on the first result, so the list highlights its first
enabled item on open and on every change of the text. Same hook, opposite
default, each recorded.

### 3. Focus returns to whatever had it

`useFocusRestore` restored to the recorded element only when a modal had
no trigger (Dialog §7); a palette usually has a trigger *and* is usually
opened by its hotkey from wherever the user was, and Radix would then
send focus to the trigger button the user never touched. The hook gains
`always`: the element that had focus when the palette opened is the one
restored — the trigger when the trigger was used, the field the user was
in when the hotkey was. Dialog, AlertDialog and Drawer keep the old
reading; their suites ran unchanged.

### 4. `hotkey` once, `mod` decided when pressed; the palette sits high, a token wide

`hotkey="mod+k"` binds a document `keydown` that toggles the palette;
`mod` is ⌘ where `navigator.platform` says Apple and Ctrl elsewhere,
decided in the handler (RULES §7), and every other modifier must match
exactly, so `Shift+Ctrl+K` is not `Ctrl+K`. Off by default, for an app
with its own shortcut layer. The panel's inline size is a token
(`--pp-measure-sm`), the D-071 §1 form, and it sits `--pp-space-9` below
the scrim's top rather than at its centre: a field one types into sits
where the eye starts. The field's focus is its hairline — the input's
outline is transparent and the field's bottom edge takes the focus tone
— Input's D-039 §4 affordance, in the one place a ring inside a panel
would read as a box in a box.

### 5. Findings from the build

- **The consumer's `Empty` row sits beside the listbox** (D-076 §4 again),
  partitioned from the children by type.
- **`Enter` runs the highlighted item by clicking it**: the item's handler
  lives in React, the highlight is a DOM id, and `node.click()` is the
  one path both a pointer and the keyboard take — no registry of
  handlers by id.
- **Closing clears the text**, so the next open starts fresh; a controlled
  `inputValue` sees the clear through its callback and may keep it.

### 6. Verified

The panel sits the offset below the top, the token wide, centred, over
Dialog's scrim at the overlay layer, with no padding; the field is
focused on open with its hairline in the focus tone and no outline of its
own; a row is the medium control height; typing narrows and highlights
the first match, the arrows move with the menu's fill, `Enter` runs the
command, closes and returns focus to the trigger; `Control+k` toggles it
with the text cleared; a long list scrolls and keeps the highlight in
view; the theme crosses; the gallery holds three contained palettes with
the matches for "go" and one highlighted. 8 unit and 4 browser tests.
Break checks in §7.

### 7. Break checks

Five, each caught by its named test: the scrim's start alignment dropped
(the panel centred); the first-match highlight dropped (nothing
highlighted on typing, in the long list, and in the gallery); the hotkey
listener dropped (`Control+k` opened nothing); the row variable dropped
(the menu's small row); the close after select dropped (the palette
stayed open after `Enter`).

<a id="d-079"></a>

## D-079 — `Card` rulings: named parts for a server compound, no shadow, the foot sunken, and the wrap is the card's

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/RULES.md`
§5.6 (the parts of every compound are named exports),
`docs/specs/Card.md` (status) · **Extends:** D-062 §1, D-053 §4 and §5,
D-068 §2

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The first of Tier 5, and the first Server
Component compound.

### 1. Named parts for a server compound too, and RULES §5.6's example is amended

RULES §5.6 gave `<Card><Card.Header/></Card>` as the example of
composition, and then said client compounds use named exports because a
Server Component cannot dot into a client module (D-062 §1). A card is a
server module: it *could* dot. It does not, because the library would then
have two spellings for one idea, chosen by an implementation detail the
consumer should not have to know. The rule now reads "the parts of every
compound are named exports", and its example is
`<Card><CardHeader/></Card>`. `Card`, `CardHeader`, `CardBody`,
`CardFooter`; no context, so a part outside the root is a plain `div` and
throws nothing.

### 2. A bordered raised surface with no shadow; one hairline per adjacent pair; the foot sunken

The raised surface, a hairline edge, no shadow: a shadow is for what floats
(Popover, Dialog, Toast), and a card sits on the page. The hairline between
sections is drawn as the *later* section's block-start border, so a body
alone has no line, a header and a body have one, and all three have two —
the count is the assertion. The footer is `--pp-color-bg-sunken`, so a row
of actions reads as the card's foot rather than as more body. No `tone`, no
`variant`, no `size`: like Alert (D-053), a card's children are arbitrary,
and a filled surface would put them on the wrong background.

An interactive card is the consumer's link or button through `asChild`
(RULES §5.7): the class lands on their element, and `:is(a, button)` gives
it the hover edge (`--pp-color-border`), `--pp-shadow-1` as the lift, the
one ring, and its text back — a link's underline and colour reset, because
a card is not a run of text. The playground's link card is an `<a>`, and
the test reads its tag.

### 3. The wrap is the card's; `min-inline-size: 0` is stated, not claimed

The spec copied Alert's finding: "`min-inline-size: 0`, so a URL in the
body cannot push the box past its parent". The break check said otherwise:
dropping it changed nothing, because the card clips (`overflow: hidden`,
for its radius), and a clipped flex or grid item's automatic minimum is
already zero. The URL on the page wrapped because it sat in a `Text`, whose
own `overflow-wrap: anywhere` did the work — the test was passing on a
mechanism the component did not own. And a card is worse off than Alert
here: an unbreakable string in a bare section would not paint past the edge
(D-053 §4), it would be *cut off* by the clip, silently.

So `overflow-wrap: anywhere` is on the root, inherited, and the page's URL
is a bare `<p>` so that the card's rule is the one under test: dropping it
fails "a URL stays inside at 240px". `min-inline-size: 0` stays on the root
because RULES §1 defines `fill` as including it (D-053 §5's ruling), and its
comment says the clip makes it unobservable here; it is gone from the
sections, which are cross-axis children of a column and never had an
automatic minimum to zero. The spec's break list names the rule that
actually holds.

### 4. Verified, and the four breaks

Unit: four tests — the parts and their classes, `asChild` on a link, a
part outside the root, axe in both themes. Browser: the surface and the
foot resolved to their tokens, the hairline count across three cards, the
padding tokens, the hover lift and ring, a link card's text not
underlined, the URL at 240px. Break checks (D-035 §3): the hairline rule
dropped (the count, `['0px', '1px']` read `['0px', '0px']`); the footer's
surface dropped (transparent); the hover lift dropped (`box-shadow` stayed
`none`); `overflow-wrap` dropped (the URL pushed the card past its cell).
Each failed on exactly the test named for it; the fifth, `min-inline-size:
0`, is §3.

<a id="d-080"></a>

## D-080 — `Progress` rulings: `value` absent is indeterminate, a name at the type level, a fill that is a flex item, and `accent` by default

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/Progress.md`
(status) · **Extends:** RULES §4 (the `data-state` vocabulary gains
`determinate`), D-062 §5, D-035 §3; the Spinner spec's decision 6

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The determinate half of what 1.6 `Spinner` began.

### 1. `value` present is determinate; absent is indeterminate; `determinate` joins `data-state`

No `indeterminate` boolean beside a `value`: two props for one state are
two props to keep in step, and a `value` of `undefined` already says the
size of the work is unknown. `aria-valuenow` is written only when there
is a value, which is ARIA 1.2's reading of an indeterminate progressbar
(NumberInput §5 verified the same for `spinbutton`). `max` defaults to
100 and falls back to it, with a development warning, when it is not a
positive finite number; the value is clamped to `[0, max]`.

The root carries `data-state="determinate" | "indeterminate"`.
`indeterminate` was already in RULES §4's vocabulary as a checkbox's
third state; `determinate` extends it under §4's extension rule (D-064
§3's shape): "the value is known" is a real state the stylesheet
switches on, and `:not([data-state="indeterminate"])` is a worse
spelling of it.

### 2. A name at the type level, and the fill is a flex item

`ProgressProps` is a union: `label` (written as `aria-label`) or
`aria-labelledby`, one required and not both. Spinner's union is
`label | decorative`; a progress bar has no decorative case, because it
exists to report a number, and a number of nothing is not decoration.
Nothing is rendered visually hidden: the visible label beside a bar is
the consumer's `Text`, named once by `aria-labelledby`.

Slider draws its fill as a grid column. A progress bar's fill *moves*,
and `grid-template-columns` does not interpolate in Safari, so a bar
built Slider's way would slide in one browser and jump in another. The
fill is `flex: 0 0 var(--_pp-progress-fill)`, the percentage written
inline by the component (Slider's device for the value), transitioned on
`flex-basis` over `--pp-duration-normal`. A flex row follows the writing
direction the way a grid does, so in RTL the fill grows from the right
edge with no rule for it; the browser suite reads the fill's end edge
against the track's under `dir="rtl"`. The indeterminate segment sweeps
by `inset-inline-start`, from `-40%` to `100%` — a logical property, so
the sweep starts at the start in both directions, where a `translate`
would need a second keyframe set for RTL.

### 3. `accent` by default, where Spinner is `neutral`; the track is the decorative step

A spinner sits inside a control and takes the control's colour; a bar
stands alone on the page, where a grey fill reads as disabled. So `tone`
defaults to `accent` here and the two defaults are recorded side by
side rather than made to agree. Track `--pp-tone-border-subtle` and fill
`--pp-tone-solid`, both in the root's `data-pp-tone` scope, so a
`success` bar at 100 and a `danger` bar for a failed upload need no rule
of their own. The fill on the page is the solid step every solid button
already carries; the track is decoration, no obligation by design
(D-050).

### 4. Reduced motion is the suite's default, and the moving half runs in its own context

`playwright.config.ts` pins `reducedMotion: 'reduce'` for every test, so
the first draft's "the segment moves" read the pulse and "the slide is a
`flex-basis` transition" read `none` — the component was right and the
test was in the wrong context. The block is now two halves: the default
context asserts the reduced-motion rules (the segment is the whole bar,
its animation the pulse, the fill's transition `none` — declared here
because a duration in `pp.components` outranks the reset's crush, D-062
§5), and a nested `describe` with `reducedMotion: 'no-preference'`
asserts the sweep's name and that the segment's position changes
between two reads, and the transition's property and duration. The
Popover suite's shape (its own `test.use`), applied to a component whose
motion is the feature.

### 5. Verified, and the four breaks

Unit: nine tests — the role and the name by `label` and by
`aria-labelledby`; the values and the state with and without a value;
clamping and the fill variable; the `max` fallback and its warning;
`aria-valuetext`, `size` and `tone`; ref, `className` and a consumer's
`style` merged with the fill variable; a nameless bar and a bar named
twice rejected at the type level; axe in both themes. Browser: the fill
at 60% of the track from its start, the thickness per size against the
tokens, the fill and the track resolved in the accent scope and the
neutral one; RTL; the bar at three widths; the two motion halves.

Break checks (D-035 §3): the fill's `flex-basis` dropped (the ratio
read 0, in LTR and RTL); the sweep dropped (`animation-name` read
`none`); the reduced-motion swap dropped (the pulse read as the sweep);
the `lg` thickness dropped (the heights). Each failed on exactly the
test named for it.

<a id="d-081"></a>

## D-081 — `Table` rulings: a named region that scrolls, `caption` as a prop, a table stretched by a grid, `useId` is not a client hook, a ring read in the frame it landed in, and two things only the screenshot said

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/RULES.md` §7
(`useId` is not a reason for `'use client'`), `scripts/lint-rules.mjs`
(`useId` out of the client-only set) with a fixture in
`tests/lint-fixtures/src/components/Bad/Ids.tsx`, `docs/specs/Table.md`
(status) · **Extends:** D-022 §10, D-007, D-050, D-035 §3

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The tier's data component, and the one the
Tier 2 spec said `Scroller` would wait for.

### 1. A semantic table in a named region that scrolls, focusable always

The native `<table>`, `<thead>`, `<th scope="col">`, `<tbody>`, `<tfoot>`:
a screen reader announces the header with each cell, and nothing here
needs a data layer — sorting and selection are hooks (`sort` written as
`aria-sort`, `selected` written as `data-state`), decided by the
consumer's client component. Five columns do not fit a 240px sidebar,
and the two ways to make them fit — break every word, or stack the
columns into pairs — both destroy what a table is for. So the root is a
`role="region"` that scrolls on the inline axis, inside its own box and
never the page, with `tabindex="0"` so a keyboard user can scroll it and
a name so the tab stop says what it is. A table that does not overflow
carries that one tab stop too, and that is accepted: a Server Component
cannot know whether it overflows, and a region that is focusable only
sometimes is the thing a screen reader user cannot predict.

### 2. `caption` is a prop of the root, and one of three names is required

The region takes its name from the caption: `<caption id>` and
`aria-labelledby`, one `useId`. A Server Component has no context, so a
`<TableCaption>` part could not hand its id to the root; the caption is
a prop instead — the one place this library prefers configuration to
composition, because the alternative is a region whose name the
consumer wires by hand. `TableProps` is a union: `caption`, or
`aria-label`, or `aria-labelledby`, one required, never two.

`align` on a head or a cell is ours and logical (`start | center |
end`); the deprecated HTML attribute of the same name is omitted from
the props, or TypeScript rejects the extension.

### 3. The table is stretched by a grid, never by a width

A `<table>` is shrink-to-fit, so a short table would sit at the start of
its region with the frame running on past it; `width: 100%` is RULES
§1's banned spelling. The region is `display: grid` with the table as
its one item: an item stretches to its track, and the track is the
region unless the table's min-content is wider, when the track is that
and the region scrolls it. The break check measured the mechanism:
`display: block` in its place left the wide cell's table 299px short of
its region. No width, no allowance, one rule for both cases. `Grid`
spans (D-022 §10) were left to be revisited here and still are not
needed: a column is sized by its content.

### 4. `useId` is not a client hook

The rule lint counted `useId` among the hooks that require `'use
client'`, and Table needs one on the server to name the region by its
caption. React's server dispatcher implements `useId` (an id from the
request's counter); it is the state, effect, ref and context hooks that
do not exist there. `useId` is out of the set, RULES §7 says so, and a
fixture that ships, calls `useId()` and carries no directive proves the
rule still fires exactly once across the fixtures, for the file that
uses `useState`.

### 5. A ring read in the frame focus landed in is 0px wide

"The ring on the focused region" read `outline-style: solid` and
`outline-width: 0px` — a solid ring of zero width, D-052 §3's impossible
combination, reproducibly, while a probe that focused the same element
read 2px. The reset's reduced-motion rule (which the browser suite pins)
crushes every transition to 0.01ms and leaves `transition-property:
all`, so the outline that `:focus-visible` switches on is a transition
from `0px` and `currentColor`, and a computed-style read before the next
frame sees the start value. The test polls the width instead of reading
it once. Earlier ring assertions read the style only, which is discrete
and flips at the transition's midpoint — the same frame, most of the
time; a width is the honest read, and it has to wait a frame.

### 6. Two things the screenshot said that the tests had not: a `th` is centred by the UA, and a cell that wraps a date is worse than one that scrolls

The first browser run was green and the page was wrong twice. Every
column heading was centred: the UA stylesheet's `th { text-align:
center }` is a rule on the element, and `text-align: start` on the
table, inherited, does not reach past it. The head declares its own,
and the test reads it. And the 240px cell wrapped `INV-0091` at its
hyphen and `2026-09-04` at its second, because a table shrinks its
columns to their min-content before it overflows, and the region's
scroll only began once that was exhausted. A cell is `white-space:
nowrap` now and a prose cell says `wrap` (`data-wrap`): the narrow cell
scrolls a table of one-line rows, which is what the region is for, and
the members table's note column wraps. D-051 §6 from the other side
again: the assertions were reading true things, and the page was still
wrong, because nothing asserted the two things that were.

### 7. Verified, and the five breaks

Unit: nine tests — the region and its name from the caption (one id,
both ends), from `aria-label` and from `aria-labelledby`; the native
parts and `scope="col"`; `size`, `striped` and `tableProps`; `align`,
`sort` and `selected` without `aria-selected`; `wrap`; a nameless table rejected
at the type level; refs, `className` and `style` on every part; axe in
both themes with a sorted head, a selected row and a Badge. Browser: the
region's box against its cell's content box at three widths, scrolling
at 240px and not at 960px, the table's width the region's at 960px; the
hairline count across six rows, the sunken header and foot, the head's
colour, size and weight, the padding per size, tabular figures; striped
even rows, the selected row in the accent ramp, `align="end"` and its
RTL mirror measured by a Range, the polled ring; a head's text starts;
the narrow cell's first cell is one line box and the note cell more.

Break checks (D-035 §3): the grid dropped (the wide table 299px short);
the hairline rule dropped (five lines read `0px`); the header's surface
dropped (transparent); the selected row's surface dropped (transparent);
the head's `text-align: start` dropped (the UA's `center`). Each failed
on exactly the test named for it.

<a id="d-082"></a>

## D-082 — `Pagination` rulings: a constant window, the compact form is the container's, the current page is a pressed Toggle, `:dir()` does not ship, and three things only the screenshot said

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/RULES.md` §1
(direction in a selector is `[dir="rtl"]`, never `:dir()`),
`src/components/Scroller/Scroller.css` (the same fix, ported),
`src/components/Button/Button.css` (`text-decoration: none`),
`docs/specs/Pagination.md` (status) · **Extends:** D-021, D-022 §2, D-035 §3,
D-053 §5, D-078 (the client demo file)

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. `count` pages and a window with a constant number of slots

`page` / `defaultPage` / `onPageChange` (RULES §5.5); the numbers shown
are the first and last `boundaryCount`, `siblingCount` each side of the
current page, and an ellipsis where the two do not touch. The window
keeps the same number of slots as the page moves — near an edge the far
siblings take the slots an ellipsis would have — so the row does not
change width from page to page. The arithmetic is MUI's `usePagination`,
exported as `paginationItems` and unit-tested at both ends and in the
middle. Buttons by default; with `getHref` every page is an `<a>` drawn
by `Button asChild`, the current page a `<span>` with `aria-current`,
because a page is never a link to itself.

### 2. The compact form is a container query, and that is why the contract is `fill`

Below 28rem the page numbers and the ellipses are gone and "6 of 12"
stands between the arrows — Split's device (`container-type:
inline-size`, D-022 §2, the threshold a literal because a query cannot
read a custom property). Nothing is measured in JavaScript and the form
is the container's, not the viewport's: one component is compact in a
sidebar and full in the main column of the same page. The sizing
contract is `fill` **because of this**: a container query needs the
root's inline size to be the parent's, and a hugging row would be its
own content's width in every container. The row inside is a grid that
sizes its items — `grid-auto-columns: minmax(<control height>, auto)`,
D-021's habit — so "1" and "12" sit in equal boxes with no width on any
control, centred in the landmark.

The matrix's cells are size containers of their own, so the break check
that dropped the component's `container-type` caught nothing there: the
query answered from the cell. The page now has a compact instance in a
plain 15rem block, where only the component's own container can answer,
and the break is caught there.

### 3. The current page is Toggle's `on`, in the accent ramp

`aria-current="page"` is the state; the surface is `--pp-tone-bg-active`
written into Button's private variables the way Toggle.css does, with
the page in the accent tone so its text and border are the accent's
too. Not a `solid` accent button: a page number is not the view's one
primary action (Button §3.1), and a solid page among ghosts reads as a
call to action.

### 4. `:dir()` does not ship; the Scroller had the same defect

The chevron's mirror was written `.pp-pagination:dir(rtl)`, and the RTL
test read `scale: none` with the rule "present". The built stylesheet
showed why: Lightning CSS, under the package's `defaults` targets,
rewrites `:dir(rtl)` into `:is(:lang(ar), :lang(he), …)` — a polyfill
that matches Arabic and Hebrew prose and not a `dir` attribute, so an
RTL page in English never gets the rule. The selector is `[dir="rtl"]`
on an ancestor now, RULES §1 says so, and `Scroller.css`, which swapped
its inline shadows by `:dir(rtl)` since Tier 2 and had no RTL assertion,
is fixed the same way with one added: the start shadow moves to the
right edge when the element is given `dir="rtl"`.

### 5. Three things only the screenshot said

The browser suite was green and the page was wrong three times.

- **The compact row overflowed its cell.** The first form hid the page
  *buttons* and left their list items in the grid, and an empty item is
  still a column at least a control wide: seven invisible 40px columns
  spilled out of a 240px cell, and the harness's own overflow flag said
  so before any assertion did. The items hide now
  (`pp-pagination__item--page`), and the test asserts the landmark does
  not scroll and the compact row has three items. The test's "visible"
  read also changed: a button inside a hidden item keeps its own
  computed `display`, so visibility is `getClientRects().length`.
- **The linked pages were underlined.** A `Button asChild` on an `<a>`
  inherited the UA's link underline, and nothing in `Button.css` said
  otherwise — every `<Button asChild><a>` in the library was an
  underlined button. `text-decoration: none` on `.pp-button` now, and
  the Button page's baseline is re-authored.
- **The page did not build.** `getHref` is a function, and a function
  cannot cross from a Server Component page into a client component;
  Next refused the prerender. The linked instance lives in a client
  `Demos.tsx`, CommandPalette's shape (D-078).

D-051 §6 and D-081 §6 again: a green run measures what it was told to
measure. The screenshot is part of the definition of done.

### 6. Verified, and the five breaks

Unit: fourteen tests — the window at 1, 2, 6, 11 and 12 of 12, wider,
and with nothing to elide; the landmark and its name; `aria-current`
and the tones; the arrows disabled at the ends; reporting and moving
uncontrolled, reporting and holding controlled, an owner that stores
what it reports, no call on the current page; `getHref` links, the
current page as text, a disabled arrow as a button; `size`, `disabled`,
`count` below one; ref, `className`, `style`, `label`; axe in both
themes, as buttons and as links. Browser: the full row at 480 and 960
with the status hidden and the compact form at 240 with it shown; the
row centred and every slot at least a control wide; the landmark its
cell's content width and never spilling; the compact form in a plain
parent; the current page's surface; the ring; LTR and RTL order and the
mirrored chevron; a linked page unadorned and the current page's height.

Break checks (D-035 §3): `container-type` dropped (the plain parent
showed five numbers); the current surface dropped (the ghost surface);
the RTL mirror dropped (`scale: none`); the centring dropped (the row at
the start). Each failed on exactly the test named for it; the fifth,
`container-type` in the matrix, is §2.

<a id="d-083"></a>

## D-083 — `Breadcrumb` rulings: the separator is the stylesheet's and follows its crumb, the page is a span, and a `nowrap` the break check found wrong

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/Breadcrumb.md`
(status) · **Extends:** D-035 §3, D-053 §5, D-079 §3, D-082 §4

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. Five parts, and the separator is drawn, not rendered

`Breadcrumb` (a `<nav aria-label="Breadcrumb">` around an `<ol>`),
`BreadcrumbItem`, `BreadcrumbLink` (a neutral `Link`, underlined on
hover, muted through Link's own `--pp-link-color` hook and the page's
colour on hover), `BreadcrumbPage` (a `<span aria-current="page">`,
never a link, because a link to where you are moves nothing) and
`BreadcrumbEllipsis` (a named "More levels" where the consumer cut the
trail; the menu of hidden levels is theirs). No separator part: a
separator between every pair of items is a fact of the list, not
content, so it is each item's `::after` from
`--pp-breadcrumb-separator`, `"/"` by default — symmetric, so RTL
needs nothing — and never in the accessibility tree. The consumer
decides which item is last; a Server Component with no context could
not count children, and should not.

### 2. `fill`, and a trail wraps at its separators

A landmark spans its line; the list inside is a flex row that wraps, so
a trail wider than a 240px sidebar is two lines of whole crumbs, which
reads, where a scrolling or cut-off trail does not.

### 3. Two things the checks said about the separator and the wrap

**`white-space: nowrap` caught nothing, and was wrong.** The spec said
a crumb "never breaks mid-label" and put `nowrap` on the item; the break
check that dropped it changed nothing, because a wrapped flex item takes
its max-content width on its new line and a crumb breaks inside itself
only when it alone is wider than the line. Followed through, that is
the one case where `nowrap` would act, and there it would make the
crumb spill out of the landmark rather than wrap its words — the worse
outcome. The declaration is gone, and the spec says what the flex row
does instead. D-079 §3's shape: a declaration the check cannot observe
is a claim to re-examine, not a line to keep.

**The separator follows its crumb.** The first draft drew it as each
item's `::before` except the first's, and the screenshot's 240px cell
began its second line with a stray slash. It is `::after` on every item
but the last now, so a wrapped line ends with its separator and the next
begins with a crumb. The first colour-break check on the separator also
caught nothing, because the test read the ellipsis item, whose `<li>`
carries the muted colour itself; it reads a plain item now, and the
break is caught.

### 4. Verified, and the four breaks

Unit: eight tests — the landmark, the `<ol>`, the items in order and no
slash in the text; a crumb's href, class, neutral tone and hover
underline; the page a span with `aria-current` and no link; the
ellipsis named and renamed; `asChild` on a router link; refs,
`className`, `style` and `label`; axe in both themes. Browser: a
separator after every item but the last and none in the text; the trail
two lines of whole crumbs at 240px and one at 960px, spilling nothing;
a crumb muted and unadorned at rest, the page's colour and underlined
on hover; the page's colour and weight; the separator's colour and
gap; a custom glyph; RTL from the right.

Break checks (D-035 §3): the separator's `content` dropped (`none`,
both tests); `flex-wrap` dropped (the trail spilled); the page's weight
dropped (`400`); the separator's colour dropped (the page's colour).
Each failed on exactly the test named for it; `nowrap` is §3.

<a id="d-084"></a>

## D-084 — `Stepper` rulings: a counter and a check, a row that is a column by its container, and a grid that seated the circle after the label

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `.stylelintrc.json`
(`Stepper.css` in the D-019 group), `docs/specs/Stepper.md` (status) ·
**Extends:** D-019, D-021, D-082 §2, D-035 §3

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. Two parts; the number is a counter and "done" is a check

`Stepper` (a `<nav aria-label="Progress">` around an `<ol>`) and `Step`
(`<li>`), `status` as `complete | current | upcoming` written to
`data-state`, `aria-current="step"` on the current one. The visible
number is a CSS counter on an `aria-hidden` indicator, because an
`<ol>` already tells a screen reader "2 of 4" and a number in the
markup would be said twice; a completed step's indicator holds a check
(through `Icon`, so no bare svg is sized here) and its label carries a
visually hidden "Completed". A status display: it holds no state and
moves nothing; a clickable completed step is the consumer's `Link` in
its label.

### 2. Vertical is the base; horizontal is a query-gated enhancement

A step is a two-column grid — the indicator, then the body — with the
connector a zero-wide box with a border in the second row of the first
column, running down from the circle. Above 28rem a horizontal
stepper's list is a row and each step a three-column grid, the
connector a box in the third column with the line drawn as its inset
bottom shadow at the circle's middle; below it a horizontal stepper *is*
the vertical one, by its container (Pagination's device, D-082 §2), so
a checkout's row in the page is a column in a card with nothing
configured. The `<nav>` is the container and the `<ol>` is what the
query switches, because a query cannot target its own container. The
indicator declares `inline-size` under the D-019 exemption — a square,
intrinsic, hugging box, the same kind as Icon and IconButton — and the
file joins that stylelint group. The label is a box the indicator's
height with its text centred, rather than padding arithmetic on the
line height, which the value rules refuse anyway.

### 3. Every colour is a tone token in the accent scope the root writes

Solid indicator and accent connector after a completed step; accent
ring and accent number on the current one; hairline and muted on an
upcoming one. `data-pp-tone="accent"` on the `<nav>`, so a consumer's
tone on a wrapper recolours all of it (D-007).

### 4. Three things the screenshot and the rectangles said

**The circle was after the label.** The body had `grid-row: 1 / span 2`
and the indicator nothing, and grid auto-placement seats items with a
definite row before the rest: the body took column 1 and the circle
column 2, in both directions. The LTR assertions did not read the
order; the RTL one did, and failed for the wrong-looking reason. Both
are placed now (`grid-column` on each), the test asserts the circle
ends before its label begins, and the break that drops both placements
fails it.

**The horizontal connector was zero wide.** Its column was `auto` and
its content empty, so the line — drawn as a box shadow — had no box,
while the assertion on the shadow's *colour* passed. The connector's
track is `minmax(space-5, 1fr)` now: the rest of the step's share of the
line, never less than a floor, so a row that is only just a row (three
steps at 480px) still draws a line between the labels while the labels
wrap first. The test reads the box's width, at 960 and at 480.

**`getComputedStyle` reports a counter's declaration, not its digit.**
`content` on the indicator's `::before` reads `counter(pp-step)`, so
the test asserts the declaration and `none` on the completed step, and
the digits are the baseline's to show.

### 5. Verified, and the five breaks

Unit: six tests — the landmark, the `<ol>`, the states in order and the
accent tone; `aria-current` on the current step only; the check and the
hidden "Completed" on the completed step and nowhere else, the
description; `upcoming` by default, the orientation and the label;
refs, `className`, `style`; axe in both themes and orientations.
Browser: the counters and the check, the indicators' size, the fills and
rings per state, the label weights, no connector after the last, the
circle before its label; a column at 240 and a row at 480 and 960 with
the vertical connector's colour, width and height and the horizontal
one's colour, width and height; vertical at every width; the plain
parent; five steps in one row; RTL from the right with the circle after
the label.

Break checks (D-035 §3): `container-type` dropped (the plain parent a
row); the done connector's colour dropped (a hairline); the current ring
dropped (a hairline); the counter dropped (`none`); the placements
dropped (the circle after the label, both tests). Each failed on the
test named for it. The indicator's placement alone caught nothing — the
body's column is the mechanism — and the comment says so.

<a id="d-085"></a>

## D-085 — `EmptyState` rulings: parts on the primitives, a measure by a grid, and `outline` as Card's frame made dashed

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/EmptyState.md`
(status) · **Extends:** D-021, D-070 §1, D-081 §3, D-035 §3

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. Five parts, each the Tier 1–2 primitive with the empty state's class

`EmptyState`, `EmptyStateIcon` (an `Icon`, decorative, `lg`, in a round
tile on the sunken surface — the tile is the Icon itself, given a box
through Icon's own `--pp-icon-size` hook and padded so the glyph stays
the `lg` size), `EmptyStateTitle` (a `Heading`, `size="md"`, `level`
required because Heading's is), `EmptyStateDescription` (a `Text`,
muted, centred) and `EmptyStateActions` (a `Cluster`, centred,
`gap="2"`). The props are the primitives', so a description holds a
`Link` and a title takes any size; no `title` / `description` props
(RULES §5.6). No live region by default: an empty page is content; a
search that returns nothing in place puts `role="status"` on the root
through props.

### 2. Centred and held to a measure by a grid, never by a width

The root is a grid with one column, `minmax(0, --pp-measure-xs)`,
centred, so the description is a readable line on a wide page and the
whole cell in a 240px sidebar with no `max-inline-size` on any child:
the parent sizing the box it created (D-021), Table's device for its
table (D-081 §3). Dropping the ceiling put the 960px column 566px past
the measure. Rhythm is the grid's one `row-gap`; the actions stand
further off by their own `padding-block-start`, because a margin is
RULES §2's. `text-align: center` on the root is what centres the
title — the description centres itself through Text — and the test
reads the title for it, because the first break check read only the
description and caught nothing.

### 3. `plain` by default; `outline` is Card's surface with a dashed edge

The root carries `pp-card` before its own class when outlined, so
Card.css draws the raised surface, the radius and the hairline, and
this file makes the hairline dashed: the two-class contract (D-070 §1),
one stylesheet drawing the frame and the other changing one thing. Not
`solid`, not `ghost`: an empty state has nothing to fill, and a tinted
one reads as an `Alert`.

### 4. Verified, and the four breaks

Unit: five tests — the parts on their primitives with the right
attributes, in order; `pp-card` only when outlined; the primitives'
props through (a title size, a description tone, an actions gap); refs,
`className` and `style` on every part; axe in both themes and variants.
Browser: the root its cell's content width, the column the cell less
the padding at 240 and the measure at 960, centred; the parts stacked;
the block padding; the title and the description centred, the
description muted; the tile 48px, round and sunken with a 24px glyph;
`outline`'s classes, dashed hairline, Card's surface, radius and edge
colour; `plain` with no frame; the actions' padding; the empty state
the body's width inside a Card.

Break checks (D-035 §3): the measure dropped (566px over); the dashed
edge dropped (`solid`); `text-align` dropped (the title at `start`, once
the test read it); the tile's surface dropped (transparent). Each failed
on exactly the test named for it.

<a id="d-086"></a>

## D-086 — `Calendar` rulings: an ISO value and no date library, our own grid with the APG keys, names by `Intl`, and a sixth week hidden as a row

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/Calendar.md`
(status) · **Adds:** `src/internal/date.ts` · **Extends:** D-061 (Tier 5's
first keyboard widget is our own, because Radix has none), D-021, D-081
§3, D-082 §4, D-035 §3

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The component 4.13 `DatePicker` waits for.

### 1. The value is an ISO date; the month shown is `YYYY-MM`; both controllable; no date library

A `Date` is an instant in a time zone and a day is not, so the value is
`2026-09-28` — what a URL, a form and a database already hold — and the
month shown is `2026-09`, each with its controlled and uncontrolled
form (RULES §5.5). `today` is a prop, so a server render, a test and a
screenshot agree on what today is; `min`, `max`, `isDateDisabled` and
`disabled` bound the pickable days. The arithmetic a month needs is
forty lines in `src/internal/date.ts`, UTC-anchored so no daylight
change moves a day; no package is added. A string that is not a date is
ignored with a development warning. A value set from outside to another
month brings that month into view when the month is uncontrolled.

### 2. Our own grid on `div`s, one tab stop, the APG keys, mirrored arrows

Radix has no calendar, and a `<table>` cannot fill its container or
stretch its cells without a width, so the grid is `div`s with the roles
(`grid`, `row`, `columnheader`, `gridcell`) laid out by CSS grid
(`repeat(7, 1fr)`), each day a `<button>` stretched to its cell — the
parent sizing the box it created (D-021). One day has `tabindex="0"`
(the focused one, else the value, else today, else the first); arrows
move a day or a week, Home and End to the week's ends, PageUp and
PageDown a month (Shift: a year), Enter and Space pick; a move past the
month's edge shows the next month and focus follows once it has
rendered, through a pending ref the effect consumes. A disabled day is
skipped, stepping the way the key went up to a year, and nothing moves
past a bound. Arrow Left goes to the previous day in LTR and to the
next in RTL, read from the root's computed direction, because the grid
runs the other way there; the month arrows are mirrored by
`[dir="rtl"]` (D-082 §4). Filler days before and after the month are
`aria-hidden` spans, muted and inert: the previous month is one PageUp
away.

### 3. Names by `Intl`; the week starts where the locale says, else Monday

Month, weekday and day names come from `Intl.DateTimeFormat(locale)`,
a weekday header the narrow form with the long one as its label, a day
button named in full so a screen reader never hears a bare "28". The
day's *number* is formatted too, so a locale with its own digits shows
them on the days as well as in the month's name. `locale` is a prop
with NumberInput's caveat: without it the runtime's is used, and a
server and a client that disagree about the locale disagree about the
names, so pass it. The first day of the week is `weekStartsOn`, else
the locale's week info where the runtime provides it (a cast, since
TypeScript's lib does not yet know `getWeekInfo`), else Monday.

### 4. Two things axe and the screenshot said

**A sixth week that is all fillers has no gridcell.** September 2026's
grid ends with a row of October, every cell `aria-hidden`, and axe's
`aria-required-children` found a `row` with nothing in it. The row is
hidden with its cells: a screen reader walking the grid meets five
weeks, which is the month. The unit test counts six rows exposed, not
seven.

**Latin days under an Arabic month.** The RTL instance showed
`سبتمبر ٢٠٢٦` over `1 2 3`, because the month came from Intl and the day
from a number. Both come from Intl now (§3).

### 5. Verified, and the five breaks

Unit: thirteen tests — the group, the grid labelled by the month, the
weekdays for `en-US` from Sunday and `de-DE` from Monday, the month's
days and the hidden fillers and the hidden sixth week; the value
selected and today current, the tab stop's fallbacks; a click picking
and reporting, uncontrolled moving and controlled holding; the arrows
changing the month and a value from outside bringing its month in;
`min`, `max`, `isDateDisabled` and `disabled`; every key, the tab stop
following, a crossing of the month's edge with focus, a disabled day
skipped, a bound held; an owner; a bad value warned and ignored;
`size`, `label`, ref, `className`, `style`; axe in both themes.
Browser: seven equal columns of the cell's content width and no spill;
the day's height per size; the picked day solid, today accent and
medium, hover, the ring; RTL from the right with the arrows mirrored,
Arrow Left forward, Arrow Down across the month with focus on the day
and the month's name changed; one tab stop in and out.

Break checks (D-035 §3): `repeat(7, 1fr)` dropped (the columns unequal,
9px apart); the selected surface dropped (transparent); today's colour
dropped (the page's text); the day's height dropped (26px short); the
RTL mirror dropped (`scale: none`). Each failed on exactly the test
named for it.

<a id="d-087"></a>

## D-087 — `FileUpload` rulings: the hidden input is the mechanism and the Trigger the keyboard path, refusals with reasons, and a file field is a group

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/FileUpload.md`
(status) · **Extends:** D-030 §3 / D-035 §8 (`type="file"` excluded from
Input for this), D-007, D-035 §3, D-039 §1

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. Five parts; the hidden input is the mechanism and the Trigger is the one tab stop

`FileUpload` holds a native `<input type="file">` — the only thing that
opens the file dialog and the only thing a form submits — visually
hidden and `tabindex="-1"`, because a second stop beside the button
would be the same control twice. `FileUploadTrigger` is a `Button`
(`outline`) that opens the dialog and is the labelled control;
`FileUploadDropzone` takes a drop and a click on itself (not on its
children) and is never focusable, because a drop needs a pointer and
the keyboard's path is the button inside it; `FileUploadList` and
`FileUploadItem` show what was chosen. The component selects and
shows; uploading is the consumer's, so the list is their state and an
item takes the `progress` they know.

### 2. `onSelect(accepted, rejected)`: refused by type, size and count, with reasons

The dialog honours `accept`; a drop does not, and neither honours a
size, so every path runs the same check — `accept`'s own grammar (MIME,
a `*` subtype, an extension), `maxSize`, `maxFiles` with `multiple`,
one without — and every refused file comes back with `type | size |
count`, so the consumer can say why. The input's value is cleared after
a selection, so the same file chosen twice reports twice. The drag
state is a depth count, because enter and leave fire for every child
crossed and a single boolean flickers.

### 3. In a `Field`, make it a group

A `<label for>` pointing at a button *replaces* the button's name: in a
plain Field the Trigger read "Attachments" and not "Choose files", and
the test that looked for the verb found nothing. So a `group` Field is
the shape: its `aria-labelledby` and description land on the root,
which becomes the named group, and the Trigger keeps its own name; a
plain Field still works, with the Trigger named by the label, and the
docs say which to prefer. `invalid`, `disabled` and `size` follow the
field with the tier's precedence; `data-invalid` puts the dropzone in
the danger scope, and a drag puts it in the accent one — the scope is
written on the dropzone (`accent`, or `danger` when invalid), so every
colour is a tone token (D-007). The rule lint caught the first draft's
`--pp-palette-danger-11` on an erring item; the item carries the danger
scope now and the error line reads `--pp-tone-text` in it.

### 4. An item is a row that truncates

Name, size (formatted by `Intl` in the locale's unit: "182 kB"), the
remove button, and under them a `Progress` at `sm` labelled by the name
while `0 ≤ progress < 100`, or the error line; `data-state` is `idle |
uploading | complete | error`, derived unless given. The row is a grid
with `minmax(0, 1fr)` for the name, so a long name truncates with an
ellipsis in a 240px cell rather than pushing the row; a hairline between
items and none after the last.

### 5. Verified, and the four breaks

Unit: thirteen tests — the hidden input's attributes and the Trigger
and the zone opening it (and the text inside not); a selection reported
and the input cleared; refusal by type, size and count with reasons
(user-event's own `accept` filter off, since the component's check is
what is under test); a single input's count; `matchesAccept`; a drop, the
drag depth, and both ignored when disabled; a group Field and a plain
one; an item's name, size, bar, error, remove button, statuses;
`formatBytes`; a part outside the root; refs, `className`, `style`; axe
in both themes. Browser: the dashed control edge, the zone the root's
width and its content centred, hairlines between items, the long name
truncating at 240 and not at 960, the bar present; a dispatched
`dragenter` with a real `DataTransfer` turning the zone accent and a
`dragleave` turning it back; the error Field's danger edge; the
disabled instance's subtle edge and disabled Trigger; the ring on the
Trigger and Tab from it landing on the first remove button, never on
the input.

Break checks (D-035 §3): the dashed edge dropped (`solid`); the dragging
surface dropped (the page's surface); the item hairline dropped (`0px`);
the name's truncation dropped (`false`). Each failed on exactly the test
named for it.

<a id="d-088"></a>

## D-088 — `Tree` rulings: nested items with both states controllable, focus on the row that owns its group, and a ring the rule would not let me remove

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/Tree.md`
(status) · **Extends:** RULES §5.5 and §6, D-019, D-082 §4, D-035 §3

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. Two parts; a node with children is a parent; both states controllable; collapsed children unmounted

`Tree` (`role="tree"`, `label` required) and `TreeItem` (`value`,
`label`, `icon`, `disabled`, its child items as `children`). A node is a
parent because it has child elements — counted, not declared. `expanded`
(an array) and `selected` (one value) each come controlled or
uncontrolled (RULES §5.5). A collapsed node's children are not rendered,
so the DOM holds exactly the visible items and the keyboard walks
`[role="treeitem"]` in document order; the ARIA pattern's optional
type-ahead is deferred, as is multiple selection.

### 2. Focus on the row, which is the `treeitem` and owns its group

The first draft put `role="treeitem"` and focus on the `<li>`, as the
APG example does, and drew the ring on the row with `outline: none` on
the item — which Tier 0.7's lint refused, because RULES §6 says a ring
is never removed, only replaced. The rule was right and the draft was
the thing to change: a ring belongs on the element that has focus, and
an `<li>` is the whole subtree, so a ring around it would circle every
child. The row is the `treeitem` now — focus, the states, the ring
(inset, so the row's own box holds it) — and it owns its group through
`aria-owns`, the `<li>` being `role="none"`. One tab stop: the focused
row, else the selected, else the first top-level item, which the root
reads from its own children so no item has to ask the DOM. The APG keys:
Down and Up through the visible rows, Right expands then enters, Left
collapses then goes to the parent (the row's `<li>`, its group, that
group's `<li>`, its row), Home and End, Enter and Space select and
toggle a parent; the horizontal pair swaps under RTL. A disabled row is
in the tree, skipped and unpickable. A pointer press on the row selects
and toggles; on the chevron alone it toggles.

### 3. Rows on the control scale, indented by one custom property

Each row is `--pp-control-height-sm` tall and indented
`--pp-tree-indent` per level through `--_pp-tree-level`, written on the
`<li>` and read by the row's `padding-inline-start`, so nesting needs
no per-level rule and RTL needs nothing. The chevron and the icon are
`Icon`s at `sm` (D-019's sizing, not a width here); a leaf's toggle is
an empty Icon of the same size, so every label starts at the same x.
The chevron turns a quarter when open, Accordion's device, and is
mirrored under `[dir="rtl"]` (D-082 §4). The selected row is
`--pp-tone-bg` in the accent scope, medium; hover the ghost step; a
label truncates with an ellipsis.

### 4. The screenshot's finding: a mirror and a quarter turn point up

Under `[dir="rtl"]` the chevron is mirrored (`scale: -1 1`) and an open
parent turns it `90deg` — and the two compose into an arrow pointing
up, which every RTL parent on the page showed while the assertions
read only the scale. Open turns `-90deg` under the mirror, and the test
reads both.

### 5. Verified, and the six breaks

Unit: ten tests — the roles, levels, names, `aria-expanded`, the group
rendered only when open and owned by its row; the tab stop's fallbacks;
Down, Up, Home, End and a disabled row skipped; Right expanding then
entering and Left collapsing then rising, reported; Enter and Space
selecting and toggling; presses on the row and the chevron and a child's
press; an owner for both states and a holding controlled tree; `label`
required at the type level and an item outside a tree; refs,
`className`, `style` and the level variable; axe in both themes.
Browser: the tree its cell's width and every row the tree's; the row
height; the indent per level; the selected surface and weight; hover;
the chevron turned when open and not when closed; a long label
truncating at 240 and not at 960; Tab into the picked row with the ring
on it and out of this tree; RTL indenting from the right with the
chevron mirrored and Arrow Left expanding.

Break checks (D-035 §3): the indent dropped; the selected surface
dropped; the chevron's turn dropped; the row height dropped; the RTL
mirror dropped; the RTL turn dropped. Each failed on exactly the test
named for it.

<a id="d-089"></a>

## D-089 — `CodeBlock` rulings: the frame and not the highlighter, a `<pre>` that is a region, the code stretched by a grid, and a gutter under the D-019 exemption

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `.stylelintrc.json`
(`CodeBlock.css` in the D-019 group), `docs/specs/CodeBlock.md` (status) ·
**Extends:** D-019, D-021, D-081 §1 and §3, D-035 §3

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. The frame, not the highlighter; `code` for text, `CodeBlockLine`s for tokens

Highlighting is a peer, as the roadmap said: a highlighter is large,
opinionated about grammars and themes, and best run at build time or
by the consumer's choice, so the component takes plain text (`code`,
split into lines, a trailing newline not a line) or the consumer's
lines (`CodeBlockLine`, holding whatever their highlighter produced,
`highlighted` to point) and draws the frame, the gutter, the pointing
and the copy button around either. Both given warns, and the children
win. `title` is a node and replaces the HTML attribute of the same name.

### 2. The `<pre>` is a named region that scrolls; `wrap` wraps

A long line never pushes the page: the `<pre>` scrolls on the inline
axis, and it is `role="region"` with `tabindex="0"` named by the title
or `label` — Table's reasoning (D-081 §1) — so a keyboard user can
scroll it. `wrap` makes long lines wrap instead. The code inside is
stretched by a grid, Table's device (D-081 §3): the `<pre>` is a grid
with one item, so the code is the pre's width when the lines are short
and the longest line's width when they are not, and a pointed line's
surface runs under every column, including the ones scrolled out of
view — with no width on anything. Dropping the grid left the code two
pixels short of the frame, which the test reads.

### 3. The gutter is an intrinsic box, and declares `inline-size` under D-019

Line numbers are a CSS counter in each line's `::before`, `user-select:
none` so a hand copy never takes them, right-aligned in a box three
digits wide. That box declares `inline-size`: not a decision about the
parent's space but the size of a fixed thing, like an icon's, which is
what the D-019 exemption is for; the file joins that stylelint group.
The spacing beside it is padding, and the header's copy button sits at
the end by `justify-content`, not by an auto margin — both of which the
value rules refused first, rightly. A pointed line is the accent `bg`
step across the whole width with an inset accent bar at its start
(mirrored under RTL); the surface, frame, radius and mono face are
Code's and Card's.

### 4. The copy button and its test

The button writes the block's text (`code`, or the lines' text) with
the Clipboard API, says "Copied" in its label and a hidden
`role="status"` for two seconds, and is absent when the API is missing
or `copy={false}`. user-event's `setup()` installs a clipboard stub of
its own, so the unit test's mock is installed after it; and the stub
under fake timers never settled, so the return after two seconds is
waited for on real timers rather than advanced. The browser test grants
the clipboard permissions and reads the text back.

### 5. Verified, and the five breaks

Unit: eight tests — the frame, the region named by the title and by
`label`, the lines of `code`, `lineNumbers`, `highlightLines`, the
header and its absence; children lines and both forms given; the copy
button writing, saying "Copied" and returning; the lines' text copied;
no button without a clipboard or with `copy={false}`; `wrap`, refs,
`className`, `style`; axe in both themes. Browser: the sunken surface,
the hairline, the mono face; the counters and their `user-select`,
the gutter one width; the pointed line's surface and bar as wide as the
code; the long line scrolling inside the region at 240 and 960 with
nothing spilling from the block or the page; wrap wrapping in a narrow
parent; the ring on the region and the button; a copy read back from
the clipboard and the label returning; the bare block with no header
and its `label`.

Break checks (D-035 §3): the highlight surface dropped (transparent);
the counter dropped (`none`); the pre's `overflow` dropped (`visible`,
both tests); `pre-wrap` dropped (`pre`); the grid dropped (the code
two pixels short of the frame). Each failed on exactly the test named
for it.

<a id="d-090"></a>

## D-090 — `AvatarGroup` rulings: a list with a count, overlap by a grid and not a margin, and the group's size written into the faces

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/AvatarGroup.md`
(status) · **Extends:** D-016 §7 (the item it adds), D-021, D-070 §1,
D-035 §3

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The last of Tier 5's own items.

### 1. A `<ul>` of the children, the first `max` shown, the rest one count drawn as an avatar

One part. Each child sits in a `<li>`, so a screen reader hears "list,
4 items" and then each `Avatar`'s name; `label` names the list. `max`
shows the first `max` and then one more item, the count — `+2`, named
"2 more" (`moreLabel` rewords it) — drawn with `pp-avatar` and the
group's own class after it, the two-class contract (D-070 §1), on the
sunken surface in muted text. A `max` at or above the count shows none;
`max={0}` shows only the count.

### 2. Overlap by a grid whose columns are narrower than a face

A negative margin is the usual overlap and RULES §2 bans it. The group
is an inline grid, `grid-auto-flow: column`, its columns a face less
the overlap, so each item starts inside the one before it; the last
runs past its column by the overlap and the group pads its end by the
same amount, so its hug box holds it — the parent sizing the boxes it
created (D-021), with no margin and no width. Each face carries a ring
the colour of the surface. Later items sit over earlier ones, document
order, and RTL runs the row from the right with nothing said. Dropping
the end padding put the last face outside the group's box, which the
test reads.

### 3. `size` is the group's, and the group's variables have their own names

`size` on the group writes Avatar's private `--_size` and `--_font-size`
from the group's stylesheet, Toggle's device for Button, at a
specificity that outranks an avatar's own `data-size` on purpose: one
`size` sizes every face and the count, and "set it on the group" is the
rule. The first draft wrote `--_size: var(--_size)` — a custom property
that references itself is a cycle, invalid at computed-value time, and
every face would have lost its size. The group's own variables are
`--_face` and `--_face-font`. The unit test cannot see that; the
browser test measures the faces at every size.

### 4. Two things the screenshot said

**A fixed overlap clipped the initials.** `--pp-space-2` (8px) is the
whole margin beside a pair of initials in a 32px face, and at `sm` more
than that: the second letter of every face but the last went under its
neighbour. The overlap is a fifth of the face now — 4.8, 6.4 and 8px —
so the initials clear at every size, and the property still overrides
it.

**"+2" read "2+" under RTL.** A plus sign and a digit are both bidi-weak,
so the RTL paragraph reordered them. The count's text is an isolated
left-to-right run (`dir="ltr"` on the hidden fallback span), and the
test reads its direction.

### 5. Verified, and the five breaks

Unit: five tests — the list and its items, all shown without `max`;
`max` and the count's name, text, size and tone, none at or above the
count, `max={0}`; `size` and `moreLabel`; ref, `className`, `style`;
axe in both themes. Browser: the group hugging in every cell and the
same width in all three; each face a size less the overlap after the
last; the first and the last inside the box; the box's width the sum;
the ring's colour and width; the count sunken and face-sized; the
faces 24, 32 and 40px by the group's `size`; RTL from the right; a
group of five beside text hugging with no count (a flex item is
blockified, so `inline-grid` computes to `grid`, and the width is the
claim).

Break checks (D-035 §3): the overlap dropped (faces a full size apart);
the end padding dropped (the last face outside the box); the ring
dropped (`none`); the count's surface dropped (the tone's solid); the
group's size dropped (the faces at Avatar's own sizes). Each failed on
exactly the test named for it.


<a id="d-091"></a>

## D-091 — `DatePicker` rulings: Input's box with a button and Calendar behind it, text parsed on commit in the locale's order, and the text the value's unless mid-edit

**Date:** 2026-09-28 · **Status:** accepted · **Amends:** `docs/specs/DatePicker.md`
(status) · **Extends:** D-070 §1 (the two-class contract), D-076 (Input's
box with a button in it), D-086 (`Calendar`), D-035 §3

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The last of Tier 4, which waited on 5.9.

### 1. Input's box with a text field and a calendar button; `Calendar` in a `Popover` behind it

One part. The root carries `pp-input` and `pp-date-picker` (D-070 §1),
so Input.css sets the size variables and the states; this stylesheet
draws the box — a two-column grid holding a bare text field and the
button — from Input's hooks, Combobox's device (D-076). The field's own
ring is transparent, never removed (RULES §6), and the box carries the
ring when the field has focus. The button is a Popover trigger
(`aria-haspopup="dialog"`, `aria-expanded`); the panel is `pp-popover`
and `pp-date-picker__panel`, a non-modal `role="dialog"` named by the
button's label, placed below the box and start-aligned, holding a
`Calendar` at `sm`. Opening puts focus on the calendar's tab stop, a
pick sets the value and closes, and focus returns to the button;
Arrow Down in the field opens it too. In RTL the button is at the
start of the box with nothing said: the grid's columns are logical.
The browser test reads the box's height, edge and radius against an
Input beside it, the button inside at the end and the box's height
less the border tall, the ring on the box, the panel's placement, the
calendar's size and its padding, and the button at the left under RTL.

### 2. Typed text is parsed on commit, in the locale's order; the text is the value's unless the reader is mid-edit

`formatDate` writes the value with `Intl` in the locale's numeric form
(`09/28/2026`, `28/09/2026`, `٢٠٢٦/٠٩/٢٨`); `parseTypedDate` reads
`YYYY-MM-DD` as is, else three numbers in the order
`formatToParts` gives the locale's year, month and day, a two-digit
year this century. Both are exported and both are overridable by
`format` and `parse`. Enter and blur commit; text that does not parse
marks the field invalid and reports nothing; an emptied field reports
`undefined`.

**The first draft kept the text it had typed after a controlled owner
refused the change.** It held the text in state, mirrored the value
into it in an effect, and wrote the new formatted text on commit before
calling `onValueChange` — so an owner that did not take the change was
shown as if it had, and the unit test that renders a fixed `value` read
the typed date back. The text is derived now: a draft holds what is
typed until commit, and committing drops the draft, so the field shows
whatever the value became — the new date when the owner took it, the
old one when it did not. A draft that did not parse stays, marked
invalid, until it is edited or emptied. No effect, no ref.

### 3. `value` is the ISO date; a form gets it by `name`; the Field's precedence

`value` / `defaultValue` / `onValueChange` (RULES §5.5), the value an
ISO date or `undefined`. With `name`, a hidden input carries the ISO
value, because the visible field carries the locale's text. `min`,
`max`, `isDateDisabled`, `today`, `weekStartsOn` and `locale` pass to
the calendar; `size`, `invalid`, `disabled`, `required` and `readOnly`
follow the Field with the tier's precedence, the field's `id` and
description landing on the text input its label points at. `readOnly`
disables the button as well: a panel that could pick into a read-only
field would be a lie.

### 4. Verified, and the four breaks

Unit: twelve tests — the helpers in three locales; the box and the
button's name and state; typing, Enter, blur, ISO and an emptied
field; unparsable text marking invalid; the dialog opening, a pick,
and focus back; Arrow Down and Escape; `min`/`max` on the calendar;
Field integration; the hidden input and a refusing controlled owner;
ref, `className`, `style`, `readOnly`; axe closed and open in both
themes (the `region` rule off, DropdownMenu's reason). Browser: the
box against an Input in every cell, the ring, the panel, a pick
filling the field and closing, RTL, and the five states' heights.

Break checks (D-035 §3): the box's grid columns dropped (the button
below the field); the box's ring dropped (`0px`); the button's height
dropped (its content's height, 20px short); the panel's padding
dropped (`0`). Each failed on exactly the test named for it.

<a id="d-092"></a>

## D-092 — The authoring commit records the geometry of what it authors

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** D-013 (the
authoring loop), D-042 (an authoring commit as a PR's head), the
`/component` build step · **Extends:** D-050 §5, D-066 §2

### 1. What failed

Run 174 on PR #33 was a `pull_request` run whose head was CI's own
authoring commit for 4.13 `DatePicker` — the commit the workflow's
comment said could not get a run, because a push made with
`GITHUB_TOKEN` triggers none. Its actor was the bot, and it was re-run
by hand the next morning. `npm test` was red on it: the geometry guard
(`tests/unit/screenshot-dimensions.test.ts`) counts baselines without a
manifest entry and allows fewer than three, and the commit carried four
— the component's two and the index's two, which are always authored
together when a page joins the index. Every authoring commit of this
batch had the same shape; the earlier ones were superseded within
minutes by the local recording push, and this one was the head when
the day ended.

The loop of D-066 §2 was: `--rebaseline index`, push, CI authors, pull,
`npm run dimensions`, push again. The recording step was local, so
between the authoring commit and the recording push every authoring
commit was, by construction, a commit the guard fails. D-063 §3 accepted
exactly that red run "by design" for the one-off re-authoring of every
baseline, and the workflow's own comment ("an authoring commit should
never be the final head of a PR, and nothing here can enforce that")
described the gap without closing it. A red run that is expected is
still a red run somebody has to read, and this one was read as a test
failure, which is what it was.

### 2. The commit records what it authors

The `visual` job's authoring step now runs `npm run dimensions` before
`git add tests/visual/__screenshots__`, so the manifest entries for
the authored files land in the same commit, at the runner's geometry.
That is the geometry the manifest exists to hold: the recorder's own
caveat says to run it against committed baselines because a local PNG
is a different Chromium build, and CI's authored file is that
committed baseline before it is committed. The default mode adds
missing entries only, so nothing an earlier commit recorded is
overwritten (the D-050 §5 rule stands); the deliberate window that
`--rebaseline` opens — no file, no entry — still exists, and CI still
closes it, now completely.

Consequences: an authoring commit passes `npm test` on its own, so it
may be a PR's head; the local step after a pull is gone from the
`/component` build box, which now says to pull the authoring commit
before the next push; the guard's unguarded count should read zero on
every commit, and its limit is for a baseline that arrived some other
way. The one recording that this decision does not cover is this
round's own, made locally against the already-committed files, as the
loop always was.

### 3. What was not changed

The guard's limit of three stays: lowering it to zero would be right
after this change but would fail the very push that carries it if any
baseline were still unrecorded, and the number was never the point.
The `workflow_dispatch` fallback stays, for the case the comment was
written for. The `checks` job does not run the recorder: recording on
a compare run would bless drift, which is what D-050 §5 forbids.

<a id="d-093"></a>

## D-093 — Run 176 was red and none of it was a pixel: a copy button that hydrated against different HTML, and four reads taken inside a window; Tiers 4 and 5 swept to `done`

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** `src/components/CodeBlock/CodeBlock.tsx`
(the copy button), `docs/specs/CodeBlock.md` (its tests), the playground's
root layout (`HydrationMark`), `tests/visual/fixtures.ts` (new — the
suite's `test`), `tests/visual/harness.spec.ts` (three assertions),
ROADMAP.md (twenty-two rows, the Current state block) · **Extends:** D-013,
D-054 §1, D-066 §3, D-069 §2, D-089 §4

PR #33 merged with run 175 green on its final head, every baseline of the
batch authored on the branch and compared. Run 176, `main`'s push run on
the merge commit — the same tree — was red: `Visual regression` failed
with **no `-diff.png`** (the classifier's `changed` was false, so no
screenshot moved), one harness self-check failed on both attempts, and
four tests passed on their retry, the first retry any of them had ever
needed. Each was looked at rather than re-run. Five mechanisms, one of
them a defect.

### 1. `CodeBlock` rendered its copy button only where `navigator.clipboard` existed

`showCopy = copy && canCopy`, where `canCopy` asked for
`navigator.clipboard.writeText` at render. Node 22 has a `navigator` and
no clipboard; a browser on a secure origin has both. So the server
rendered a header without the button and the client rendered one with it,
and React, finding different HTML, threw error **#418** and re-rendered
the root on the client — replacing every node on the page, on every load
of `/components/code-block`, deterministically. A crawl of all 65
playground pages with `pageerror` captured found exactly this one page
(the Avatar page's one failed resource is its deliberately broken image).
The flaky `wrap` test had read `getComputedStyle` on an element that was
detached between the locator resolving it and the read, which is what an
empty `whiteSpace` string means.

The spec had it right (§1: "when the API is missing it stays 'Copy code'
and does nothing") and its own test list had it wrong ("absent with
`copy={false}` or no clipboard"). The button now renders whenever `copy`
is on; the press writes to the clipboard inside a `try` and does nothing
without one. The DoD box "no hydration mismatch" had been checked by
reading; a unit test now renders the block to a string with no clipboard,
hydrates that HTML in a jsdom that has one, and asserts
`onRecoverableError` and `console.error` were never called. The
consumer-visible change is a patch: a block on an insecure origin shows a
button that does nothing where it showed none.

### 2. A colour read inside the frame that started a one-frame transition

The harness self-check reads the Matrix's background, presses Dark, reads
it again, and after a reload expects the second reading. Run 176 stored
`oklab(0.993998 -0.0000516772 -0.000172317)` as `dark` — the **light**
colour, spelled in `oklab` — and read `lab(5.09398 …)` after the reload.
The reset's reduced-motion rule (`transition-duration: 0.01ms` on
`:where(*)`) leaves `transition-property` at its initial `all`, so under
`reducedMotion: 'reduce'` every property change on every element that
declares no transition of its own is a transition of one frame, and a
`getComputedStyle` inside the frame that started one returns the
transition's start value in its interpolation space. The
`not.toBe(light)` guard passed on the spelling: `oklab(…)` is not the
string `lab(99.4 …)` even when it is the same colour.

The suite now has one helper, `settled(page)`: two animation frames, not
one — a callback in the next frame runs before that frame's style update,
which is where the transition begins, and only the frame after it is past
the 0.01ms (measured: one frame after `dir` was set the positions were
still LTR, two frames after they had swapped). The reset is not changed.
One frame of transition on a reduced-motion page is what the rule is for,
every component that animates already answers for itself in
`pp.components` (Input.css's own comment), and the test was the thing
reading too early.

### 3. Escape between a second dialog mounting and the first learning it was no longer topmost

Radix's `DismissableLayer` decides "am I the topmost layer" from a set it
joins in an effect and re-renders every layer to re-read one render
later. The nested-dialog test pressed Escape as soon as the second dialog
was visible; once, on run 176, that keydown found both layers believing
they were topmost, and both closed. The same render that tells the first
layer otherwise gives it `pointer-events: none`, which is the observable
form of the state the test meant to wait for, so the test waits for it.
Not a Radix bug worth a report: a user cannot press Escape inside one
render of a dialog opening.

### 4. The Scroller's RTL positions, read inside the same one-frame transition

`layers(rtl)[2]` read `0% 50%` — the LTR value — once. §2's mechanism
exactly: `background-position` animates, `Scroller.css` declares no
transition, so under the reduced-motion reset the swap the `dir`
attribute causes is a one-frame transition. The first rewrite of the test
put the set and the read in one synchronous `evaluate`, on the theory
that the three round trips had left a window, and that version failed
**every time** with the same LTR value — which is what identified the
mechanism, and a probe confirmed it: synchronous read LTR, one frame
later LTR, two frames later RTL, and with `reducedMotion` off the
synchronous read is RTL. The test sets the attribute, waits for
`settled`, then reads.

### 5. A DatePicker control read as unfocused, two reads after it was focused

The test focused the control, saw the box's ring, and then read
`outline-color` on the control as `currentColor` — no `:focus-visible`,
which on an `<input>` means no focus. This one is **not established**.
Not §2: the control sets `transition-property: none` under reduced
motion, and the value read is the unfocused one, not a start value. A
probe of twelve loads, six of them acting before waiting for hydration,
found the control focused and transparent on every read. What the test
does now: polls the colour rather than reading it once, and asserts the
style beside it (a transparent ring is still a drawn ring, RULES §6).

And one window is closed on principle rather than on evidence. `page.goto`
resolves on `load`; React hydrates after that on its own scheduler; a
test that focuses, clicks or sets an attribute in between acts on server
HTML React is about to take over. Locally hydration is done by `load`
every time (the probe checked); on a loaded runner nothing says it is.
The playground's root layout now renders a `HydrationMark` after the
page, whose effect — run after every effect in the page's tree — writes
`data-hydrated` on `<html>`; the suite's `test` (`tests/visual/fixtures.ts`,
imported by both specs) waits for it after every `goto` and `reload`.
Both specs, because the theme self-check reloads and then presses a
switcher that is a client component, and a press on a button that has
not hydrated does nothing. The screenshots do not change: the attribute
styles nothing, and `toHaveScreenshot` already waited for a still page.

### 6. Tiers 4 and 5 swept to `done`

The twenty-two `review` items — 4.5–4.14, 5.1 and 5.3–5.13 — each had
every Definition of Done box checked but the CI-authored baseline. Their
baselines were authored on the PR branch and compared green on run 175,
the PR's final head, and again on run 176 on `main`, where no baseline
differed (§0 above: the red was never a screenshot). That is the evidence
D-013 asks for, so each row and each spec's status line moves to `done`
in one commit, dated today, citing both runs. Done count 51 → 73 / 80.
The five findings above are in the same PR because a `done` that lands
on a red `main` is not one; the local harness suite is green end to end
with the changes.

### 7. What was not done

Nothing was retried to see if it would pass, no test was skipped or given
a tolerance, and the reset's reduced-motion rule stands. "Flaky" turned
out to be three mechanisms and one open question: a component defect a
crawl found in a minute, a one-frame transition the harness read inside
of twice, a Radix render the harness pressed a key inside of, and one
read that is now polled. The label is where a diagnosis stops, not what
one is.

<a id="d-094"></a>

## D-094 — `ThemeProvider` rulings and findings: `value`, not `theme`; the attribute follows state only once state is the stored choice; the script survives minification

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** `docs/specs/ThemeProvider.md`
(§3, §5, status), the playground's root layout and `ThemeSwitcher`
(`theme-script.ts` deleted), `src/test/setup.ts` (`matchMedia`) ·
**Extends:** D-010, D-063 §1, D-069 §1, D-093 §1, D-093 §5

Written and built under the standing delegation (D-069 §1). Every
recommendation adopted; one prop renamed before the first test ran.

### 1. `value` / `defaultValue` / `onValueChange`, because RULES §5 bans `theme`

The spec's first draft named the controlled prop `theme`, and the rule
lint refused it: RULES §5 lists `theme` beside `color`, `kind` and
`appearance` as names a component may never give a prop, because on any
other component it would be a synonym for `tone`, and the lint enforces
the list by name, not by intent. D-069 §1 says a spec that would bend a
rule stops and asks; this one did not need to, because the rules already
name the alternative — §5.5's `value` / `defaultValue` / `onValueChange`
for every controllable state — and it reads right: the provider's value
*is* the theme. `useTheme()` keeps the word for its `theme` field, which
is not a prop. Spec §3 and the props table were rewritten before the
build; the docs page says why in one line, since the first thing a reader
will type is `theme=`.

### 2. The attribute follows state only after state is the stored choice

The first client render must match the server's, so `theme` starts at
`defaultValue` and the stored choice is read into state in an effect. An
effect that wrote the attribute from `theme` on every change — the
obvious shape — would run on mount with `theme` still `system` and
**remove** the attribute the pre-paint script had just set, one render
before the stored choice arrived: a frame of the wrong theme, on every
load, in the component whose one job is that frame. The attribute effect
is gated on a `ready` flag the mount effect sets *after* it has queued the
stored value, so the first write from state is a write of the right
value. State, not a ref, so StrictMode's second mount is the same path. A
client-only mount with no server script takes the same route and ends in
the same place.

### 3. A change from another tab is reported

The spec's props table said `onValueChange` fired on `setTheme`; the
build fires it on a `storage` event too, and the spec now says so. An app
that mirrors the choice to a server wants to hear about the tab that
changed it as much as the button that did.

### 4. Next minifies the serialised function; the ES5 body is why that is fine

The script is `applyTheme.toString()` with three JSON arguments. In the
playground's production HTML it arrives as `(function f(a,b,c){try{var
d=c;…` — SWC renamed and shortened it — and it runs, because nothing in
it needed a helper or a transform: `var`, no arrows, no template strings,
no optional chaining. That constraint is written on the function. It sits
in the served body immediately after Next's own hidden boundary `<div>`
and before the playground's `.shell`, which the browser suite asserts on
the served text, not the DOM.

### 5. The playground is a consumer now

`next/script` and `theme-script.ts` are gone from the layout;
`ThemeProvider` is the first child of `<body>`, and `ThemeSwitcher` is
three lines of `useTheme()`. Same storage key, same two stored values,
same attribute, same `ButtonGroup` of three `Toggle`s, so the screenshot
suite's stored choice, the harness's `setTheme` helper and every baseline
are untouched. The index page gains a tier heading and a card, so its
baselines are re-authored (D-066 §2). The `HydrationMark` of D-093 §5
stays where it was, after the page.

### 6. Verified

The served HTML carries the script inside `<body>` before the shell;
under an emulated dark system with no attribute the page is dark, `light`
differs, `dark` equals the system's, `system` clears; a page-level
consumer sets the provider the chrome reads, all three readouts and the
switcher agree, the choice is stored and survives a reload applied before
React. The pre-paint function is unit-tested as a function against
stored, default, controlled, `null` key and a throwing storage; server
HTML hydrates in a client with a stored choice with no recoverable error
(D-093 §1's shape); `resolvedTheme` is `unknown` on the server, the
system's after mount, and follows a `change`. 15 unit and 3 browser
assertions; a crawl of every page finds no hydration error. jsdom needs a
`matchMedia` stub, added to the suite's setup and documented on the docs
page as the ResizeObserver one is.

<a id="d-095"></a>

## D-095 — `ThemeToggle` rulings and findings: the face is the stylesheet's, the name is content, and hiding the other face is the only rule it needs

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** `docs/specs/ThemeToggle.md`
(status, anatomy) · **Extends:** D-010, D-030 §2, D-030 §10, D-070 §1,
D-073 §2, D-094

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. Gate B read 6.1's `review` — baseline only — as
`done` (D-073 §2).

### 1. Both faces in the DOM, one displayed by the token layer's own scopes

`resolvedTheme` is `undefined` until mounted (D-094), so a toggle that
rendered from it would swap its face after hydration on every load. The
toggle renders a sun, a moon and two visually hidden labels, and four
rules hide the pair that does not apply: `:root[data-pp-theme="light"]`
hides the dark pair, `:root[data-pp-theme="dark"]` the light pair, and
with no attribute `prefers-color-scheme` decides — the four scopes the
tokens are generated for (D-010), read from the toggle's side. The face
and the page's colours are therefore the same decision, made by the
browser before React runs, and `display: none` takes the hidden label out
of the accessibility tree, so the displayed label is the button's whole
name. The served HTML carries both strings; the browser suite asserts
which is displayed and what the button is called under each scope.

`prefers-color-scheme` in a component stylesheet is new and is not the
media query RULES §1 bans: that ban is viewport features, and the stylelint
list (`width`, `min-width`, `max-width`, `device-width`) says so. A
component knowing the user's colour preference knows what its own tokens
know.

### 2. Hide the other face; restate nothing

The first draft hid every face by default and then displayed the right
one — which meant writing `display: inline-flex` for the icon (Icon's
value) and `display: inline` for the label (VisuallyHidden's), two facts
about other components' stylesheets copied here to drift. The rule set
now only hides: each face keeps its own component's `display`, and this
file states nothing about either. Four selectors, one declaration.

### 3. `:root`, so a toggle in a dark panel on a light page offers dark

D-010 scopes nest, and the descendant combinator would match a nearer
`[data-pp-theme]` — inside `<aside data-pp-theme="dark">` on a light page
both a "light" and a "dark" rule would apply and both faces would show.
`:root[data-pp-theme]` reads the document only, which is what the toggle
controls. Asserted with that markup: the panel's background is the dark
page colour and the toggle in it shows the sun.

### 4. Button, with IconButton's class

IconButton's `label` is `aria-label`, which wins over content; the name
here must be content (§1). So the root is `Button` carrying `pp-button
pp-icon-button pp-theme-toggle` — the two-class contract (D-070 §1),
which IconButton.css's own comment invites ("the root carries BOTH") —
with `variant="ghost"` and the icon `size` passed through exactly as
IconButton does them (D-030 §10). Button wraps children in
`pp-button__content` (D-030 §2), so the anatomy has that span; the spec's
anatomy was corrected before the build. The browser suite measures the
toggle beside an `IconButton` of each size: square, the same height,
sm < md < lg.

### 5. Verified

Under `light` the sun is `inline-flex`, the moon `none`, the name "Switch
to dark theme", no `aria-pressed`, no `aria-label`; a press writes `dark`
on `<html>` and to storage, the faces swap and the name flips; under
`system` with an emulated dark system the moon shows with no attribute
and a press chooses `light`; the nested-scope case of §3; the boxes of
§4; the served HTML has both labels. In jsdom: the classes and Button's
attributes, both faces with `data-when`, the press setting the opposite
of `resolvedTheme` from light, dark and a dark system, `onClick` first
with `preventDefault()` respected, `disabled`, custom labels and icons,
the empty-label warning, the throw outside a provider, axe in both
themes. 7 unit and 5 browser assertions. The chrome keeps its three-way
switcher (spec §7): no existing baseline moves; the index gains a card.

<a id="d-096"></a>

## D-096 — `AppShell` rulings and findings: slots because the root must own `<main>`, a skip link that is clipped rather than sized, and a block size that is the parent's

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** RULES §5.6 (one
recorded exception, below), `docs/specs/AppShell.md` (status) ·
**Extends:** D-016 §5, D-021, D-022 §2, D-045, D-069 §1, D-081 §4

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. Element slots, and why this is the one component that has them

RULES §5.6 prefers `<Card><CardHeader/></Card>` to `<Card headerTitle=…>`,
and every compound so far is child parts as named exports (D-079 §1).
`AppShell` takes `header`, `sidebar` and `footer` as element props and
renders `children` in `<main>`. Three reasons, and the exception is as
narrow as all three together:

- The root is a Server Component and must own `<main>`: the skip link's
  `href` is the main's `id`, the main needs `tabIndex={-1}`, and a server
  root has `useId` (D-081 §4) but no context to hand an id to a child
  part. Child parts would move that wiring to the consumer, who would
  forget it, which is how every app page ends up without a skip link.
- The frame has one arrangement. Parts a consumer can order are parts a
  consumer can misorder, and the stylesheet would then place them by
  grid area against the DOM order — visual order one way, reading and
  tab order the other, which is the accessibility bug grid areas are
  famous for.
- `{children}` in a Next layout is the page. `<AppShell …>{children}</AppShell>`
  is the line, and it reads as what it is.

§5.6's objection is to *configuration* — scalar props that describe
content — and an element slot is composition: the consumer's tree, placed.
The parts keep `pp-app-shell__*` classes and component properties, so the
styling contract is unchanged. A second component wanting slots has to
meet all three reasons, not one.

### 2. The skip link is clipped, not sized

`VisuallyHidden`'s technique is a 1px box plus `clip-path: inset(50%)`
(D-016 §5 exempts that file from the `inline-size` ban for it). Showing
such a link on focus means undoing the box — `inline-size: auto` — and
`inline-size` is on stylelint's disallowed list for every other file. The
skip link therefore uses the clip alone: `position: absolute`, its
content's own size, `clip-path: inset(50%)` until `:focus-visible` sets
`clip-path: none`. Invisible and out of flow while unfocused, read by a
screen reader either way, one declaration to show, no banned property.
It sits at `--pp-z-overlay` so it is above a `sticky` header, which is at
`--pp-z-sticky` and later in the DOM.

### 3. Surfaces, not sides

A hairline on the sidebar's inline end is right beside the content and
wrong along the page's edge once `Split` stacks the sidebar, and moving it
to the block end when stacked means a container query keyed on Split's
`data-collapse-below` at Split's three thresholds — the numbers restated
in a second file, D-045's drift. The sidebar is `--pp-color-bg-sunken`
instead, which needs no side; the header and footer keep hairlines
toward the content, which have one side in both layouts.

### 4. `min-block-size: 100%` is the block-axis form of `fill`

RULES §1 forbids a component to declare its inline size because that is
the parent's decision; `min-block-size: 100%` makes the same deference in
the other axis — the shell is as tall as its parent says, and in a parent
that says nothing it is as tall as its content. The playground's tall
section gives the wrapper `20rem`; the shell measures 320px, the footer's
bottom is the wrapper's, the sidebar surface runs the body's height. The
shell never reads the viewport; the app writes `html, body { block-size:
100% }` once, in its own stylesheet, if it wants a full-height frame.

### 5. Verified

At 240 and 480 the sidebar is the shell's full width and the main is
below it; at 960 the sidebar is 256px (`16rem`) beside the main. The skip
link is the root's first child, clipped, and on focus has `clip-path:
none` inside the shell's top-start corner; `Enter` moves focus to a
`<main>` whose id is the link's `href`, with a ring inside its edge. The
sticky header stays at the scrolling wrapper's top after a 200px scroll;
the default header is `static`. No sidebar, no `.pp-split`; under
`dir="rtl"` the sidebar is at the right, flush with the main's end. In
jsdom: `banner`, `main`, `contentinfo`, the `<nav>` inside the sidebar,
the skip link first with the main's id, `tabIndex={-1}`, frame order,
Split's knobs on the body, `data-sticky`, absent header and footer, the
root's `ref` / `className` / `style` / rest, a server string whose skip
link names the main, axe in both themes. 5 unit and 5 browser assertions.
`data-sticky` is written as Button writes `data-loading` — present, valued
`"true"` by React — and the stylesheet keys on presence.

One finding about the gallery, not the component. The skip-link test first
pressed the *last* cell's link and read the last cell's main: focus had
gone to the *first* cell's. `AppShell` is a Server Component, so React
renders its `useId` once, and the playground's Matrix duplicates that
rendered output into three cells — the three shells share one main id,
and a fragment navigation finds the first element with it. A page has one
shell (spec §1's "one per page"), so no consumer sees this; the gallery
already has three `<main>`s on purpose and now has three equal ids for
the same reason. The test targets the first cell and says why. D-035 §1's
rule — nothing in the chrome writes an id — was about this hazard from
the other side.

<a id="d-097"></a>

## D-097 — `PageHeader` rulings and findings: a wrapping row instead of areas, and the library's one visual reorder

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** `docs/specs/PageHeader.md`
(status) · **Extends:** D-020, D-070 §1, D-079 §1, D-083

Written and built under the standing delegation (D-069 §1), every
recommendation adopted.

### 1. A wrapping flex row, because a grid area you did not fill still costs its gap

The natural shape — `grid-template-areas: "crumbs crumbs" "title actions"
"description actions"` — has two faults the flex row does not. A row that
exists in the template exists in the layout, so a header with no
breadcrumb starts with a `row-gap` above its title; and parts placed by
area can be written in any DOM order, which lets the reading order and
the painted order disagree by accident. In a flex row that wraps, an
absent part is an absent row, `gap` sits only between rows that exist,
and the painted order is the DOM order except where §2 says otherwise on
purpose. The title's `flex-basis` of `--pp-measure-xs` is the one number:
a row that cannot hold that much title beside the actions sends the
actions down, which in the playground happens at 240 and 480 and not at
960 — no container query, no threshold restated from anywhere.

### 2. `order: 1` on the description

DOM order title, description, actions is what a screen reader should
hear: the page, its line, then its buttons. Painted order title, actions,
description is what every page header looks like. The description
carries `order: 1`, and the divergence is acceptable for a reason that is
checkable rather than argued: the description takes no focus, so no
sequence a keyboard user follows is reordered — the tab order is the
breadcrumb's links then the actions' buttons in both orders. Recorded as
the library's one visual reorder, so the next one has to say why it is
also harmless.

### 3. The breadcrumb is placed by its class

`Breadcrumb` (5.6) is a landmark with its own name and needs nothing
added; the header names `.pp-breadcrumb` once, to give it a row. The
roadmap's Deps cell says 5.6 for exactly this. A `PageHeaderBreadcrumb`
wrapper would be a part that only sets `flex-basis`.

### 4. Verified

At 960 the actions share the title's row and end at the header's end,
with the title ending before them; at 240 and 480 they are under the
title and above the description, starting at the header's start; the
breadcrumb is above the title in all three and starts at the header's
start. Without a breadcrumb the title starts at the header's top in all
three headers of the second section; a description alone sits `--pp-space-2`
under the title; `level={2}` renders an `<h2>`. Under `dir="rtl"` the
actions end at the header's left and the breadcrumb starts at its right.
In jsdom: the four parts on their base components with both classes, the
breadcrumb in place, the DOM order, level 1 by default and 2 when told,
`tone="muted"` and `gap="2"` by default and overridable, refs,
`className`, `style` and rest on every part, a server render, axe in both
themes. 4 unit and 3 browser assertions.

<a id="d-098"></a>

## D-098 — `Toolbar` rulings and findings: a text field is never the stop, the controls are re-read by an observer, and a press remembers without focusing

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** `docs/specs/Toolbar.md`
(§2, §4, tests, status) · **Extends:** D-020, D-030 §7, D-035 §3, D-069 §1,
D-086 §2

Written and built under the standing delegation (D-069 §1), every
recommendation adopted; one ruling added by the first unit run.

### 1. A text field is never the remembered stop

Spec §4 leaves the arrows to a text field and says "`Tab` out and back is
the way from the field to the buttons". The first build remembered the
field like any control, and the unit test for §4 showed the two rules
contradicting each other: focused, the field became the stop; `Tab` out
and back landed on the field; its arrows were the caret's; and every
control after it in the toolbar was unreachable from outside by
keyboard. The stop now skips a text-editing control — `remember()`
returns for `textarea`, `contenteditable` and an `input` whose type is
not one of the eight that do not edit text — so the stop stays on the
last button focused (else the first), the field is reached by the
arrows, and `Tab` back in lands on a control the arrows work from. The
test walks it: from the field, `Tab` leaves, `Shift+Tab` returns to the
remembered button, `End` reaches the control after the field; a click in
the field does not make it the stop either. Spec §2 and §4 say so now.

### 2. Found by the DOM, and re-read by a MutationObserver

Spec §1 says the set is "re-read after every render and on every key". A
render of the *toolbar* is `useLayoutEffect` with no dependencies, but a
control that a child component disables from its own state re-renders
that child and not the toolbar, so a MutationObserver on the root watches
`childList`, `subtree`, and the attributes that change what is a control
or its tabindex (`disabled`, `aria-disabled`, `hidden`, `href`,
`tabindex` — the last for a consumer's own write). The toolbar writes
`tabindex` only where it differs, so its own pass produces no mutation
the observer would loop on. Asserted with a button enabled by another
button's state after mount.

### 3. A pointer press remembers its control without focusing it

Chromium focuses a pressed button; Safari does not. The root's click
handler finds the control under the press and makes it the stop without
calling `focus()`, so the next `Tab` in lands there on either engine and
nothing is focused that the user did not focus.

### 4. Verified, and the three breaks

Unit: ten tests — the role, name, `data-orientation`, `aria-orientation`
only when vertical, the first control at `0` and the rest at `-1`, a
disabled control and a Separator untouched, a ButtonGroup keeping its
group; the arrows through the group and past the disabled control,
wrapping, `Home`/`End`, vertical arrows ignored in a row; `loop={false}`
and the vertical keys; RTL by `direction: rtl`; the remembered stop
across `Tab` out and `Shift+Tab` back, a click as the stop; the stop
handed to the first when it unmounts and a control enabled later picked
up (§2); the text field (§1); the consumer's `onKeyDown` first and
`preventDefault` respected, `gap`, ref, `className`, `style`, rest,
`label` required at the type level; a server render with the role and
no `tabindex`; axe in both themes. Browser: one tab stop from a button
before to a button after and back to the remembered control, exactly one
`tabindex="0"`; the row wrapping at 240, one row at 960, the toolbar as
wide as the cell in all three, 8px between controls; under `dir="rtl"`
`ArrowRight` moving to the control on the right; the vertical toolbar
stacked at one left edge with `aria-orientation`, `ArrowDown` moving,
`ArrowRight` not, `End` then `ArrowDown` staying with `loop={false}`.

Break checks (D-035 §3): `flex-wrap` dropped (the narrow cell overflows);
`gap` dropped (0px between controls, in the row and the column);
`flex-direction: column` dropped (the vertical toolbar a row). Each
failed on exactly the test named for it. `align-items: center` and
`min-inline-size: 0` are stated, not claimed: every control in the
gallery is the same height, and the row wraps by its content (D-079 §3).

<a id="d-099"></a>

## D-099 — `NavSidebar` rulings and findings: plain links over a roving tree, a closed list that is `hidden`, and an author `display` that beat the user agent's `hidden`

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** `docs/specs/NavSidebar.md`
(status) · **Extends:** D-030 §7, D-048 §1, D-069 §1, D-075, D-088 §4,
D-096 §3, D-096 §8

Written and built under the standing delegation (D-069 §1), every
recommendation adopted. The last component of the roadmap.

### 1. `hidden` needs its own rule where a component declares `display`

Spec §3 renders a closed group's list and marks it `hidden`, so the map is
in the HTML and the closed part is out of the accessibility tree and the
tab order. The first build gave every list `display: grid` in
`pp.components`, and an author declaration beats the user agent's
`[hidden] { display: none }` whatever its layer: the closed list was
laid out, its links painted, its chevron still pointing right. jsdom
could not see it (no layout); the browser test read the closed list's
client rects and got one. `.pp-nav-sidebar__list[hidden] { display: none }`
is the rule, and the same hazard holds for any component that sets
`display` on an element a consumer or the component may hide with the
attribute. Asserted by the closed list having no rects and by the break
check that drops the rule.

### 2. A second "fix" the break check removed

Reading the same failure, a `grid-template-columns: minmax(0, 1fr)` was
added to the item and group on the theory that an auto track took the
long label's max-content width. The break check for it passed every
test: an auto track in a container of definite width does not exceed
that width, and the row's `min-inline-size: 0` with the label's
`overflow: hidden` already hold the row. The declaration and its comment
are gone; a mechanism that no test observes is not stated as one (D-079
§3, D-035 §3). What the widths had measured was the same defect as §1,
read before it was understood.

### 3. Plain links, and why the dependency on `Tree` is its row

The APG's navigation treeview would make every link a `treeitem` under
one tab stop; the disclosure navigation menu keeps them links, each a
tab stop, a group a button with `aria-expanded`. An app sidebar is
short, and a roving nav costs "Tab to the next link", the browser's own
link navigation, and find-in-page matching the keyboard model. The row
is drawn as `Tree`'s (D-088): the small control height, the indent per
level through one custom property the `<li>` writes, the accent surface
for the current link, the chevron turned a quarter when open and
mirrored under `[dir="rtl"]` the way D-088 §4 found. The `<a>` and the
`<button>` fill their rows because an item and a group are grids: a
button is shrink-to-fit under any display of its own (D-075).

### 4. Not a drawer, by composition

`AppShell` §3 sent "a sidebar that becomes a drawer" here. It is not a
mode: it would render the nav twice with each half hidden by a query
whose threshold is restated from `Split` (D-045's drift) or move a
landmark in an effect, and its trigger belongs in the app's header. An
app composes a `NavSidebar` inside a `Drawer` and shows the trigger
below its own threshold.

### 5. Verified, and the eight breaks

Unit: eight tests — the landmark and its name, a titled section's list
named by `aria-labelledby` and an untitled one not, the item's icon
decorative and its `end` in the row (and in the name: "Inbox 3" is what
a count means); `aria-current` on the current link only, the group
holding it open by default and `data-current`, the level per `<li>`; a
group's button with `aria-expanded` and `aria-controls` over a list that
is rendered and `hidden`, a click and Enter toggling it, `onOpenChange`,
controlled holding; Tab reaching every link and toggle in order and
skipping a closed group's links; `asChild` with the class, `aria-current`
and the ref on the child and the row built around its children; an item
outside a section throwing; refs, `className`, `style` and rest on every
part; a server render with the whole map and the closed list `hidden`;
axe in both themes, closed and open. Browser: every row 32px and the
nav's width; a nested row's content one indent (16px) in; the current
link on a surface the others lack, in the page's text colour at medium
weight, the holding group's toggle at medium too; the closed list with
no rects and an unturned chevron, the open one turned; the long label
truncating at 240 with its row still the nav's width; the ring on the
link; in `AppShell` the nav beside the main at 960 in a 256px sidebar and
above it at 240 and 480; under `dir="rtl"` the indent on the right and
the chevron mirrored, turned the other way when open.

Break checks (D-035 §3): the `[hidden]` rule dropped (the closed list
laid out); the indent dropped (0 in LTR and RTL); the current surface
dropped (transparent); the row height dropped; the chevron's turn
dropped; the RTL mirror dropped; the item's grid dropped (rows narrower
than the nav, in the shell too); the truncation dropped. Each failed on
exactly the test named for it; §2's track minimum failed none and was
removed.

<a id="d-100"></a>

## D-100 — `KeyHints` (6.7) added and built: the parked modifier idea as three gestures, hints that stagger, and one `isEditing`

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** ROADMAP.md (a
row added), `docs/specs/KeyHints.md` (status, anatomy), `docs/specs/Toolbar.md`
by reference (§4's test moves), `src/components/Toolbar/Toolbar.tsx` ·
**Extends:** D-016 §7 (the item it adds), D-067 §2, D-069 §3, D-070 §1,
D-078 §4, D-094

### 1. The idea, and what of it is buildable

D-069 §3 parked "holding a modifier switches the components into
combinations that expose more of what they can do". Asked whether it is
doable: a version is, and the literal one is not. A page cannot claim a
modifier — Ctrl and Alt are the OS's, the browser's, and every screen
reader's — a held key is a signal the page loses on blur, and WCAG 2.1.4
forbids a single-character shortcut that cannot be remapped or turned
off while 2.1.1 requires everything to work without the gesture. What
survives is what the good keyboard products ship: a held key that
*reveals* shortcuts on their controls (Slack, Superhuman), a jump mode
that labels every control (Vimium), a help sheet on `?` (GitHub,
Gmail), and the command palette the library already has. Approved as
the next `/component` item, added as 6.7 (the denominator 80 → 81), spec
written and built in one session under D-069 §1.

### 2. The rulings

A shortcut is declared on the control (`data-pp-hotkey`) or registered
as a command (`useKeyHint`), one registry, CommandPalette's chord
grammar (D-078 §4) plus space-separated sequences with a one-second
window. A chord with a modifier fires anywhere; a bare key never fires
inside a text field and every key is skipped when a component already
handled it. The reveal is a picture — the page under it is exactly the
page — so a lost `keyup` costs a flicker, and release, another key, a
blur or a hidden document ends it. `revealKey` defaults to `null`: which
modifier an app can afford is its call. Jump focuses and never
activates. The sheet is a `Dialog`. `helpKey`, `jumpKey` and
`revealKey` are props and `null` turns each off (2.1.4). A modifier that
changes what a component does is ruled out, not deferred: its keyboard
walkthrough would no longer match its APG pattern (RULES §6).

### 3. Hints that would overlap climb

The first screenshot showed two things the harness had not: a chord
drawn as one crammed keycap, and the hints of three adjacent buttons
overlapping into an unreadable pile. A hint is now a row of `Kbd`s, one
per key; and after the hints render, each is measured against the ones
placed before it and lifted by its own height until it clears them —
upward, away from the controls, because the second draft staggered
downward and the screenshot showed the hints covering the very buttons
they described; at the viewport's top the stack climbs down instead.
The browser test asserts no two hints intersect, every hint sits at
its control's corner or a whole number of hint heights above it, and
none is below its control's top edge.

### 4. One `isEditing` for the library

`Toolbar` §4's test for "a key pressed in a text-editing control" moves
to `src/internal/editing.ts`, and both components import it. Not a
behaviour change; Toolbar's ten tests pass unchanged.

### 5. What the overlay may declare

`position: fixed; inset: 0` is the viewport-sized box a fixed layer is
given, the one shape RULES §1 names as an exception (D-067 §2), and the
hints are positioned by inline `top` and `left` from each control's
rect, which is a JavaScript measurement and not a stylesheet width. The
overlay is `aria-hidden` and takes no pointer events; the jump status is
a visually hidden live region.

### 6. Verified, and the four breaks

Unit: ten tests — `formatKeys` on Apple and elsewhere; an element
firing on its chord (focus, then click) and not another, a mod chord
inside a field; a sequence within and past the timeout, disabled, and
never a bare key in a field; `defaultPrevented`; reveal drawn, one
keycap per key, removed on release, another key and blur; jump labels,
narrowing, a full label focusing, `Escape`, the live region, the key
typing inside a field; two-letter labels past nine; the sheet's rows
with keycaps, `null` turning keys off; the hook outside the provider
throwing and a command unregistering; axe with the sheet open in both
themes. Browser: while `Alt` is held, three hints for three controls at
the tooltip layer with no pointer events, `aria-hidden`, each a row of
mono keycaps at its control's corner or climbing from it, none
overlapping; `f` labelling every focusable control in view, typing the
Save button's label focusing it, `?` opening the sheet with seven rows,
`Ctrl+S` firing the button.

Break checks (D-035 §3): the overlay's layer dropped (`auto`); its
`pointer-events` dropped; the hint's offset dropped (no hint at any
corner); the hint's `position: absolute` dropped. Each failed on exactly
the test named for it.

<a id="d-101"></a>

## D-101 — Run 187 red: a baseline stale by D-093's own change, and two reads inside a window

**Date:** 2026-09-29 · **Status:** accepted · **Amends:** `tests/visual/__screenshots__`
(code-block re-baselined), `tests/visual/harness.spec.ts` (two tests),
`src/components/KeyHints/KeyHints.tsx` · **Extends:** D-013, D-066 §2,
D-093 §1, D-093 §2, D-100 §3

The visual job on the head that added 6.7 failed with one `-diff.png`
and two tests that passed on retry; the seven new pages and the index
were not authored because nothing is authored on a red run (D-066 §1).
Each was looked at.

### 1. `code-block-dark` differed because D-093 §1 changed what CI renders

D-093 §1 made the copy button render whenever `copy` is on, where it had
rendered only when `navigator.clipboard` existed — and it recorded the
consumer-visible change: "a block on an insecure origin shows a button
that does nothing where it showed none". CI's playground is served on
plain `http://127.0.0.1`, an insecure origin, so the baseline authored
before that fix shows no button and the page now shows one. The dark
diff crossed the 1% pixel-ratio tolerance; the light one did not, which
made the light baseline silently stale. Both are re-baselined
(`npm run dimensions -- --rebaseline code-block`) for CI to author, the
deliberate move of D-066 §2. The previous PR description's "no baseline
is touched by this PR" was written without noticing that the runner's
origin is the one D-093 §1 itself described.

### 2. The CommandPalette input's outline, read inside the one-frame transition

The test read `outline-color` on the focused input and got the
unfocused colour once. D-093 §2's mechanism exactly: the input declares
no transition, the reset's reduced-motion rule makes the change to
`transparent` a one-frame transition, and the read landed inside it.
The test waits for `settled(page)` after the panel is visible, as the
theme self-check and the Scroller test do since D-093.

### 3. KeyHints' stagger, computed against the fallback face

The overlap assertion of D-100 §3 failed once and passed on retry. The
hints are measured after they render to lift the ones that would
collide, and on a cold cache they were measured before JetBrains Mono
had loaded — narrower in the fallback face, so no collision was found,
and when the font arrived the keycaps widened into each other. The
component now re-places its hints on `document.fonts`' `loadingdone`,
which recomputes the stagger against the real widths, and the test waits
for `document.fonts.ready` before holding the key. The screenshot suite
has waited for fonts since D-026; the harness had no reason to until a
component measured text.

Repeating the test locally then failed it once in six with fonts cached,
which the font could not explain. The stagger measured each hint's
rendered box and computed its offset from there — and a second pass
(after a scroll, a font, any re-place) measured boxes that already
carried the first pass's offsets and staggered them again, against
themselves. Each measurement is now taken back to the hint's base
position by subtracting the offset it was rendered with, so every pass
starts from the same place; the test also settles two frames before
reading. Sixteen of sixteen runs pass.

### 4. What was not done

No test was retried to see if it passes, none was given a tolerance,
and the reset is unchanged.

<a id="d-102"></a>

## D-102 — The playground on a phone: four galleries that locked it, a chrome with two gutters, a palette and a demo that pushed it sideways, and a 1px box that widened it

**Date:** 2026-10-06 · **Status:** accepted · **Amends:** `playground/app/globals.css`
(the chrome, the ramp, the dialog stage), `playground/app/tokens/page.tsx`, the
Dialog, AlertDialog, Drawer and CommandPalette pages and galleries,
`playground/harness/gallery.ts` (new), `src/components/VisuallyHidden/VisuallyHidden.css`,
`docs/specs/tier-1-atoms.md` §1.4, `playwright.config.ts` (the `phone` project),
`tests/visual/phone.spec.ts` (new), `tests/visual/screenshots.spec.ts`,
`tests/visual/harness.spec.ts`, every screenshot baseline · **Extends:** D-013,
D-041, D-050 §5, D-062 §2, D-063, D-066 §2, D-068 §4, D-071 §6, D-093 §3

Asked what would make the library cooler, and then to "try mobile reso also"
and "fix it all". Nothing in the suite had ever opened the playground
narrower than 1280px. At 390x844 with touch, five things were wrong, and the
test written for them found a sixth in the library itself.

### 1. The four modal galleries open only when asked

Dialog, AlertDialog, Drawer and CommandPalette opened three modals at load,
for the screenshot. Three modals lock the page's scroll and pointer and hide
the rest of it from assistive tech, and the page told the reader to press
Escape three times — a key a phone does not have. Measured with raw touch
events, with Button and Popover as controls: a swipe scrolled those two from
0 to ~1187px and moved none of the four. AlertDialog's scrim does not dismiss
by design, so a phone had no way out of that page at all; CommandPalette's
loaded pre-scrolled and cropped sideways by its three inputs' focus.

Each cell now has its own trigger, "Open in this cell", and its dialog opens
over that cell and takes focus as any dialog does. `?gallery=open` opens all
three at load as before; it is read on the server from the page's
`searchParams` (`harness/gallery.ts`), so the first render knows which page it
is and nothing changes on hydration. The screenshot suite passes it through a
`query` field kept apart from `path`, so the registry guard (D-041) reads the
slugs unchanged. Open-autofocus is prevented only in that mode (D-062 §2).

The interactive browser tests used to close three dialogs first, an Escape
each, waited out — the dance in which run 176's Escape closed two at once
(D-093 §3). They now run on the page a visitor gets and assert that nothing is
open on it; the gallery tests ask for the gallery; one new test walks a
visitor's path: a cell's trigger, that cell's dialog, focus inside, Escape,
focus back on the trigger.

### 2. The chrome had two gutters, so every baseline is re-authored

`.chrome` carried `padding-inline` inside `.shell`, which already carries the
page gutter (D-071 §6). Its rows sat 32px inside the page's left edge up to
768px and 24px inside it at 1280px — the suite's own width — and met it only
from about 1328px. The padding is gone; the rows and `.page` are the same
1200px column in the same box, and share both edges at every width.

That moves the header in every page's pixels, and the chrome gains three
places (D-104 §6), so every baseline is deleted for CI to author (D-013): the
window D-050 §5 describes, in which nothing is compared. Which pages may
change height was measured rather than assumed: every page in both themes,
settled as the suite settles it, on a production build of `main` and of this
branch, locally (the absolute heights are this Chromium's; the deltas are
what CI will see, D-050 §5). Four moved: the index (+575px, the front door),
AlertDialog (+26) and CommandPalette (+25), whose gallery prose grew a line,
and Combobox (−4, §7's flag gone). Those are re-baselined with
`npm run dimensions -- --rebaseline` (D-066 §2); the other 68 keep their
manifest entries, so the geometry guard holds their heights through the
window — a page that came back a different height would be something other
than the chrome. The new pages (D-104 §7) are authored fresh.

Two did. On run 192, CI's re-run of its own authoring commit, Dialog and
Drawer came back 2px taller in both themes, and the guard failed the commit,
which is its job. The PR merged with it red, so `main` carried the failure
until the follow-up re-baselined both. Neither layout moved. The local
measurement missed one kind of text. A bare `<code>` in the playground's
prose gets the browser's generic `monospace`, resolved on each machine, and
not the JetBrains Mono that `layout.tsx` pins. On the runner, a line holding
one is 2px taller than a plain line; locally it is not. The new gallery prose
put `?gallery=open` on a line that held no code before. In CI's own
screenshots that line alone is taller, and everything below it is the same
pixels 2px lower. AlertDialog and CommandPalette gained the same kind of line,
and their re-baselines took the runner's numbers unseen: +30 and +27 there,
against +26 and +25 measured. AlertDialog's is 4px because the runner broke
the snippet after its `?`, so two of its lines hold code. Dialog and Drawer
are re-baselined with `--rebaseline`, not re-recorded: overwriting an entry
after authoring is the blessing D-050 §5 forbids, however well the drift is
explained. Fifty-eight playground files hold a bare `<code>`, the one text
the pinning misses. That, and AlertDialog's stray `?`, are follow-ups.

Below 40rem the chrome is no longer sticky. Wrapped to four or five rows, it
held 17–29% of a phone's screen (140–247px of 844) for the whole scroll; the
shell's gutter halves there too. A viewport query is the page asking about
the device it is on — a page's business, never a component's (RULES §1) —
and the suite's 1280px is untouched by it.

### 3. `VisuallyHidden` is pinned to its containing block's inline start

Found by §5's test, not by eye: the Spinner page's document was 514px wide on
a 390px phone. The Spinner in the Matrix's 960px cell sits past the phone's
edge inside `.matrix`, which scrolls. Its label is a `VisuallyHidden`,
`position: absolute` with no inset, so it sat at its static position,
positioned against the nearest positioned ancestor — the viewport, outside
the scroller — escaped the scroller's clip, and widened the document. Every
component that embeds one (Spinner, Stepper, ThemeToggle, KeyHints, Field's
hidden label, CodeBlock's status) and every consumer's own had the same
phantom scrollbar waiting past the edge of a horizontally scrolled region.

`inset-inline-start: 0` keeps the box inside its containing block on the
inline axis by construction. The block axis keeps its static position, so a
screen reader that moves to the text still scrolls the page to the right
height. The component is never visible (spec §1.4: not focus-revealing), so
nothing is drawn differently. A browser test puts one past the edge of a
200px scroller and asserts the document did not widen; it places the box
with inline content rather than a flex row, because an absolute child of a
flex container takes its static position at the container's start and would
pass with or without the fix.

Considered and rejected: `position: relative` on the six roots that embed
one. Six containing blocks changed for everything else inside those
components, and a consumer's own `VisuallyHidden` would still escape.

### 4. `/tokens`: the palette scrolls in a Scroller, and its numbers take their ramp's ink

The twelve steps pushed the page 285px past a phone's edge (a 675px
document). They scroll inside the library's own `Scroller` now, shaded at the
edge with more, and each step has a 2rem floor that resolves to the old `1fr`
wherever `1fr` is wider — every desktop width.

Every swatch's number was `text-muted`, which is step 11. On the page whose
prose says every ratio is solved, 50 of the 120 numbers were under 3:1, and
step 11's read 1.00:1 against itself. Each step now takes its ramp's own ink
for "text on this": 12 on steps 1–8, `on-solid` on 9–10, 1 on 11–12, every
pairing one `lint:contrast` asserts or sits on the ramp between two that it
does. The worst of the 120 is 4.60:1 (dark success 8).

### 5. A `phone` project

`playwright.config.ts` gains `phone` — 390x844 CSS pixels, touch, `isMobile` —
which runs `tests/visual/phone.spec.ts` and nothing else. It visits every
registry page (read from `registry.ts`, as the unit guard does, so there is no
third list) plus the index, `/tokens`, `/harness` and every page D-104 adds,
and asserts three things: the document is no wider than the screen; a swipe
scrolls the page — raw touch events through the DevTools protocol, because a
scroll set from script proves nothing about a lock, which only refuses
gestures; and the chrome, once scrolled past, has gone with the page.
Behaviour only: a second set of baselines would double what CI authors to say
what these assertions already say.

Its first run failed on two pages, and neither was the playground's. The
Spinner was §3. The Combobox page was §7: a first fix to its demo's grid was
a fix to a symptom, and the next run said so.

### 6. `next dev` writes into `playground/`

Next 16's dev server writes an `AGENTS.md` and a `CLAUDE.md` into the app's
directory on every start unless told not to — two untracked files after every
`npm run dev`. `agentRules: false`. The repository's agent guidance is its
root `CLAUDE.md`, and what a consuming app's agent reads ships in the package
(D-105).

### 7. Two shipped defects the new pages found, and a rule for the second's class

**`Combobox` could not be narrower than ~256px.** `.pp-combobox__box` was
`grid-template-columns: 1fr auto`, and a bare `1fr` has an automatic
minimum: the field's min-content, which is the native `<input>`'s intrinsic
width from its `size` — 210px at `md`. The input itself already had
`min-inline-size: 0`; the track never let it use it. So the control
overflowed the Matrix's own 240px cell, and **the harness had been flagging
it** — "overflows its parent", on the page and in its baseline — since 4.11
was built. A flag that fires on a page nobody reads as failing is a flag
that stopped being read; the phone project is what turned it into a red
test. `minmax(0, 1fr)`; a browser test asserts no cell on the page is
flagged and a 160px parent holds the control. The page's height moves by
the flag's 4px, so it is re-baselined (§2).

**`AppShell`'s skip link read `--pp-font-size-sm`**, which does not exist —
the scale is `--pp-font-size-1` to `-9`, and `sm` is a `Text` size, not a
token. Valid CSS, green stylelint, and an undefined `var()` is invalid at
computed-value time, so the declaration fell back to the inherited size
without a word. Found by the agent building the example screens, reading the
stylesheet. It reads `--pp-font-size-2`, Text's `sm`.

The second is a class, so it gets a rule (D-009): `lint:rules` rule 7 fails a
component stylesheet that reads a `--pp-*` property no token file or library
stylesheet declares, unless it is a component's own override hook
(`--pp-<component>`, `--pp-<component>-*`), undefined by design until a
consumer sets it. Run over the whole library it found exactly this one. The
self-test's fixture reads `--pp-font-size-sm` and a hook of its own; it must
catch the first and pass the second.

**Found and not fixed here**, each recorded for its own item: `AvatarGroup`'s
overlap of a fifth of a face does not allow for the 2px ring each face draws
outside itself, so a wide pair of initials ("AT") loses its second letter
(D-090 §4's gallery uses narrow ones); `Split` still attaches `Split.Sidebar`
and `Split.Main` and exports neither by name, which RULES §5.6 and D-079 §1
rule out for every other compound; `ButtonGroup.md` says a group is not for a
single choice while `ThemeToggle.md` and the playground's switchers use one
for exactly that; every `CodeBlock`'s default name is "Code", so a page of
them is a page of identical regions; and a `Code` inside a `Link` keeps its
neutral ink rather than the link's.

<a id="d-103"></a>

## D-103 — 0.12: a consumer's accent goes through the library's own generator and its own checks — `pixel-perfect/theme`, a CLI and a lab

**Date:** 2026-10-06 · **Status:** accepted · **Amends:** ROADMAP.md (0.12
added), `scripts/generate-tokens.mjs`, `scripts/check-contrast.mjs`,
`scripts/color.mjs` (moved to `src/theme/color.mjs`), `package.json`
(`exports["./theme"]`, `bin`) · **Extends:** D-005, D-008, D-010, D-011, D-050,
D-056 §2, D-059, ThemeProvider spec §9

The library's most distinctive claim — every colour solved for its contrast
target, and verified independently of the code that solved it — had no form a
consumer could use. An app whose brand was not hue 258 had one route: hand-
override seventeen palette tokens in each of four theme scopes, and lose the
guarantee doing it.

### 1. The solver and the checker are a module, and the library's output did not move

`src/theme/palette.mjs` is `generate-tokens.mjs`'s solving code, moved, with
the hues as a parameter. `src/theme/check.mjs` is `check-contrast.mjs`'s
palette assertions — per hue, per ramp, and the shipped ring on every hue's
surfaces — moved, and run on CSS text. The scripts import them. `npm run
tokens` writes byte-identical `primitives.css` and `semantic.css` (CI's
freshness step would fail otherwise), and `lint:contrast` still counts 305:
the semantic mappings stay in the script, because they are the library's
alone. D-008's independence holds: the checker never sees the solver's
numbers, only the text it wrote.

They live in `src/theme/` as `.mjs` because the build's `allowJs` already
compiles them into `dist/theme/` with types generated from their JSDoc, and
the scripts import the source directly, so neither needs a step the other
lacks. No package and no tool was added (D-005).

### 2. The solid fill's walk waits for its pressed state

`solveSolid` stopped at the first lightness where step 9 read 4.5:1 against its
text, and `buildRamp` then threw if `solid-active`, two hover steps on, did
not. For the library's hues that never happened. For a consumer's mid-light
fill carrying dark text it does, so the walk now waits for both. Walking
toward more contrast with the text helps both, in either theme, with either
text; and for the library's hues the first lightness at which the fill passes
is one at which the pressed state already did, so their output is unchanged —
§1's byte-identical files are the proof.

### 3. What `createTheme` writes, and from what

The complete palette, every hue in both themes, not only the accent: each
hue's focus ring is solved against every hue's surfaces (D-056 §2), so a new
accent moves all five rings. In the four theme scopes primitives.css uses
(D-010), in its order, inside `@layer pp.overrides` after a copy of the
library's layer order statement — so it wins over `pp.tokens` whichever file
is imported first, and inside it an element carrying `data-pp-theme="dark"`
still takes the dark block, which comes later at the same specificity.
Palette only: the semantic set is declared on the same elements by the
library and resolves there against the re-declared palette, which is D-011's
rule satisfied by construction.

Where the fill starts: in light, at the colour's own lightness, so the button
is the brand's colour whenever that colour can carry text; in dark, lighter
by +0.15 at L 0.55 and below falling to +0.02 at L 0.80 and above — the
library accent's own offset and the library warning's — in a straight line
between. The walk does the rest and the summary says how far it went: green
`#16a34a` carries white text at 3.3:1, so its light fill takes dark text and
moves from L 0.627 to 0.692. Inputs clamp to L 0.25–0.92 and chroma 0–0.37; a
bare hue keeps the library accent's chroma and lightness; `neutral: 'accent'`
or a hue leans the greys. The file's header names the accent, the command
that made it and how many assertions pass.

The library accent reproduces all 340 declarations of `primitives.css`, and
96 accents — 24 hues by four lightness and chroma pairs — pass all 290
assertions; both are unit tests. Not a third theme: ThemeProvider §9 closes
`Theme` to two, and this changes neither their names nor their count.

### 4. The lab

`/theme`: Sliders for hue, chroma and lightness, or a colour typed; the solve
runs on the deferred value, so the thumb never waits for it (about 30ms in
Node); the stylesheet goes into `<head>` from an effect, so the whole page —
chrome included — wears it, exactly as an app that imported the CLI's file
would. The first render is the library accent, which the generator
reproduces, so the server's HTML is already right and nothing hydrates
differently. Beside the controls: the checks' verdict and where each theme's
fill landed; below them both themes side by side, its checkable controls
toned on their `Field` as their docs say (D-059); then the stylesheet and the
command to take away.

### 5. The CLI

`pixel-perfect theme --accent <colour> [--neutral accent|<hue>] [--out <file>]`.
It reports where each theme's fill landed and whether it moved to carry its
text, writes nothing and exits 1 when an assertion fails or the input is not a
colour, and exits 2 without the subcommand. `bin` is `dist/theme/cli.mjs`,
built on install like the rest (a git dependency runs `prepare`).

### 6. The roadmap

0.12, in Tier 0 because it is the token layer's, in `review`. With 0.13
(D-105) the denominator moves from 81 to 83.

<a id="d-104"></a>

## D-104 — 0.10: the playground is the docs site — docs rendered by the library, a stage you can resize, three examples, and the rules as a page

**Date:** 2026-10-06 · **Status:** accepted · **Amends:** ROADMAP.md (0.10),
`playground/app/page.tsx`, `playground/harness/Chrome.tsx`,
`playground/harness/Stage.tsx` and `stage.css` (new), `playground/harness/Markdown.tsx`
(new), `playground/app/docs`, `playground/app/examples`, `playground/app/rules`
and `playground/app/theme` (new) · **Extends:** D-012, D-063 §4, D-096

### 1. One app, not two

0.10 was deferred "until there are components worth documenting"; there are
69. A docs framework would be a second app, with its own theme, its own
rendering of the components through somebody else's chrome, and a second
deployment. The playground already consumes the package exactly as an app
does (D-012), already deploys, and keeps its harness pages exactly as the
screenshot suite needs them; the docs are new routes beside those.

### 2. Component docs, rendered by the library

`/docs/<slug>` renders `docs/components/<Name>.md` — the files the repository
already keeps — through `marked`'s lexer into `Heading`, `Text`, `Code`,
`CodeBlock`, `Table`, `Link` and `Separator`; no HTML from a file is injected.
A link to a sibling doc goes to its page, `../RULES.md` to `/rules`, anything
else in the repository to GitHub. Each page leads to its harness page, where
every variant is at three widths in both themes. `marked` is the playground's
dependency and never the library's: RULES §8 governs what ships.

### 3. The Stage

A box a person can resize, with a composition in it. The library's one claim
a screenshot cannot make is that a component answers to the box it was given
and never to the viewport; the Matrix shows it with three frozen widths,
which is what a screenshot can compare, and the stage lets a person drag the
box from a phone to the page and watch every `@container` rule inside answer.
Three ways to set the width, because a drag is not a way everyone has: the
edge, the Phone/Tablet/Full presets, and a `Slider`, which carries the name a
screen reader reads; the drag edge is hidden from assistive tech, which has
the Slider. The frame is the query container and never wider than the page's
column.

### 4. Three examples

`/examples`: Settings, Sign-up and Dashboard for a fictional product,
Launchpad, built from the library and nothing else, each on a stage and each
saying what to watch for between narrow and wide. Settings is an `AppShell`
with a `NavSidebar` whose current item follows the hash, a `PageHeader` whose
Save submits the profile `Form` by its `form` attribute, and switches that
apply at once outside it (Switch.md: a switch beside a Save button is a
checkbox). Sign-up is a `Card` in a `Container` with a `Stepper` that turns
from a row into a column by its own width, and a `Form` whose error summary
takes focus and links to each field. Dashboard is stat `Card`s in a `Grid`,
`Tabs` over a `Toolbar` and a sortable, filterable `Table` of 128 seeded
deploys with `Pagination` — seeded, so the server and the client render the
same rows. The pages are Server Components with small client islands; the
only CSS is four rules for what the library has no part for. Built by a
delegated agent against the components' docs; what it found in the library
is D-102 §7.

### 5. The front door

The index leads with a composition on a stage and the claim it proves, then
three places to start (Examples, Theme, Rules), then every component by tier;
a component's card opens its docs page. `/rules` renders `docs/RULES.md` with
the same renderer as the component docs.

### 6. The chrome

It lists Examples, Theme and Rules beside Components, Tokens and Harness, and
marks Components current on a docs page as on a harness page.

### 7. What is screenshotted

The index, `/theme`, `/rules`, `/examples` and the three examples join the
screenshot suite, two baselines each, authored by CI. The 69 docs pages do
not: 138 baselines of prose would be compared for what the phone project's
fit-and-scroll assertions and the docs tests already say.

<a id="d-105"></a>

## D-105 — 0.13: the package ships what a consuming app's coding agent should read

**Date:** 2026-10-06 · **Status:** accepted · **Amends:** ROADMAP.md (0.13
added), `package.json` (`build`, `build:agents`), README.md · **Extends:**
D-038, D-054 §2

### 1. Why

Rules this strict are exactly what an AI coding tool gets wrong — a
`fullWidth` prop, a margin on a component, `Card.Header`, a viewport media
query around a component — and every one of them renders. Next 16 ships its
documentation inside its package for the same reason; its dev server wrote
an `AGENTS.md` pointing into `node_modules` while this was being built
(D-102 §6).

### 2. What

`npm run build` writes `dist/AGENTS.md` — `docs/for-agents.md` (setup, the
eleven rules that change what an agent writes, the banned list) with an index
of every component generated from its doc's opening paragraph — and copies
`docs/RULES.md` and `docs/components/*.md` beside it. A link to a file that
ships stays relative; any other repository link becomes a GitHub URL, so
nothing an agent follows from `node_modules` is a dead end. The title carries
the package version. The README says how to point an agent at it: one line in
the app's `CLAUDE.md`, `@node_modules/pixel-perfect/dist/AGENTS.md`.

A unit test builds it into a scratch directory — so it needs no `dist/` and
cannot pass on a stale one — and asserts every component doc is indexed once
and no relative link in any shipped file points at a file that did not ship.

### 3. The roadmap

0.13, in Tier 0 because it is packaging, in `review`.

<a id="d-106"></a>

## D-106 — The process docs are read rather than skimmed: an index of the log, anchors its links land on, a Current state that fits on a screen, and a release that fails first

**Date:** 2026-10-06 · **Status:** accepted · **Amends:** CLAUDE.md,
`.claude/skills/component/SKILL.md` (before anything else, tracking
discipline), ROADMAP.md (the Current state block), `docs/HISTORY.md` (new),
`docs/DECISIONS-INDEX.md` (new), every heading in this file, `docs/RELEASING.md`,
`.github/workflows/release.yml` · **Extends:** D-038, D-041, D-054 §2

### 1. An index, and anchors

Every session was told to read this file, the roadmap and the rules before
touching anything: about 520 KB, this file alone ~414 KB — on the order of a
hundred thousand tokens before the first line of work. An instruction that
costs that much is followed by skimming, which is how a ruling gets
re-litigated. `docs/DECISIONS-INDEX.md` is one line per entry — number, date,
title, the title being each entry's summary by this log's own convention — and
`npm run decisions` writes it.

The same command gives every heading an explicit `<a id="d-nnn"></a>`. The
repository links to entries as `DECISIONS.md#d-050`, dozens of times, and
GitHub's anchor for a heading is its whole text, so every one of those links
landed at the top of the file. `tests/unit/decisions-index.test.ts` fails when
the index or an anchor is stale, naming the command (D-054 §2), and when two
entries share a number or one is skipped — the collision two branches
appending at once would make.

### 2. The Current state block is current

The roadmap's Current state block had grown to 846 lines of findings, newest
first, and it is "what a future session reads first". It is in
`docs/HISTORY.md` verbatim; the block now says where things stand in a
screenful and is refreshed on every transition, as the skill always said.
ROADMAP.md went from 1,045 lines to 241.

### 3. The reading order

CLAUDE.md and the component skill now ask for the roadmap, the rules and the
index, then every entry whose title touches the work, in full. This entry
was written that way: the index and about twenty-five entries, in full.

### 4. The npm name

`docs/RELEASING.md` said that setting `PUBLISH_TO_NPM` and adding a token was
all publishing took. `pixel-perfect` is somebody else's name on npm — an
unrelated SCSS package, 2.0.26, last published in 2022 — so that publish is
refused at the release workflow's last step, after everything upstream has
gone green: D-038's shape exactly. The doc says so now, and the workflow's
first step fails under `PUBLISH_TO_NPM` with the reason. Renaming to a scope is
not made here: every import path and the stylesheet specifier change with it,
and which scope is the owner's to say.

### 5. Found and not fixed: an authoring run hides a functional failure

The visual job's last step fails the run when Playwright failed and either a
baseline differed or none was new. A run that authors baselines therefore
passes even if a harness or phone test failed in it — those failures are
not screenshots, write no `-diff.png`, and ride along with the missing
baselines. The next run, which compares, reports them, so nothing is lost
for good; but on a PR whose head is its authoring commit the tick is green
over them. Recorded rather than changed here, because the fix — telling
"failed only for missing baselines" from "failed" in the test results — is a
change to the job that can only be proven on CI.

<a id="d-107"></a>

## D-107 — D-102 §7's five, and a sixth from a phone: a ring the overlap ignored, the last dotted compound, a single choice the library could not draw, a page of regions named "Code", a link's ink, and text iOS enlarged

**Date:** 2026-10-07 · **Status:** accepted · **Amends:** RULES — none;
`docs/specs/AvatarGroup.md` §3, `docs/specs/tier-2-layout.md` §2.6,
`docs/specs/CodeBlock.md` (props), `docs/specs/ThemeToggle.md` §1,
`docs/specs/tier-3a-action.md` §3.4, ROADMAP.md (3.18 added),
`src/theme/check.mjs` (two cross-hue checks), every screenshot baseline ·
**Extends:** D-016 §7, D-019, D-022 §7, D-030 §7, D-031, D-033, D-039 §1 and
§5, D-047, D-059, D-062 §1, D-069 §1, D-070 §1, D-079 §1, D-081 §1, D-089,
D-090, D-101 §1, D-102 §2, §3 and §7

Asked to work on D-102 §7's "found and not fixed", and, mid-way, about a
phone screenshot of `/docs/text` in which some code blocks were set larger
than others "if a code example follows a title directly". The ButtonGroup /
ThemeToggle disagreement was put to the user with three options; they chose
to build the missing control in this PR (§3). Everything else extends a
ruling already made.

### 1. `AvatarGroup`: the overlap counts the ring, and a covered face's initials sit in what is visible

D-102 §7 said a wide pair ("AT") lost its second letter. Measured before
anything changed — each covered face's glyph ink against the outer edge of
the next face's ring, Chromium, the pinned Inter — it was every pair,
including the gallery's own narrow ones, at `sm` and `md`:

| Initials, `md` | before | ring counted only | ring counted, initials centred in what is visible |
| --- | --- | --- | --- |
| AL, AT, KJ (the gallery's) | −1.3 to −1.5px | +0.5 to +0.7 | +3.4 to +4.1 |
| GH | −2.4 | −0.4 | +2.3 |
| MH | −3.6 | −1.6 | +1.6 |
| MW, WW | −5.7, −6.6 | −3.7, −4.6 | −0.4, −1.8 |

D-090 §4 chose "a fifth of the face" so the initials would clear, and each
face's 2px ring, drawn outside it, put the next face's visible edge 2px
further in: what was hidden was a fifth *plus* the ring. Counting the ring
alone still clipped every pair at `sm`. So the columns are a ring wider than
"face less overlap" — the overlap is now how much of a face is hidden, ring
included — and the fallback of every item but the last is padded at its end
by the overlap, which moves Avatar's centred initials to the middle of what
the next face leaves visible. An image fills the face and is untouched; the
last face and the count are whole and stay centred. The box still holds the
faces and not their rings, so the end padding is the overlap less the ring
(it clamps at 0 for an overlap under the ring's width). The group is 2px
wider per covered face.

A pair as wide as the face ("MW", "WW") cannot clear any overlap at `sm` or
`md`; MH clips by 0.7px at `sm`. The docs say so and point at `size="lg"` or
a smaller overlap. The browser test measures the ink of every covered face
in a gallery of AT, GH, MH and KJ at three sizes (MH at `sm` excepted, as
documented) and that the last is centred.

### 2. `Split`'s parts are named exports, and the dotted spelling is gone

`SplitSidebar` and `SplitMain`, with `SplitSidebarProps` and
`SplitMainProps` in place of `SplitSlotProps`. RULES §5.6 says the parts of
every compound are named exports "never properties of the root" (D-079 §1),
and Split — built before D-062 found that a Server Component cannot dot into
a client module — was the one compound still dotted. Removed rather than
deprecated: keeping `Split.Sidebar` beside `SplitSidebar` is the two
spellings for one idea D-079 §1 refused, and the package is pre-1.0, so the
changeset is a minor marked breaking. AppShell, the playground, the docs and
the tier-2 spec move with it; a unit test asserts the root carries neither
property.

### 3. `SegmentedControl` (3.18), added and built: a single choice is a radio group drawn as buttons

`ButtonGroup.md` (D-030 §7) sent "exactly one of several" to "a `RadioGroup`
styled as buttons", which the library could not draw — `RadioGroup` draws
round radios — so `ThemeToggle.md`'s three-way recipe, the chrome's theme
switcher and the Stage presets each used a `ButtonGroup` of `Toggle`s: three
`aria-pressed` buttons, never "2 of 3", of which pressing the pressed one did
nothing. The user was given three options — fix the docs and plan the
component, build it now, or accept Toggles for a single choice — with the
first recommended and the third argued against; they chose to build it now.

Written and built under the standing delegation (D-069 §1), every
recommendation in the spec adopted:

- **Native radios** in `<label>`s, so the browser is the APG Radio Group
  pattern and the value submits and resets (D-039 §5). No roving tabindex;
  a generated `name`.
- **The checked segment is solid neutral, and there is no `tone` or
  `variant`.** Computed first (D-047 §3's lesson): Toggle's pressed fill is
  **1.26:1** against the page in light and 1.49:1 in dark; neutral's solid
  is 5.90:1 and 7.07:1; warning's solid is 1.87:1 in light. The fill is the
  only thing telling a selected segment from the one beside it — states side
  by side, which is where 1.4.11 asks 3:1. `check.mjs` now asserts neutral's
  solid against steps 1–3 in both themes (6 assertions), so the spec's
  number is a check and not a calculation.
- **ButtonGroup's seams and Button's box by the two-class contract**
  (D-070 §1): the root is `pp-button-group pp-segmented-control`, each item
  `pp-button pp-segmented-control__item` with `data-variant="outline"`.
  The stylesheet adds the checked fill (Button's private properties, Toggle's
  device), where the radio sits, and the ring, drawn on the segment from
  `:has(:focus-visible)` and raised as D-033 raises a focused button.
- **Named by `label`, or by the `Field` around it**, RadioGroup's wiring; a
  development warning with neither, because a type cannot see a context
  (D-031's other half).
- **Painted from `:checked`**, Radio's deviation from RULES §4 for Radio's
  reason (D-047 §2); `data-state` emitted for consumers. The browser test
  proves it with a form reset, which changes the radio behind React.
- **One draft corrected before the build:** the input was to cover its
  segment at `inset: 0`. An absolutely placed form control keeps its
  intrinsic size under insets, as a replaced element does, and stretching it
  would take an `inline-size` exemption from RULES §1 — a rule bend, which
  the delegation does not cover. It is not needed: a click anywhere on a
  `<label>` is a click on its radio. The radio is transparent, pinned inside
  the segment (D-102 §3's lesson about an absolute box with no inline inset)
  and takes no pointer events; the harness clicks the segment, as a person
  does.

The chrome's theme switcher and the Stage presets are SegmentedControls now
(the presets with nothing checked once the edge is dragged off a preset);
`ThemeToggle.md`'s recipe, `ButtonGroup.md`'s table and "don't", the
ButtonGroup page and the tier-3a spec say so. 3.18 is in Tier 3 with Deps
3.4, 3.7 and 3.11, in `review` for its CI-authored baselines; the
denominator moves from 83 to 84.

### 4. `CodeBlock` needs a `title` or a `label`

Its default name was "Code", so every block on a page without a title was a
region named "Code" — the docs renderer had worked around it by naming each
block after its heading. Scroller (D-022 §7) and Table (D-081 §1) require a
name at the type level for the same focusable region; CodeBlock now does
too: `title` or `label`, never neither and never both. An untyped caller
with neither gets a development warning and the old name, so nothing breaks
at runtime. Pre-1.0, a minor marked breaking.

### 5. A `Code` inside a `Link` takes the link's ink

`Code` sets its own neutral tone, so inside a link its text stayed neutral
12 beside the link's accent 11 — grey code in a blue link. Inside `.pp-link`
its colour is `currentColor`, the inherited value, so it follows the link at
rest and on hover; the chip stays Code's neutral step 3, and a consumer's
`--pp-code-color` still wins. Each hue's 11 and 12 are solved against that
hue's own step 3, so the pairing a browser draws — accent 11 on *neutral* 3
— is one no per-hue check saw. It holds by a hair (4.56:1 at the worst,
light success and dark danger), and `check.mjs` now asserts all twenty
(each hue's 11 and 12, both themes) at 4.5:1. The Link page gains a section;
the browser test reads the code's colour against its link's, at rest and on
hover, for an accent and a neutral link.

### 6. iOS Safari enlarged the text of anything wider than the screen

The screenshot: on `/docs/text` on an iPhone, the "Usage" block and the
block after "Inline, inside a sentence:" were set visibly larger than the
`import` block at the top. The user's reading was that a block after a
heading inherits its size; the screenshot's own last block follows a
paragraph and is enlarged too, and the first follows a paragraph and is
not. What the enlarged ones share is lines longer than the screen —
measured on a 390px phone, their `<pre>`s scroll 528–847px of content in a
356px box, the first's fits — and that is what iOS Safari's text autosizing
enlarges: text in a block whose lines run wider than the visible width, a
heuristic for desktop pages that misreads content laid out wider on purpose.

Chromium's emulation does not reproduce it (its autosizer compares the
layout width to the device's, equal on a page with a viewport meta), and
there is no WebKit here; every block measured 14px. The fix is the
standard one, placed where the library creates the condition:
`text-size-adjust: 100%` on the three regions that scroll text on the
inline axis — CodeBlock's `<pre>`, Table's region, Scroller — which
Lightning CSS emits with the `-webkit-` prefix iOS reads. Not in the reset,
which "does four things and stops" to the consumer's document; the
playground, an app, sets it on its own `:root`, which also covers the
Matrix's 960px cells on a phone, and `for-agents.md` tells a consuming app
to do the same. The browser test sets the page back to `auto` and asserts
each region still holds 100% on its own. **Confirmed only on the device:**
the runner can say the declaration ships, not that WebKit honours it.

### 7. Every baseline is re-authored

The chrome's switcher is a SegmentedControl, so every page's pixels change
at the switcher — a selected segment that was neutral 5 is neutral 9. That
alone is under the 1% tolerance on most pages, which is exactly the stale
baseline D-101 §1 re-authored rather than left. So every baseline is
deleted for CI to author (D-013), the window D-050 §5 describes. Heights
were measured, not assumed — every page in both themes on a production
build of `main` and of this branch, locally (D-102 §2's method):
three pages changed height — avatar-group (+262px, §1's gallery),
link (+684px, §5's section) and the new segmented-control page — and the
index did not (one more card fits its tier's row), nor did any page behind
the chrome's switcher, which is as tall as the Toggles it replaced. The index
(whose entry records the registry count it was authored with, D-066 §2),
link, avatar-group and button-group are re-baselined with
`npm run dimensions -- --rebaseline`; button-group measured unchanged, but
§3 rewrote a line of its prose that holds a bare `<code>` — the one text
that measures differently on the runner (D-102 §2) — so its height is left
for the runner to record rather than held. The other 148 baselines are
deleted and keep their manifest entries, so the geometry guard holds their
heights through the window; segmented-control's two are authored fresh.

### 8. Found and not fixed

- **A row of pressed Toggles has the same 1.26:1.** §3's number is
  Toggle's pressed fill, which a toolbar's Bold / Italic still use, side
  by side. A multi-select row is not a single choice and was not in scope;
  whether a pressed Toggle needs more than its fill is its own question.
- **A SegmentedControl in a Toolbar** is untested: the Toolbar's roving
  finds every radio as a control and its arrows move without selecting
  (spec, out of scope).
- **The roadmap's 0.10, 0.12 and 0.13** still read "waits on the user's
  review of the PR", and that PR (#35) has merged. Surfaced, not reconciled
  (the skill: a tracking discrepancy goes to the user).

### 9. Verified, and the breaks

Unit: SegmentedControl, sixteen tests — the radiogroup and the two-class
contract, generated and explicit names, uncontrolled and controlled, a click
on the text selecting, nothing selected, `disabled` on the group and an item,
`required`, `size` and `orientation`, the Field's name, description, error,
size and requirement, `label` winning inside a field and the warning with no
name, the prop split, an untyped `role` / `type` / `checked` dropped, a
chained `onChange` and its veto, a form submitting the value, axe in both
themes. CodeBlock gains the type-level and runtime name test; Split the
named-export test; `theme.test.ts` the new count. Browser: §1's clearance
and the corrected geometry; §5's ink; §6's opt-out; SegmentedControl's
seams, fill, heights and hug, keys (wrap, a disabled segment skipped, RTL),
ring, and a form reset. `lint:contrast` counts 331, up from 305.

Break checks (D-035 §3), two broken builds, each break confirmed absent from
the served stylesheet first (D-047 §5): Code's `.pp-link` rule dropped (the
ink test); the ring dropped from AvatarGroup's columns (the geometry test,
and the clearance test with it); the initials' end padding dropped (the
clearance test alone, "sm AT"); CodeBlock's `text-size-adjust` dropped (the
opt-out test); the segment's ring dropped (the ring test); the checked fill
dropped (the fill test, and the reset test that reads it); and
`:has(:checked)` replaced with `[data-state="checked"]` — the reset test
alone, while the fill test stayed green, because inside a group React and
the platform agree until something changes the radio behind React, which is
D-047 §2's argument made a test a second time. Each failed on exactly the
test named for it.

Two browser tests failed in the full parallel run and passed alone, on this
machine. "The ring is on the focused thumb" (RangeSlider) fails the same way
on `main`'s own suite against `main`'s build here — not this branch's, and
`main`'s CI is green, so it is recorded and left. The DropdownMenu submenu
test passed on `main` once and failed twice here, and the race was the
test's: the first sub-item's box was read in the same `Promise.all` as
`placedBox(s)`, so under load it was taken before the panel moved (750px and
836px off its trigger's row). The panel settles first now, then its item is
read — D-066 §3's still box, kept for the item as for the panel.

<a id="d-108"></a>

## D-108 — The roadmap closed: a pressed Toggle is solid, a SegmentedControl in a Toolbar, a visual job that cannot pass over a failed test, the playground's bare code pinned, and 84 / 84

**Date:** 2026-10-07 · **Status:** accepted · **Amends:** RULES — none;
`docs/specs/tier-3a-action.md` §3.5, `docs/specs/Toolbar.md` §5,
`docs/specs/SegmentedControl.md` (out of scope), ROADMAP.md (eleven items to
`done`, the launchpad line closed), `.github/workflows/ci.yml`, 120 screenshot
baselines deleted for CI to author · **Extends:** D-013, D-032, D-047 §3, D-050 §5, D-066 §2, D-069 §1
and §2, D-098, D-102 §2, D-103, D-106 §5, D-107 §3 and §8

Asked to do everything left after D-107: its "found and not fixed", D-106
§5's, D-102 §2's two follow-ups, the sweep of the `review` items, and the
launchpad line. Each part extends a ruling already made; the one API change
(§1) is listed in the PR for reversal before merge, under D-069 §1.

### 1. A pressed `Toggle` is its tone's solid fill, and there is no `solid` variant

D-107 §3 measured Toggle's pressed fill, step 5, at **1.26:1** against the
page in light and 1.49:1 in dark, and left it because a multi-select row was
not in scope. The argument that made SegmentedControl's checked segment solid
applies unchanged: in a toolbar's Bold / Italic the fill is the only thing
telling a pressed toggle from the one beside it, states side by side, where
WCAG 1.4.11 asks 3:1. Computed first, against neutral steps 1–3:

| Solid (step 9) | light | dark |
| --- | --- | --- |
| neutral | 5.90 / 5.66 / 5.31 | 7.07 / 6.59 / 5.90 |
| accent | 4.86 / 4.67 / 4.38 | 7.00 / 6.53 / 5.85 |
| danger | 4.83 / 4.64 / 4.35 | 6.00 / 5.60 / 5.02 |
| success | 4.86 / 4.66 / 4.37 | 8.08 / 7.53 / 6.75 |
| warning | **1.87 / 1.79 / 1.68** | 10.63 / 9.92 / 8.89 |

Pressed is `--pp-tone-solid` with `--pp-tone-on-solid` ink and a border of the
fill. A solid has a darker step, so pressed hovers to `--pp-tone-solid-hover`
and presses to `--pp-tone-solid-active`, as a solid Button does; the old
reason for holding the fill ("no darker step to move to") is gone, and
lighter would still read as releasing. A disabled pressed toggle is Button's
disabled surface with a subtle edge, SegmentedControl's rule. `check.mjs`
asserts neutral's, danger's and success's solid on steps 1–3 in both themes
(18, replacing D-107 §3's 6 for neutral alone): not warning, which fails, and
not accent, which a consumer chooses (D-103) and may choose light. The docs
send a Toggle away from warning with the number.

**No `solid` variant.** Pressed is the solid fill, so a toggle solid at rest
would look the same on and off; before this it was solid off and *lighter*
on, which inverted "off is quiet; on fills in". `ToggleVariant` excludes it;
an untyped `solid` is drawn as `ghost` with a development warning (D-031's
"Omit does not delete properties"). Pre-1.0, a minor marked breaking at the
type level. The playground's variant row loses its solid pair.

An alternative was weighed and not taken: keep the soft fill and add
`--pp-tone-border-strong` (4.59:1 at the worst, every hue, every palette).
It passes for a `ghost` toggle, whose resting state has no edge, but beside
an `outline` toggle at rest the difference between pressed and not is an
edge against an edge.

### 2. A `SegmentedControl` in a `Toolbar` is walked segment by segment

D-107 §8 left it untested: the toolbar's roving finds every radio as a
control, and its arrows move focus without selecting. That is the APG's own
toolbar example, whose text-alignment radio group is walked the same way,
with `Space` selecting — so it is the behaviour, documented and tested
rather than changed. Verified in Chromium before writing it down: a radio
with `tabindex="0"` is a tab stop whether or not another in its group is
checked, so the toolbar's stop on an unchecked segment is reachable from both
sides. Toolbar.md §5, SegmentedControl.md and the Toolbar page say so; a unit
test and a browser test walk Bold → Left → Center, select with `Space`, move
on without selecting, and come back to the segment focused last.

### 3. The visual job reads which failures are only missing baselines (closes D-106 §5)

The job failed only when a baseline differed or none was new, so an
authoring run passed over a harness or phone test that failed in it. CI's
Playwright now also writes a JSON report, and `scripts/classify-visual.mjs`
counts a failed test as awaiting a baseline only if it is in the screenshot
suite and every error of every attempt is Playwright's own "A snapshot
doesn't exist at …". Anything else — another error, a test in another file,
an error outside any test, or no report at all — sets `functional=true`,
which stops authoring and fails the job. The message was read from a real
run with a baseline removed, not assumed; the classifier is unit-tested on
the report's shape. Whether the step behaves on the runner is proven by this
PR's own authoring run, which is the only place it can be (D-106 §5's
reason for not changing it then).

### 4. A bare `<code>` in the playground is set in the pinned mono, and `?gallery=open` stays whole (closes D-102 §2's follow-ups)

`globals.css` sets `:where(code, kbd, samp)` to `--pp-font-family-mono`,
unlayered and at no specificity, so the browser's generic `monospace` no
longer resolves per machine; the library's own `Code`, `Kbd` and `CodeBlock`
already read the same token. A `.nowrap` class keeps the four `?gallery=open`
snippets on one line. Not a global `nowrap`: the longest bare snippet is 63
characters, wider than a phone's 358px.

**Baselines (D-050 §5's method, D-107 §7's shape).** Every page was
captured on a production build of `main` and of this branch, locally, at a
zero-pixel threshold, `main` first compared against itself (158 / 158
identical). 119 captures on 60 pages differ. The line boxes holding a bare `<code>` were
counted on each page: 59 pages hold 1 to 32 such lines, 480 in all, and on
the runner each was 2px taller than a plain line (D-102 §2), so their heights
will change there and cannot be measured here. Those 59 are re-baselined
with `npm run dimensions -- --rebaseline`. The other 20 hold none; one,
`examples`, changed pixels (its Toggles, §1) at the same height, so its two
baselines are deleted and their manifest entries kept; the 19 that did not
change are left to be compared. Locally only checkbox (−25px), number-input
(−26px), toggle (−67px, §1's row and prose) and toolbar (+730px, §2's
section) moved.

### 5. The sweep: eleven items to `done`, 84 / 84

6.1–6.7 and 3.18 waited only on their CI-authored baselines (D-069 §2). They
were authored on PR #42 and compared green on `main` by runs 205 and 209
(D-013's second half). 0.10, 0.12 and 0.13 also waited on "the user's review
of the PR", and that PR, #35, merged — D-107 §8 surfaced the stale line and
this reconciles it. Gate D's other boxes were walked when each went to
`review` (D-094 to D-100, D-103 to D-105, D-107 §9); the last box, "visual
regression snapshots committed (light + dark)", is now met. This PR
re-authors most of their baselines again (§4), which is a re-baseline of
`done` components, as D-107 §7's was.

### 6. Launchpad's layout primitives were already consumed

The roadmap's last open line asked launchpad to delete `.lp-stack`,
`.lp-cluster`, `.lp-grid`, `.lp-page`, `.lp-shell` and its last viewport
media query. Read on launchpad's `main` (e95d1e7): the first three and every
`@media` are gone, its shell is `Split` and its page `Container`. `.lp-shell`
holds only `min-block-size: 100dvh` and `.lp-page` only its block padding,
both marked `@replaced-by AppShell`. The line is closed. Adopting AppShell,
NavSidebar and PageHeader is new work, and it needs launchpad's pin moved
past D-107 §2, whose removal of `Split.Sidebar` breaks its `AppFrame`; not
done here.

### 7. Found and not fixed

- **Pagination's current page** is the same step-5 fill, with
  `--pp-tone-border` as its edge. Whether that edge alone carries 1.4.11
  beside the other pages was not measured here.
- **Warning and a light accent on a Toggle** fail §1's 3:1; the docs say so
  rather than a rule.
