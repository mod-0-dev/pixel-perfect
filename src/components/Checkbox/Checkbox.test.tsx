import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Checkbox, type CheckedState } from './Checkbox';

/*
 * WHAT IS DELIBERATELY NOT ASSERTED HERE.
 *
 * Anything about the painted box — its 16/20/24 size, the solid fill, the focus
 * border, the 24px spacing target WCAG 2.5.8 conforms through — is a computed
 * style, and jsdom implements neither cascade layers nor `oklch()`. Those live
 * in tests/visual/harness.spec.ts, where layout exists. The standing rule since
 * D-030 §2, when a jsdom test passed against a Button whose loading label had
 * been removed from the accessibility tree.
 *
 * What IS asserted here is the state machine: the third state, who is allowed
 * to produce it, and what the DOM says about it.
 */
describe('Checkbox', () => {
  describe('the precedence rule', () => {
    it('takes size, required, disabled and invalid from the field', () => {
      const { getByRole, container } = renderWithTheme(
        <Field label="Subscribe" size="lg" required disabled error="Bad" orientation="horizontal">
          <Checkbox />
        </Field>,
      );
      const root = container.querySelector('.pp-checkbox');
      const control = getByRole('checkbox');

      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root).toHaveAttribute('data-invalid');
      expect(root).toHaveAttribute('data-disabled');
      expect(control).toBeRequired();
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute('aria-invalid', 'true');
    });

    it('lets an explicit prop beat the field, for every one of the four', () => {
      const { container } = renderWithTheme(
        <Field label="Subscribe" size="lg" required disabled error="Bad">
          <Checkbox size="sm" required={false} disabled={false} invalid={false} />
        </Field>,
      );
      const root = container.querySelector('.pp-checkbox');
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
        <Field label="Subscribe" disabled>
          <Checkbox disabled={false} />
        </Field>,
      );
      expect(getByRole('checkbox')).not.toBeDisabled();
    });

    it('falls back to md and valid with no field above it', () => {
      const { container, getByRole } = renderWithTheme(<Checkbox aria-label="Subscribe" />);
      expect(container.querySelector('.pp-checkbox')).toHaveAttribute('data-size', 'md');
      expect(getByRole('checkbox')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('standalone invalid', () => {
    it('is invalid with no field and no error message', () => {
      const { container, getByRole } = renderWithTheme(
        <Checkbox aria-label="Subscribe" invalid />,
      );
      expect(getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
      expect(container.querySelector('.pp-checkbox')).toHaveAttribute('data-pp-tone', 'danger');
    });
  });

  describe('field wiring', () => {
    it('is named by the field label and described by what actually rendered', () => {
      const { getByLabelText } = renderWithTheme(
        <Field label="Email me" description="About releases only." error="Required">
          <Checkbox />
        </Field>,
      );
      const control = getByLabelText('Email me');
      const described = control.getAttribute('aria-describedby')?.split(' ') ?? [];

      expect(described).toHaveLength(2);
      for (const id of described) expect(document.getElementById(id)).not.toBeNull();
    });

    it('points aria-describedby at nothing when neither rendered', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Email me">
          <Checkbox />
        </Field>,
      );
      expect(getByRole('checkbox')).not.toHaveAttribute('aria-describedby');
    });

    /* The label is the rest of the target, and that is the whole WCAG 2.5.8
       argument for a 20px box — so it had better actually toggle it. */
    it('toggles when the field label is clicked, not merely focuses', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderWithTheme(
        <Field label="Email me" orientation="horizontal">
          <Checkbox />
        </Field>,
      );
      await user.click(getByText('Email me'));
      expect(getByRole('checkbox')).toBeChecked();
    });

    it('lets an explicit id beat the field-generated one', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Email me" controlId="email-me">
          <Checkbox id="other" />
        </Field>,
      );
      expect(getByRole('checkbox')).toHaveAttribute('id', 'other');
    });
  });

  describe('data-state', () => {
    it('is unchecked, checked and indeterminate — the RULES §4 vocabulary', () => {
      const { container, rerender } = renderWithTheme(<Checkbox aria-label="All" />);
      const root = () => container.querySelector('.pp-checkbox');

      expect(root()).toHaveAttribute('data-state', 'unchecked');

      rerender(<Checkbox aria-label="All" checked onCheckedChange={() => {}} />);
      expect(root()).toHaveAttribute('data-state', 'checked');

      rerender(<Checkbox aria-label="All" checked="indeterminate" onCheckedChange={() => {}} />);
      expect(root()).toHaveAttribute('data-state', 'indeterminate');
    });

    /* The reason this component holds state at all, where Input and Textarea do
       not (D-039 §6): data-state has to describe the checkedness in the render
       that emits it, and a native checkbox's checkedness lands one commit later. */
    it('describes the state in the same render that changed it', async () => {
      const user = userEvent.setup();
      const { container, getByRole } = renderWithTheme(<Checkbox aria-label="All" />);

      await user.click(getByRole('checkbox'));
      expect(container.querySelector('.pp-checkbox')).toHaveAttribute('data-state', 'checked');
    });

    it('renders a mark only when there is one to draw', () => {
      const { container, rerender } = renderWithTheme(<Checkbox aria-label="All" />);
      const mark = () => container.querySelector('.pp-checkbox__indicator');

      expect(mark()).toBeNull();

      rerender(<Checkbox aria-label="All" checked onCheckedChange={() => {}} />);
      expect(mark()).not.toBeNull();
      /* aria-hidden, so the accessibility tree sees one checkbox and not a
         checkbox plus a graphic. */
      expect(mark()).toHaveAttribute('aria-hidden', 'true');
    });

    it('draws a different mark for indeterminate than for checked', () => {
      const path = (checked: CheckedState) => {
        const { container, unmount } = renderWithTheme(
          <Checkbox aria-label="All" checked={checked} onCheckedChange={() => {}} />,
        );
        const d = container.querySelector('.pp-checkbox__indicator path')?.getAttribute('d');
        unmount();
        return d;
      };

      expect(path(true)).not.toBeNull();
      expect(path('indeterminate')).not.toBeNull();
      expect(path('indeterminate')).not.toBe(path(true));
    });
  });

  describe('indeterminate', () => {
    /* It has no HTML attribute — it is a DOM property only, which is why it is
       set from an effect and why it cannot cause a hydration mismatch. */
    it('sets the DOM property, and reports mixed to the accessibility tree', () => {
      const { getByRole } = renderWithTheme(
        <Checkbox aria-label="All" checked="indeterminate" onCheckedChange={() => {}} />,
      );
      const control = getByRole('checkbox') as HTMLInputElement;

      expect(control.indeterminate).toBe(true);
      expect(control).toBePartiallyChecked();
      /* The checked ATTRIBUTE stays false. A mixed checkbox is not a checked
         one, and submitting the form must not include it. */
      expect(control.checked).toBe(false);
    });

    it('clears the DOM property when the state leaves it', () => {
      const { getByRole, rerender } = renderWithTheme(
        <Checkbox aria-label="All" checked="indeterminate" onCheckedChange={() => {}} />,
      );
      const control = getByRole('checkbox') as HTMLInputElement;
      expect(control.indeterminate).toBe(true);

      rerender(<Checkbox aria-label="All" checked={false} onCheckedChange={() => {}} />);
      expect(control.indeterminate).toBe(false);
    });

    /* The platform's rule, and the "select all" case it exists for: a user can
       leave the third state but can never enter it. */
    it('produces true when clicked, never indeterminate', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Checkbox aria-label="All" defaultChecked="indeterminate" onCheckedChange={onCheckedChange} />,
      );

      await user.click(getByRole('checkbox'));

      expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
      expect(getByRole('checkbox')).toBeChecked();
      expect((getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(false);
    });

    /*
     * THE CASE THAT NEEDS THE RE-ASSERT IN THE CHANGE HANDLER.
     *
     * The click's activation behaviour clears `indeterminate` in the DOM. React
     * restores `checked` for a controlled input, but `indeterminate` is not a
     * prop it rendered, so nothing restores it — and a parent that ignores the
     * change never re-renders, so the effect does not run either. Without the
     * re-assert the dash silently disappears on the first click.
     */
    it('survives a click that a controlled parent refuses', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <Checkbox aria-label="All" checked="indeterminate" onCheckedChange={() => {}} />,
      );
      const control = getByRole('checkbox') as HTMLInputElement;

      await user.click(control);

      expect(control.indeterminate, 'the dash vanished on the first click').toBe(true);
      expect(control.checked).toBe(false);
      expect(control).toBePartiallyChecked();
    });
  });

  describe('controlled and uncontrolled', () => {
    it('is controlled: clicking a pinned checkbox does not move it', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Checkbox aria-label="All" checked={false} onCheckedChange={onCheckedChange} />,
      );

      await user.click(getByRole('checkbox'));

      expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
      expect(getByRole('checkbox')).not.toBeChecked();
    });

    it('is controlled: it follows its owner', async () => {
      const user = userEvent.setup();

      function Owner() {
        const [checked, setChecked] = useState<CheckedState>('indeterminate');
        return <Checkbox aria-label="All" checked={checked} onCheckedChange={setChecked} />;
      }

      const { getByRole } = renderWithTheme(<Owner />);
      const control = getByRole('checkbox') as HTMLInputElement;
      expect(control.indeterminate).toBe(true);

      await user.click(control);
      expect(control).toBeChecked();
      expect(control.indeterminate).toBe(false);

      await user.click(control);
      expect(control).not.toBeChecked();
    });

    it('is uncontrolled: it seeds from defaultChecked and then toggles', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Checkbox aria-label="All" defaultChecked onCheckedChange={onCheckedChange} />,
      );
      const control = getByRole('checkbox');

      expect(control).toBeChecked();
      await user.click(control);

      /* Fires in BOTH modes (D-032). An uncontrolled consumer needs it to
         observe, and a form that cannot observe its own checkbox is a form
         that has to read the DOM. */
      expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(false);
      expect(control).not.toBeChecked();
    });

    it('defaults to unchecked', () => {
      const { getByRole } = renderWithTheme(<Checkbox aria-label="All" />);
      expect(getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('API surface', () => {
    it('forwards ref to the control, not to the wrapper', () => {
      const ref = createRef<HTMLInputElement>();
      renderWithTheme(<Checkbox aria-label="All" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toHaveClass('pp-checkbox__input');
    });

    it('puts className and style on the root and everything else on the control', () => {
      const { container } = renderWithTheme(
        <Checkbox aria-label="All" className="mine" style={{ opacity: 0.5 }} name="all" />,
      );
      const root = container.querySelector('.pp-checkbox') as HTMLElement;

      expect(root).toHaveClass('pp-checkbox', 'mine');
      expect(root.style.opacity).toBe('0.5');
      expect(container.querySelector('input')).toHaveAttribute('name', 'all');
    });

    /*
     * `react-hook-form`'s register() returns { name, ref, onChange, onBlur } and
     * spreads them onto the control. A component that swallows onChange in
     * favour of its own callback is one that silently never registers — the
     * same argument D-039 §6 makes for the text controls, which survives here
     * even though this one does hold state.
     */
    it('still calls a native onChange, with the event', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onCheckedChange = vi.fn();
      const { getByRole } = renderWithTheme(
        <Checkbox aria-label="All" onChange={onChange} onCheckedChange={onCheckedChange} />,
      );

      await user.click(getByRole('checkbox'));

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0]?.[0]).toHaveProperty('target');
      expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
    });

    /* Omit does not delete properties, so a caller who does not typecheck can
       still hand us a type and turn a checkbox into a radio wearing a
       checkbox's classes and state machine (D-031). */
    it('cannot be turned into another input type', () => {
      const { getByRole } = renderWithTheme(
        // @ts-expect-error -- `type` is omitted from the props type; the point
        // is what happens to a caller who ignores that.
        <Checkbox aria-label="All" type="radio" />,
      );
      expect(getByRole('checkbox')).toHaveAttribute('type', 'checkbox');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations inside a field', async () => {
      const { container } = renderWithTheme(
        <Field label="Email me about releases" orientation="horizontal">
          <Checkbox defaultChecked />
        </Field>,
      );
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when invalid, disabled or indeterminate', async () => {
      const { container } = renderWithTheme(
        <>
          <Field label="A" error="Bad" orientation="horizontal">
            <Checkbox />
          </Field>
          <Field label="B" disabled orientation="horizontal">
            <Checkbox defaultChecked />
          </Field>
          <Checkbox aria-label="C" defaultChecked="indeterminate" />
        </>,
      );
      await expectNoA11yViolations(container);
    });

    it('toggles on Space', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Checkbox aria-label="All" />);
      const control = getByRole('checkbox');

      control.focus();
      await user.keyboard(' ');
      expect(control).toBeChecked();

      await user.keyboard(' ');
      expect(control).not.toBeChecked();
    });

    /*
     * APG's tri-state note says Space cycles through all three states. We
     * diverge deliberately (spec §3.10): indeterminate is a summary of other
     * checkboxes, and letting a user select it produces a "select all" claiming
     * a state its children contradict.
     */
    it('cycles two states on Space, not three', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(
        <Checkbox aria-label="All" defaultChecked="indeterminate" />,
      );
      const control = getByRole('checkbox') as HTMLInputElement;

      control.focus();
      for (let i = 0; i < 3; i += 1) {
        await user.keyboard(' ');
        expect(control.indeterminate, 'Space put the user back into the third state').toBe(false);
      }
    });

    /* Native and deliberate: Enter submits the form, and a checkbox that eats
       it is a form the keyboard cannot submit from. */
    it('does nothing on Enter', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithTheme(<Checkbox aria-label="All" />);
      const control = getByRole('checkbox');

      control.focus();
      await user.keyboard('{Enter}');
      expect(control).not.toBeChecked();
    });
  });
});
