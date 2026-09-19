import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Switch } from './Switch';

/*
 * WHAT IS DELIBERATELY NOT ASSERTED HERE.
 *
 * Anything about the painted track — the 2:1 ratio, the 16/20/24 block size,
 * the thumb's travel, the focus border, the contrast of the thumb against the
 * track — is a computed style, and jsdom implements neither cascade layers nor
 * `oklch()`. Those live in tests/visual/harness.spec.ts, where layout exists.
 * The standing rule since D-030 §2, when a jsdom test passed against a Button
 * whose loading label had been removed from the accessibility tree.
 *
 * What IS asserted here is the state machine, the role, and the precedence.
 */
describe('Switch', () => {
  describe('the precedence rule', () => {
    it('takes size, required, disabled and invalid from the field', () => {
      const { getByRole, container } = renderWithTheme(
        <Field label="Ship on merge" size="lg" required disabled error="Bad" orientation="horizontal">
          <Switch />
        </Field>,
      );
      const root = container.querySelector('.pp-switch');
      const control = getByRole('switch');

      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root).toHaveAttribute('data-invalid');
      expect(root).toHaveAttribute('data-disabled');
      expect(control).toBeRequired();
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute('aria-invalid', 'true');
    });

    it('lets an explicit prop beat the field, for every one of the four', () => {
      const { container } = renderWithTheme(
        <Field label="Ship on merge" size="lg" required disabled error="Bad">
          <Switch size="sm" required={false} disabled={false} invalid={false} />
        </Field>,
      );
      const root = container.querySelector('.pp-switch');
      const control = container.querySelector('input');

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
        <Field label="Ship on merge" disabled>
          <Switch disabled={false} />
        </Field>,
      );
      expect(getByRole('switch')).not.toBeDisabled();
    });

    it('falls back to md and valid with no field above it', () => {
      const { container, getByRole } = renderWithTheme(<Switch aria-label="Ship on merge" />);
      expect(container.querySelector('.pp-switch')).toHaveAttribute('data-size', 'md');
      expect(getByRole('switch')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('standalone invalid', () => {
    it('is invalid with no field and no error message', () => {
      const { container, getByRole } = renderWithTheme(<Switch aria-label="Ship" invalid />);
      expect(getByRole('switch')).toHaveAttribute('aria-invalid', 'true');
      expect(container.querySelector('.pp-switch')).toHaveAttribute('data-pp-tone', 'danger');
    });
  });

  describe('field wiring', () => {
    it('is named by the field label and described by what actually rendered', () => {
      const { getByLabelText } = renderWithTheme(
        <Field label="Ship on merge" description="Deploys as soon as a PR lands." error="Required">
          <Switch />
        </Field>,
      );
      const control = getByLabelText('Ship on merge');
      const described = control.getAttribute('aria-describedby')?.split(' ') ?? [];

      expect(described).toHaveLength(2);
      for (const id of described) expect(document.getElementById(id)).not.toBeNull();
    });

    it('points aria-describedby at nothing when neither rendered', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Ship on merge">
          <Switch />
        </Field>,
      );
      expect(getByRole('switch')).not.toHaveAttribute('aria-describedby');
    });

    /* The label is the rest of the target, so it had better actually flip it. */
    it('flips when the field label is clicked, not merely focuses', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderWithTheme(
        <Field label="Ship on merge" orientation="horizontal">
          <Switch />
        </Field>,
      );
      await user.click(getByText('Ship on merge'));
      expect(getByRole('switch')).toBeChecked();
    });

    it('lets an explicit id beat the field-generated one', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Ship on merge" controlId="ship">
          <Switch id="other" />
        </Field>,
      );
      expect(getByRole('switch')).toHaveAttribute('id', 'other');
    });
  });

  describe('the role', () => {
    /*
     * `role="switch"` on a native checkbox is the APG construction: the
     * semantics, the keyboard and the form participation stay, and only the
     * announced role changes. It is also the line D-030 §5 drew against
     * `Toggle`, which is aria-PRESSED — a button that stays down.
     */
    it('is a switch and not a checkbox', () => {
      const { getByRole, queryByRole } = renderWithTheme(<Switch aria-label="Ship" />);
      expect(getByRole('switch')).toHaveAttribute('type', 'checkbox');
      expect(queryByRole('checkbox')).toBeNull();
    });

    it('reports on and off as aria-checked, not as aria-pressed', () => {
      const { getByRole } = renderWithTheme(<Switch aria-label="Ship" defaultChecked />);
      const control = getByRole('switch');

      expect(control).toBeChecked();
      expect(control).not.toHaveAttribute('aria-pressed');
    });

    /* Omit does not delete properties (D-031): a caller who does not typecheck
       can still hand us a role or a type and get a control announced as one
       thing and behaving as another. */
    it('cannot be re-roled or turned into another input type', () => {
      const { getByRole } = renderWithTheme(
        // @ts-expect-error -- `role` and `type` are omitted from the props type;
        // the point is what happens to a caller who ignores that.
        <Switch aria-label="Ship" role="checkbox" type="radio" />,
      );
      expect(getByRole('switch')).toHaveAttribute('type', 'checkbox');
    });
  });

  describe('data-state', () => {
    it('is checked and unchecked — the RULES §4 vocabulary, not on/off', () => {
      const { container, rerender } = renderWithTheme(<Switch aria-label="Ship" />);
      const root = () => container.querySelector('.pp-switch');

      expect(root()).toHaveAttribute('data-state', 'unchecked');

      rerender(<Switch aria-label="Ship" checked onCheckedChange={() => {}} />);
      expect(root()).toHaveAttribute('data-state', 'checked');
    });

    /*
     * The reason this component holds state at all, where Input and Textarea do
     * not (D-039 §6): data-state has to describe the checkedness in the render
     * that emits it, and a native checkbox's checkedness lands one commit later.
     *
     * It is also why this stylesheet reads the attribute and Radio's does not
     * (D-047 §2): every change to a switch is an event on that switch, so there
     * is no case where React does not know.
     */
    it('describes the state in the same render that changed it', async () => {
      const user = userEvent.setup();
      const { container, getByRole } = renderWithTheme(<Switch aria-label="Ship" />);

      await user.click(getByRole('switch'));
      expect(container.querySelector('.pp-switch')).toHaveAttribute('data-state', 'checked');
    });

    /* Always rendered, in both states: the thumb is the state indicator and it
       moves rather than appearing. Checkbox's mark is conditional because an
       unchecked checkbox has no mark to draw. */
    it('renders the thumb in both states, hidden from the accessibility tree', () => {
      const { container, rerender } = renderWithTheme(<Switch aria-label="Ship" />);
      const thumb = () => container.querySelector('.pp-switch__thumb');

      expect(thumb()).not.toBeNull();
      expect(thumb()).toHaveAttribute('aria-hidden', 'true');

      rerender(<Switch aria-label="Ship" checked onCheckedChange={() => {}} />);
      expect(thumb()).not.toBeNull();
    });
  });

  describe('controlled and uncontrolled', () => {
    it('is controlled: clicking a pinned switch does not move it', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Switch aria-label="Ship" checked={false} onCheckedChange={onCheckedChange} />,
      );

      await user.click(getByRole('switch'));

      expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
      expect(getByRole('switch')).not.toBeChecked();
    });

    it('is controlled: it follows its owner', async () => {
      const user = userEvent.setup();

      function Owner() {
        const [checked, setChecked] = useState(false);
        return <Switch aria-label="Ship" checked={checked} onCheckedChange={setChecked} />;
      }

      const { getByRole } = renderWithTheme(<Owner />);
      const control = getByRole('switch');

      await user.click(control);
      expect(control).toBeChecked();

      await user.click(control);
      expect(control).not.toBeChecked();
    });

    it('is uncontrolled: it seeds from defaultChecked and then flips', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Switch aria-label="Ship" defaultChecked onCheckedChange={onCheckedChange} />,
      );
      const control = getByRole('switch');

      expect(control).toBeChecked();
      await user.click(control);

      /* Fires in BOTH modes (D-032). An uncontrolled consumer needs it to
         observe, and a switch whose effect is immediate is the component where
         not observing the change is not an option. */
      expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(false);
      expect(control).not.toBeChecked();
    });

    it('defaults to off', () => {
      const { getByRole } = renderWithTheme(<Switch aria-label="Ship" />);
      expect(getByRole('switch')).not.toBeChecked();
    });
  });

  describe('API surface', () => {
    it('forwards ref to the control, not to the wrapper', () => {
      const ref = createRef<HTMLInputElement>();
      renderWithTheme(<Switch aria-label="Ship" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toHaveClass('pp-switch__input');
    });

    it('puts className and style on the root and everything else on the control', () => {
      const { container } = renderWithTheme(
        <Switch aria-label="Ship" className="mine" style={{ opacity: 0.5 }} name="ship" />,
      );
      const root = container.querySelector('.pp-switch') as HTMLElement;

      expect(root).toHaveClass('pp-switch', 'mine');
      expect(root.style.opacity).toBe('0.5');
      expect(container.querySelector('input')).toHaveAttribute('name', 'ship');
    });

    /*
     * `react-hook-form`'s register() returns { name, ref, onChange, onBlur } and
     * spreads them onto the control. A component that swallows onChange in
     * favour of its own callback is one that silently never registers (D-039 §6).
     */
    it('still calls a native onChange, with the event', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onCheckedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Switch aria-label="Ship" onChange={onChange} onCheckedChange={onCheckedChange} />,
      );

      await user.click(getByRole('switch'));

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0]?.[0]).toHaveProperty('target');
      expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
    });

    /* The same line Radio's handler has, and the one that is NOT inert there:
       a caller who preventDefaults the change is refusing it, and the component
       has to leave its own state alone. */
    it('leaves the state alone when the native handler prevents the change', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      const { getByRole, container } = renderWithTheme(
        <Switch
          aria-label="Ship"
          onChange={(event) => event.preventDefault()}
          onCheckedChange={onCheckedChange}
        />,
      );

      await user.click(getByRole('switch'));

      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(container.querySelector('.pp-switch')).toHaveAttribute('data-state', 'unchecked');
    });

    it('participates in a form under its own name', () => {
      const { container } = renderWithTheme(
        <form>
          <Switch aria-label="Ship" name="ship" value="yes" defaultChecked />
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(new FormData(form).get('ship')).toBe('yes');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations inside a field', async () => {
      const { container } = renderWithTheme(
        <Field
          label="Ship on merge"
          description="Deploys to production as soon as a PR lands."
          orientation="horizontal"
        >
          <Switch defaultChecked />
        </Field>,
      );
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when invalid or disabled', async () => {
      const { container } = renderWithTheme(
        <>
          <Field label="A" error="Bad" orientation="horizontal">
            <Switch />
          </Field>
          <Field label="B" disabled orientation="horizontal">
            <Switch defaultChecked />
          </Field>
        </>,
      );
      await expectNoA11yViolations(container);
    });

    it('flips on Space', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Switch aria-label="Ship" />);
      const control = getByRole('switch');

      control.focus();
      await user.keyboard(' ');
      expect(control).toBeChecked();

      await user.keyboard(' ');
      expect(control).not.toBeChecked();
    });

    /*
     * APG lists Enter as OPTIONAL for switches. Not implemented, for D-030 §3's
     * reason: a switch lives in a form, and Enter in a form submits it. A
     * switch that eats Enter is a form the keyboard cannot submit from.
     */
    it('does nothing on Enter', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Switch aria-label="Ship" />);
      const control = getByRole('switch');

      control.focus();
      await user.keyboard('{Enter}');
      expect(control).not.toBeChecked();
    });
  });
});
