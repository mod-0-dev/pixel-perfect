# VisuallyHidden

Content available to assistive technology and hidden from sight. Spec:
[`tier-1-atoms.md` §1.4](../specs/tier-1-atoms.md#14-visuallyhidden).

```tsx
import { VisuallyHidden } from 'pixel-perfect';
```

## Usage

The words that make an icon-only control comprehensible:

```tsx
<button type="button">
  <Icon decorative><X /></Icon>
  <VisuallyHidden>Close dialog</VisuallyHidden>
</button>
```

A heading that exists for the document outline only:

```tsx
<VisuallyHidden asChild>
  <h2>Search results</h2>
</VisuallyHidden>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Render the single child element instead of a `<span>` |

Plus every `<span>` attribute. `ref` goes to the root element.

## Don't

```tsx
// ✗ Not a way to hide things you might show later. That is conditional render.
<VisuallyHidden>{isCollapsed ? details : null}</VisuallyHidden>

// ✗ Not a focus-revealing skip link. That is a different component.
<VisuallyHidden asChild><a href="#main">Skip to content</a></VisuallyHidden>
```

## Styling

None. A component whose appearance is overridable defeats its purpose.
