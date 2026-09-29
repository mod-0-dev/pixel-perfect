---
'pixel-perfect': minor
---

Add `Accordion` (4.10): a vertical stack of sections, each with a heading
that shows or hides its content, on `@radix-ui/react-accordion`.
`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
`multiple` is a boolean (not Radix's `type`) with `string` or `string[]`
values to match; `collapsible` defaults to `true`; `headingLevel` on the
root sets every heading once; `keepMounted` on a panel keeps its children
rendered, hidden. One look: headings on hairlines, a chevron that turns,
a height that animates and is instant under reduced motion.
