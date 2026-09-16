# <Name>

| | |
| --- | --- |
| **Tier** | |
| **Status** | `spec` |
| **Sizing contract** | `fill` \| `hug` |
| **RSC** | `server` \| `client` |
| **Depends on** | |
| **APG pattern** | |

## Purpose

One paragraph. What problem this solves, and where it stops. Name the things
this component deliberately does *not* do.

## Sizing contract justification

Why `fill` or `hug`. If this component needs an exception to RULES §1, state it
here and link the `docs/DECISIONS.md` entry.

## Anatomy

```
<div class="pp-<name>" data-state="…">
  └── <span class="pp-<name>__…">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |

Use the fixed vocabulary: `variant` (`solid \| outline \| ghost \| plain`),
`tone` (`neutral \| accent \| danger \| success \| warning`), `size`
(`sm \| md \| lg`). No synonyms.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |

## Styling API

Component-scoped custom properties consumers may override.

| Custom property | Default token | Affects |
| --- | --- | --- |

## Keyboard interaction

| Key | Behavior |
| --- | --- |

Cross-checked against the WAI-ARIA APG. Note and justify any deliberate
divergence.

## Accessibility notes

Roles, accessible names, ARIA relationships, focus behavior, screen reader
expectations.

## Container behavior

How this responds across container widths. `@container` breakpoints, if any.

## Usage

```tsx
```

## Don't

```tsx
// ✗ why this is wrong
```

## Open questions

Resolve before Gate C.
