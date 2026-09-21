'use client';

import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/refs';
import { canStep, numberIO, snapToRange, stepFrom, type NumericRange } from '../../internal/number';
import { useControllableState } from '../../internal/useControllableState';
import { Icon } from '../Icon/Icon';
import { useField } from '../Field/Field';
import type { Size } from '../../types';

/**
 * A numeric text field with steppers, bounds, a step, and formatting that is
 * correct outside en-US.
 *
 * Sizing contract: fill. RSC: client — useField(), state, event handlers.
 *
 * IT IS `type="text"`, NOT `type="number"` (spec §5), which tier 3C §13.5 had
 * already ruled: type="number" mutates its value on a scroll wheel over a
 * focused field, rejects a locale decimal comma, and reports value === '' for
 * anything it cannot parse — so `1,5` typed in a German locale is silently lost.
 * §4's formatting makes it impossible for a second reason: you cannot put
 * `1.234,5` into a control that refuses to hold it.
 *
 * THE CONTROL IS THE SURFACE AND THE STEPPERS OVERLAY IT, WHICH IS SELECT'S
 * STRUCTURE RATHER THAN A NEW ONE (D-051 §3). Spec §9 put the surface on the
 * wrapper with the ring drawn by `:has()`; that rendered TWO concentric
 * outlines, because reset.css draws `:where(:focus-visible)` on the inner input
 * too. See NumberInput.css for the whole finding. 3C §1's rejected `.pp-control`
 * base class still stays rejected — by Select's reasoning, not by that one.
 *
 * Spec: docs/specs/tier-3d-composite.md §3.14
 */

const LARGE_STEP_MULTIPLIER = 10;

