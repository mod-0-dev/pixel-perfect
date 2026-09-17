import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import type { Size } from '../../types';

/**
 * A rendered keyboard key. A chord is composed — `<Kbd>⌘</Kbd><Kbd>K</Kbd>`
 * in a Cluster — never configured.
 *
 * Sizing contract: hug.
 * RSC: server.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.10
 */
export interface KbdProps extends ComponentPropsWithoutRef<'kbd'> {
  size?: Size;
}

export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd({ size = 'md', className, ...props }, ref) {
  return <kbd ref={ref} className={cx('pp-kbd', className)} data-size={size} {...props} />;
});
