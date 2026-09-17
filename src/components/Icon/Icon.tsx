import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import type { Size } from '../../types';

/**
 * Gives any SVG consistent sizing, colour and accessible-name handling. Ships
 * no icons of its own.
 *
 * Sizing contract: hug. inline-flex, 1em by default, a fixed step by `size`.
 * RSC: server. No hooks, no browser APIs.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.3
 */

export type IconSize = Size | 'inherit';

type IconBase = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'role' | 'aria-label' | 'aria-hidden'> & {
  /** `inherit` is `1em`, so the icon matches the text beside it. */
  size?: IconSize;
  /** The SVG. */
  children: ReactNode;
};

/**
 * Exactly one of `label` or `decorative`, enforced by the type. Omitting both
 * — an icon with no name and no declaration that it needs none — is the bug
 * RULES §6 says the type system must make impossible.
 */
export type IconProps = IconBase &
  ({ label: string; decorative?: never } | { decorative: true; label?: never });

export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
  { size = 'inherit', className, children, ...rest },
  ref,
) {
  // The discriminant is on `rest`; pulling it apart here keeps the JSX below
  // free of union gymnastics.
  const { label, decorative, ...props } = rest as { label?: string; decorative?: true } & Omit<
    IconBase,
    'size' | 'className' | 'children'
  >;
  void decorative;

  return (
    <span
      ref={ref}
      className={cx('pp-icon', className)}
      data-size={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {children}
    </span>
  );
});
