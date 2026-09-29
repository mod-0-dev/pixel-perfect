'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

import { cx } from '../../internal/cx';
import { isEditing } from '../../internal/editing';
import { directionOf } from '../../internal/overlay/side';
import { mergeRefs } from '../../internal/refs';
import type { Space } from '../../types';

/**
 * A named row of controls reached with one Tab and walked with the arrows.
 *
 * A ROVING TABINDEX OVER WHATEVER CONTROLS ARE INSIDE, FOUND BY THE DOM (spec
 * §1): no wrapper part, no registration. The toolbar reads its own subtree for
 * the elements a keyboard user could reach — buttons, links, fields, the
 * control roles — skips the disabled ones, and keeps exactly one at
 * `tabindex="0"`. The set is re-read after every render of the toolbar and,
 * through a MutationObserver, after any change below it, so a control that
 * mounts, unmounts or becomes disabled needs nothing from the consumer.
 * Nothing is written on a control but `tabindex`.
 *
 * THE STOP IS THE LAST CONTROL FOCUSED, ELSE THE FIRST (spec §2), tracked by
 * element rather than by index so a control inserted before it does not move
 * it. INSIDE A TEXT FIELD THE ARROWS ARE THE CARET'S (spec §4).
 *
 * Sizing contract: fill. RSC: client. Spec: docs/specs/Toolbar.md
 */

export type ToolbarOrientation = 'horizontal' | 'vertical';

export interface ToolbarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'role' | 'aria-label' | 'aria-orientation'> {
  /** The toolbar's name. Required: an unnamed toolbar is an unnamed region (spec §7). */
  label: string;
  /** Which arrows move, and row or column (spec §3, §6). */
  orientation?: ToolbarOrientation;
  /** Wrap at the ends. `false` stops there (spec §3). */
  loop?: boolean;
  /** A step of the space scale between the controls (spec §6). */
  gap?: Space;
}

/* What counts as a control (spec §1): the elements Tab could reach. */
const CONTROL_SELECTOR = [
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'a[href]',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="combobox"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="textbox"]',
  '[role="searchbox"]',
].join(', ');

const isDisabled = (el: HTMLElement): boolean =>
  (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true' || el.closest('[hidden]') !== null;

const controlsOf = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(CONTROL_SELECTOR)).filter((el) => !isDisabled(el));

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { label, orientation = 'horizontal', loop = true, gap = '2', className, onKeyDown, onFocus, onClick, children, ...props },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, rootRef), [ref]);
  /* The stop, by element (spec §2). */
  const stopRef = useRef<HTMLElement | null>(null);

  /* One control at "0", the rest at "-1": the remembered one if it is still a
     control, else the first. Written only where it differs, so the observer
     below — which watches `tabindex` too, for a consumer's own writes — sees
     nothing from this. */
  const apply = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const controls = controlsOf(root);
    const stop = stopRef.current !== null && controls.includes(stopRef.current) ? stopRef.current : (controls[0] ?? null);
    stopRef.current = stop;
    for (const control of controls) {
      const value = control === stop ? '0' : '-1';
      if (control.getAttribute('tabindex') !== value) control.setAttribute('tabindex', value);
    }
  }, []);

  useLayoutEffect(apply);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(apply);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled', 'hidden', 'href', 'tabindex'],
    });
    return () => observer.disconnect();
  }, [apply]);

  /* A TEXT FIELD IS NEVER THE STOP (D-098 §1). Remembered, it would be
     where Tab lands on the way back in, and its arrows are the caret's
     (spec §4) — so every control after it would be unreachable from outside
     by keyboard. The stop stays on the last button focused (else the first);
     the field is reached by the arrows, and Tab out and back lands on a
     control the arrows work from. */
  const remember = (control: HTMLElement) => {
    if (isEditing(control)) return;
    stopRef.current = control;
    apply();
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    const root = rootRef.current;
    const target = event.target as HTMLElement;
    if (root && controlsOf(root).includes(target)) remember(target);
  };

  /* A pointer press makes its control the stop (spec §2), whether or not the
     browser focused it — Safari does not focus a pressed button. */
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    const root = rootRef.current;
    const control = (event.target as HTMLElement).closest<HTMLElement>(CONTROL_SELECTOR);
    if (root && control && root.contains(control) && !isDisabled(control)) remember(control);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const root = rootRef.current;
    if (!root) return;
    const target = event.target as HTMLElement;
    const controls = controlsOf(root);
    const index = controls.indexOf(target);
    /* Only a key pressed on one of the controls (spec §5), and not one a
       text field needs (spec §4). */
    if (index === -1 || isEditing(target)) return;

    const vertical = orientation === 'vertical';
    const rtl = directionOf(root) === 'rtl';
    const next = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const previous = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const last = controls.length - 1;
    let to: number;
    switch (event.key) {
      case next:
        to = index < last ? index + 1 : loop ? 0 : index;
        break;
      case previous:
        to = index > 0 ? index - 1 : loop ? last : index;
        break;
      case 'Home':
        to = 0;
        break;
      case 'End':
        to = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    const control = controls[to];
    if (!control) return;
    remember(control);
    control.focus();
  };

  return (
    <div
      ref={setRef}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      className={cx('pp-toolbar', className)}
      data-orientation={orientation}
      // Never omitted, even at '0' — see src/components/_shared/layout.css.
      data-pp-gap={gap}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
});
