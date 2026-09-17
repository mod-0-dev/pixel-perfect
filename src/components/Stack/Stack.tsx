import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import type { Align, Space } from '../../types';

/**
 * Vertical flow with a gap.
 *
 * This is the answer to "how do I put space between two components", and it is
 * the only answer — which is what lets RULES §2 forbid margins at all.
 *
 * Sizing contract: fill. A column occupies the inline space it is given.
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-2-layout.md §2.1
 */

/** Cross axis only. Distributing along the block axis needs a block size a `fill` component does not have (D-022 §9). */
export type StackAlign = Align;

export interface StackProps extends ComponentPropsWithoutRef<'div'> {
  /** A step of the space scale: `gap="4"` is `--pp-space-4` (D-020). */
  gap?: Space;
  align?: StackAlign;
  /** Render the single child element instead of a `<div>`. */
  asChild?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { gap = '0', align = 'stretch', asChild = false, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'div';

  return (
    <Component
      ref={ref}
      className={cx('pp-stack', className)}
      // Never omitted, even at '0'. The shared scale in _shared/layout.css sets
      // an inheriting custom property, so a Stack without this attribute would
      // pick up its parent's gap. See the comment in that file.
      data-pp-gap={gap}
      data-align={align}
      {...props}
    />
  );
});
