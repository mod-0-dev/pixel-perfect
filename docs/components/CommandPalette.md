# CommandPalette

Every command in an app, one keystroke away: a search field over a list of
commands, in a modal. Spec: [`CommandPalette.md`](../specs/CommandPalette.md).

```tsx
import {
  CommandPalette, CommandPaletteTrigger, CommandPaletteContent, CommandPaletteInput, CommandPaletteList,
  CommandPaletteItem, CommandPaletteGroup, CommandPaletteLabel, CommandPaletteShortcut, CommandPaletteEmpty,
} from '@mod-0-dev/pixel-perfect';
```

A [`Dialog`](Dialog.md) holding a [`Combobox`](Combobox.md)-style field
whose list is always open: focus stays in the field, the arrows move the
highlight, `Enter` runs the highlighted command, `Escape` closes. **You
render the commands that match** the text the component reports; the
first match is highlighted as the user types.

## Usage

```tsx
const [query, setQuery] = useState('');
const matches = COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

<CommandPalette hotkey="mod+k" onInputValueChange={setQuery} label="Commands">
  <CommandPaletteTrigger asChild>
    <Button variant="outline">Search commands <Kbd size="sm">⌘K</Kbd></Button>
  </CommandPaletteTrigger>
  <CommandPaletteContent>
    <CommandPaletteInput placeholder="Type a command…" />
    <CommandPaletteList>
      <CommandPaletteGroup>
        <CommandPaletteLabel>Navigate</CommandPaletteLabel>
        {matches.map((c) => (
          <CommandPaletteItem key={c.value} value={c.value} icon={c.icon} onSelect={() => run(c)}>
            {c.label}
            {c.keys && <CommandPaletteShortcut keys={c.keys} />}
          </CommandPaletteItem>
        ))}
      </CommandPaletteGroup>
      {matches.length === 0 && <CommandPaletteEmpty>No commands match.</CommandPaletteEmpty>}
    </CommandPaletteList>
  </CommandPaletteContent>
</CommandPalette>
```

Controlled: `open` / `onOpenChange`, `inputValue` / `onInputValueChange`.
Closing clears the text.

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `CommandPalette` | nothing | `open` / `defaultOpen` / `onOpenChange`; `inputValue` trio; `hotkey`; `label` (`'Command palette'`) |
| `CommandPaletteTrigger` | `<button>`, or its child with `asChild` | Optional |
| `CommandPaletteContent` | `<div role="dialog">` on Dialog's scrim | `container`; Dialog's handlers |
| `CommandPaletteInput` | `<input role="combobox">` in the field | `placeholder`, the rest of an input's props |
| `CommandPaletteList` | the list, holding the `<div role="listbox">` | `ref`, `className`, `style` here |
| `CommandPaletteItem` | `<div role="option">` | `value`, `icon`, `disabled`, `onSelect(event)` |
| `CommandPaletteGroup` / `CommandPaletteLabel` | `<div role="group">` / `<div>` | |
| `CommandPaletteShortcut` | `<span aria-hidden>` of `<kbd>`s | `keys` |
| `CommandPaletteEmpty` | `<div>` | Your "nothing matches" row, beside the listbox |

## `onSelect`

`onSelect` receives `{ value, preventDefault() }`; `value` is the item's
`value` or its text. The palette closes after the handler unless it
called `preventDefault()` — a command that swaps the list for another
set of commands keeps it open that way.

## The hotkey

`hotkey="mod+k"` binds a document-level shortcut that toggles the
palette. `mod` is ⌘ on Apple platforms and Ctrl elsewhere, decided when
the key is pressed; `ctrl`, `meta`, `alt` and `shift` are literal. Off by
default: an app with its own shortcut layer controls `open` instead.

## Keyboard

| Key | Behavior |
| --- | --- |
| Typing | Narrows (yours) and highlights the first match |
| `ArrowDown` / `ArrowUp` | Next / previous command, wrapping, kept in view |
| `Enter` | Runs the highlighted command and closes |
| `Escape` | Closes; focus returns to what opened it |

## Styling

Dialog's for the scrim and the panel's surface (`--pp-dialog-*`), the
menu's for the rows (`--pp-dropdown-menu-*`), and:

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-command-palette-width` | `--pp-measure-sm` | The panel |
| `--pp-command-palette-offset` | `--pp-space-9` | Space above the panel |
| `--pp-command-palette-list-height` | `--pp-measure-xs` | The list's ceiling; it scrolls |
| `--pp-command-palette-item-height` | `--pp-control-height-md` | A row |

## Accessibility

The panel is a named modal dialog (`label`), the page behind it hidden
and locked. The field is `role="combobox"`, always expanded, controlling
the listbox and pointing `aria-activedescendant` at the highlighted
command; the listbox shares the name; shortcuts are `aria-hidden`.

## Anatomy

```
body
  └── <div class="pp-dialog__scrim pp-command-palette__scrim">
        └── <div class="pp-dialog pp-command-palette" role="dialog" aria-modal="true" aria-label>
              ├── <div class="pp-command-palette__field">
              │     └── <input class="pp-command-palette__input" role="combobox" aria-activedescendant>
              └── <div class="pp-command-palette__list">
                    ├── <div class="pp-command-palette__listbox" role="listbox">
                    │     └── <div class="pp-dropdown-menu__item pp-command-palette__item" role="option" data-highlighted?>
                    └── <div class="pp-command-palette__empty">
```

## Don't

```tsx
// ✗ Expecting the component to filter. Render the commands that match.
<CommandPaletteList>{ALL.map(…)}</CommandPaletteList>

// ✗ A form in the palette. That is a Dialog.
<CommandPaletteContent><Field label="Name"><Input /></Field></CommandPaletteContent>

// ✗ A shortcut as text. Keys are Kbds; pass them.
<CommandPaletteItem>Inbox <span>G I</span></CommandPaletteItem>

// ✗ A hotkey that fights the platform.
<CommandPalette hotkey="ctrl+k" />
```
