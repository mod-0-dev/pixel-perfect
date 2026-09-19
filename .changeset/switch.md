---
'pixel-perfect': minor
---

Add `Switch` (3.12) — an on/off control whose effect is immediate, on the native
input, painted with `appearance: none`.

- `role="switch"` on a native `<input type="checkbox">`, which is the APG
  construction: the semantics, the keyboard and the form participation stay, and
  only the announced role changes. `data-state="checked|unchecked"` is the line
  against `Toggle`, which is `aria-pressed`.
- **The off state is a thumb, not a track colour.** The specified
  `--pp-color-border-strong` track measured 1.97:1 on the page in the light
  theme, and a surface thumb on it 1.97:1 too, so the thing that says which way
  the switch is set was the part that failed WCAG 1.4.11. Off is now the
  library's resting control surface with a `--pp-color-text-muted` thumb (5.10:1
  light, 5.49:1 dark); on is `--pp-tone-solid` with a `--pp-tone-on-solid` thumb.
  Both are pairings the token layer already verifies.
- A 2:1 track at the checkable block sizes — 32×16 / 40×20 / 48×24 — so a `md`
  switch is exactly as tall as a `md` checkbox beside it. The thumb, the inset
  and the travel all derive from the track's block size, so one override moves
  all four.
- The thumb moves with `inset-inline-start`, not `translate`: a translated thumb
  travels rightwards in every writing mode and would run the switch backwards
  in RTL.
- Reads `size`, `required`, `disabled` and invalid state from `Field`; an
  explicit prop always wins, including `disabled={false}`.
