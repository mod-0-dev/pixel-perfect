import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { AppShell } from './AppShell';

const shell = () => (
  <AppShell header={<span>Brand</span>} sidebar={<nav aria-label="Main">links</nav>} footer={<span>© Acme</span>}>
    <h1>Page</h1>
  </AppShell>
);

describe('AppShell', () => {
  it('renders the landmarks, the skip link first and wired to the main, in frame order (spec §1, §2)', () => {
    const { getByRole, container } = renderWithTheme(shell());
    const root = container.querySelector('.pp-app-shell') as HTMLElement;
    const main = getByRole('main');
    expect(getByRole('banner')).toHaveClass('pp-app-shell__header');
    expect(getByRole('contentinfo')).toHaveClass('pp-app-shell__footer');
    expect(getByRole('navigation', { name: 'Main' }).closest('.pp-app-shell__sidebar')).not.toBeNull();
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main.id).not.toBe('');

    const skip = getByRole('link', { name: 'Skip to content' });
    expect(root.firstElementChild).toBe(skip);
    expect(skip).toHaveAttribute('href', `#${main.id}`);

    const order = Array.from(root.querySelectorAll('.pp-app-shell__skip, .pp-app-shell__header, .pp-app-shell__sidebar, .pp-app-shell__main, .pp-app-shell__footer')).map(
      (n) => n.className.split(' ').find((c) => c.startsWith('pp-app-shell__')),
    );
    expect(order).toEqual(['pp-app-shell__skip', 'pp-app-shell__header', 'pp-app-shell__sidebar', 'pp-app-shell__main', 'pp-app-shell__footer']);
  });

  it('is Split in the middle row, with the two knobs forwarded; no sidebar, no Split (spec §3)', () => {
    const { container, rerender } = renderWithTheme(
      <AppShell sidebar={<nav aria-label="Main" />} sidebarInlineSize="20rem" collapseBelow="lg">
        page
      </AppShell>,
    );
    const body = container.querySelector('.pp-app-shell__body') as HTMLElement;
    expect(body).toHaveClass('pp-split');
    expect(body).toHaveAttribute('data-collapse-below', 'lg');
    expect(body.style.getPropertyValue('--_pp-split-sidebar')).toBe('20rem');
    expect(container.querySelector('.pp-app-shell__sidebar')).toHaveClass('pp-split__sidebar');
    expect(container.querySelector('.pp-app-shell__main')).toHaveClass('pp-split__main');

    rerender(<AppShell>page</AppShell>);
    expect(container.querySelector('.pp-split')).toBeNull();
    expect(container.querySelector('.pp-app-shell > .pp-app-shell__main')).not.toBeNull();
    expect(container.querySelector('header')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
  });

  it('writes data-sticky when asked, the skip label from the prop, and forwards ref, className, style and the rest to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container, getByRole } = renderWithTheme(
      <AppShell ref={ref} sticky skipLinkLabel="Zum Inhalt" className="c" style={{ opacity: 0.5 }} data-testid="s" aria-label="Frame">
        page
      </AppShell>,
    );
    const root = container.querySelector('.pp-app-shell') as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('data-sticky'); // presence, as Button's data-loading (the value is React's "true")
    expect(root).toHaveClass('pp-app-shell', 'c');
    expect(root).toHaveStyle({ opacity: '0.5' });
    expect(root).toHaveAttribute('data-testid', 's');
    expect(root).toHaveAttribute('aria-label', 'Frame');
    expect(getByRole('link', { name: 'Zum Inhalt' })).toBeInTheDocument();
    render(<AppShell>page</AppShell>);
    expect(document.querySelectorAll('[data-sticky]')).toHaveLength(1);
  });

  it('renders on the server, the skip link naming the main (RSC, D-081 §4)', () => {
    const html = renderToString(shell());
    const id = /<main id="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeTruthy();
    expect(html.indexOf('pp-app-shell__skip')).toBeLessThan(html.indexOf('<header'));
    expect(html).toContain(`href="#${id}"`);
  });

  it('passes axe in both themes', async () => {
    for (const theme of ['light', 'dark'] as const) {
      const { container, unmount } = renderWithTheme(shell(), { theme });
      await expectNoA11yViolations(container);
      unmount();
    }
  });
});

