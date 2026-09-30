# 4.12 `Toast`

| | |
| --- | --- |
| **Tier** | 4 — Overlays & Disclosure |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-077. Its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` for a toast inside its region; the region is a fixed box whose inline size is a token (D-061 §3's exception in D-071 §1's form) |
| **RSC** | `client` — a queue, timers, an imperative API |
| **Depends on** | 4.1 (`done`): `--pp-z-toast`; 5.2 `Alert` (`done`): the surface, by the two-class contract; 3.1 `Button` and 3.2 `IconButton`: the action and the dismiss |
| **APG pattern** | None by that name. A toast is a [status message](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) (WCAG 4.1.3) in a region a keyboard user can reach; Radix's primitive implements the announcement, the pause on hover and focus, the swipe, and the `F8` hotkey |

The roadmap row said "Region + imperative API", and `Alert` §2 said why:
mounting an element that already carries `role="alert"` is the *less*
reliable way to announce something; the reliable way is a region that
exists first and receives text afterwards. That region is this
component's, and the imperative API is how text reaches it.

## Purpose

A brief message about something that just happened — saved, sent,
failed, undone — shown at a corner of the viewport, announced to
assistive tech, gone after a moment unless the user is reading it, with
at most one action. The page carries on; nothing is modal.

It deliberately does **not**: hold a form, a link list or a decision (a
`Dialog`); stay until dismissed by default (a message that must be read
is an `Alert` in the page, or a dialog); take focus when it appears (4.1
§8: "a `Toast` never takes focus"); or stack without limit (§4).

---

## Decisions this spec asks you to approve

### 1. One provider, one hook, and no declarative `<Toast>`

```tsx
// Once, near the root.
<ToastProvider placement="bottom-end">{children}</ToastProvider>

// Anywhere below.
const { toast, dismiss, update } = useToast();
toast({ title: 'Saved', description: 'Your changes are live.', tone: 'success' });
```

`ToastProvider` owns the queue and renders the region; `useToast()` returns
the three functions. There is no `<Toast open>` element to render: a
toast is an event, not a place in the tree, and a component that is both
is two APIs to keep in step (Radix ships the element; this library ships
the event). `toast()` returns an id; `dismiss(id)` closes one, `dismiss()`
closes all; `update(id, options)` changes one in place — a progress toast
that becomes a success.

### 2. A toast is an `Alert` that floats: the two-class contract

Every toast carries `pp-alert pp-toast` and its parts carry `Alert`'s
classes (`pp-alert__icon`, `__content`, `__title`, `__body`, `__dismiss`),
so `Alert.css` draws the surface, the tone, the layout and the dismiss
button — one stylesheet, two components, D-070 §1 — and `Toast.css` adds
what floating needs: the region, the shadow, the motion and the swipe. A
toast's `tone` is `Alert`'s, `neutral` by default, and as `Alert` §3
ruled the tone is never the only signal: an `icon` may be given, the
title is the message. `Alert` §5's "no default icons" holds here too.

### 3. The region is fixed at a corner, logically, and never wider than a token

`placement` on the provider: `'bottom-end'` (default), `'bottom-start'`,
`'top-end'`, `'top-start'` — logical, so `end` is the right in a
left-to-right page and the left in a right-to-left one, with no line
written by the caller (RULES §1). The region is `position: fixed` at that
corner, `--pp-z-toast`, with the space token `--pp-space-4` as its gutter
on all sides, its inline size `min(--pp-toast-width → --pp-measure-xs,
100%)` — the D-071 §1 form of the overlay exception, and
`.stylelintrc.json` names `Toast.css` for `inline-size` — and each toast
fills it. The region takes no pointer events itself, its toasts do, so
the empty corner is never a dead zone. Every placement stacks newest
nearest its edge: a bottom list reads down to its newest in DOM order,
and a top list is `column-reverse`d.

### 4. Five seconds, paused while it matters, three at a time, and the rest wait

`duration` defaults to 5000ms on the provider and per toast; Radix pauses
the timer while the pointer is over the region, while focus is in it and
while the window is blurred — WCAG 2.2.1's "the user can pause". `Infinity`
keeps a toast until dismissed. `limit` on the provider (default `3`) caps
what is shown; further toasts wait in order and appear as others go: a
form that fails five validations does not wallpaper the screen.

### 5. `live` is `Alert`'s vocabulary, and `assertive` by default

Radix calls it `type: 'foreground' | 'background'`; RULES §5 reserves
`type`, and `Alert` already has `live: 'polite' | 'assertive'`. So
`live` it is, `assertive` for the result of what the user just did
(Radix's `foreground`, announced at once) and `polite` for a background
event (Radix's `background`, announced when idle). Default `assertive`,
because a toast is almost always the former.

### 6. One action, with `altText`, and a dismiss by default

`action: { label, altText, onClick }` renders a small ghost `Button` in
the toast's tone; `altText` is required by Radix and by sense — a screen
reader user who cannot reach the button in time is told how else to do
it ("Undo (Alt+U)", "Go to settings to upgrade"). `dismissible` defaults
to `true` and renders `Alert`'s dismiss button; a toast a user cannot
dismiss is a toast with a duration only. `Escape` dismisses the focused
toast (Radix's), and `F8` moves focus to the region so a keyboard user
can reach it at all — the hotkey Radix ships, kept, and named in the
region's label.

### 7. The motion is direction-neutral; the swipe is toward the inline end

A toast enters with a fade and a short slide from the edge it is
anchored to — the block edge, so top placements slide down and bottom
placements slide up, and nothing here is physical — over
`--pp-duration-normal`, and leaves with a fade over `--pp-duration-fast`.
A swipe (Radix's, pointer only) toward the inline end dismisses:
`swipeDirection` is resolved at mount from the region's direction
(`right` in LTR, `left` in RTL), the one physical thing Radix asks for.
Under `prefers-reduced-motion` every animation is `none` (D-062 §5).

---

## Sizing contract justification

`fill` inside a region whose inline size is a token: a toast has no
parent in flow and the region is the exception (D-061 §3) in the form
D-071 §1 gave the drawer — the axis a floating box is anchored on takes
a token. `min-inline-size: 0` on the toast, so a long word wraps.

## Anatomy

```
<div>                                                         Radix's provider (no element)
  ├── {children}                                              the app
  └── <div role="region" aria-label="Notifications (F8)" tabindex="-1">   Radix's viewport wrapper
        └── <ol class="pp-toast__viewport" data-placement>
              └── <li class="pp-alert pp-toast" tabindex="0" data-pp-tone data-state data-swipe? data-placement>
                    ├── <span class="pp-alert__icon">                      (with `icon`)
                    ├── <div class="pp-alert__content">
                    │     ├── <div class="pp-alert__title">                (Radix Title)
                    │     ├── <div class="pp-alert__body">                 (Radix Description, with `description`)
                    │     └── <div class="pp-toast__action">               (with `action`)
                    │           └── <button class="pp-button …">           (Radix Action, asChild)
                    └── <button class="pp-alert__dismiss …">               (Radix Close, asChild, `dismissible`)
