import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage } from '../Breadcrumb/Breadcrumb';
import { Button } from '../Button/Button';
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderTitle } from './PageHeader';

const header = () => (
  <PageHeader>
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbPage>Releases</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
    <PageHeaderTitle>Releases</PageHeaderTitle>
    <PageHeaderDescription>Everything shipped this quarter.</PageHeaderDescription>
    <PageHeaderActions>
      <Button variant="outline">Export</Button>
      <Button tone="accent">New release</Button>
    </PageHeaderActions>
  </PageHeader>
);

describe('PageHeader', () => {
  it('renders the four parts on their base components, the breadcrumb in place, in DOM order (spec §1, §3, §4)', () => {
    const { container, getByRole } = renderWithTheme(header());
    const root = container.querySelector('.pp-page-header') as HTMLElement;
    expect(root.tagName).toBe('HEADER');
    const title = getByRole('heading', { level: 1, name: 'Releases' });
    expect(title).toHaveClass('pp-heading', 'pp-page-header__title');
    const description = root.querySelector('.pp-page-header__description') as HTMLElement;
    expect(description.tagName).toBe('P');
    expect(description).toHaveClass('pp-text');
    expect(description).toHaveAttribute('data-tone', 'muted');
    const actions = root.querySelector('.pp-page-header__actions') as HTMLElement;
    expect(actions).toHaveClass('pp-cluster');
    expect(actions).toHaveAttribute('data-pp-gap', '2');
    expect(getByRole('navigation', { name: 'Breadcrumb' })).toHaveClass('pp-breadcrumb');
    const order = Array.from(root.children).map((n) => n.className.split(' ').find((c) => c.startsWith('pp-page-header__') || c === 'pp-breadcrumb'));
    expect(order).toEqual(['pp-breadcrumb', 'pp-page-header__title', 'pp-page-header__description', 'pp-page-header__actions']);
  });

  it('takes a heading level, a description tone and a cluster gap when told; forwards refs and merges className and style on every part', () => {
    const refs = { root: createRef<HTMLElement>(), title: createRef<HTMLHeadingElement>(), description: createRef<HTMLParagraphElement>(), actions: createRef<HTMLDivElement>() };
    const { container, getByRole } = renderWithTheme(
      <PageHeader ref={refs.root} className="r" style={{ opacity: 0.5 }} data-testid="ph">
        <PageHeaderTitle ref={refs.title} level={2} size="md" className="t" style={{ order: 3 }}>
          Details
        </PageHeaderTitle>
        <PageHeaderDescription ref={refs.description} tone="danger" className="d" style={{ opacity: 0.9 }}>
          Careful.
        </PageHeaderDescription>
        <PageHeaderActions ref={refs.actions} gap="4" justify="end" className="a" style={{ opacity: 0.8 }}>
          <Button>Go</Button>
        </PageHeaderActions>
      </PageHeader>,
    );
    const root = container.querySelector('.pp-page-header') as HTMLElement;
    expect(refs.root.current).toBe(root);
    expect(root).toHaveClass('r');
    expect(root).toHaveStyle({ opacity: '0.5' });
    expect(root).toHaveAttribute('data-testid', 'ph');
    const title = getByRole('heading', { level: 2, name: 'Details' });
    expect(refs.title.current).toBe(title);
    expect(title).toHaveClass('t');
    expect(title).toHaveAttribute('data-size', 'md');
    expect(refs.description.current).toHaveClass('d');
    expect(refs.description.current).toHaveAttribute('data-tone', 'danger');
    expect(refs.actions.current).toHaveClass('a');
    expect(refs.actions.current).toHaveAttribute('data-pp-gap', '4');
    expect(refs.actions.current).toHaveAttribute('data-justify', 'end');
  });

  it('renders on the server', () => {
    const html = renderToString(header());
    expect(html).toContain('<header class="pp-page-header">');
    expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('pp-page-header__description'));
  });

  it('passes axe in both themes', async () => {
    for (const theme of ['light', 'dark'] as const) {
      const { container, unmount } = renderWithTheme(header(), { theme });
      await expectNoA11yViolations(container);
      unmount();
    }
  });
});
