import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Code } from './Code';

describe('Code', () => {
  it('renders a <code> with no size and a neutral tone by default', () => {
    const { getByText } = renderWithTheme(<Code>npm run tokens</Code>);
    const el = getByText('npm run tokens');
    expect(el.tagName).toBe('CODE');
    expect(el).toHaveClass('pp-code');
    expect(el).not.toHaveAttribute('data-size');
    expect(el).toHaveAttribute('data-pp-tone', 'neutral');
  });

  it.each(['sm', 'md', 'lg'] as const)('exposes a fixed size %s when asked', (size) => {
    const { getByText } = renderWithTheme(<Code size={size}>x</Code>);
    expect(getByText('x')).toHaveAttribute('data-size', size);
  });

  it.each(['neutral', 'accent', 'danger', 'success', 'warning'] as const)('sets the tone context for %s', (tone) => {
    const { getByText } = renderWithTheme(<Code tone={tone}>x</Code>);
    expect(getByText('x')).toHaveAttribute('data-pp-tone', tone);
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLElement>();
    const { getByText } = renderWithTheme(
      <Code ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="c" title="t">
        x
      </Code>,
    );
    const el = getByText('x');
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('pp-code', 'mine');
    expect(el).toHaveStyle({ opacity: '0.5' });
    expect(el).toHaveAttribute('data-testid', 'c');
    expect(el).toHaveAttribute('title', 't');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <p>
        Regenerate with <Code>npm run tokens</Code>; <Code tone="danger">launchDate</Code> must be ISO.
      </p>,
    );
    await expectNoA11yViolations(container);
  });
});
