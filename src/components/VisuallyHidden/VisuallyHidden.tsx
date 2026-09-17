import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';

/**
 * Content available to assistive technology and hidden from sight.
 *
 * Sizing contract: n/a — it renders no visual box.
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.4
 */
export interface VisuallyHiddenProps extends ComponentPropsWithoutRef<'span'> {
  /** Render the single child element instead of a `<span>`. */
  asChild?: boolean;
}

export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(function VisuallyHidden(
  { asChild = false, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'span';
  return <Component ref={ref} className={cx('pp-visually-hidden', className)} {...props} />;
});
