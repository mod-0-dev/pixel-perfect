'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Controlled and uncontrolled in one hook.
 *
 * RULES §5.5 requires every stateful component to support both — "Both, always.
 * No exceptions." — so this exists once rather than in `Toggle`, `Checkbox`,
 * `Switch`, `Select`, `Slider`, `Tabs` and `Accordion` separately, each with its
 * own subtly different idea of what `undefined` means.
 *
 * The contract:
 *   - `value !== undefined` means controlled. The component renders what it is
 *     given and never stores anything.
 *   - otherwise uncontrolled, seeded from `defaultValue`.
 *   - `onChange` fires in BOTH modes. A controlled consumer needs it to update
 *     its state; an uncontrolled one needs it to observe.
 *
 * Internal. Not exported from the package.
 */
export interface ControllableStateOptions<T> {
  value: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
  /** For the development warning, e.g. `Toggle` and `pressed`. */
  component: string;
  prop: string;
}

/*
 * tsconfig.build.json compiles the package with `types: []`, so Node's globals
 * are not in scope — and the library may also be loaded unbundled, where
 * `process` genuinely does not exist. Declared locally and guarded, so the
 * development warning costs the production build nothing and cannot throw.
 */
declare const process: { env?: { NODE_ENV?: string } } | undefined;

const isProduction = () =>
  typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  component,
  prop,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);

  /*
   * Switching modes mid-life is the React mistake everyone makes eventually —
   * usually by passing `value={maybeUndefined}` — and it is completely silent:
   * the component simply stops responding, or stops being controllable, and
   * nothing says why. React warns about this for its own inputs; a library that
   * reimplements the behaviour should warn about it too.
   *
   * In an effect rather than during render, so StrictMode's double render does
   * not produce a double warning and render stays free of side effects.
   */
  const wasControlled = useRef(isControlled);
  useEffect(() => {
    if (isProduction()) return;
    if (wasControlled.current !== isControlled) {
      const [from, to] = wasControlled.current
        ? ['controlled', 'uncontrolled']
        : ['uncontrolled', 'controlled'];
      console.warn(
        `[pixel-perfect] ${component} changed from ${from} to ${to}. Decide once: ` +
          `pass \`${prop}\` for every render, or pass \`default${capitalise(prop)}\` and never \`${prop}\`.`,
      );
      wasControlled.current = isControlled;
    }
  }, [isControlled, component, prop]);

  const set = useCallback(
    (next: T) => {
      // A controlled component does not store the value. Writing it anyway
      // would make the component briefly disagree with its owner, which is the
      // flicker everyone blames on React.
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [isControlled ? (value as T) : uncontrolled, set];
}
