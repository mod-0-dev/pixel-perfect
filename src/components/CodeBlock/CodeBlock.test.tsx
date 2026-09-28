import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { CodeBlock, CodeBlockLine } from './CodeBlock';

const SNIPPET = `export default {\n  theme: 'dark',\n};\n`;
const lines = () => Array.from(document.querySelectorAll('.pp-code-block__line'));

/* user-event's setup() installs its own clipboard stub, so the mock is
   installed AFTER it, in each test that has both. */
const mockClipboard = () => {
  const writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
};

describe('CodeBlock', () => {
  let writeText: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    writeText = mockClipboard();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('is a frame around a named region holding the lines of `code`; a trailing newline is not a line (spec §1, §2)', () => {
    const { getByRole } = renderWithTheme(<CodeBlock title="pixel.config.ts" language="ts" code={SNIPPET} lineNumbers highlightLines={[2]} />);
    const region = getByRole('region', { name: 'pixel.config.ts' });
    expect(region.tagName).toBe('PRE');
    expect(region).toHaveClass('pp-code-block__pre');
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.querySelector('code')).toHaveClass('pp-code-block__code');
    expect(lines().map((l) => l.textContent)).toEqual(['export default {', "  theme: 'dark',", '};']);
    expect(lines()[1]).toHaveAttribute('data-highlighted', '');
    expect(lines()[0]).not.toHaveAttribute('data-highlighted');
    const root = document.querySelector('.pp-code-block')!;
    expect(root).toHaveAttribute('data-line-numbers');
    expect(root).not.toHaveAttribute('data-wrap');
    expect(root.querySelector('.pp-code-block__title')).toHaveTextContent('pixel.config.ts');
    expect(root.querySelector('.pp-code-block__language')).toHaveTextContent('ts');
    expect(root.querySelector('.pp-code-block__language')).toHaveClass('pp-badge');
  });

  it('is named by `label` without a title, and has no header with nothing in it', () => {
    const { getByRole } = renderWithTheme(<CodeBlock code="one" copy={false} label="Shell" />);
    expect(getByRole('region', { name: 'Shell' })).toBeInTheDocument();
    expect(document.querySelector('.pp-code-block__header')).toBeNull();
    expect(document.querySelector('.pp-code-block__copy')).toBeNull();
  });

  it('renders children lines as given, with `highlighted`; both forms given warns and the children win', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithTheme(
      <CodeBlock code="ignored" copy={false}>
        <CodeBlockLine>
          <span style={{ color: 'rebeccapurple' }}>const</span> a
        </CodeBlockLine>
        <CodeBlockLine highlighted>b</CodeBlockLine>
      </CodeBlock>,
    );
    expect(lines()).toHaveLength(2);
    expect(lines()[0]!.querySelector('span')!.style.color).toBe('rebeccapurple');
    expect(lines()[1]).toHaveAttribute('data-highlighted');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('both `code` and children'));
  });

  it('copies the text, says Copied for two seconds, and returns (spec §3)', async () => {
    const user = userEvent.setup();
    writeText = mockClipboard();
    const { getByRole, findByRole, queryByRole } = renderWithTheme(<CodeBlock code={SNIPPET} />);
    await user.click(getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith("export default {\n  theme: 'dark',\n};");
    expect(await findByRole('button', { name: 'Copied' })).toHaveAttribute('data-state', 'copied');
    expect(getByRole('status')).toHaveTextContent('Copied');
    /* Real timers: the label returns on its own after two seconds. */
    expect(await findByRole('button', { name: 'Copy code' }, { timeout: 3500 })).toHaveAttribute('data-state', 'idle');
    expect(queryByRole('status')).toHaveTextContent('');
  }, 6000);

  it('copies the lines\' text in the children form', async () => {
    const user = userEvent.setup();
    writeText = mockClipboard();
    const { getByRole } = renderWithTheme(
      <CodeBlock>
        <CodeBlockLine>
          <span>const</span> a = 1;
        </CodeBlockLine>
        <CodeBlockLine>done()</CodeBlockLine>
      </CodeBlock>,
    );
    await user.click(getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith('const a = 1;done()');
  });

  it('has no copy button without a clipboard, or with copy={false}', () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const { rerender } = renderWithTheme(<CodeBlock code="x" title="t" />);
    expect(document.querySelector('.pp-code-block__copy')).toBeNull();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    rerender(<CodeBlock code="x" title="t" copy={false} />);
    expect(document.querySelector('.pp-code-block__copy')).toBeNull();
  });

  it('writes wrap on the root; forwards refs and merges className and style on both parts', () => {
    const root = createRef<HTMLDivElement>();
    const line = createRef<HTMLSpanElement>();
    renderWithTheme(
      <CodeBlock ref={root} wrap className="c" style={{ opacity: 0.5 }} data-testid="cb">
        <CodeBlockLine ref={line} className="l" style={{ order: 1 }}>
          x
        </CodeBlockLine>
      </CodeBlock>,
    );
    expect(root.current).toHaveClass('pp-code-block', 'c');
    expect(root.current).toHaveAttribute('data-wrap');
    expect(root.current).toHaveStyle({ opacity: '0.5' });
    expect(root.current).toHaveAttribute('data-testid', 'cb');
    expect(line.current).toHaveClass('pp-code-block__line', 'l');
    expect(line.current).toHaveStyle({ order: '1' });
  });

  it('has no axe violations in both themes', async () => {
    const light = renderWithTheme(<CodeBlock title="pixel.config.ts" language="ts" code={SNIPPET} lineNumbers highlightLines={[2]} />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<CodeBlock code="npm install pixel-perfect" />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
