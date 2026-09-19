'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';

import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/refs';

/**
 * An overflow container that says, visually and in the DOM, that there is more
 * content past the edge. The affordance is the entire point: an overflowing
 * region with no shadow and no scrollbar is content users never find.
 *
 * Sizing contract: fill.
 * RSC: CLIENT, and the only one in Tier 2. Scroll position is a browser fact;
 * there is no server-side answer to "is this overflowing".
 *
 * Spec: docs/specs/tier-2-layout.md §2.8
 */

export type ScrollerOrientation = 'vertical' | 'horizontal' | 'both';

/**
 * Which edge of an axis has content BEYOND it. Logical: on the inline axis
 * `start` is left in LTR and right in RTL; on the block axis it is the top.
 */
export type ScrollerOverflow = 'none' | 'start' | 'end' | 'both';

export interface ScrollerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'role'> {
  /**
   * **Required.** A scrollable region a keyboard user can reach is WCAG 2.1.1;
   * a focusable region with no accessible name is a 4.1.2 failure. RULES §6
   * says the type system should make that impossible, so there is no
   * unlabelled form (D-022 §7).
   */
  label: string;
  orientation?: ScrollerOrientation;
}

/**
 * Reads the scroll position and reports which edge has content beyond it.
 *
 * Exported for testing, and because the arithmetic is the only interesting part
 * of this component. `Math.ceil` on the end comparison: a fractional scroll
 * position at the very end leaves sub-pixel slack that reads as "still more to
 * scroll" forever, which shows a shadow on a fully scrolled region.
 */
export function overflowState(
  scrollStart: number,
  scrollLength: number,
  clientLength: number,
): ScrollerOverflow {
  const atStart = Math.abs(scrollStart) <= 1;
  const atEnd = Math.ceil(Math.abs(scrollStart) + clientLength) >= scrollLength - 1;
  if (scrollLength <= clientLength + 1) return 'none';
  if (atStart) return 'end';
  if (atEnd) return 'start';
  return 'both';
}

/** Both axes, measured together. Which of them the DOM reports depends on `orientation`. */
interface Overflow {
  block: ScrollerOverflow;
  inline: ScrollerOverflow;
}

const NONE: Overflow = { block: 'none', inline: 'none' };

export const Scroller = forwardRef<HTMLDivElement, ScrollerProps>(function Scroller(
  { label, orientation = 'vertical', className, ...props },
  ref,
) {
  const portRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<Overflow>(NONE);

  const measure = useCallback(() => {
    const el = portRef.current;
    if (!el) return;
    // Both axes, always. Measuring only the orientation's axis is how `both`
    // shipped shading the block axis alone (D-046); the second read costs
    // nothing and the attributes below decide what is reported.
    // scrollLeft is negative in RTL, which is why overflowState takes the
    // absolute value rather than the raw number.
    const next: Overflow = {
      block: overflowState(el.scrollTop, el.scrollHeight, el.clientHeight),
      inline: overflowState(el.scrollLeft, el.scrollWidth, el.clientWidth),
    };
    // Same object when nothing changed, so a scroll event that moves nothing
    // across an edge does not re-render.
    setOverflow((prev) => (prev.block === next.block && prev.inline === next.inline ? prev : next));
  }, []);

  useEffect(() => {
    const el = portRef.current;
    if (!el) return;

    measure();
    el.addEventListener('scroll', measure, { passive: true });

    // Both the port AND its content: the port can stay the same size while the
    // content grows, and a shadow that only updates on resize is a shadow that
    // is wrong every time data arrives.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);

    return () => {
      el.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [measure]);

  return (
    <div
      ref={mergeRefs(ref, portRef)}
      className={cx('pp-scroller', className)}
      role="region"
      aria-label={label}
      // Unconditional. A region containing focusable children arguably does not
      // need its own stop, but deciding that at runtime means inspecting
      // children on every render — and the extra stop is harmless where the
      // shadow is correct and essential where it is not. Chrome >= 127 does
      // this natively for scrollers; this makes it true everywhere.
      tabIndex={0}
      data-orientation={orientation}
      // The orientation's own axis: block for `vertical`, inline for
      // `horizontal`. For `both` it is the block axis — the default
      // orientation's — and the inline axis gets its own attribute beside it,
      // because one attribute cannot name the edges of two axes (D-046).
      data-overflow={orientation === 'horizontal' ? overflow.inline : overflow.block}
      data-overflow-inline={orientation === 'both' ? overflow.inline : undefined}
      {...props}
    />
  );
});
