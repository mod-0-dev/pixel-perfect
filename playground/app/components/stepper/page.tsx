/*
 * A Server Component, like Stepper: nothing here needs a handler.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { Stack, Step, Stepper } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function Checkout({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <Stepper {...(orientation ? { orientation } : {})}>
      <Step status="complete" description="Name and email">
        Account
      </Step>
      <Step status="current" description="Card or invoice">
        Payment
      </Step>
      <Step description="Check and confirm">Review</Step>
    </Stepper>
  );
}

export default function StepperDemoPage() {
  return (
    <>
      <h1>5.7 Stepper</h1>
      <p>
        Where a multi-step process stands: the steps in order, the ones done, the one now, the ones to
        come, and a line joining them. A status display, not a control; the number is a counter, done
        is a check. A row by default and a column below 28rem, by its container. A Server Component.
      </p>

      <section>
        <h2>At every width</h2>
        <p>Three steps, the second current. At 240px the row is a column; at 480px and 960px a row.</p>
        <Matrix>
          <Checkout />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Vertical</h2>
        <p>Stacked at every width, the connector running down beside the descriptions.</p>
        <div data-testid="stepper-vertical">
          <Checkout orientation="vertical" />
        </div>
      </section>

      <section>
        <h2>Five steps, the first current, and all done</h2>
        <Stack gap="5" data-testid="stepper-more">
          <Stepper label="Setup">
            <Step status="current">Workspace</Step>
            <Step>Members</Step>
            <Step>Billing</Step>
            <Step>Integrations</Step>
            <Step>Done</Step>
          </Stepper>
          <Stepper label="Finished">
            <Step status="complete">Workspace</Step>
            <Step status="complete">Members</Step>
            <Step status="complete">Billing</Step>
          </Stepper>
        </Stack>
      </section>

      <section>
        <h2>In a narrow parent that is not a container</h2>
        <p>The matrix&apos;s cells are size containers; this parent is a plain block 15rem wide.</p>
        <div style={{ maxInlineSize: '15rem' }} data-testid="stepper-compact">
          <Checkout />
        </div>
      </section>

      <section>
        <h2>Right to left</h2>
        <div dir="rtl" data-testid="stepper-rtl">
          <Checkout />
        </div>
      </section>
    </>
  );
}