```

Radix also renders a visually hidden announcer — `role="status"` with
`aria-live` per `live` — that carries each toast's text for one second on
arrival, prefixed by `label`: the region that exists first. The toast
element itself carries no role; the announcer is the announcement.

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| ToastProvider | — | none of its own | `placement`, `duration`, `limit`, `label`, `viewportLabel`, `hotkey` |
| the region | `pp-toast__viewport` | `<ol>` in Radix's `<div role="region">` | Fixed at the corner |
| a toast | `pp-alert pp-toast` | `<li>` | From `toast()`; `Alert`'s parts inside; announced by Radix's announcer |
| `useToast()` | — | — | `{ toast, dismiss, update }` |

## Props

**`ToastProvider`**

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `placement` | `'bottom-end' \| 'bottom-start' \| 'top-end' \| 'top-start'` | `'bottom-end'` | Logical |
| `duration` | `number` | `5000` | ms; `Infinity` keeps |
| `limit` | `number` | `3` | Shown at once; the rest wait |
| `label` | `string` | `'Notification'` | Radix's: prefixes each announcement |
| `viewportLabel` | `string` | `'Notifications ({hotkey})'` | The region's name; `{hotkey}` is replaced |
| `hotkey` | `string[]` | `['F8']` | Moves focus to the region |
| `children` | `ReactNode` | — | The app |

**`toast(options)`**, **`update(id, options)`**

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | required | The message |
| `description` | `ReactNode` | — | |
| `tone` | `Tone` | `'neutral'` | `Alert`'s |
| `icon` | `ReactNode` | — | An SVG, as `Alert`'s |
| `duration` | `number` | provider's | |
| `live` | `'assertive' \| 'polite'` | `'assertive'` | §5 |
| `action` | `{ label: ReactNode; altText: string; onClick: () => void }` | — | §6 |
| `dismissible` | `boolean` | `true` | |
| `dismissLabel` | `string` | `'Dismiss'` | |
| `onDismiss` | `() => void` | — | After it closes, by any means |

Exported: `ToastProvider`, `useToast`, types `ToastProviderProps`,
`ToastOptions`, `ToastPlacement`, `ToastLive`, `ToastHandle` (the hook's
return).

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Open / closed | `data-state` on the toast | The enter and leave motion |
| Swiping | `data-swipe="start \| move \| cancel \| end"` | Follows the pointer; returns or leaves |
| Tone | `data-pp-tone` | `Alert`'s |
| Placement | `data-placement` on the region and each toast | The corner; the slide's edge |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-alert-*` | `Alert`'s | The surface, unrenamed |
| `--pp-toast-width` | `--pp-measure-xs` | The region's inline size |
| `--pp-toast-gutter` | `--pp-space-4` | The region's distance from the viewport's edges |
| `--pp-toast-gap` | `--pp-space-2` | Between toasts |
| `--pp-toast-shadow` | `--pp-shadow-3` | Elevation |

