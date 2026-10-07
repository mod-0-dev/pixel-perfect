# Accordion

A vertical stack of sections, each with a heading that shows or hides its
content. Spec: [`Accordion.md`](../specs/Accordion.md).

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@mod-0-dev/pixel-perfect';
```

Behaviour is [Radix Accordion](https://www.radix-ui.com/primitives/docs/components/accordion)'s:
`Enter` / `Space` toggle a section, `ArrowUp` / `ArrowDown` move between
headings, `Home` / `End` go to the ends. Every node and pixel is ours.

**Not a lone disclosure, not a tree.** A single "show more" is a `Button`
and a state; an accordion of accordions is a `Tree`.

## Usage

```tsx
<Accordion defaultValue="shipping">
  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent><Text>Orders ship within two days.</Text></AccordionContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent><Text>Thirty days, no questions.</Text></AccordionContent>
  </AccordionItem>
</Accordion>
```

Any number open:

```tsx
<Accordion multiple defaultValue={['shipping', 'returns']}>…</Accordion>
```

Controlled — a `string` for one, a `string[]` with `multiple`:

```tsx
const [open, setOpen] = useState('');
<Accordion value={open} onValueChange={setOpen}>…</Accordion>
```

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `Accordion` | `<div>` | `multiple`; `value` / `defaultValue` / `onValueChange`; `collapsible` (`true`, single only); `disabled`; `headingLevel` (`3`) |
| `AccordionItem` | `<div>` | `value`, `disabled` |
| `AccordionTrigger` | `<button>` inside an `<h2>`–`<h6>` | `ref`, `className` and `style` land on the button |
| `AccordionContent` | `<div role="region">` | `keepMounted`; the children sit in a padded body inside |

## One at a time, or many

By default one section is open at a time and pressing the open heading
closes it. `collapsible={false}` keeps one open always — the strict
reading of the pattern — and marks the open heading `aria-disabled`.
`multiple` lets any number open; the value is then an array.

## Headings

Every trigger is a button inside a heading, as the pattern requires. The
level is one question, asked once: `headingLevel` on the root, `2` to
`6`, default `3` — an accordion under a page's `h2` is `h3` far more often
than not.

## Panels empty out, unless kept

A closed panel is an empty, hidden element: its children render only
while it is open. `keepMounted` keeps them rendered, hidden — for a form
that must not lose what was typed. A kept panel does not animate closed.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-accordion-line-color` | `--pp-color-border-subtle` | The hairlines above the first item and below each |
| `--pp-accordion-trigger-height` | `--pp-control-height-lg` | The heading row's minimum |
| `--pp-accordion-trigger-padding-block` | `--pp-space-3` | Above and below a label |
| `--pp-accordion-body-padding` | `--pp-space-4` | Below the content |

One look: no `variant`, no `size`. The content opens and closes as a
height over the normal duration; `prefers-reduced-motion` makes it
instant and stops the chevron turning.

## Accessibility

Trigger: a `<button>` in a heading, `aria-expanded`, and `aria-controls`
while open.
Content: `role="region"`, `aria-labelledby` the trigger. A disabled item
disables its button; `disabled` on the root disables them all.

## Anatomy

```
<div class="pp-accordion">
  └── <div class="pp-accordion__item" data-state="open|closed">
        ├── <h3 class="pp-accordion__header">
        │     └── <button class="pp-accordion__trigger" aria-expanded aria-controls>
        │           └── … <svg class="pp-accordion__chevron">
        └── <div class="pp-accordion__content" role="region" aria-labelledby hidden?>
              └── <div class="pp-accordion__body">
```

## Don't

```tsx
// ✗ A form in a panel that unmounts. keepMounted.
<AccordionContent><ProfileForm /></AccordionContent>

// ✗ A heading level on the item. It is the root's, once.
<AccordionTrigger level={2}>…</AccordionTrigger>

// ✗ An accordion of accordions. That is a Tree.
<AccordionContent><Accordion>…</Accordion></AccordionContent>

// ✗ Radix's type. multiple is a boolean.
<Accordion type="multiple">…</Accordion>
```
