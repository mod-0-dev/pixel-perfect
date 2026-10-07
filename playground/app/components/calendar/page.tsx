/*
 * A Server Component page; the Calendar is a client component that holds
 * its day and its month when uncontrolled. `today` and `locale` are given,
 * so the render is the same on every machine and on every day (spec §1).
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { Calendar, Stack } from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const TODAY = '2026-09-28';

export default function CalendarDemoPage() {
  return (
    <>
      <h1>5.9 Calendar</h1>
      <p>
        A month of days to pick one from: a grid with one tab stop and the APG keys, the value an ISO
        date, the names from Intl. Seven equal columns of its container, each day a button on the
        control scale. Standalone here; DatePicker puts it in a Popover.
      </p>

      <section>
        <h2>At every width</h2>
        <p>September 2026, the 28th picked and today. The columns are equal shares of the cell.</p>
        <Matrix>
          <Calendar defaultValue={TODAY} today={TODAY} locale="en-US" />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Sizes</h2>
        <p>The day&apos;s height: 32, 40 and 48px.</p>
        <Stack gap="5" data-testid="calendar-sizes">
          <Calendar defaultValue="2026-09-10" today={TODAY} locale="en-US" size="sm" label="Small" />
          <Calendar defaultValue="2026-09-10" today={TODAY} locale="en-US" label="Medium" />
          <Calendar defaultValue="2026-09-10" today={TODAY} locale="en-US" size="lg" label="Large" />
        </Stack>
      </section>

      <section>
        <h2>Bounded, and a locale that starts on Monday</h2>
        <p>The 5th to the 25th pickable, weekends out; German names, Monday first.</p>
        <Stack gap="5" data-testid="calendar-bounded">
          <Calendar
            defaultMonth="2026-09"
            today={TODAY}
            locale="en-US"
            min="2026-09-05"
            max="2026-09-25"
            label="Bounded"
          />
          <Calendar defaultValue="2026-09-10" today={TODAY} locale="de-DE" label="Deutsch" />
        </Stack>
      </section>

      <section>
        <h2>Right to left</h2>
        <p>The grid runs from the right, the arrows point the way the months run, and Arrow Left moves forward.</p>
        <div dir="rtl" data-testid="calendar-rtl">
          <Calendar defaultValue={TODAY} today={TODAY} locale="ar-EG" label="التقويم" />
        </div>
      </section>
    </>
  );
}
