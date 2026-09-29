---
'pixel-perfect': minor
---

Add `Calendar` (5.9): a month grid with one tab stop and the APG keys,
the value an ISO date and the month shown `YYYY-MM`, both controlled or
uncontrolled; names from `Intl`; `today`, `min`, `max`,
`isDateDisabled`, `weekStartsOn`; seven equal columns of its container,
each day a button on the control scale. The date arithmetic lives in
`src/internal/date.ts`, UTC-anchored.
