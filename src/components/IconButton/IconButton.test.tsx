import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { IconButton } from './IconButton';

const SIZES = ['sm', 'md', 'lg'] as const;

function Trash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
    </svg>
  );
}

describe('IconButton', () => {
  it('is named by `label` and carries both classes', () => {
    const { getByRole } = renderWithTheme(
      <IconButton label="Delete row">
        <Trash />
      </IconButton>,
    );
    const el = getByRole('button', { name: 'Delete row' });

    expect(el.tagName).toBe('BUTTON');
    // Both, so every --pp-button-* override still applies.
    expect(el).toHaveClass('pp-button', 'pp-icon-button');
    expect(el).toHaveAttribute('aria-label', 'Delete row');
  });

  it('omitting `label` is a type error — the entire reason this component exists', () => {
    const { getByRole } = renderWithTheme(
      // @ts-expect-error `label` is required (RULES §6: the type system must make this impossible)
      <IconButton>
        <Trash />
      </IconButton>,
    );
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('hides the icon from assistive tech, so the control is not named twice', () => {
    const { getByRole } = renderWithTheme(
      <IconButton label="Delete row">
        <Trash />
      </IconButton>,
    );
    const el = getByRole('button');
    const icon = el.querySelector('.pp-icon')!;

    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('aria-label');
    expect(el).toHaveAccessibleName('Delete row');
  });

  it('defaults to ghost, not to Button’s solid', () => {
    const { getByRole } = renderWithTheme(
      <IconButton label="Close">
        <Trash />
      </IconButton>,
    );
    expect(getByRole('button')).toHaveAttribute('data-variant', 'ghost');
  });

  it.each(SIZES)('passes size=%s through to the icon, with no second scale', (size) => {
    const { getByRole } = renderWithTheme(
      <IconButton label="Close" size={size}>
        <Trash />
      </IconButton>,
    );
    const el = getByRole('button');
    expect(el).toHaveAttribute('data-size', size);
    expect(el.querySelector('.pp-icon')).toHaveAttribute('data-size', size);
  });

  it('takes no `asChild`, at the type level AND at runtime', () => {
    const { getByRole } = renderWithTheme(
      // @ts-expect-error `asChild` is omitted from IconButtonProps; there is no slot for a delegate
      <IconButton label="Close" asChild>
        <Trash />
      </IconButton>,
    );
    // Omitting it from the type does not delete the property. Forwarded to
    // Button it would delegate to the <Icon> element, producing a <span> with
    // a button's classes and none of a button's semantics — which is exactly
    // what this rendered before the prop was dropped explicitly.
    const el = getByRole('button', { name: 'Close' });
    expect(el.tagName).toBe('BUTTON');
    expect(el).not.toHaveClass('pp-icon');
  });

  describe('inherited Button behaviour', () => {
    it('is loading-aware, keeping the name and the tab order', () => {
      const { getByRole } = renderWithTheme(
        <IconButton label="Delete row" loading>
          <Trash />
        </IconButton>,
      );
      const el = getByRole('button', { name: 'Delete row' });
      expect(el).toHaveAttribute('data-loading', 'true');
      expect(el).toHaveAttribute('aria-disabled', 'true');
      expect(el).not.toBeDisabled();
      expect(el.querySelector('.pp-spinner')).toBeInTheDocument();
    });

    it('swallows the click while loading', async () => {
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(
        <IconButton label="Delete row" loading onClick={onClick}>
          <Trash />
        </IconButton>,
      );
      await userEvent.click(getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('defaults to type="button"', () => {
      const { getByRole } = renderWithTheme(
        <IconButton label="Close">
          <Trash />
        </IconButton>,
      );
      expect(getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('disables natively', () => {
      const { getByRole } = renderWithTheme(
        <IconButton label="Close" disabled>
          <Trash />
        </IconButton>,
      );
      expect(getByRole('button')).toBeDisabled();
    });
  });

  describe('API surface (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLButtonElement>();
      renderWithTheme(
        <IconButton ref={ref} label="Close">
          <Trash />
        </IconButton>,
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveClass('pp-icon-button');
    });

    it('merges className and style, and spreads the rest', async () => {
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(
        <IconButton
          label="Close"
          className="app-close"
          style={{ opacity: 0.5 }}
          data-testid="close"
          onClick={onClick}
        >
          <Trash />
        </IconButton>,
      );
      const el = getByRole('button');
      expect(el).toHaveClass('pp-button', 'pp-icon-button', 'app-close');
      expect(el).toHaveStyle({ opacity: '0.5' });
      expect(el).toHaveAttribute('data-testid', 'close');

      await userEvent.click(el);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderWithTheme(
        <IconButton label="Delete row" tone="danger">
          <Trash />
        </IconButton>,
      );
      await expectNoA11yViolations(container);
    });

    it('has no axe violations while loading', async () => {
      const { container } = renderWithTheme(
        <IconButton label="Delete row" loading>
          <Trash />
        </IconButton>,
      );
      await expectNoA11yViolations(container);
    });

    it('is reachable by Tab and activates on Enter', async () => {
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(
        <IconButton label="Close" onClick={onClick}>
          <Trash />
        </IconButton>,
      );
      await userEvent.tab();
      expect(document.activeElement).toBe(getByRole('button'));
      await userEvent.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
