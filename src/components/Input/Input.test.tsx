import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Input } from './Input';

describe('Input', () => {
  describe('the precedence rule', () => {
    it('takes size, required, disabled and invalid from the field', () => {
      const { getByRole, container } = renderWithTheme(
        <Field label="Email" size="lg" required disabled error="Bad">
          <Input />
        </Field>,
      );
      const root = container.querySelector('.pp-input');
      const control = getByRole('textbox');

      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root).toHaveAttribute('data-invalid');
      expect(root).toHaveAttribute('data-disabled');
      expect(control).toBeRequired();
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute('aria-invalid', 'true');
    });

    it('lets an explicit prop beat the field, for every one of the four', () => {
      const { container } = renderWithTheme(
        <Field label="Email" size="lg" required disabled error="Bad">
          <Input size="sm" required={false} disabled={false} invalid={false} />
        </Field>,
      );
      const root = container.querySelector('.pp-input');
      const control = container.querySelector('input');

      expect(root).toHaveAttribute('data-size', 'sm');
      expect(root).not.toHaveAttribute('data-invalid');
      expect(root).not.toHaveAttribute('data-disabled');
      expect(control).not.toBeRequired();
      expect(control).not.toBeDisabled();
    });

    /*
     * The case the rule is stated for. "Explicit wins" is a rule you can hold
     * in your head; "explicit wins except for disabled" is one you look up, so
     * this asserts the awkward half rather than the comfortable one.
     */
    it('enables a control that opts out of a disabled field', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Email" disabled>
          <Input disabled={false} />
        </Field>,
      );
      expect(getByRole('textbox')).not.toBeDisabled();
    });

    it('falls back to md and valid with no field above it', () => {
      const { container, getByRole } = renderWithTheme(<Input aria-label="Email" />);
      expect(container.querySelector('.pp-input')).toHaveAttribute('data-size', 'md');
      expect(getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('standalone invalid', () => {
    /* D-036 gave Field no `invalid` prop because `error` is its invalid state.
       A control outside a Field has no error, so it needs one of its own. */
    it('is invalid with no field and no error message', () => {
      const { container, getByRole } = renderWithTheme(<Input aria-label="Email" invalid />);
      expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
      expect(container.querySelector('.pp-input')).toHaveAttribute('data-pp-tone', 'danger');
    });
  });

  describe('field wiring', () => {
    it('is named by the field label and described by what actually rendered', () => {
      const { getByLabelText } = renderWithTheme(
        <Field label="Email address" description="For receipts." error="Required">
          <Input />
        </Field>,
      );
      const control = getByLabelText('Email address');
      const described = control.getAttribute('aria-describedby')?.split(' ') ?? [];

      expect(described).toHaveLength(2);
      for (const id of described) expect(document.getElementById(id)).not.toBeNull();
    });

    it('points aria-describedby at nothing when neither rendered', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Email">
          <Input />
        </Field>,
      );
      expect(getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    });

    it('moves focus to the control when the field label is clicked', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderWithTheme(
        <Field label="Email address">
          <Input />
        </Field>,
      );
      await user.click(getByText('Email address'));
      expect(getByRole('textbox')).toHaveFocus();
    });

    it('lets an explicit id beat the field-generated one', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Email" controlId="email">
          <Input id="other" />
        </Field>,
      );
      expect(getByRole('textbox')).toHaveAttribute('id', 'other');
    });
  });

  describe('state', () => {
    it('exposes readonly without disabling the control', async () => {
      const user = userEvent.setup();
      const { container, getByRole } = renderWithTheme(
        <Input aria-label="Email" readOnly defaultValue="a@b.c" />,
      );
      const control = getByRole('textbox');

      expect(container.querySelector('.pp-input')).toHaveAttribute('data-readonly');
      expect(control).not.toBeDisabled();
      await user.click(control);
      expect(control).toHaveFocus();
    });
  });

  describe('API surface', () => {
    it('forwards ref to the control, not to the wrapper', () => {
      const ref = createRef<HTMLInputElement>();
      renderWithTheme(<Input aria-label="Email" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toHaveClass('pp-input__control');
    });

    /* D-039 §1: the root is the box, the control is the element. */
    it('puts className and style on the root and everything else on the control', () => {
      const { container } = renderWithTheme(
        <Input aria-label="Email" className="mine" style={{ opacity: 0.5 }} placeholder="you@" />,
      );
      const root = container.querySelector('.pp-input') as HTMLElement;

      expect(root).toHaveClass('pp-input', 'mine');
      expect(root.style.opacity).toBe('0.5');
      expect(container.querySelector('input')).toHaveAttribute('placeholder', 'you@');
    });

    it('passes the native change event, not a bare value', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { getByRole } = renderWithTheme(<Input aria-label="Email" onChange={onChange} />);

      await user.type(getByRole('textbox'), 'a');
      expect(onChange).toHaveBeenCalledOnce();
      /* §2: wrapping React's own input would hand callers a string here, which
         react-hook-form cannot register and which cannot read .validity. */
      expect(onChange.mock.calls[0]?.[0]).toHaveProperty('target');
    });

    /*
     * RULES §5.5 wants both modes. It gets them from React rather than from
     * useControllableState (§2): wrapping React's own input would hand callers
     * an onChange taking a string, which react-hook-form cannot register.
     *
     * Two renders, not one with a rerender. Switching a mounted input between
     * modes does not re-seed it — React keeps the DOM node and `defaultValue`
     * only applies on mount — so asserting that would be asserting a bug. It is
     * the same mode-switch hazard useControllableState warns about in D-032.
     */
    it('is controlled: typing does not move a pinned value', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <Input aria-label="Email" value="fixed" onChange={() => {}} />,
      );
      const control = getByRole('textbox') as HTMLInputElement;

      await user.type(control, 'x');
      expect(control.value).toBe('fixed');
    });

    it('is uncontrolled: it seeds from defaultValue and then accepts typing', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Input aria-label="Email" defaultValue="seed" />);
      const control = getByRole('textbox') as HTMLInputElement;

      expect(control.value).toBe('seed');
      await user.type(control, '!');
      expect(control.value).toBe('seed!');
    });

    it('never sets the HTML size attribute', () => {
      const { container } = renderWithTheme(<Input aria-label="Email" size="lg" />);
      /* The attribute counts characters — a control sizing itself, in the one
         place RULES §1 would not think to look. */
      expect(container.querySelector('input')).not.toHaveAttribute('size');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations inside a field', async () => {
      const { container } = renderWithTheme(
        <Field label="Email address" description="For receipts.">
          <Input type="email" />
        </Field>,
      );
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when invalid, disabled or read-only', async () => {
      const { container } = renderWithTheme(
        <>
          <Field label="A" error="Bad">
            <Input />
          </Field>
          <Field label="B" disabled>
            <Input />
          </Field>
          <Input aria-label="C" readOnly defaultValue="x" />
        </>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
