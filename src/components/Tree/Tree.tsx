'use client';

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import type React from 'react';

import { cx } from '../../internal/cx';
import { directionOf } from '../../internal/overlay/side';
import { mergeRefs } from '../../internal/refs';
import { useControllableState } from '../../internal/useControllableState';
import { Icon } from '../Icon/Icon';

/**
 * A hierarchy to walk and pick from: the ARIA tree view, drawn with the
 * control tokens, holding which nodes are open and which one is picked.
 *
 * FOCUS ON THE ROW, ONE TAB STOP, THE APG KEYS (spec §2). The row is the
 * `treeitem` — the element with focus is the element with the ring (RULES
 * §6), and a ring on an <li> would circle the whole subtree — and it owns
 * its group through `aria-owns`, the <li> being presentational. A collapsed
 * node's children are not rendered, so the DOM holds exactly the visible
 * items, and the keyboard walks `[role="treeitem"]` in document order.
 *
 * Sizing contract: fill. RSC: client. Spec: docs/specs/Tree.md
 */

interface TreeContextValue {
  isExpanded: (value: string) => boolean;
  toggle: (value: string) => void;
  selected: string | undefined;
  select: (value: string) => void;
  tabStop: string | undefined;
  setFocused: (value: string) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);
const LevelContext = createContext(1);

function useTree(part: string): TreeContextValue {
  const context = useContext(TreeContext);
  if (!context) throw new Error(`[pixel-perfect] <Tree${part}> must be rendered inside <Tree>.`);
  return context;
}

const visibleItems = (tree: HTMLElement): HTMLElement[] =>
  Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]:not([aria-disabled="true"])'));

// ---------------------------------------------------------------------------
// Root

export interface TreeProps extends Omit<ComponentPropsWithoutRef<'ul'>, 'aria-label'> {
  /** The tree's name. Required: a tree without one is an unnamed widget. */
  label: string;
  expanded?: string[] | undefined;
  defaultExpanded?: string[] | undefined;
  onExpandedChange?: (expanded: string[]) => void;
  selected?: string | undefined;
  defaultSelected?: string | undefined;
  onSelectedChange?: (selected: string) => void;
}

