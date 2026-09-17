---
"pixel-perfect": minor
---

Add `Scroller` (2.8), completing Tier 2. An overflow container that reports
which edge has content beyond it, as `data-overflow` in the DOM and as a
gradient shadow.

`label` is required: a scrollable region a keyboard user can reach is WCAG
2.1.1, and a focusable region with no accessible name is a 4.1.2 failure.

The only client component in the tier — scroll position is a browser fact.
It uses `ResizeObserver` unguarded, so jsdom test suites need a stub; the
Scroller docs page has one.
