import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import type { Size, Space } from '../../types';

/**
 * Constrains a measure, centres it, and keeps a gutter so content never touches
 * the edge of the screen.
 *
 * THE ONLY COMPONENT IN THE LIBRARY PERMITTED TO SET max-inline-size (RULES §1,
 * D-001). That is its entire job, and it is the reason the rule is liveable:
 * when you want to constrain something, you wrap it.
 *
 * Sizing contract: fill, up to the measure.
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-2-layout.md §2.4
 */

/** `sm` a reading measure, `md` an app page, `lg` a dashboard (D-022 §5). */
export type ContainerSize = Size;

export interface ContainerProps extends ComponentPropsWithoutRef<'div'> {
  size?: ContainerSize;
  /**
   * `padding-inline`, as a step of the space scale. Defaults to `'5'`, not
   * `'0'` like `gap` does: a zero gap is a legitimate design, and a zero page
   * gutter is text against the edge of a phone screen (D-022 §6).
   */
  gutter?: Space;
  /** Render the single child element instead of a `<div>` — usually a `<main>`. */
  asChild?: boolean;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { size = 'lg', gutter = '5', asChild = false, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'div';

  return (
    <Component
      ref={ref}
      className={cx('pp-container', className)}
      data-size={size}
      // Its own attribute rather than data-pp-gap: this is padding, not the
      // distance between children, and a Container is not a Stack.
      data-pp-gutter={gutter}
      {...props}
    />
  );
});