describe('AppShell with collapseTo="drawer" (spec §9)', () => {
  const drawerShell = (props: Partial<Parameters<typeof AppShell>[0]> = {}) => (
    <AppShell
      collapseTo="drawer"
      header={<span>Brand</span>}
      sidebar={
        <nav aria-label="Main">
          <a href="#reports">Reports</a>
        </nav>
      }
      {...props}
    >
      <h1>Page</h1>
    </AppShell>
  );

  it('puts a named menu button at the start of the header, and keeps the sidebar for wide shells', () => {
    const { getByRole, container } = renderWithTheme(drawerShell());
    const root = container.querySelector('.pp-app-shell') as HTMLElement;
    expect(root).toHaveAttribute('data-collapse-to', 'drawer');
    expect(root).toHaveAttribute('data-collapse-below', 'md');
    const header = getByRole('banner');
    const button = getByRole('button', { name: 'Menu' });
    expect(header.firstElementChild).toBe(button);
    expect(button).toHaveClass('pp-app-shell__menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(header.querySelector('.pp-app-shell__header-content')).toHaveTextContent('Brand');
    expect(container.querySelector('.pp-app-shell__sidebar')).toHaveTextContent('Reports');
  });

  it('opens the sidebar’s content in a drawer from the start edge, and a followed link closes it', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(drawerShell({ menuLabel: 'Navigation' }));
    await user.click(getByRole('button', { name: 'Navigation' }));
    // Portalled, so read from the document rather than the render container.
    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(dialog).toHaveAttribute('data-side', 'left');
    expect(within(dialog).getByRole('link', { name: 'Reports' })).toBeInTheDocument();
    await user.click(dialog.querySelector('a') as HTMLElement);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('is controlled and uncontrolled, and reports both (RULES §5.5)', async () => {
    const user = userEvent.setup();
    const onMenuOpenChange = vi.fn();
    const { getByRole, rerender } = render(drawerShell({ menuOpen: false, onMenuOpenChange }));
    await user.click(getByRole('button', { name: 'Menu' }));
    expect(onMenuOpenChange).toHaveBeenCalledWith(true);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    rerender(drawerShell({ menuOpen: true, onMenuOpenChange }));
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
  });

  it('portals the drawer into menuContainer when given', () => {
    const box = document.createElement('div');
    document.body.appendChild(box);
    render(drawerShell({ defaultMenuOpen: true, menuContainer: box }));
    expect(box).toContainElement(screen.getByRole('dialog', { name: 'Menu' }));
    box.remove();
  });

  it('renders no menu without a sidebar, or with collapseBelow="never"', () => {
    const { queryByRole, rerender, container } = render(
      <AppShell collapseTo="drawer" header={<span>Brand</span>}>
        <h1>Page</h1>
      </AppShell>,
    );
    expect(queryByRole('button', { name: 'Menu' })).toBeNull();
    expect(container.querySelector('.pp-app-shell')).not.toHaveAttribute('data-collapse-to');
    rerender(drawerShell({ collapseBelow: 'never' }));
    expect(queryByRole('button', { name: 'Menu' })).toBeNull();
  });

  it('server-renders, with the button in the HTML before hydration', () => {
    const html = renderToString(drawerShell());
    expect(html).toContain('pp-app-shell__menu');
    expect(html).toContain('aria-label="Menu"');
  });

  it('has no axe violations, with the drawer open', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithTheme(drawerShell());
    await user.click(getByRole('button', { name: 'Menu' }));
    await expectNoA11yViolations(document.body);
  });
});
