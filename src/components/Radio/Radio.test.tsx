import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

/*
 * WHAT IS DELIBERATELY NOT ASSERTED HERE.
 *
 * Anything painted — the 16/20/24 box, the solid fill, the dot, the focus
 * border, the 24px spacing target WCAG 2.5.8 conforms through — is a computed
 * style, and jsdom implements neither cascade layers nor `oklch()`. Those live
 * in tests/visual/harness.spec.ts.
 *
 * AND ANYTHING THE BROWSER DOES WITH ARROW KEYS. D-039 §5 is the ruling that
 * this component writes no keydown handler because radios sharing a `name`
 * already implement the APG pattern — jsdom implements none of it, so asserting
 * it here would assert jsdom rather than the claim. The arrow keys, the
 * wrapping and the skipping of disabled members are all in the browser suite.
 * What is asserted here is who owns the selection and what the DOM says.
 */
describe('Radio / RadioGroup', () => {
  describe('the name, which is the grouping', () => {
    it('generates one when none is given, and puts it on every radio', () => {
      const { container } = renderWithTheme(
        <RadioGroup>
          <Radio value="a" aria-label="A" />
          <Radio value="b" aria-label="B" />
        </RadioGroup>,
      );
      const names = [...container.querySelectorAll('input')].map((i) => i.name);

      expect(names[0]).toBeTruthy();
      expect(names[1]).toBe(names[0]);
    });

    /* D-039 §5's consequence, and the reason the generated name exists: two
       unnamed groups on one page would otherwise be ONE group, and selecting in
       either would silently clear the other. */
    it('gives two unnamed groups two different names', () => {
      const { container } = renderWithTheme(
        <>
          <RadioGroup>
            <Radio value="a" aria-label="A" />
          </RadioGroup>
          <RadioGroup>
            <Radio value="a" aria-label="A2" />
          </RadioGroup>
        </>,
      );
      const [first, second] = [...container.querySelectorAll('input')];

      expect(first?.name).toBeTruthy();
      expect(second?.name).not.toBe(first?.name);
    });

    it('takes an explicit name', () => {
      const { getByLabelText } = renderWithTheme(
        <RadioGroup name="target">
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );
      expect(getByLabelText('A')).toHaveAttribute('name', 'target');
    });
  });

  describe('selection is the group’s', () => {
    it('is uncontrolled: it seeds from defaultValue and then follows the user', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByLabelText } = renderWithTheme(
        <RadioGroup defaultValue="preview" onValueChange={onValueChange}>
          <Radio value="preview" aria-label="Preview" />
          <Radio value="production" aria-label="Production" />
        </RadioGroup>,
      );

      expect(getByLabelText('Preview')).toBeChecked();
      await user.click(getByLabelText('Production'));

      expect(getByLabelText('Production')).toBeChecked();
      expect(getByLabelText('Preview')).not.toBeChecked();
      expect(onValueChange).toHaveBeenCalledWith('production');
    });

    it('is controlled: clicking a pinned group does not move it', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByLabelText } = renderWithTheme(
        <RadioGroup value="preview" onValueChange={onValueChange}>
          <Radio value="preview" aria-label="Preview" />
          <Radio value="production" aria-label="Production" />
        </RadioGroup>,
      );

      await user.click(getByLabelText('Production'));

      expect(onValueChange).toHaveBeenCalledWith('production');
      expect(getByLabelText('Preview')).toBeChecked();
      expect(getByLabelText('Production')).not.toBeChecked();
    });

    it('is controlled: it follows its owner', async () => {
      const user = userEvent.setup();
      function Owner() {
        const [value, setValue] = useState('preview');
        return (
          <>
            <button type="button" onClick={() => setValue('production')}>
              Promote
            </button>
            <RadioGroup value={value} onValueChange={setValue}>
              <Radio value="preview" aria-label="Preview" />
              <Radio value="production" aria-label="Production" />
            </RadioGroup>
          </>
        );
      }
      const { getByLabelText, getByRole } = renderWithTheme(<Owner />);

      await user.click(getByRole('button', { name: 'Promote' }));
      expect(getByLabelText('Production')).toBeChecked();
    });

    it('selects nothing by default', () => {
      const { container } = renderWithTheme(
        <RadioGroup>
          <Radio value="a" aria-label="A" />
          <Radio value="b" aria-label="B" />
        </RadioGroup>,
      );
      expect(container.querySelectorAll('input:checked')).toHaveLength(0);
    });

    /* The empty string is how a CONTROLLED group says "nothing selected",
       because `undefined` is how useControllableState spells "uncontrolled". */
    it('is controlled and empty with value=""', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByLabelText, container } = renderWithTheme(
        <RadioGroup value="" onValueChange={onValueChange}>
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );

      expect(container.querySelectorAll('input:checked')).toHaveLength(0);
      await user.click(getByLabelText('A'));
      expect(onValueChange).toHaveBeenCalledWith('a');
      expect(container.querySelectorAll('input:checked')).toHaveLength(0);
    });
  });

  describe('data-state', () => {
    it('is checked / unchecked — the RULES §4 vocabulary', async () => {
      const user = userEvent.setup();
      const { getByLabelText, container } = renderWithTheme(
        <RadioGroup defaultValue="a">
          <Radio value="a" aria-label="A" />
          <Radio value="b" aria-label="B" />
        </RadioGroup>,
      );
      const roots = () => [...container.querySelectorAll('.pp-radio')];

      expect(roots().map((r) => r.getAttribute('data-state'))).toEqual(['checked', 'unchecked']);

      /* The half no per-radio state machine could get right: B is told it was
         selected, A is told NOTHING and must still stop being checked. */
      await user.click(getByLabelText('B'));
      expect(roots().map((r) => r.getAttribute('data-state'))).toEqual(['unchecked', 'checked']);
    });

    it('describes the state in the same render that changed it', async () => {
      const user = userEvent.setup();
      const { getByLabelText, container } = renderWithTheme(
        <RadioGroup>
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );
      await user.click(getByLabelText('A'));
      expect(container.querySelector('.pp-radio')).toHaveAttribute('data-state', 'checked');
    });

    /*
     * ABSENT, NOT WRONG. Outside a group nothing owns the selection: the radio
     * that gets deselected is never told, so React cannot describe it. The
     * stylesheet paints from `:checked` for exactly this case, which is asserted
     * in the browser suite.
     */
    it('is omitted with no group above it', () => {
      const { container } = renderWithTheme(<Radio value="a" aria-label="A" name="solo" />);
      expect(container.querySelector('.pp-radio')).not.toHaveAttribute('data-state');
    });
  });

  describe('the precedence rule', () => {
    it('takes size, required, disabled and invalid from the field', () => {
      const { container, getByLabelText } = renderWithTheme(
        <Field label="Target" size="lg" required disabled error="Bad" group>
          <RadioGroup>
            <Radio value="a" aria-label="A" />
          </RadioGroup>
        </Field>,
      );
      const group = container.querySelector('.pp-radio-group');
      const root = container.querySelector('.pp-radio');
      const control = getByLabelText('A');

      expect(group).toHaveAttribute('data-size', 'lg');
      expect(group).toHaveAttribute('data-invalid');
      expect(group).toHaveAttribute('data-disabled');
      expect(root).toHaveAttribute('data-size', 'lg');
      expect(root).toHaveAttribute('data-invalid');
      expect(control).toBeRequired();
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute('aria-invalid', 'true');
    });

    it('lets an explicit prop beat the field, for every one of the four', () => {
      const { container, getByLabelText } = renderWithTheme(
        <Field label="Target" size="lg" required disabled error="Bad" group>
          <RadioGroup size="sm" required={false} disabled={false} invalid={false}>
            <Radio value="a" aria-label="A" />
          </RadioGroup>
        </Field>,
      );
      const group = container.querySelector('.pp-radio-group');
      const control = getByLabelText('A');

      expect(group).toHaveAttribute('data-size', 'sm');
      expect(group).not.toHaveAttribute('data-invalid');
      expect(group).not.toHaveAttribute('data-disabled');
      expect(control).not.toBeRequired();
      expect(control).not.toBeDisabled();
    });

    /* The awkward half of the rule, asserted rather than the comfortable one. */
    it('enables a group that opts out of a disabled field', () => {
      const { getByLabelText } = renderWithTheme(
        <Field label="Target" disabled group>
          <RadioGroup disabled={false}>
            <Radio value="a" aria-label="A" />
          </RadioGroup>
        </Field>,
      );
      expect(getByLabelText('A')).not.toBeDisabled();
    });

    it('lets a single radio opt out of an enabled group, and in to a disabled one', () => {
      const { getByLabelText } = renderWithTheme(
        <>
          <RadioGroup>
            <Radio value="a" aria-label="A" disabled />
          </RadioGroup>
          <RadioGroup disabled>
            <Radio value="b" aria-label="B" disabled={false} />
          </RadioGroup>
        </>,
      );
      expect(getByLabelText('A')).toBeDisabled();
      expect(getByLabelText('B')).not.toBeDisabled();
    });

    /*
     * THE GROUP BEATS THE RADIO'S OWN FIELD, and this is the case that makes it
     * matter. `useField()` inside the group returns the INNER, per-option field,
     * which publishes its own defaults rather than the outer field's values —
     * FieldContextValue cannot spell "not set". Reading the group first is what
     * carries the outer `size="lg"` across the inner field's `md`.
     */
    it('carries the outer field’s size across a per-option inner field', () => {
      const { container } = renderWithTheme(
        <Field label="Target" size="lg" group>
          <RadioGroup>
            <Field label="Preview" orientation="horizontal">
              <Radio value="preview" />
            </Field>
          </RadioGroup>
        </Field>,
      );
      expect(container.querySelector('.pp-radio')).toHaveAttribute('data-size', 'lg');
    });

    it('falls back to md and valid with nothing above it', () => {
      const { container, getByLabelText } = renderWithTheme(
        <Radio value="a" aria-label="A" />,
      );
      expect(container.querySelector('.pp-radio')).toHaveAttribute('data-size', 'md');
      expect(getByLabelText('A')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('required', () => {
    /* On EVERY radio, not just the first: HTML treats the group as satisfied if
       any radio with that name is checked, and browsers differ on whether an
       unmarked member counts. */
    it('marks every radio in the group, and the group itself', () => {
      const { container } = renderWithTheme(
        <RadioGroup required>
          <Radio value="a" aria-label="A" />
          <Radio value="b" aria-label="B" />
          <Radio value="c" aria-label="C" />
        </RadioGroup>,
      );

      expect(container.querySelectorAll('input[required]')).toHaveLength(3);
      expect(container.querySelector('.pp-radio-group')).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('field wiring', () => {
    it('names the group with the field’s label and describes it with what rendered', () => {
      const { getByRole } = renderWithTheme(
        <Field label="Deployment target" description="Where it goes." error="Pick one." group>
          <RadioGroup>
            <Radio value="a" aria-label="A" />
          </RadioGroup>
        </Field>,
      );
      const group = getByRole('radiogroup');

      expect(group).toHaveAccessibleName('Deployment target');
      expect(group.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
      expect(group).toHaveAccessibleDescription(/Where it goes\./);
    });

    it('selects an option when its own field label is clicked', async () => {
      const user = userEvent.setup();
      const { getByText, getByLabelText } = renderWithTheme(
        <RadioGroup>
          <Field label="Preview" orientation="horizontal">
            <Radio value="preview" />
          </Field>
        </RadioGroup>,
      );

      await user.click(getByText('Preview'));
      expect(getByLabelText('Preview')).toBeChecked();
    });
  });

  describe('API surface', () => {
    it('forwards Radio’s ref to the control and RadioGroup’s to its root', () => {
      const radio = createRef<HTMLInputElement>();
      const group = createRef<HTMLDivElement>();
      renderWithTheme(
        <RadioGroup ref={group}>
          <Radio ref={radio} value="a" aria-label="A" />
        </RadioGroup>,
      );

      expect(radio.current?.tagName).toBe('INPUT');
      expect(group.current).toHaveAttribute('role', 'radiogroup');
    });

    it('puts className and style on the root and everything else on the control', () => {
      const { container, getByLabelText } = renderWithTheme(
        <Radio
          value="a"
          aria-label="A"
          className="mine"
          style={{ opacity: 0.5 }}
          data-testid="control"
          name="solo"
        />,
      );
      const root = container.querySelector('.pp-radio');

      expect(root).toHaveClass('pp-radio', 'mine');
      expect(root).toHaveStyle({ opacity: '0.5' });
      expect(getByLabelText('A')).toHaveAttribute('data-testid', 'control');
    });

    it('merges className and gap onto the group’s layout primitive', () => {
      const { container } = renderWithTheme(
        <RadioGroup className="mine" gap="5">
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );
      const group = container.querySelector('.pp-radio-group');

      expect(group).toHaveClass('pp-stack', 'pp-radio-group', 'mine');
      expect(group).toHaveAttribute('data-pp-gap', '5');
    });

    /* The default is load-bearing — it is the WCAG 2.5.8 spacing floor — so it
       is asserted rather than left to a reader of the props table. The gap it
       resolves to is measured in the browser suite. */
    it('defaults gap to "3", the 2.5.8 spacing floor', () => {
      const { container } = renderWithTheme(
        <RadioGroup>
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );
      expect(container.querySelector('.pp-radio-group')).toHaveAttribute('data-pp-gap', '3');
    });

    it('renders a wrapping Cluster when horizontal', () => {
      const { container } = renderWithTheme(
        <RadioGroup orientation="horizontal">
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );
      const group = container.querySelector('.pp-radio-group');

      expect(group).toHaveClass('pp-cluster');
      expect(group).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('still calls a native onChange, with the event', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const { getByLabelText } = renderWithTheme(
        <RadioGroup onValueChange={onValueChange}>
          <Radio value="a" aria-label="A" onChange={onChange} />
        </RadioGroup>,
      );

      await user.click(getByLabelText('A'));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]?.[0]).toHaveProperty('target');
      expect(onValueChange).toHaveBeenCalledWith('a');
    });

    it('lets a native onChange veto the selection with preventDefault', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByLabelText } = renderWithTheme(
        <RadioGroup onValueChange={onValueChange}>
          <Radio value="a" aria-label="A" onChange={(e) => e.preventDefault()} />
        </RadioGroup>,
      );

      await user.click(getByLabelText('A'));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('cannot be turned into another input type', () => {
      const { getByLabelText } = renderWithTheme(
        // @ts-expect-error — `type` is omitted from RadioProps; this is the
        // caller who does not typecheck, which is what D-031 is about.
        <Radio value="a" aria-label="A" type="checkbox" />,
      );
      expect(getByLabelText('A')).toHaveAttribute('type', 'radio');
    });

    it('cannot have its group role replaced', () => {
      const { getByRole } = renderWithTheme(
        // @ts-expect-error — `role` is omitted from RadioGroupProps.
        <RadioGroup role="group">
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );
      expect(getByRole('radiogroup')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations inside a field', async () => {
      const { container } = renderWithTheme(
        <Field label="Deployment target" description="Where it goes." group>
          <RadioGroup defaultValue="preview">
            <Field label="Preview" orientation="horizontal">
              <Radio value="preview" />
            </Field>
            <Field label="Production" orientation="horizontal">
              <Radio value="production" />
            </Field>
          </RadioGroup>
        </Field>,
      );
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when invalid, required and disabled', async () => {
      const { container } = renderWithTheme(
        <Field label="Deployment target" error="Pick one." required group>
          <RadioGroup>
            <Field label="Preview" orientation="horizontal">
              <Radio value="preview" />
            </Field>
            <Field label="Production" orientation="horizontal" >
              <Radio value="production" disabled />
            </Field>
          </RadioGroup>
        </Field>,
      );
      await expectNoA11yViolations(container);
    });

    it('selects on Space', async () => {
      const user = userEvent.setup();
      const { getByLabelText } = renderWithTheme(
        <RadioGroup>
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );
      const control = getByLabelText('A');

      control.focus();
      await user.keyboard(' ');
      expect(control).toBeChecked();
    });

    it('does nothing on Enter — native, and deliberate: Enter submits the form', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByLabelText } = renderWithTheme(
        <RadioGroup onValueChange={onValueChange}>
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );

      getByLabelText('A').focus();
      await user.keyboard('{Enter}');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does not re-select an already selected radio', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { getByLabelText } = renderWithTheme(
        <RadioGroup defaultValue="a" onValueChange={onValueChange}>
          <Radio value="a" aria-label="A" />
        </RadioGroup>,
      );

      await user.click(getByLabelText('A'));
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });
});
