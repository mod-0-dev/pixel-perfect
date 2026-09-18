'use client';

import { Checkbox, Field, Stack, Text } from 'pixel-perfect';
import { useState } from 'react';

const ITEMS = ['Releases', 'Security advisories', 'Deprecations'] as const;

/**
 * The case the third state exists for, and the only interactive island on this
 * page — which is why it is a file of its own rather than a `'use client'` at
 * the top of `page.tsx`. The page stays a Server Component, and that is worth
 * demonstrating: `Checkbox` is a client component that an RSC page can render
 * without becoming one.
 *
 * Every id here is written by hand, so it lives OUTSIDE the Matrix (D-035 §1).
 * The harness renders its subtree six times; six copies of `select-all` would
 * bind five labels to a control in another cell.
 */
export function SelectAll() {
  const [checked, setChecked] = useState<boolean[]>([true, false, false]);

  const all = checked.every(Boolean);
  const none = checked.every((c) => !c);

  return (
    <Stack gap="2">
      <Field label="All notifications" orientation="horizontal" controlId="select-all">
        <Checkbox
          /* The parent computes the third state; the checkbox never produces
             it. Clicking a mixed box gives `true`, which is the platform's
             behaviour and the one this UI wants. */
          checked={all ? true : none ? false : 'indeterminate'}
          onCheckedChange={(next) => setChecked(ITEMS.map(() => next === true))}
        />
      </Field>

      <div style={{ paddingInlineStart: '1.5rem' }}>
        <Stack gap="2">
          {ITEMS.map((item, i) => (
            <Field
              key={item}
              label={item}
              orientation="horizontal"
              controlId={`notify-${i}`}
            >
              <Checkbox
                checked={checked[i]}
                onCheckedChange={(next) =>
                  setChecked((prev) => prev.map((c, j) => (j === i ? next === true : c)))
                }
              />
            </Field>
          ))}
        </Stack>
      </div>

      <Text size="sm" tone="muted">
        {checked.filter(Boolean).length} of {ITEMS.length} selected
      </Text>
    </Stack>
  );
}
