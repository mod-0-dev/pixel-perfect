# 6.7 `KeyHints`

| | |
| --- | --- |
| **Tier** | 6 — App Shell |
| **Status** | `review` — written and built 2026-09-29 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-100; awaiting its CI-authored baseline (D-013). Added to the roadmap by D-100 §1 |
| **Sizing contract** | n/a — a provider with no box of its own; its hints are a fixed overlay, the viewport's (D-067 §2's shape) |
| **RSC** | `client` — document listeners, a portal, state |
| **Depends on** | 1.10 `Kbd` (`done`): the hint is a keycap; 4.4 `Dialog` (`done`): the help sheet; 1.4 `VisuallyHidden`: the live status; 4.14 `CommandPalette` (`done`): the same `mod+k` chord grammar, decided on the platform when pressed (D-078) |
| **APG / WCAG** | [WCAG 2.1.4 Character Key Shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts): every single-character key is remappable and can be turned off; [2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard): nothing here is the only way to reach anything |

The idea D-069 §3 parked — "holding a modifier switches the components
into combinations that expose more of what they can do, in one gesture"
— in the form that survives the accessibility gate. A bare modifier
cannot be claimed by a page (the OS, the browser and every screen
reader own Ctrl and Alt), a held key is a signal the page loses on blur,
and 2.1.4 forbids a single key that cannot be changed. What survives is
three gestures that reveal and accelerate what already exists.

## Purpose

For the reader who prefers the keyboard: see what every control's
shortcut is without leaving the page, reach any control on screen with
two keystrokes, and read the whole map of shortcuts on one sheet. For
the app: declare a control's shortcut on the control itself and have it
fire, be shown, and be listed with no further wiring.

It deliberately does **not**: change what a component does under a
modifier (§1); claim a modifier as a mode; or be the only path to
anything — every control is still reached by `Tab`, every command by its
own control or by `CommandPalette`.

---

## Decisions this spec asks you to approve

### 1. A shortcut is declared on the control, or registered as a command; `mod+k` grammar, `g i` sequences

```tsx
<KeyHints revealKey="Alt">
  <Button data-pp-hotkey="mod+s" onClick={save}>Save</Button>
  <IconButton data-pp-hotkey="mod+shift+n" label="New" onClick={create}><Plus /></IconButton>
  …
</KeyHints>

// anywhere inside:
useKeyHint({ keys: 'g i', label: 'Go to inbox', onTrigger: () => router.push('/inbox') });
```

Two ways in, one registry. `data-pp-hotkey` on any element makes its
chord fire that element — focus, then `click()` — so the control's own
`onClick`, `href` or `type="submit"` does what it always did, and the
hint is drawn on it (§2). `useKeyHint` registers a command with a label
for what has no control on screen, a navigation sequence most often. The
chord grammar is `CommandPalette`'s: `+`-joined modifiers and a key,
`mod` resolved to ⌘ or Ctrl on the platform when pressed (D-078 §4); a
sequence is chords separated by spaces, the next expected within a
second. A chord with `mod`, `ctrl`, `alt` or `meta` fires anywhere; one
without (`?`, `g i`, `shift+/`) is ignored while a text field, a
textarea or an editable region has focus — `Toolbar`'s test, factored
into one place (§7) — and every key is skipped when a component already
handled it (`defaultPrevented`).

### 2. Hold `revealKey` to see every shortcut on its control; nothing happens on the hold alone

While the configured key is held, a keycap with the chord (`Kbd`, sized
`sm`) is drawn at the top-start corner of every visible element that
carries `data-pp-hotkey`, in an overlay above everything (`--pp-z-tooltip`)
that takes no pointer events. Releasing the key, pressing any other key,
the window losing focus, or the document being hidden removes them — so
a lost `keyup` costs a flicker, not a stuck mode. The hold is a reveal,
never a change: the page under the hints is exactly the page, which is
what makes the lost-keyup case harmless and 2.1.1 trivially true.
`revealKey` defaults to `null`: which modifier the app can afford — Alt
opens menus on Windows, Shift is harmless but typing, Meta is the OS's —
is the app's call, and a default that fights the platform is a bug
shipped to everyone.

### 3. Press `jumpKey` to label every control on screen; type the label to focus it

