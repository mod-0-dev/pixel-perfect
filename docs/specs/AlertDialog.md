# 4.5 `AlertDialog`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `review` — built 2026-09-28; every Definition of Done box but the CI-authored screenshot baseline (D-013). Written the same day under the standing delegation (D-069 §1), every recommendation adopted; build findings in D-070 |
| **Sizing contract** | `hug`, with the overlay exception: `max-inline-size` from the measure scale (D-061 §3) and the scrim's `inset: 0` (D-067 §2) — both Dialog's |
| **RSC** | `client` — Radix state, a portal, a focus trap, a scroll lock |
| **Depends on** | 4.4 `Dialog` (`done`): this component is `Dialog` with two rules changed, and Dialog's stylesheet draws it. Its buttons are 3.1 `Button` by `asChild` |
| **APG pattern** | [Alert Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) — `role="alertdialog"`, `aria-modal="true"`, named and described, focus on the least destructive action, Escape closes, no dismissal by an outside press |

## Purpose

A modal that interrupts the user with a decision — usually a destructive
one — and does not let go until they make it: delete this, discard that,
leave the page. It is `Dialog` (4.4) with two rules changed, which is what
Dialog.md said 4.5 would be: **a press on the scrim does not close it**, and
**focus lands on the safe button** rather than on the first control.

