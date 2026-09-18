import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Textarea } from './Textarea';

/*
 * WHAT IS DELIBERATELY NOT ASSERTED HERE.
 *
 * Auto-resize is arithmetic over `scrollHeight`, and jsdom has no layout: every
 * box is 0×0, so a height assertion in this file would pass against a component
 * that computes nothing. The behaviour is asserted in tests/visual/harness.spec.ts
 * where layout exists — the standing rule since D-030 §2, when a jsdom test
 * passed against a Button whose loading label had been removed from the
 * accessibility tree.
 *
 * What IS asserted here is everything auto-resize does to the DOM rather than to
 * the layout: the attribute, the forced resize mode, the chained handler, and
 * the fact that turning it off hands the height back.
 */
describe('Textarea', () => {
  describe('the precedence rule', () => {
    it('takes size, required, disabled and invalid from the field', () => {
      const { getByRole, container } = renderWithTheme(
        <Field label="Notes" size="lg" required disabled error="Bad">
          <Textarea />
        </Field>,
      );
      const root = container.querySelector('.pp-textarea');
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
        <Field label="Notes" size="lg" required disabled error="Bad">
          <Textarea size="sm" required={false} disabled={false} invalid={false} />
        </Field>,
      );
      const root = container.querySelector('.pp-textarea');
      const control = container.querySelector('textarea');

      expect(root).toHaveAttribute('data-size', 'sm');
      expect(root).not.toHaveAttribute('data-invalid');
      expect(root).not.toHaveAttribute('data-disabled');
      expect(control).not.toBeRequired();
      expect(control).not.toBeDisabled();
    });

    /* The awkward half of the rule, asserted rather than the comfortable one:
       "explicit wins except for disabled" is a rule you have to look up. */
    it('enables a control that opts out of a disabled field', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Notes" disabled>
          <Textarea disabled={false} />
        </Field>,
      );
      expect(getByRole('textbox')).not.toBeDisabled();
    });

    it('falls back to md and valid with no field above it', () => {
      const { container, getByRole } = renderWithTheme(<Textarea aria-label="Notes" />);
      expect(container.querySelector('.pp-textarea')).toHaveAttribute('data-size', 'md');
      expect(getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('standalone invalid', () => {
    it('is invalid with no field and no error message', () => {
      const { container, getByRole } = renderWithTheme(<Textarea aria-label="Notes" invalid />);
      expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
      expect(container.querySelector('.pp-textarea')).toHaveAttribute('data-pp-tone', 'danger');
    });
  });

  describe('field wiring', () => {
    it('is named by the field label and described by what actually rendered', () => {
      const { getByLabelText } = renderWithTheme(
        <Field label="Release notes" description="Markdown is supported." error="Required">
          <Textarea />
        </Field>,
      );
      const control = getByLabelText('Release notes');
      const described = control.getAttribute('aria-describedby')?.split(' ') ?? [];

      expect(described).toHaveLength(2);
      for (const id of described) expect(document.getElementById(id)).not.toBeNull();
    });

    it('points aria-describedby at nothing when neither rendered', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Notes">
          <Textarea />
        </Field>,
      );
      expect(getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    });

    it('moves focus to the control when the field label is clicked', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderWithTheme(
        <Field label="Release notes">
          <Textarea />
        </Field>,
      );
      await user.click(getByText('Release notes'));
      expect(getByRole('textbox')).toHaveFocus();
    });

    it('lets an explicit id beat the field-generated one', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Notes" controlId="notes">
          <Textarea id="other" />
        </Field>,
      );
      expect(getByRole('textbox')).toHaveAttribute('id', 'other');
    });
  });

  describe('rows and resize', () => {
    it('defaults to three rows, and passes an explicit count through', () => {
      const { container, rerender } = renderWithTheme(<Textarea aria-label="Notes" />);
      expect(container.querySelector('textarea')).toHaveAttribute('rows', '3');

      rerender(<Textarea aria-label="Notes" rows={8} />);
      expect(container.querySelector('textarea')).toHaveAttribute('rows', '8');
    });

    it('defaults to vertical resize and exposes the choice on the root', () => {
      const { container, rerender } = renderWithTheme(<Textarea aria-label="Notes" />);
      expect(container.querySelector('.pp-textarea')).toHaveAttribute('data-resize', 'vertical');

      rerender(<Textarea aria-label="Notes" resize="none" />);
      expect(container.querySelector('.pp-textarea')).toHaveAttribute('data-resize', 'none');
    });
  });

  describe('autoResize', () => {
    it('is off by default and exposes nothing', () => {
      const { container } = renderWithTheme(<Textarea aria-label="Notes" />);
      expect(container.querySelector('.pp-textarea')).not.toHaveAttribute('data-auto-resize');
    });

    it('exposes data-auto-resize, which is what forces resize off in CSS', () => {
      const { container } = renderWithTheme(<Textarea aria-label="Notes" autoResize />);
      /* The root still reports the caller's `resize`; the CSS overrides it from
         this attribute, so the two are not in conflict in the DOM. */
      expect(container.querySelector('.pp-textarea')).toHaveAttribute('data-auto-resize');
      expect(container.querySelector('.pp-textarea')).toHaveAttribute('data-resize', 'vertical');
    });

    it('still calls an onInput the caller passed', async () => {
      const user = userEvent.setup();
      const onInput = vi.fn();
      const { getByRole } = renderWithTheme(
        <Textarea aria-label="Notes" autoResize onInput={onInput} />,
      );

      await user.type(getByRole('textbox'), 'ab');
      /* Measuring on input must not swallow the handler it measures alongside —
         the failure mode of every wrapper that "just adds a listener". */
      expect(onInput).toHaveBeenCalledTimes(2);
    });

    it('hands the height back when auto-resize is turned off', () => {
      const { container, rerender } = renderWithTheme(<Textarea aria-label="Notes" autoResize />);
      const control = container.querySelector('textarea') as HTMLTextAreaElement;

      /* jsdom reports every box as 0, so the written height is "0px" — worth
         nothing as a measurement and everything as a marker that the component
         wrote one at all. */
      control.style.blockSize = '120px';
      rerender(<Textarea aria-label="Notes" autoResize={false} />);
      expect(control.style.blockSize).toBe('');
    });
  });

  describe('state', () => {
    it('exposes readonly without disabling the control', async () => {
      const user = userEvent.setup();
      const { container, getByRole } = renderWithTheme(
        <Textarea aria-label="Notes" readOnly defaultValue="fixed" />,
      );
      const control = getByRole('textbox');

      expect(container.querySelector('.pp-textarea')).toHaveAttribute('data-readonly');
      expect(control).not.toBeDisabled();
      await user.click(control);
      expect(control).toHaveFocus();
    });
  });

  describe('API surface', () => {
    it('forwards ref to the control, not to the wrapper', () => {
      const ref = createRef<HTMLTextAreaElement>();
      renderWithTheme(<Textarea aria-label="Notes" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current).toHaveClass('pp-textarea__control');
    });

    /* The forwarded ref is MERGED with the internal one auto-resize measures
       through, so a caller's ref must survive the merge in both modes. */
    it('forwards ref with auto-resize on, where it shares the element', () => {
      const ref = createRef<HTMLTextAreaElement>();
      renderWithTheme(<Textarea aria-label="Notes" autoResize ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('puts className and style on the root and everything else on the control', () => {
      const { container } = renderWithTheme(
        <Textarea
          aria-label="Notes"
          className="mine"
          style={{ opacity: 0.5 }}
          placeholder="Say something"
        />,
      );
      const root = container.querySelector('.pp-textarea') as HTMLElement;

      expect(root).toHaveClass('pp-textarea', 'mine');
      expect(root.style.opacity).toBe('0.5');
      expect(container.querySelector('textarea')).toHaveAttribute('placeholder', 'Say something');
    });

    it('passes the native change event, not a bare value', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { getByRole } = renderWithTheme(<Textarea aria-label="Notes" onChange={onChange} />);

      await user.type(getByRole('textbox'), 'a');
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0]?.[0]).toHaveProperty('target');
    });

    /* Both modes come from React rather than from useControllableState (spec
       §2): wrapping React's own textarea would hand callers an onChange taking
       a string, which react-hook-form cannot register. Two renders rather than
       one rerender — switching a mounted control between modes does not re-seed
       it, so asserting that would be asserting a bug (D-032). */
    it('is controlled: typing does not move a pinned value', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <Textarea aria-label="Notes" value="fixed" onChange={() => {}} />,
      );
      const control = getByRole('textbox') as HTMLTextAreaElement;

      await user.type(control, 'x');
      expect(control.value).toBe('fixed');
    });

    it('is uncontrolled: it seeds from defaultValue and then accepts typing', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Textarea aria-label="Notes" defaultValue="seed" />);
      const control = getByRole('textbox') as HTMLTextAreaElement;

      expect(control.value).toBe('seed');
      await user.type(control, '!');
      expect(control.value).toBe('seed!');
    });

    it('never sets a block-size when auto-resize is off', () => {
      const { container } = renderWithTheme(<Textarea aria-label="Notes" rows={5} />);
      /* The height is `rows`, content, or the caller's. A component that writes
         one anyway has taken the block axis off the caller silently. */
      expect((container.querySelector('textarea') as HTMLTextAreaElement).style.blockSize).toBe('');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations inside a field', async () => {
      const { container } = renderWithTheme(
        <Field label="Release notes" description="Markdown is supported.">
          <Textarea />
        </Field>,
      );
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when invalid, disabled or read-only', async () => {
      const { container } = renderWithTheme(
        <>
          <Field label="A" error="Bad">
            <Textarea />
          </Field>
          <Field label="B" disabled>
            <Textarea />
          </Field>
          <Textarea aria-label="C" readOnly defaultValue="x" />
        </>,
      );
      await expectNoA11yViolations(container);
    });

    /* Tab moves focus OUT. A textarea is the one place developers are tempted
       to trap it, and trapping Tab strands every keyboard user in the field. */
    it('lets Tab leave the control instead of inserting a tab character', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <>
          <Textarea aria-label="Notes" />
          <button type="button">After</button>
        </>,
      );
      const control = getByRole('textbox') as HTMLTextAreaElement;

      await user.click(control);
      await user.tab();

      expect(getByRole('button', { name: 'After' })).toHaveFocus();
      expect(control.value).toBe('');
    });
  });
});
