# Dialog

A window over the page that the user must deal with before continuing.
Spec: [`Dialog.md`](../specs/Dialog.md). Foundation: [Overlays](../overlays.md).

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@mod-0-dev/pixel-perfect';
```

The page behind it is inert — no pointer, no scroll, no focus, nothing read
— until it closes, and it closes on `Escape`, on a press on the scrim, or
from any `DialogClose` inside it. Behaviour is
[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)'s;
every node and pixel is ours.

**Named parts, not `Dialog.Trigger`.** React does not let a Server Component
dot into a client module, and a Next App Router page is one by default. The
parts are named exports, one spelling that works on both sides of the boundary.

**Modal, and only modal.** There is no `modal` prop. Beside its trigger, a
panel is a `Popover`; a panel that stays open while the page is used is a
`Drawer`; a destructive confirmation with its own rules is an `AlertDialog`.

## Usage

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Rename</Button>
  </DialogTrigger>
  <DialogContent>
    <Stack gap="4">
      <Stack gap="1">
        <DialogTitle>Rename file</DialogTitle>
        <DialogDescription>The new name is applied everywhere it is linked.</DialogDescription>
      </Stack>
      <Field label="Name"><Input defaultValue="report.pdf" /></Field>
      <Cluster justify="end" gap="2">
        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
        <DialogClose asChild><Button onClick={rename}>Rename</Button></DialogClose>
      </Cluster>
    </Stack>
  </DialogContent>
</Dialog>
```

Controlled, and opened from something that is not a trigger — a row's menu,
a shortcut. Focus returns to the element that had it when the dialog opened:

```tsx
const [open, setOpen] = useState(false);
<IconButton label="Row actions" onClick={() => setOpen(true)}><Dots /></IconButton>
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent aria-label="Edit row">…</DialogContent>
</Dialog>
```

A corner close is the end of the title row, not an absolute position:

```tsx
<Cluster justify="between" align="start">
  <DialogTitle><Heading level={2} size="sm">Settings</Heading></DialogTitle>
  <DialogClose asChild>
    <IconButton label="Close" variant="plain" size="sm"><X /></IconButton>
  </DialogClose>
</Cluster>
```

Unsaved changes: veto the close, do not confirm it.

```tsx
<DialogContent
  onEscapeKeyDown={(e) => { if (dirty) e.preventDefault(); }}
  onPointerDownOutside={(e) => { if (dirty) e.preventDefault(); }}
>
```

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `Dialog` | nothing | Holds the state. `open` / `defaultOpen` / `onOpenChange` |
| `DialogTrigger` | `<button>`, or its child with `asChild` | Gets `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, `data-state` |
| `DialogContent` | the scrim, and the panel inside it | `<div role="dialog" aria-modal="true">`, portalled to `<body>` (or `container`) |
| `DialogTitle` | `<div>` | Names the dialog. Pass a `Heading` as its child when the dialog is a section of the page |
| `DialogDescription` | `<p>` | Describes it |
| `DialogClose` | `<button>`, or its child with `asChild` | Closes on activation. Any number, anywhere inside |

`Title` and `Description` carry no spacing of their own. Put them in a `Stack`
with the rest of the content, as above.

## `DialogContent` props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `container` | `Element \| null` | `document.body` | Where the scrim and the panel are portalled, together |
| `aria-label` / `aria-labelledby` / `aria-describedby` | `string` | — | A supplied name or description wins over the parts' |
| `onOpenAutoFocus`, `onCloseAutoFocus` | | — | Radix's; each can `preventDefault()` |
| `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside` | | — | Radix's; each can `preventDefault()` to veto a close |
| `className` / `style` | | — | Land on the panel |

`ref` goes to the panel. Everything else spreads onto it. The scrim takes
no props: it is styled through `--pp-dialog-scrim` and `--pp-dialog-gutter`.

## The panel needs a name

The content is a `dialog`, and a dialog without an accessible name fails axe
and fails the user. `DialogTitle` supplies one; so does `aria-label` or
`aria-labelledby` on `Content`. In development the component warns when none
of the three is present.

## The scrim positions the panel, and scrolls

The scrim covers the viewport, dims it, and centres the panel — with a grid,
so a right-to-left page needs nothing. A panel taller than the viewport
keeps its full height and the gutter above and below it; the **scrim**
scrolls, never the page, and the page's scroll position is untouched when
the dialog closes.

A footer held still while the body scrolls is composition, not a mode: put a
bounded `Scroller` inside the panel.

```tsx
<DialogContent>
  <Stack gap="4">
    <DialogTitle>Terms</DialogTitle>
    <Scroller label="Terms" style={{ maxBlockSize: '50vh' }}>…</Scroller>
    <Cluster justify="end"><DialogClose asChild><Button>Agree</Button></DialogClose></Cluster>
  </Stack>
