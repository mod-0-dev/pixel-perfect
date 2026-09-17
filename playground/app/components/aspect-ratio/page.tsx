import { AspectRatio, Badge, Grid, Stack, Text } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const RATIOS = [
  ['16 / 9', 16 / 9],
  ['4 / 3', 4 / 3],
  ['1', 1],
  ['3 / 4', 3 / 4],
] as const;

/** A deterministic stand-in for a thumbnail — no network in a screenshot test. */
function Swatch({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        blockSize: '100%',
        background: 'var(--pp-tone-bg)',
        color: 'var(--pp-tone-text-strong)',
        fontSize: 'var(--pp-font-size-1)',
      }}
    >
      {label}
    </div>
  );
}

export default function AspectRatioPage() {
  return (
    <>
      <h1>2.7 AspectRatio</h1>
      <p>
        Reserves a box of a given shape before its content loads, so an image or an embed does not
        shift the page when it arrives. Inline size comes from the parent exactly as always; block
        size is the ratio applied to it. The component chooses a <em>shape</em>, never a size.
      </p>

      <section>
        <h2>Ratios</h2>
        <p>
          <code>ratio</code> is required. There is no ratio that is right when you did not think
          about it.
        </p>
        <Matrix>
          <Stack gap="3">
            {RATIOS.map(([label, ratio]) => (
              <Stack key={label} gap="1">
                <Text size="xs" tone="muted">
                  ratio={'{'}
                  {label}
                  {'}'}
                </Text>
                <AspectRatio
                  ratio={ratio}
                  data-pp-tone="accent"
                  style={{ '--pp-aspect-ratio-radius': 'var(--pp-radius-3)' } as React.CSSProperties}
                >
                  <Swatch label={label} />
                </AspectRatio>
              </Stack>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>The shape holds at every width</h2>
        <p>
          That is the whole point, and it is why the narrow cell is short and the wide one is tall.
          A grid, not a block: a single grid item stretches on both axes by default, so the child
          fills its box without the component ever declaring <code>inline-size</code>.
        </p>
        <Matrix>
          <AspectRatio ratio={21 / 9} data-pp-tone="success">
            <Swatch label="21 / 9" />
          </AspectRatio>
        </Matrix>
      </section>

      <section>
        <h2>In a Grid, which is where thumbnails live</h2>
        <Matrix>
          <Grid minItemInlineSize="8rem" gap="2">
            {['brand.png', 'hero.jpg', 'promo.mp4', 'deck.pdf'].map((name, i) => (
              <Stack key={name} gap="1">
                <AspectRatio
                  ratio={16 / 9}
                  data-pp-tone={i % 2 ? 'accent' : 'warning'}
                  style={{ '--pp-aspect-ratio-radius': 'var(--pp-radius-2)' } as React.CSSProperties}
                >
                  <Swatch label="" />
                </AspectRatio>
                <Text size="xs" truncate>
                  {name}
                </Text>
              </Stack>
            ))}
          </Grid>
        </Matrix>
      </section>

      <section>
        <h2>It does not describe its own contents</h2>
        <p>
          Reserving the box says nothing about what goes in it. An <code>img</code> still needs its{' '}
          <code>alt</code>, an <code>iframe</code> its <code>title</code>.
        </p>
        <Matrix>
          <AspectRatio ratio={16 / 9} data-pp-tone="danger">
            <Swatch label="alt text is the child's job" />
          </AspectRatio>
        </Matrix>
      </section>

      <section>
        <h2>Nested ratios stay independent</h2>
        <Matrix>
          <AspectRatio ratio={2} data-pp-tone="neutral">
            <Stack gap="1" style={{ padding: 'var(--pp-space-2)' }}>
              <Badge tone="accent">outer 2 / 1</Badge>
              <AspectRatio ratio={1} data-pp-tone="success">
                <Swatch label="inner 1 / 1" />
              </AspectRatio>
            </Stack>
          </AspectRatio>
        </Matrix>
      </section>
    </>
  );
}
