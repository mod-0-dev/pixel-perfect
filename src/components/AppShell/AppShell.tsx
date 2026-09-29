import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import { Split, type SplitCollapse } from '../Split/Split';

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
}

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
    className,
    ...props
  },
  ref,
) {
  const mainId = useId();
  const main = (
    <main id={mainId} tabIndex={-1} className="pp-app-shell__main">
      {children}
    </main>
  );

  return (
    <div ref={ref} className={cx('pp-app-shell', className)} data-sticky={sticky || undefined} {...props}>
      <a className="pp-app-shell__skip" href={`#${mainId}`}>
        {skipLinkLabel}
      </a>
      {header !== undefined && header !== null ? <header className="pp-app-shell__header">{header}</header> : null}
      {sidebar !== undefined && sidebar !== null ? (
        <Split className="pp-app-shell__body" sidebarInlineSize={sidebarInlineSize} collapseBelow={collapseBelow} gap="0">
          <Split.Sidebar className="pp-app-shell__sidebar">{sidebar}</Split.Sidebar>
          <Split.Main asChild>{main}</Split.Main>
        </Split>
      ) : (
        main
      )}
      {footer !== undefined && footer !== null ? <footer className="pp-app-shell__footer">{footer}</footer> : null}
    </div>
  );
});
