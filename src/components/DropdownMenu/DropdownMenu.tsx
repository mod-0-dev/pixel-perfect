'use client';

import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import {
  createContext,
  forwardRef,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';

import { cx } from '../../internal/cx';
import {
  createMenuParts,
  type MenuCheckboxItemProps,
  type MenuGroupProps,
  type MenuItemIndicatorProps,
  type MenuItemProps,
  type MenuItemTone,
  type MenuLabelProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuSeparatorProps,
  type MenuShortcutProps,
  type MenuSubContentProps,
  type MenuSubProps,
  type MenuSubTriggerProps,
} from '../../internal/menu/parts';
import { directionOf, resolveSide, type Direction, type LogicalSide } from '../../internal/overlay/side';
import { resolveSpace } from '../../internal/overlay/space';
import { useInheritedTheme } from '../../internal/overlay/theme';
import { mergeRefs } from '../../internal/refs';
import type { Space } from '../../types';

/**
 * A list of commands anchored to the button that opened it.
 *
 * Behaviour is Radix's menu — roving focus, typeahead, submenus, the
 * dismissable layer, the positioning — and every node, class and pixel is
 * ours. What this file adds over Radix is the overlay foundation's three
 * things (overlay-foundation.md): the THEME crosses the portal, `side` is
 * LOGICAL, offsets are STEPS of the space scale; and one more for a menu:
 * the DIRECTION is read from the trigger at open time and handed to Radix
 * as `dir` (spec §5), which is what makes the arrow keys and the submenu's
 * side read correctly in a right-to-left page.
 *
 * Sizing contract: hug, with the overlay exception (D-061 §3). RSC: client.
 * Named parts, not `DropdownMenu.Item` (D-062 §1). Spec: docs/specs/DropdownMenu.md
 */

export type DropdownMenuSide = LogicalSide;
export type DropdownMenuAlign = 'start' | 'center' | 'end';
export type DropdownMenuItemTone = MenuItemTone;

interface DropdownMenuContextValue {
  /** The trigger: the theme's scope and the direction's source. */
  triggerRef: RefObject<HTMLElement | null>;
  setDir: (dir: Direction) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(part: string): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <DropdownMenu${part}> must be rendered inside <DropdownMenu>.`);
  }
  return context;
}

// ---------------------------------------------------------------------------
// Root

export interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * `true` (the default, Radix's and every native menu's): an outside press
   * closes the menu and reaches nothing under it, scroll is locked, the rest
   * of the page is hidden from assistive tech and focus is trapped (spec §6).
   */
  modal?: boolean;
  children?: ReactNode;
}

export function DropdownMenu({ open, defaultOpen, onOpenChange, modal = true, children }: DropdownMenuProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  /*
   * THE DIRECTION IS STATE ON THE ROOT (spec §5). Radix assumes `ltr`
   * unless told; the content reads the trigger's direction when it mounts
   * — at open time — and sets it here, before paint. Never at module scope
   * (RULES §7).
   */
  const [dir, setDir] = useState<Direction>('ltr');
  const context = useMemo<DropdownMenuContextValue>(() => ({ triggerRef, setDir }), []);

  return (
    <DropdownMenuContext.Provider value={context}>
      <RadixMenu.Root
        {...(open !== undefined ? { open } : {})}
        {...(defaultOpen !== undefined ? { defaultOpen } : {})}
        {...(onOpenChange !== undefined ? { onOpenChange } : {})}
        modal={modal}
        dir={dir}
      >
        {children}
      </RadixMenu.Root>
    </DropdownMenuContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger

export interface DropdownMenuTriggerProps extends ComponentPropsWithoutRef<'button'> {
  /** Renders the child instead of a `<button>`, merging the trigger's props onto it (RULES §5.7). */
  asChild?: boolean;
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger({ asChild = false, className, ...props }, ref) {
    const { triggerRef } = useDropdownMenuContext('Trigger');
    const setRef = useMemo(() => mergeRefs<HTMLButtonElement>(ref, triggerRef as Ref<HTMLButtonElement>), [ref, triggerRef]);
    return (
      <RadixMenu.Trigger
        ref={setRef}
        asChild={asChild}
        className={cx(!asChild && 'pp-dropdown-menu__trigger', className)}
        {...props}
      />
    );
  },
);

// ---------------------------------------------------------------------------
// Content

export interface DropdownMenuContentProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RadixMenu.Content>,
    'side' | 'sideOffset' | 'align' | 'alignOffset' | 'collisionPadding' | 'asChild' | 'forceMount'
  > {
  /** Logical: `start` and `end` follow the layout's direction (spec §4). */
  side?: DropdownMenuSide;
  /** `start` by default: a list hangs from its trigger's start edge (spec §4). */
  align?: DropdownMenuAlign;
  /** A step of the space scale between the trigger and the list. */
  sideOffset?: Space;
  /** A step of the space scale kept between the list and the viewport's edges. */
  collisionPadding?: Space;
  /** Where the list is portalled. Defaults to `document.body`. */
  container?: Element | null;
}

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(function DropdownMenuContent(
  { container, ...props },
  ref,
) {
  return (
    /* The panel is the portal's direct child, so Radix keeps it mounted for
       its exit animation (D-061 §4). Nothing renders on the server. */
    <RadixMenu.Portal container={container ?? undefined}>
      <MenuPanel ref={ref} {...props} />
    </RadixMenu.Portal>
  );
});

const MenuPanel = forwardRef<HTMLDivElement, Omit<DropdownMenuContentProps, 'container'>>(function MenuPanel(
  { side = 'bottom', align = 'start', sideOffset = '1', collisionPadding = '2', className, ...props },
  ref,
) {
  const { triggerRef, setDir } = useDropdownMenuContext('Content');
  const theme = useInheritedTheme(triggerRef);

  /*
   * Resolved against the TRIGGER, at open time — this element mounts on
   * open — in a layout effect, before paint. The direction goes up to the
   * root as Radix's `dir` (spec §5); the side and the offsets come down to
   * Radix's content as pixels (4.1 §5, D-061 §5).
   */
  const [resolved, setResolved] = useState(() => ({
    side: resolveSide(side, 'ltr'),
    sideOffset: 0,
    collisionPadding: 0,
  }));
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const direction = directionOf(trigger);
    setDir(direction);
    setResolved({
      side: resolveSide(side, direction),
      sideOffset: resolveSpace(trigger, sideOffset),
      collisionPadding: resolveSpace(trigger, collisionPadding),
    });
  }, [triggerRef, setDir, side, sideOffset, collisionPadding]);

  return (
    <RadixMenu.Content
      ref={ref}
      className={cx('pp-dropdown-menu', className)}
      data-pp-theme={theme}
      side={resolved.side}
      align={align}
      sideOffset={resolved.sideOffset}
      collisionPadding={resolved.collisionPadding}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Items, groups, labels, separators, shortcuts and submenus: the parts a
// menu shares with ContextMenu, built once (src/internal/menu/parts.tsx).

const parts = createMenuParts(RadixMenu, { name: 'DropdownMenu', useMenuContext: useDropdownMenuContext });

export type DropdownMenuItemProps = MenuItemProps;
export type DropdownMenuCheckboxItemProps = MenuCheckboxItemProps;
export type DropdownMenuRadioGroupProps = MenuRadioGroupProps;
export type DropdownMenuRadioItemProps = MenuRadioItemProps;
export type DropdownMenuItemIndicatorProps = MenuItemIndicatorProps;
export type DropdownMenuGroupProps = MenuGroupProps;
export type DropdownMenuLabelProps = MenuLabelProps;
export type DropdownMenuSeparatorProps = MenuSeparatorProps;
export type DropdownMenuShortcutProps = MenuShortcutProps;
export type DropdownMenuSubProps = MenuSubProps;
export type DropdownMenuSubTriggerProps = MenuSubTriggerProps;
export type DropdownMenuSubContentProps = MenuSubContentProps;

export const DropdownMenuItem = parts.Item;
export const DropdownMenuCheckboxItem = parts.CheckboxItem;
export const DropdownMenuRadioGroup = parts.RadioGroup;
export const DropdownMenuRadioItem = parts.RadioItem;
export const DropdownMenuItemIndicator = parts.ItemIndicator;
export const DropdownMenuGroup = parts.Group;
export const DropdownMenuLabel = parts.Label;
export const DropdownMenuSeparator = parts.Separator;
export const DropdownMenuShortcut = parts.Shortcut;
export const DropdownMenuSub = parts.Sub;
export const DropdownMenuSubTrigger = parts.SubTrigger;
export const DropdownMenuSubContent = parts.SubContent;
