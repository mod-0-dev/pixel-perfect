'use client';

import { Field, NumberInput, Stack, Text } from 'pixel-perfect';
import { useState } from 'react';

/**
 * The only interactive island on this page, which is why it is a file of its
 * own rather than a `'use client'` at the top of `page.tsx`. The page stays a
 * Server Component and renders this without becoming one.
 *
 * Every id here is written by hand, so it lives OUTSIDE the Matrix (D-035 §1).
 *
 * It is also the demo that shows `null` doing the job `undefined` cannot: clear
 * the field and the owner's state is `null`, which is still CONTROLLED. Passing
 * `undefined` there would switch the component to uncontrolled mid-life and it
 * would quietly stop answering to this component at all (spec §2).
 */
export function Controlled() {
  const [quantity, setQuantity] = useState<number | null>(2);

  return (
    <Stack gap="2">
      <Field
        label="Quantity"
        description="Clear the box, and watch the owner hold null rather than undefined."
        controlId="controlled-quantity"
      >
        <NumberInput min={0} max={10} value={quantity} onValueChange={setQuantity} />
      </Field>

      <Text size="sm" tone="muted">
        {quantity === null
          ? 'The owner holds null — empty, and still controlled.'
          : `The owner holds ${quantity}.`}
      </Text>
    </Stack>
  );
}
