# Card

A bounded surface for one thing: a header, a body and a foot, any of which
may be absent, and a hairline between the ones that are present. Spec:
[`Card.md`](../specs/Card.md).

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@mod-0-dev/pixel-perfect';
```

A Server Component. Not a layout (`Stack`, `Grid`, `Split` are) and not a
message (`Alert` is).

## Usage

```tsx
<Card>
  <CardHeader>
    <Heading level={3} size="sm">Billing</Heading>
  </CardHeader>
  <CardBody>
    <Text>Next invoice on the 1st.</Text>
  </CardBody>
  <CardFooter>
    <Cluster justify="end" gap="2">
      <Button variant="ghost">Cancel plan</Button>
      <Button variant="outline">Manage</Button>
    </Cluster>
  </CardFooter>
</Card>
```

Any section may be left out. A body alone has no hairline; all three have
two.

An interactive card is your link or button, by `asChild`:

```tsx
<Card asChild>
  <Link href={`/projects/${id}`}>
    <CardHeader><Heading level={3} size="sm">{name}</Heading></CardHeader>
    <CardBody><Text size="sm" tone="muted">{summary}</Text></CardBody>
  </Link>
</Card>
```

It lifts on hover, rings on focus, and its text is not underlined. A card
that is a link holds no other interactive content: nested interactive
elements are invalid HTML.

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `Card` | `<div>`, or its child with `asChild` | The surface |
| `CardHeader` | `<div>` | Put a `Heading` in it at the page's level |
| `CardBody` | `<div>` | No layout of its own; a `Stack` inside when it needs one |
| `CardFooter` | `<div>` | The foot, on the sunken surface |

No `tone` (a red card is an `Alert`), no `title` prop (the header is a
section), no `size`, no `variant`.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-card-bg` | `--pp-color-bg-raised` | The surface |
| `--pp-card-border-color` | `--pp-color-border-subtle` | The edge and the hairlines |
| `--pp-card-radius` | `--pp-radius-3` | Corners |
| `--pp-card-padding-inline` | `--pp-space-5` | Every section |
| `--pp-card-padding-block` | `--pp-space-4` | Every section |
| `--pp-card-shadow` | `none` | Set `var(--pp-shadow-1)` to lift a card |
| `--pp-card-footer-bg` | `--pp-color-bg-sunken` | The foot |

## Anatomy

```
<div class="pp-card">
  ├── <div class="pp-card__header">
  ├── <div class="pp-card__body">
  └── <div class="pp-card__footer">
```

## Don't

```tsx
// ✗ A tone. A red card is an Alert.
<Card tone="danger">…</Card>

// ✗ A title prop. The header is a section; put a Heading in it.
<Card title="Billing">…</Card>

// ✗ A link card with a button in it.
<Card asChild><a href="/x"><CardFooter><Button>Delete</Button></CardFooter></a></Card>

// ✗ A width. A card fills; put it in a Container or a Grid.
<Card style={{ width: 320 }} />
```
