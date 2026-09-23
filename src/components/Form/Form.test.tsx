import { createRef, useState, type SyntheticEvent } from 'react';
import { act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';
import { Radio } from '../Radio/Radio';
import { RadioGroup } from '../Radio/RadioGroup';
import { Form, type FormError } from './Form';

const EMAIL: FormError = { target: 'email', message: 'Enter an email address' };
const NAME: FormError = { target: 'name', message: 'Enter your name' };

/** A task, so React's own flush and the component's post-submit timer have both run. */
const tick = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));

/**
 * The shape every real caller has: validate on submit, hand the result back.
 * `validate` is swappable per test so the same harness covers failure, success
 * and a second failure.
 */
function Validating({
  validate,
  pendingFor,
}: {
  validate: () => FormError[];
  /** When set, the submit is "async": pending for this many ms, then the result lands. */
  pendingFor?: number;
}) {
  const [errors, setErrors] = useState<FormError[]>([]);
  const [pending, setPending] = useState(false);
  return (
    <Form
      errors={errors}
      pending={pending}
      onSubmit={(event: SyntheticEvent) => {
        event.preventDefault();
        if (pendingFor === undefined) {
          setErrors(validate());
          return;
        }
        setPending(true);
        setTimeout(() => {
          setPending(false);
          setErrors(validate());
        }, pendingFor);
      }}
    >
      <Field label="Name" controlId="name" error={errors.find((e) => e.target === 'name')?.message}>
        <Input />
      </Field>
      <Field label="Email" controlId="email" error={errors.find((e) => e.target === 'email')?.message}>
        <Input />
      </Field>
      {/* Live validation: sets an error on blur, with no submit involved. */}
      <Field label="Nickname" controlId="nickname">
        <Input
          onBlur={() => setErrors([{ target: 'nickname', message: 'Too short' }])}
        />
      </Field>
      <button type="submit">Continue</button>
    </Form>
  );
}

