# Stepper

Where a multi-step process stands: the steps in order, the ones done, the
one now, the ones to come, and a line joining them. Spec:
[`Stepper.md`](../specs/Stepper.md).

```tsx
import { Stepper, Step } from '@mod-0-dev/pixel-perfect';
```

A Server Component and a status display, not a control: it holds no
state and moves nothing. You say which step is `complete`, `current` or
`upcoming`; Next and Back are your form's.

## Usage

```tsx
<Stepper>
  <Step status="complete">Account</Step>
  <Step status="current" description="Card or invoice">Payment</Step>
  <Step description="Check and confirm">Review</Step>
</Stepper>
```

A step is `upcoming` unless you say otherwise. The visible number is a
counter and a completed step shows a check; a screen reader hears the
position from the list, "current step" from `aria-current`, and
"Completed" from hidden text.

Steps run in a row, each an equal share of the line. **Narrower than
about 28rem the row becomes a column** — the container decides, not the
viewport — and `orientation="vertical"` makes it a column everywhere:

```tsx
<Stepper orientation="vertical" label="Setup">…</Stepper>
```

If the process allows going back, the link is yours, in the label:

```tsx
<Step status="complete"><Link href="/checkout/account">Account</Link></Step>
```

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `Stepper` | `<nav aria-label="Progress">` around `<ol>` | `orientation`, `label` |
| `Step` | `<li>` | `status`, `description`; children are the label |

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-stepper-gap` | `--pp-space-3` | Between indicator, label and connector |
| `--pp-stepper-connector-color` | `--pp-color-border-subtle` | A connector not yet reached |
| `--pp-stepper-connector-done-color` | `--pp-tone-solid` | A connector after a completed step |

The colours are the accent ramp's; a `data-pp-tone` on a wrapper changes
all of them.

## Anatomy

```
<nav class="pp-stepper" aria-label="Progress" data-orientation="horizontal">
  └── <ol class="pp-stepper__list">
        └── <li class="pp-stepper__step" data-state="current" aria-current="step">
              ├── <span class="pp-stepper__indicator" aria-hidden="true">
              └── <span class="pp-stepper__body">
                    ├── <span class="pp-stepper__label">
                    └── <span class="pp-stepper__description">
```

## Don't

```tsx
// ✗ Numbers in the labels. The counter and the list do that.
<Step>1. Account</Step>

// ✗ Two current steps.
<Step status="current">A</Step><Step status="current">B</Step>

// ✗ An array of steps. Render Steps.
<Stepper steps={['Account', 'Payment']} />
```
