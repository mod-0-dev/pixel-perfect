/*
 * A Server Component, like Progress: the motion is CSS.
 *
 * NOTHING HERE WRITES AN ID THE TEST NEEDS (D-035 §1): the browser suite
 * finds its sections by `data-testid`. The one id on the page is the
 * label's, which `aria-labelledby` is for.
 */
import { Cluster, Progress, Stack, Text } from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function Labelled() {
  return (
    <Stack gap="1">
      <Cluster justify="between">
        <Text id="upload-label" size="sm">
          Uploading photos
        </Text>
        <Text size="sm" tone="muted">
          40%
        </Text>
      </Cluster>
      <Progress aria-labelledby="upload-label" value={40} />
    </Stack>
  );
}

export default function ProgressPage() {
  return (
    <>
      <h1>5.3 Progress</h1>
      <p>
        How far along a thing is. A bar from the start of the line to its end, filled as far as the
        value says; with no value, a segment sweeps until the size of the work is known. The
        determinate half of what Spinner began, and a Server Component.
      </p>

      <section>
        <h2>At every width</h2>
        <p>A labelled bar at 40, the label and the number composed beside it.</p>
        <Matrix>
          <Labelled />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Sizes</h2>
        <p>The thickness: 4, 8 and 12px. Each at 60.</p>
        <Stack gap="3" data-testid="progress-sizes">
          <Progress label="Small" value={60} size="sm" />
          <Progress label="Medium" value={60} />
          <Progress label="Large" value={60} size="lg" />
        </Stack>
      </section>

      <section>
        <h2>Tones</h2>
        <p>The fill takes the tone; accent by default.</p>
        <Stack gap="3" data-testid="progress-tones">
          <Progress label="Accent" value={70} />
          <Progress label="Neutral" value={70} tone="neutral" />
          <Progress label="Success" value={100} tone="success" />
          <Progress label="Warning" value={85} tone="warning" />
          <Progress label="Danger" value={30} tone="danger" />
        </Stack>
      </section>

      <section>
        <h2>The ends</h2>
        <p>Empty, and full: a cap at each end of the fill, the track visible at zero.</p>
        <Stack gap="3" data-testid="progress-ends">
          <Progress label="Empty" value={0} />
          <Progress label="Full" value={100} />
          <Progress label="Step 3 of 5" value={3} max={5} aria-valuetext="Step 3 of 5" />
        </Stack>
      </section>

      <section>
        <h2>Indeterminate</h2>
        <p>No value: a segment sweeps from the start. Under reduced motion the whole bar pulses.</p>
        <div data-testid="progress-indeterminate">
          <Progress label="Connecting" />
        </div>
      </section>

      <section>
        <h2>Right to left</h2>
        <p>The fill grows from the right edge, and the sweep starts there, with no rule for it.</p>
        <div dir="rtl" data-testid="progress-rtl">
          <Stack gap="3">
            <Progress label="Uploading" value={40} />
            <Progress label="Connecting" />
          </Stack>
        </div>
      </section>
    </>
  );
}
