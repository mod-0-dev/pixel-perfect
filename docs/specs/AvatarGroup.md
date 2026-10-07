# 5.13 `AvatarGroup`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-090; its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `hug` |
| **RSC** | `server` — no state; the `Avatar`s inside are client for their image fallback |
| **Depends on** | 1.9 `Avatar` (`done`), 2.2 `Cluster` (`done`) — the Cluster is what it replaces: a row of avatars that overlap, which a Cluster's `gap` cannot express |
| **APG pattern** | None. A list of named images, and a count |

Who is on it: a few avatars overlapping in a row, and "+3" for the rest.
Added to the roadmap by D-016 §7 because the consuming app wanted it and
faked it with a class.

## Purpose

Assignees on a task, members of a channel, people in a thread. Each
face is an `Avatar`, already named and already sized; what the group
adds is the overlap — which a `Cluster` cannot do, because its `gap`
is only ever positive — a limit with a count for what is past it, and
list semantics so a screen reader hears "4 items" and then the names.

It deliberately does **not**: know who the people are (children are
`Avatar`s, or anything avatar-shaped); expand on hover (the count is
the consumer's tooltip or popover to attach); or take a `tone`.

---

## Decisions this spec asks you to approve

### 1. A list of the children, the first `max` shown, the rest a count

```tsx
<AvatarGroup max={3} label="Assignees">
  <Avatar name="Ada Lovelace" src="/ada.jpg" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
  <Avatar name="Margaret Hamilton" />
  <Avatar name="Mary Jackson" />
</AvatarGroup>
```

One part. The root is a `<ul>` with each child in a `<li>`, so a screen
reader hears the count and then each `Avatar`'s name; `label` names the
list when given. `max` (default: all) shows the first `max` children
and then one more item: a count, `+2`, drawn as an `Avatar` — the
`pp-avatar` class with the group's own class after it, the two-class
contract (D-070 §1) — on the sunken surface, named "2 more". A `max` at
or above the count shows no count (D-090 §1).

### 2. Overlap by a grid whose columns are narrower than an avatar

A negative margin is the usual overlap and RULES §2 bans it. The group
is a grid, `grid-auto-flow: column`, and its columns are an avatar's
size less the overlap, so each item starts inside the one before it;
the last item runs past its column by the overlap, and the group pads
its end by the same amount so its hug box holds it. No margin, no
width: the parent sizing the boxes it created (D-021). Each avatar
carries a ring the colour of the surface (`--pp-color-bg-surface`,
`--pp-border-width-2`) so the overlap reads as a stack and not a smear.
Later items sit over earlier ones, document order, which in RTL runs
from the right with nothing said (D-090 §2).

### 3. `size` is the group's, written into the avatars

`size` on the group (`sm | md | lg`, `md`) sizes every avatar inside
through `--pp-avatar-size` and the initials' font through Avatar's
private variable, so the consumer does not repeat `size` on each child
and the count matches. The overlap is `--pp-avatar-group-overlap`, a
fifth of the face by default — 8px on a 32px face is the whole margin
beside a pair of initials, and a fixed 8px put the second letter under
the next face at `sm` (D-090 §4). **Amended by D-107 §1:** the overlap
is how much of a face is hidden *ring included* — the columns are a
ring wider than face less overlap — and the initials of every covered
face are centred in what stays visible. The first build hid a fifth
plus the 2px ring, and every pair in its own gallery lost an edge of
its second letter.

---

## Sizing contract justification

`hug`: an inline-level grid the width of its items, the columns fixed
by the size and the overlap.

## Anatomy

```
<ul class="pp-avatar-group" data-size="md" aria-label="Assignees"?>
  ├── <li class="pp-avatar-group__item"> <span class="pp-avatar" role="img" aria-label="Ada Lovelace">
  ├── <li class="pp-avatar-group__item"> …
  └── <li class="pp-avatar-group__item"> <span class="pp-avatar pp-avatar-group__more" role="img" aria-label="2 more">+2
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| AvatarGroup | `pp-avatar-group` | `<ul>` | The grid |
| item | `pp-avatar-group__item` | `<li>` | One per child, and one for the count |
| more | `pp-avatar pp-avatar-group__more` | `<span>` | The count |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `max` | `number` | all | The first `max` shown; the rest counted |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Every avatar's, and the count's |
| `label` | `string` | — | The list's name |
| `moreLabel` | `(count: number) => string` | `n => \`${n} more\`` | The count's name |

…`ComponentPropsWithoutRef<'ul'>` less `aria-label`. Exported:
`AvatarGroupProps`.

## State

None.

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-avatar-group-overlap` | a fifth of the face | How much of each face the next one hides, its ring included (D-107 §1) |
| `--pp-avatar-group-ring-color` | `--pp-color-bg-surface` | The ring between faces |
| `--pp-avatar-group-more-bg` | `--pp-color-bg-sunken` | The count |
| `--pp-avatar-group-more-color` | `--pp-color-text-muted` | The count's text |

**Contrast, computed at the gate (D-048 §1).** The count is muted text
on `bg-sunken`, neutral 11 / 3, asserted (Table's header pairing); the
avatars' own pairings are Avatar's; the ring is decoration.

## Keyboard interaction

None. Nothing here is focusable.

## Accessibility notes

- A list: "list, 4 items", then each avatar's name (`role="img"` with
  `aria-label`, Avatar's), then "2 more".
- `label` names the list; without one it is an unnamed list, which is
  fine beside a heading that says what it is.
- **Manual walkthrough:** hear "Assignees, list, 4 items, Ada Lovelace,
  image, Grace Hopper, image, Katherine Johnson, image, 2 more, image".

## Container behavior

`hug`; never wraps. More faces than fit are the consumer's `max`.

## Usage

```tsx
<AvatarGroup max={3} size="sm" label="Assignees">
  {members.map((m) => <Avatar key={m.id} name={m.name} src={m.avatar} />)}
</AvatarGroup>
```

## Don't

- Don't set `size` on the avatars inside; set it on the group.
- Don't use it for one avatar; that is an `Avatar`.
- Don't put a `Tooltip` on the count from inside; attach yours.

## Testing notes

- **Unit:** a list of items, one per child; `max` showing the first
  and a count named "n more" drawn as an avatar, none at or above the
  count; `size` on the root; `label`; `moreLabel`; refs, `className`,
  `style`; axe both themes.
- **Browser:** the group hugs (narrower than its cell); each item's
  start is the previous one's plus the size less the overlap; the last
  item inside the group's box; the ring's colour and width; the count
  the same size as a face and on the sunken surface; `size` sizing the
  avatars; RTL from the right.
- **Break checks (D-035 §3):** drop the column width (no overlap);
  drop the end padding (the last face outside the box); drop the ring;
  drop the count's surface.
- **Screenshot:** five faces with `max={3}` per cell, plus the sizes
  and a group of two outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **Expand on hover to show the rest?** No: the count is a hook for
   the consumer's `Tooltip` or `Popover`. Recommend no.
2. **First face on top instead of last?** Document order is the simpler
   rule and the one RTL needs nothing for. Recommend last on top.