It deliberately does **not**: hold a form (a decision with input is a
`Dialog`); close on an outside press (§3); render its buttons (§1: the
caller's `Button`s, so the destructive one is `tone="danger"` by the
caller's choice); or take a `tone` of its own — the alert dialog is not
dangerous, its action is.

---

## Decisions

### 1. Compound, the tier's shape; `Cancel` and `Action` in place of `Close`

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild><Button variant="outline" tone="danger">Delete</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete this report?</AlertDialogTitle>
    <AlertDialogDescription>It is removed for everyone it is shared with. This cannot be undone.</AlertDialogDescription>
    <Cluster justify="end" gap="2">
      <AlertDialogCancel asChild><Button variant="ghost">Keep it</Button></AlertDialogCancel>
      <AlertDialogAction asChild><Button tone="danger" onClick={remove}>Delete</Button></AlertDialogAction>
    </Cluster>
  </AlertDialogContent>
</AlertDialog>
```

Seven parts: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`,
`AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogCancel`,
`AlertDialogAction`. Named exports (D-062 §1). `Cancel` and `Action` are both
"close on activation"; they differ in what focus does (§3) and in what they
say. There is no generic `Close`: an alert dialog has exactly the two ways
out its buttons name, and a third would be a `Dialog`.

### 2. Dialog's stylesheet draws it; the ceiling is `--pp-measure-xs`

Every part carries Dialog's class first and this component's second —
`pp-dialog pp-alert-dialog`, `pp-dialog__scrim pp-alert-dialog__scrim`, and
so on — the way `IconButton` carries `pp-button pp-icon-button` (3A §3.2).
The scrim, the grid centring, the scroll container, the panel's surface,
the type and the motion are all Dialog.css's, and every `--pp-dialog-*`
override applies here. `AlertDialog.css` declares one thing: the ceiling,
`--pp-measure-xs` (20rem) through its own `--pp-alert-dialog-max-inline-size`,
because a confirmation is a sentence and two buttons and Dialog's 40rem
would let one line sprawl. Its own property, not Dialog's, so widening every
`Dialog` does not widen every confirmation. No `size` (Dialog §3).

### 3. Focus on `Cancel`; the panel when there is no `Cancel`; no close on the scrim

- **Open:** focus lands on `AlertDialogCancel` — APG's "the least
  destructive action" — which Radix does by preventing the scope's autofocus
  and focusing its Cancel part. With no `Cancel` rendered, Radix's focus
  call has no target and focus stays *outside* the trap, on the trigger. So
  when the panel holds no `Cancel`, **the panel itself takes focus**
  (`tabindex="-1"`), and development warns that a Cancel is missing: a
  decision the user cannot decline is not a decision.
- **Close:** Escape, `Cancel` or `Action`. Focus returns to the trigger, or —
  with no trigger — to the element that had it (Dialog §7, the shared
  `useFocusRestore`).
- **A press on the scrim does nothing.** Radix prevents the outside press
  and the outside interaction; neither handler is exposed, because there is
  nothing a consumer should do with them here. `onEscapeKeyDown` passes
  through and can `preventDefault()`.

### 4. `role="alertdialog"`, `aria-modal`, the name and the warning

Radix renders `role="alertdialog"`; `aria-modal="true"` is ours (Dialog §6).
`AlertDialogTitle` names it and `AlertDialogDescription` describes it,
Radix's wiring, present exactly while the parts are mounted. Development
warns when nothing names the panel — the same message Dialog gives — and,
separately, when no `Cancel` is inside (§3).

### 5. What is Dialog's and not restated

The scrim as positioner and scroll container; `hug` up to the ceiling with
`min-inline-size: 0` and `overflow-wrap: anywhere`; the theme copied onto
the scrim; two fades on one token, `none` under reduced motion; the scroll
lock and its RTL scrollbar gap; the `aria-hidden` sweep; the no-JS gap. Each
is asserted in Dialog's suites, and this component's suites assert only
what differs plus the two-class contract that makes the rest apply.

---

## Anatomy

```
<button class="pp-alert-dialog__trigger" aria-haspopup="dialog" aria-expanded aria-controls data-state>

body / container
  └── <div class="pp-dialog__scrim pp-alert-dialog__scrim" data-state data-pp-theme>
        └── <div class="pp-dialog pp-alert-dialog" role="alertdialog" aria-modal="true" id data-state
                 aria-labelledby aria-describedby tabindex="-1">
              ├── <div class="pp-dialog__title pp-alert-dialog__title" id>
              ├── <p class="pp-dialog__description pp-alert-dialog__description" id>
              ├── {children}
              ├── <button class="pp-alert-dialog__cancel">      (or the asChild element)
              └── <button class="pp-alert-dialog__action">      (or the asChild element)
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Trigger | `pp-alert-dialog__trigger` | `<button>` or `asChild` | Radix's `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, `data-state` |
| Scrim | `pp-dialog__scrim pp-alert-dialog__scrim` | `<div>` | Dialog's scrim. A press on it does nothing |
| Panel | `pp-dialog pp-alert-dialog` | `<div role="alertdialog">` | `ref`, `className`, `style` and the rest land here |
| Title, Description | `pp-dialog__title pp-alert-dialog__title` / `…__description` | `<div>` / `<p>` | Dialog's |
| Cancel | `pp-alert-dialog__cancel` | `<button>` or `asChild` | Focused on open; closes |
| Action | `pp-alert-dialog__action` | `<button>` or `asChild` | Closes; the caller's `onClick` acts |

## Props

**`AlertDialog`**: `open` / `defaultOpen` / `onOpenChange`, `children`.
**`AlertDialogTrigger`**, **`AlertDialogCancel`**, **`AlertDialogAction`**:
`asChild`, …`ComponentPropsWithoutRef<'button'>`.

**`AlertDialogContent`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `container` | `Element \| null` | `document.body` | 4.1 §3 |
| `onOpenAutoFocus`, `onCloseAutoFocus`, `onEscapeKeyDown` | Radix's | — | Each can `preventDefault()` |
| `aria-label` / `aria-labelledby` / `aria-describedby` | `string` | — | A supplied name wins over the parts' |
| `className` / `style`, …rest | | — | The panel |

Not exposed: `modal`, `forceMount`, `onPointerDownOutside`,
`onInteractOutside`, `onFocusOutside`, Radix's `Overlay` and `Portal`.

Exported types: `AlertDialogProps`, `AlertDialogTriggerProps`,
`AlertDialogContentProps`, `AlertDialogTitleProps`,
`AlertDialogDescriptionProps`, `AlertDialogCancelProps`, `AlertDialogActionProps`.

## State

As Dialog's: `data-state` on trigger, scrim and panel; `data-pp-theme` on
the scrim; the page behind hidden, locked and inert.

## Styling API

Every `--pp-dialog-*` property, plus:

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-alert-dialog-max-inline-size` | `--pp-measure-xs` | The ceiling (§2) |

Contrast: nothing new; the pairs are Dialog's.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| Enter / Space on the trigger | Opens; focus lands on `Cancel` |
| Tab / Shift+Tab | Loops inside the panel |
| Escape | Closes; focus returns to the trigger |
| Enter / Space on `Cancel` or `Action` | Closes |

APG's Alert Dialog pattern says the same, and adds that the dialog is not
dismissed by clicking outside it (§3).

## Accessibility notes

`role="alertdialog"`, `aria-modal="true"`, named and described as Dialog's.
The rest of the page is `aria-hidden` while open. **Manual walkthrough:**
Tab to the trigger, Enter; confirm the name and description are announced
and focus is on Cancel; Tab to Action and back; press the scrim, confirm
nothing happens; Escape, confirm focus is on the trigger.

## Container behavior

Dialog's: the viewport is the container; the panel shrinks with the gutter
kept on a narrow viewport.

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

## Don't

```tsx
// ✗ No Cancel. A decision the user cannot decline is not a decision; development warns.
<AlertDialogContent><AlertDialogAction>OK</AlertDialogAction></AlertDialogContent>

// ✗ A form. Input is a Dialog.
<AlertDialogContent><Field label="Reason"><Input /></Field></AlertDialogContent>

// ✗ Making the action the safe-looking one. The caller sets the tone; the destructive action is danger.
<AlertDialogAction asChild><Button>Delete</Button></AlertDialogAction>

// ✗ Sizing the panel. The ceiling is the custom property.
<AlertDialogContent style={{ width: 480 }} />
```

## Testing notes

- **Unit (jsdom):** `role="alertdialog"` and `aria-modal`; focus on `Cancel`
  on open; the panel takes focus and development warns when there is no
  `Cancel`; a pointer press on the scrim does not close; Escape closes and
  restores focus; `Cancel` and `Action` close and `Action`'s `onClick` fires;
  controlled and uncontrolled; the name and its warning; the two-class
  contract on scrim, panel, title and description; the theme on the scrim;
  refs, `className`, `style`; axe, no rule disabled.
- **Browser:** the panel's ceiling is 20rem at a wide viewport and its scrim
  and panel carry Dialog's layers and motion rules (the two-class contract,
  resolved); a scrim press leaves it open and presses nothing under it;
  focus is on `Cancel` on open and on the trigger after Escape; the gallery
  holds three open, contained in their cells (Dialog §10).
- **Break checks:** drop the no-Cancel fallback (that test); drop
  `pp-dialog` from the panel's class list (the ceiling and layer test);
  drop `aria-modal` (that test).
- **Screenshot:** the gallery, both themes; index re-baselined with the
  registry entry (D-066 §2).

**Dependency (4.1 §2):** `@radix-ui/react-alert-dialog@^1.1.23`, which
composes `@radix-ui/react-dialog`, already installed.

## Open questions

Resolved under the standing delegation (D-069 §1); each recommendation
adopted.

1. **§2 — `xs` (20rem) as the ceiling.** The alternative is Dialog's `sm`.
   **Recommendation: `xs`.** A confirmation is a sentence and two buttons,
   and the property is the escape.
2. **§3 — the panel takes focus when there is no `Cancel`, with a warning,
   rather than a type-level requirement.** A required `cancel` prop would
   make `Cancel` unusable as a part. **Recommendation: warn and fall back.**
3. **§2 — two classes per part rather than a second stylesheet.** The
   alternative duplicates Dialog.css. **Recommendation: two classes**, the
   IconButton precedent, so one override reaches both.
