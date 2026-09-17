import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { ButtonGroup } from './ButtonGroup';

function Align() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h12M3 18h16" />
    </svg>
  );
}

const group = (
  <ButtonGroup label="Export format">
    <Button variant="outline">CSV</Button>
    <Button variant="outline">JSON</Button>
    <Button variant="outline">Parquet</Button>
  </ButtonGroup>
);

describe('ButtonGroup', () => {
  it('is a named group containing its buttons', () => {
    const { getByRole } = renderWithTheme(group);
    const el = getByRole('group', { name: 'Export format' });

    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('pp-button-group');
    expect(el).toHaveAttribute('data-orientation', 'horizontal');
    expect(el.querySelectorAll('.pp-button')).toHaveLength(3);
  });

  it('requires a label — an unnamed group is an unnamed landmark', () => {
    const { getByRole } = renderWithTheme(
      // @ts-expect-error `label` is required
      <ButtonGroup>
        <Button>CSV</Button>
      </ButtonGroup>,
    );
    expect(getByRole('group')).toBeInTheDocument();
  });

  it.each(['horizontal', 'vertical'] as const)('mirrors orientation=%s', (orientation) => {
    const { getByRole } = renderWithTheme(
      <ButtonGroup label="Export format" orientation={orientation}>
        <Button>CSV</Button>
      </ButtonGroup>,
    );
    expect(getByRole('group')).toHaveAttribute('data-orientation', orientation);
  });

  it('does not touch the buttons it contains', () => {
    const { getByRole } = renderWithTheme(group);
    // Styling is by descendant selector, never by cloning children with props.
    // Cloning would break asChild, break a Tooltip wrapper later, and require
    // every child to be a Button.
    for (const name of ['CSV', 'JSON', 'Parquet']) {
      const button = getByRole('button', { name });
      expect(button).toHaveAttribute('data-variant', 'outline');
      expect(button).toHaveAttribute('type', 'button');
    }
  });

  it('takes no size, tone or variant — set them on the buttons', () => {
    const { getByRole } = renderWithTheme(
      // @ts-expect-error forwarding these would mean cloning children
      <ButtonGroup label="Export format" tone="accent" size="lg" variant="solid">
        <Button>CSV</Button>
      </ButtonGroup>,
    );
    const el = getByRole('group');
    expect(el).not.toHaveAttribute('data-pp-tone');
    expect(el).not.toHaveAttribute('data-size');
  });

  it('holds mixed children, IconButton included', () => {
    const { getByRole } = renderWithTheme(
      <ButtonGroup label="Text alignment">
        <IconButton label="Align left" variant="outline">
          <Align />
        </IconButton>
        <IconButton label="Align centre" variant="outline">
          <Align />
        </IconButton>
      </ButtonGroup>,
    );
    expect(getByRole('group', { name: 'Text alignment' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Align left' })).toHaveClass('pp-icon-button');
  });

  describe('API surface (RULES §5)', () => {
    it('forwards ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      renderWithTheme(
        <ButtonGroup ref={ref} label="Export format">
          <Button>CSV</Button>
        </ButtonGroup>,
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass('pp-button-group');
    });

    it('merges className and style, and spreads the rest', () => {
      const { getByRole } = renderWithTheme(
        <ButtonGroup
          label="Export format"
          className="app-toolbar"
          style={{ opacity: 0.5 }}
          data-testid="formats"
        >
          <Button>CSV</Button>
        </ButtonGroup>,
      );
      const el = getByRole('group');
      expect(el).toHaveClass('pp-button-group', 'app-toolbar');
      expect(el).toHaveStyle({ opacity: '0.5' });
      expect(el).toHaveAttribute('data-testid', 'formats');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderWithTheme(group);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when vertical and icon-only', async () => {
      const { container } = renderWithTheme(
        <ButtonGroup label="Text alignment" orientation="vertical">
          <IconButton label="Align left">
            <Align />
          </IconButton>
          <IconButton label="Align right">
            <Align />
          </IconButton>
        </ButtonGroup>,
      );
      await expectNoA11yViolations(container);
    });

    it('gives every button its own tab stop — deliberately NOT the APG toolbar pattern', async () => {
      const { getByRole } = renderWithTheme(group);

      // Roving tabindex is right for a dense toolbar of twenty controls and
      // wrong for three attached buttons, where it costs a keyboard user an
      // arrow-key discovery step to reach what one Tab would have reached.
      // Toolbar (6.6) is the roving component; this is why it is separate.
      for (const name of ['CSV', 'JSON', 'Parquet']) {
        await userEvent.tab();
        expect(document.activeElement).toBe(getByRole('button', { name }));
        expect(document.activeElement).not.toHaveAttribute('tabindex', '-1');
      }
    });

    it('activates the focused button and no other', async () => {
      const onCsv = vi.fn();
      const onJson = vi.fn();
      const { getByRole } = renderWithTheme(
        <ButtonGroup label="Export format">
          <Button onClick={onCsv}>CSV</Button>
          <Button onClick={onJson}>JSON</Button>
        </ButtonGroup>,
      );

      await userEvent.click(getByRole('button', { name: 'JSON' }));
      expect(onJson).toHaveBeenCalledTimes(1);
      expect(onCsv).not.toHaveBeenCalled();
    });
  });
});
