'use client';

import { forwardRef, useEffect, type MouseEvent, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import { Button, type ButtonProps } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { useTheme } from '../ThemeProvider/ThemeProvider';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';

/**
 * The control in a header that flips the page between light and dark.
 *
 * BOTH FACES ARE RENDERED AND THE STYLESHEET DISPLAYS ONE (spec §2): a sun and
 * "Switch to dark theme" while light shows, a moon and "Switch to light
 * theme" while dark does. `useTheme()`'s `resolvedTheme` is undefined on the
 * server and the first client render, so a face picked from it would be a
 * placeholder that swaps after hydration on every load. The stylesheet
 * chooses from `:root[data-pp-theme]` and, with no attribute, from
 * `prefers-color-scheme` — the tokens' own four scopes read from the
 * toggle's side — so the face and the page's colours cannot disagree, before
 * hydration or after. `display: none` takes the hidden face out of the
 * accessibility tree too, so the displayed label is the button's whole name.
 *
 * BUTTON WITH ICONBUTTON'S CLASS, NOT ICONBUTTON (spec §4): IconButton's
 * required `label` is an `aria-label`, which would override the content, and
 * the content is the point. The root carries `pp-button pp-icon-button
 * pp-theme-toggle`, so Button draws it, IconButton.css squares it (D-070 §1's
 * two-class contract), and this component's own rules choose the face.
 *
 * NO ARIA STATE (spec §6): which theme is "on" is arbitrary, and it would be
 * an attribute written after mount. A plain button named for what it does.
 *
 * Sizing contract: hug, square. RSC: client. Spec: docs/specs/ThemeToggle.md
 */

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

export interface ThemeToggleProps extends Omit<ButtonProps, 'children' | 'asChild' | 'aria-label' | 'loading'> {
  /** The name while light shows: what a press does. */
  darkLabel?: string;
  /** The name while dark shows. */
  lightLabel?: string;
  /** Shown while light shows. A sun by default. */
  lightIcon?: ReactNode;
  /** Shown while dark shows. A moon by default. */
  darkIcon?: ReactNode;
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function Moon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  );
}

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(function ThemeToggle(
  {
    darkLabel = 'Switch to dark theme',
    lightLabel = 'Switch to light theme',
    lightIcon = <Sun />,
    darkIcon = <Moon />,
    variant = 'ghost',
    size = 'md',
    className,
    onClick,
    ...props
  },
  ref,
) {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (isProduction()) return;
    if (darkLabel.trim() === '' || lightLabel.trim() === '') {
      console.warn('[pixel-perfect] <ThemeToggle> was given an empty label; the button would have no name while that theme shows.');
    }
  }, [darkLabel, lightLabel]);

  const flip = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button ref={ref} className={cx('pp-icon-button', 'pp-theme-toggle', className)} variant={variant} size={size} onClick={flip} {...props}>
      {/* `size` passes straight through, as IconButton's does: Icon's steps are the right icon sizes for the control heights. */}
      <Icon decorative size={size} className="pp-theme-toggle__icon" data-when="light">
        {lightIcon}
      </Icon>
      <Icon decorative size={size} className="pp-theme-toggle__icon" data-when="dark">
        {darkIcon}
      </Icon>
      <VisuallyHidden className="pp-theme-toggle__label" data-when="light">
        {darkLabel}
      </VisuallyHidden>
      <VisuallyHidden className="pp-theme-toggle__label" data-when="dark">
        {lightLabel}
      </VisuallyHidden>
    </Button>
  );
});
