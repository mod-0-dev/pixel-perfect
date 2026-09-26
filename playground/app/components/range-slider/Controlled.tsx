'use client';

import { Field, RangeSlider, Stack, Text } from 'pixel-perfect';
import { useState } from 'react';

/**
 * The only interactive island on this page, so it is a file of its own and the
 * page stays a Server Component. Nothing here writes an id — the inputs have
 * none by design (the group is named by the field) — but the counters are
 * state, so it lives outside the Matrix all the same (D-035 §1).
 *
 * `onValueChange` fires on every pixel of a drag, for either thumb or for a
 * track press that keeps dragging; `onValueCommit` fires once, on release. The
 * counters make the difference visible, and the browser suite reads them.
 */
export function Controlled() {
  const [value, setValue] = useState<[number, number]>([20, 80]);
  const [changes, setChanges] = useState(0);
  const [commits, setCommits] = useState(0);

  return (
    <Stack gap="2">
      <Field
        label="Budget"
        group
        description="Drag a thumb or press the track, then let go, and compare the two counters."
      >
        <RangeSlider
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
        value {value[0]}–{value[1]} · onValueChange fired {changes}× · onValueCommit fired{' '}
        {commits}×
      </Text>
    </Stack>
  );
}
