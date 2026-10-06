'use client';

import { useId, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Field,
  Form,
  Grid,
  Heading,
  Icon,
  Input,
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
  Select,
  Stack,
  Text,
  Textarea,
  type FormError,
} from 'pixel-perfect';

import { CameraGlyph } from '../glyphs';

/*
 * The client island of the settings screen: the page header and the profile
 * form, together because the header's Save is the form's submit button
 * (`form` names the form; the button need not be inside it) and shows the
 * save in flight with `loading`. The other sections are the page's, on the
 * server. Validation is the app's job; `Form` renders the answer, summary
 * and all (Form.md).
 */

// Known ids, so each summary link has a control to move focus to (Form.md).
const NAME = 'profile-name';
const EMAIL = 'profile-email';
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: HTMLFormElement): FormError[] {
  const data = new FormData(form);
  const name = String(data.get('name') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const errors: FormError[] = [];
  if (!name) errors.push({ target: NAME, message: 'Enter your full name' });
  if (!email) errors.push({ target: EMAIL, message: 'Enter your email address' });
  else if (!EMAIL_SHAPE.test(email)) errors.push({ target: EMAIL, message: 'Enter an email address like mara@northwind.dev' });
  return errors;
}

export function ProfileSection() {
  const formId = useId();
  const headingId = useId();
  const [errors, setErrors] = useState<readonly FormError[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('Last saved on 2 October at 09:14');
  const messageFor = (target: string) => errors.find((error) => error.target === target)?.message;

  return (
    <>
      <PageHeader>
        <PageHeaderTitle size="xl">Settings</PageHeaderTitle>
        <PageHeaderDescription>
          Your profile, and the Northwind workspace&rsquo;s plan, team and security.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button variant="ghost" type="reset" form={formId}>
            Discard
          </Button>
          <Button tone="accent" type="submit" form={formId} loading={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <section id="settings-profile" aria-labelledby={headingId} className="example-section">
        <Card>
          <CardHeader>
            <Stack gap="1">
              <Heading level={2} size="sm" id={headingId}>
                Profile
              </Heading>
              <Text size="sm" tone="muted">
                How you appear to the eight people in Northwind.
              </Text>
            </Stack>
          </CardHeader>
          <CardBody>
            <Form
              id={formId}
              errors={errors}
              pending={saving}
              onSubmit={(event) => {
                event.preventDefault();
                const found = validate(event.currentTarget);
                setErrors(found);
                if (found.length > 0) return;
                setSaving(true);
                setStatus('Saving…');
                window.setTimeout(() => {
                  setSaving(false);
                  setStatus('Saved just now');
                }, 900);
              }}
              onChange={(event) => {
                // A message goes once its field is fixed; typing never adds one.
                if (errors.length === 0) return;
                const still = validate(event.currentTarget);
                setErrors(errors.flatMap((error) => still.filter((next) => next.target === error.target)));
              }}
              onReset={() => {
                setErrors([]);
                setStatus('Changes discarded');
              }}
            >
              {/* A track for the face and one for the rest, so the hint wraps beside the avatar rather than under it. */}
              <Grid columns="auto minmax(0, 1fr)" gap="4" align="center">
                <Avatar name="Mara Ellison" size="lg" tone="accent" />
                <Stack gap="1" align="start">
                  <Button size="sm" variant="outline">
                    <Icon decorative>
                      <CameraGlyph />
                    </Icon>
                    Change photo
                  </Button>
                  <Text size="sm" tone="muted">
                    A square PNG or JPG, at least 256 pixels.
                  </Text>
                </Stack>
              </Grid>

              <Grid minItemInlineSize="18rem" gap="4">
                <Field label="Full name" controlId={NAME} required error={messageFor(NAME)}>
                  <Input name="name" defaultValue="Mara Ellison" autoComplete="name" />
                </Field>
                <Field label="Email" controlId={EMAIL} required error={messageFor(EMAIL)}>
                  <Input type="email" name="email" defaultValue="mara@northwind.dev" autoComplete="email" />
                </Field>
                <Field label="Job title">
                  <Input name="title" defaultValue="Release manager" autoComplete="organization-title" />
                </Field>
                <Field label="Time zone">
                  <Select name="timezone" defaultValue="Europe/Tallinn">
                    <option value="Europe/London">London (UTC+01:00)</option>
                    <option value="Europe/Tallinn">Tallinn (UTC+03:00)</option>
                    <option value="America/New_York">New York (UTC−04:00)</option>
                    <option value="America/Los_Angeles">Los Angeles (UTC−07:00)</option>
                    <option value="Asia/Tokyo">Tokyo (UTC+09:00)</option>
                  </Select>
                </Field>
              </Grid>

              <Field label="Bio" description="Shown on your profile and beside every release you ship.">
                <Textarea
                  name="bio"
                  rows={3}
                  defaultValue="Ships the Northwind checkout every Tuesday. Ask me about feature flags, rollbacks and the 2 a.m. pager."
                />
              </Field>
            </Form>
          </CardBody>
          <CardFooter>
            <Text size="sm" tone="muted" role="status">
              {status}
            </Text>
          </CardFooter>
        </Card>
      </section>
    </>
  );
}
