# 4.14 `CommandPalette`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-078. Its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` inside a panel whose inline size is a token (D-071 §1's form of the overlay exception); the scrim is Dialog's viewport box |
| **RSC** | `client` — a modal, a listbox's highlight, a hotkey |
| **Depends on** | 4.4 `Dialog` (`done`): the modal, the scrim, the focus trap, through `@radix-ui/react-dialog` and Dialog's stylesheet; 4.11 `Combobox` (`review`, baseline only — Gate B per D-073 §2): the listbox's highlight, shared; 4.7 `DropdownMenu`: the row; 1.10 `Kbd`: the shortcut hints |
| **APG pattern** | [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) around a [Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a listbox popup that is always open: a search field with `aria-activedescendant` over a list of commands |

The last of Tier 4, and made of the tier: `Dialog`'s modal, `Combobox`'s
highlight, `DropdownMenu`'s row, `Kbd`'s key caps. No package is added.

## Purpose

Every command in an app, one keystroke away: `⌘K` opens a search field
over a list of actions and places; the user types, the list narrows, the
arrows highlight, `Enter` runs. What a menu bar was, for an app that has
none.

It deliberately does **not**: filter (Combobox §2 — the consumer renders
the commands that match); nest pages (a "go to → choose a file" flow is
the consumer's, by re-rendering the list with a different set); or hold
anything but commands (a form is a `Dialog`).

---

## Decisions this spec asks you to approve

### 1. Compound, eight parts, and the consumer renders the matches

```tsx
<CommandPalette open={open} onOpenChange={setOpen} hotkey="mod+k" label="Commands">
  <CommandPaletteInput placeholder="Type a command…" />
  <CommandPaletteList>
    <CommandPaletteGroup>
      <CommandPaletteLabel>Navigate</CommandPaletteLabel>
      <CommandPaletteItem value="inbox" onSelect={() => go('/inbox')}>
        Inbox <CommandPaletteShortcut keys={['G', 'I']} />
      </CommandPaletteItem>
    </CommandPaletteGroup>
    {matches.length === 0 && <CommandPaletteEmpty>No commands match.</CommandPaletteEmpty>}
  </CommandPaletteList>
</CommandPalette>
```

`CommandPalette` (the root), `CommandPaletteTrigger` (a button, `asChild`),
`CommandPaletteContent` (the panel), `CommandPaletteInput`,
`CommandPaletteList`, `CommandPaletteItem`, `CommandPaletteGroup`,
`CommandPaletteLabel`, `CommandPaletteShortcut`, `CommandPaletteEmpty`.
Named exports (D-062 §1). As for `Combobox`, the
component owns the text (`inputValue` / `defaultInputValue` /
`onInputValueChange`), the open state and the highlight, and the consumer
renders the items that match the text it is told.

### 2. A `Dialog` by the two-class contract, sitting high, a token wide

The panel carries `pp-dialog pp-command-palette` and the scrim
`pp-dialog__scrim pp-command-palette__scrim`, so `Dialog.css` gives the
scrim, the layer, the trap, the fade and the reduced-motion rule (D-070
§1; the Drawer's shape, D-071). `CommandPalette.css` changes three things:
the panel's padding is zero (the field and the list run edge to edge),
its inline size is a token (`--pp-command-palette-width` →
`--pp-measure-sm`, capped at the scrim; `.stylelintrc.json` names the
file for `inline-size`, D-071 §1's form), and it sits high rather than
centred — the scrim's grid aligns to the start with
`--pp-command-palette-offset` (`--pp-space-9`) above, because a palette
is a thing one types into and a field in the middle of the screen reads
as a dialog. The panel is named by `label` (`'Command palette'` by
default): a dialog needs a name, and this one has no title to name it.

### 3. The field is a combobox whose listbox is always open

`CommandPaletteInput` is `role="combobox"`, `aria-expanded="true"`,
`aria-controls` the list, `aria-autocomplete="list"`,
`aria-activedescendant` the highlighted item; Radix's focus scope puts
focus in it on open (the first tabbable), and focus stays there: items
are not focusable, the highlight is `Combobox`'s (D-076 §6), factored into
an internal hook both use (D-078 §1). The list is `role="listbox"` named
as the panel is, inside the panel with the consumer's `Empty` beside it
(D-076 §4). `Escape` is Radix's dialog's: it closes the palette.

| Key | Behavior |
| --- | --- |
| Typing | `onInputValueChange`; the highlight moves to the first match |
| `ArrowDown` / `ArrowUp` | Next / previous enabled item, wrapping, kept in view |
| `Enter` | Runs the highlighted item: `onSelect`, then the palette closes unless the event's default is prevented |
| `Escape` | Closes; focus returns to what opened it |
| `Tab` | Nothing leaves the trap; it moves to the trigger-like buttons in the panel, if any (none by default) |

**The first match is highlighted as the user types** — unlike `Combobox`,
where nothing is (Combobox §4). A palette's whole point is `Enter` on the
first result; a combobox's `Enter` submits a form. Recorded as the
difference, D-078 §2.

### 4. Rows are `DropdownMenu`'s, at the medium height; a shortcut is `Kbd`s

An item carries `pp-dropdown-menu__item pp-command-palette__item` and the
list sets the row's private variables (`--_row`, `--_inline`) the way
`Toggle` writes `Button`'s (tier 3a §3.5's precedent): the menu's row,
highlight and disabled look, at `--pp-control-height-md` rather than the
menu's small height, because a palette's rows are hit with a pointer as
often as read. An item has an optional `icon` slot at its start and its
`children` as the label; `CommandPaletteShortcut` renders its `keys` as
`Kbd`s at the row's end (the menu's `__shortcut` position), `aria-hidden`
— the command's name is the label — and this is where the tier-1 spec
said `Kbd` would be used.

### 5. `hotkey`, once, on the root

`hotkey="mod+k"` binds a document-level `keydown` that toggles the
palette: `mod` is `⌘` on Apple platforms and `Ctrl` elsewhere, decided in
the handler (RULES §7: nothing at module scope); `ctrl`, `meta`, `alt`,
`shift` are literal. Off by default — a consumer with its own shortcut
layer passes nothing and controls `open`. The trigger, a button for the
same thing, is optional too.

### 6. `onSelect` is an event, and the palette closes after it

`onSelect(event)` on an item receives `{ value, preventDefault() }`; the
palette closes after the handler unless it prevented the default — a
command that changes the list (a "go to" that swaps the items) keeps it
open that way. `value` is the item's `value` prop, or its text.

---

## Sizing contract justification

`fill` inside the panel: the field and the list fill the panel's width,
which is a token (D-071 §1's form of D-061 §3). The list's height is
capped (`--pp-command-palette-list-height` → `--pp-measure-xs`) and
scrolls; the panel hugs that.

## Anatomy

```
<button class="pp-command-palette__trigger">                                     (optional; or asChild)

body / container
  └── <div class="pp-dialog__scrim pp-command-palette__scrim" data-state data-pp-theme>
        └── <div class="pp-dialog pp-command-palette" role="dialog" aria-modal="true" aria-label data-state>
              ├── <div class="pp-command-palette__field">
              │     ├── <svg class="pp-command-palette__glyph">                       the search glyph
              │     └── <input class="pp-command-palette__input" role="combobox" aria-expanded="true" aria-controls
              │                aria-autocomplete="list" aria-activedescendant? autocomplete="off">
              └── <div class="pp-command-palette__list">
                    ├── <div class="pp-command-palette__listbox" role="listbox" id aria-label>
                    │     ├── <div class="pp-dropdown-menu__group pp-command-palette__group" role="group" aria-labelledby>
                    │     │     ├── <div class="pp-dropdown-menu__label pp-command-palette__label" id>
                    │     │     └── <div class="pp-dropdown-menu__item pp-command-palette__item" role="option" id aria-selected
                    │     │              data-highlighted? aria-disabled? data-value>
                    │     │           ├── <span class="pp-command-palette__icon">                (with `icon`)
                    │     │           ├── {children}
                    │     │           └── <span class="pp-dropdown-menu__shortcut pp-command-palette__shortcut" aria-hidden>
                    │     │                 └── <kbd class="pp-kbd">…
                    │     └── …
                    └── <div class="pp-command-palette__empty">                          (the consumer's)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| CommandPalette | — | none of its own | The root; the hotkey |
| CommandPaletteTrigger | `pp-command-palette__trigger` | `<button>` or `asChild` | Dialog's trigger |
| CommandPaletteContent | `pp-dialog pp-command-palette` | `<div role="dialog">` | The panel, on Dialog's scrim; `container`, Dialog's handlers |
| CommandPaletteInput | `pp-command-palette__input` | `<input role="combobox">` | In the field |
| CommandPaletteList | `pp-command-palette__list` | `<div>` holding the listbox | `ref`, `className`, `style` here |
| CommandPaletteItem | `pp-dropdown-menu__item pp-command-palette__item` | `<div role="option">` | `value`, `icon`, `disabled`, `onSelect` |
| CommandPaletteGroup / Label | the menu's | | |
| CommandPaletteShortcut | `pp-dropdown-menu__shortcut pp-command-palette__shortcut` | `<span aria-hidden>` of `<kbd>`s | `keys` |
| CommandPaletteEmpty | `pp-command-palette__empty` | `<div>` | Beside the listbox |

Nine parts, then, with `CommandPaletteContent` holding the field and the
list — the dialog's content is a part in every dialog of the tier, and a
palette is a dialog. Focus returns, on close, to whatever had it when the
palette opened: the trigger when the trigger was used, the field the user
was in when the hotkey was (D-078 §3).

## Props

**`CommandPalette`**: `open` / `defaultOpen` / `onOpenChange`; `inputValue` /
`defaultInputValue` / `onInputValueChange(text)`; `hotkey?: string`;
`label?: string` (`'Command palette'`); `children`.

**`CommandPaletteTrigger`**: `asChild`, …`<'button'>`.
**`CommandPaletteContent`**: `container?`, Dialog's handlers, …`<'div'>`.
**`CommandPaletteInput`**: …`<'input'>` minus `type`, `value`, `onChange`.
**`CommandPaletteList`**: …`<'div'>`. **`CommandPaletteItem`**: `value?:
string`, `icon?: ReactNode`, `disabled?`, `onSelect?(event: CommandPaletteSelectEvent)`,
…`<'div'>`. **`CommandPaletteShortcut`**: `keys: string[]`, …`<'span'>`.
**`CommandPaletteGroup`**, **`Label`**, **`Empty`**: …`<'div'>`.

Exported types: one `…Props` per part, `CommandPaletteSelectEvent`.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Open / closed | `data-state` on scrim and panel | Dialog's motion |
| Highlighted item | `data-highlighted`, `aria-selected`; `aria-activedescendant` on the input | The menu's fill |
| Disabled item | `aria-disabled`, `data-disabled` | The menu's disabled text |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-command-palette-width` | `--pp-measure-sm` | The panel's inline size |
| `--pp-command-palette-offset` | `--pp-space-9` | Space above the panel |
| `--pp-command-palette-list-height` | `--pp-measure-xs` | The list's ceiling; it scrolls |
| `--pp-command-palette-item-height` | `--pp-control-height-md` | A row |
| `--pp-dialog-*` | `Dialog`'s | The scrim and the panel's surface |

**Contrast, computed at the gate (D-048 §1).** Dialog's and the menu's
pairings; the field's placeholder is Input's muted pair; `Kbd`'s own.
Nothing new is asserted and nothing missing is leaned on.

## Keyboard interaction

§3's table, plus the hotkey (§5) and Dialog's trap.

## Accessibility notes

- The panel: `role="dialog"`, `aria-modal`, named by `label`; the rest of
  the page hidden and locked, as Dialog's.
- The input: `role="combobox"`, always expanded, controlling the listbox,
  `aria-activedescendant` the highlighted item. The listbox is named by
  `label`; items are `role="option"` with `aria-selected` on the
  highlighted one; groups are named by their labels; shortcuts are
  `aria-hidden`.
- **Manual walkthrough:** press the hotkey, confirm the palette opens
  with focus in the field and the dialog announced by its name; type,
  confirm the first match is highlighted and announced; `ArrowDown`;
  `Enter`, confirm the command ran and the palette closed with focus
  back where it was; open, `Escape`; open with the trigger and press
  outside.

## Container behavior

None: the panel is the token or the scrim's width, whichever is less; the
list scrolls inside its ceiling.

## Usage

§1's example.

## Don't

```tsx
// ✗ Expecting the component to filter. Render the commands that match.
<CommandPaletteList>{ALL.map(…)}</CommandPaletteList>

// ✗ A form in the palette. That is a Dialog.
<CommandPaletteContent><Field label="Name"><Input /></Field></CommandPaletteContent>

// ✗ A shortcut as text. Keys are Kbds, and the component draws them.
<CommandPaletteItem>Inbox <span>G I</span></CommandPaletteItem>

// ✗ A hotkey that fights the platform. `mod+k`, not `ctrl+k` on a Mac.
<CommandPalette hotkey="ctrl+k" />
```

## Testing notes

- **Unit (jsdom):** opens from the trigger, the hotkey (`mod` maps to
  `ctrl` in jsdom's platform) and `open`; the panel is a named modal
  dialog with the input focused; the roles and the wiring; typing reports
  and highlights the first match; the arrows move and wrap, skipping a
  disabled item; `Enter` runs `onSelect` and closes, `preventDefault` keeps
  it open; `Escape` closes and restores focus; a click runs; groups are
  named; the shortcut renders `Kbd`s hidden from assistive tech; the
  empty row sits beside the listbox; refs, `className`, `style`; a part
  outside the root throws; axe open, both themes.
- **Browser:** the panel sits the offset token below the top, the token
  wide, over Dialog's scrim; the input is focused on open with its ring;
  a row is the medium control height; the highlighted item scrolls into
  view; `Control+k` toggles it; the theme crosses; reduced motion is
  `none`; the gallery holds three contained palettes.
- **Break checks (D-035 §3):** drop the offset (the panel centres); drop
  the first-match highlight (the typing test); drop the hotkey listener;
  drop the row-height variable (the row test); drop the close-after-select.
- **Screenshot:** three stages, each a `contain: layout` box with an open
  palette portalled into it, as Dialog's gallery.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **§3 — the first match highlighted as the user types.** Alternative:
   nothing, as Combobox. **Recommendation: the first.** `Enter` on the
   first result is the palette.
2. **§5 — a `hotkey` on the root.** Alternative: none; the consumer binds.
   **Recommendation: optional.** Every palette has one; `mod` is the
   hard part, and it is decided once here.
3. **§2 — high, not centred.** Alternative: Dialog's centre.
   **Recommendation: high.** A field one types into sits where the eye
   starts.
4. **§4 — `Kbd`s for shortcuts.** Alternative: the menu's muted text.
   **Recommendation: `Kbd`.** The tier-1 spec promised it here, and a
   palette is where a key cap earns its place.
