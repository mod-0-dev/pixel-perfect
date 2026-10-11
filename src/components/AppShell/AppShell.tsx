import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import { Split, SplitMain, SplitSidebar, type SplitCollapse } from '../Split/Split';
import { AppShellMenu } from './AppShellMenu';

/**
 * The frame of an app page: a header across the top, a sidebar beside the
 * content, the content as the page's <main>, a footer under both — and a
 * skip link to the content as the first thing a keyboard reaches.
 *
 * SLOTS FOR THE FRAME, `children` FOR THE PAGE (spec §1, D-096 §1). The root
 * renders <main> itself: the skip link needs the main's id and the main needs
 * tabIndex={-1}, and a Server Component has `useId` but no context to carry
 * an id from a root to a child part. The frame has one arrangement, so a
 * slot cannot be misplaced; and a Next layout's {children} is the page.
 *
 * SPLIT IS THE MIDDLE ROW (spec §3): its two knobs pass through, and below
 * `collapseBelow` the sidebar stacks above the content by the shell's own
 * width — the viewport media query the consuming app's `.lp-shell` still
 * carries, replaced. With no sidebar there is no Split.
 *
 * OR, WITH `collapseTo="drawer"`, IT LEAVES (spec §9, D-110 §8). On a phone a
 * stacked sidebar pushes the page below the fold on every page, so below
 * `collapseBelow` the sidebar is hidden and a menu button at the start of the
 * header opens the same content in a Drawer. The shell renders the button
 * itself, so a drawer shell cannot be left with no way to its navigation, and
 * the button is the one client island in a server component.
 *
 * Sizing contract: fill; `min-block-size: 100%` defers to the parent for the
 * block axis (spec §6). RSC: server. Spec: docs/specs/AppShell.md
 */
export interface AppShellProps extends ComponentPropsWithoutRef<'div'> {
  /** Rendered in `<header>` (`banner`) when given. */
  header?: ReactNode;
  /** Rendered in the Split's sidebar when given. Brings its own `<nav>`. */
  sidebar?: ReactNode;
  /** Rendered in `<footer>` (`contentinfo`) when given. */
  footer?: ReactNode;
  /** The page, in `<main>`. */
  children?: ReactNode;
  skipLinkLabel?: string;
  /** Split's. */
  sidebarInlineSize?: string;
  /** Split's. */
  collapseBelow?: SplitCollapse;
  /** The header stays in view (spec §5). */
  sticky?: boolean;
  /**
   * What the sidebar does below `collapseBelow`: stack above the content, or
   * leave for a Drawer opened by a menu button in the header (spec §9).
   * Default `'stack'`.
   */
  collapseTo?: AppShellCollapseTo;
  /** The menu button's name and the drawer's, with `collapseTo="drawer"`. */
  menuLabel?: string;
  /** The drawer, controlled. */
  menuOpen?: boolean;
  /** The drawer, uncontrolled. */
  defaultMenuOpen?: boolean;
  /** Fires in both modes, and when a link in the drawer is followed. */
  onMenuOpenChange?: (open: boolean) => void;
  /**
   * Where the drawer is portalled, with `collapseTo="drawer"`. Defaults to
   * `document.body`. For a shell inside a box narrower than the viewport — a
   * preview pane, a docs example — so the drawer covers the shell it belongs
   * to rather than the page (spec §9).
   */
  menuContainer?: Element | null;
}

export type AppShellCollapseTo = 'stack' | 'drawer';

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    header,
    sidebar,
    footer,
    children,
    skipLinkLabel = 'Skip to content',
    sidebarInlineSize = '16rem',
    collapseBelow = 'md',
    sticky = false,
    collapseTo = 'stack',
    menuLabel = 'Menu',
    menuOpen,
    defaultMenuOpen,
    onMenuOpenChange,
    menuContainer,
    className,
    ...props
  },
  ref,
) {
  const mainId = useId();
  const hasHeader = header !== undefined && header !== null;
  const hasSidebar = sidebar !== undefined && sidebar !== null;
  /* A drawer needs a sidebar to hold and a breakpoint to appear below. */
  const drawer = collapseTo === 'drawer' && hasSidebar && collapseBelow !== 'never';
  const main = (
    <main id={mainId} tabIndex={-1} className="pp-app-shell__main">
      {children}
    </main>
  );

  return (
    <div
      ref={ref}
      className={cx('pp-app-shell', className)}
      data-sticky={sticky || undefined}
      data-collapse-to={drawer ? 'drawer' : undefined}
      data-collapse-below={drawer ? collapseBelow : undefined}
      {...props}
    >
      <a className="pp-app-shell__skip" href={`#${mainId}`}>
        {skipLinkLabel}
      </a>
      {drawer ? (
        <header className="pp-app-shell__header">
          <AppShellMenu
            label={menuLabel}
            open={menuOpen}
            defaultOpen={defaultMenuOpen}
            onOpenChange={onMenuOpenChange}
            container={menuContainer}
          >
            {sidebar}
          </AppShellMenu>
          {hasHeader ? <div className="pp-app-shell__header-content">{header}</div> : null}
        </header>
      ) : hasHeader ? (
        <header className="pp-app-shell__header">{header}</header>
      ) : null}
      {hasSidebar ? (
        <Split className="pp-app-shell__body" sidebarInlineSize={sidebarInlineSize} collapseBelow={collapseBelow} gap="0">
          <SplitSidebar className="pp-app-shell__sidebar">{sidebar}</SplitSidebar>
          <SplitMain asChild>{main}</SplitMain>
        </Split>
      ) : (
        main
      )}
      {footer !== undefined && footer !== null ? <footer className="pp-app-shell__footer">{footer}</footer> : null}
    </div>
  );
});
