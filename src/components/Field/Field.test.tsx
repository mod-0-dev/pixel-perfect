import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field, useField } from './Field';

/** A control that reads the wiring the way every control in 3C will. */
function TestControl({ size: sizeProp }: { size?: 'sm' | 'md' | 'lg' }) {
  const field = useField();
  const size = sizeProp ?? field?.size ?? 'md';
  return <input data-testid="control" data-size={size} {...field?.control} />;
}

function Standalone() {
  const field = useField();
  return <input data-testid="control" data-outside={field === null || undefined} />;
}

describe('Field', () => {
  describe('association', () => {
    it('names the control with a real label', () => {
      const { getByLabelText, getByTestId } = renderWithTheme(
        <Field label="Email address">
          <TestControl />
        </Field>,
      );
      expect(getByLabelText('Email address')).toBe(getByTestId('control'));
    });

    it('moves focus to the control when the label is clicked', async () => {
      const user = userEvent.setup();
      const { getByText, getByTestId } = renderWithTheme(
        <Field label="Email address">
          <TestControl />
        </Field>,
      );
      await user.click(getByText('Email address'));
      expect(getByTestId('control')).toHaveFocus();
    });

    it('wires a render prop identically to a context consumer', () => {
      const { getByLabelText } = renderWithTheme(
        <Field label="Email address">{(control) => <input {...control} />}</Field>,
      );
      expect(getByLabelText('Email address')).toBeInstanceOf(HTMLInputElement);
    });

    it('takes a known control id through controlId, wiring both sides', () => {
      const { getByLabelText } = renderWithTheme(
        <Field label="Email address" controlId="email">
          {(control) => <input {...control} />}
        </Field>,
      );
      // Both sides, or neither. An error summary linking to #email needs the
      // label's `for` to agree with the control's id.
      expect(getByLabelText('Email address')).toHaveAttribute('id', 'email');
    });

    it('is not fooled by an id set on the control instead', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <Field label="Email address">
          {(control) => <input data-testid="control" {...control} id="my-own-id" />}
        </Field>,
      );
      // Overriding the id through the render prop leaves the label pointing at
      // the id Field generated, so the control loses its accessible name. This
      // asserts the failure exists rather than pretending it does not — the
      // supported route is controlId, above.
      expect(getByText('Email address').closest('label')).not.toHaveAttribute('for', 'my-own-id');
      expect(getByTestId('control')).toHaveAccessibleName('');
    });

    it('gives useField null outside a Field', () => {
      const { getByTestId } = renderWithTheme(<Standalone />);
      expect(getByTestId('control')).toHaveAttribute('data-outside', 'true');
    });
  });

  describe('aria-describedby is built from what rendered', () => {
    it('is absent when there is no description and no error', () => {
      const { getByTestId } = renderWithTheme(
        <Field label="Email">
          <TestControl />
        </Field>,
      );
      expect(getByTestId('control')).not.toHaveAttribute('aria-describedby');
    });

    it('points at the description alone', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <Field label="Email" description="We only use this for receipts.">
          <TestControl />
        </Field>,
      );
      const described = getByTestId('control').getAttribute('aria-describedby');
      expect(described).toBe(getByText('We only use this for receipts.').id);
      expect(described?.split(' ')).toHaveLength(1);
    });

    it('points at the error alone', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <Field label="Email" error="Enter an email address">
          <TestControl />
        </Field>,
      );
      expect(getByTestId('control').getAttribute('aria-describedby')).toBe(
        getByText('Enter an email address').id,
      );
    });

    it('points at description then error, in that order', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <Field label="Email" description="We only use this for receipts." error="Enter an email address">
          <TestControl />
        </Field>,
      );
      // Visual order and described-by order are the same, so a screen reader
      // user hears what a sighted user reads, in the same sequence.
      expect(getByTestId('control').getAttribute('aria-describedby')).toBe(
        `${getByText('We only use this for receipts.').id} ${getByText('Enter an email address').id}`,
      );
    });

    it('never points at an element that does not exist', () => {
      const { container, getByTestId } = renderWithTheme(
        <Field label="Email" description="Hint">
          <TestControl />
        </Field>,
      );
      for (const id of getByTestId('control').getAttribute('aria-describedby')!.split(' ')) {
        // A dangling token is ignored silently by assistive tech, so this is
        // the failure mode that is invisible in testing and total in use.
        expect(container.querySelector(`#${CSS.escape(id)}`)).not.toBeNull();
      }
    });
  });

  describe('error is the invalid state', () => {
    it('marks the control, the root and the label', () => {
      const { getByTestId, container, getByText } = renderWithTheme(
        <Field label="Email" error="Required">
          <TestControl />
        </Field>,
      );
      expect(getByTestId('control')).toHaveAttribute('aria-invalid', 'true');
      expect(container.querySelector('.pp-field')).toHaveAttribute('data-invalid', 'true');
      expect(getByText('Email').closest('label')).toHaveAttribute('data-invalid', 'true');
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['false', false],
      ['an empty string', ''],
    ])('treats %s as valid, not as an empty message', (_name, error) => {
      const { getByTestId, container } = renderWithTheme(
        <Field label="Email" error={error}>
          <TestControl />
        </Field>,
      );
      expect(getByTestId('control')).not.toHaveAttribute('aria-invalid');
      expect(container.querySelector('.pp-field__error')).toBeNull();
      expect(container.querySelector('.pp-field')).not.toHaveAttribute('data-invalid');
    });
  });

  describe('propagation', () => {
    it('sends required to the label and the control', () => {
      const { getByTestId, getByText, container } = renderWithTheme(
        <Field label="Email" required>
          <TestControl />
        </Field>,
      );
      expect(getByTestId('control')).toHaveAttribute('required');
      expect(getByText('Email').closest('label')).toHaveAttribute('data-required', 'true');
      expect(container.querySelector('.pp-label__required')).not.toBeNull();
    });

    it('sends disabled to the label and the control', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <Field label="Email" disabled>
          <TestControl />
        </Field>,
      );
      expect(getByTestId('control')).toBeDisabled();
      expect(getByText('Email').closest('label')).toHaveAttribute('data-disabled', 'true');
    });

    it.each(['sm', 'md', 'lg'] as const)('sends size=%s to the label and the context', (size) => {
      const { getByTestId, getByText } = renderWithTheme(
        <Field label="Email" size={size}>
          <TestControl />
        </Field>,
      );
      expect(getByText('Email').closest('label')).toHaveAttribute('data-size', size);
      expect(getByTestId('control')).toHaveAttribute('data-size', size);
    });

    it('lets a control override the field: explicit prop wins', () => {
      const { getByTestId } = renderWithTheme(
        <Field label="Email" size="lg">
          <TestControl size="sm" />
        </Field>,
      );
      expect(getByTestId('control')).toHaveAttribute('data-size', 'sm');
    });

    it('keeps size out of the spreadable control props', () => {
      const { getByTestId } = renderWithTheme(
        <Field label="Email" size="lg">{(control) => <input data-testid="control" {...control} />}</Field>,
      );
      // Spreading `size` onto a native input sets the HTML size attribute — a
      // character-width declaration, which is a control sizing itself.
      expect(getByTestId('control')).not.toHaveAttribute('size');
    });
  });

  describe('labelHidden', () => {
    it('hides the label without removing it or its association', () => {
      const { getByLabelText, getByText } = renderWithTheme(
        <Field label="Search orders" labelHidden>
          <TestControl />
        </Field>,
      );
      const label = getByText('Search orders').closest('label')!;

      expect(label).toHaveClass('pp-visually-hidden');
      expect(label).toHaveClass('pp-label');
      expect(label).toHaveAttribute('for');
      expect(getByLabelText('Search orders')).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('group', () => {
    const group = (
      <Field label="Delivery speed" group>
        {(control) => (
          <div role="radiogroup" data-testid="control" {...control}>
            <label>
              <input type="radio" name="speed" /> Standard
            </label>
          </div>
        )}
      </Field>
    );

    it('labels the group with aria-labelledby and no htmlFor', () => {
      const { getByRole, getByText } = renderWithTheme(group);
      const label = getByText('Delivery speed').closest('label')!;

      // `for` has nothing to point at: a radiogroup is not a labelable element.
      expect(label).not.toHaveAttribute('for');
      expect(getByRole('radiogroup')).toHaveAttribute('aria-labelledby', label.id);
      expect(getByRole('radiogroup', { name: 'Delivery speed' })).toBeInTheDocument();
    });

    it('gives the group no id of its own', () => {
      const { getByTestId } = renderWithTheme(group);
      expect(getByTestId('control')).not.toHaveAttribute('id');
    });

    it('has no axe violations — including for a <label> with no for', async () => {
      // Spec §9 said to verify exactly this before accepting the ARIA route
      // over <fieldset>/<legend>.
      const { container } = renderWithTheme(group);
      await expectNoA11yViolations(container);
    });
  });

  describe('orientation', () => {
    it('is vertical by default, label before control in the DOM', () => {
      const { container } = renderWithTheme(
        <Field label="Email">
          <TestControl />
        </Field>,
      );
      const root = container.querySelector('.pp-field')!;
      const parts = Array.from(root.children).map((el) => el.className);

      expect(root).toHaveAttribute('data-orientation', 'vertical');
      expect(parts[0]).toContain('pp-field__label');
      expect(parts[1]).toContain('pp-field__control');
    });

    it('puts the control first in the DOM when horizontal, not only in the layout', () => {
      const { container } = renderWithTheme(
        <Field label="Email me" orientation="horizontal" description="Once a month.">
          <TestControl />
        </Field>,
      );
      const root = container.querySelector('.pp-field')!;
      const parts = Array.from(root.children).map((el) => el.className);

      expect(root).toHaveAttribute('data-orientation', 'horizontal');
      // Reading order matches visual order without relying on `order` to fix
      // it up afterwards.
      expect(parts[0]).toContain('pp-field__control');
      expect(parts[1]).toContain('pp-field__label');
      expect(parts[2]).toContain('pp-field__description');
    });
  });

  describe('API surface', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      renderWithTheme(
        <Field ref={ref} label="Email">
          <TestControl />
        </Field>,
      );
      expect(ref.current).toHaveClass('pp-field');
    });

    it('merges className and style, and spreads the rest onto the root', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const { getByTestId } = renderWithTheme(
        <Field
          label="Email"
          className="app-field"
          style={{ opacity: 0.5 }}
          id="on-the-root"
          data-testid="field"
          onClick={onClick}
        >
          <TestControl />
        </Field>,
      );
      const root = getByTestId('field');

      expect(root).toHaveClass('pp-field', 'app-field');
      expect(root).toHaveStyle({ opacity: '0.5' });
      // `id` lands on the root like it does on every other component — it does
      // not secretly become the control's id.
      expect(root).toHaveAttribute('id', 'on-the-root');
      expect(getByTestId('control')).not.toHaveAttribute('id', 'on-the-root');
      await user.click(root);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('generates ids that do not collide between two fields', () => {
      const { getAllByRole } = renderWithTheme(
        <>
          <Field label="First">{(control) => <input {...control} />}</Field>
          <Field label="Second">{(control) => <input {...control} />}</Field>
        </>,
      );
      const inputs = getAllByRole('textbox');
      expect(inputs).toHaveLength(2);
      expect(inputs[0]?.id).not.toBe(inputs[1]?.id);
      expect(inputs[0]?.id).toBeTruthy();
    });

    it('requires a label at the type level', () => {
      renderWithTheme(
        // @ts-expect-error label is required — a field with no label is what
        // this component exists to prevent.
        <Field>
          <TestControl />
        </Field>,
      );
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its ordinary shape', async () => {
      const { container } = renderWithTheme(
        <Field label="Email address" description="We only use this for receipts.">
          <TestControl />
        </Field>,
      );
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when invalid, disabled, required or label-hidden', async () => {
      const { container } = renderWithTheme(
        <>
          <Field label="Email" required error="Enter an email address">
            <TestControl />
          </Field>
          <Field label="Tax ID" disabled>
            <TestControl />
          </Field>
          <Field label="Search orders" labelHidden>
            <TestControl />
          </Field>
        </>,
      );
      await expectNoA11yViolations(container);
    });

    it('gives the control exactly one accessible name', async () => {
      const { getByTestId } = renderWithTheme(
        <Field label="Email address" required>
          <TestControl />
        </Field>,
      );
      // The required glyph is aria-hidden on the Label (3.6 §2), so the name is
      // the label text and nothing else.
      expect(getByTestId('control')).toHaveAccessibleName('Email address');
    });

    it('gives the control its description and error as its accessible description', () => {
      const { getByTestId } = renderWithTheme(
        <Field label="Email" description="We only use this for receipts." error="Enter an email address">
          <TestControl />
        </Field>,
      );
      expect(getByTestId('control')).toHaveAccessibleDescription(
        'We only use this for receipts. Enter an email address',
      );
    });
  });
});
