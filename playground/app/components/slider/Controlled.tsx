'use client';

import { Field, Slider, Stack, Text } from 'pixel-perfect';
import { useState } from 'react';

/**
 * The only interactive island on this page, so it is a file of its own and the
 * page stays a Server Component. Every id here is written by hand, so it lives
 * OUTSIDE the Matrix (D-035 §1).
 *
 * It is also the demo for the one prop that is not in §1's shared contract.
 * `onValueChange` fires on every pixel of a drag; `onValueCommit` fires once,
 * when the user lets go. Wiring a request to the first is one request per
 * pointer move, and the counter below is what makes that visible rather than
 * theoretical.
 */
export function Controlled() {
  const [value, setValue] = useState(40);
  const [changes, setChanges] = useState(0);
  const [commits, setCommits] = useState(0);

  return (
    <Stack gap="2">
      <Field
        label="Budget"
        description="Drag the thumb, then let go, and compare the two counters."
        controlId="controlled-budget"
      >
        <Slider
          max={100}
          step={1}
          value={value}
          onValueChange={(next) => {
            setValue(next);
            setChanges((n) => n + 1);
          }}
          onValueCommit={() => setCommits((n) => n + 1)}
        />
      </Field>

      <Text size="sm" tone="muted">
        value {value} · onValueChange fired {changes}× · onValueCommit fired {commits}×
      </Text>
    </Stack>
  );
}
