# Toast

A brief message about something that just happened, at a corner of the
viewport, announced, gone after a moment. Spec: [`Toast.md`](../specs/Toast.md).

```tsx
import { ToastProvider, useToast } from 'pixel-perfect';
```

One provider near the root, one hook anywhere below, and no element to
render: a toast is an event. Every toast is an [`Alert`](Alert.md) that
floats. Behaviour is
[Radix Toast](https://www.radix-ui.com/primitives/docs/components/toast)'s:
the announcement, the pause on hover and focus, the swipe, the `F8` hotkey.

**Not a decision, not a notice that must be read.** A choice is an
`AlertDialog`; a message the user must not miss is an `Alert` in the page.

## Usage

```tsx
// Once, near the root (a client component).
<ToastProvider placement="bottom-end">{children}</ToastProvider>

// Anywhere below.
const { toast, dismiss, update } = useToast();

toast({ title: 'Saved', description: 'Your changes are live.', tone: 'success', icon: <Tick /> });

const id = toast({ title: 'Uploading…', duration: Infinity, dismissible: false });
update(id, { title: 'Uploaded', tone: 'success', duration: 4000, dismissible: true });

toast({
  title: 'Message archived',
  action: { label: 'Undo', altText: 'Undo archiving the message', onClick: restore },
});
```

## `ToastProvider`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `placement` | `'bottom-end' \| 'bottom-start' \| 'top-end' \| 'top-start'` | `'bottom-end'` | Logical: `end` is the right in a left-to-right page |
| `duration` | `number` | `5000` | Milliseconds; per toast too; `Infinity` keeps |
| `limit` | `number` | `3` | Shown at once; the rest wait their turn |
| `label` | `string` | `'Notification'` | Prefixes each announcement |
| `viewportLabel` | `string` | `'Notifications ({hotkey})'` | The region's name |
| `hotkey` | `string[]` | `['F8']` | Moves focus to the region |

## `toast(options)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | required | |
| `description` | `ReactNode` | — | |
| `tone` | `'neutral' \| 'accent' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | Never the only signal: say it in the title |
| `icon` | `ReactNode` | — | An SVG |
| `duration` | `number` | the provider's | |
| `live` | `'assertive' \| 'polite'` | `'assertive'` | Announced at once, or when idle |
| `action` | `{ label, altText, onClick }` | — | One; `altText` says how else to do it |
| `dismissible` | `boolean` | `true` | |
| `dismissLabel` | `string` | `'Dismiss'` | |
| `onDismiss` | `() => void` | — | After it closes, by any means |

`toast()` returns an id. `dismiss(id)` closes one; `dismiss()` closes all.
`update(id, options)` changes a showing toast in place.

## Timing

A toast stays five seconds unless it says otherwise, and the timer pauses
while the pointer is over the region, while focus is in it, and while the
window is in the background. At most `limit` show at once; the rest wait
in order and appear as others go.

## Keyboard

`F8` moves focus to the region; `Tab` moves between the toasts' buttons;
`Escape` dismisses the focused toast. A toast never takes focus when it
appears.

## Styling

`Alert`'s: every `--pp-alert-*` property applies to a toast. The region:

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-toast-width` | `--pp-measure-xs` | The region's inline size |
| `--pp-toast-gutter` | `--pp-space-4` | Distance from the viewport's edges |
| `--pp-toast-gap` | `--pp-space-2` | Between toasts |
| `--pp-toast-shadow` | `--pp-shadow-3` | Elevation |

A toast slides in from the edge it is anchored to and fades out;
`prefers-reduced-motion` makes both instant.

## Accessibility

Radix's announcer — a visually hidden `role="status"` region — reads each
toast once on arrival, assertively or politely per `live`; the toast
element itself carries no live role, so nothing is read twice. The region is `role="region"` named by
`viewportLabel`, reachable by the hotkey. An action's `altText` tells a
screen reader user another way to do it.

## Anatomy

```
<div role="region" aria-label="Notifications (F8)">
  └── <ol class="pp-toast__viewport" data-placement>
        └── <li class="pp-alert pp-toast" data-pp-tone data-state>
              ├── <span class="pp-alert__icon">
              ├── <div class="pp-alert__content">
              │     ├── <div class="pp-alert__title">
              │     ├── <div class="pp-alert__body">
              │     └── <div class="pp-toast__action"> <button class="pp-button">
              └── <button class="pp-alert__dismiss">
```

## Testing in jsdom

Radix's timers: use fake timers with `shouldAdvanceTime: true` and advance
them inside `act()`. The announcer renders a visually hidden live region
into `<body>` for one second; a closed toast leaves the DOM after its
leave duration. jsdom has no pointer capture, which Radix's swipe asks
for: stub `Element.prototype.hasPointerCapture` (and `set…` /
`release…`) as this library's own test setup does.

## Don't

```tsx
// ✗ A toast for a decision. That is an AlertDialog.
toast({ title: 'Delete this file?', action: { label: 'Delete', … } });

// ✗ A toast that must be read, kept forever. That is an Alert in the page.
toast({ title: 'Your trial ended.', duration: Infinity, dismissible: false });

// ✗ A physical corner. `end` reverses with the layout.
<ToastProvider placement="bottom-right" />

// ✗ An action without altText.
toast({ title: 'Sent', action: { label: 'Undo', onClick } });
```
