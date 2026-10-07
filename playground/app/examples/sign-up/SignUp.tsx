'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Checkbox,
  Field,
  Form,
  Heading,
  Icon,
  Input,
  Link,
  Stack,
  Step,
  Stepper,
  Text,
  type FormError,
} from '@mod-0-dev/pixel-perfect';

import { MailGlyph } from '../glyphs';

/*
 * The client island of the sign-up screen: the stepper and the card, because
 * a successful first step moves the stepper. The app validates; `Form`
 * renders the answer. Submit with the fields empty and the summary appears
 * above them with focus on it, one link per problem, each moving focus to
 * its field (Form.md). Fixing a field drops its message as you type.
 */

// Known ids: each summary link targets one (Form.md, "Don't").
const ID = {
  name: 'signup-name',
  email: 'signup-email',
  password: 'signup-password',
  terms: 'signup-terms',
} as const;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: HTMLFormElement): FormError[] {
  const data = new FormData(form);
  const name = String(data.get('name') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const password = String(data.get('password') ?? '');
  const errors: FormError[] = [];
  if (!name) errors.push({ target: ID.name, message: 'Enter your full name' });
  if (!email) errors.push({ target: ID.email, message: 'Enter your work email' });
  else if (!EMAIL_SHAPE.test(email)) errors.push({ target: ID.email, message: 'Enter an email address like you@company.com' });
  if (password.length < 12 || !/\d/.test(password)) {
    errors.push({ target: ID.password, message: 'Choose a password of 12 or more characters, with a number' });
  }
  if (data.get('terms') !== 'on') errors.push({ target: ID.terms, message: 'Agree to the terms to create an account' });
  return errors;
}

// Icon's own properties: the accent's solid step, a size above the icon scale.
const ACCENT_GLYPH = { '--pp-icon-color': 'var(--pp-tone-solid)', '--pp-icon-size': 'var(--pp-size-8)' } as CSSProperties;

export function SignUp() {
  const [errors, setErrors] = useState<readonly FormError[]>([]);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const messageFor = (target: string) => errors.find((error) => error.target === target)?.message;

  // The form is gone once the email is sent; focus goes to what replaced it.
  useEffect(() => {
    if (sentTo) confirmation.current?.focus();
  }, [sentTo]);

  return (
    <Stack gap="6">
      <Stepper label="Sign-up steps">
        <Step status={sentTo ? 'complete' : 'current'} description="Name and email">
          Account
        </Step>
        <Step status={sentTo ? 'current' : 'upcoming'} description="Invite your team">
          Workspace
        </Step>
        <Step description="Connect a repository">First project</Step>
      </Stepper>

      <Card>
        {sentTo ? (
          <CardBody>
            <Center gap="4">
              <Icon decorative data-pp-tone="accent" style={ACCENT_GLYPH}>
                <MailGlyph />
              </Icon>
              <Heading level={2} size="lg" align="center" ref={confirmation} tabIndex={-1}>
                Check your inbox
              </Heading>
              <Text tone="muted" align="center">
                We sent a link to <strong>{sentTo}</strong>. Open it on this device to confirm the address,
                then name your workspace.
              </Text>
              <Button variant="outline" onClick={() => setSentTo(null)}>
                Use a different email
              </Button>
            </Center>
          </CardBody>
        ) : (
          <>
            <CardHeader>
              <Stack gap="1">
                <Heading level={2} size="lg">
                  Create your account
                </Heading>
                <Text size="sm" tone="muted">
                  Fourteen days of Pro, free. No card needed.
                </Text>
              </Stack>
            </CardHeader>
            <CardBody>
              <Form
                errors={errors}
                pending={pending}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const found = validate(form);
                  setErrors(found);
                  if (found.length > 0) return;
                  setPending(true);
                  const email = String(new FormData(form).get('email') ?? '').trim();
                  window.setTimeout(() => {
                    setPending(false);
                    setSentTo(email);
                  }, 900);
                }}
                onChange={(event) => {
                  // A message goes once its field is fixed; typing never adds one.
                  if (errors.length === 0) return;
                  const still = validate(event.currentTarget);
                  setErrors(errors.flatMap((error) => still.filter((next) => next.target === error.target)));
                }}
              >
                <Field label="Full name" controlId={ID.name} required error={messageFor(ID.name)}>
                  <Input name="name" autoComplete="name" />
                </Field>
                <Field label="Work email" controlId={ID.email} required error={messageFor(ID.email)}>
                  <Input name="email" type="email" autoComplete="email" placeholder="you@company.com" />
                </Field>
                <Field
                  label="Password"
                  controlId={ID.password}
                  required
                  description="At least 12 characters, with one number."
                  error={messageFor(ID.password)}
                >
                  <Input name="password" type="password" autoComplete="new-password" />
                </Field>
                <Field
                  label={
                    <>
                      I agree to the <Link href="#">Terms of Service</Link> and{' '}
                      <Link href="#">Privacy Policy</Link>
                    </>
                  }
                  orientation="horizontal"
                  controlId={ID.terms}
                  required
                  error={messageFor(ID.terms)}
                >
                  <Checkbox name="terms" />
                </Field>
                <Button type="submit" tone="accent" size="lg" loading={pending}>
                  {pending ? 'Creating your account…' : 'Create account'}
                </Button>
              </Form>
            </CardBody>
          </>
        )}
      </Card>
    </Stack>
  );
}
