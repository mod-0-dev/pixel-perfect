import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from '../Button/Button';
import { EmptyState, EmptyStateActions, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from './EmptyState';

function Inbox({ variant }: { variant?: 'plain' | 'outline' } = {}) {
  return (
    <EmptyState {...(variant ? { variant } : {})} data-testid="empty">
      <EmptyStateIcon>
        <svg viewBox="0 0 24 24">
          <path d="M3 12h18" />
        </svg>
      </EmptyStateIcon>
      <EmptyStateTitle level={2}>No projects yet</EmptyStateTitle>
      <EmptyStateDescription>Create your first project to start tracking work.</EmptyStateDescription>
      <EmptyStateActions>
        <Button tone="accent">New project</Button>
        <Button variant="ghost">Import</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

describe('EmptyState', () => {
  it('is five parts on the primitives: a hidden lg Icon, a Heading at the level given, a muted centred Text, a centred Cluster (spec §1)', () => {
    const { getByTestId, getByRole, getByText } = renderWithTheme(<Inbox />);
    const root = getByTestId('empty');
    expect(root).toHaveClass('pp-empty-state');
    expect(root).not.toHaveClass('pp-card');
    expect(root).toHaveAttribute('data-variant', 'plain');
    const icon = root.querySelector('.pp-empty-state__icon')!;
    expect(icon).toHaveClass('pp-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('data-size', 'lg');
    const title = getByRole('heading', { level: 2, name: 'No projects yet' });
    expect(title).toHaveClass('pp-heading', 'pp-empty-state__title');
    expect(title).toHaveAttribute('data-size', 'md');
    const description = getByText('Create your first project to start tracking work.');
    expect(description).toHaveClass('pp-text', 'pp-empty-state__description');
    expect(description).toHaveAttribute('data-tone', 'muted');
    expect(description).toHaveAttribute('data-align', 'center');
    const actions = root.querySelector('.pp-empty-state__actions')!;
    expect(actions).toHaveClass('pp-cluster');
    expect(actions).toHaveAttribute('data-justify', 'center');
    expect(actions.querySelectorAll('.pp-button')).toHaveLength(2);
    expect(Array.from(root.children).map((c) => c.className.split(' ').find((k) => k.startsWith('pp-empty-state__')))).toEqual([
      'pp-empty-state__icon',
      'pp-empty-state__title',
      'pp-empty-state__description',
      'pp-empty-state__actions',
    ]);
  });

  it('outline carries pp-card before its own class, the two-class contract (spec §3)', () => {
    const { getByTestId } = renderWithTheme(<Inbox variant="outline" />);
    const root = getByTestId('empty');
    expect(root).toHaveAttribute('data-variant', 'outline');
    expect(root.className.split(' ')).toEqual(['pp-card', 'pp-empty-state']);
  });

  it('lets the primitives\' props through: a title size, a description tone, an actions gap', () => {
    const { getByRole, getByText } = renderWithTheme(
      <EmptyState>
        <EmptyStateTitle level={3} size="sm">
          Small
        </EmptyStateTitle>
        <EmptyStateDescription tone="neutral">Plain</EmptyStateDescription>
        <EmptyStateActions gap="4" data-testid="actions" />
      </EmptyState>,
    );
    expect(getByRole('heading', { level: 3 })).toHaveAttribute('data-size', 'sm');
    expect(getByText('Plain')).toHaveAttribute('data-tone', 'neutral');
    expect(document.querySelector('[data-testid="actions"]')).toHaveAttribute('data-pp-gap', '4');
  });

  it('forwards refs and merges className and style on every part', () => {
    const root = createRef<HTMLDivElement>();
    const icon = createRef<HTMLSpanElement>();
    const title = createRef<HTMLHeadingElement>();
    const description = createRef<HTMLParagraphElement>();
    const actions = createRef<HTMLDivElement>();
    renderWithTheme(
      <EmptyState ref={root} className="r" style={{ opacity: 0.5 }}>
        <EmptyStateIcon ref={icon} className="i" style={{ order: 1 }}>
          <svg viewBox="0 0 24 24" />
        </EmptyStateIcon>
        <EmptyStateTitle ref={title} level={2} className="t" style={{ order: 2 }}>
          T
        </EmptyStateTitle>
        <EmptyStateDescription ref={description} className="d" style={{ order: 3 }}>
          D
        </EmptyStateDescription>
        <EmptyStateActions ref={actions} className="a" style={{ order: 4 }} />
      </EmptyState>,
    );
    expect(root.current).toHaveClass('pp-empty-state', 'r');
    expect(root.current).toHaveStyle({ opacity: '0.5' });
    expect(icon.current).toHaveClass('pp-empty-state__icon', 'i');
    expect(icon.current).toHaveStyle({ order: '1' });
    expect(title.current).toHaveClass('pp-empty-state__title', 't');
    expect(title.current).toHaveStyle({ order: '2' });
    expect(description.current).toHaveClass('pp-empty-state__description', 'd');
    expect(description.current).toHaveStyle({ order: '3' });
    expect(actions.current).toHaveClass('pp-empty-state__actions', 'a');
    expect(actions.current).toHaveStyle({ order: '4' });
  });

  it('has no axe violations in both themes and both variants', async () => {
    const light = renderWithTheme(<Inbox />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Inbox variant="outline" />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
