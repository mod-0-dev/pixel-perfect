import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders a span with ghost / neutral / md defaults on data attributes', () => {
    const { getByText } = renderWithTheme(<Badge>Blocked</Badge>);
    const el = getByText('Blocked');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveClass('pp-badge');
    expect(el).toHaveAttribute('data-variant', 'ghost');
    expect(el).toHaveAttribute('data-pp-tone', 'neutral');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).not.toHaveAttribute('role');
  });

  it.each(['solid', 'outline', 'ghost', 'plain'] as const)('exposes variant %s', (variant) => {
    const { getByText } = renderWithTheme(<Badge variant={variant}>x</Badge>);
    expect(getByText('x')).toHaveAttribute('data-variant', variant);
  });

  it.each(['neutral', 'accent', 'danger', 'success', 'warning'] as const)('sets the tone context for %s', (tone) => {
    const { getByText } = renderWithTheme(<Badge tone={tone}>x</Badge>);
    expect(getByText('x')).toHaveAttribute('data-pp-tone', tone);
  });

  it.each(['sm', 'md', 'lg'] as const)('exposes size %s', (size) => {
    const { getByText } = renderWithTheme(<Badge size={size}>x</Badge>);
    expect(getByText('x')).toHaveAttribute('data-size', size);
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLSpanElement>();
    const { getByText } = renderWithTheme(
      <Badge ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="b" title="Status: blocked">
        x
      </Badge>,
    );
    const el = getByText('x');
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('pp-badge', 'mine');
    expect(el).toHaveStyle({ opacity: '0.5' });
    expect(el).toHaveAttribute('data-testid', 'b');
    expect(el).toHaveAttribute('title', 'Status: blocked');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <p>
        Status: <Badge tone="danger">Blocked</Badge> <Badge variant="solid" tone="success">Approved</Badge>
      </p>,
    );
    await expectNoA11yViolations(container);
  });
});
