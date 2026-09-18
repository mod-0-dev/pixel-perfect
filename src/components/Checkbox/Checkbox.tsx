'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react';

import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/refs';
import { useControllableState } from '../../internal/useControllableState';
import { useField } from '../Field/Field';
import { Icon } from '../Icon/Icon';
import type { Size } from '../../types';

/**
 * A binary or tri-state checkbox, painted by us and operated by the browser.
 *
 * Sizing contract: hug, and square — 16 / 20 / 24 from `--pp-size-4/5/6`. The
 * inline size is a restatement of the block size rather than a decision about
 * the parent, which is the D-019 exemption `Icon`, `Spinner` and `Avatar`
 * already hold and D-031 extended to `IconButton`. Declared in
 * `.stylelintrc.json` rather than routed around with `aspect-ratio`.
 *
 * RSC: client — `useControllableState`, and `indeterminate` is a DOM property
 * with no HTML attribute, so it can only be set from an effect.
 *
 * IT RENDERS NO LABEL. That is `Field`'s job, and a `Checkbox` with a `label`
 * prop would be a second, worse `Field` — one that owns no description, no
 * error and no `aria-describedby`.
 *
 * Spec: docs/specs/tier-3c-inputs.md §3.10
 */

/**
 * `'indeterminate'` is a third state, not a third boolean. It is the "select
 * all" summary of other checkboxes, and only the caller can set it — see
 * `onCheckedChange`.
 */
export type CheckedState = boolean | 'indeterminate';