describe('Form', () => {
  it('renders a form with the fill layout, gap 5 and noValidate by default, and no summary', () => {
    const { container } = renderWithTheme(<Form />);
    const form = container.querySelector('form')!;

    expect(form).toHaveClass('pp-form');
    // D-020: always emitted, so a Stack inside does not inherit the form's gap.
    expect(form).toHaveAttribute('data-pp-gap', '5');
    // Spec §7: native validation would cancel the submit before the app saw it.
    expect(form.noValidate).toBe(true);
    expect(form).not.toHaveAttribute('data-pending');
    expect(container.querySelector('.pp-form__summary')).toBeNull();
  });

  it('takes a gap and lets noValidate be turned back off', () => {
    const { container } = renderWithTheme(<Form gap="2" noValidate={false} />);
    const form = container.querySelector('form')!;
    expect(form).toHaveAttribute('data-pp-gap', '2');
    expect(form.noValidate).toBe(false);
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLFormElement>();
    const { container } = renderWithTheme(
      <Form ref={ref} className="mine" style={{ opacity: 0.5 }} aria-label="Sign up" method="post" />,
    );
    const form = container.querySelector('form')!;
    expect(ref.current).toBe(form);
    expect(form).toHaveClass('pp-form', 'mine');
    expect(form).toHaveStyle({ opacity: '0.5' });
    expect(form).toHaveAttribute('aria-label', 'Sign up');
    expect(form).toHaveAttribute('method', 'post');
  });

  describe('the summary', () => {
    it('is a danger Alert with a list of links, in the order given', () => {
      const { container, getAllByRole } = renderWithTheme(<Form errors={[NAME, EMAIL]} />);
      const summary = container.querySelector('.pp-form__summary')!;

      expect(summary).toHaveClass('pp-alert');
      expect(summary).toHaveAttribute('data-pp-tone', 'danger');
      // Spec §2: focus is what announces it; a live region would read it twice.
      expect(summary).not.toHaveAttribute('role');
      expect(summary).toHaveAttribute('tabindex', '-1');
      expect(container.querySelector('.pp-alert__title')).toHaveTextContent('There is a problem');

      const links = getAllByRole('link');
      expect(links.map((l) => l.textContent)).toEqual(['Enter your name', 'Enter an email address']);
      expect(links.map((l) => l.getAttribute('href'))).toEqual(['#name', '#email']);
      expect(container.querySelector('ul.pp-form__errors')!.children).toHaveLength(2);
    });

    it('is the first child of the form', () => {
      const { container } = renderWithTheme(
        <Form errors={[EMAIL]}>
          <p>content</p>
        </Form>,
      );
      expect(container.querySelector('form')!.firstElementChild).toHaveClass('pp-form__summary');
    });

    it('draws its links in the danger tone, not Link\'s accent default', () => {
      // Spec §2. Link sets its own data-pp-tone; left to default it would put
      // accent's text on danger's step 3, a pairing no check asserts.
      const { getByRole } = renderWithTheme(<Form errors={[EMAIL]} />);
      expect(getByRole('link')).toHaveAttribute('data-pp-tone', 'danger');
    });

    it('takes a title, including an element for heading semantics', () => {
      const { getByRole } = renderWithTheme(
        <Form errors={[EMAIL]} errorTitle={<h2>2 problems</h2>} />,
      );
      expect(getByRole('heading', { level: 2 })).toHaveTextContent('2 problems');
    });

    it('renders nothing for an empty array', () => {
      const { container } = renderWithTheme(<Form errors={[]} />);
      expect(container.querySelector('.pp-form__summary')).toBeNull();
    });
  });

  describe('focus — spec §5, one test per row', () => {
    it('moves to the summary after a submit that produced errors', async () => {
      const user = userEvent.setup();
      const { container, getByRole } = renderWithTheme(<Validating validate={() => [EMAIL]} />);

      await user.click(getByRole('button', { name: 'Continue' }));
      expect(document.activeElement).toBe(container.querySelector('.pp-form__summary'));
    });

    it('moves there again when a resubmission fails again', async () => {
      const user = userEvent.setup();
      const { container, getByRole, getByLabelText } = renderWithTheme(
        <Validating validate={() => [EMAIL]} />,
      );

      await user.click(getByRole('button', { name: 'Continue' }));
      await user.click(getByLabelText('Name'));
      expect(document.activeElement).toBe(getByLabelText('Name'));

      await user.click(getByRole('button', { name: 'Continue' }));
      expect(document.activeElement).toBe(container.querySelector('.pp-form__summary'));
    });

    it('does NOT move when errors change with no submit awaiting a result', async () => {
      // The row that fails silently in production: validation on blur.
      const user = userEvent.setup();
      const { container, getByLabelText } = renderWithTheme(<Validating validate={() => []} />);

      await user.click(getByLabelText('Nickname'));
      await user.click(getByLabelText('Name'));

      expect(container.querySelector('.pp-form__summary')).not.toBeNull();
      expect(document.activeElement).toBe(getByLabelText('Name'));
    });

    it('does NOT move on a later error after a submit that succeeded', async () => {
      // A synchronous success changes nothing a React effect can see, so the
      // flag has to be cleared by the post-submit timer or this steals focus.
      const user = userEvent.setup();
      const { getByRole, getByLabelText } = renderWithTheme(<Validating validate={() => []} />);

      await user.click(getByRole('button', { name: 'Continue' }));
      await tick();
      await user.click(getByLabelText('Nickname'));
      await user.click(getByLabelText('Name'));

      expect(document.activeElement).toBe(getByLabelText('Name'));
    });

    it('moves to the summary when the form mounts with errors', () => {
      // A no-JS round trip or a server action's full-page response.
      const { container } = renderWithTheme(<Form errors={[EMAIL]} />);
      expect(document.activeElement).toBe(container.querySelector('.pp-form__summary'));
    });

    it('does NOT move when errors arrive on a later render with no submit', () => {
      const { container, rerender } = renderWithTheme(
        <Form errors={[]}>
          <input aria-label="x" />
        </Form>,
      );
      const input = container.querySelector('input')!;
      input.focus();
      rerender(
        <Form errors={[EMAIL]}>
          <input aria-label="x" />
        </Form>,
      );
      expect(document.activeElement).toBe(input);
    });

    it('waits through pending for an async result, then moves', async () => {
      const user = userEvent.setup();
      const { container, getByRole } = renderWithTheme(
        <Validating validate={() => [EMAIL]} pendingFor={20} />,
      );

      await user.click(getByRole('button', { name: 'Continue' }));
      expect(container.querySelector('form')).toHaveAttribute('data-pending');
      // Past the post-submit timer, which must NOT have cleared the flag.
      await tick();
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 40)));

      expect(container.querySelector('form')).not.toHaveAttribute('data-pending');
      expect(document.activeElement).toBe(container.querySelector('.pp-form__summary'));
    });
  });

  describe('pending — spec §6', () => {
    it('cancels a submit while set, before onSubmit sees it', () => {
      const onSubmit = vi.fn();
      const { container } = renderWithTheme(<Form pending onSubmit={onSubmit} />);
      const form = container.querySelector('form')!;

      expect(form).toHaveAttribute('data-pending');
      const allowed = fireEvent.submit(form);
      expect(allowed).toBe(false); // defaultPrevented
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not disable anything', () => {
      const { getByRole } = renderWithTheme(
        <Form pending>
          <input aria-label="x" />
          <button type="submit">Go</button>
        </Form>,
      );
      expect(getByRole('button', { name: 'Go' })).toBeEnabled();
      expect(getByRole('textbox')).toBeEnabled();
      expect(getByRole('button', { name: 'Go' }).closest('form')).not.toHaveAttribute('aria-busy');
    });

    it('passes a submit through when not pending', () => {
      const onSubmit = vi.fn((event: SyntheticEvent) => event.preventDefault());
      const { container } = renderWithTheme(<Form onSubmit={onSubmit} />);
      fireEvent.submit(container.querySelector('form')!);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('summary links — spec §4', () => {
    it('focus the target control and scroll its whole field into view', async () => {
      const user = userEvent.setup();
      const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
      const { getByRole, getByLabelText, container } = renderWithTheme(
        <Form errors={[EMAIL]}>
          <Field label="Email" controlId="email" error="Enter an email address">
            <Input />
          </Field>
        </Form>,
      );

      await user.click(getByRole('link', { name: 'Enter an email address' }));

      expect(document.activeElement).toBe(getByLabelText('Email'));
      // The FIELD, so the label and the message are in view with the control.
      expect(scroll.mock.contexts.at(-1)).toBe(container.querySelector('.pp-field'));
      expect(scroll).toHaveBeenLastCalledWith({ block: 'start' });
      scroll.mockRestore();
    });

    it('prevent the default only when the target exists', () => {
      const { getByRole } = renderWithTheme(<Form errors={[{ target: 'nowhere', message: 'x' }]} />);
      // A dead link is left to the browser.
      expect(fireEvent.click(getByRole('link'))).toBe(true);
    });

    it('focus the checked radio inside a group target, else the first', async () => {
      const user = userEvent.setup();
      const group = (defaultValue?: string) =>
        renderWithTheme(
          <Form errors={[{ target: 'plan', message: 'Choose a plan' }]}>
            <Field label="Plan" id="plan" group>
              <RadioGroup {...(defaultValue === undefined ? {} : { defaultValue })}>
                <Radio value="free" aria-label="Free" />
                <Radio value="pro" aria-label="Pro" />
              </RadioGroup>
            </Field>
          </Form>,
        );

      const checked = group('pro');
      await user.click(checked.getByRole('link'));
      expect(document.activeElement).toBe(checked.getByRole('radio', { name: 'Pro' }));
      checked.unmount();

      const none = group();
      await user.click(none.getByRole('link'));
      expect(document.activeElement).toBe(none.getByRole('radio', { name: 'Free' }));
    });
  });

  it('has no axe violations, with a summary and fields', async () => {
    const { container } = renderWithTheme(
      <Form errors={[EMAIL]} aria-label="Sign up">
        <Field label="Email" controlId="email" error="Enter an email address">
          <Input />
        </Field>
        <button type="submit">Continue</button>
      </Form>,
    );
    await expectNoA11yViolations(container);
  });
});
