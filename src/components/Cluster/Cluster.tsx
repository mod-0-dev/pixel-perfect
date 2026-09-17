import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import type { Align, Justify, Space } from '../../types';

/**
 * A horizontal row of things that wraps when it runs out of room.
 *
 * It is called Cluster and not Row because wrapping is the default: a
 * horizontal flex row that cannot wrap is an overflow bug waiting for a narrow
 * container, and under RULES §1 the component never knows how narrow that is.
 *
 * Sizing contract: fill. The row occupies its parent's inline space and wraps
 * within it.
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-2-layout.md §2.2
 */

export type ClusterAlign = Align;
export type ClusterJustify = Justify;

export interface ClusterProps extends ComponentPropsWithoutRef<'div'> {
  /** A step of the space scale: `gap="2"` is `--pp-space-2` (D-020). */
  gap?: Space;
  align?: ClusterAlign;
  justify?: ClusterJustify;
  /** `false` sets `flex-wrap: nowrap`. Only safe in a container you control. */
  wrap?: boolean;
  /** Render the single child element instead of a `<div>`. */
  asChild?: boolean;
}

export const Cluster = forwardRef<HTMLDivElement, ClusterProps>(function Cluster(
  { gap = '0', align = 'center', justify = 'start', wrap = true, asChild = false, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'div';

  return (
    <Component
      ref={ref}
      className={cx('pp-cluster', className)}
      // Never omitted, even at '0' — see src/components/_shared/layout.css.
      data-pp-gap={gap}
      data-align={align}
      data-justify={justify}
      // Only the off state is exposed: wrapping is the default and an attribute
      // that is always present carries no information.
      data-wrap={wrap ? undefined : 'false'}
      {...props}
    />
  );
});
