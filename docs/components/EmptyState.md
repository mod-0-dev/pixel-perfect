# EmptyState

Nothing here yet, and what to do about it: a glyph, a title, a line and
the action that would fill the space. Spec:
[`EmptyState.md`](../specs/EmptyState.md).

```tsx
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription, EmptyStateActions } from '@mod-0-dev/pixel-perfect';
```

A Server Component. Every part is a Tier 1–2 primitive with the empty
state's class: the icon is an `Icon`, the title a `Heading`, the
description a `Text`, the actions a `Cluster`, so their props are the
primitives'.

## Usage

```tsx
<EmptyState>
  <EmptyStateIcon><InboxIcon /></EmptyStateIcon>
  <EmptyStateTitle level={2}>No projects yet</EmptyStateTitle>
  <EmptyStateDescription>Create your first project to start tracking work.</EmptyStateDescription>
  <EmptyStateActions>
    <Button tone="accent">New project</Button>
    <Button variant="ghost">Import</Button>
  </EmptyStateActions>
</EmptyState>
```

`level` on the title is required, as on `Heading`: the outline of the
page is yours. Any part may be left out; a title alone is fine.

It centres itself and holds its text to a readable measure (20rem) on a
wide page, and is the whole cell in a sidebar. Don't wrap it in a
`Center`.

`variant="outline"` is a dashed frame on Card's surface, the form for a
region that will hold things:

```tsx
<EmptyState variant="outline">
  <EmptyStateTitle level={3}>No files</EmptyStateTitle>
  <EmptyStateDescription>Drop files here or <Link href="#">browse</Link>.</EmptyStateDescription>
</EmptyState>
```

A search that returns nothing and replaces a list in place may announce
itself: put `role="status"` on the root.

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `EmptyState` | `<div>` | `variant`: `plain` (default) or `outline` |
| `EmptyStateIcon` | `Icon`, decorative, `lg` | In a round tile on the sunken surface |
| `EmptyStateTitle` | `Heading`, `size="md"` | `level` required |
| `EmptyStateDescription` | `Text`, muted, centred | |
| `EmptyStateActions` | `Cluster`, centred, `gap="2"` | |

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-empty-state-measure` | `--pp-measure-xs` | The column's ceiling |
| `--pp-empty-state-padding-block` | `--pp-space-7` | Above and below |
| `--pp-empty-state-padding-inline` | `--pp-space-5` | Each side |
| `--pp-empty-state-icon-bg` | `--pp-color-bg-sunken` | The icon's tile |
| `--pp-empty-state-icon-color` | `--pp-color-text-muted` | The glyph |

## Anatomy

```
<div class="pp-empty-state" data-variant="plain">          (+ pp-card when outline)
  ├── <span class="pp-icon pp-empty-state__icon" aria-hidden="true">
  ├── <h2 class="pp-heading pp-empty-state__title">
  ├── <p class="pp-text pp-empty-state__description">
  └── <div class="pp-cluster pp-empty-state__actions">
```

## Don't

```tsx
// ✗ Props for the content. Render the parts.
<EmptyState title="No projects" description="…" action={<Button />} />

// ✗ A Center around it. It centres itself.
<Center><EmptyState>…</EmptyState></Center>

// ✗ An error. That is an Alert.
<EmptyState><EmptyStateTitle level={2}>Failed to load</EmptyStateTitle></EmptyState>
```
