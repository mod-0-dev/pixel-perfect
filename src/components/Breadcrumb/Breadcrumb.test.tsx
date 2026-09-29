import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage } from './Breadcrumb';

function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbEllipsis />
      <BreadcrumbItem>
        <BreadcrumbLink href="/projects/1">Design system</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbPage>Tokens</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  );
}

describe('Breadcrumb', () => {
  it('is a navigation landmark named Breadcrumb around an ordered list of items (spec §1)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(<Trail />);
    const nav = getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('pp-breadcrumb');
    const list = getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('pp-breadcrumb__list');
    const items = getAllByRole('listitem');
    expect(items).toHaveLength(4);
    for (const li of items) expect(li).toHaveClass('pp-breadcrumb__item');
    expect(items.map((li) => li.textContent?.trim())).toEqual(['Home', '…', 'Design system', 'Tokens']);
  });

  it('draws no separator in the markup: the stylesheet does (spec §1)', () => {
    const { getByRole } = renderWithTheme(<Trail />);
    expect(getByRole('list').textContent).not.toContain('/');
  });

  it('a crumb is a neutral Link underlined on hover, with its href (spec §3)', () => {
    const { getByRole } = renderWithTheme(<Trail />);
    const home = getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/');
    expect(home).toHaveClass('pp-link', 'pp-breadcrumb__link');
    expect(home).toHaveAttribute('data-pp-tone', 'neutral');
    expect(home).toHaveAttribute('data-underline', 'hover');
  });

  it('the page is a span with aria-current="page" and no href (spec §2)', () => {
    const { getByText, queryByRole } = renderWithTheme(<Trail />);
    const page = getByText('Tokens');
    expect(page.tagName).toBe('SPAN');
    expect(page).toHaveAttribute('aria-current', 'page');
    expect(page).toHaveClass('pp-breadcrumb__page');
    expect(queryByRole('link', { name: 'Tokens' })).toBeNull();
  });

  it('the ellipsis is named, and renames by `label`', () => {
    const { getByRole, rerender } = renderWithTheme(<Trail />);
    expect(getByRole('img', { name: 'More levels' })).toHaveTextContent('…');
    expect(getByRole('img', { name: 'More levels' }).closest('li')).toHaveClass('pp-breadcrumb__ellipsis');
    rerender(
      <Breadcrumb>
        <BreadcrumbEllipsis label="Three folders" />
      </Breadcrumb>,
    );
    expect(getByRole('img', { name: 'Three folders' })).toBeInTheDocument();
  });

  it('asChild puts the crumb on a router link (spec §3)', () => {
    const { getByRole } = renderWithTheme(
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <a href="/router" data-router="">
              Projects
            </a>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>,
    );
    const link = getByRole('link', { name: 'Projects' });
    expect(link).toHaveAttribute('href', '/router');
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveClass('pp-link', 'pp-breadcrumb__link');
  });

  it('names the landmark by `label`, and forwards refs, className and style on every part', () => {
    const nav = createRef<HTMLElement>();
    const item = createRef<HTMLLIElement>();
    const link = createRef<HTMLAnchorElement>();
    const page = createRef<HTMLSpanElement>();
    const ellipsis = createRef<HTMLLIElement>();
    const { getByRole } = renderWithTheme(
      <Breadcrumb ref={nav} label="You are here" className="n" style={{ opacity: 0.5 }} data-testid="b">
        <BreadcrumbItem ref={item} className="i" style={{ order: 1 }}>
          <BreadcrumbLink ref={link} href="/" className="l" style={{ order: 2 }}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbEllipsis ref={ellipsis} className="e" style={{ order: 3 }} />
        <BreadcrumbItem>
          <BreadcrumbPage ref={page} className="p" style={{ order: 4 }}>
            Here
          </BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>,
    );
    expect(nav.current).toBe(getByRole('navigation', { name: 'You are here' }));
    expect(nav.current).toHaveClass('pp-breadcrumb', 'n');
    expect(nav.current).toHaveStyle({ opacity: '0.5' });
    expect(nav.current).toHaveAttribute('data-testid', 'b');
    expect(item.current).toHaveClass('pp-breadcrumb__item', 'i');
    expect(item.current).toHaveStyle({ order: '1' });
    expect(link.current).toHaveClass('pp-breadcrumb__link', 'l');
    expect(link.current).toHaveStyle({ order: '2' });
    expect(ellipsis.current).toHaveClass('pp-breadcrumb__ellipsis', 'e');
    expect(ellipsis.current).toHaveStyle({ order: '3' });
    expect(page.current).toHaveClass('pp-breadcrumb__page', 'p');
    expect(page.current).toHaveStyle({ order: '4' });
  });

  it('has no axe violations in both themes', async () => {
    const light = renderWithTheme(<Trail />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Trail />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
