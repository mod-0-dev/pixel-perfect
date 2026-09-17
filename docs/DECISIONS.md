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
