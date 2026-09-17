import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import type { Space } from '../../types';

/**
 * Centres its children in the box it was given, on either axis or both.
 *
 * It does NOT constrain a measure. Centring a column of text by giving it a
 * max-width is Container's job (2.4), and conflating the two is why "Center"
 * means three different things across the ecosystem.
 *
 * Sizing contract: fill — it centres WITHIN the space it is given, so it must
 * take all of it.
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-2-layout.md §2.5
 */

export type CenterAxis = 'inline' | 'block' | 'both';

export interface CenterProps extends ComponentPropsWithoutRef<'div'> {
  axis?: CenterAxis;
  /** Children stack vertically, so this is the gap between them. */
  gap?: Space;
  /** Render the single child element instead of a `<div>`. */
  asChild?: boolean;
}

export const Center = forwardRef<HTMLDivElement, CenterProps>(function Center(
  { axis = 'both', gap = '0', asChild = false, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'div';

  return (
    <Component
      ref={ref}
      className={cx('pp-center', className)}
      data-axis={axis}
      // Never omitted, even at '0' — see src/components/_shared/layout.css.
      data-pp-gap={gap}
      {...props}
    />
  );
});