/** The chevrons. Markup rather than a mask-image data URI, per D-039 §3. */
function ChevronUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export interface NumberInputProps
  extends Omit<
    ComponentPropsWithoutRef<'input'>,
    'type' | 'size' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'className' | 'style'
  > {
  /**
   * Controlled. `null` is EMPTY; `undefined` is UNCONTROLLED, and they are not
   * the same word (spec §2).
   *
   * `value={form.quantity}` where `quantity` is optional produces `undefined`
   * the first time the field is blank, which silently switches the component to
   * uncontrolled — the case useControllableState warns about at runtime. The
   * type makes the warning unnecessary: pass `?? null`.
   */
  value?: number | null;
  /** Uncontrolled seed. `null` starts empty. */
  defaultValue?: number | null;
  /** Fires on COMMIT — blur, a stepper, an arrow key, Enter — never per keystroke (spec §3). */
  onValueChange?: (value: number | null) => void;
  /** Clamped on commit. Also the stepping base, the way HTML does it (spec §1). */
  min?: number;
  /** Clamped on commit. */
  max?: number;
  /** Snapped on commit, and it decides `inputMode` (spec §5). */
  step?: number;
  /**
   * Absent means NO FORMATTING AT ALL, and that is a hydration ruling rather
   * than a default (spec §4). An `Intl.NumberFormat` with no locale resolves
   * the runtime's, which differs between the server and the browser.
   */
  locale?: string;
  /** Passed to `Intl.NumberFormat(locale, …)`. Does nothing without `locale`. */
  formatOptions?: Intl.NumberFormatOptions;
  /**
   * The CONTROL scale (D-028), not the HTML `size` attribute — which counts
   * characters and is a control sizing itself, in the one place RULES §1 would
   * never think to look. The native attribute is never set.
   */
  size?: Size;
  /**
   * `Field` has no `invalid` prop, because `error` is its invalid state and a
   * second prop could only contradict it (D-036). A standalone control has no
   * `error`, so it needs this one — the shape `Label` settled in 3B.
   */
  invalid?: boolean;
  /** Accessible name for the increment stepper. */
  incrementLabel?: string;
  /** Accessible name for the decrement stepper. */
  decrementLabel?: string;
  /** Lands on the root, which is the box. The control gets everything else (D-039 §1). */
  className?: string;
  /** Lands on the root. See `className`. */
  style?: CSSProperties;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    min,
    max,
    step = 1,
    locale,
    formatOptions,
    size: sizeProp,
    invalid: invalidProp,
    disabled: disabledProp,
    required: requiredProp,
    readOnly = false,
    incrementLabel = 'Increase',
    decrementLabel = 'Decrease',
    className,
    style,
    onChange,
    onBlur,
    onKeyDown,
    ...props
  },
  ref,
) {
  const field = useField();

  /* The one precedence rule, identical in every control since 3C: explicit
     prop, then the field, then the default. Including `disabled={false}` inside
     a disabled Field, which does enable this control. */
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;

  const [value, setValue] = useControllableState<number | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
    component: 'NumberInput',
    prop: 'value',
  });

  const range = useMemo<NumericRange>(() => ({ min, max, step }), [min, max, step]);
  const io = useMemo(() => numberIO(locale, formatOptions), [locale, formatOptions]);

  /*
   * THE DRAFT IS THE TEXT WHILE THE USER IS EDITING IT, AND IT IS A SECOND
   * STATE ON PURPOSE (spec §3).
   *
   * The committed value is a number and the field holds a string, and during
   * editing they legitimately disagree: `1.` and `-` are not numbers, and a
   * half-typed `1` in a step={10} field must not become `10` before the `5`
   * arrives. `null` means "not editing", so the display comes from the value.
   */
  const [draft, setDraft] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const setInputRef = useMemo(() => mergeRefs<HTMLInputElement>(inputRef, ref), [ref]);

  const display = draft ?? (value === null ? '' : io.format(value));

  /*
   * What the value WOULD be if the draft were committed now, used only for
   * what is announced. `null` while the text is not yet a number, which is why
   * aria-valuenow is omitted rather than left stale (spec §5).
   */
  const live = draft === null ? value : io.parse(draft);

  /*
   * COMMITTING WRITES THE FORMATTED TEXT TO THE DOM NODE AS WELL AS TO STATE.
   *
   * Enter commits and then the form submits in the SAME event, before React
   * has re-rendered, so a native submission would otherwise carry the raw
   * draft rather than the clamped value. One assignment, immediately overwritten
   * by the render that follows, and it is the difference between `500` and
   * `10` reaching a server on a max={10} field.
   */
  const commit = useCallback(
    (next: number | null) => {
      setDraft(null);
      setValue(next);
      const node = inputRef.current;
      if (node) node.value = next === null ? '' : io.format(next);
    },
    [io, setValue],
  );

  /** Parse, clamp and snap the text in the box. Unparseable text REVERTS. */
  const commitDraft = useCallback(() => {
    if (draft === null) return;
    const trimmed = draft.trim();
    if (trimmed === '') {
      commit(null);
      return;
    }
    const parsed = io.parse(draft);
    /* A typo should not silently destroy data the user did not ask to delete,
       so unparseable text reverts to the last committed value (spec §3). */
    commit(parsed === null ? value : snapToRange(parsed, range));
  }, [commit, draft, io, range, value]);

  const applyStep = useCallback(
    (count: number) => {
      if (disabled || readOnly) return;
      /* A step operates on what is IN THE BOX, so typing 5 then pressing ↑ in a
         step={1} field gives 6 rather than stepping from the stale value. */
      const from = draft === null ? value : io.parse(draft);
      commit(stepFrom(from, count, range));
    },
    [commit, disabled, draft, io, range, readOnly, value],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || readOnly) return;

      const large = step * LARGE_STEP_MULTIPLIER;
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          applyStep(1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          applyStep(-1);
          break;
        case 'PageUp':
          event.preventDefault();
          commit(stepFrom(draft === null ? value : io.parse(draft), 1, { ...range, step: large }));
          break;
        case 'PageDown':
          event.preventDefault();
          commit(stepFrom(draft === null ? value : io.parse(draft), -1, { ...range, step: large }));
          break;
        case 'Home':
          if (min === undefined) break;
          event.preventDefault();
          commit(snapToRange(min, range));
          break;
        case 'End':
          if (max === undefined) break;
          event.preventDefault();
          commit(snapToRange(max, range));
          break;
        case 'Enter':
          /* NOT preventDefault: the form still submits, and `commit` has
             already written the clamped text to the node above. */
          commitDraft();
          break;
        default:
          break;
      }
    },
    [applyStep, commit, commitDraft, disabled, draft, io, max, min, onKeyDown, range, readOnly, step, value],
  );

  /*
   * A stepper press must not move focus off the input: the buttons are not tab
   * stops (spec §6), so focus landing on one would leave the ring somewhere the
   * keyboard cannot return to.
   */
  const handleStepperPointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    inputRef.current?.focus();
  }, []);

  /*
   * `inputMode` IS DERIVED, NOT FIXED (spec §5). 3C §13.5 said "numeric", and a
   * numeric keypad on iOS has no decimal separator and no minus key — so a
   * step={0.5} field would be untypeable on a phone.
   *
   * THE SPEC'S OWN CONDITION WAS WRONG IN THE DIRECTION IT WAS WARNING ABOUT
   * (D-051 §2). It read `min === undefined || min >= 0`, which makes an
   * UNBOUNDED integer field `numeric` — and an unbounded field accepts
   * negatives, so it is exactly the field that needs the minus key. `numeric`
   * is claimed only when the value cannot be negative, which requires a `min`
   * to say so.
   */
  const inputMode =
    Number.isInteger(step) && min !== undefined && min >= 0 ? 'numeric' : 'decimal';

  const canIncrement = !disabled && !readOnly && canStep(live, 1, range);
  const canDecrement = !disabled && !readOnly && canStep(live, -1, range);

  const valueText = value !== null && io.formatted ? io.format(value) : undefined;

  return (
    /* The root is the box AND the surface. The tone context lives here because
       D-007 works by inheritance and the border reads --pp-tone-* from it. */
    <span
      className={cx('pp-number-input', className)}
      style={style}
      data-size={size}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-pp-tone={invalid ? 'danger' : undefined}
    >
      <input
        ref={setInputRef}
        className="pp-number-input__control"
        type="text"
        role="spinbutton"
        inputMode={inputMode}
        autoComplete="off"
        value={display}
        /*
         * OMITTED WHILE THERE IS NO VALUE, WHICH ARIA 1.2 ALLOWS AND ARIA 1.1
         * DID NOT (spec §5, open question 1 — verified: `aria-valuenow` is in
         * axe-core's allowedAttrs for spinbutton and not in requiredAttrs,
         * and aria-query 5.3 reports requiredProps {} for the role).
         *
         * The alternative is announcing a number that is not what is in the
         * box — for an empty field, or for a half-typed `1.` — which is worse
         * than announcing nothing.
         */
        aria-valuenow={live ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueText}
        id={field?.control.id}
        aria-describedby={field?.control['aria-describedby']}
        aria-invalid={invalid || undefined}
        required={required || undefined}
        disabled={disabled || undefined}
        readOnly={readOnly || undefined}
        onChange={(event) => {
          /* Typing NEVER clamps or snaps (spec §3). It only records the text. */
          setDraft(event.target.value);
          onChange?.(event);
        }}
        onBlur={(event) => {
          commitDraft();
          onBlur?.(event);
        }}
        onKeyDown={handleKeyDown}
        {...props}
      />
      <span className="pp-number-input__steppers">
        <button
          type="button"
          className="pp-number-input__stepper"
          data-direction="increment"
          data-disabled={!canIncrement || undefined}
          /* Not a tab stop: ↑ and ↓ already do this, and six number fields
             would otherwise carry eighteen tab stops (spec §6). */
          tabIndex={-1}
          disabled={!canIncrement}
          aria-label={incrementLabel}
          onPointerDown={handleStepperPointerDown}
          onClick={() => applyStep(1)}
        >
          <Icon decorative>
            <ChevronUp />
          </Icon>
        </button>
        <button
          type="button"
          className="pp-number-input__stepper"
          data-direction="decrement"
          data-disabled={!canDecrement || undefined}
          tabIndex={-1}
          disabled={!canDecrement}
          aria-label={decrementLabel}
          onPointerDown={handleStepperPointerDown}
          onClick={() => applyStep(-1)}
        >
          <Icon decorative>
            <ChevronDown />
          </Icon>
        </button>
      </span>
    </span>
  );
});
