# Tooltip

A short label beside a control, shown when the pointer rests on it or
keyboard focus lands on it. Spec: [`Tooltip.md`](../specs/Tooltip.md).
Foundation: [Overlays](../overlays.md).

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@mod-0-dev/pixel-perfect';
```

It **describes** its trigger — `aria-describedby`, never the name — and it is
gone the moment the user does anything else. Behaviour is
[Radix Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip)'s;
every node and pixel is ours.

**Named parts, not `Tooltip.Trigger`.** React does not let a Server Component
dot into a client module, and a Next App Router page is one by default. The
parts are named exports, one spelling that works on both sides of the boundary.

**Not a popover, not a name.** Anything interactive — a link, a button, a
control — is a `Popover`: focus never enters a tooltip. A control with no
accessible name is not fixed by a tooltip either; give it one (an
`IconButton`'s `label`) and let the tooltip repeat it.

## Usage

```tsx
// The usual: an icon button's name, repeated. One string for both.
const label = 'Copy to clipboard';
<Tooltip>
  <TooltipTrigger asChild>
    <IconButton label={label} onClick={copy}><Clipboard /></IconButton>
  </TooltipTrigger>
  <TooltipContent>{label}</TooltipContent>
</Tooltip>

// A shortcut, beside a control that already has a text label.
<Tooltip>
  <TooltipTrigger asChild><Button>Save</Button></TooltipTrigger>
  <TooltipContent side="bottom">Save <Kbd>⌘S</Kbd></TooltipContent>
</Tooltip>
```

Controlled:

```tsx
const [open, setOpen] = useState(false);
<Tooltip open={open} onOpenChange={setOpen}>…</Tooltip>
```

## A toolbar: wrap once

```tsx
<TooltipProvider>
  <Cluster gap="1">
    <Tooltip>…</Tooltip>
    <Tooltip>…</Tooltip>
    <Tooltip>…</Tooltip>
  </Cluster>
</TooltipProvider>
```

After one tooltip has shown, moving to a neighbouring trigger within 300ms
opens its tooltip at once — no delay, no entry animation. That is what the
provider is for. A tooltip with no provider above it provides for itself, so
a single tooltip needs no setup.

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `TooltipProvider` | nothing | Optional. `delayDuration` (700), `skipDelayDuration` (300), in milliseconds |
| `Tooltip` | nothing | Holds the state. `open` / `defaultOpen` / `onOpenChange`; `delayDuration` overrides the provider's |
| `TooltipTrigger` | `<button>`, or its child with `asChild` | Gets `aria-describedby` while open, and `data-state`. Must be focusable |
| `TooltipContent` | `<div role="tooltip">` | The label. Portalled to `<body>` (or `container`) |

## `TooltipContent` props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'top'` | Logical: `start`/`end` follow the layout's direction |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | |
| `sideOffset` | `Space` | `'1'` | A step of the space scale between trigger and tooltip |
| `collisionPadding` | `Space` | `'2'` | Kept between the tooltip and the viewport's edges |
| `container` | `Element \| null` | `document.body` | Where it is portalled |
| `aria-label` | `string` | — | For content that is not words (a glyph, a shortcut): the visible content becomes presentational and a hidden copy carries the role |
| `onEscapeKeyDown`, `onPointerDownOutside` | | — | Radix's; each can `preventDefault()` |
| `className` / `style` | | — | Land on the panel |

`ref` goes to the panel. Everything else spreads onto it.

## How it opens and closes

| | |
| --- | --- |
| Pointer rests on the trigger | Opens after `delayDuration`. `data-state="delayed-open"` |
| Keyboard focus lands on the trigger | Opens at once. `data-state="instant-open"`, no entry animation |
| A neighbour, within the skip window | Opens at once (`instant-open`) and closes the other |
| Pointer moves onto the tooltip | Stays open (WCAG 1.4.13: hoverable) |
| Pointer leaves both | Closes |
| Escape | Closes; focus stays where it was |
| Click on the trigger | Closes — activating the control dismisses its label |
| Focus leaves, an ancestor scrolls, another tooltip opens | Closes |
| Touch | Nothing. A tap activates the control and shows no tooltip |

"Is it open" in a selector is `:not([data-state="closed"])`: the open half
has two values because whether the tooltip opened after a rest or at once is
what decides whether it animates in.

