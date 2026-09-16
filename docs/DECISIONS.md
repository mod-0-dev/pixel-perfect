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
