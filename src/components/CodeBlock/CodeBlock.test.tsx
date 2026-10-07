import userEvent from '@testing-library/user-event';
import { act, createRef } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
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

  it('needs a title or a label at the type level; without either it warns and falls back to "Code" (D-107 §4)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error A block with neither a title nor a label is a region nobody can tell apart.
    const { getByRole, unmount } = renderWithTheme(<CodeBlock code="one" />);
    expect(getByRole('region', { name: 'Code' })).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('needs a `title` or a `label`'));
    unmount();
    warn.mockClear();
    // @ts-expect-error Both is not a choice: the title names the region, so a label would be ignored.
    const both = renderWithTheme(<CodeBlock code="one" title="install.sh" label="ignored" />);
    expect(both.getByRole('region', { name: 'install.sh' })).toBeInTheDocument();
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('needs a `title` or a `label`'));
  });

  it('renders children lines as given, with `highlighted`; both forms given warns and the children win', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithTheme(
      <CodeBlock code="ignored" copy={false} label="Two lines">
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
    const { getByRole, findByRole, queryByRole } = renderWithTheme(<CodeBlock code={SNIPPET} label="Config" />);
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
      <CodeBlock label="Script">
        <CodeBlockLine>
          <span>const</span> a = 1;
        </CodeBlockLine>
        <CodeBlockLine>done()</CodeBlockLine>
      </CodeBlock>,
    );
    await user.click(getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith('const a = 1;done()');
  });

  it('renders the copy button without a clipboard, where a press does nothing; no button with copy={false} (spec §1)', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const { getByRole, rerender } = renderWithTheme(<CodeBlock code="x" title="t" />);
    await user.click(getByRole('button', { name: 'Copy code' }));
    expect(getByRole('button', { name: 'Copy code' })).toHaveAttribute('data-state', 'idle');
    expect(document.querySelector('[role="status"]')).toHaveTextContent('');
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    rerender(<CodeBlock code="x" title="t" copy={false} />);
    expect(document.querySelector('.pp-code-block__copy')).toBeNull();
  });

  it('hydrates server HTML rendered without a clipboard in a client that has one, without a mismatch (D-093 §1)', async () => {
    /* The server has a `navigator` and no clipboard; the browser has both. The
       button must not depend on the difference, or every server-rendered
       block hydrates against different HTML and React re-renders the page. */
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const element = <CodeBlock code="x" title="t" language="ts" />;
    const html = renderToString(element);
    expect(html).toContain('pp-code-block__copy');

    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    const recoverable = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root!: Root;
    await act(async () => {
      root = hydrateRoot(host, element, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    host.remove();
  });

  it('writes wrap on the root; forwards refs and merges className and style on both parts', () => {
    const root = createRef<HTMLDivElement>();
    const line = createRef<HTMLSpanElement>();
    renderWithTheme(
      <CodeBlock ref={root} wrap className="c" style={{ opacity: 0.5 }} data-testid="cb" label="x">
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
    const dark = renderWithTheme(<CodeBlock code="npm install pixel-perfect" label="Install" />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
