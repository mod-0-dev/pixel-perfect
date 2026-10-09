# Progress

How far along a thing is: a bar filled as far as the value says, or a
segment sweeping while the size of the work is unknown. Spec:
[`Progress.md`](../specs/Progress.md).

```tsx
import { Progress } from '@mod-0-dev/pixel-perfect';
```

A Server Component; the motion is CSS. The determinate half of what
`Spinner` began: a spinner for "something is happening", a bar for "this
far".

## Usage

A bar must have a name: `label`, or `aria-labelledby` pointing at the
visible label you compose beside it.

```tsx
<Stack gap="1">
  <Cluster justify="between">
    <Text id="upload-label" size="sm">Uploading photos</Text>
    <Text size="sm" tone="muted">{percent}%</Text>
  </Cluster>
  <Progress aria-labelledby="upload-label" value={percent} />
</Stack>
```

Leave `value` off while you do not know how much work there is; the bar
sweeps, and fills once you pass a number:

```tsx
<Progress label="Connecting" />
<Progress label="Uploading" value={bytesSent} max={bytesTotal} />
```

`max` defaults to 100. For a value that is not a percentage, say what it
is:

```tsx
<Progress label="Setup" value={3} max={5} aria-valuetext="Step 3 of 5" size="sm" />
```

`tone` colours the fill, `accent` by default; `size` is the thickness.

```tsx
<Progress label="Upload" value={100} tone="success" />
<Progress label="Upload" value={30} tone="danger" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number` | — | Determinate when given; clamped to `[0, max]` |
| `max` | `number` | `100` | Positive and finite |
| `label` | `string` | — | The name; or `aria-labelledby` |
| `aria-labelledby` | `string` | — | The id of the visible label |
| `aria-valuetext` | `string` | — | A reading that is not a percentage |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 4, 8, 12px |
| `tone` | `Tone` | `'accent'` | The fill |

The rest goes onto the root `<div>`. It has no children.

## Accessibility

`role="progressbar"` with `aria-valuemin`, `aria-valuemax` and, when
determinate, `aria-valuenow`; an indeterminate bar omits `aria-valuenow`,
as ARIA says. It is not a live region: announce the end yourself, in a
`Toast` or an `Alert` with `role="status"`.

Under `prefers-reduced-motion` the fill does not slide and the
indeterminate bar pulses instead of sweeping.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-progress-track-color` | `--pp-tone-border-subtle` | The track |
| `--pp-progress-fill-color` | `--pp-tone-solid` | The fill |
| `--pp-progress-size` | `--pp-space-1/2/3` | Thickness |
| `--pp-progress-radius` | `--pp-radius-full` | The caps |
| `--pp-progress-duration` | `--pp-duration-normal` | The fill's slide |

## Anatomy

```
<div class="pp-progress" role="progressbar" data-state="determinate|indeterminate">
  └── <div class="pp-progress__fill">
```

## Don't

```tsx
// ✗ No name. The types reject it; a screen reader would say "progress bar, 40%" of nothing.
<Progress value={40} />

// ✗ A value you made up because the bar looked empty. Leave it off; it sweeps.
<Progress label="Loading" value={30} />

// ✗ A live region on the bar. Every percent would be announced.
<Progress label="Upload" value={v} aria-live="polite" />

// ✗ A width. A bar fills; put it in a Container.
<Progress label="Upload" value={v} style={{ width: 200 }} />
```
