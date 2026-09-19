'use client';

import {
  forwardRef,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react';

import { cx } from '../../internal/cx';
import { useField } from '../Field/Field';
import { useRadioGroup } from './RadioGroup';
import type { Size } from '../../types';

/**
 * One option in a `RadioGroup`, painted by us and operated by the browser.
 *
 * Sizing contract: hug, and square — 16 / 20 / 24 from `--pp-size-4/5/6`, the
 * same box as `Checkbox` (spec §8) with a round edge and a dot. The
 * `inline-size` in the stylesheet is the D-019 exemption D-039 §7 extends to
 * this file, declared in `.stylelintrc.json` rather than routed around with
 * `aspect-ratio`.
 *
 * RSC: client — it reads two contexts.
 *
 * IT RENDERS NO LABEL, for the reason `Checkbox` renders none: that is
 * `Field`'s job, and an option with its own label is a second, worse `Field`.
 *
 * NO `checked` OR `defaultChecked`. Selection belongs to the group — see
 * `RadioProps`.
 *
 * Spec: docs/specs/tier-3c-inputs.md §3.11
 */

export interface RadioProps
  extends Omit<
    ComponentPropsWithoutRef<'input'>,
    'type' | 'size' | 'value' | 'checked' | 'defaultChecked' | 'className' | 'style'
  > {
  /**
   * The value this option contributes. Required, and never `''` — the group
   * spells "nothing selected" that way.
   */
  value: string;
  /** 16 / 20 / 24 (spec §8) — the SIZE scale, not `--pp-control-height-*`. */
  size?: Size;
  /** Standalone equivalent of a `Field`'s `error` (D-036). */
  invalid?: boolean;
  /** Lands on the root, which is the box. The control gets everything else (D-039 §1). */
  className?: string;
  /** Lands on the root. See `className`. */
  style?: CSSProperties;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    value,
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
  // Omit does not delete properties (D-031): a caller who does not typecheck
  // can still hand us `type="checkbox"` and get a checkbox wearing a radio's
  // classes, its round box and its group's name.
  const { type: _type, ...props } = rest as typeof rest & { type?: string };
  void _type;

  const group = useRadioGroup();
  const field = useField();

  /*
   * THE GROUP BEFORE THE FIELD, AND THE FIELD HERE IS NOT THE ONE YOU THINK.
   *
   * The sanctioned arrangement nests a Field per option inside the group:
   *
   *   <Field label="Target" group>        ← the outer field: size, disabled…
   *     <RadioGroup>
   *       <Field label="Preview" orientation="horizontal">   ← the inner one
   *         <Radio value="preview" />
   *
   * `useField()` returns the INNER field, which publishes its own defaults
   * (`size: 'md'`, `disabled: false`) rather than the outer field's values —
   * `FieldContextValue` has no way to spell "not set", so an unset inner field
   * is indistinguishable from one set to the default. The group read the outer
   * field itself, so reading the group first is what carries the outer field's
   * intent across the inner one.
   *
   * Consequence, and it is documented on the component page: per-option state
   * goes on the `Radio` (`<Radio disabled />`), never on its inner `Field`.
   */
  const size = sizeProp ?? group?.size ?? field?.size ?? 'md';
  const invalid = invalidProp ?? group?.invalid ?? field?.invalid ?? false;
  const disabled = disabledProp ?? group?.disabled ?? field?.disabled ?? false;
  /* On EVERY radio, not just the first: HTML treats the group as satisfied if
     any radio with that name is checked, and browsers differ on whether an
     unmarked member counts (spec §3.11). */
  const required = requiredProp ?? group?.required ?? field?.required ?? false;

  /*
   * `undefined` — an uncontrolled native radio — when there is no group, which
   * is the only honest answer: nothing here owns the selection, so nothing here
   * may claim it. `data-state` is omitted in that case for the same reason, and
   * the stylesheet paints from `:checked` so the box is still right.
   */
  const checked = group ? group.value === value : undefined;
  const state = checked === undefined ? undefined : checked ? 'checked' : 'unchecked';

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    /* The native handler is kept and chained, not replaced by the group's
       `onValueChange`. `react-hook-form`'s `register()` returns
       `{ name, ref, onChange, onBlur }` and spreads them onto the control; a
       component that swallows `onChange` is one that silently never registers
       (D-039 §6). */
    onChange?.(event);
    if (event.defaultPrevented) return;

    /*
     * UNCONDITIONAL, AND THE GUARD THAT WAS HERE WAS INERT.
     *
     * It read `if (event.target.checked)`, on the theory that a change event
     * might arrive for a radio being deselected. It cannot: the platform fires
     * `change` only for the radio being SELECTED, and React reaches this
     * handler from a `click` on this control. Removing the condition left all
     * 34 unit tests and all 18 browser assertions green, which under D-037 §5
     * makes it a claim of a dependency that does not exist.
     */
    group?.select(value);
  };

  return (
    /* The root is the box: className, style and the state attributes. The tone
       context lives here rather than on the control, because D-007 works by
       inheritance and both the input and the dot read --pp-tone-* from it. */
    <span
      className={cx('pp-radio', className)}
      style={style}
      data-size={size}
      data-state={state}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-pp-tone={invalid ? 'danger' : undefined}
    >
      {/* The control is the element: the ref, and every remaining prop. `name`,
          `id` and `aria-describedby` are written BEFORE the spread, so an
          explicit prop still wins — the same precedence as above, expressed as
          source order. Setting `name` on a radio inside a group is therefore
          possible and is a documented "don't": it removes the option from its
          own group. */}
      <input
        ref={ref}
        className="pp-radio__input"
        type="radio"
        id={field?.control.id}
        aria-describedby={field?.control['aria-describedby']}
        aria-invalid={invalid || undefined}
        name={group?.name}
        value={value}
        checked={checked}
        required={required || undefined}
        disabled={disabled || undefined}
        onChange={handleChange}
        {...props}
      />
      {/*
        ALWAYS RENDERED, WHERE Checkbox's MARK IS CONDITIONAL — because React
        does not know whether this radio is checked when there is no group, and
        a component that does not know does not get to decide. The stylesheet
        scales the dot from 0 off `:checked`, which is the platform's own
        answer and is right in every case including a native form reset.

        `aria-hidden`, so the accessibility tree sees one radio; and
        `pointer-events: none` in CSS, so a click on the dot hits the input
        beneath rather than a dead <span> in the middle of the target.
      */}
      <span className="pp-radio__indicator" aria-hidden="true" />
    </span>
  );
});
