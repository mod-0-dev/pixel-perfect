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

/** Which edge has content BEYOND it. Logical: `start` is left in LTR, right in RTL. */
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

export const Scroller = forwardRef<HTMLDivElement, ScrollerProps>(function Scroller(
  { label, orientation = 'vertical', className, ...props },
  ref,
) {
  const portRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<ScrollerOverflow>('none');

  const measure = useCallback(() => {
    const el = portRef.current;
    if (!el) return;
    // scrollLeft is negative in RTL, which is why overflowState takes the
    // absolute value rather than the raw number.
    setOverflow(
      orientation === 'horizontal'
        ? overflowState(el.scrollLeft, el.scrollWidth, el.clientWidth)
        : overflowState(el.scrollTop, el.scrollHeight, el.clientHeight),
    );
  }, [orientation]);

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
      data-overflow={overflow}
      {...props}
    />
  );
});
