import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import type { Size, Tone, Variant } from '../../types';

/**
 * A small, non-interactive label for status or category. The canonical `hug`
 * component: sized by its content, and it will not stretch.
 *
 * Sizing contract: hug. inline-flex; no width declaration.
 * RSC: server.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.8
 */
export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  /** `ghost` by default: a page of solid badges has no hierarchy left. */
  variant?: Variant;
  tone?: Tone;
  size?: Size;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'ghost', tone = 'neutral', size = 'md', className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx('pp-badge', className)}
      data-variant={variant}
      data-pp-tone={tone}
      data-size={size}
      {...props}
    />
  );
});
