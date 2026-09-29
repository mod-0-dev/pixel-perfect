# 5.1 `Card`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `done` — 2026-09-29; written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-079; its CI-authored baselines compared green on runs 175 and 176 (D-013; the sweep is D-093 §6) |
| **Sizing contract** | `fill` |
| **RSC** | `server` — no state, no effect, no handler |
| **Depends on** | Tier 2 (`done`): a card composes a `Stack` inside itself when it needs one, and nothing here re-invents a layout |
| **APG pattern** | None. A card is a surface; whatever it holds has the pattern. An interactive card is a [link](https://www.w3.org/WAI/ARIA/apg/patterns/link/) or a button, by `asChild` |

The first of Tier 5, and the one the roadmap has pointed at since Tier 2:
"if you want a bordered box, that is `Card` (5.1)" (tier-2-layout §3).
A surface with sections and hairlines between them, nothing more.

## Purpose

A bounded surface for one thing: a record in a list, a setting with its
control, a summary with its number, a preview with its actions. It has a
header, a body and a footer, any of which may be absent, and a hairline
between the ones that are present. It is not a layout (that is `Stack`,
`Grid`, `Split`) and not a message (that is `Alert`).

It deliberately does **not**: carry a `tone` (a red card is an `Alert`; a
highlighted card is a consumer's border colour, by the property); hold
its own title prop (the header is a section, and what goes in it is the
consumer's — a `Heading`, a `Cluster` of a title and a `Badge`); or
elevate by default (a card on a page is a bordered surface; a shadow is
for what floats, and the overlays have it).

---

## Decisions this spec asks you to approve

### 1. Four parts, named exports, and RULES §5.6's example is amended

```tsx
<Card>
  <CardHeader><Heading level={3} size="sm">Billing</Heading></CardHeader>
  <CardBody><Text>Next invoice on the 1st.</Text></CardBody>
  <CardFooter><Button variant="outline">Manage</Button></CardFooter>
</Card>
```

`Card`, `CardHeader`, `CardBody`, `CardFooter`. RULES §5.6 wrote its
composition example as `<Card><Card.Header/></Card>` before D-062 §1
found that a Server Component cannot dot into a client module and made
every Tier 4 compound's parts named exports. A card is a server
component and *could* dot — and then the library would have two
spellings for one idea, decided by whether the root happens to hold
state. One spelling: named exports, for every compound. RULES §5.6's
example is amended to say so (D-079 §1).

### 2. A bordered raised surface, no `tone`, no `variant`, no `size`

`--pp-color-bg-raised` (the page in light, a step up in dark), a hairline
of `--pp-color-border-subtle`, `--pp-radius-3`, no shadow. Sections pad
`--pp-space-5` on the inline axis and `--pp-space-4` on the block axis,
and a hairline runs between adjacent sections — drawn as the later
section's `border-block-start`, so a card with a body alone has no line
and a card with all three has two. `variant` would name `solid` /
`outline` / `ghost` / `plain` looks for a box whose only look is a
border; `size` would scale padding for a container that fills. Neither;
`--pp-card-padding-inline`, `--pp-card-padding-block`, `--pp-card-radius`,
`--pp-card-border-color`, `--pp-card-bg` and `--pp-card-shadow` are the
escapes, and a consumer who wants a lifted card sets the last to
`--pp-shadow-1`.

### 3. An interactive card is the consumer's link or button, by `asChild`

`asChild` on `Card` renders the consumer's `<a>` or `<button>` with the
card's class, and the stylesheet gives an interactive root — `.pp-card:is(a,
button)` — a hover border in `--pp-color-border`, a lifted shadow
(`--pp-shadow-1`), the focus ring, and inherited text (a link's underline
and colour are reset: a card is not a run of text). A card that is a link
holds no other interactive content — nested interactives are invalid
HTML — and the docs page says so.

### 4. Sections are `div`s; the header is not a heading

`CardHeader` is a `<div>`: what it holds is the consumer's, and a heading
inside it is at the page's level (Alert §6's ruling). The body is a
`<div>` with no layout of its own — a `Stack` inside it when it needs one
(tier-2-layout §3). The footer is a `<div>` too; a `Cluster` of buttons
inside it is the usual thing, and the footer's background is the sunken
surface (`--pp-color-bg-sunken`) so a row of actions reads as the card's
foot.

---

## Sizing contract justification

`fill`: a block that takes its container's width, its height its
content's. `min-inline-size: 0` per RULES §1's definition — stated, not
claimed: the card clips for its radius, and the clip already zeroes the
automatic minimum (D-079 §3). What keeps a URL in the body inside the box
is `overflow-wrap: anywhere` on the root, inherited, so a bare string in a
section breaks rather than being cut off by the clip. Nothing hugs; a card
in a `Grid` fills its cell.

## Anatomy

```
<div class="pp-card">                                  (or the asChild element)
  ├── <div class="pp-card__header">
  ├── <div class="pp-card__body">
  └── <div class="pp-card__footer">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Card | `pp-card` | `<div>` or `asChild` | The surface |
| CardHeader | `pp-card__header` | `<div>` | |
| CardBody | `pp-card__body` | `<div>` | |
| CardFooter | `pp-card__footer` | `<div>` | The sunken foot |

## Props

**`Card`**: `asChild?: boolean`, …`ComponentPropsWithoutRef<'div'>`.
**`CardHeader`**, **`CardBody`**, **`CardFooter`**: …`<'div'>`.

Exported types: `CardProps`, `CardHeaderProps`, `CardBodyProps`, `CardFooterProps`.

## State

None. An interactive card's hover and focus are the element's own.

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-card-bg` | `--pp-color-bg-raised` | The surface |
| `--pp-card-border-color` | `--pp-color-border-subtle` | The edge and the hairlines |
| `--pp-card-radius` | `--pp-radius-3` | Corners |
| `--pp-card-padding-inline` | `--pp-space-5` | Every section |
| `--pp-card-padding-block` | `--pp-space-4` | Every section |
| `--pp-card-shadow` | `none` | Elevation; `--pp-shadow-1` lifts it |
| `--pp-card-footer-bg` | `--pp-color-bg-sunken` | The foot |

**Contrast, computed at the gate (D-048 §1).** The card sets no text
colour: its children keep the page's pairings on `bg-raised`, which is
neutral 1 / 3 — every text token is asserted against it. The foot is
`bg-sunken` (neutral 3 / 1), also asserted. The edge is `border-subtle`,
no obligation by design (D-050); an interactive card's hover edge is
`--pp-color-border`, the control boundary, which carries one. Nothing new
is asserted and nothing missing is leaned on.

## Keyboard interaction

None of its own. An `asChild` link or button has its element's.

## Accessibility notes

- No role: a card is a surface. A consumer who means a region passes
  `role="region"` and a name.
- An interactive card is the consumer's `<a>` or `<button>`, named by its
  content, and holds no other interactive element.
- **Manual walkthrough:** Tab through a page of cards, confirm plain
  cards are skipped and an interactive one is reached, ringed, and
  activates on `Enter`.

## Container behavior

`fill` at every width; sections wrap their content.

## Usage

```tsx
<Grid columns="repeat(auto-fill, minmax(16rem, 1fr))" gap="4">
  {projects.map((p) => (
    <Card key={p.id} asChild>
      <Link href={`/projects/${p.id}`}>
        <CardHeader><Heading level={3} size="sm">{p.name}</Heading></CardHeader>
        <CardBody><Text size="sm" tone="muted">{p.summary}</Text></CardBody>
      </Link>
    </Card>
  ))}
</Grid>
```

## Don't

```tsx
// ✗ A tone. A red card is an Alert.
<Card tone="danger">…</Card>

// ✗ A title prop. The header is a section; put a Heading in it.
<Card title="Billing">…</Card>

// ✗ A link card with a button in it. Nested interactives are invalid.
<Card asChild><a href="/x"><CardFooter><Button>Delete</Button></CardFooter></a></Card>

// ✗ A width. A card fills; put it in a Container or a Grid.
<Card style={{ width: 320 }} />
```

## Testing notes

- **Unit:** the classes and elements; sections in order; `asChild` onto an
  `<a>` keeps the class and the href; refs, `className`, `style` on every
  part; a part outside the root is fine (no context: sections are plain
  divs); axe with a heading, a link card and a footer of buttons, both
  themes.
- **Browser:** the surface is `bg-raised` and the foot `bg-sunken`,
  resolved; one hairline between header and body and one between body and
  footer, none above the header; the padding tokens; an interactive card
  lifts on hover and rings on focus, its text not underlined; a URL in the
  body stays inside at 240px; the gallery at three widths.
- **Break checks (D-035 §3):** drop the hairline rule (the count); drop the
  footer's surface; drop the interactive hover; drop `overflow-wrap:
  anywhere` (the URL test).
- **Screenshot:** a card with all three sections per cell, plus a link
  card.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **§1 — named exports, and RULES §5.6's example amended.** Alternative:
   dotted parts for server compounds. **Recommendation: named.** One
   spelling for every compound.
2. **§2 — no shadow by default.** Alternative: `--pp-shadow-1`.
   **Recommendation: none.** A shadow is for what floats.
3. **§4 — the foot on the sunken surface.** Alternative: the same surface
   with a hairline only. **Recommendation: sunken.** A row of actions
   reads as the card's foot, and the hairline alone reads as a divider in
   the body.
