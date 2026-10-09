'use client';

import { useState } from 'react';

import { DatePicker, Field, Text } from '@mod-0-dev/pixel-perfect';

const TODAY = '2026-09-28';

/** A controlled picker that shows what it reports: the ISO value. */
export function Controlled() {
  const [due, setDue] = useState<string | undefined>('2026-09-28');
  return (
    <div data-testid="date-picker-controlled">
      <Field label="Due" description="The value reported is an ISO date">
        <DatePicker value={due} onValueChange={setDue} today={TODAY} locale="en-GB" name="due" />
      </Field>
      <Text size="sm" tone="muted">
        value: <output>{due ?? 'undefined'}</output>
      </Text>
    </div>
  );
}
