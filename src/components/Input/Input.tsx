'use client';

import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { cx } from '../../internal/cx';
import { useField } from '../Field/Field';
import type { Size } from '../../types';

/**
 * A single-line text control on the shared control surface, wired to whatever
 * Field is above it.
 *
 * Sizing contract: fill. RSC: client — useField() is a context read.
 *
 * IT IS TWO ELEMENTS, AND THAT IS A FINDING RATHER THAN A PREFERENCE.
 * RULES §1 says a block element with no width declaration already fills its
 * parent "in every layout context". That is false for <input>: it has an
 * intrinsic inline size from the HTML `size` attribute (default 20 characters),
 * so `display: block` leaves it 185px wide inside a 600px parent. Measured, not
 * assumed — see D-040.
 *
 * A grid item with `width: auto` does stretch, so the root is a one-cell grid
 * and the control fills it. No width is declared anywhere, which is the rule
 * satisfied rather than bent. Flexbox does NOT work here: a flex item does not
 * stretch on the main axis without flex-grow, and it measured the same 185px.
 *
 * Spec: docs/specs/tier-3c-inputs.md §3.8
 */

/**
 * An allow-list, not `Exclude<HTMLInputTypeAttribute, …>`, and the difference
 * is load-bearing: React types `type` as a union that ends in `(string & {})`
 * to keep custom values assignable, and `'checkbox'` is assignable to that, so
 * Exclude removes the literal and lets the value straight back in (D-040).
 *
 * Absent on purpose: checkbox and radio (3.10, 3.11), button/submit/reset/image
 * (Button, 3.1), range (Slider, 3.15), file (FileUpload, 5.10), hidden (no
 * component at all), and color (a swatch, not a text surface).
 */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'time';

export interface InputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size' | 'className' | 'style'> {
  type?: InputType;
  /**
   * The CONTROL scale (D-028), not the HTML `size` attribute — which counts
   * characters and is a control sizing itself, in the one place RULES §1 would
   * never think to look. The native attribute is omitted from the props type
   * for that reason, and never set.
   */
  size?: Size;
  /**
   * Field has no `invalid` prop, because `error` is its invalid state and a
   * second prop could only contradict it (D-036). A standalone control has no
   * `error`, so it needs this one — the same shape Label settled in 3B.
   */
  invalid?: boolean;
  /** Lands on the root, which is the box. The control gets everything else (D-039 §1). */
  className?: string;
  /** Lands on the root. See `className`. */
  style?: CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    type = 'text',
    size: sizeProp,
    invalid: invalidProp,
    disabled: disabledProp,
    required: requiredProp,
    readOnly = false,
    className,
    style,
    ...props
  },
  ref,
) {
  const field = useField();

  /*
   * The one precedence rule, identical in all six controls of this tier:
   * explicit prop, then the field, then the default. Including
   * `disabled={false}` inside a disabled Field, which does enable this control.
   */
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;

  return (
    /*
     * The root is the box: className, style and the state attributes. The tone
     * context has to live here rather than on the control, because D-007 works
     * by inheritance and the control reads --pp-tone-border from it.
     */
    <span
      className={cx('pp-input', className)}
      style={style}
      data-size={size}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-pp-tone={invalid ? 'danger' : undefined}
    >
      {/*
       * The control is the element: the ref, and every remaining prop. A ref to
       * the wrapper cannot be focused, cannot be read for `.value`, and cannot
       * be handed to react-hook-form (D-039 §1).
       *
       * `id` and `aria-describedby` come from the field and are written BEFORE
       * the spread, so an explicit prop still wins — the same precedence as
       * everything above, expressed as source order.
       */}
      <input
        ref={ref}
        className="pp-input__control"
        type={type}
        id={field?.control.id}
        aria-describedby={field?.control['aria-describedby']}
        aria-invalid={invalid || undefined}
        required={required || undefined}
        disabled={disabled || undefined}
        readOnly={readOnly || undefined}
        {...props}
      />
    </span>
  );
});