export interface CheckboxProps
  extends Omit<
    ComponentPropsWithoutRef<'input'>,
    'type' | 'size' | 'checked' | 'defaultChecked' | 'className' | 'style'
  > {
  /** Controlled. */
  checked?: CheckedState;
  /** Uncontrolled. */
  defaultChecked?: CheckedState;
  /**
   * Fires in both modes (D-032).
   *
   * NEVER CALLED WITH `'indeterminate'`. Clicking an indeterminate checkbox
   * produces `true`, which is what the platform does and what the "select all"
   * case wants: the third state is a summary of other controls, not a value a
   * user picks.
   */
  onCheckedChange?: (checked: CheckedState) => void;
  /**
   * 16 / 20 / 24 (spec §8) — the SIZE scale, not `--pp-control-height-*`. A
   * checkbox is not a control surface with a height; it is a box.
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

/**
 * The mark, as markup rather than as a `mask-image` data URI (D-039 §3). The
 * `<input>` is void and cannot hold it, but the indicator is a `<span>` and
 * takes children — so the path is reviewable in a diff, coloured by
 * `currentColor`, and costs no lint rule to police.
 */
function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function Dash() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M6 12h12" />
    </svg>
  );
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
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
  // Omit does not delete properties, so a caller who does not typecheck can
  // still hand us `type="radio"` and turn a checkbox into a radio with a
  // checkbox's classes and a checkbox's state machine (D-031).
  const { type: _type, ...props } = rest as typeof rest & { type?: string };
  void _type;

  const field = useField();
  const controlRef = useRef<HTMLInputElement>(null);

  /* The one precedence rule, identical in all six controls of this tier:
     explicit prop, then the field, then the default. Including
     `disabled={false}` inside a disabled Field, which does enable this one. */
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;

  /*
   * A STATE HOOK, WHERE `Input` AND `Textarea` HAVE NONE, AND THE REASON IS
   * RULES §4 RATHER THAN RULES §5.5 (D-039 §6).
   *
   * The text controls pass `value` straight to the DOM, because React's inputs
   * already implement the controlled/uncontrolled contract and wrapping them
   * would hand callers an `onChange` taking a string. Nothing about them needs
   * to be read during render.
   *
   * This one does: `data-state` has to describe the checkedness in the render
   * that emits it, and a native checkbox's checkedness lives in the DOM, one
   * commit later. So the state is held here and the DOM is told, rather than
   * the other way round.
   */
  const [checked, setChecked] = useControllableState<CheckedState>({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
    component: 'Checkbox',
    prop: 'checked',
  });

  const isIndeterminate = checked === 'indeterminate';

  /*
   * `indeterminate` HAS NO HTML ATTRIBUTE. It is a DOM property only, so React
   * cannot render it and there is nothing to serialize on the server — which is
   * also why this cannot cause a hydration mismatch: the server and the first
   * client render both emit `checked={false}`, and the third state is applied
   * afterwards, from here.
   */
  useEffect(() => {
    const el = controlRef.current;
    if (el) el.indeterminate = isIndeterminate;
  }, [isIndeterminate]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    /*
     * The NATIVE handler is kept and chained, not replaced by `onCheckedChange`.
     * `react-hook-form`'s `register()` returns `{ name, ref, onChange, onBlur }`
     * and spreads them onto the control; a component that swallows `onChange`
     * is one that silently never registers. The same argument D-039 §6 makes
     * for the text controls, which is why it survives here even though the
     * checkable controls do hold state.
     */
    onChange?.(event);
    if (event.defaultPrevented) return;

    /*
     * `event.target.checked`, never `!checked`. Clicking an indeterminate
     * checkbox is the case that separates them: the browser has already
     * resolved the third state to `true` and cleared `indeterminate`, and
     * negating our own state would produce `false` — a "select all" that
     * deselects everything on its first click.
     */
    setChecked(event.target.checked);

    /*
     * RE-ASSERTED HERE BECAUSE A CONTROLLED CHECKBOX THAT REFUSES THE CHANGE
     * NEVER RE-RENDERS, AND THE EFFECT ABOVE ONLY RUNS WHEN IT DOES.
     *
     * The click's activation behaviour cleared `indeterminate` in the DOM. React
     * restores `checked` for a controlled input after this handler returns, but
     * it cannot restore `indeterminate` — that is not a prop it rendered. So
     * `<Checkbox checked="indeterminate">` under a parent that ignores
     * `onCheckedChange` would silently lose its dash on the first click, which
     * is the one state the component exists to be able to hold.
     *
     * Writing the RENDER-TIME value is correct in every case, and the ordering
     * is why: React batches this update and flushes it after the handler, so
     * when the state really does change the effect runs afterwards and wins.
     * When nothing changes, nothing runs afterwards and this is the last word.
     */
    if (controlRef.current) controlRef.current.indeterminate = isIndeterminate;
  };

  const state = isIndeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';

  return (
    /* The root is the box: className, style and the state attributes. The tone
       context lives here rather than on the control, because D-007 works by
       inheritance and the control reads --pp-tone-* from it. */
    <span
      className={cx('pp-checkbox', className)}
      style={style}
      data-size={size}
      data-state={state}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-pp-tone={invalid ? 'danger' : undefined}
    >
      {/* The control is the element: the ref, and every remaining prop. `id` and
          `aria-describedby` are written BEFORE the spread, so an explicit prop
          still wins — the same precedence as above, expressed as source order.

          NO `aria-checked` IS WRITTEN HERE. The native input carries the role
          and the state, and the browser derives `mixed` from the `indeterminate`
          property the effect above sets. Writing it by hand would be a second
          source of truth for something the platform already reports. */}
      <input
        ref={mergeRefs(ref, controlRef)}
        className="pp-checkbox__input"
        type="checkbox"
        id={field?.control.id}
        aria-describedby={field?.control['aria-describedby']}
        aria-invalid={invalid || undefined}
        checked={checked === true}
        required={required || undefined}
        disabled={disabled || undefined}
        onChange={handleChange}
        {...props}
      />
      {/* Rendered only when there is a mark to draw. `aria-hidden` through
          `decorative`, so the accessibility tree sees one checkbox, and
          `pointer-events: none` in CSS so the pointer only ever hits the
          input beneath it. */}
      {state !== 'unchecked' && (
        <Icon decorative className="pp-checkbox__indicator">
          {isIndeterminate ? <Dash /> : <Check />}
        </Icon>
      )}
    </span>
  );
});