`f` (Vimium's) by default. Every focusable element in the viewport gets a
one- or two-letter label from the home row, drawn as a keycap over it;
typing narrows the labels and a complete label moves focus to its
element and ends the mode — focus, not activation, so the next `Enter`
is the reader's own, and a link is not followed by a slip. `Escape`
ends it; `Backspace` untypes; any other key ends it. A visually hidden
live region says what the mode is and how to leave it. The labels are
`aria-hidden`: they are a picture of the keyboard, and a screen reader
already has the control by name.

### 4. Press `helpKey` for the sheet: every registered shortcut, on a `Dialog`

`?` (the convention, GitHub's and Gmail's). The sheet is a `Dialog`
titled "Keyboard shortcuts" listing every `useKeyHint` command by its
label and every `data-pp-hotkey` element by its accessible name, each
with its chords as keycaps, and the three gestures themselves (only the
ones configured). It is the accessible form of the reveal: what §2
draws over the page, §4 reads out in a list.

### 5. Every single key is remappable and can be turned off (WCAG 2.1.4)

`helpKey`, `jumpKey` and `revealKey` are props; `null` turns each off.
A `useKeyHint` command's keys are the app's, and the sheet is where a
reader learns them. A single-character shortcut only fires outside text
fields (§1), which is 2.1.4's second allowance on top of its first.

### 6. What it is not: a mode that changes the components

The parked idea's literal form — Ctrl held, and a `Button` becomes a
menu, a `Card` shows its actions — is not built, and this is the ruling
rather than a deferral. A modifier cannot be a mode the page owns (§0),
and a component whose behaviour depends on a held key is a component
whose keyboard walkthrough no longer matches its APG pattern (RULES §6).
The combinations the idea wanted are reached by these three gestures
plus `CommandPalette`: reveal, jump, and the sheet expose what the
components already do; the palette runs what they don't show.

### 7. One `isEditing` for the library

`Toolbar` §4 wrote the test for "a key pressed in a text-editing control"
inline. This component needs the same test, so it moves to
`src/internal/editing.ts` and both import it. Not a behaviour change:
the same eight non-editing input types, `textarea`, `contenteditable`.

---

## Sizing contract justification

None: the provider renders its children as they are and adds a portal.
The overlay is `position: fixed; inset: 0` — the viewport-sized box a
fixed layer is given, D-067 §2's shape, the one exception RULES §1 names —
and each hint hugs its keycap.

## Anatomy

```
<KeyHints>                                       renders children, then a portal into <body>:
  <div class="pp-key-hints" aria-hidden="true">     position: fixed; inset: 0; pointer-events: none; only while revealing or jumping
    └── <span class="pp-key-hints__hint" style="top; left" data-mode="reveal|jump" data-pp-tone="accent"?>
          ├── <kbd class="pp-kbd" data-size="sm">Ctrl</kbd> <kbd class="pp-kbd">S</kbd>     reveal: one keycap per key
          └── <kbd class="pp-kbd"><span class="pp-key-hints__typed">a</span>s</kbd>        jump: the typed prefix marked
  <span class="pp-visually-hidden pp-key-hints__status" aria-live="polite">Jump: …</span>
  <Dialog> … <DialogTitle>Keyboard shortcuts</DialogTitle>
    <dl class="pp-key-hints__sheet">
      <div class="pp-key-hints__row"><dt class="pp-key-hints__label">Save</dt><dd class="pp-key-hints__keys"><kbd class="pp-kbd">⌘</kbd><kbd class="pp-kbd">S</kbd></dd></div>
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| overlay | `pp-key-hints` | `<div>` | Portalled; `aria-hidden`; `--pp-z-tooltip`; only while revealing or jumping |
| hint | `pp-key-hints__hint` | `<span>` | A row of `Kbd`s, one per key, at the element's top-start corner; `data-mode`; staggered upward when it would overlap another (D-100 §3) |
| typed | `pp-key-hints__typed` | `<span>` | The typed prefix of a jump label |
| status | `pp-key-hints__status` | `VisuallyHidden` | `aria-live="polite"` |
| sheet | `pp-key-hints__sheet` | `<dl>` | In the help `Dialog` |
| row / label / keys | `pp-key-hints__row`, `__label`, `__keys` | `<div>`, `<dt>`, `<dd>` | A shortcut and its keycaps |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `revealKey` | `'Alt' \| 'Control' \| 'Meta' \| 'Shift' \| null` | `null` | Hold to reveal (§2) |
| `jumpKey` | `string \| null` | `'f'` | Press to label the controls (§3) |
| `helpKey` | `string \| null` | `'?'` | Press for the sheet (§4) |
| `helpTitle` | `string` | `'Keyboard shortcuts'` | The dialog's title |
| `jumpStatus` | `string` | `'Jump: type a label to focus a control. Escape cancels.'` | The live region's text |
| `children` | `ReactNode` | — | The app |

**`useKeyHint({ keys, label, onTrigger, enabled = true })`**: registers a
command while mounted. **`formatKeys(keys)`**: the chords of a key string
as arrays of keycap labels, `mod` resolved (`[['⌘', 'S']]` on Apple,
`[['Ctrl', 'S']]` elsewhere) — for an app's own `Kbd`s. **`data-pp-hotkey`**:
the attribute contract on any element.

Exported: `KeyHints`, `useKeyHint`, `formatKeys`, `KeyHintsProps`,
`KeyHintOptions`. No `ref`, `className` or `style`: there is no root
element (`ThemeProvider`'s shape, D-094).

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| Revealing | hints with `data-mode="reveal"` | A keycap on every shortcut control |
| Jumping | hints with `data-mode="jump"`; the live status | A label on every focusable control |
| Help | the `Dialog`'s `open` | The sheet |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-key-hints-offset` | `--pp-space-1` | How far a hint sits outside its control's corner |
| `Kbd`'s | — | The keycaps, through `pp-kbd` |

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| A declared chord | Fires the control (focus, click) or the command; `mod`/`ctrl`/`alt`/`meta` chords anywhere, bare keys outside text fields |
| A sequence (`g` then `i`) | The second chord within a second of the first |
| Hold `revealKey` | Hints on every shortcut control; release, another key, blur or hidden document removes them |
| `jumpKey` | Jump mode; letters narrow; a full label focuses; `Backspace` untypes; `Escape` or another key ends it |
| `helpKey` | The sheet; `Escape` closes it (Dialog's) |

## Accessibility notes

- 2.1.4: every single-character key is a prop and `null` turns it off;
  bare keys never fire inside a text field.
- 2.1.1: every gesture is a shortcut into something reachable without it.
- The overlay is `aria-hidden` and takes no pointer events; the sheet is
  a real `Dialog` with focus management; jump mode announces itself.
- Firing a control focuses it first, so the reader's focus is where the
  action happened.

## Container behavior

None: no box.

## Usage

```tsx
// app/layout.tsx — inside ThemeProvider, around AppShell
<KeyHints revealKey="Alt">
  <AppShell …>{children}</AppShell>
</KeyHints>

// a page
<Button data-pp-hotkey="mod+s" onClick={save}>Save</Button>

// a navigation command
useKeyHint({ keys: 'g i', label: 'Go to inbox', onTrigger: () => router.push('/inbox') });
```

## Don't

```tsx
// ✗ A modifier as a mode. Nothing changes what a component does while a key is held.
<KeyHints revealKey="Control" onReveal={switchLayout} />

// ✗ A single letter with no way to turn it off. Every key here is a prop for that reason.
useKeyHint({ keys: 'x', … })   // fine — but the sheet must list it, and the app must let the reader remap or disable it

// ✗ A shortcut as the only way. Declare it on the control that already does the thing.
useKeyHint({ keys: 'mod+s', onTrigger: save })   // when there is a Save button: put data-pp-hotkey on it

// ✗ Two providers. One registry per app.
```

## Tests

- **Unit:** `formatKeys` on Apple and elsewhere; a `data-pp-hotkey`
  element fires on its chord (focus then click) and not on another; a
  `useKeyHint` command fires, and not when `enabled` is false or after
  unmount; a sequence fires on the second chord within the timeout and
  not after it; a bare chord is ignored in a text field and a `mod`
  chord is not; a `defaultPrevented` key is skipped; reveal: the held
  key draws a hint per shortcut element with the chord's keycaps, and
  release, another key and blur remove them; jump: the key labels every
  focusable element, typing narrows, a full label focuses and ends,
  `Escape` ends, the live region reads the status; help: the key opens
  a dialog listing commands and elements with keycaps, `null` disables
  each key; the overlay is `aria-hidden`; axe with the sheet open.
- **Browser:** while `Alt` is held a keycap sits at each shortcut
  button's top-start corner; `f` draws a label over every focusable
  control in the section and typing one focuses that control; `?` opens
  the sheet; hints are above a Popover's layer.

## Open questions

Each carries a recommendation, adopted as written under D-069 §1.

1. **A modifier as a mode?** No (§6); the reveal is a picture.
2. **Default `revealKey`?** `null` (§2); the app picks a key it can afford.
3. **Jump activates or focuses?** Focuses (§3).
4. **Declare on the control, or register?** Both (§1); the control when there is one.
5. **Where does `isEditing` live?** `src/internal/editing.ts` (§7).
