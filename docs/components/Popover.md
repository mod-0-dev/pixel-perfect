# Popover

A small panel of interactive content anchored to the control that opened it.
Spec: [`Popover.md`](../specs/Popover.md). Foundation: [Overlays](../overlays.md).

```tsx
import { Popover, PopoverTrigger, PopoverContent, PopoverTitle, PopoverClose } from 'pixel-perfect';
```

Non-modal by default: the page behind still works, and the popover closes on
`Escape`, on an outside press, and when focus leaves. Behaviour is
[Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover)'s;
every node and pixel is ours.

**Named parts, not `Popover.Trigger`.** React does not let a Server Component
dot into a client module ("you can only pass the imported name through"), and
a Next App Router page is one by default. The parts are named exports, one
spelling that works on both sides of the boundary.

**Not a tooltip, not a menu, not a dialog.** A hover panel of non-interactive
text is a `Tooltip`; a list of commands is a `DropdownMenu`; something the
user must deal with before continuing is a `Dialog`.

## Usage

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Filters</Button>
  </PopoverTrigger>
  <PopoverContent align="start">
    <Stack gap="3">
      <div>
        <PopoverTitle>Filters</PopoverTitle>
        <PopoverDescription>Narrow the list.</PopoverDescription>
      </div>
      <Field label="Status"><Select>…</Select></Field>
      <Cluster justify="end">
        <PopoverClose asChild><Button variant="ghost">Cancel</Button></PopoverClose>
        <Button onClick={apply}>Apply</Button>
      </Cluster>
    </Stack>
  </PopoverContent>
</Popover>
```

Controlled:

```tsx
const [open, setOpen] = useState(false);
<Popover open={open} onOpenChange={setOpen}>…</Popover>
```

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `Popover` | nothing | Holds the state. `open` / `defaultOpen` / `onOpenChange`, `modal` |
| `PopoverTrigger` | `<button>`, or its child with `asChild` | Gets `aria-expanded`, `aria-controls`, `aria-haspopup="dialog"`, `data-state` |
| `PopoverContent` | `<div role="dialog">` | The panel. Portalled to `<body>` (or `container`) |
| `PopoverTitle` | `<div>` | Names the dialog. Pass a `Heading` as its child when it is a section |
| `PopoverDescription` | `<p>` | Describes it |
| `PopoverClose` | `<button>`, or its child with `asChild` | Closes on activation |

`Title` and `Description` carry no spacing of their own. Put them in a `Stack`
with the rest of the content, as above.

## `PopoverContent` props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'bottom'` | Logical: `start`/`end` follow the layout's direction |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | |
| `sideOffset` | `Space` | `'2'` | A step of the space scale between trigger and panel |
| `collisionPadding` | `Space` | `'2'` | Kept between the panel and the viewport's edges |
| `container` | `Element \| null` | `document.body` | Where the panel is portalled |
| `aria-label` / `aria-labelledby` | `string` | — | Either replaces the `Title` wiring |
| `onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`, `onOpenAutoFocus`, `onCloseAutoFocus` | | — | Radix's; each can `preventDefault()` |
| `className` / `style` | | — | Land on the panel |

`ref` goes to the panel. Everything else spreads onto it.

## The panel needs a name

The content is a `dialog`, and a dialog without an accessible name fails axe
and fails the user. `PopoverTitle` supplies one; so does `aria-label` or
`aria-labelledby` on `Content`. In development the component warns when none
of the three is present.

## Sizing

The panel hugs its content, up to `--pp-popover-max-inline-size`
(`--pp-measure-xs`, 20rem) or the space available beside its trigger,
whichever is less, and scrolls inside itself when taller than the space
below. This is the one class of component allowed a ceiling: an overlay has
no parent in flow to size it ([Overlays](../overlays.md#sizing-the-one-exception)).

```tsx
// A wider panel: set the ceiling, and put a fill child inside.
<PopoverContent style={{ '--pp-popover-max-inline-size': 'var(--pp-measure-sm)' }}>
```

## Modal

`<Popover modal>` traps focus, locks scroll, hides the rest of the page from
assistive tech, and an outside press closes it without reaching what was
pressed — a dialog overlay's behaviour. It is for the rare popover a flow
cannot proceed past; a popover that needs it is usually a `Dialog`.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-popover-bg` | `--pp-color-bg-raised` | Panel fill |
| `--pp-popover-border-color` | `--pp-color-border-subtle` | Panel edge |
| `--pp-popover-radius` | `--pp-radius-3` | Corners |
| `--pp-popover-padding` | `--pp-space-4` | Inside |
| `--pp-popover-shadow` | `--pp-shadow-3` | Elevation |
| `--pp-popover-max-inline-size` | `--pp-measure-xs` | The ceiling |

The panel opens with a short fade and scale from its anchor and closes with
the reverse; `prefers-reduced-motion` makes both instant.

## Accessibility

Trigger: `aria-expanded`, `aria-controls`, `aria-haspopup="dialog"`. Content:
`role="dialog"`, named as above, `tabindex="-1"`. Focus moves to the first
tabbable element on open (or to the panel) and returns to the trigger on
close. `Escape` closes the topmost layer only.

## Anatomy

```
<button class="pp-popover__trigger" aria-expanded aria-controls data-state>

body
  └── <div>                                  Radix's positioned wrapper
        └── <div class="pp-popover" role="dialog" data-state data-side data-align data-pp-theme>
              ├── <div class="pp-popover__title">
              ├── <p class="pp-popover__description">
              └── …
```

## Testing in jsdom

The panel is portalled: query it through `screen`, not the render container.

## Don't

```tsx
// ✗ No name. Title, aria-labelledby or aria-label.
<PopoverContent>…</PopoverContent>

// ✗ Hover content. A popover is interactive; a hover panel is a Tooltip.
<PopoverTrigger asChild><Button onMouseEnter={open}>…</Button></PopoverTrigger>

// ✗ A physical side. `start` and `end` reverse with the layout.
<PopoverContent side="left" />

// ✗ A pixel offset. Offsets are steps of the space scale.
<PopoverContent sideOffset={8} />

// ✗ modal for "you must choose". That is a Dialog.
<Popover modal>…</Popover>
```
