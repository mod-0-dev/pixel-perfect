---
'pixel-perfect': patch
---

**The focus ring is now solved against every surface it can be drawn on, not
just the page** (roadmap 0.11, D-056).

`--pp-color-focus-ring` was solved and asserted against step 1 alone, three
lines above an `edge` that has been solved against steps 1, 2 **and** 3 since
D-050. Its other neighbours were real the whole time: `--pp-color-bg-surface` is
step 2 and shipped at 2.94 / 2.85 from Tier 3A, and any toned surface is step 3,
where `Alert` (5.2) put a focusable control at 2.74–2.77 light and 2.54–2.57
dark — against WCAG 1.4.11's 3:1.

- The ring solves against all five hues' steps 1–3, not only neutral's. A
  border's surfaces are neutral, because a danger-toned input sits on the page;
  a ring's are not, because it is drawn on whatever the focused thing sits on.
- Light moves L 66.18% → 63.34%, dark L 49.70% → 53.99%. **Worst pairing in the
  library: 2.54:1 → 3.06:1**, both themes, all five hues, all three surfaces.
- `npm run lint:contrast` goes from 242 assertions to **293**, including a
  cross-hue set for the one ring colour that actually ships.
- The `/tokens` gallery now renders `focus`, `edge` and `edge-strong` — the
  three solved off-ramp steps it had never drawn, so a change to the only tokens
  with a stated contrast obligation moved no pixel in any screenshot.

Nothing but the ring's colour changes. No component CSS was touched.
