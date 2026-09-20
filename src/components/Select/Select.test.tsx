import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Select } from './Select';

const OPTIONS = (
  <>
    <option value="preview">Preview</option>
    <option value="production">Production</option>
  </>
);

describe('Select', () => {
  describe('the precedence rule', () => {
    it('takes size, required, disabled and invalid from the field', () => {
      const { getByRole, container } = renderWithTheme(
        <Field label="Environment" size="lg" required disabled error="Bad">
          <Select>{OPTIONS}</Select>
        </Field>,
      );
      const root = container.querySelector('.pp-select');
      const control = getByRole('combobox');

      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root).toHaveAttribute('data-invalid');
      expect(root).toHaveAttribute('data-disabled');
      expect(control).toBeRequired();
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute('aria-invalid', 'true');
    });

    it('lets an explicit prop beat the field, for every one of the four', () => {
      const { container } = renderWithTheme(
        <Field label="Environment" size="lg" required disabled error="Bad">
          <Select size="sm" required={false} disabled={false} invalid={false}>
            {OPTIONS}
          </Select>
        </Field>,
      );
      const root = container.querySelector('.pp-select');
      const control = container.querySelector('select');

      expect(root).toHaveAttribute('data-size', 'sm');
      expect(root).not.toHaveAttribute('data-invalid');
      expect(root).not.toHaveAttribute('data-disabled');
      expect(control).not.toBeRequired();
      expect(control).not.toBeDisabled();
    });

    /* The awkward half, asserted rather than the comfortable one: "explicit
       wins" is a rule you can hold in your head, "explicit wins except for
       disabled" is one you look up. */
    it('enables a control that opts out of a disabled field', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Environment" disabled>
          <Select disabled={false}>{OPTIONS}</Select>
        </Field>,
      );
      expect(getByRole('combobox')).not.toBeDisabled();
    });

    it('falls back to md and valid with no field above it', () => {
      const { container, getByRole } = renderWithTheme(
        <Select aria-label="Environment">{OPTIONS}</Select>,
      );
      expect(container.querySelector('.pp-select')).toHaveAttribute('data-size', 'md');
      expect(getByRole('combobox')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('standalone invalid', () => {
    /* D-036 gave Field no `invalid` prop because `error` is its invalid state.
       A control outside a Field has no error, so it needs one of its own. */
    it('is invalid with no field and no error message', () => {
      const { container, getByRole } = renderWithTheme(
        <Select aria-label="Environment" invalid>
          {OPTIONS}
        </Select>,
      );
      expect(getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
      expect(container.querySelector('.pp-select')).toHaveAttribute('data-pp-tone', 'danger');
    });
  });

  describe('field wiring', () => {
    it('is named by the field label and described by what actually rendered', () => {
      const { getByLabelText } = renderWithTheme(
        <Field label="Environment" description="Where this deploys." error="Pick one">
          <Select>{OPTIONS}</Select>
        </Field>,
      );
      const control = getByLabelText('Environment');
      const described = control.getAttribute('aria-describedby')?.split(' ') ?? [];

      expect(described).toHaveLength(2);
      for (const id of described) expect(document.getElementById(id)).not.toBeNull();
    });

    it('moves focus to the control when the field label is clicked', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderWithTheme(
        <Field label="Environment">
          <Select>{OPTIONS}</Select>
        </Field>,
      );
      await user.click(getByText('Environment'));
      expect(getByRole('combobox')).toHaveFocus();
    });

    it('lets an explicit id beat the field-generated one', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Environment" controlId="env">
          <Select id="other">{OPTIONS}</Select>
        </Field>,
      );
      expect(getByRole('combobox')).toHaveAttribute('id', 'other');
    });
  });

  /*
   * THE PLACEHOLDER IS THREE ATTRIBUTES OF WHICH ONLY TWO ARE ATTRIBUTES.
   *
   * The spec called for "a disabled, hidden, selected-by-default <option
   * value="">". The HTML "ask for a reset" algorithm selects the first option
   * THAT IS NOT DISABLED, so the third does not follow from the first two —
   * left alone, a disabled placeholder is skipped and the caller sees option
   * two with no idea anything went wrong. See D-049 §1.
   */
  describe('the placeholder', () => {
    it('renders first, disabled and hidden', () => {
      const { container } = renderWithTheme(
        <Select aria-label="Environment" placeholder="Choose one">
          {OPTIONS}
        </Select>,
      );
      const options = container.querySelectorAll('option');

      expect(options[0]).toHaveTextContent('Choose one');
      expect(options[0]).toHaveValue('');
      expect(options[0]).toBeDisabled();
      expect(options[0]).toHaveAttribute('hidden');
    });

    /* The assertion the finding is about. It fails on `seedsPlaceholder` being
       removed, and what it reports is the symptom: the value is 'preview'. */
    it('is the initial selection, even though it is disabled', () => {
      const { getByRole } = renderWithTheme(
        <Select aria-label="Environment" placeholder="Choose one">
          {OPTIONS}
        </Select>,
      );
      expect((getByRole('combobox') as HTMLSelectElement).value).toBe('');
    });

    it('does not override a defaultValue the caller gave', () => {
      const { getByRole } = renderWithTheme(
        <Select aria-label="Environment" placeholder="Choose one" defaultValue="production">
          {OPTIONS}
        </Select>,
      );
      expect((getByRole('combobox') as HTMLSelectElement).value).toBe('production');
    });

    /* React errors on a select carrying both `value` and `defaultValue`, so a
       controlled caller must get neither seeded nor warned at. */
    it('does not seed a defaultValue onto a controlled select', () => {
      const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { getByRole } = renderWithTheme(
        <Select aria-label="Environment" placeholder="Choose one" value="" onChange={() => {}}>
          {OPTIONS}
        </Select>,
      );

      expect((getByRole('combobox') as HTMLSelectElement).value).toBe('');
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    /* The bug the prop split exists to stop: the key is present, its value is
       undefined, and left in the spread it overwrites the seed and hands the
       caller option two — D-049 §1 arriving through a second door. */
    it('is still the initial selection when defaultValue is explicitly undefined', () => {
      const { getByRole } = renderWithTheme(
        <Select aria-label="Environment" placeholder="Choose one" defaultValue={undefined}>
          {OPTIONS}
        </Select>,
      );
      expect((getByRole('combobox') as HTMLSelectElement).value).toBe('');
    });

    it('is not rendered at all when no placeholder is given', () => {
      const { container } = renderWithTheme(
        <Select aria-label="Environment">{OPTIONS}</Select>,
      );
      expect(container.querySelector('option[data-pp-placeholder]')).toBeNull();
      expect((container.querySelector('select') as HTMLSelectElement).value).toBe('preview');
    });

    /*
     * D-049 §2. The attribute describes what React knows, and React only knows
     * when the caller is controlled. The stylesheet does not read it — it reads
     * `:has(option[data-pp-placeholder]:checked)` — so an uncontrolled select
     * is still painted correctly with the attribute absent, which is what the
     * browser suite asserts and jsdom cannot.
     */
    it('exposes data-placeholder when controlled, in both directions', () => {
      const { container, rerender } = renderWithTheme(
        <Select aria-label="Environment" placeholder="Choose one" value="" onChange={() => {}}>
          {OPTIONS}
        </Select>,
      );
      expect(container.querySelector('.pp-select')).toHaveAttribute('data-placeholder');

      rerender(
        <Select aria-label="Environment" placeholder="Choose one" value="preview" onChange={() => {}}>
          {OPTIONS}
        </Select>,
      );
      expect(container.querySelector('.pp-select')).not.toHaveAttribute('data-placeholder');
    });

    it('omits data-placeholder rather than guessing it when uncontrolled', () => {
      const { container } = renderWithTheme(
        <Select aria-label="Environment" placeholder="Choose one">
          {OPTIONS}
        </Select>,
      );
      /* The placeholder IS selected here, and the attribute is still absent:
         it would go stale on the first change, on a form reset and on a write
         through the ref, and a state attribute that is right until the user
         touches it is worse than none. */
      expect(container.querySelector('.pp-select')).not.toHaveAttribute('data-placeholder');
    });
  });

  describe('API surface', () => {
    it('forwards ref to the control, not to the wrapper', () => {
      const ref = createRef<HTMLSelectElement>();
      renderWithTheme(
        <Select aria-label="Environment" ref={ref}>
          {OPTIONS}
        </Select>,
      );
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
      expect(ref.current).toHaveClass('pp-select__input');
    });

    /* D-039 §1: the root is the box, the control is the element. */
    it('puts className and style on the root and everything else on the control', () => {
      const { container } = renderWithTheme(
        <Select aria-label="Environment" className="mine" style={{ opacity: 0.5 }} name="env">
          {OPTIONS}
        </Select>,
      );
      const root = container.querySelector('.pp-select') as HTMLElement;

      expect(root).toHaveClass('pp-select', 'mine');
      expect(root.style.opacity).toBe('0.5');
      expect(container.querySelector('select')).toHaveAttribute('name', 'env');
    });

    /*
     * `Omit` does not delete a property, so a caller who does not typecheck can
     * still hand us `multiple` and get a list box wearing a Select's classes,
     * a Select's chevron and a Select's height — which is D-031's finding on a
     * different prop.
     */
    it('never forwards multiple, even from a caller who ignored the type', () => {
      const { getByRole } = renderWithTheme(
        // @ts-expect-error — the type says never; this is the runtime half.
        <Select aria-label="Environment" multiple>
          {OPTIONS}
        </Select>,
      );
      expect((getByRole('combobox') as HTMLSelectElement).multiple).toBe(false);
    });

    it('never sets the HTML size attribute', () => {
      const { container } = renderWithTheme(
        <Select aria-label="Environment" size="lg">
          {OPTIONS}
        </Select>,
      );
      /* On a <select> the attribute means "show this many rows", which turns
         the control into a list box — a different widget with a different
         keyboard model. */
      expect(container.querySelector('select')).not.toHaveAttribute('size');
    });

    it('renders optgroups and disabled options untouched', () => {
      const { getByRole } = renderWithTheme(
        <Select aria-label="Environment">
          <optgroup label="Ephemeral">
            <option value="preview">Preview</option>
          </optgroup>
          <optgroup label="Permanent">
            <option value="production" disabled>
              Production
            </option>
          </optgroup>
        </Select>,
      );
      const control = getByRole('combobox');

      /* The argument against an `options={[…]}` prop, as a test: an array
         cannot express either of these without us inventing a schema. */
      expect(control.querySelectorAll('optgroup')).toHaveLength(2);
      expect(control.querySelector('option[value="production"]')).toBeDisabled();
    });

    it('passes the native change event, not a bare value', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Select aria-label="Environment" onChange={onChange}>
          {OPTIONS}
        </Select>,
      );

      await user.selectOptions(getByRole('combobox'), 'production');
      expect(onChange).toHaveBeenCalledOnce();
      /* §2: wrapping React's own select would hand callers a string here,
         which react-hook-form cannot register. */
      expect(onChange.mock.calls[0]?.[0]).toHaveProperty('target');
    });

    /*
     * RULES §5.5 wants both modes. It gets them from React rather than from
     * useControllableState (spec §2). Two renders, not one with a rerender:
     * switching a mounted control between modes does not re-seed it, so
     * asserting that would be asserting a bug (D-032).
     */
    it('is controlled: choosing does not move a pinned value', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <Select aria-label="Environment" value="preview" onChange={() => {}}>
          {OPTIONS}
        </Select>,
      );
      const control = getByRole('combobox') as HTMLSelectElement;

      await user.selectOptions(control, 'production');
      expect(control.value).toBe('preview');
    });

    it('is uncontrolled: it seeds from defaultValue and then accepts a choice', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <Select aria-label="Environment" defaultValue="production">
          {OPTIONS}
        </Select>,
      );
      const control = getByRole('combobox') as HTMLSelectElement;

      expect(control.value).toBe('production');
      await user.selectOptions(control, 'preview');
      expect(control.value).toBe('preview');
    });
  });

  describe('accessibility', () => {
    it('keeps one combobox in the tree, with the chevron hidden from it', () => {
      const { container, getAllByRole } = renderWithTheme(
        <Field label="Environment">
          <Select placeholder="Choose one">{OPTIONS}</Select>
        </Field>,
      );

      expect(getAllByRole('combobox')).toHaveLength(1);
      expect(container.querySelector('.pp-select__indicator')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });

    it('has no axe violations inside a field', async () => {
      const { container } = renderWithTheme(
        <Field label="Environment" description="Where this deploys.">
          <Select placeholder="Choose one">{OPTIONS}</Select>
        </Field>,
      );
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when invalid or disabled', async () => {
      const { container } = renderWithTheme(
        <>
          <Field label="A" error="Bad">
            <Select>{OPTIONS}</Select>
          </Field>
          <Field label="B" disabled>
            <Select>{OPTIONS}</Select>
          </Field>
        </>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
