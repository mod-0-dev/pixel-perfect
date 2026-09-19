'use client';

import {
  forwardRef,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react';

import { cx } from '../../internal/cx';
import { useControllableState } from '../../internal/useControllableState';
import { useField } from '../Field/Field';
import type { Size } from '../../types';

/**
 * An on/off control whose effect is IMMEDIATE. That is the whole boundary
 * against `Checkbox`: a checkbox states a value that a submit button applies,
 * a switch does the thing when you flip it. If there is a Save button, it is a
 * checkbox.
 *
 * And it is not `Toggle` (3.5), which is `aria-pressed` — a button that stays
 * pressed. The line is drawn in the DOM rather than in prose: `Toggle` reports
 * `data-state="on|off"`, this reports `checked|unchecked`.
 *
 * Sizing contract: hug, and the one member of 3C that is not square — a 2:1
 * track at the checkable block sizes, so `md` is 40×20 and lines up with a `md`
 * checkbox in the same form. The `inline-size` in the stylesheet is the D-019
 * exemption D-039 §7 extends to the checkable three, declared in
 * `.stylelintrc.json` rather than routed around with `aspect-ratio`.
 *
 * RSC: client — `useControllableState` and a context read.
 *
 * IT RENDERS NO LABEL. That is `Field`'s job, and a switch with no label is as
 * broken as a checkbox with none.
 *
 * Spec: docs/specs/tier-3c-inputs.md §3.12
 */

export interface SwitchProps
  extends Omit<
    ComponentPropsWithoutRef<'input'>,
    'type' | 'role' | 'size' | 'checked' | 'defaultChecked' | 'className' | 'style'
  > {
  /** Controlled. No `'indeterminate'` — a switch is binary. */
  checked?: boolean;
  /** Uncontrolled. */
  defaultChecked?: boolean;
  /** Fires in both modes (D-032). */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * The track's BLOCK size — 16 / 20 / 24 from the size scale (spec §8), with
   * the inline size twice it. Not `--pp-control-height-*`: a switch is a box,
   * not a control surface with a height.
   */
  size?: Size;
  /**
   * `Field` has no `invalid` prop, because `error` is its invalid state and a
   * second prop could only contradict it (D-036). A standalone control has no
   * `error`, so it needs this one.
   */
  invalid?: boolean;
  /** Lands on the root, which is the box. The control gets everything else (D-039 §1). */
  className?: string;
  /** Lands on the root. See `className`. */
  style?: CSSProperties;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    size: sizeProp,
    invalid: invalidProp,
    disabled: disabledProp,
    required: requiredProp,
    className,
    style,
    onChange,
    ...rest
  },
  ref,
) {
  /* Omit does not delete properties (D-031), so a caller who does not typecheck
     can still hand us a `type` or a `role` and get a control that is announced
     as one thing and behaves as another — the exact failure `IconButton` shipped
     when it omitted `asChild` from its type and still spread it. */
  const { type: _type, role: _role, ...props } = rest as typeof rest & {
    type?: string;
    role?: string;
  };
  void _type;
  void _role;

  const field = useField();

  /* The one precedence rule, identical in all six controls of this tier:
     explicit prop, then the field, then the default. Including
     `disabled={false}` inside a disabled Field, which does enable this one. */
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;

  /*
   * A STATE HOOK, FOR RULES §4 RATHER THAN RULES §5.5 (D-039 §6). `data-state`
   * has to describe the checkedness in the render that emits it, and a native
   * checkbox's checkedness lands in the DOM one commit later. So the state is
   * held here and the DOM is told, rather than the other way round.
   */
  const [checked, setChecked] = useControllableState<boolean>({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
    component: 'Switch',
    prop: 'checked',
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    /* The native handler is kept and chained, not replaced by `onCheckedChange`.
       `react-hook-form`'s `register()` returns `{ name, ref, onChange, onBlur }`
       and spreads them onto the control; a component that swallows `onChange` is
       one that silently never registers (D-039 §6). */
    onChange?.(event);
    if (event.defaultPrevented) return;

    /* `event.target.checked`, never `!checked`: the browser has already resolved
       the activation, and a controlled owner that refuses the change must see
       what the platform produced rather than what we assumed. */
    setChecked(event.target.checked);
  };

  return (
    /* The root is the box: className, style and the state attributes. The tone
       context lives here rather than on the control, because D-007 works by
       inheritance and both the track and the thumb read --pp-tone-* from it. */
    <span
      className={cx('pp-switch', className)}
      style={style}
      data-size={size}
      data-state={checked ? 'checked' : 'unchecked'}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-pp-tone={invalid ? 'danger' : undefined}
    >
      {/*
        THE NATIVE INPUT IS THE PAINTED TRACK (D-039 §2), and `role="switch"` on
        a native checkbox is the APG construction: the semantics, the keyboard
        and the form participation stay, and only the announced role changes.

        The control is the element: the ref, and every remaining prop. `id` and
        `aria-describedby` are written BEFORE the spread, so an explicit prop
        still wins — the same precedence as above, expressed as source order.

        NO `aria-checked` IS WRITTEN HERE. The input carries the state and the
        platform maps it onto the switch role; writing it by hand would be a
        second source of truth for something already reported.
      */}
      <input
        ref={ref}
        className="pp-switch__input"
        type="checkbox"
        role="switch"
        id={field?.control.id}
        aria-describedby={field?.control['aria-describedby']}
        aria-invalid={invalid || undefined}
        checked={checked}
        required={required || undefined}
        disabled={disabled || undefined}
        onChange={handleChange}
        {...props}
      />
      {/* `aria-hidden`, so the accessibility tree sees one switch; and
          `pointer-events: none` in CSS, so a click on the thumb hits the track
          beneath it rather than a dead <span> in the middle of the target. */}
      <span className="pp-switch__thumb" aria-hidden="true" />
    </span>
  );
});
