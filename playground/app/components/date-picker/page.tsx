/*
 * A Server Component page; the DatePicker is a client component. `today`
 * and `locale` are given so the render is the same on every machine and
 * on every day (Calendar §1). The controlled instance is in Demos.tsx.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { DatePicker, Field, Input, Stack } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

import { Controlled } from './Demos';

const TODAY = '2026-09-28';

export default function DatePickerDemoPage() {
  return (
    <>
      <h1>4.13 DatePicker</h1>
      <p>
        A date typed or picked: Input&apos;s box with a text field and a calendar button, and Calendar in a
        Popover behind the button. Typed text is parsed in the locale&apos;s order; the value is an ISO
        date. The last of Tier 4.
      </p>

      <section>
        <h2>At every width</h2>
        <p>In a Field, with a value. The box is Input&apos;s: an Input beside it is the same height.</p>
        <Matrix>
          <Stack gap="3">
            <Field label="Due" description="DD/MM/YYYY">
              <DatePicker defaultValue={TODAY} today={TODAY} locale="en-GB" />
            </Field>
            <Field label="Reference">
              <Input placeholder="INV-0091" />
            </Field>
          </Stack>
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Controlled</h2>
        <Controlled />
      </section>

      <section>
        <h2>Sizes, invalid, disabled</h2>
        <Stack gap="3" data-testid="date-picker-states">
          <DatePicker size="sm" defaultValue={TODAY} today={TODAY} locale="en-US" aria-label="Small" />
          <DatePicker defaultValue={TODAY} today={TODAY} locale="en-US" aria-label="Medium" />
          <DatePicker size="lg" defaultValue={TODAY} today={TODAY} locale="en-US" aria-label="Large" />
          <DatePicker invalid defaultValue={TODAY} today={TODAY} locale="en-US" aria-label="Invalid" />
          <DatePicker disabled defaultValue={TODAY} today={TODAY} locale="en-US" aria-label="Disabled" />
        </Stack>
      </section>

      <section>
        <h2>Right to left</h2>
        <p>The button at the start of the box; the panel from the right.</p>
        <div dir="rtl" data-testid="date-picker-rtl">
          <DatePicker defaultValue={TODAY} today={TODAY} locale="ar-EG" aria-label="التاريخ" />
        </div>
      </section>
    </>
  );
}
