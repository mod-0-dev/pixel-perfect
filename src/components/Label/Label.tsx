import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import type { Size } from '../../types';

/**
 * The visible name of a form control, associated with it by `htmlFor`.
 *
 * Sizing contract: fill. Block-level, no width declaration, min-inline-size: 0.
 * RSC: server. No hooks, no handlers, no browser APIs — and it must stay that
 * way. IDs come from `useId()` in Field (3.7); a Label that generates its own
 * id is a Label doing Field's job, and it would have to become a client
 * component to do it.
 *
 * NO `asChild`, unlike every other single-element component in Tier 3. The
 * <label> element IS this component: click-to-focus, the `for` association and
 * the accessible-name computation are properties of that element and of no
 * other. `asChild` here would be a prop whose only effect is to silently delete
 * the reason the component exists (spec §7).
 *
 * Spec: docs/specs/Label.md
 */
export interface LabelProps extends Omit<ComponentPropsWithoutRef<'label'>, 'children'> {
  /** Required by the type: a label with no content names nothing. */
  children: ReactNode;
  /**
   * Rides the CONTROL scale, not Text's — a label must agree with the input
   * beneath it, not with the prose around it (D-034). `sm` and `md` are
   * deliberately the same font size; a small field gets small by losing height
   * and padding.
   */
  size?: Size;
  /**
   * Renders the indicator and sets `data-required`. PRESENTATIONAL ONLY —
   * Label has no control to mark. `Field` sets this and the control's own
   * `required` from one prop; a standalone caller must set both.
   */
  required?: boolean;
  /** Visual only. A <label> has no disabled attribute and no ARIA one worth setting. */
  disabled?: boolean;
  /** Sets `data-invalid`. Ships no visual change on purpose — see Label.css. */
  invalid?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { children, size = 'md', required = false, disabled = false, invalid = false, className, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cx('pp-label', className)}
      data-size={size}
      data-required={required || undefined}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      {...props}
    >
      {children}
      {/*
       * aria-hidden, and no whitespace before it. Both are deliberate.
       *
       * aria-hidden: the control carries `required` / `aria-required`, so a
       * screen reader already announces the state. A visible "(required)" in
       * the accessible name makes it announce twice, and an unhidden asterisk
       * makes it announce "Email address star".
       *
       * No whitespace text node: the gap is padding on the span (D-018 bans
       * non-zero margin, and padding is the compliant way to say this). A
       * space character here would also be a break opportunity, which is how a
       * wrapping label orphans its asterisk onto a line of its own.
       */}
      {required ? (
        <span className="pp-label__required" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
});
