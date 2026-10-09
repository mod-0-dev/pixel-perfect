# Tabs

One panel of several, chosen by its tab. Spec: [`Tabs.md`](../specs/Tabs.md).

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@mod-0-dev/pixel-perfect';
```

Behaviour is [Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)'s:
arrow keys move between tabs and select (or, with `activationMode="manual"`,
only move, and `Enter` selects), `Home` / `End` go to the ends, `Tab`
leaves the strip for the panel. Every node and pixel is ours.

**Not navigation.** A tab shows a panel; a link goes somewhere. A consumer
who wants the URL to follow the tab controls `value` and reads the route.

## Usage

```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="members">Members</TabsTrigger>
    <TabsTrigger value="billing" disabled>Billing</TabsTrigger>
  </TabsList>
  <TabsContent value="general"><GeneralSettings /></TabsContent>
  <TabsContent value="members" keepMounted><MembersForm /></TabsContent>
  <TabsContent value="billing">…</TabsContent>
</Tabs>
```

Controlled:

```tsx
const [value, setValue] = useState('general');
<Tabs value={value} onValueChange={setValue}>…</Tabs>
```

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `Tabs` | `<div>` | `value` / `defaultValue` / `onValueChange`; `orientation` (`horizontal`); `activationMode` (`automatic`) |
| `TabsList` | `<div role="tablist">`, inside a strip that scrolls | `loop` (`true`). `ref`, `className` and `style` land on the list |
| `TabsTrigger` | `<button role="tab">` | `value`, `disabled` |
| `TabsContent` | `<div role="tabpanel">` | `value`; `keepMounted` |

## Panels empty out, unless kept

An inactive panel is an empty, hidden element: its children are rendered
only while its tab is selected — right for a heavy panel, wrong for a
form, which would lose what was typed. `keepMounted` keeps that panel's
children rendered, hidden, while another tab is selected.

## The strip scrolls

A row of tabs wider than its container scrolls on the inline axis; it
never wraps. Focusing a tab scrolls it into view. The hairline runs under
every tab, including the ones past the edge.

## Vertical

`orientation="vertical"` lays the strip out as a column beside the panel,
with the hairline and the bar on its inline-end edge, and the arrows are
`ArrowUp` / `ArrowDown`.

## Right-to-left

Nothing to pass. The tabs read in the page's direction — the component
writes no `dir` of its own — and `ArrowLeft` moves to the next tab, which
is the one on the left. The direction is read when the component mounts;
one that changes afterwards is not tracked.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-tabs-gap` | `--pp-space-4` | Between the strip and the panel |
| `--pp-tabs-tab-height` | `--pp-control-height-md` | The tab |
| `--pp-tabs-tab-padding-inline` | `--pp-control-padding-inline-md` | The tab |
| `--pp-tabs-indicator-color` | `--pp-tone-solid` (accent) | The bar under the selected tab |
| `--pp-tabs-line-color` | `--pp-color-border-subtle` | The hairline |

One look: no `variant`, no `size`. A segmented, filled strip is a
`ButtonGroup` of `Toggle`s. A tab's label is muted until it is selected or
hovered; the selected tab's bar sits on the hairline, not above it.

## Accessibility

List: `role="tablist"`, `aria-orientation`. Tab: `role="tab"`,
`aria-selected`, `aria-controls`; only the selected tab is in the tab
sequence. Panel: `role="tabpanel"`, `aria-labelledby`, `tabindex="0"`. A
disabled tab is `disabled` and skipped by the arrows.

## Anatomy

```
<div class="pp-tabs" data-orientation>
  ├── <div class="pp-tabs__strip">
  │     └── <div class="pp-tabs__list" role="tablist" data-orientation>
  │           └── <button class="pp-tabs__tab" role="tab" aria-selected data-state="active|inactive">
  └── <div class="pp-tabs__panel" role="tabpanel" data-state hidden?>
```

## Don't

```tsx
// ✗ Tabs as navigation. A tab shows a panel; a link goes somewhere.
<TabsTrigger value="docs" onClick={() => router.push('/docs')}>Docs</TabsTrigger>

// ✗ A form in a panel that unmounts. keepMounted, or the form loses what was typed.
<TabsContent value="profile"><ProfileForm /></TabsContent>

// ✗ Wrapping the strip. Two rows of tabs have no order.
<TabsList style={{ flexWrap: 'wrap' }} />

// ✗ A tab without its panel. Every value appears in both.
<TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>
```
