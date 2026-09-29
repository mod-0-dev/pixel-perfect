import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Badge } from '../Badge/Badge';
import { NavSidebar, NavSidebarGroup, NavSidebarItem, NavSidebarSection, type NavSidebarGroupProps } from './NavSidebar';

const Glyph = () => <svg viewBox="0 0 24 24" data-glyph="" />;

function Nav({ current = '/', group = {} }: { current?: string; group?: Partial<NavSidebarGroupProps> } = {}) {
  return (
    <NavSidebar label="Main">
      <NavSidebarSection>
        <NavSidebarItem href="/" icon={<Glyph />} current={current === '/'}>
          Home
        </NavSidebarItem>
        <NavSidebarItem href="/inbox" end={<Badge>3</Badge>} current={current === '/inbox'}>
          Inbox
        </NavSidebarItem>
      </NavSidebarSection>
      <NavSidebarSection title="Workspace">
        <NavSidebarGroup label="Projects" icon={<Glyph />} {...group}>
          <NavSidebarItem href="/projects/alpha" current={current === '/projects/alpha'}>
            Alpha
          </NavSidebarItem>
          <NavSidebarItem href="/projects/beta">Beta</NavSidebarItem>
        </NavSidebarGroup>
        <NavSidebarItem href="/members">Members</NavSidebarItem>
      </NavSidebarSection>
    </NavSidebar>
  );
}

const link = (name: string) => document.querySelector(`a.pp-nav-sidebar__link[href="${name}"]`) as HTMLAnchorElement;
const level = (el: Element) => (el.closest('li') as HTMLElement).style.getPropertyValue('--_pp-nav-level');

