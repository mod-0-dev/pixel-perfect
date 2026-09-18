import { Button, ButtonGroup, Cluster, IconButton, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function AlignLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h12M3 18h16" />
    </svg>
  );
}

function AlignCenter() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M6 12h12M4 18h16" />
    </svg>
  );
}

function AlignRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M9 12h12M5 18h16" />
    </svg>
  );
}

export default function ButtonGroupPage() {
  return (
    <>
      <h1>3.4 ButtonGroup</h1>
      <p>
        The <strong>attached</strong> case, and only the attached case. A group that merely puts
        space between buttons is <code>&lt;Cluster gap=&quot;2&quot;&gt;</code>, so there is no{' '}
        <code>attached</code> prop — <code>attached={'{false}'}</code> is spelled{' '}
        <code>Cluster</code>. It does not manage selection either: one-of-many is a{' '}
        <code>RadioGroup</code> (3.11), several-of-many is a set of <code>Toggle</code>s.
      </p>

      <section>
        <h2>Horizontal — end radii on the ends, square between</h2>
        <p>
          Every button but the first drops its leading border, so the seam is its neighbour&rsquo;s
          trailing edge and there was never a doubled border to collapse. The usual trick —{' '}
          <code>margin-inline-start: -1px</code> — is banned by RULES §2 and refused by the linter.
        </p>
        <Matrix>
          <ButtonGroup label="Export format">
            <Button variant="outline">CSV</Button>
            <Button variant="outline">JSON</Button>
            <Button variant="outline">Parquet</Button>
          </ButtonGroup>
        </Matrix>
      </section>

      <section>
        <h2>Icon-only, which is what a real toolbar looks like</h2>
        <p>
          Each <code>IconButton</code> still carries its own required name; the group name does not
          substitute for it. Tab through — every button is its own tab stop, deliberately not the
          APG toolbar&rsquo;s roving tabindex. Watch the focus ring at the seams: a focused button
          is raised so its ring is not painted under its neighbour.
        </p>
        <Matrix>
          <Cluster gap="4">
            <ButtonGroup label="Text alignment">
              <IconButton label="Align left" variant="outline">
                <AlignLeft />
              </IconButton>
              <IconButton label="Align centre" variant="outline">
                <AlignCenter />
              </IconButton>
              <IconButton label="Align right" variant="outline">
                <AlignRight />
              </IconButton>
            </ButtonGroup>
          </Cluster>
        </Matrix>
      </section>

      <section>
        <h2>Vertical</h2>
        <p>
          Every button takes the width of the widest — the group sizing the boxes it creates, which
          D-021 assigns to the parent. The group itself still declares no width.
        </p>
        <Matrix>
          <ButtonGroup label="Export destination" orientation="vertical">
            <Button variant="outline">Download</Button>
            <Button variant="outline">Send to S3</Button>
            <Button variant="outline">Email a link</Button>
          </ButtonGroup>
        </Matrix>
      </section>

      <section>
        <h2>Solid keeps its seam</h2>
        <p>
          A solid button&rsquo;s border is transparent, so dropping it would merge two adjacent
          fills into one shape. Solid children keep the border and tint it with{' '}
          <code>--pp-tone-solid-active</code> — the pressed step, the one colour guaranteed to read
          against the fill either side of it.
        </p>
        <Matrix>
          <Stack gap="3" align="start">
            <ButtonGroup label="Solid neutral">
              <Button>Day</Button>
              <Button>Week</Button>
              <Button>Month</Button>
            </ButtonGroup>
            <ButtonGroup label="Solid accent">
              <Button tone="accent">Day</Button>
              <Button tone="accent">Week</Button>
              <Button tone="accent">Month</Button>
            </ButtonGroup>
            <Text size="sm" tone="muted">
              Compare with the ghost row below, where the border is real and the seam is free.
            </Text>
            <ButtonGroup label="Ghost neutral">
              <Button variant="ghost">Day</Button>
              <Button variant="ghost">Week</Button>
              <Button variant="ghost">Month</Button>
            </ButtonGroup>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>hug — it does not stretch, and it does not wrap</h2>
        <p>
          The narrow cell will be flagged, on purpose. An attached set that wrapped would have the
          wrong corners on four buttons, so it overflows visibly instead: a set too wide for its
          container is too many buttons, or belongs in a <code>Scroller</code>.
        </p>
        <Matrix>
          <ButtonGroup label="Too many formats">
            <Button variant="outline">CSV</Button>
            <Button variant="outline">JSON</Button>
            <Button variant="outline">Parquet</Button>
            <Button variant="outline">Avro</Button>
            <Button variant="outline">Protobuf</Button>
          </ButtonGroup>
        </Matrix>
      </section>
    </>
  );
}
