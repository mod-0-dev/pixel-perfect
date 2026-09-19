# Scroller

An overflow container that says there is more content past the edge. Spec:
[`tier-2-layout.md` §2.8](../specs/tier-2-layout.md#28-scroller).

```tsx
import { Scroller } from 'pixel-perfect';
```

The affordance is the entire point: an overflowing region with no shadow and no
scrollbar is content users never find.

## Usage

```tsx
<Scroller orientation="horizontal" label="Task table">
  <table>…</table>
</Scroller>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | **Required.** `aria-label` on the region |
| `orientation` | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Which axis scrolls. Mirrored as `data-orientation` |

Plus every `<div>` attribute except `role`, which the component owns.

## `label` is required, and that is deliberate

A scrollable region a keyboard user can reach is WCAG 2.1.1, and a focusable
region with no accessible name is a 4.1.2 failure.
[RULES §6](../RULES.md) says the type system should make an accessible name
impossible to omit, so there is no unlabelled form.

`tabIndex={0}` is unconditional. A region containing focusable children arguably
does not need its own stop, but deciding that at runtime means inspecting
children on every render — and the extra stop is harmless where the shadow is
correct and essential where it is not. Chrome ≥ 127 does this natively for
scrollers; this makes it true everywhere.

## `data-overflow`

`"none" | "start" | "end" | "both"`, naming the edge that has content **beyond**
it. Logical: on the inline axis `start` is the left edge in LTR and the right in
RTL; on the block axis it is the top.

Which axis it describes follows `orientation`:

| `orientation` | `data-overflow` | `data-overflow-inline` |
| --- | --- | --- |
| `vertical` | the block axis | absent |
| `horizontal` | the inline axis | absent |
| `both` | the block axis | the inline axis |

One attribute cannot name the edges of two axes, so `both` reports the inline
axis beside the block one, and shades all four edges ([D-046](../DECISIONS.md)).
The inline attribute exists only on `both`: on a single-axis region it would be
a second source of truth for the same axis.

It is in the DOM, so the shadow is never the only signal, and the scrollbar is
not hidden either.

**It starts at `none` and settles after mount.** There is no server-side answer
to "is this overflowing" — the measurement needs layout. Server and first client
render agree on `none`, so there is no hydration mismatch, but a shadow does
appear a frame after paint.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-scroller-max-block-size` | `none` | Height at which it starts scrolling |
| `--pp-scroller-shadow-size` | `--pp-space-4` | Shadow depth; `0` disables |
| `--pp-scroller-shadow-color` | `--pp-color-shadow-edge` | Shadow colour |

## Testing in jsdom

`Scroller` uses `ResizeObserver`, which jsdom does not implement. Add a stub to
your test setup:

```ts
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
```

It is not guarded inside the component: `ResizeObserver` is in every browser the
library targets, alongside `@container`, `:dir()` and OKLCH, and defending
production code against a gap in a test environment is the tail wagging the dog.

## Don't

```tsx
// ✗ No label. A focusable region with no accessible name is a 4.1.2 failure,
//   and the type rejects it.
<Scroller>…</Scroller>

// ✗ Hiding the scrollbar because the shadows look nicer. The shadow is a
//   second signal, not a replacement for the first.
<Scroller label="…" style={{ scrollbarWidth: 'none' }}>…</Scroller>

// ✗ Scrolling a whole page. Scroller is for a region inside one.
<Scroller label="Page"><Container>…</Container></Scroller>
```
