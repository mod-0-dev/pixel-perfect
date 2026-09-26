# Alert

A bordered, tone-coloured block that says something happened, or something is
true, about the region of the page it sits in. Spec:
[`Alert.md`](../specs/Alert.md).

```tsx
import { Alert } from 'pixel-perfect';
```

It does **not** float, stack, queue or time out — that is `Toast` (4.12) — it
does not render a field's error (that is `Field`, 3.7), and it does not hide
itself.

## Usage

```tsx
<Alert>Exports are generated overnight.</Alert>

<Alert tone="danger" title="Export failed" icon={<XCircleIcon />}>
  The report could not be generated. Try again in a few minutes.
</Alert>

// Actions are children, spaced by a layout primitive. Each takes its tone
// explicitly: a Button or Link does not pick up the alert's (see below).
<Alert tone="warning" title="Payment method expires soon">
  <Stack gap="3">
    <Text>Your card ending 4242 expires next month.</Text>
    <Cluster gap="2">
      <Button size="sm" tone="warning">Update card</Button>
      <Button size="sm" variant="plain" tone="warning">Remind me later</Button>
    </Cluster>
  </Stack>
</Alert>

// Heading semantics are opted into: `title` renders a <div> by default.
<Alert tone="danger" title={<Heading level={2} size="sm">3 problems</Heading>}>
  Fix them and submit again.
</Alert>
```

## The tone stops at the next component that has one

`tone` sets `data-pp-tone` on the root, and that context reaches your bare text
and anything that paints from `currentColor`. It does **not** reach a `Button`,
`Link`, `Badge` or `Code` inside the alert: each of those defaults its own
`tone` (`Link` to `accent`, the rest to `neutral`) and writes its own
`data-pp-tone`, and the nearest context wins. A `Button` in a danger alert is a
neutral button until you pass `tone="danger"`.

Often that is what you want — a red "Try again" reads as destructive. When it is
not, pass the tone. `Text` and `Heading` are the exception: they write a context
only when you give them a coloured tone, so at their default they paint the
ordinary text colours, not the alert's.

## `role="alert"` is opt-in

The component is named `Alert`; it is not an ARIA `alert` until you say so.

An assertive live region interrupts whatever the screen reader is saying, and a
live region announces *changes* to a region that already existed — so an alert
rendered into the initial HTML has no change to announce and may be read twice
or not at all. The default is therefore no role.

| `live` | Root gets | Use for |
| --- | --- | --- |
| `'off'` *(default)* | nothing | Anything present when the page renders, and any alert that mounts inside a region you keep |
| `'polite'` | `role="status"` | An alert that stays mounted while its content changes |
| `'assertive'` | `role="alert"` | The same, when it must interrupt |

**The role is on this element, so it only announces reliably when this element
already existed.** `{saved && <Alert live="polite">…</Alert>}` — the first thing
anyone writes for a confirmation — mounts the region and its text in the same
commit, and may be read twice or not at all. When the message arrives by
mounting, keep the region mounted yourself and render the alert inside it with
`live` off:

```tsx
<div role="status">
  {saved ? <Alert tone="success">Settings saved.</Alert> : null}
</div>
```

That is `Toast`'s (4.12) architecture in miniature. For a form error summary,
move focus to the alert instead — `ref` is forwarded and `tabIndex` passes
through.

## Dismissal

`onDismiss` renders the close button and reports the intent. **It does not hide
anything.** The component holds no state, which is what keeps it a Server
Component and what keeps a dismissed banner something your app can remember.

```tsx
'use client'; // onDismiss is a function, so the caller must be a client component
const [open, setOpen] = useState(true);
return open ? <Alert onDismiss={() => setOpen(false)}>…</Alert> : null;
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `tone` | `'neutral' \| 'accent' \| 'danger' \| 'success' \| 'warning'` | `'neutral'` | The alert's hue. Reaches bare text; not a `Button` or `Link` inside, which keep their own (see above) |
| `title` | `ReactNode` | — | A `<div>`, not a heading. Pass a `Heading` for semantics |
| `icon` | `ReactNode` | — | The **SVG**, wrapped in `<Icon decorative>` here |
| `onDismiss` | `() => void` | — | Renders the close button |
| `dismissLabel` | `string` | `'Dismiss'` | The close button's accessible name |
| `live` | `'off' \| 'polite' \| 'assertive'` | `'off'` | See above |

Plus every `<div>` attribute except `title`, which is reclaimed for the heading
line. `ref` goes to the root. There is no `variant` and no `size`.

`undefined`, `null` and `false` all mean "no slot" for `icon`, `title` and
`children`; `0` and `''` are content.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-alert-bg` | `--pp-tone-bg` | Fill |
| `--pp-alert-color` | `--pp-tone-text` | Body text and the dismiss glyph |
| `--pp-alert-title-color` | `--pp-tone-text-strong` | Title |
| `--pp-alert-border-color` | `--pp-tone-border` | The edge |
| `--pp-alert-radius` | `--pp-radius-3` | Corners |
| `--pp-alert-padding-block` | `--pp-space-3` | Vertical padding |
| `--pp-alert-padding-inline` | `--pp-space-4` | Horizontal padding |
| `--pp-alert-gap` | `--pp-space-3` | Icon → content → dismiss |
| `--pp-alert-row-gap` | `--pp-space-1` | Title → body |

## Don't

```tsx
// ✗ Tone as the only signal. Both of these are "Done." to a screen reader, and
//   to anyone who cannot separate this green from that red.
<Alert tone="success">Done.</Alert>
<Alert tone="danger">Done.</Alert>
// ✓ Say what happened.
<Alert tone="success">Your invoice was sent.</Alert>

// ✗ An alert for a field's error. Field already renders it, with the
//   aria-describedby wiring this cannot reproduce.
<Field label="Email"><Input /><Alert tone="danger">Enter a valid email.</Alert></Field>
// ✓
<Field label="Email" error="Enter a valid email."><Input /></Field>

// ✗ assertive by reflex on something that was always there.
<Alert live="assertive" tone="accent">You are viewing test data.</Alert>
// ✓ A banner that is always there is not news.
<Alert tone="accent">You are viewing test data.</Alert>

// ✗ A live region that mounts with its message already in it. It may be read
//   twice or not at all.
{saved && <Alert live="polite" tone="success">Settings saved.</Alert>}
// ✓ The region exists first; the alert's arrival is the change.
<div role="status">{saved && <Alert tone="success">Settings saved.</Alert>}</div>

// ✗ Expecting a Button to take the alert's hue. This one is neutral.
<Alert tone="warning">Card expiring. <Button>Update card</Button></Alert>
// ✓ Say which tone it is.
<Alert tone="warning">Card expiring. <Button tone="warning">Update card</Button></Alert>

// ✗ Expecting it to disappear. This renders a close button that does nothing.
<Alert onDismiss={() => track('dismissed')}>…</Alert>
// ✓ You own the unmount, and the focus that follows it.
{open && <Alert onDismiss={() => { setOpen(false); headingRef.current?.focus(); }}>…</Alert>}

// ✗ Sizing it. fill means fill (RULES §1).
<Alert style={{ maxWidth: 480 }}>…</Alert>
// ✓ Wrap it.
<Container size="sm"><Alert>…</Alert></Container>

// ✗ A stack of alerts as a notification queue. They do not order, deduplicate
//   or expire.
{notifications.map((n) => <Alert key={n.id}>{n.text}</Alert>)}
// ✓ That is Toast (4.12).
```