describe('NavSidebar', () => {
  it('is a named navigation of sections: a title names its list, a section without one has an unnamed list; an item is a link with a decorative icon, a label and its end (spec §1)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(<Nav />);
    const nav = getByRole('navigation', { name: 'Main' });
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('pp-nav-sidebar');
    expect(nav).toHaveAttribute('data-pp-tone', 'accent');
    const sections = nav.querySelectorAll(':scope > .pp-nav-sidebar__section');
    expect(sections).toHaveLength(2);
    expect(sections[0]!.querySelector('.pp-nav-sidebar__title')).toBeNull();
    expect(sections[0]!.querySelector('ul')).not.toHaveAttribute('aria-labelledby');
    const title = sections[1]!.querySelector('.pp-nav-sidebar__title') as HTMLElement;
    expect(title).toHaveTextContent('Workspace');
    expect(getByRole('list', { name: 'Workspace' })).toBe(sections[1]!.querySelector('ul'));
    const home = getByRole('link', { name: 'Home' });
    expect(home).toBe(link('/'));
    expect(home.parentElement).toHaveClass('pp-nav-sidebar__item');
    expect(home.parentElement!.tagName).toBe('LI');
    expect(home.querySelector('.pp-nav-sidebar__icon')).toHaveAttribute('aria-hidden', 'true');
    expect(home.querySelector('.pp-nav-sidebar__label')).toHaveTextContent('Home');
    expect(link('/inbox').querySelector('.pp-nav-sidebar__end .pp-badge')).toHaveTextContent('3');
    expect(getAllByRole('link')).toHaveLength(3); // Alpha and Beta are hidden with the closed group
  });

  it('writes aria-current="page" on the current link only; a group holding the current item is open by default and marked; the level is written per li (spec §2, §5)', () => {
    const first = renderWithTheme(<Nav current="/projects/alpha" />);
    expect(link('/projects/alpha')).toHaveAttribute('aria-current', 'page');
    expect(link('/')).not.toHaveAttribute('aria-current');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);
    const group = first.getByRole('button', { name: 'Projects' }).parentElement as HTMLElement;
    expect(group).toHaveClass('pp-nav-sidebar__group');
    expect(group).toHaveAttribute('data-state', 'open');
    expect(group).toHaveAttribute('data-current');
    expect(level(link('/'))).toBe('1');
    expect(level(group)).toBe('1');
    expect(level(link('/projects/alpha'))).toBe('2');
    first.unmount();
    renderWithTheme(<Nav current="/" />);
    const closed = document.querySelector('.pp-nav-sidebar__group') as HTMLElement;
    expect(closed).toHaveAttribute('data-state', 'closed');
    expect(closed).not.toHaveAttribute('data-current');
  });

  it('a group is a button with aria-expanded and aria-controls over a list that is rendered and hidden while closed; click and Enter toggle it; onOpenChange fires; controlled holds (spec §3)', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { getByRole, unmount } = renderWithTheme(<Nav group={{ onOpenChange }} />);
    const toggle = getByRole('button', { name: 'Projects' });
    expect(toggle).toHaveClass('pp-nav-sidebar__link', 'pp-nav-sidebar__toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const list = document.getElementById(toggle.getAttribute('aria-controls')!) as HTMLElement;
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('hidden');
    expect(list.querySelectorAll('a')).toHaveLength(2);
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(list).not.toHaveAttribute('hidden');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(list).toHaveAttribute('hidden');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    unmount();
    function Owner() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <output>{String(open)}</output>
          <Nav group={{ open, onOpenChange: setOpen }} />
        </>
      );
    }
    const owner = renderWithTheme(<Owner />);
    await user.click(owner.getByRole('button', { name: 'Projects' }));
    expect(owner.getByText('true')).toBeInTheDocument();
    expect(owner.getByRole('button', { name: 'Projects' })).toHaveAttribute('aria-expanded', 'true');
    owner.unmount();
    renderWithTheme(<Nav group={{ open: false, onOpenChange }} />);
    await user.click(document.querySelector('.pp-nav-sidebar__toggle') as HTMLElement);
    expect(document.querySelector('.pp-nav-sidebar__toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  it('Tab reaches every link and toggle in order, skipping a closed group\'s links (spec §4)', async () => {
    const user = userEvent.setup();
    renderWithTheme(<Nav />);
    const names: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      await user.tab();
      names.push((document.activeElement as HTMLElement).textContent ?? '');
    }
    expect(names).toEqual(['Home', 'Inbox3', 'Projects', 'Members']);
    await user.tab({ shift: true });
    await user.keyboard('{Enter}');
    await user.tab();
    expect(document.activeElement).toBe(link('/projects/alpha'));
  });

  it('asChild renders the child as the link with the class, aria-current and the ref, and builds the row around its children (spec §7); an item outside a section throws (spec §1)', () => {
    const ref = createRef<HTMLAnchorElement>();
    const { getByRole } = renderWithTheme(
      <NavSidebar label="Main">
        <NavSidebarSection>
          <NavSidebarItem asChild current icon={<Glyph />} end={<Badge>9</Badge>} ref={ref} className="mine" data-testid="home">
            <a href="/home" data-child="">
              Home
            </a>
          </NavSidebarItem>
        </NavSidebarSection>
      </NavSidebar>,
    );
    /* The end is part of the name — "Home 9" is what a count means. */
    const home = getByRole('link', { name: 'Home9' });
    expect(home).toBe(ref.current);
    expect(home).toHaveAttribute('data-child');
    expect(home).toHaveAttribute('href', '/home');
    expect(home).toHaveClass('pp-nav-sidebar__link', 'mine');
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(home).toHaveAttribute('data-testid', 'home');
    expect(home.querySelector('.pp-nav-sidebar__icon [data-glyph]')).not.toBeNull();
    expect(home.querySelector('.pp-nav-sidebar__label')).toHaveTextContent('Home');
    expect(home.querySelector('.pp-nav-sidebar__end')).toHaveTextContent('9');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderWithTheme(
        <NavSidebar label="Loose">
          <NavSidebarItem href="/">Home</NavSidebarItem>
        </NavSidebar>,
      ),
    ).toThrow('<NavSidebarItem> must be rendered inside <NavSidebarSection>');
    error.mockRestore();
  });

  it('forwards refs and merges className and style on every part; the rest spreads (RULES §5)', () => {
    const refs = { nav: createRef<HTMLElement>(), section: createRef<HTMLDivElement>(), item: createRef<HTMLAnchorElement>(), group: createRef<HTMLLIElement>() };
    const { getByRole } = renderWithTheme(
      <NavSidebar ref={refs.nav} label="Main" className="n" style={{ opacity: 0.9 }} data-testid="nav">
        <NavSidebarSection ref={refs.section} title="One" className="s" style={{ opacity: 0.8 }} data-testid="section">
          <NavSidebarItem ref={refs.item} href="/" className="i" style={{ opacity: 0.7 }} data-testid="item">
            Home
          </NavSidebarItem>
          <NavSidebarGroup ref={refs.group} label="More" className="g" style={{ opacity: 0.6 }} data-testid="group" defaultOpen>
            <NavSidebarItem href="/a">A</NavSidebarItem>
          </NavSidebarGroup>
        </NavSidebarSection>
      </NavSidebar>,
    );
    const nav = getByRole('navigation', { name: 'Main' });
    expect(refs.nav.current).toBe(nav);
    expect(nav).toHaveClass('pp-nav-sidebar', 'n');
    expect(nav).toHaveStyle({ opacity: '0.9' });
    expect(nav).toHaveAttribute('data-testid', 'nav');
    expect(refs.section.current).toHaveClass('pp-nav-sidebar__section', 's');
    expect(refs.section.current).toHaveStyle({ opacity: '0.8' });
    expect(refs.section.current).toHaveAttribute('data-testid', 'section');
    expect(refs.item.current).toBe(getByRole('link', { name: 'Home' }));
    expect(refs.item.current).toHaveClass('pp-nav-sidebar__link', 'i');
    expect(refs.item.current).toHaveStyle({ opacity: '0.7' });
    expect(refs.item.current).toHaveAttribute('data-testid', 'item');
    expect(refs.group.current).toHaveClass('pp-nav-sidebar__group', 'g');
    expect(refs.group.current).toHaveStyle({ opacity: '0.6' });
    expect(refs.group.current!.style.getPropertyValue('--_pp-nav-level')).toBe('1');
    expect(refs.group.current).toHaveAttribute('data-testid', 'group');
    expect(refs.group.current).toHaveAttribute('data-state', 'open');
  });

  it('renders on the server as the whole map, the closed list hidden', () => {
    const html = renderToString(<Nav current="/inbox" />);
    expect(html).toContain('<nav class="pp-nav-sidebar" aria-label="Main"');
    expect(html).toContain('href="/projects/beta"');
    expect(html).toMatch(/<ul id="[^"]+" class="pp-nav-sidebar__list" hidden=""/);
    expect(html).toContain('aria-current="page"');
  });

  it('passes axe in both themes, closed and open', async () => {
    for (const theme of ['light', 'dark'] as const) {
      const { container, unmount } = renderWithTheme(<Nav current="/projects/alpha" />, { theme });
      await expectNoA11yViolations(container);
      unmount();
    }
    const { container } = renderWithTheme(<Nav />);
    await expectNoA11yViolations(container);
  });
});
