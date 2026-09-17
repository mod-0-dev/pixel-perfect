import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a button carrying both classes, off by default', () => {
    const { getByRole } = renderWithTheme(<Toggle>Bold</Toggle>);
    const el = getByRole('button', { name: 'Bold' });

    expect(el).toHaveClass('pp-button', 'pp-toggle');
    expect(el).toHaveAttribute('data-state', 'off');
    expect(el).toHaveAttribute('data-variant', 'ghost');
  });

  it('always carries aria-pressed, in both states', () => {
    const { getByRole, rerender } = renderWithTheme(<Toggle pressed={false}>Bold</Toggle>);
    // Never absent. A button with no aria-pressed is announced as a plain
    // button, and the user is simply never told it has two states.
    expect(getByRole('button')).toHaveAttribute('aria-pressed', 'false');

    rerender(<Toggle pressed>Bold</Toggle>);
    expect(getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  describe('uncontrolled', () => {
    it('starts from defaultPressed and toggles on click', async () => {
      const onPressedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Toggle defaultPressed onPressedChange={onPressedChange}>
          Bold
        </Toggle>,
      );
      const el = getByRole('button');
      expect(el).toHaveAttribute('data-state', 'on');

      await userEvent.click(el);
      expect(el).toHaveAttribute('data-state', 'off');
      expect(el).toHaveAttribute('aria-pressed', 'false');
      expect(onPressedChange).toHaveBeenLastCalledWith(false);

      await userEvent.click(el);
      expect(el).toHaveAttribute('data-state', 'on');
      expect(onPressedChange).toHaveBeenLastCalledWith(true);
    });

    it('defaults to off', () => {
      const { getByRole } = renderWithTheme(<Toggle>Bold</Toggle>);
      expect(getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('controlled', () => {
    it('does not move on its own — the owner decides', async () => {
      const onPressedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Toggle pressed={false} onPressedChange={onPressedChange}>
          Bold
        </Toggle>,
      );
      const el = getByRole('button');

      await userEvent.click(el);
      // The handler fired, the state did not: the parent owns it.
      expect(onPressedChange).toHaveBeenCalledWith(true);
      expect(el).toHaveAttribute('data-state', 'off');
    });

    it('follows the owner when it updates', async () => {
      function Owner() {
        const [on, setOn] = useState(false);
        return (
          <Toggle pressed={on} onPressedChange={setOn}>
            Bold
          </Toggle>
        );
      }
      const { getByRole } = renderWithTheme(<Owner />);
      const el = getByRole('button');

      await userEvent.click(el);
      expect(el).toHaveAttribute('data-state', 'on');
      await userEvent.click(el);
      expect(el).toHaveAttribute('data-state', 'off');
    });

    it('warns when it changes mode mid-life, instead of failing silently', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { rerender } = renderWithTheme(<Toggle pressed={false}>Bold</Toggle>);
      expect(warn).not.toHaveBeenCalled();

      rerender(<Toggle>Bold</Toggle>);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('changed from controlled to uncontrolled'),
      );
    });
  });

  it('takes no `loading` — a toggle’s effect is immediate by definition', () => {
    const { getByRole } = renderWithTheme(
      // @ts-expect-error `loading` is omitted from ToggleProps
      <Toggle loading>Bold</Toggle>,
    );
    // Omitted from the type AND dropped before forwarding (D-031): a stray
    // `loading` must not reach Button and hide the label.
    const el = getByRole('button', { name: 'Bold' });
    expect(el).not.toHaveAttribute('data-loading');
    expect(el.querySelector('.pp-spinner')).toBeNull();
  });

  describe('interaction', () => {
    it('does not toggle when disabled', async () => {
      const onPressedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Toggle disabled onPressedChange={onPressedChange}>
          Bold
        </Toggle>,
      );
      await userEvent.click(getByRole('button'));
      expect(onPressedChange).not.toHaveBeenCalled();
      expect(getByRole('button')).toHaveAttribute('data-state', 'off');
    });

    it('respects a consumer preventDefault', async () => {
      const onPressedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Toggle onClick={(event) => event.preventDefault()} onPressedChange={onPressedChange}>
          Bold
        </Toggle>,
      );
      await userEvent.click(getByRole('button'));
      expect(onPressedChange).not.toHaveBeenCalled();
    });

    it.each(['{Enter}', ' '])('toggles on %s', async (key) => {
      const { getByRole } = renderWithTheme(<Toggle>Bold</Toggle>);
      const el = getByRole('button');
      el.focus();
      await userEvent.keyboard(key);
      expect(el).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('API surface (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLButtonElement>();
      renderWithTheme(<Toggle ref={ref}>Bold</Toggle>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveClass('pp-toggle');
    });

    it('merges className and spreads the rest', () => {
      const { getByRole } = renderWithTheme(
        <Toggle className="app-bold" data-testid="bold" aria-label="Bold" tone="accent" size="sm">
          B
        </Toggle>,
      );
      const el = getByRole('button', { name: 'Bold' });
      expect(el).toHaveClass('pp-button', 'pp-toggle', 'app-bold');
      expect(el).toHaveAttribute('data-testid', 'bold');
      expect(el).toHaveAttribute('data-pp-tone', 'accent');
      expect(el).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('accessibility', () => {
    it.each([false, true])('has no axe violations — pressed=%s', async (pressed) => {
      const { container } = renderWithTheme(<Toggle pressed={pressed}>Show archived</Toggle>);
      await expectNoA11yViolations(container);
    });

    it('keeps one name across both states', async () => {
      const { getByRole } = renderWithTheme(<Toggle aria-label="Bold">B</Toggle>);
      const el = getByRole('button');
      expect(el).toHaveAccessibleName('Bold');

      await userEvent.click(el);
      // A name that flips between "Bold" and "Unbold" is announced as a
      // DIFFERENT control appearing. The state is announced separately.
      expect(el).toHaveAccessibleName('Bold');
      expect(el).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
