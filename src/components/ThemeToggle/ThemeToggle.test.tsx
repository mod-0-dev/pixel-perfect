import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { ThemeProvider } from '../ThemeProvider/ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

const html = () => document.documentElement;

function mockSystem(dark: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    () => ({ matches: dark, media: '', addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
  );
}

const faces = (root: HTMLElement) => ({
  icons: Array.from(root.querySelectorAll('.pp-theme-toggle__icon')).map((n) => n.getAttribute('data-when')),
  labels: Array.from(root.querySelectorAll('.pp-theme-toggle__label')).map((n) => [n.getAttribute('data-when'), n.textContent]),
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    html().removeAttribute('data-pp-theme');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    html().removeAttribute('data-pp-theme');
  });

  it('is a Button carrying IconButton\'s class, ghost and md by default, with both faces and both labels (spec §2, §4)', () => {
    mockSystem(false);
    const { getByRole } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    const button = getByRole('button');
    expect(button).toHaveClass('pp-button', 'pp-icon-button', 'pp-theme-toggle');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).toHaveAttribute('data-pp-tone', 'neutral');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('aria-label');
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(faces(button)).toEqual({
      icons: ['light', 'dark'],
      labels: [
        ['light', 'Switch to dark theme'],
        ['dark', 'Switch to light theme'],
      ],
    });
    for (const icon of button.querySelectorAll('.pp-theme-toggle__icon')) expect(icon).toHaveAttribute('aria-hidden', 'true');
    for (const label of button.querySelectorAll('.pp-theme-toggle__label')) expect(label).toHaveClass('pp-visually-hidden');
  });

  it('a press sets the opposite of what is showing: light → dark, dark → light, system on a dark system → light (spec §1)', async () => {
    mockSystem(true);
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <ThemeProvider onValueChange={onValueChange}>
        <ThemeToggle />
      </ThemeProvider>,
    );
    await user.click(getByRole('button')); // system, dark system → light
    expect(onValueChange).toHaveBeenLastCalledWith('light');
    expect(html()).toHaveAttribute('data-pp-theme', 'light');
    await user.click(getByRole('button')); // light → dark
    expect(onValueChange).toHaveBeenLastCalledWith('dark');
    expect(html()).toHaveAttribute('data-pp-theme', 'dark');
    await user.click(getByRole('button')); // dark → light
    expect(onValueChange).toHaveBeenLastCalledWith('light');
  });

  it('onClick runs first, and preventDefault keeps the theme; disabled presses nothing', async () => {
    mockSystem(false);
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { getByRole, rerender } = render(
      <ThemeProvider onValueChange={onValueChange}>
        <ThemeToggle onClick={(e) => e.preventDefault()} />
      </ThemeProvider>,
    );
    await user.click(getByRole('button'));
    expect(onValueChange).not.toHaveBeenCalled();
    rerender(
      <ThemeProvider onValueChange={onValueChange}>
        <ThemeToggle disabled />
      </ThemeProvider>,
    );
    await user.click(getByRole('button'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('takes custom labels and icons, size, variant, tone; forwards the ref and merges className and style', () => {
    mockSystem(false);
    const ref = createRef<HTMLButtonElement>();
    const { getByRole } = render(
      <ThemeProvider>
        <ThemeToggle
          ref={ref}
          size="sm"
          variant="outline"
          tone="accent"
          className="c"
          style={{ opacity: 0.5 }}
          data-testid="t"
          darkLabel="Zum dunklen Design"
          lightLabel="Zum hellen Design"
          lightIcon={<svg data-testid="sun" />}
          darkIcon={<svg data-testid="moon" />}
        />
      </ThemeProvider>,
    );
    const button = getByRole('button');
    expect(ref.current).toBe(button);
    expect(button).toHaveClass('pp-button', 'pp-icon-button', 'pp-theme-toggle', 'c');
    expect(button).toHaveStyle({ opacity: '0.5' });
    expect(button).toHaveAttribute('data-testid', 't');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-pp-tone', 'accent');
    expect(faces(button).labels).toEqual([
      ['light', 'Zum dunklen Design'],
      ['dark', 'Zum hellen Design'],
    ]);
    expect(button.querySelector('[data-when="light"] [data-testid="sun"]')).not.toBeNull();
    expect(button.querySelector('[data-when="dark"] [data-testid="moon"]')).not.toBeNull();
  });

  it('warns in development about an empty label', () => {
    mockSystem(false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ThemeProvider>
        <ThemeToggle darkLabel="" />
      </ThemeProvider>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('empty label'));
  });

  it('throws outside a ThemeProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeToggle />)).toThrow('useTheme() must be called under a <ThemeProvider>');
  });

  it('passes axe in both themes', async () => {
    mockSystem(false);
    for (const theme of ['light', 'dark'] as const) {
      const { container, unmount } = renderWithTheme(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
        { theme },
      );
      await expectNoA11yViolations(container);
      unmount();
    }
  });
});
