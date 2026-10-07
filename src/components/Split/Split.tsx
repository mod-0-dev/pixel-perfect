import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import type { Space } from '../../types';

/**
 * A fixed-width pane beside a flexible one, which stacks when the container
 * gets narrow. An app shell's sidebar, a form beside a preview, a filter rail
 * beside a list.
 *
 * It is a two-slot layout and nothing more: no resize handle, no collapse
 * toggle, no persistence. A draggable splitter is the APG window-splitter
 * pattern with its own keyboard contract, and if it is ever wanted it is a
 * separate component.
 *
 * THERE IS NO `side` PROP (D-022 §3). SplitSidebar and SplitMain render in
 * DOM order; a right-hand sidebar is written by putting SplitMain first. The
 * alternative is `order`, which desynchronises reading order from visual order,
 * and a prop whose only function is to create that is not worth two saved
 * lines.
 *
 * THE PARTS ARE NAMED EXPORTS, as every compound's are (RULES §5.6, D-079 §1).
 * Split was the last compound still dotted — `Split.Sidebar` — and the only
 * one: it shipped before D-062 found that a Server Component cannot dot into
 * a client module, and a server compound that could dot would make two
 * spellings for one idea (D-107 §2).
 *
 * Sizing contract: fill.
 * RSC: server. No hooks, no browser APIs — the collapse is pure CSS.
 *
 * Spec: docs/specs/tier-2-layout.md §2.6
 */

/**
 * Named rather than free-form because **a container query condition cannot read
 * a custom property** (D-022 §2). `@container (max-inline-size: var(--x))` is
 * not valid CSS and cannot be made so, which makes `collapseBelow="42rem"`
 * unimplementable rather than merely awkward.
 */
export type SplitCollapse = 'sm' | 'md' | 'lg' | 'never';

export interface SplitProps extends ComponentPropsWithoutRef<'div'> {
  /** The sidebar's `flex-basis`. Any CSS length. */
  sidebarInlineSize?: string;
  /** `sm` 30rem · `md` 45rem · `lg` 60rem · `never`. */
  collapseBelow?: SplitCollapse;
  /** A step of the space scale, between the two panes in both layouts. */
  gap?: Space;
}

export interface SplitSidebarProps extends ComponentPropsWithoutRef<'div'> {
  /** Render the single child element instead of a `<div>` — usually `<aside>` or `<nav>`. */
  asChild?: boolean;
}

export interface SplitMainProps extends ComponentPropsWithoutRef<'div'> {
  /** Render the single child element instead of a `<div>` — usually `<main>`. */
  asChild?: boolean;
}

export const Split = forwardRef<HTMLDivElement, SplitProps>(function Split(
  { sidebarInlineSize = '16rem', collapseBelow = 'md', gap = '0', className, style, ...props },
  ref,
) {
  // A private property, so a consumer's --pp-split-sidebar-inline-size still
  // wins from an ancestor (D-024). Always written, so it cannot inherit into a
  // nested Split.
  const mergedStyle = { ...style, '--_pp-split-sidebar': sidebarInlineSize } as CSSProperties;

  return (
    <div
      ref={ref}
      className={cx('pp-split', className)}
      style={mergedStyle}
      data-collapse-below={collapseBelow}
      data-pp-gap={gap}
      {...props}
    />
  );
});

export const SplitSidebar = forwardRef<HTMLDivElement, SplitSidebarProps>(function SplitSidebar(
  { asChild = false, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'div';
  return <Component ref={ref} className={cx('pp-split__sidebar', className)} {...props} />;
});

export const SplitMain = forwardRef<HTMLDivElement, SplitMainProps>(function SplitMain(
  { asChild = false, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'div';
  return <Component ref={ref} className={cx('pp-split__main', className)} {...props} />;
});
