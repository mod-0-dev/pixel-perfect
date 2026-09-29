/*
 * A Server Component, like AvatarGroup; the Avatars inside are client for
 * their image fallback, and every one here is fallback-only so the render
 * is the same on every machine.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { Avatar, AvatarGroup, Cluster, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const NAMES = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton', 'Mary Jackson'];
const TONES = ['accent', 'success', 'warning', 'danger', 'neutral'] as const;

function Team({ max, size, label }: { max?: number; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  return (
    <AvatarGroup {...(max !== undefined ? { max } : {})} {...(size ? { size } : {})} {...(label ? { label } : {})}>
      {NAMES.map((name, i) => (
        <Avatar key={name} name={name} tone={TONES[i % TONES.length]!} />
      ))}
    </AvatarGroup>
  );
}

export default function AvatarGroupDemoPage() {
  return (
    <>
      <h1>5.13 AvatarGroup</h1>
      <p>
        Who is on it: a few avatars overlapping in a row, and &ldquo;+2&rdquo; for the rest. A list, so
        the count and the names are heard; the overlap by a grid, not a margin. It hugs.
      </p>

      <section>
        <h2>At every width</h2>
        <p>Five people, three shown. The group is the width of its faces in every cell.</p>
        <Matrix>
          <Team max={3} label="Assignees" />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Sizes</h2>
        <p>One size on the group sizes every face and the count.</p>
        <Stack gap="3" data-testid="avatar-group-sizes">
          <Team max={3} size="sm" />
          <Team max={3} />
          <Team max={3} size="lg" />
        </Stack>
      </section>

      <section>
        <h2>All shown, and beside text</h2>
        <Cluster gap="3" align="center" data-testid="avatar-group-inline">
          <Team />
          <Text size="sm" tone="muted">
            5 members
          </Text>
        </Cluster>
      </section>

      <section>
        <h2>Right to left</h2>
        <div dir="rtl" data-testid="avatar-group-rtl">
          <Team max={3} />
        </div>
      </section>
    </>
  );
}
