'use client';

import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cx } from '../../internal/cx';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/useControllableState';
import { Icon } from '../Icon/Icon';

/**
 * An app's primary navigation, down the side: a named <nav> of sections,
 * links and disclosure groups, for AppShell's sidebar slot.
 *
 * PLAIN LINKS, EVERY ONE A TAB STOP (spec §4): the APG's disclosure
 * navigation, not its navigation treeview. A link stays a link to a screen
 * reader, Tab reaches the next one, and there is nothing to learn. The
 * dependency on Tree is the row it is drawn like (spec §5), not the role.
 *
 * THE APP SAYS WHICH LINK IS CURRENT (spec §2): `current` writes
 * `aria-current="page"`; a group whose subtree holds it is open by default
 * and marked `data-current`, read from the elements at render.
 *
 * A CLOSED GROUP'S LIST IS RENDERED AND `hidden` (spec §3): a navigation is
 * the page's map, and a crawler or a reader without JavaScript gets all of
 * it; `hidden` takes the closed list out of the accessibility tree and the
 * tab order, which is what closed means.
 *
 * Sizing contract: fill. RSC: client (a group holds whether it is open).
 * Spec: docs/specs/NavSidebar.md
 */

const SectionContext = createContext(false);
const LevelContext = createContext(1);

function useSection(part: string) {
  if (!useContext(SectionContext)) {
    throw new Error(`[pixel-perfect] <NavSidebar${part}> must be rendered inside <NavSidebarSection>.`);
  }
}

// ---------------------------------------------------------------------------
// NavSidebar

export interface NavSidebarProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'aria-label'> {
  /** The landmark's name. Required: a screen reader lists an unnamed navigation as "navigation" (spec §1). */
  label: string;
}

export const NavSidebar = forwardRef<HTMLElement, NavSidebarProps>(function NavSidebar({ label, className, ...props }, ref) {
  return <nav ref={ref} className={cx('pp-nav-sidebar', className)} aria-label={label} data-pp-tone="accent" {...props} />;
});

// ---------------------------------------------------------------------------
// NavSidebarSection

export interface NavSidebarSectionProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** A small heading above the list, which names the list (`aria-labelledby`). */
  title?: ReactNode;
}

export const NavSidebarSection = forwardRef<HTMLDivElement, NavSidebarSectionProps>(function NavSidebarSection(
  { title, className, children, ...props },
  ref,
) {
  const titleId = useId();
  const named = title !== undefined && title !== null;
  return (
    <div ref={ref} className={cx('pp-nav-sidebar__section', className)} {...props}>
      {named ? (
        <div id={titleId} className="pp-nav-sidebar__title">
          {title}
        </div>
      ) : null}
      <ul className="pp-nav-sidebar__list" aria-labelledby={named ? titleId : undefined}>
        <SectionContext.Provider value={true}>
          <LevelContext.Provider value={1}>{children}</LevelContext.Provider>
        </SectionContext.Provider>
      </ul>
    </div>
  );
});

// ---------------------------------------------------------------------------
// NavSidebarItem

export interface NavSidebarItemProps extends ComponentPropsWithoutRef<'a'> {
  /** This link is the page the reader is on: `aria-current="page"` (spec §2). */
  current?: boolean;
  /** A leading glyph, decorative. */
  icon?: ReactNode;
  /** Trailing content — a Badge, a Kbd. */
  end?: ReactNode;
  /** Render the single child element as the link (for `next/link`); its children become the label (spec §7). */
  asChild?: boolean;
}

function Row({ icon, end, children }: { icon?: ReactNode; end?: ReactNode; children: ReactNode }) {
  return (
    <>
      {icon !== undefined && icon !== null ? (
        <Icon decorative size="sm" className="pp-nav-sidebar__icon">
          {icon}
        </Icon>
      ) : null}
      <span className="pp-nav-sidebar__label">{children}</span>
      {end !== undefined && end !== null ? <span className="pp-nav-sidebar__end">{end}</span> : null}
    </>
  );
}

export const NavSidebarItem = forwardRef<HTMLAnchorElement, NavSidebarItemProps>(function NavSidebarItem(
  { current = false, icon, end, asChild = false, className, children, ...props },
  ref,
) {
  useSection('Item');
  const level = useContext(LevelContext);
  const rowStyle = { '--_pp-nav-level': level } as CSSProperties;

  if (asChild) {
    const child = Children.only(children) as ReactElement<{ children?: ReactNode }>;
    return (
      <li className="pp-nav-sidebar__item" style={rowStyle}>
        <Slot ref={ref} className={cx('pp-nav-sidebar__link', className)} aria-current={current ? 'page' : undefined} {...props}>
          {cloneElement(
            child,
            undefined,
            <Row icon={icon} end={end}>
              {child.props.children}
            </Row>,
          )}
        </Slot>
      </li>
    );
  }

  return (
    <li className="pp-nav-sidebar__item" style={rowStyle}>
      <a ref={ref} className={cx('pp-nav-sidebar__link', className)} aria-current={current ? 'page' : undefined} {...props}>
        <Row icon={icon} end={end}>
          {children}
        </Row>
      </a>
    </li>
  );
});

// ---------------------------------------------------------------------------
// NavSidebarGroup

export interface NavSidebarGroupProps extends Omit<ComponentPropsWithoutRef<'li'>, 'children'> {
  /** The row's text. */
  label: ReactNode;
  icon?: ReactNode;
  open?: boolean | undefined;
  /** Defaults to whether the group holds the current item (spec §2, §3). */
  defaultOpen?: boolean | undefined;
  onOpenChange?: (open: boolean) => void;
  /** Items and groups, one level in. */
  children?: ReactNode;
}

/* Whether any element in the tree is `current` — read from the elements,
   no context and no effect, so it is known on the first render (spec §2). */
function holdsCurrent(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement<{ current?: boolean; children?: ReactNode }>(child)) return false;
    return child.props.current === true || holdsCurrent(child.props.children);
  });
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export const NavSidebarGroup = forwardRef<HTMLLIElement, NavSidebarGroupProps>(function NavSidebarGroup(
  { label, icon, open: openProp, defaultOpen, onOpenChange, className, style, children, ...props },
  ref,
) {
  useSection('Group');
  const level = useContext(LevelContext);
  const listId = useId();
  const current = holdsCurrent(children);
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? current,
    onChange: onOpenChange,
    component: 'NavSidebarGroup',
    prop: 'open',
  });

  return (
    <li
      ref={ref}
      className={cx('pp-nav-sidebar__group', className)}
      style={{ ...style, '--_pp-nav-level': level } as CSSProperties}
      data-state={open ? 'open' : 'closed'}
      data-current={current || undefined}
      {...props}
    >
      <button
        type="button"
        className="pp-nav-sidebar__link pp-nav-sidebar__toggle"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
      >
        <Row icon={icon}>{label}</Row>
        <Icon decorative size="sm" className="pp-nav-sidebar__chevron">
          <Chevron />
        </Icon>
      </button>
      <ul id={listId} className="pp-nav-sidebar__list" hidden={!open}>
        <LevelContext.Provider value={level + 1}>{children}</LevelContext.Provider>
      </ul>
    </li>
  );
});
