import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import { Input } from '../Input/Input';
import { InputGroup, InputGroupAddon } from './InputGroup';

/*
 * WHAT IS DELIBERATELY NOT ASSERTED HERE: the one box, the ring on the group
 * and the spacing. They are computed styles, and jsdom implements neither
 * cascade layers nor `:has()`; they are in tests/visual/harness.spec.ts.
 * What is asserted here is who owns size, invalid and disabled, and what a
 * press on the box does.
 */

const Glyph = () => (
  <svg viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" />
  </svg>
);

/** `label={null}` inside a Field, whose label names the Input. */
function Search({ label = 'Search', ...props }: Parameters<typeof InputGroup>[0] & { label?: string | null }) {
  return (
    <InputGroup {...props}>
      <InputGroupAddon>
        <Icon decorative>
          <Glyph />
        </Icon>
      </InputGroupAddon>
      <Input aria-label={label ?? undefined} />
      <InputGroupAddon>EUR</InputGroupAddon>
    </InputGroup>
  );
}

const root = () => document.querySelector('.pp-input-group') as HTMLElement;
const input = () => document.querySelector('.pp-input') as HTMLElement;

describe('InputGroup', () => {
  it('is a fill box around an Input and its addons, in DOM order (spec §1)', () => {
    const { getByRole } = renderWithTheme(<Search />);
    expect(root()).toHaveAttribute('data-size', 'md');
    expect(root()).not.toHaveAttribute('data-invalid');
    expect(root()).not.toHaveAttribute('data-pp-tone');
    const parts = [...root().children].map((n) => n.className);
    expect(parts).toEqual(['pp-input-group__addon', 'pp-input', 'pp-input-group__addon']);
    expect(getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
  });

  describe('the precedence rule (spec §2)', () => {
    it('takes size, invalid and disabled from the field, and hands them to the Input', () => {
      renderWithTheme(
        <Field label="Price" size="lg" disabled error="Too low">
          <Search />
        </Field>,
      );
      expect(root()).toHaveAttribute('data-size', 'lg');
      expect(root()).toHaveAttribute('data-invalid');
      expect(root()).toHaveAttribute('data-disabled');
      expect(root()).toHaveAttribute('data-pp-tone', 'danger');
      expect(input()).toHaveAttribute('data-size', 'lg');
      expect(input()).toHaveAttribute('data-invalid');
      expect(document.querySelector('input')).toBeDisabled();
    });

    it('lets its own props beat the field, and passes them on', () => {
      renderWithTheme(
        <Field label="Price" size="lg" disabled error="Too low">
          <Search size="sm" invalid={false} disabled={false} />
        </Field>,
      );
      expect(root()).toHaveAttribute('data-size', 'sm');
      expect(root()).not.toHaveAttribute('data-invalid');
      expect(root()).not.toHaveAttribute('data-disabled');
      expect(input()).toHaveAttribute('data-size', 'sm');
      expect(input()).not.toHaveAttribute('data-invalid');
      expect(document.querySelector('input')).not.toBeDisabled();
    });

    it('works standalone, with invalid as its own prop', () => {
      renderWithTheme(<Search size="sm" invalid />);
      expect(root()).toHaveAttribute('data-pp-tone', 'danger');
      expect(input()).toHaveAttribute('data-size', 'sm');
      expect(document.querySelector('input')).toHaveAttribute('aria-invalid', 'true');
    });

    it('still lets the Input’s own prop win', () => {
      renderWithTheme(
        <InputGroup size="lg">
          <Input aria-label="Code" size="sm" />
        </InputGroup>,
      );
      expect(input()).toHaveAttribute('data-size', 'sm');
    });

    it('keeps the field’s id and description on the Input', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Price" description="Before tax">
          <Search label={null} />
        </Field>,
      );
      const control = getByRole('textbox', { name: 'Price' });
      expect(control).toHaveAccessibleDescription('Before tax');
    });
  });

  describe('a press on the box (spec §4)', () => {
    it('focuses the Input when it lands on an icon, a unit or the padding', async () => {
      const user = userEvent.setup();
      renderWithTheme(<Search />);
      const [start, end] = [...document.querySelectorAll<HTMLElement>('.pp-input-group__addon')];
      await user.click(end!);
      expect(document.querySelector('input')).toHaveFocus();
      (document.activeElement as HTMLElement).blur();
      await user.click(start!);
      expect(document.querySelector('input')).toHaveFocus();
      (document.activeElement as HTMLElement).blur();
      await user.click(root());
      expect(document.querySelector('input')).toHaveFocus();
    });

    it('leaves a button in an addon to do its own job', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const { getByRole } = renderWithTheme(
        <InputGroup>
          <Input aria-label="Password" type="password" />
          <InputGroupAddon>
            <IconButton label="Show password" size="sm" variant="ghost" onClick={onClick}>
              <Glyph />
            </IconButton>
          </InputGroupAddon>
        </InputGroup>,
      );
      await user.click(getByRole('button', { name: 'Show password' }));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(getByRole('button', { name: 'Show password' })).toHaveFocus();
    });

    it('does not focus a disabled Input, and calls the consumer’s handler first', async () => {
      const user = userEvent.setup();
      const onMouseDown = vi.fn();
      renderWithTheme(<Search disabled onMouseDown={onMouseDown} />);
      await user.click(document.querySelector<HTMLElement>('.pp-input-group__addon')!);
      expect(onMouseDown).toHaveBeenCalledTimes(1);
      expect(document.querySelector('input')).not.toHaveFocus();
    });

    it('respects a handler that prevented the default', async () => {
      const user = userEvent.setup();
      renderWithTheme(<Search onMouseDown={(e) => e.preventDefault()} />);
      await user.click(document.querySelector<HTMLElement>('.pp-input-group__addon')!);
      expect(document.querySelector('input')).not.toHaveFocus();
    });
  });

  it('forwards refs, merges className and style, and spreads the rest (RULES §5)', () => {
    const ref = createRef<HTMLDivElement>();
    const addonRef = createRef<HTMLSpanElement>();
    renderWithTheme(
      <InputGroup ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="group" aria-label="x">
        <InputGroupAddon ref={addonRef} className="unit" data-testid="unit">
          kg
        </InputGroupAddon>
        <Input aria-label="Weight" />
      </InputGroup>,
    );
    expect(ref.current).toBe(root());
    expect(root()).toHaveClass('pp-input-group', 'mine');
    expect(root()).toHaveStyle({ opacity: '0.5' });
    expect(root()).toHaveAttribute('data-testid', 'group');
    expect(addonRef.current).toHaveClass('pp-input-group__addon', 'unit');
    expect(addonRef.current).toHaveAttribute('data-testid', 'unit');
  });

  it('carries a password reveal built from its parts', async () => {
    const user = userEvent.setup();
    function Password() {
      const [shown, setShown] = useState(false);
      return (
        <InputGroup>
          <Input aria-label="Password" type={shown ? 'text' : 'password'} />
          <InputGroupAddon>
            <IconButton
              label={shown ? 'Hide password' : 'Show password'}
              size="sm"
              variant="ghost"
              onClick={() => setShown((s) => !s)}
            >
              <Glyph />
            </IconButton>
          </InputGroupAddon>
        </InputGroup>
      );
    }
    const { getByRole, getByLabelText } = renderWithTheme(<Password />);
    expect(getByLabelText('Password')).toHaveAttribute('type', 'password');
    await user.click(getByRole('button', { name: 'Show password' }));
    expect(getByLabelText('Password')).toHaveAttribute('type', 'text');
  });

  it('has no axe violations, standalone, in a field, invalid and disabled', async () => {
    const { container } = renderWithTheme(
      <div>
        <Search />
        <Field label="Price" error="Too low">
          <Search label={null} />
        </Field>
        <Field label="Code" disabled>
          <Search label={null} />
        </Field>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
