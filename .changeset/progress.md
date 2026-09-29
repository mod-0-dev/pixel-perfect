---
'pixel-perfect': minor
---

Add `Progress` (5.3): a bar filled as far as `value` says, sweeping
while there is no value; `role="progressbar"` with a name required at
the type level (`label` or `aria-labelledby`); `size` is the thickness
and `tone` the fill, `accent` by default; the fill slides between values
and follows the writing direction; reduced motion pulses instead of
sweeping. A Server Component.