## Content is plain text

The panel paints the page's inverse — near-black on light, near-white on
dark — and its ink is the inverse too. Plain text and anything painting from
`currentColor` inherit it. A `Kbd` keeps its own surface, so a key reads as a
key. A `Text` does not: it paints the page's ink on its own and disappears
on the inverse, so a tooltip's content is plain text, not `Text`.

## Sizing

The panel hugs its text up to `--pp-tooltip-max-inline-size` (`--pp-measure-xs`,
20rem) or the space available, whichever is less. This is the one class of
component allowed a ceiling: an overlay has no parent in flow to size it
([Overlays](../overlays.md#sizing-the-one-exception)).

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-tooltip-bg` | `--pp-color-bg-inverse` | Fill |
| `--pp-tooltip-color` | `--pp-color-text-inverse` | Text |
| `--pp-tooltip-radius` | `--pp-radius-2` | Corners |
| `--pp-tooltip-padding-block` | `--pp-space-1` | Inside, block |
| `--pp-tooltip-padding-inline` | `--pp-space-2` | Inside, inline |
| `--pp-tooltip-shadow` | `--pp-shadow-2` | Elevation |
| `--pp-tooltip-max-inline-size` | `--pp-measure-xs` | The ceiling |

The panel opens with a short fade and scale from its anchor and closes with
a quicker one; `instant-open` skips the entry; `prefers-reduced-motion` makes
all of it instant.

## Accessibility

Trigger: `aria-describedby` → the tooltip, present only while open. Content:
`role="tooltip"`, never focusable, never focused. The tooltip is a
description: the trigger's name exists without it, which is what makes the
touch and hover-only gaps acceptable. A screen reader on an `IconButton`
whose tooltip repeats its label reads the label twice; that is the accepted
cost of a name that does not depend on hover.

## A disabled trigger

Whether a natively disabled `<button>` fires the pointer events a tooltip
opens on is the browser's decision. In Chromium it does: the library's
controls keep the pointer when disabled precisely so a tooltip can wrap one,
and the browser suite measures that the tooltip opens. Firefox does not fire
them, so treat a tooltip on a disabled control as best-effort and never as
the only place its explanation lives.

## Anatomy

```
<button class="pp-tooltip__trigger" aria-describedby data-state>

body
  └── <div>                                  Radix's positioned wrapper
        └── <div class="pp-tooltip" role="tooltip" data-state data-side data-align data-pp-theme>
```

## Testing in jsdom

The panel is portalled: query it through `screen`, not the render container.

The delays are timers. Under vitest, use fake timers that also advance with
real time, and advance them inside `act`:

```ts
vi.useFakeTimers({ shouldAdvanceTime: true });
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
await user.hover(trigger);
act(() => vi.advanceTimersByTime(700));
```

Without `shouldAdvanceTime` every user-event call hangs: Testing Library's
async wrapper waits on a real `setTimeout(0)` after each interaction and
advances only Jest's fake timers past it. Without `act`, the open is
scheduled but not rendered when you assert.

axe's `region` rule flags the portalled panel as content outside a landmark;
that is where a tooltip lives. Disable that one rule for the assertion.

## Don't

```tsx
// ✗ The tooltip as the only name. It is a description, absent until hover,
//   and never shown on touch. IconButton's label is the name.
<Tooltip>
  <TooltipTrigger asChild><Button><Icon decorative><Trash /></Icon></Button></TooltipTrigger>
  <TooltipContent>Delete</TooltipContent>
</Tooltip>

// ✗ Interactive content. Focus never enters a tooltip. That is a Popover.
<TooltipContent>See the <Link href="/docs">docs</Link></TooltipContent>

// ✗ A trigger nothing can focus. Keyboard users never see it.
<TooltipTrigger asChild><span>Est. 3 days</span></TooltipTrigger>

// ✗ Information only the tooltip carries. Touch users never see it.
<TooltipContent>Your session expires in 5 minutes</TooltipContent>

// ✗ Text inside. It paints the page's ink on the page's inverse.
<TooltipContent><Text>Copy</Text></TooltipContent>

// ✗ The native tooltip on top of ours.
<IconButton label="Copy" title="Copy" />

// ✗ A physical side; a pixel offset.
<TooltipContent side="left" sideOffset={4} />
```
