import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('renders a <kbd> at md by default', () => {
    const { getByText } = renderWithTheme(<Kbd>⌘</Kbd>);
    const el = getByText('⌘');
    expect(el.tagName).toBe('KBD');
    expect(el).toHaveClass('pp-kbd');
    expect(el).toHaveAttribute('data-size', 'md');
  });

  it.each(['sm', 'md', 'lg'] as const)('exposes size %s', (size) => {
    const { getByText } = renderWithTheme(<Kbd size={size}>K</Kbd>);
    expect(getByText('K')).toHaveAttribute('data-size', size);
  });

  it('forwards its ref, merges className and style, spreads the rest', () => {
    const ref = createRef<HTMLElement>();
    const { getByText } = renderWithTheme(
      <Kbd ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="k" aria-label="Command">
        ⌘
      </Kbd>,
    );
    const el = getByText('⌘');
    expect(ref.current).toBe(el);
    expect(el).toHaveClass('pp-kbd', 'mine');
    expect(el).toHaveStyle({ opacity: '0.5' });
    expect(el).toHaveAttribute('data-testid', 'k');
    expect(el).toHaveAttribute('aria-label', 'Command');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <p>
        Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search.
      </p>,
    );
    await expectNoA11yViolations(container);
  });
});
