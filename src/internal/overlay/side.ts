/**
 * The logical side vocabulary of Tier 4, and its resolution to the physical
 * sides the positioning library speaks in (overlay-foundation.md §5).
 *
 * `side="start"` on a popover is on the left of its trigger in a
 * left-to-right layout and on the right in a right-to-left one, which is
 * what RULES §1's "RTL should work without a single extra line" requires of a
 * consumer prop. floating-ui already treats `align: start | end` logically;
 * only the side axis needs this.
 *
 * `top` and `bottom` are kept physical on purpose: no target has a vertical
 * writing-mode use for a popover, and `block-start` buys nothing a user can
 * perceive.
 *
 * Internal. Not exported from the package.
 */

export type LogicalSide = 'top' | 'bottom' | 'start' | 'end';
export type PhysicalSide = 'top' | 'bottom' | 'left' | 'right';
export type Direction = 'ltr' | 'rtl';

/**
 * The direction that applies to an element, read from its computed style at
 * the moment it is needed — never at module scope (RULES §7). `null` (no
 * element yet, or no layout as in jsdom) is left-to-right, the document's own
 * default.
 */
export function directionOf(element: Element | null | undefined): Direction {
  if (!element) return 'ltr';
  const view = element.ownerDocument.defaultView;
  if (!view) return 'ltr';
  return view.getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
}

/** `start` and `end` become `left` and `right` for the given direction; the block sides pass through. */
export function resolveSide(side: LogicalSide, direction: Direction): PhysicalSide {
  switch (side) {
    case 'start':
      return direction === 'rtl' ? 'right' : 'left';
    case 'end':
      return direction === 'rtl' ? 'left' : 'right';
    default:
      return side;
  }
}
