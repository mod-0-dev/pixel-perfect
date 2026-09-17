import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import type { Size, Tone } from '../../types';

/**
 * Inline code — an identifier, a path, a flag. Block code is CodeBlock (5.12).
 *
 * Sizing contract: hug. Inline content sized by its text; it sits inside a
 * sentence and wraps with it.
 * RSC: server.
 *
 * Spec: docs/specs/tier-1-atoms.md §1.11
 */
export interface CodeProps extends ComponentPropsWithoutRef<'code'> {
  /**
   * Unset by default: the code is 0.9em of the text around it, so it scales
   * with a sentence or a heading. A fixed step is for standalone use.
   */
  size?: Size;
  tone?: Tone;
}

export const Code = forwardRef<HTMLElement, CodeProps>(function Code({ size, tone = 'neutral', className, ...props }, ref) {
  return <code ref={ref} className={cx('pp-code', className)} data-size={size} data-pp-tone={tone} {...props} />;
});
