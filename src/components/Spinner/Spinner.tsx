import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import type { Size, Tone } from '../../types';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';

/**
 * An indeterminate busy indicator. Determinate progress is Progress (5.3).
 *
 * Sizing contract: hug. A fixed square per `size`, on the icon scale.
 * RSC: server. The animation is CSS; nothing here runs in the browser.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.6
 */

type SpinnerBase = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'role' | 'aria-hidden'> & {
  size?: Size;
  tone?: Tone;
};

/**
 * Same discriminated union as Icon: a spinner alone on a page needs a
 * `label`; one inside a control that already says "Saving…" is `decorative`.
 */
export type SpinnerProps = SpinnerBase &
  ({ label: string; decorative?: never } | { decorative: true; label?: never });

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', tone = 'neutral', className, ...rest },
  ref,
) {
  const { label, decorative, ...props } = rest as { label?: string; decorative?: true } & Omit<
    SpinnerBase,
    'size' | 'tone' | 'className'
  >;
  void decorative;

  return (
    <span
      ref={ref}
      className={cx('pp-spinner', className)}
      data-size={size}
      data-pp-tone={tone}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      <svg className="pp-spinner__track" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="pp-spinner__ring" cx="12" cy="12" r="10" />
        <circle className="pp-spinner__arc" cx="12" cy="12" r="10" />
      </svg>
      {label ? <VisuallyHidden>{label}</VisuallyHidden> : null}
    </span>
  );
});
