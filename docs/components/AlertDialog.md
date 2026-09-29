# AlertDialog

A modal that interrupts the user with a decision and does not let go until
they make it. Spec: [`AlertDialog.md`](../specs/AlertDialog.md). It is
[`Dialog`](Dialog.md) with two rules changed.

```tsx
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from 'pixel-perfect';
```

**The two rules.** A press on the scrim does not close it, and focus lands on
`AlertDialogCancel` — the safe button — rather than on the first control.
Everything else is Dialog's: the scrim positions and scrolls, the theme
crosses the portal, Escape closes, a trigger-less open returns focus to what
had it.

## Usage

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild><Button variant="outline" tone="danger">Delete</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <Stack gap="4">
      <Stack gap="1">
        <AlertDialogTitle>Delete this report?</AlertDialogTitle>
        <AlertDialogDescription>It is removed for everyone it is shared with.</AlertDialogDescription>
      </Stack>
      <Cluster justify="end" gap="2">
        <AlertDialogCancel asChild><Button variant="ghost">Keep it</Button></AlertDialogCancel>
        <AlertDialogAction asChild><Button tone="danger" onClick={remove}>Delete</Button></AlertDialogAction>
      </Cluster>
    </Stack>
  </AlertDialogContent>
</AlertDialog>
```

The destructive action is `tone="danger"` because you said so, not because
the component did: the alert dialog is not dangerous, its action is.

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `AlertDialog` | nothing | `open` / `defaultOpen` / `onOpenChange` |
| `AlertDialogTrigger` | `<button>`, or its child with `asChild` | |
| `AlertDialogContent` | the scrim, and the panel inside it | `<div role="alertdialog" aria-modal="true">` |
| `AlertDialogTitle` | `<div>` | Names it |
| `AlertDialogDescription` | `<p>` | Describes it |
| `AlertDialogCancel` | `<button>`, or its child with `asChild` | Focused on open; closes. One per dialog |
| `AlertDialogAction` | `<button>`, or its child with `asChild` | Closes; your `onClick` does the work |

`AlertDialogContent` takes `container`, `onOpenAutoFocus`, `onCloseAutoFocus`
and `onEscapeKeyDown` (Radix's, each can `preventDefault()`), `aria-label` /
`aria-labelledby` / `aria-describedby`, and `className` / `style` for the
panel. There is no `onPointerDownOutside`: the scrim never closes it.

## Always a Cancel

A decision the user cannot decline is not a decision. With no
`AlertDialogCancel` inside, the panel itself takes focus so the trap has
something to hold, and development warns.

## Sizing and styling

Dialog's stylesheet draws every part, so every `--pp-dialog-*` property
applies. The ceiling is its own: `--pp-alert-dialog-max-inline-size`
(`--pp-measure-xs`, 20rem) — a sentence and two buttons — so widening every
`Dialog` does not widen every confirmation.

## Don't

```tsx
// ✗ No Cancel. Development warns.
<AlertDialogContent><AlertDialogAction>OK</AlertDialogAction></AlertDialogContent>

// ✗ A form. Input is a Dialog.
<AlertDialogContent><Field label="Reason"><Input /></Field></AlertDialogContent>

// ✗ The action dressed as the safe choice.
<AlertDialogAction asChild><Button>Delete</Button></AlertDialogAction>
```
