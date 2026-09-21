import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Slider } from './Slider';

/** ARIA requires an accessible name for `slider`, so every render has one. */
const label = { 'aria-label': 'Volume' } as const;

const fillOf = (container: HTMLElement) =>
  (container.querySelector('.pp-slider') as HTMLElement).style.getPropertyValue(
    '--_pp-slider-fill',
  );

describe('Slider', () => {
  describe('the precedence rule', () => {
    it('takes size, disabled and invalid from the field', () => {
      const { getByRole, container } = renderWithTheme(
        <Field label="Volume" size="lg" disabled error="Too loud">
          <Slider />
        </Field>,
      );
      const root = container.querySelector('.pp-slider');

      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root).toHaveAttribute('data-invalid');
      expect(root).toHaveAttribute('data-disabled');
      expect(getByRole('slider')).toBeDisabled();
      expect(getByRole('slider')).toHaveAttribute('aria-invalid', 'true');
    });

    it('lets an explicit prop beat the field', () => {
      const { container } = renderWithTheme(
        <Field label="Volume" size="lg" disabled error="Too loud">
          <Slider size="sm" disabled={false} invalid={false} />
        </Field>,
      );
      const root = container.querySelector('.pp-slider');

      expect(root).toHaveAttribute('data-size', 'sm');
      expect(root).not.toHaveAttribute('data-invalid');
      expect(root).not.toHaveAttribute('data-disabled');
    });

    it('works standalone, with no field anywhere above it', () => {
      const { container } = renderWithTheme(<Slider {...label} invalid />);
      expect(container.querySelector('.pp-slider')).toHaveAttribute('data-invalid');
    });
  });

  describe('the numeric contract (spec §1)', () => {
    it('defaults to 0–100 step 1, and seeds at the midpoint like the platform', () => {
      const { getByRole } = renderWithTheme(<Slider {...label} />);
      const control = getByRole('slider');

      expect(control).toHaveAttribute('min', '0');
      expect(control).toHaveAttribute('max', '100');
      expect(control).toHaveAttribute('step', '1');
      expect(control).toHaveValue('50');
    });

    it('snaps a defaultValue that is off the grid', () => {
      const { getByRole } = renderWithTheme(
        <Slider {...label} min={0} max={100} step={25} defaultValue={40} />,
      );
      expect(getByRole('slider')).toHaveValue('50');
    });

    it('clamps a defaultValue outside the bounds', () => {
      const { getByRole } = renderWithTheme(<Slider {...label} min={0} max={10} defaultValue={99} />);
      expect(getByRole('slider')).toHaveValue('10');
    });

    it('takes its stepping base from min, the way HTML does', () => {
      const { getByRole } = renderWithTheme(
        <Slider {...label} min={1} max={9} step={2} defaultValue={4} />,
      );
      // The grid is 1, 3, 5, 7, 9 — not 0, 2, 4.
      expect(getByRole('slider')).toHaveValue('5');
    });
  });

  describe('the fill percentage (D-024)', () => {
    /*
     * ALWAYS WRITTEN, NEVER CONDITIONALLY. Custom properties inherit, so a
     * nested Slider would otherwise draw its ancestor's fill. Break it by
     * emitting the property only when the value is non-zero and the
     * `at the minimum` case below fails.
     */
    it('is written at every value, including zero', () => {
      const atMin = renderWithTheme(<Slider {...label} min={0} max={100} defaultValue={0} />);
      expect(fillOf(atMin.container)).toBe('0%');

      const atMax = renderWithTheme(<Slider {...label} min={0} max={100} defaultValue={100} />);
      expect(fillOf(atMax.container)).toBe('100%');
    });

    it('is the position within the range, not the raw value', () => {
      const { container } = renderWithTheme(
        <Slider {...label} min={100} max={200} defaultValue={125} />,
      );
      expect(fillOf(container)).toBe('25%');
    });

    it('survives a zero-width range without dividing by zero', () => {
      const { container } = renderWithTheme(<Slider {...label} min={5} max={5} defaultValue={5} />);
      expect(fillOf(container)).toBe('0%');
    });

    it('does not overwrite a caller style, and is not overwritten by one', () => {
      const { container } = renderWithTheme(
        <Slider {...label} defaultValue={50} style={{ opacity: 0.5 }} />,
      );
      const root = container.querySelector('.pp-slider') as HTMLElement;
      expect(root).toHaveStyle({ opacity: '0.5' });
      expect(root.style.getPropertyValue('--_pp-slider-fill')).toBe('50%');
    });
  });

  describe('controlled and uncontrolled (RULES §5.5)', () => {
    it('keeps its own value when uncontrolled', () => {
      const { getByRole } = renderWithTheme(<Slider {...label} defaultValue={30} />);
      const control = getByRole('slider') as HTMLInputElement;

      fireInput(control, '70');
      expect(control).toHaveValue('70');
    });

    it('obeys a controlled value and never stores one of its own', () => {
      const onValueChange = vi.fn();
      const { getByRole, container } = renderWithTheme(
        <Slider {...label} value={30} onValueChange={onValueChange} />,
      );
      const control = getByRole('slider') as HTMLInputElement;

      fireInput(control, '70');
      expect(onValueChange).toHaveBeenLastCalledWith(70);
      // The owner never updated `value`, so the control goes back to what it
      // was told. A component that stored the value too would show 70.
      expect(control).toHaveValue('30');
      expect(fillOf(container)).toBe('30%');
    });

    function Owner() {
      const [value, setValue] = useState(20);
      return (
        <>
          <Slider {...label} value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }

    it('round-trips through an owner', () => {
      const { getByRole } = renderWithTheme(<Owner />);
      fireInput(getByRole('slider') as HTMLInputElement, '80');
      expect(getByRole('status')).toHaveTextContent('80');
      expect(getByRole('slider')).toHaveValue('80');
    });
  });

  describe('onValueChange fires continuously; onValueCommit fires once', () => {
    it('reports every input, and commits on pointer release', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      const { getByRole } = renderWithTheme(
        <Slider {...label} defaultValue={10} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
      );
      const control = getByRole('slider') as HTMLInputElement;

      fireInput(control, '20');
      fireInput(control, '30');
      expect(onValueChange).toHaveBeenCalledTimes(2);
      expect(onValueCommit).not.toHaveBeenCalled();

      await user.pointer({ target: control, keys: '[MouseLeft]' });
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenLastCalledWith(30);
    });

    /*
     * Only a CHANGE is committed. Without the guard a plain focus-and-leave
     * fires onValueCommit with a value nobody touched, and a consumer who wired
     * it to a request would send one for every slider a user tabbed past.
     */
    it('does not commit when the user only tabbed past', async () => {
      const user = userEvent.setup();
      const onValueCommit = vi.fn();
      const { getByRole } = renderWithTheme(
        <Slider {...label} defaultValue={10} onValueCommit={onValueCommit} />,
      );

      await user.tab();
      // Asserted, not assumed: if focus never reached the slider this test
      // would pass without exercising the guard at all.
      expect(getByRole('slider')).toHaveFocus();
      await user.tab();
      expect(getByRole('slider')).not.toHaveFocus();
      expect(onValueCommit).not.toHaveBeenCalled();
    });

    it('commits once on blur after a change, not twice', async () => {
      const user = userEvent.setup();
      const onValueCommit = vi.fn();
      const { getByRole } = renderWithTheme(
        <Slider {...label} defaultValue={10} onValueCommit={onValueCommit} />,
      );
      const control = getByRole('slider') as HTMLInputElement;

      control.focus();
      fireInput(control, '55');
      await user.tab();
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenLastCalledWith(55);
    });

    it('still fires the native onChange alongside onValueChange', () => {
      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Slider {...label} onChange={onChange} onValueChange={onValueChange} />,
      );

      fireInput(getByRole('slider') as HTMLInputElement, '60');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('is a native slider, so the value attributes are the platform\'s', () => {
      const { getByRole } = renderWithTheme(
        <Slider {...label} min={0} max={10} defaultValue={4} />,
      );
      const control = getByRole('slider');

      // Not set by us: ARIA requires aria-valuenow for `slider` — unlike
      // `spinbutton`, where 1.2 relaxed it — and the element supplies it.
      expect(control).not.toHaveAttribute('aria-valuenow');
      expect(control).toHaveAttribute('type', 'range');
      expect(control).toHaveValue('4');
    });

    it('announces a formatted value only when a locale is given', () => {
      const withLocale = renderWithTheme(
        <Slider
          {...label}
          max={500}
          defaultValue={250}
          locale="en-GB"
          formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
        />,
      );
      expect(withLocale.getByRole('slider')).toHaveAttribute('aria-valuetext', '£250');

      const without = renderWithTheme(<Slider aria-label="Plain" max={500} defaultValue={250} />);
      expect(without.getByRole('slider')).not.toHaveAttribute('aria-valuetext');
    });

    it('takes its name and description from the field', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Volume" description="Anything above 8 is unkind." controlId="vol">
          <Slider max={11} defaultValue={7} />
        </Field>,
      );
      const control = getByRole('slider');
      expect(control).toHaveAccessibleName('Volume');
      expect(control).toHaveAccessibleDescription('Anything above 8 is unkind.');
    });

    it('hides the decorative track from the accessibility tree', () => {
      const { container } = renderWithTheme(<Slider {...label} />);
      expect(container.querySelector('.pp-slider__track')).toHaveAttribute('aria-hidden', 'true');
    });

    it('has no axe violations, in a field and standalone', async () => {
      const inField = renderWithTheme(
        <Field label="Volume" description="Anything above 8 is unkind." controlId="vol-axe">
          <Slider max={11} defaultValue={7} />
        </Field>,
      );
      await expectNoA11yViolations(inField.container);

      const standalone = renderWithTheme(<Slider {...label} defaultValue={7} />);
      await expectNoA11yViolations(standalone.container);
    });
  });

  describe('structure and the API surface (RULES §5)', () => {
    it('forwards the ref to the control, not to the wrapper', () => {
      const ref = createRef<HTMLInputElement>();
      renderWithTheme(<Slider {...label} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toHaveClass('pp-slider__control');
    });

    it('merges className onto the root, which is the box', () => {
      const { container } = renderWithTheme(<Slider {...label} className="mine" />);
      const root = container.querySelector('.pp-slider');
      expect(root).toHaveClass('pp-slider', 'mine');
    });

    it('spreads the rest onto the control', () => {
      const { getByRole } = renderWithTheme(
        <Slider {...label} name="volume" data-testid="vol" />,
      );
      const control = getByRole('slider');
      expect(control).toHaveAttribute('name', 'volume');
      expect(control).toHaveAttribute('data-testid', 'vol');
    });

    it('never sets the HTML size attribute from the size prop', () => {
      const { getByRole } = renderWithTheme(<Slider {...label} size="lg" />);
      expect(getByRole('slider')).not.toHaveAttribute('size');
    });

    /*
     * No readOnly prop, and that is HTML's ruling rather than ours: the
     * attribute is defined for text-like controls and the browser ignores it on
     * a range. D-049 §4 settled the same shape for Select.
     */
    it('exposes no readOnly, so nothing promises what the platform refuses', () => {
      const props: Record<string, unknown> = { 'aria-label': 'Volume' };
      const { getByRole } = renderWithTheme(<Slider {...props} />);
      expect(getByRole('slider')).not.toHaveAttribute('readonly');
    });
  });
});

/**
 * React installs its own value setter on the input, so assigning `.value` and
 * dispatching `input` is ignored — the native setter has to be called through
 * the prototype for React to see the change. This is the standard workaround
 * and it is here rather than in each test because getting it wrong produces a
 * test that passes for the wrong reason: the DOM updates and React does not.
 */
function fireInput(control: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(control, value);
  control.dispatchEvent(new Event('input', { bubbles: true }));
}
