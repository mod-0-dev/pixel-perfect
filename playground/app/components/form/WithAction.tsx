'use client';

import { Button, Cluster, Field, Form, Input, type FormError } from 'pixel-perfect';
import { useActionState } from 'react';

interface State {
  errors: FormError[];
  calls: number;
}

/**
 * A React 19 action. `pending` comes from `useActionState`, and spec §6 says a
 * submit while it is set is cancelled — and React does not dispatch an action
 * for a submit whose default was prevented, so a double submit reaches this
 * function once. The browser suite presses Enter twice and reads `calls`.
 */
async function save(previous: State, data: FormData): Promise<State> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const calls = previous.calls + 1;
  const code = String(data.get('code') ?? '');
  return code === '1234'
    ? { errors: [], calls }
    : { errors: [{ target: 'action-code', message: 'The code is 1234' }], calls };
}

export function WithAction() {
  const [state, action, isPending] = useActionState(save, { errors: [], calls: 0 });

  return (
    <Form action={action} errors={state.errors} pending={isPending} aria-label="Verify" data-demo="action">
      <Field
        label="Code"
        controlId="action-code"
        error={state.errors.find((e) => e.target === 'action-code')?.message}
      >
        <Input name="code" />
      </Field>
      <Cluster>
        <Button type="submit" loading={isPending}>
          Verify
        </Button>
      </Cluster>
      <p data-testid="action-calls">Action calls: {state.calls}</p>
    </Form>
  );
}
