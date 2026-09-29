import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import { Icon } from '../Icon/Icon';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';

/**
 * Where a multi-step process stands: the steps in order, the ones done, the
 * one now, the ones to come, and a line joining them. A status display, not
 * a control: it holds no state and moves nothing.
 *
 * THE NUMBER IS A COUNTER AND "DONE" IS A CHECK (spec §1): an <ol> already
 * tells a screen reader "2 of 4", so the visible number is CSS and the
 * indicator is aria-hidden; a completed step says "Completed" in hidden text
 * instead.
 *
 * HORIZONTAL BY DEFAULT, VERTICAL BELOW 28REM BY ITS CONTAINER (spec §2):
 * the <nav> is the container and the <ol> is what the query switches.
 *
 * Sizing contract: fill. RSC: server. Spec: docs/specs/Stepper.md
 */

export type StepStatus = 'complete' | 'current' | 'upcoming';
export type StepperOrientation = 'horizontal' | 'vertical';

export interface StepperProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'aria-label'> {
  orientation?: StepperOrientation;
  /** The landmark's name. */
  label?: string;
}

export const Stepper = forwardRef<HTMLElement, StepperProps>(function Stepper(
  { orientation = 'horizontal', label = 'Progress', className, children, ...props },
  ref,
) {
  return (
    <nav
      ref={ref}
      aria-label={label}
      className={cx('pp-stepper', className)}
      data-orientation={orientation}
      data-pp-tone="accent"
      {...props}
    >
      <ol className="pp-stepper__list">{children}</ol>
    </nav>
  );
});

export interface StepProps extends ComponentPropsWithoutRef<'li'> {
  status?: StepStatus;
  /** A line under the label. */
  description?: ReactNode;
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export const Step = forwardRef<HTMLLIElement, StepProps>(function Step(
  { status = 'upcoming', description, className, children, ...props },
  ref,
) {
  return (
    <li
      ref={ref}
      className={cx('pp-stepper__step', className)}
      data-state={status}
      {...(status === 'current' ? { 'aria-current': 'step' as const } : {})}
      {...props}
    >
      <span className="pp-stepper__indicator" aria-hidden="true">
        {status === 'complete' ? (
          <Icon decorative size="sm">
            <Check />
          </Icon>
        ) : null}
      </span>
      <span className="pp-stepper__body">
        <span className="pp-stepper__label">
          {children}
          {status === 'complete' ? <VisuallyHidden> Completed</VisuallyHidden> : null}
        </span>
        {description !== undefined && description !== null ? <span className="pp-stepper__description">{description}</span> : null}
      </span>
    </li>
  );
});
