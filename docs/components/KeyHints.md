# KeyHints

Three gestures for the reader who prefers the keyboard: hold a key to
see every control's shortcut on the control, press a key to label every
control on screen and type the label to focus it, press a key for the
sheet of every shortcut. Spec: [`KeyHints.md`](../specs/KeyHints.md).

```tsx
import { KeyHints, useKeyHint, formatKeys } from '@mod-0-dev/pixel-perfect';
```

One provider around the app. Declare a shortcut on the control that
does the thing with `data-pp-hotkey`; register a command with
`useKeyHint` when there is no control on screen. Chords are
`mod+shift+n` (`mod` is ⌘ on Apple, Ctrl elsewhere); a sequence is
`g i`. Every single key is a prop, and `null` turns it off.

**Nothing changes under a held key.** The hints are a picture of the
keyboard laid over the page. Every gesture is a shortcut into something
you can already reach with Tab, and the sheet is where a reader learns
them.

## Usage

```tsx
// app/layout.tsx
<ThemeProvider>
  <KeyHints revealKey="Alt">
    <AppShell …>{children}</AppShell>
  </KeyHints>
</ThemeProvider>

// a page
<Button data-pp-hotkey="mod+s" onClick={save}>Save</Button>

// a navigation command, anywhere inside
useKeyHint({ keys: 'g i', label: 'Go to inbox', onTrigger: () => router.push('/inbox') });

// your own keycaps for a shortcut, resolved for the platform
{formatKeys('mod+s')[0].map((k) => <Kbd key={k}>{k}</Kbd>)}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `revealKey` | `'Alt' \| 'Control' \| 'Meta' \| 'Shift' \| null` | `null` | Hold to see shortcuts on their controls. Pick the modifier your app can afford: Alt opens menus on Windows, Meta is the OS's |
| `jumpKey` | `string \| null` | `'f'` | Press to label every control; type a label to focus it |
| `helpKey` | `string \| null` | `'?'` | Press for the sheet |
| `helpTitle` | `string` | `'Keyboard shortcuts'` | |
| `jumpStatus` | `string` | `'Jump: type a label to focus a control. Escape cancels.'` | What the live region says |

`useKeyHint({ keys, label, onTrigger, enabled })` registers a command
while mounted. `formatKeys(keys)` returns the chords as arrays of keycap
labels.

## Keyboard

| Key | Behavior |
| --- | --- |
| A declared chord | Fires the control (focus, click) or the command. Chords with a modifier fire anywhere; bare keys not inside a text field |
| `g` then `i` | A sequence: the next chord within a second |
| Hold `revealKey` | Keycaps on every shortcut control; release, another key, or leaving the window removes them |
| `jumpKey` | Labels on every control; letters narrow; a full label focuses; `Backspace` untypes; `Escape` ends |
| `helpKey` | The sheet, a Dialog; `Escape` closes |

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-key-hints-offset` | `--pp-space-1` | How far a hint sits outside its control's corner |
| `--pp-kbd-*` | Kbd's | The keycaps |

## Don't

```tsx
// ✗ A modifier as a mode. Nothing changes what a component does while a key is held.

// ✗ A shortcut as the only way. Declare it on the control that already does the thing.
useKeyHint({ keys: 'mod+s', label: 'Save', onTrigger: save })   // there is a Save button: put data-pp-hotkey on it

// ✗ A single letter your reader cannot turn off. The keys here are props for that reason;
//   a useKeyHint command with a bare letter needs the app to offer the same.

// ✗ Two providers. One registry per app.
```
