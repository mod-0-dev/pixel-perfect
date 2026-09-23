'use client';

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type SubmitEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { cx } from '../../internal/cx';
import { Alert } from '../Alert/Alert';
import { Link } from '../Link/Link';
import type { Space } from '../../types';

/**
 * A `<form>` that summarises the errors the app already found, and refuses a
 * second submission while the first is pending.
 *
 * Sizing contract: fill. Flex column with a gap, no width declaration.
 * RSC: client — a submit handler, a ref, and the effect that moves focus.
 *
 * IT DOES NOT VALIDATE AND IT HOLDS NO VALUES. The app decides what is wrong
 * and passes it back as `errors`; the controls are ordinary inputs that
 * `FormData` reads the way it always has.
 *
 * THE SUMMARY LINKS TO IDS THE CALLER ALREADY CONTROLS (spec §3). `Field`'s
 * `controlId` exists for exactly this, so `Field` is not changed and nothing
 * registers with anything. The cost is that each message is passed twice —
 * once to the Field, once here — and that is the trade the spec made.
 *
 * Spec: docs/specs/Form.md
 */

export interface FormError {
  /** The id of the element the link moves focus to — a `Field`'s `controlId`, or a group `Field`'s own `id`. */
  target: string;
  /** The link text. Usually the same message the Field shows. */
  message: ReactNode;
}

/** One array for every form with nothing wrong, so an absent prop is not a new identity each render. */
const NO_ERRORS: readonly FormError[] = [];

/**
 * What can take focus when the link's target itself cannot.
 *
 * A group Field's root is a `<div>`, so the handler looks inside it. A checked
 * radio first, because that is where the APG radio group pattern puts focus on
 * entry; otherwise the first enabled control.
 */
const FOCUSABLE =
  'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';

function focusableFor(el: HTMLElement): HTMLElement | null {
  if (el.matches(FOCUSABLE)) return el;
  return (
    el.querySelector<HTMLElement>('input[type="radio"]:checked:not(:disabled)') ??
    el.querySelector<HTMLElement>(FOCUSABLE)
  );
}

export interface FormProps extends ComponentPropsWithoutRef<'form'> {
  /** Non-empty renders the summary. Order is display order (spec §3). */
  errors?: readonly FormError[];
  /** The summary's title. A `ReactNode`, so a `Heading` can supply heading semantics. */
  errorTitle?: ReactNode;
  /** Cancels any submit while set. Disables nothing (spec §6). */
  pending?: boolean;
  /** A step of the space scale between the form's children (D-020). */
  gap?: Space;
  /**
   * Defaults to `true`, the one place this component disagrees with `<form>`:
   * native validation cancels the submit event on an empty required field, so
   * the app never validates and the summary never appears (spec §7).
   */
  noValidate?: boolean;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(function Form(
  {
    errors = NO_ERRORS,
    errorTitle = 'There is a problem',
    pending = false,
    gap = '5',
    noValidate = true,
    className,
    onSubmit,
    children,
    ...props
  },
  ref,
) {
  const summaryRef = useRef<HTMLDivElement>(null);

  /*
   * "A submit is waiting for its result." A ref, not state: nothing renders
   * differently because of it, and it must never cost a render.
   *
   * Focus moves to the summary only while this is set (or on mount), which is
   * what keeps live validation on blur from yanking focus out of the field
   * being typed in — spec §5, second row, and the case that fails silently.
   */
  const awaiting = useRef(false);
  const mounted = useRef(false);

  /* The latest `pending`, readable from a timer. Synced in a layout effect so
     it is current before anything the browser schedules after the commit. */
  const pendingRef = useRef(pending);
  useLayoutEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const hasErrors = errors.length > 0;

  useEffect(() => {
    const isMount = !mounted.current;
    mounted.current = true;
    if (!hasErrors) return;
    /* Mount with errors is a round trip: a no-JS submission, or a server
       action's full-page response. The submit happened on the page before. */
    if (isMount || awaiting.current) {
      awaiting.current = false;
      summaryRef.current?.focus();
    }
    // Keyed on the array's identity: a resubmission that fails again hands
    // back a new array, and focus should return to the summary.
  }, [errors, hasErrors]);

  /* A request that finished with nothing wrong. Success is the app's to
     announce; this only stops a later, unrelated error from being treated as
     that request's answer. */
  useEffect(() => {
    if (!pending && !hasErrors) awaiting.current = false;
  }, [pending, hasErrors]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    if (pending) {
      /*
       * One request, however many times Enter is pressed. React does not
       * dispatch a form `action` for a submit whose default was prevented, so
       * this blocks a second action exactly as it blocks a second onSubmit.
       */
      event.preventDefault();
      return;
    }
    awaiting.current = true;
    onSubmit?.(event);
    /*
     * A synchronous submit that succeeded changes nothing — errors stay empty,
     * pending is never set — so neither effect above would clear the flag, and
     * the next blur-validation error would steal focus as if it were this
     * submit's result. After React has flushed whatever the handler scheduled
     * (a task, not a microtask, so it runs after React's own flush), a submit
     * that is neither pending nor answered with errors is over.
     */
    setTimeout(() => {
      if (!pendingRef.current) awaiting.current = false;
    }, 0);
  };

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, target: string) => {
    const el = document.getElementById(target);
    /* A dead link is left to the browser, which is at least honest about it. */
    if (!el) return;
    event.preventDefault();
    /*
     * Fragment navigation scrolls but does not reliably focus, and it puts the
     * CONTROL at the top of the viewport with its label above the fold. So:
     * focus without scrolling, then scroll the whole field into view.
     */
    focusableFor(el)?.focus({ preventScroll: true });
    (el.closest<HTMLElement>('.pp-field') ?? el).scrollIntoView({ block: 'start' });
  };

  return (
    <form
      ref={ref}
      className={cx('pp-form', className)}
      // Never omitted (D-020): a Stack inside must not inherit the form's gap.
      data-pp-gap={gap}
      data-pending={pending || undefined}
      noValidate={noValidate}
      onSubmit={handleSubmit}
      {...props}
    >
      {hasErrors && (
        /*
         * `live="off"`, because focus moving here is what announces it. A live
         * region AND a focus move reads it twice (spec §2).
         *
         * `tabIndex={-1}`: focusable by script, never a tab stop.
         */
        <Alert
          ref={summaryRef}
          className="pp-form__summary"
          tone="danger"
          title={errorTitle}
          tabIndex={-1}
        >
          <ul className="pp-form__errors">
            {errors.map((error, index) => (
              // Index too: two messages may point at one field.
              <li key={`${index}:${error.target}`}>
                {/*
                 * `tone="danger"` is not decoration. Link sets its own tone and
                 * defaults to accent, which would put accent's text on danger's
                 * step 3 — a pairing nothing asserts. Danger on danger is
                 * Alert's own body pairing, which is asserted (spec §2).
                 */}
                <Link
                  className="pp-form__error-link"
                  tone="danger"
                  href={`#${error.target}`}
                  onClick={(event) => handleLinkClick(event, error.target)}
                >
                  {error.message}
                </Link>
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {children}
    </form>
  );
});