export const Tree = forwardRef<HTMLUListElement, TreeProps>(function Tree(
  {
    label,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    selected: selectedProp,
    defaultSelected,
    onSelectedChange,
    className,
    onKeyDown,
    children,
    ...props
  },
  ref,
) {
  const rootRef = useRef<HTMLUListElement | null>(null);
  const setRootRef = useMemo(() => mergeRefs<HTMLUListElement>(ref, rootRef), [ref]);
  const [expanded, setExpanded] = useControllableState<string[]>({
    value: expandedProp,
    defaultValue: defaultExpanded ?? [],
    onChange: onExpandedChange,
    component: 'Tree',
    prop: 'expanded',
  });
  const [selected, setSelected] = useControllableState<string | undefined>({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelectedChange as ((v: string | undefined) => void) | undefined,
    component: 'Tree',
    prop: 'selected',
  });
  const [focused, setFocused] = useState<string | undefined>(undefined);

  const expandedSet = useMemo(() => new Set(expanded), [expanded]);
  const toggle = useCallback(
    (value: string) => {
      setExpanded(expandedSet.has(value) ? expanded.filter((v) => v !== value) : [...expanded, value]);
    },
    [expanded, expandedSet, setExpanded],
  );

  /* THE TAB STOP (spec §2): the focused item, else the selected, else the
     first top-level item, which is always rendered — read from the root's
     own children, so no item has to ask the DOM. */
  const first = Children.toArray(children).find((child) => isValidElement<{ value?: string }>(child)) as
    | React.ReactElement<{ value?: string }>
    | undefined;
  const tabStop = focused ?? selected ?? first?.props.value;

  const focusItem = (item: HTMLElement | undefined) => {
    if (!item) return;
    item.focus();
    const value = item.getAttribute('data-value');
    if (value) setFocused(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const tree = rootRef.current;
    const item = (event.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]');
    if (!tree || !item || item.getAttribute('aria-disabled') === 'true') return;
    const value = item.getAttribute('data-value') ?? '';
    const items = visibleItems(tree);
    const index = items.indexOf(item);
    const isParent = item.hasAttribute('aria-expanded');
    const open = item.getAttribute('aria-expanded') === 'true';
    const rtl = directionOf(tree) === 'rtl';
    const into = rtl ? 'ArrowLeft' : 'ArrowRight';
    const outOf = rtl ? 'ArrowRight' : 'ArrowLeft';

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem(items[index + 1]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(items[index - 1]);
        break;
      case into:
        event.preventDefault();
        if (isParent && !open) toggle(value);
        else if (isParent && open) focusItem(items[index + 1]);
        break;
      case outOf:
        event.preventDefault();
        if (isParent && open) toggle(value);
        else {
          /* The row's <li>, its group, the parent's <li>, and that one's row. */
          const parentLi = item.parentElement?.parentElement?.closest<HTMLElement>('.pp-tree__item');
          focusItem(parentLi?.querySelector<HTMLElement>(':scope > [role="treeitem"]') ?? undefined);
        }
        break;
      case 'Home':
        event.preventDefault();
        focusItem(items[0]);
        break;
      case 'End':
        event.preventDefault();
        focusItem(items[items.length - 1]);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        setSelected(value);
        setFocused(value);
        if (isParent) toggle(value);
        break;
      default:
    }
  };

  const context = useMemo<TreeContextValue>(
    () => ({
      isExpanded: (value) => expandedSet.has(value),
      toggle,
      selected,
      select: (value) => setSelected(value),
      tabStop,
      setFocused,
    }),
    [expandedSet, toggle, selected, setSelected, tabStop],
  );

  return (
    <TreeContext.Provider value={context}>
      <LevelContext.Provider value={1}>
        <ul
          ref={setRootRef}
          role="tree"
          aria-label={label}
          className={cx('pp-tree', className)}
          data-pp-tone="accent"
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </ul>
      </LevelContext.Provider>
    </TreeContext.Provider>
  );
});

// ---------------------------------------------------------------------------
// Item

export interface TreeItemProps extends Omit<ComponentPropsWithoutRef<'li'>, 'children'> {
  /** Unique in the tree. */
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** The child items. A node with any is a parent. */
  children?: ReactNode;
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export const TreeItem = forwardRef<HTMLLIElement, TreeItemProps>(function TreeItem(
  { value, label, icon, disabled = false, children, className, style, onClick, onFocus, ...props },
  ref,
) {
  const tree = useTree('Item');
  const level = useContext(LevelContext);
  const groupId = useId();
  const isParent = Children.toArray(children).some((child) => isValidElement(child));
  const open = isParent && tree.isExpanded(value);
  const selected = tree.selected === value;
  const isTabStop = tree.tabStop === value;

  return (
    <li
      ref={ref}
      role="none"
      className={cx('pp-tree__item', className)}
      style={{ ...style, '--_pp-tree-level': level } as CSSProperties}
      data-level={level}
      {...props}
    >
      <div
        role="treeitem"
        className="pp-tree__row"
        data-value={value}
        {...(isParent ? { 'aria-expanded': open, 'data-state': open ? 'open' : 'closed', 'aria-owns': open ? groupId : undefined } : {})}
        aria-selected={selected}
        aria-level={level}
        {...(disabled ? { 'aria-disabled': true } : {})}
        data-selected={selected ? '' : undefined}
        tabIndex={isTabStop && !disabled ? 0 : -1}
        onFocus={(event) => {
          onFocus?.(event as unknown as React.FocusEvent<HTMLLIElement>);
          if (event.target === event.currentTarget) tree.setFocused(value);
        }}
        onClick={(event: MouseEvent<HTMLDivElement>) => {
          onClick?.(event as unknown as MouseEvent<HTMLLIElement>);
          if (event.defaultPrevented || disabled) return;
          /* A press on the chevron alone toggles; on the row it selects, and
             toggles a parent. */
          if ((event.target as HTMLElement).closest('.pp-tree__toggle')) {
            if (isParent) tree.toggle(value);
            return;
          }
          tree.select(value);
          tree.setFocused(value);
          if (isParent) tree.toggle(value);
          event.currentTarget.focus();
        }}
      >
        {/* Sized by Icon (D-019), never by a width here: the toggle is an
            empty Icon on a leaf, so every row's label starts at the same x. */}
        <Icon decorative size="sm" className="pp-tree__toggle">
          {isParent ? <Chevron /> : <svg viewBox="0 0 24 24" />}
        </Icon>
        {icon !== undefined && icon !== null ? (
          <Icon decorative size="sm" className="pp-tree__icon">
            {icon}
          </Icon>
        ) : null}
        <span className="pp-tree__label">{label}</span>
      </div>
      {open ? (
        <LevelContext.Provider value={level + 1}>
          <ul role="group" id={groupId} className="pp-tree__group">
            {children}
          </ul>
        </LevelContext.Provider>
      ) : null}
    </li>
  );
});

