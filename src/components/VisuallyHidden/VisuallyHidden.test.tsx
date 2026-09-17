import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders a span with the component class', () => {
    const { getByText } = renderWithTheme(<VisuallyHidden>Close dialog</VisuallyHidden>);
    const el = getByText('Close dialog');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveClass('pp-visually-hidden');
  });

  it('keeps its content in the accessible tree', () => {
    const { getByRole } = renderWithTheme(
      <button type="button">
        <VisuallyHidden>Close dialog</VisuallyHidden>
      </button>,
    );
    expect(getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('forwards its ref to the root element', () => {
    const ref = createRef<HTMLSpanElement>();
    renderWithTheme(<VisuallyHidden ref={ref}>x</VisuallyHidden>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toHaveClass('pp-visually-hidden');
  });

  it('merges className and style rather than replacing them', () => {
    const { getByText } = renderWithTheme(
      <VisuallyHidden className="mine" style={{ color: 'red' }}>
        x
      </VisuallyHidden>,
    );
    const el = getByText('x');
    expect(el).toHaveClass('pp-visually-hidden', 'mine');
    expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('spreads remaining props onto the root', () => {
    const { getByText } = renderWithTheme(
      <VisuallyHidden data-testid="vh" aria-live="polite" id="status">
        x
      </VisuallyHidden>,
    );
    const el = getByText('x');
    expect(el).toHaveAttribute('data-testid', 'vh');
    expect(el).toHaveAttribute('aria-live', 'polite');
    expect(el).toHaveAttribute('id', 'status');
  });

  describe('asChild', () => {
    it('renders the child element instead of a span, with props merged', () => {
      const { getByRole } = renderWithTheme(
        <VisuallyHidden asChild className="mine">
          <h2 className="theirs">Hidden heading</h2>
        </VisuallyHidden>,
      );
      const el = getByRole('heading', { level: 2 });
      expect(el.tagName).toBe('H2');
      expect(el).toHaveClass('pp-visually-hidden', 'mine', 'theirs');
    });

    it('forwards the ref to the child element', () => {
      const ref = createRef<HTMLSpanElement>();
      renderWithTheme(
        <VisuallyHidden asChild ref={ref}>
          <h2>x</h2>
        </VisuallyHidden>,
      );
      expect(ref.current?.tagName).toBe('H2');
    });

    it('composes event handlers, child first', () => {
      const calls: string[] = [];
      const { getByText } = renderWithTheme(
        <VisuallyHidden asChild onClick={() => calls.push('slot')}>
          <span onClick={() => calls.push('child')}>x</span>
        </VisuallyHidden>,
      );
      getByText('x').click();
      expect(calls).toEqual(['child', 'slot']);
    });

    it('does not attach a ref to the child when none was given', () => {
      // A Server Component throws on any element carrying a ref, so an
      // unconditional ref merge would break asChild on the server. Observed via
      // a function-component child, where React 19 exposes `ref` as a prop.
      let received: Record<string, unknown> = {};
      function Child(props: Record<string, unknown>) {
        received = props;
        return <span>x</span>;
      }
      renderWithTheme(
        <VisuallyHidden asChild>
          <Child />
        </VisuallyHidden>,
      );
      expect('ref' in received).toBe(false);
      expect(received.className).toBe('pp-visually-hidden');
    });

    it('throws on anything but a single element child', () => {
      expect(() =>
        renderWithTheme(
          <VisuallyHidden asChild>
            <span>a</span>
            <span>b</span>
          </VisuallyHidden>,
        ),
      ).toThrow(/exactly one React element/);
    });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithTheme(
      <button type="button">
        <svg aria-hidden="true" width="16" height="16" />
        <VisuallyHidden>Close dialog</VisuallyHidden>
      </button>,
    );
    await expectNoA11yViolations(container);
  });
});
