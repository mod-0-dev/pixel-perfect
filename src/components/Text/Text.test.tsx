import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Text } from './Text';

describe('Text', () => {
  it('renders a paragraph with defaults exposed as data attributes', () => {
    const { getByText } = renderWithTheme(<Text>Body</Text>);
    const el = getByText('Body');
    expect(el.tagName).toBe('P');
    expect(el).toHaveClass('pp-text');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-tone', 'neutral');
    expect(el).toHaveAttribute('data-weight', 'regular');
    expect(el).not.toHaveAttribute('data-align');
    expect(el).not.toHaveAttribute('data-truncate');
    expect(el).not.toHaveAttribute('data-pp-tone');
  });

  it.each(['xs', 'sm', 'md', 'lg'] as const)('exposes size %s', (size) => {
    const { getByText } = renderWithTheme(<Text size={size}>x</Text>);
    expect(getByText('x')).toHaveAttribute('data-size', size);
  });

  it.each(['regular', 'medium', 'semibold', 'bold'] as const)('exposes weight %s', (weight) => {
    const { getByText } = renderWithTheme(<Text weight={weight}>x</Text>);
    expect(getByText('x')).toHaveAttribute('data-weight', weight);
  });

  it.each(['start', 'center', 'end'] as const)('exposes align %s', (align) => {
    const { getByText } = renderWithTheme(<Text align={align}>x</Text>);
    expect(getByText('x')).toHaveAttribute('data-align', align);
  });

  describe('tone', () => {
    it.each(['accent', 'danger', 'success', 'warning'] as const)(
      'routes %s through the tone context',
      (tone) => {
        const { getByText } = renderWithTheme(<Text tone={tone}>x</Text>);
        const el = getByText('x');
        expect(el).toHaveAttribute('data-tone', tone);
        expect(el).toHaveAttribute('data-pp-tone', tone);
      },
    );

    it.each(['neutral', 'muted'] as const)('keeps %s out of the tone context', (tone) => {
      const { getByText } = renderWithTheme(<Text tone={tone}>x</Text>);
      const el = getByText('x');
      expect(el).toHaveAttribute('data-tone', tone);
      expect(el).not.toHaveAttribute('data-pp-tone');
    });
  });

  describe('truncate', () => {
    it('true clamps to one line', () => {
      const { getByText } = renderWithTheme(<Text truncate>x</Text>);
      expect(getByText('x')).toHaveAttribute('data-truncate', '1');
    });

    it('a number clamps to that many lines via a custom property', () => {
      const { getByText } = renderWithTheme(<Text truncate={3}>x</Text>);
      const el = getByText('x');
      expect(el).toHaveAttribute('data-truncate', '3');
      expect(el.style.getPropertyValue('--pp-text-lines')).toBe('3');
    });

    it('false and nonsense values do nothing', () => {
      const { getByText, rerender } = renderWithTheme(<Text truncate={false}>x</Text>);
      expect(getByText('x')).not.toHaveAttribute('data-truncate');
      rerender(<Text truncate={0}>x</Text>);
      expect(getByText('x')).not.toHaveAttribute('data-truncate');
    });

    it('keeps the full text in the DOM when truncated', () => {
      const { getByText } = renderWithTheme(<Text truncate>the whole sentence</Text>);
      expect(getByText('the whole sentence')).toBeInTheDocument();
    });
  });

  it('forwards its ref to the root element', () => {
    const ref = createRef<HTMLParagraphElement>();
    renderWithTheme(<Text ref={ref}>x</Text>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('merges className and style rather than replacing them', () => {
    const { getByText } = renderWithTheme(
      <Text className="mine" style={{ color: 'red' }} truncate={2}>
        x
      </Text>,
    );
    const el = getByText('x');
    expect(el).toHaveClass('pp-text', 'mine');
    expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(el.style.getPropertyValue('--pp-text-lines')).toBe('2');
  });

  it('spreads remaining props onto the root', () => {
    const { getByText } = renderWithTheme(
      <Text id="lead" aria-describedby="x" data-testid="t">
        x
      </Text>,
    );
    const el = getByText('x');
    expect(el).toHaveAttribute('id', 'lead');
    expect(el).toHaveAttribute('aria-describedby', 'x');
    expect(el).toHaveAttribute('data-testid', 't');
  });

  it('asChild renders the child element with the same attributes', () => {
    const { getByText } = renderWithTheme(
      <Text asChild size="sm" tone="muted">
        <span>inline</span>
      </Text>,
    );
    const el = getByText('inline');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveClass('pp-text');
    expect(el).toHaveAttribute('data-size', 'sm');
    expect(el).toHaveAttribute('data-tone', 'muted');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <>
        <Text>Plain</Text>
        <Text tone="danger" truncate={2}>
          Long
        </Text>
        <Text asChild>
          <span>inline</span>
        </Text>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
