# PageHeader

The top of a page: where you are, what the page is, one line about it,
and the actions that act on the whole page. Spec:
[`PageHeader.md`](../specs/PageHeader.md).

```tsx
import { PageHeader, PageHeaderTitle, PageHeaderDescription, PageHeaderActions } from '@mod-0-dev/pixel-perfect';
```

Four parts, plus your [`Breadcrumb`](Breadcrumb.md) as the first child.
One flex row that wraps: the breadcrumb and the description take a row
each, the title grows, and the actions sit at the end of the title's row
until the row cannot hold both, then drop under it. A part you leave out
is a row that is not there.

**Write the description before the actions.** That is the reading order
a screen reader gets; the stylesheet paints the actions on the title's
row and the description under both.

## Usage

```tsx
<Container size="lg">
  <Stack gap="6">
    <PageHeader>
      <Breadcrumb>
        <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbItem><BreadcrumbPage>Releases</BreadcrumbPage></BreadcrumbItem>
      </Breadcrumb>
      <PageHeaderTitle>Releases <Badge tone="accent">12</Badge></PageHeaderTitle>
      <PageHeaderDescription>Everything shipped this quarter, newest first.</PageHeaderDescription>
      <PageHeaderActions>
        <Button variant="outline">Export</Button>
        <Button tone="accent">New release</Button>
      </PageHeaderActions>
    </PageHeader>
    …
  </Stack>
</Container>
```

## Parts

| Part | Base | Defaults | Notes |
| --- | --- | --- | --- |
| `PageHeader` | `<header>` | | Inside `<main>`, so no landmark role |
| `PageHeaderTitle` | [`Heading`](Heading.md) | `level={1}` | The page's `<h1>`; `size` from the level unless set |
| `PageHeaderDescription` | [`Text`](Text.md) | `tone="muted"` | Its own row |
| `PageHeaderActions` | [`Cluster`](Cluster.md) | `gap="2"` | Beside the title, or below it |

Every part forwards `ref`, merges `className` and `style`, and spreads
the rest.

## Styling

| Custom property | Default | Affects |
| --- | --- | --- |
| `--pp-page-header-row-gap` | `--pp-space-2` | Between rows |
| `--pp-page-header-column-gap` | `--pp-space-4` | Between the title and the actions |
| `--pp-page-header-title-basis` | `--pp-measure-xs` | How much title a row must hold before the actions drop |

## Don't

```tsx
// ✗ A title as a string. The title is a part, so it can hold a Badge.
<PageHeader title="Releases" />

// ✗ One per section. A page has one; a section has a Heading.
<PageHeader><PageHeaderTitle level={2}>Details</PageHeaderTitle></PageHeader>

// ✗ Actions that act on one row. Those go in the row.
<PageHeaderActions><Button>Delete this release</Button></PageHeaderActions>

// ✗ The app's header. That is AppShell's `header` slot.
```
