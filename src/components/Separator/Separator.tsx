import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';

/**
 * A rule between two groups of content, in either orientation.
 *
 * Sizing contract: fill. Spans its parent along its axis; its thickness is a
 * single logical border, so it declares no width in either orientation.
 * RSC: server.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.5
 */

export type SeparatorOrientation = 'horizontal' | 'vertical';

export interface SeparatorProps
  extends Omit<ComponentPropsWithoutRef<'hr'>, 'role' | 'aria-orientation' | 'aria-hidden'> {
  orientation?: SeparatorOrientation;
  /**
   * `true` (the default) hides the rule from assistive technology — most
   * rules are visual grouping the heading structure already conveys.
   * `false` exposes it as a separator.
   */
  decorative?: boolean;
}

export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(function Separator(
  { orientation = 'horizontal', decorative = true, className, ...props },
  ref,
) {
  return (
    <hr
      ref={ref}
      className={cx('pp-separator', className)}
      data-orientation={orientation}
      aria-hidden={decorative ? true : undefined}
      aria-orientation={!decorative && orientation === 'vertical' ? 'vertical' : undefined}
      {...props}
    />
  );
});