</DialogContent>
```

## Sizing

The panel is as wide as its content asks — a short form is about 26rem, a
paragraph reaches the ceiling — up to `--pp-dialog-max-inline-size`
(`--pp-measure-sm`, 40rem) or the viewport less twice the gutter, whichever is
less. An unbreakable string (a path, a URL) wraps inside the panel rather
than widening it. This is the one class of component allowed a ceiling: an overlay has
no parent in flow to size it ([Overlays](../overlays.md#sizing-the-one-exception)).
There is no `size` prop.

```tsx
// A wider panel: set the ceiling, and put fill children inside.
<DialogContent style={{ '--pp-dialog-max-inline-size': 'var(--pp-measure-md)' }}>
```

## Focus

On open, focus moves to the first tabbable element in the panel (or to the
panel itself). Tab and Shift+Tab loop inside; nothing outside is reachable.
On close, focus returns to the trigger — or, when the dialog was opened with
no `DialogTrigger`, to the element that had focus when it opened. Radix
alone drops that case on the body; this component does not.

A dialog whose action removes the element it was opened from (delete the
row) is the caller's to re-focus, as it is for `Alert`.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-dialog-scrim` | `--pp-color-bg-scrim` | The scrim's fill |
| `--pp-dialog-gutter` | `--pp-space-4` | The least space between the panel and the viewport's edge |
| `--pp-dialog-bg` | `--pp-color-bg-raised` | Panel fill |
| `--pp-dialog-border-color` | `--pp-color-border-subtle` | Panel edge |
| `--pp-dialog-radius` | `--pp-radius-4` | Corners |
| `--pp-dialog-padding` | `--pp-space-5` | Inside |
| `--pp-dialog-shadow` | `--pp-shadow-3` | Elevation |
| `--pp-dialog-max-inline-size` | `--pp-measure-sm` | The ceiling |

The scrim fades in and out; the panel fades and scales from its centre;
`prefers-reduced-motion` makes both instant.

## Accessibility

Trigger: `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`. Panel:
`role="dialog"`, `aria-modal="true"`, named as above, `tabindex="-1"`. While
it is open the rest of the page is `aria-hidden`, its scroll is locked, and
it takes no pointer events. `Escape` closes the topmost layer only: a
`Popover` opened inside the dialog closes first.

## Right-to-left, and the scrollbar

The panel is centred by the scrim's grid, so `dir="rtl"` needs nothing.
Radix's scroll lock pads the body by the scrollbar's width so the page does
not shift when the bar disappears — on the **right**, unconditionally. On a
right-to-left page with a classic (non-overlay) scrollbar, which sits on the
left, that compensation lands on the wrong side and the page shifts by the
bar's width while a dialog is open. Overlay scrollbars — macOS, every phone
— are zero width and unaffected. There is no switch for it in this
component; it is a documented gap.

The same lock rewrites the body's **top, left and right padding** while a
dialog is open: it copies the body's margins there, which for the usual
`body { margin: 0 }` means zero. A page that carries its gutter on `<body>`
loses it, and everything shifts by that gutter — and if the page is
scrolled to its end, the scroll position clamps too — each time a Dialog,
AlertDialog or Drawer opens. Put the gutter on a wrapper inside the body;
a wrapper's padding is untouched. The library cannot undo this from CSS
(there is no way to restore an author's declared value from another rule),
and Radix exposes no option for it.

## Anatomy

```
<button class="pp-dialog__trigger" aria-haspopup="dialog" aria-expanded aria-controls data-state>

body
  └── <div class="pp-dialog__scrim" data-state data-pp-theme>          covers the viewport, centres, scrolls
        └── <div class="pp-dialog" role="dialog" aria-modal="true" data-state>
              ├── <div class="pp-dialog__title">
              ├── <p class="pp-dialog__description">
              └── …
```

## Testing in jsdom

Scrim and panel are portalled: query them through `screen`, not the render
container. While a dialog is open the rest of the document is `aria-hidden`,
so role queries for things outside it — the trigger included — find nothing
until it closes; hold a text or test-id locator for anything you need to
reach while it is open. The same holds for Playwright's role locators.

## Don't

```tsx
// ✗ No name. Title, aria-labelledby or aria-label; development warns.
<DialogContent>…</DialogContent>

// ✗ A non-modal dialog. There is no `modal` prop.
<Dialog modal={false}>…</Dialog>

// ✗ A confirmation with a confirmation. Veto the close through the events.
<Dialog onOpenChange={(open) => { if (!open && !window.confirm('Discard?')) return; setOpen(open); }}>

// ✗ Sizing the panel. The ceiling is the custom property; the width is the content's.
<DialogContent style={{ width: 720 }} />

// ✗ A close button positioned by the panel. Put it at the end of the title row.
<DialogClose asChild><IconButton label="Close" style={{ position: 'absolute', top: 8, right: 8 }} /></DialogClose>

// ✗ Flipping a controlled dialog from an outside control. The dismissal
//   arrives before the click; say the state instead.
<Button onClick={() => setOpen((o) => !o)}>Toggle</Button>

// ✗ A destructive default. That is an AlertDialog.
<DialogContent><Button tone="danger">Delete</Button></DialogContent>
```
