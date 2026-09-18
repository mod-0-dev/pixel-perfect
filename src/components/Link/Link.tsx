import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import type { Tone } from '../../types';

/**
 * Navigation. An <a> with the library's tone, underline and focus treatment,
 * or a delegate around next/link via `asChild`.
 *
 * Sizing contract: hug. Inline text, sized by its content — and it declares no
 * `display` at all, so it flows and wraps like the text around it.
 * RSC: server. No hooks, no handlers of its own.
 *
 * Spec: docs/specs/tier-3a-action.md §3.3
 */

/**
 * `always` is the default because colour alone fails WCAG 1.4.1 (Use of
 * Color): a link inside a paragraph that differs from its surroundings only in
 * hue is not a link for a substantial number of readers. `hover` is the
 * deliberate opt-out for navigation lists and card titles, where position and
 * context already say "link".
 */
export type LinkUnderline = 'always' | 'hover' | 'none';

export interface LinkProps extends ComponentPropsWithoutRef<'a'> {
  /** `accent` — the one place in the library where accent is the sane default. */
  tone?: Tone;
  underline?: LinkUnderline;
  /** Render the single child element instead of an `<a>`. For `next/link`. */
  asChild?: boolean;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { tone = 'accent', underline = 'always', asChild = false, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'a';

  return (
    <Component
      ref={ref}
      className={cx('pp-link', className)}
      data-pp-tone={tone}
      data-underline={underline}
      {...props}
    />
  );
});
