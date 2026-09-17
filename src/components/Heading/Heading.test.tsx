import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Heading } from './Heading';

describe('Heading', () => {
  it.each([
    [1, '3xl'],
    [2, '2xl'],
    [3, 'xl'],
    [4, 'lg'],
    [5, 'md'],
    [6, 'sm'],
  ] as const)('level %i renders h%i and defaults to size %s', (level, size) => {
    const { getByRole } = renderWithTheme(<Heading level={level}>Title</Heading>);
    const el = getByRole('heading', { level });
    expect(el.tagName).toBe(`H${level}`);
    expect(el).toHaveClass('pp-heading');
    expect(el).toHaveAttribute('data-level', String(level));
    expect(el).toHaveAttribute('data-size', size);
  });

  it('decouples visual size from semantic level', () => {
    const { getByRole } = renderWithTheme(
      <Heading level={3} size="sm">
        Small but structural
      </Heading>,
    );
    const el = getByRole('heading', { level: 3 });
    expect(el.tagName).toBe('H3');
    expect(el).toHaveAttribute('data-size', 'sm');
  });

  it('defaults to semibold and neutral', () => {
    const { getByRole } = renderWithTheme(<Heading level={2}>x</Heading>);
    const el = getByRole('heading');
    expect(el).toHaveAttribute('data-weight', 'semibold');
    expect(el).toHaveAttribute('data-tone', 'neutral');
    expect(el).not.toHaveAttribute('data-pp-tone');
    expect(el).not.toHaveAttribute('data-align');
    expect(el).not.toHaveAttribute('data-truncate');
  });

  it.each(['accent', 'danger', 'success', 'warning'] as const)('routes %s through the tone context', (tone) => {
    const { getByRole } = renderWithTheme(
      <Heading level={2} tone={tone}>
        x
      </Heading>,
    );
    expect(getByRole('heading')).toHaveAttribute('data-pp-tone', tone);
  });

  it('keeps muted out of the tone context', () => {
    const { getByRole } = renderWithTheme(
      <Heading level={2} tone="muted">
        x
      </Heading>,
    );
    const el = getByRole('heading');
    expect(el).toHaveAttribute('data-tone', 'muted');
    expect(el).not.toHaveAttribute('data-pp-tone');
  });

  it('exposes weight and align', () => {
    const { getByRole } = renderWithTheme(
      <Heading level={2} weight="bold" align="center">
        x
      </Heading>,
    );
    const el = getByRole('heading');
    expect(el).toHaveAttribute('data-weight', 'bold');
    expect(el).toHaveAttribute('data-align', 'center');
  });

  it('truncates to one line or to N lines via a custom property', () => {
    const { getByRole, rerender } = renderWithTheme(
      <Heading level={2} truncate>
        x
      </Heading>,
    );
    expect(getByRole('heading')).toHaveAttribute('data-truncate', '1');
    rerender(
      <Heading level={2} truncate={2}>
        x
      </Heading>,
    );
    const el = getByRole('heading');
    expect(el).toHaveAttribute('data-truncate', '2');
    expect(el.style.getPropertyValue('--pp-heading-lines')).toBe('2');
  });

  it('forwards its ref to the root element', () => {
    const ref = createRef<HTMLHeadingElement>();
    renderWithTheme(
      <Heading level={1} ref={ref}>
        x
      </Heading>,
    );
    expect(ref.current?.tagName).toBe('H1');
  });

  it('merges className and style, and spreads the rest', () => {
    const { getByRole } = renderWithTheme(
      <Heading level={2} className="mine" style={{ color: 'red' }} id="t" aria-describedby="d">
        x
      </Heading>,
    );
    const el = getByRole('heading');
    expect(el).toHaveClass('pp-heading', 'mine');
    expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(el).toHaveAttribute('id', 't');
    expect(el).toHaveAttribute('aria-describedby', 'd');
  });

  it('asChild renders the child with level still driving the default size', () => {
    const { getByText } = renderWithTheme(
      <Heading level={2} asChild>
        <div role="heading" aria-level={2}>
          x
        </div>
      </Heading>,
    );
    const el = getByText('x');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('pp-heading');
    expect(el).toHaveAttribute('data-size', '2xl');
  });

  it('has no axe violations in a well-formed outline', async () => {
    const { container } = renderWithTheme(
      <>
        <Heading level={1}>Page</Heading>
        <Heading level={2} tone="muted" size="sm">
          Section
        </Heading>
        <Heading level={3} truncate={2}>
          Sub
        </Heading>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
