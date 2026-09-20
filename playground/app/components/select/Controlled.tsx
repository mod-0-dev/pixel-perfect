'use client';

import { Field, Select, Stack, Text } from 'pixel-perfect';
import { useState } from 'react';

/**
 * The only interactive island on this page, which is why it is a file of its
 * own rather than a `'use client'` at the top of `page.tsx`. The page stays a
 * Server Component and renders this without becoming one.
 *
 * Every id here is written by hand, so it lives OUTSIDE the Matrix (D-035 §1).
 * The harness renders its subtree six times; six copies of `deploy-target`
 * would bind five labels to a control in another cell.
 *
 * It is also the one place `data-placeholder` appears, and that is the point
 * rather than a coincidence: the attribute describes what React knows, and
 * React only knows when the caller is controlled (D-049 §2).
 */
export function Controlled() {
  const [target, setTarget] = useState('');

  return (
    <Stack gap="2">
      <Field
        label="Deploy target"
        description="Nothing is deployed until you pick one."
        controlId="deploy-target"
      >
        <Select
          placeholder="Choose a target…"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        >
          <option value="preview">Preview</option>
          <option value="production">Production</option>
        </Select>
      </Field>

      <Text size="sm" tone="muted">
        {target === ''
          ? 'data-placeholder is on the root, because this Select is controlled and React knows.'
          : `Selected “${target}”, and the attribute is gone.`}
      </Text>
    </Stack>
  );
}
