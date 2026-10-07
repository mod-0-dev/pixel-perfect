/*
 * A Server Component page; the CodeBlock is a client component for its copy
 * button. The "highlighted" instance holds hand-written tokens in the
 * library's own tone tokens, standing in for a highlighter's output.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { CodeBlock, CodeBlockLine, Stack } from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

const CONFIG = `import { defineConfig } from 'pixel-perfect/config';

export default defineConfig({
  theme: 'dark',
  tokens: { accent: 'blue', radius: 'md', density: 'comfortable', fontFamily: 'Inter, ui-sans-serif, system-ui' },
});
`;

export default function CodeBlockDemoPage() {
  return (
    <>
      <h1>5.12 CodeBlock</h1>
      <p>
        Block code in a frame: numbered if asked, a line pointed at, a button that copies it. The
        pre is a named region that scrolls a long line inside itself. Highlighting is yours; this is
        the frame it goes in.
      </p>

      <section>
        <h2>At every width</h2>
        <p>Numbered, the fourth line pointed at, the fifth long enough to scroll.</p>
        <Matrix>
          <CodeBlock title="pixel.config.ts" language="ts" code={CONFIG} lineNumbers highlightLines={[4]} />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Wrapped, bare, and highlighted by the consumer</h2>
        <Stack gap="4">
          {/* Narrow, so the one-liner has something to wrap against. */}
          <div data-testid="code-block-wrap" style={{ maxInlineSize: '24rem' }}>
            <CodeBlock title="install.sh" language="sh" wrap code="npm install pixel-perfect @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-tooltip --save-exact" />
          </div>
          <div data-testid="code-block-bare">
            <CodeBlock code={'git switch -c feature/tier-5\ngit push -u origin HEAD'} copy={false} label="Two commands" />
          </div>
          <div data-testid="code-block-tokens">
            <CodeBlock title="Button.tsx" language="tsx" lineNumbers>
              <CodeBlockLine>
                <span style={{ color: 'var(--pp-palette-accent-11)' }}>export</span> <span style={{ color: 'var(--pp-palette-accent-11)' }}>function</span>{' '}
                <span style={{ color: 'var(--pp-palette-warning-11)' }}>Save</span>() {'{'}
              </CodeBlockLine>
              <CodeBlockLine highlighted>
                {'  '}
                <span style={{ color: 'var(--pp-palette-accent-11)' }}>return</span> &lt;<span style={{ color: 'var(--pp-palette-success-11)' }}>Button</span>{' '}
                <span style={{ color: 'var(--pp-palette-warning-11)' }}>tone</span>=<span style={{ color: 'var(--pp-palette-danger-11)' }}>&quot;accent&quot;</span>&gt;Save&lt;/
                <span style={{ color: 'var(--pp-palette-success-11)' }}>Button</span>&gt;;
              </CodeBlockLine>
              <CodeBlockLine>{'}'}</CodeBlockLine>
            </CodeBlock>
          </div>
        </Stack>
      </section>
    </>
  );
}
