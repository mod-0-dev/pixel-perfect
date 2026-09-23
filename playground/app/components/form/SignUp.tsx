'use client';

import {
  Button,
  Checkbox,
  Cluster,
  Field,
  Form,
  Input,
  Radio,
  RadioGroup,
  type FormError,
} from 'pixel-perfect';
import { useState, type SyntheticEvent } from 'react';

/**
 * The shape every real caller has: validate on submit, hand the result back as
 * `errors`, and pass each message to its Field as well (spec §3's cost, paid in
 * the open). Ids are real here, because this is outside any Matrix.
 *
 * "Slow server" makes the submit asynchronous — pending for 600ms, then the
 * result lands — which is what spec §5's pending row is about. "Nickname"
 * validates on blur, which is the row that must NOT move focus.
 */
export function SignUp() {
  const [errors, setErrors] = useState<FormError[]>([]);
  const [pending, setPending] = useState(false);
  const [slow, setSlow] = useState(false);
  const [submissions, setSubmissions] = useState(0);

  const messageFor = (target: string) => errors.find((e) => e.target === target)?.message;

  const validate = (data: FormData): FormError[] => {
    const next: FormError[] = [];
    if (!String(data.get('name') ?? '').trim()) next.push({ target: 'signup-name', message: 'Enter your name' });
    if (!String(data.get('email') ?? '').includes('@'))
      next.push({ target: 'signup-email', message: 'Enter an email address, like name@example.com' });
    if (!data.get('plan')) next.push({ target: 'signup-plan', message: 'Choose a plan' });
    return next;
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissions((n) => n + 1);
    const data = new FormData(event.currentTarget);
    if (!slow) {
      setErrors(validate(data));
      return;
    }
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setErrors(validate(data));
    }, 600);
  };

  return (
    <Form errors={errors} pending={pending} onSubmit={onSubmit} aria-label="Sign up" data-demo="signup">
      <Field label="Name" controlId="signup-name" error={messageFor('signup-name')} required>
        <Input name="name" />
      </Field>
      <Field label="Email" controlId="signup-email" error={messageFor('signup-email')} required>
        <Input name="email" type="email" />
      </Field>
      <Field
        label="Nickname"
        controlId="signup-nickname"
        description="Validated when you leave the field, not on submit."
        error={messageFor('signup-nickname')}
      >
        <Input
          name="nickname"
          onBlur={(event) => {
            const short = event.currentTarget.value.length > 0 && event.currentTarget.value.length < 3;
            setErrors((current) => [
              ...current.filter((e) => e.target !== 'signup-nickname'),
              ...(short ? [{ target: 'signup-nickname', message: 'Nickname must be 3 characters or more' }] : []),
            ]);
          }}
        />
      </Field>
      {/* A group Field: the summary targets the Field's own id (spec §3). */}
      <Field label="Plan" id="signup-plan" group error={messageFor('signup-plan')}>
        <RadioGroup name="plan">
          <Radio value="free" aria-label="Free" />
          <Radio value="pro" aria-label="Pro" />
        </RadioGroup>
      </Field>
      <Field label="Slow server" orientation="horizontal">
        <Checkbox checked={slow} onCheckedChange={(checked) => setSlow(checked === true)} />
      </Field>
      <Cluster gap="3" align="center">
        <Button type="submit" loading={pending}>
          Create account
        </Button>
        <span data-testid="submissions">Submissions: {submissions}</span>
      </Cluster>
    </Form>
  );
}
