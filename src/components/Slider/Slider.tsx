'use client';

import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import { cx } from '../../internal/cx';
import { numberIO, snapToRange, type NumericRange } from '../../internal/number';
import { useControllableState } from '../../internal/useControllableState';
import { useField } from '../Field/Field';
import type { Size } from '../../types';

/**
 * A single-thumb range control on the numeric contract of Tier 3D §1, built on
 * `<input type="range">`.
 *
 * Sizing contract: fill. RSC: client — useField(), state, event handlers.
 *
 * THE NATIVE ELEMENT IS THE PAINTED CONTROL (spec §7), which is 3C §6 applied
 * one tier later rather than a new ruling. What it hands over, none of which
 * this file contains: arrow keys, Home/End, Page Up/Down, step-on-drag, pointer
 * capture including drag-outside-and-back, touch, `role="slider"` with the
 * value attributes maintained by the browser, and RTL direction handling.
 * RULES §8 forbids a runtime dependency in Tier 3; a hand-built slider is the
 * pointer maths we would have written instead.
 *
 * SINGLE-THUMB ONLY. The two-thumb case is deferred with its blocker named:
 * two overlapping inputs each draw `:focus-visible` across the whole track, so
 * focusing one thumb rings the other, and moving the ring onto the thumb
 * pseudo-element requires `outline: none`, which Tier 0.7 bans and D-029 banned
 * on purpose.
 *
 * Spec: docs/specs/tier-3d-composite.md §3.15
 */

export interface SliderProps
  extends Omit<
    ComponentPropsWithoutRef<'input'>,
    'type' | 'size' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'className' | 'style'
  > {
  /** Controlled. A thumb is always somewhere, so there is no empty state. */
  value?: number;
  /** Uncontrolled seed. Defaults to the midpoint, which is what the platform does. */
  defaultValue?: number;
  /** Fires CONTINUOUSLY — every input event during a drag. */
  onValueChange?: (value: number) => void;
  /** Fires ONCE, on pointer release, key release or blur. See the docs page. */
  onValueCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** For `aria-valuetext` only — this control displays no text (spec §4). */
  locale?: string;
  /** Passed to `Intl.NumberFormat(locale, …)`. Does nothing without `locale`. */
  formatOptions?: Intl.NumberFormatOptions;
  /** The control scale (D-028). Thumb 16 / 20 / 24, the checkable three's steps. */
  size?: Size;
  /** `Field` has no `invalid` prop, because `error` is its invalid state (D-036). */
  invalid?: boolean;
  /** Lands on the root, which is the box. The control gets everything else (D-039 §1). */
  className?: string;
  /** Lands on the root. See `className`. */
  style?: CSSProperties;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    locale,
    formatOptions,
    size: sizeProp,
    invalid: invalidProp,
    disabled: disabledProp,
    className,
    style,
    onChange,
    onPointerUp,
    onKeyUp,
    onBlur,
    ...props
  },
  ref,
) {
  const field = useField();

  /* The one precedence rule, identical in every control since 3C: explicit
     prop, then the field, then the default. `required` and `readOnly` are
     absent on purpose — see below. */
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;

  const range = useMemo<NumericRange>(() => ({ min, max, step }), [min, max, step]);

  /* The platform's own default, so an uncontrolled <Slider /> sits where a bare
     <input type="range"> would. A component that disagrees with the element it
     is replacing is a component nobody can predict. */
  const seed = useMemo(
    () => snapToRange(defaultValue ?? min + (max - min) / 2, range),
    [defaultValue, max, min, range],
  );

  const [value, setValue] = useControllableState<number>({
    value: valueProp,
    defaultValue: seed,
    onChange: onValueChange,
    component: 'Slider',
    prop: 'value',
  });

  const io = useMemo(() => numberIO(locale, formatOptions), [locale, formatOptions]);

  /*
   * Only a CHANGE is committed. Without this a plain focus-and-leave fires
   * onValueCommit with a value nobody touched, and a consumer who wired it to a
   * request would send one for every slider a user tabbed past.
   */
  const lastCommitted = useRef(value);
  const commit = useCallback(
    (next: number) => {
      if (next === lastCommitted.current) return;
      lastCommitted.current = next;
      onValueCommit?.(next);
    },
    [onValueCommit],
  );

  /*
   * THE FILL PERCENTAGE, AND IT IS A PRIVATE PROPERTY WRITTEN INLINE (D-024).
   *
   * Private, so D-024's "a component never writes its own PUBLIC override
   * property inline" is satisfied — the public `--pp-slider-fill-color` stays
   * overridable from an ancestor. ALWAYS written, never conditionally, because
   * custom properties inherit and a nested Slider would otherwise draw its
   * ancestor's fill (D-024's hazard, and D-020's before it).
   */
  const span = max - min;
  const fill = span === 0 ? 0 : ((value - min) / span) * 100;
  const clampedFill = Math.min(100, Math.max(0, fill));

  const valueText = io.formatted ? io.format(value) : undefined;

  return (
    /* The root is the box: className, style and the state attributes. The tone
       context lives here because D-007 works by inheritance. */
    <span
      className={cx('pp-slider', className)}
      style={{ ...style, '--_pp-slider-fill': `${clampedFill}%` } as CSSProperties}
      data-size={size}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-pp-tone={invalid ? 'danger' : undefined}
    >
      {/*
       * THE TRACK IS OURS AND THE THUMB IS THE PLATFORM'S.
       *
       * Drawing the filled portion with a `linear-gradient` on the native track
       * would need `to right`, which is physical, and would have to be written
       * twice because ::-webkit-slider-runnable-track and ::-moz-range-track
       * cannot share a selector list (spec §8). Two grid columns instead: the
       * inline axis is whatever the writing mode says it is, so the fill starts
       * from the correct end in an RTL layout with nothing declared about it.
       *
       * aria-hidden, because the value it depicts is already on the input.
       */}
      <span className="pp-slider__track" aria-hidden="true">
        <span className="pp-slider__fill" />
      </span>
      <input
        ref={ref}
        className="pp-slider__control"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        /*
         * role, aria-valuenow, aria-valuemin and aria-valuemax are the native
         * element's and are maintained by the browser. ARIA requires
         * aria-valuenow for `slider` — unlike `spinbutton`, where 1.2 relaxed
         * it — and the platform supplies it, so nothing here sets it.
         */
        aria-valuetext={valueText}
        id={field?.control.id}
        aria-describedby={field?.control['aria-describedby']}
        aria-invalid={invalid || undefined}
        disabled={disabled || undefined}
        onChange={(event) => {
          setValue(Number(event.target.value));
          onChange?.(event);
        }}
        onPointerUp={(event: PointerEvent<HTMLInputElement>) => {
          commit(Number(event.currentTarget.value));
          onPointerUp?.(event);
        }}
        onKeyUp={(event: KeyboardEvent<HTMLInputElement>) => {
          commit(Number(event.currentTarget.value));
          onKeyUp?.(event);
        }}
        onBlur={(event: FocusEvent<HTMLInputElement>) => {
          commit(Number(event.currentTarget.value));
          onBlur?.(event);
        }}
        {...props}
      />
    </span>
  );
});
