# Definition of Done

A component is `done` only when **every** box is checked, with evidence.
No partial credit. If something genuinely cannot be completed, the component
goes to `blocked` with a stated reason — never to `done`.

## Spec

- [ ] `docs/specs/<Name>.md` exists, complete, and approved by the user
- [ ] Sizing contract declared (`fill` or `hug`) and justified
- [ ] Props table final, using the `variant` / `tone` / `size` vocabulary
- [ ] Anatomy documents every DOM part and its `pp-` class name
- [ ] Any deviation from RULES has a corresponding `docs/DECISIONS.md` entry
- [ ] Every claim the spec, docs or comments make about how ANOTHER component
      behaves is either asserted by a test or a link to the entry that asserts it —
      never restated. Prose stated in four places was false in all four (D-045)

## Sizing & spacing (RULES §1–2)

- [ ] No `width`, `max-width`, or `min-width` in the component's CSS
      (`Container` is the sole exception)
- [ ] No `margin` on the root element
- [ ] `fill` components are block-level with `min-inline-size: 0`
- [ ] Logical properties throughout (`inline-size`, `padding-inline`, …)
- [ ] Any responsive behavior uses `@container`, never a viewport media query
- [ ] Renders correctly at 3 container widths (narrow / medium / wide)

## Styling (RULES §3)

- [ ] Semantic tokens only — no hardcoded colors, spacing, radii, or font sizes
- [ ] CSS lives in `@layer pp.components`
- [ ] Class names follow `pp-<component>__<part>`
- [ ] Component-scoped custom properties documented as the override API
- [ ] Correct in light **and** dark themes
- [ ] Animation respects `prefers-reduced-motion`

## API (RULES §5)

- [ ] `ref` forwarded to the root element
- [ ] `className` and `style` merged, not replaced
- [ ] Remaining props spread onto the root (`aria-*`, `data-*`, handlers pass through)
- [ ] `<Name>Props` exported; no `any`; no unexported internal types in the public signature
- [ ] Stateful components support controlled **and** uncontrolled use
- [ ] Visual state exposed via `data-*` attributes
- [ ] No banned prop names (`fullWidth`, `width`, `m`/`mt`, `color`, `kind`, `as`)

## Accessibility (RULES §6)

- [ ] Keyboard interaction matches the WAI-ARIA APG pattern; walkthrough recorded in the spec
- [ ] Visible `:focus-visible` styling
- [ ] Correct roles, names, and ARIA relationships
- [ ] Automated axe test passes
- [ ] Contrast meets WCAG AA in both themes
- [ ] Icon-only variants require an accessible name at the type level

## Next.js / RSC (RULES §7)

- [ ] `'use client'` present only if genuinely required; documented either way
- [ ] No browser API access at module scope
- [ ] IDs from `useId()`
- [ ] No hydration mismatch

## Tests & docs

- [ ] Unit tests cover every variant, state, and controlled/uncontrolled path
- [ ] Visual regression snapshots committed (light + dark)
- [ ] Playground entry exercises all variants at 3 container widths
- [ ] Docs page with usage, props, and at least one explicit "don't"
- [ ] Rule lint passes (Tier 0.7)
- [ ] Typecheck, unit tests, and build all pass

## Release & tracking

- [ ] Changeset added
- [ ] Exported from the package entry point
- [ ] `ROADMAP.md` status set to `done`, **Current state** block refreshed
- [ ] Spec status line updated
- [ ] Committed and pushed
