import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { NumberInput } from './NumberInput';

/** A spinbutton's accessible name is required by ARIA, so every render has one. */
const label = { 'aria-label': 'Quantity' } as const;

describe('NumberInput', () => {
  describe('the precedence rule', () => {
    it('takes size, required, disabled and invalid from the field', () => {
      const { getByRole, container } = renderWithTheme(
        <Field label="Quantity" size="lg" required disabled error="Bad">
          <NumberInput />
        </Field>,
      );
      const root = container.querySelector('.pp-number-input');
      const control = getByRole('spinbutton');

      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root).toHaveAttribute('data-invalid');
      expect(root).toHaveAttribute('data-disabled');
      expect(control).toBeRequired();
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute('aria-invalid', 'true');
    });

    it('lets an explicit prop beat the field, for every one of the four', () => {
      const { container } = renderWithTheme(
        <Field label="Quantity" size="lg" required disabled error="Bad">
          <NumberInput size="sm" required={false} disabled={false} invalid={false} />
        </Field>,
      );
      const root = container.querySelector('.pp-number-input');

      expect(root).toHaveAttribute('data-size', 'sm');
      expect(root).not.toHaveAttribute('data-invalid');
      expect(root).not.toHaveAttribute('data-disabled');
    });

    it('works standalone, with no field anywhere above it', () => {
      const { getByRole, container } = renderWithTheme(<NumberInput {...label} invalid />);
      expect(container.querySelector('.pp-number-input')).toHaveAttribute('data-invalid');
      expect(getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('null is empty, undefined is uncontrolled (spec §2)', () => {
    it('renders an empty box for a null value', () => {
      const { getByRole } = renderWithTheme(<NumberInput {...label} value={null} onValueChange={vi.fn()} />);
      expect(getByRole('spinbutton')).toHaveValue('');
    });

    it('obeys a controlled value and never stores one of its own', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <NumberInput {...label} value={3} onValueChange={onValueChange} />,
      );
      const control = getByRole('spinbutton');

      await user.type(control, '9');
      await user.tab();

      expect(onValueChange).toHaveBeenCalled();
      // The owner never updated `value`, so the box goes back to what it was
      // told. A component that stored the value too would show 39.
      expect(control).toHaveValue('3');
    });

    it('seeds from defaultValue and keeps its own value when uncontrolled', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} defaultValue={3} />);
      const control = getByRole('spinbutton');

      expect(control).toHaveValue('3');
      await user.clear(control);
      await user.type(control, '9');
      await user.tab();
      expect(control).toHaveValue('9');
    });

    it('commits null when the field is cleared', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <NumberInput {...label} defaultValue={3} onValueChange={onValueChange} />,
      );

      await user.clear(getByRole('spinbutton'));
      await user.tab();

      // Number('') is 0. A cleared field is empty, not zero.
      expect(onValueChange).toHaveBeenLastCalledWith(null);
    });
  });

  describe('clamp and snap on commit, never on a keystroke (spec §3)', () => {
    /*
     * THE BREAK THAT PROVES THIS TEST CAN FAIL (D-035 §3): make onChange
     * commit instead of recording a draft, and `15` becomes untypeable here —
     * the 1 snaps to 10 before the 5 arrives.
     */
    it('lets a value be typed that the step would forbid mid-way', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <NumberInput {...label} step={10} min={0} onValueChange={onValueChange} />,
      );
      const control = getByRole('spinbutton');

      await user.type(control, '15');
      expect(control).toHaveValue('15');
      expect(onValueChange).not.toHaveBeenCalled();

      await user.tab();
      expect(onValueChange).toHaveBeenLastCalledWith(20);
    });

    it('does not clamp a digit away while the rest is still being typed', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} min={10} max={99} />);
      const control = getByRole('spinbutton');

      await user.type(control, '5');
      expect(control).toHaveValue('5');
      await user.type(control, '5');
      expect(control).toHaveValue('55');

      await user.tab();
      expect(control).toHaveValue('55');
    });

    it('clamps to the bounds on blur', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} min={1} max={10} />);
      const control = getByRole('spinbutton');

      await user.type(control, '500');
      await user.tab();
      expect(control).toHaveValue('10');
    });

    it('reverts to the last committed value when the text is not a number', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} defaultValue={7} />);
      const control = getByRole('spinbutton');

      await user.clear(control);
      await user.type(control, 'abc');
      await user.tab();

      // A typo must not silently destroy data the user did not ask to delete.
      expect(control).toHaveValue('7');
    });

    it('does not produce a floating-point tail', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <NumberInput {...label} step={0.1} min={0} defaultValue={0.2} onValueChange={onValueChange} />,
      );

      await user.keyboard('{Tab}{ArrowUp}');
      expect(onValueChange).toHaveBeenLastCalledWith(0.3);
      expect(getByRole('spinbutton')).toHaveValue('0.3');
    });
  });

  describe('keyboard (spec §3.14)', () => {
    it('steps with the arrow keys', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} defaultValue={5} />);
      const control = getByRole('spinbutton');

      await user.click(control);
      await user.keyboard('{ArrowUp}');
      expect(control).toHaveValue('6');
      await user.keyboard('{ArrowDown}{ArrowDown}');
      expect(control).toHaveValue('4');
    });

    it('steps by ten times the step on Page Up and Page Down', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} step={2} defaultValue={0} />);
      const control = getByRole('spinbutton');

      await user.click(control);
      await user.keyboard('{PageUp}');
      expect(control).toHaveValue('20');
      await user.keyboard('{PageDown}');
      expect(control).toHaveValue('0');
    });

    it('goes to the bounds on Home and End', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <NumberInput {...label} min={2} max={8} defaultValue={5} />,
      );
      const control = getByRole('spinbutton');

      await user.click(control);
      await user.keyboard('{Home}');
      expect(control).toHaveValue('2');
      await user.keyboard('{End}');
      expect(control).toHaveValue('8');
    });

    /*
     * A SEPARATE RENDER RATHER THAN A RERENDER, BECAUSE THE FIRST DRAFT OF THIS
     * TEST COULD NOT FAIL FOR THE RIGHT REASON. `rerender` keeps the component
     * instance, so an uncontrolled value set by the previous assertion survives
     * a new `defaultValue` — the box read 8 and the test reported that Home had
     * moved it, when Home had correctly done nothing.
     */
    it('leaves the value alone on Home and End when there are no bounds', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} defaultValue={5} />);
      const control = getByRole('spinbutton');

      await user.click(control);
      await user.keyboard('{Home}');
      expect(control).toHaveValue('5');
      await user.keyboard('{End}');
      expect(control).toHaveValue('5');
    });

    it('steps from the text in the box, not from the stale committed value', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} defaultValue={1} />);
      const control = getByRole('spinbutton');

      await user.clear(control);
      await user.type(control, '5');
      await user.keyboard('{ArrowUp}');
      expect(control).toHaveValue('6');
    });

    it('starts an empty field at the bound that exists', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} min={5} max={9} />);
      const control = getByRole('spinbutton');

      await user.click(control);
      await user.keyboard('{ArrowUp}');
      expect(control).toHaveValue('5');
    });

    it('does not step a disabled or read-only control', async () => {
      const user = userEvent.setup();
      const { getByRole, rerender } = renderWithTheme(
        <NumberInput {...label} readOnly defaultValue={5} />,
      );
      await user.click(getByRole('spinbutton'));
      await user.keyboard('{ArrowUp}');
      expect(getByRole('spinbutton')).toHaveValue('5');

      rerender(<NumberInput {...label} disabled defaultValue={5} />);
      expect(getByRole('spinbutton')).toHaveValue('5');
    });
  });

  describe('the steppers (spec §6)', () => {
    /*
     * THE ONE-WORD BUG WITH THE SPECTACULAR SYMPTOM. A <button> inside a
     * <form> defaults to type="submit", so an omitted attribute makes the
     * increment button submit the form. Break `type="button"` and this fails.
     */
    it('does not submit the form it is inside', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const { getByLabelText } = renderWithTheme(
        <form onSubmit={onSubmit}>
          <NumberInput {...label} defaultValue={1} />
        </form>,
      );

      await user.click(getByLabelText('Increase'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('is not a tab stop, so one field is one stop', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} defaultValue={1} />);

      await user.tab();
      expect(getByRole('spinbutton')).toHaveFocus();
      await user.tab();
      expect(getByRole('spinbutton')).not.toHaveFocus();
      expect(document.body).toHaveFocus();
    });

    it('steps in both directions', async () => {
      const user = userEvent.setup();
      const { getByRole, getByLabelText } = renderWithTheme(
        <NumberInput {...label} defaultValue={5} />,
      );

      await user.click(getByLabelText('Increase'));
      expect(getByRole('spinbutton')).toHaveValue('6');
      await user.click(getByLabelText('Decrease'));
      await user.click(getByLabelText('Decrease'));
      expect(getByRole('spinbutton')).toHaveValue('4');
    });

    it('disables at the bound it has reached, and only that one', () => {
      const { getByLabelText } = renderWithTheme(
        <NumberInput {...label} min={0} max={10} defaultValue={10} />,
      );
      expect(getByLabelText('Increase')).toBeDisabled();
      expect(getByLabelText('Decrease')).toBeEnabled();
    });

    it('disables both when the control is disabled or read-only', () => {
      const { getByLabelText, rerender } = renderWithTheme(
        <NumberInput {...label} disabled defaultValue={5} />,
      );
      expect(getByLabelText('Increase')).toBeDisabled();
      expect(getByLabelText('Decrease')).toBeDisabled();

      rerender(<NumberInput {...label} readOnly defaultValue={5} />);
      expect(getByLabelText('Increase')).toBeDisabled();
      expect(getByLabelText('Decrease')).toBeDisabled();
    });

    it('takes custom accessible names', () => {
      const { getByLabelText } = renderWithTheme(
        <NumberInput {...label} incrementLabel="Mehr" decrementLabel="Weniger" />,
      );
      expect(getByLabelText('Mehr')).toBeInTheDocument();
      expect(getByLabelText('Weniger')).toBeInTheDocument();
    });
  });

  describe('formatting (spec §4)', () => {
    it('does not format without a locale, so the string is runtime-independent', () => {
      const { getByRole } = renderWithTheme(<NumberInput {...label} defaultValue={1234.5} />);
      expect(getByRole('spinbutton')).toHaveValue('1234.5');
    });

    it('round-trips a German decimal comma', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <NumberInput
          {...label}
          locale="de-DE"
          formatOptions={{ minimumFractionDigits: 1 }}
          step={0.1}
          onValueChange={onValueChange}
        />,
      );
      const control = getByRole('spinbutton');

      await user.type(control, '1,5');
      await user.tab();

      // The bug type="number" has: `1,5` must not be lost, and must not be 15.
      expect(onValueChange).toHaveBeenLastCalledWith(1.5);
      expect(control).toHaveValue('1,5');
    });

    it('does not reformat while the field is focused', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <NumberInput {...label} locale="en-US" defaultValue={1000} />,
      );
      const control = getByRole('spinbutton');
      expect(control).toHaveValue('1,000');

      await user.click(control);
      await user.type(control, '0');
      // Reformatting per keystroke is what moves the caret out from under the
      // user's finger. The text is theirs until they leave.
      expect(control).toHaveValue('1,0000');

      await user.tab();
      expect(control).toHaveValue('10,000');
    });

    it('announces the formatted string as aria-valuetext, and only when formatted', () => {
      const { getByRole, rerender } = renderWithTheme(
        <NumberInput {...label} locale="en-US" defaultValue={1234} />,
      );
      expect(getByRole('spinbutton')).toHaveAttribute('aria-valuetext', '1,234');

      rerender(<NumberInput {...label} defaultValue={1234} />);
      expect(getByRole('spinbutton')).not.toHaveAttribute('aria-valuetext');
    });
  });

  describe('ARIA (spec §5)', () => {
    it('is a spinbutton carrying only the bounds it was given', () => {
      const { getByRole, rerender } = renderWithTheme(
        <NumberInput {...label} min={1} max={10} defaultValue={3} />,
      );
      const control = getByRole('spinbutton');
      expect(control).toHaveAttribute('aria-valuenow', '3');
      expect(control).toHaveAttribute('aria-valuemin', '1');
      expect(control).toHaveAttribute('aria-valuemax', '10');

      // An unbounded field must not claim bounds.
      rerender(<NumberInput {...label} defaultValue={3} />);
      expect(getByRole('spinbutton')).not.toHaveAttribute('aria-valuemin');
      expect(getByRole('spinbutton')).not.toHaveAttribute('aria-valuemax');
    });

    /*
     * ARIA 1.2 made aria-valuenow optional for spinbutton — verified locally
     * against axe-core 4.13 (allowedAttrs, not requiredAttrs) and aria-query
     * 5.3 (requiredProps {}). Announcing a stale number is worse than
     * announcing none.
     */
    it('omits aria-valuenow while there is no value to announce', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<NumberInput {...label} />);
      const control = getByRole('spinbutton');
      expect(control).not.toHaveAttribute('aria-valuenow');

      await user.type(control, '-');
      expect(control).not.toHaveAttribute('aria-valuenow');

      await user.type(control, '4');
      expect(control).toHaveAttribute('aria-valuenow', '-4');
    });

    it('is type=text, never type=number', () => {
      const { getByRole } = renderWithTheme(<NumberInput {...label} />);
      expect(getByRole('spinbutton')).toHaveAttribute('type', 'text');
    });

    it('derives inputMode, and claims numeric only when the value cannot be negative', () => {
      const { getByRole, rerender } = renderWithTheme(<NumberInput {...label} min={0} step={1} />);
      expect(getByRole('spinbutton')).toHaveAttribute('inputmode', 'numeric');

      rerender(<NumberInput {...label} min={0} step={0.5} />);
      expect(getByRole('spinbutton')).toHaveAttribute('inputmode', 'decimal');

      // Unbounded accepts negatives, and a numeric keypad has no minus key.
      rerender(<NumberInput {...label} step={1} />);
      expect(getByRole('spinbutton')).toHaveAttribute('inputmode', 'decimal');
    });

    it('takes its accessible name and description from the field', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Quantity" description="Up to ten." controlId="qty">
          <NumberInput />
        </Field>,
      );
      const control = getByRole('spinbutton');
      expect(control).toHaveAccessibleName('Quantity');
      expect(control).toHaveAccessibleDescription('Up to ten.');
    });

    it('has no axe violations, in a field and standalone', async () => {
      const inField = renderWithTheme(
        <Field label="Quantity" description="Up to ten." controlId="qty-axe">
          <NumberInput min={1} max={10} defaultValue={2} />
        </Field>,
      );
      await expectNoA11yViolations(inField.container);

      const standalone = renderWithTheme(<NumberInput {...label} defaultValue={2} />);
      await expectNoA11yViolations(standalone.container);
    });
  });

  describe('structure and the API surface (RULES §5)', () => {
    it('forwards the ref to the control, not to the wrapper', () => {
      const ref = createRef<HTMLInputElement>();
      renderWithTheme(<NumberInput {...label} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toHaveClass('pp-number-input__control');
    });

    it('merges className and style onto the root, which is the box', () => {
      const { container } = renderWithTheme(
        <NumberInput {...label} className="mine" style={{ opacity: 0.5 }} />,
      );
      const root = container.querySelector('.pp-number-input');
      expect(root).toHaveClass('pp-number-input', 'mine');
      expect(root).toHaveStyle({ opacity: '0.5' });
    });

    it('spreads the rest onto the control', () => {
      const { getByRole } = renderWithTheme(
        <NumberInput {...label} name="qty" data-testid="qty" placeholder="0" />,
      );
      const control = getByRole('spinbutton');
      expect(control).toHaveAttribute('name', 'qty');
      expect(control).toHaveAttribute('data-testid', 'qty');
      expect(control).toHaveAttribute('placeholder', '0');
    });

    it('never sets the HTML size attribute from the size prop', () => {
      const { getByRole } = renderWithTheme(<NumberInput {...label} size="lg" />);
      expect(getByRole('spinbutton')).not.toHaveAttribute('size');
    });

    it('still fires the native onChange alongside onValueChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <NumberInput {...label} onChange={onChange} onValueChange={onValueChange} />,
      );

      await user.type(getByRole('spinbutton'), '4');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).not.toHaveBeenCalled();

      await user.tab();
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it('lets a caller keep their own onKeyDown and pre-empt a step', async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      const { getByRole } = renderWithTheme(
        <NumberInput {...label} defaultValue={5} onKeyDown={onKeyDown} />,
      );

      await user.click(getByRole('spinbutton'));
      await user.keyboard('{ArrowUp}');
      expect(onKeyDown).toHaveBeenCalled();
      expect(getByRole('spinbutton')).toHaveValue('6');
    });
  });

  describe('Enter commits before the form reads the box', () => {
    /*
     * A form submits in the SAME event as the Enter keydown, before React has
     * re-rendered. Without the synchronous write in `commit`, the submission
     * carries the raw draft — `500` on a max={10} field.
     */
    it('submits the clamped value, not the typed one', async () => {
      const user = userEvent.setup();
      let submitted: string | null = null;
      const { getByRole } = renderWithTheme(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitted = new FormData(event.currentTarget).get('qty') as string;
          }}
        >
          <NumberInput {...label} name="qty" min={1} max={10} />
        </form>,
      );

      await user.type(getByRole('spinbutton'), '500');
      await user.keyboard('{Enter}');
      expect(submitted).toBe('10');
    });
  });

  describe('controlled by an owner', () => {
    function Owner() {
      const [value, setValue] = useState<number | null>(2);
      return (
        <>
          <NumberInput {...label} value={value} onValueChange={setValue} min={0} max={5} />
          <output>{value === null ? 'empty' : value}</output>
        </>
      );
    }

    it('round-trips through the owner in both directions', async () => {
      const user = userEvent.setup();
      const { getByRole, getByLabelText } = renderWithTheme(<Owner />);

      await user.click(getByLabelText('Increase'));
      expect(getByRole('status')).toHaveTextContent('3');
      expect(getByRole('spinbutton')).toHaveValue('3');

      await user.clear(getByRole('spinbutton'));
      await user.tab();
      expect(getByRole('status')).toHaveTextContent('empty');
    });
  });
});