**Contrast, computed at the gate (D-048 §1).** `Alert`'s pairings,
verbatim (Alert §9); the action is a ghost `Button` in the tone, Button's
pairings. Nothing new is asserted and nothing missing is leaned on.

## Keyboard interaction

| Key | Behavior |
| --- | --- |
| `F8` | Focus moves to the region (Radix's hotkey; the region's label says so) |
| `Tab` / `Shift+Tab` in the region | Between the toasts' action and dismiss buttons |
| `Escape` on a focused toast | Dismisses it |
| Anything else | The page's; a toast never takes focus on arrival |

## Accessibility notes

- Radix's announcer reads each toast's text once on arrival — a visually
  hidden `role="status"` region, `aria-live` assertive or polite per
  `live`, prefixed by `label`, present for a second. The toast element
  carries no live role of its own, so it is not read twice.
- The region is `role="region"` named by `viewportLabel`, reachable by
  the hotkey; it is `tabindex="-1"` and takes focus only by the hotkey.
- Timers pause on hover, focus and window blur (WCAG 2.2.1). An action's
  `altText` tells a screen reader user another way (WCAG 2.2.1 again,
  and Radix's requirement).
- **Manual walkthrough:** press a button that toasts, confirm the toast
  appears at the corner and is announced without moving focus; hover it
  and confirm it stays; leave and confirm it goes after five seconds;
  press `F8`, confirm the region is focused and `Tab` reaches the action;
  `Escape` dismisses; fire five toasts and confirm three show and the
  rest follow; in a `dir="rtl"` page confirm `bottom-end` is the bottom
  left.

## Container behavior

None: the region is fixed to the viewport, its inline size the token or
the viewport's width, whichever is less. Inside a `contain: layout` box
(the playground's cells) it is fixed to that box, as `Dialog`'s scrim is.

## Usage

```tsx
// app/providers.tsx
'use client';
export function Providers({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}

// anywhere
const { toast } = useToast();
<Button onClick={async () => {
  await save();
  toast({ title: 'Saved', tone: 'success', action: { label: 'Undo', altText: 'Undo the save', onClick: undo } });
}}>Save</Button>
```

## Don't

```tsx
// ✗ A toast for a decision. That is an AlertDialog.
toast({ title: 'Delete this file?', action: { label: 'Delete', … } });

// ✗ A toast that must be read, kept forever. That is an Alert in the page.
toast({ title: 'Your trial ended.', duration: Infinity, dismissible: false });

// ✗ A physical corner. `end` reverses with the layout.
<ToastProvider placement="bottom-right" />

// ✗ An action without altText. A screen reader user cannot reach the button in time.
toast({ title: 'Sent', action: { label: 'Undo', onClick } });
```

## Testing notes

- **Unit (jsdom):** `toast()` renders a toast with `Alert`'s classes, the
  tone, the title and description, and the announcer speaks it
  assertively and is gone a second later; the dismiss button closes it and `onDismiss`
  fires; the action calls and closes; `duration` closes it on the timer
  (fake timers, D-065 §1) and hovering pauses; `Infinity` keeps;
  `limit` shows three of five and the fourth follows a dismissal;
  `dismiss()` with no id closes all; `update` changes a toast in place;
  `live="polite"` is Radix's background; `placement` writes the attribute;
  the hook outside the provider throws; axe with toasts showing, both
  themes.
- **Browser:** the region is at the bottom-end corner one gutter in, the
  token wide, and its toasts fill it; the newest is nearest the edge;
  under `dir="rtl"` `bottom-end` is bottom left; `F8` focuses the region
  and `Escape` dismisses; the region takes no pointer events but a toast
  does; reduced motion is `none`; the gallery shows a toast per cell,
  each fixed inside its stage.
- **Break checks (D-035 §3):** drop `pointer-events: none` from the region
  (the dead-zone test); reverse the bottom list (the newest-nearest test);
  drop the `limit` (the queue test); drop the direction resolution (the
  RTL swipe direction attribute); drop the reduced-motion rule.
- **Screenshot:** three stages, each with a provider whose region is
  fixed inside it, holding a success toast fired on mount with
  `duration: Infinity`.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **§1 — no declarative `<Toast>` element.** Alternative: export Radix's
   parts under our names as well. **Recommendation: the event only.** Two
   APIs for one thing drift.
2. **§4 — `limit` defaults to 3.** Alternative: unlimited, Radix's.
   **Recommendation: 3.** A failing form should not wallpaper the screen.
3. **§5 — `assertive` by default.** Alternative: `polite`.
   **Recommendation: `assertive`.** A toast is almost always the result of
   what the user just did.
4. **§7 — the slide is from the block edge.** Alternative: from the inline
   end, as most libraries. **Recommendation: the block edge.** Nothing
   physical, and the same motion in every direction.
