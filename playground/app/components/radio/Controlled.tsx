'use client';

import { Field, Radio, RadioGroup, Stack, Text } from 'pixel-perfect';
import { useState } from 'react';

const TARGETS = [
  { value: 'preview', label: 'Preview' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
] as const;

/**
 * The only interactive island on this page, which is why it is a file of its
 * own rather than a `'use client'` at the top of `page.tsx`. The page stays a
 * Server Component and renders this client component without becoming one.
 *
 * Every id here is written by hand, so it lives OUTSIDE the Matrix (D-035 §1).
 * The harness renders its subtree six times; six copies of `target-preview`
 * would bind five labels to a control in another cell.
 */
export function Controlled() {
  const [value, setValue] = useState('staging');

  return (
    <Stack gap="2">
      <Field label="Deployment target" description="Changes take effect on the next push." group>
        {/* `name` is given here because the ids are: this demo is unique on the
            page, so nothing is gained by generating one and a stable name is
            easier to read in the DOM. Inside a Matrix it would be the bug —
            six cells sharing one name is one group. */}
        <RadioGroup name="target" value={value} onValueChange={setValue}>
          {TARGETS.map((target) => (
            <Field
              key={target.value}
              label={target.label}
              orientation="horizontal"
              controlId={`target-${target.value}`}
            >
              <Radio value={target.value} />
            </Field>
          ))}
        </RadioGroup>
      </Field>

      <Text size="sm" tone="muted">
        value: <code>{value}</code>
      </Text>
    </Stack>
  );
}
