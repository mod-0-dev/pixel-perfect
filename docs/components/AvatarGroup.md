# AvatarGroup

Who is on it: a few avatars overlapping in a row, and "+2" for the rest.
Spec: [`AvatarGroup.md`](../specs/AvatarGroup.md).

```tsx
import { AvatarGroup, Avatar } from 'pixel-perfect';
```

A Server Component. Children are `Avatar`s; the group adds the overlap
(which a `Cluster` cannot, its `gap` being only ever positive), a limit
with a count, and list semantics.

## Usage

```tsx
<AvatarGroup max={3} size="sm" label="Assignees">
  {members.map((m) => <Avatar key={m.id} name={m.name} src={m.avatar} />)}
</AvatarGroup>
```

The first `max` children are shown and the rest become one count,
drawn as an avatar and named "2 more" (`moreLabel` rewords it). Set
`size` on the group, not on the avatars: it sizes every face and the
count. Attach your own `Tooltip` or `Popover` to the count if the names
behind it matter.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `max` | `number` | all | The first `max` shown; the rest counted |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Every avatar's |
| `label` | `string` | — | The list's name |
| `moreLabel` | `(n) => string` | `"n more"` | The count's name |

## Accessibility

A `<ul>` with one `<li>` per face: a screen reader hears "list, 4
items", then each avatar's name, then "2 more". `label` names the list.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-avatar-group-overlap` | a fifth of the face | How much of each face the next one hides, its ring included |
| `--pp-avatar-group-ring-color` | `--pp-color-bg-surface` | The ring between faces |
| `--pp-avatar-group-more-bg` | `--pp-color-bg-sunken` | The count |
| `--pp-avatar-group-more-color` | `--pp-color-text-muted` | The count's text |

Each face but the last is partly covered, so its initials sit in the
middle of what is left visible rather than of the whole face; an image
fills the face as always. At the default overlap a pair of initials as
wide as "MH" keeps both letters at `md` and `lg`; one as wide as the
face itself ("MW") cannot clear any overlap at `sm` or `md`. If your
names run wide, use `size="lg"` or a smaller overlap (D-107 §1).

## Anatomy

```
<ul class="pp-avatar-group" data-size="md">
  ├── <li class="pp-avatar-group__item"> <span class="pp-avatar" role="img" aria-label="Ada Lovelace">
  └── <li class="pp-avatar-group__item"> <span class="pp-avatar pp-avatar-group__more" role="img" aria-label="2 more">+2
```

## Don't

```tsx
// ✗ Sizes on the faces. Size the group.
<AvatarGroup><Avatar size="lg" name="…" /></AvatarGroup>

// ✗ One avatar. That is an Avatar.
<AvatarGroup><Avatar name="…" /></AvatarGroup>

// ✗ Negative margins to stack them yourself. This is the component for that.
```
