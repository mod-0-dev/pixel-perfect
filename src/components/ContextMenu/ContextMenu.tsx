'use client';

import * as RadixMenu from '@radix-ui/react-context-menu';
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
import { directionOf, type Direction } from '../../internal/overlay/side';
import { resolveSpace } from '../../internal/overlay/space';
import { useInheritedTheme } from '../../internal/overlay/theme';
import { mergeRefs } from '../../internal/refs';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/useControllableState';
import type { Space } from '../../types';

/**
 * The commands on a thing, opened where the pointer is.
 *
 * DROPDOWNMENU'S LIST, OPENED BY A GESTURE (spec §1, §2): every part but
 * the root, the trigger and the content is DropdownMenu's, built once by
 * the internal factory, and every node carries DropdownMenu's class first
 * and this component's second — so DropdownMenu.css draws it all and this
 * component ships no stylesheet (D-073 §1).
 *
 * THE TRIGGER IS A REGION (spec §3): a `<div>` around the thing the menu is
 * about, opened by a secondary press, a long press, or `Shift+F10` on a
 * focused element inside it. It is not made focusable — the thing inside
 * is what should be.
 *
 * Sizing contract: hug, with the overlay exception (D-061 §3). RSC: client.
 * Spec: docs/specs/ContextMenu.md
 */

export type ContextMenuItemTone = MenuItemTone;

interface ContextMenuContextValue {
  triggerRef: RefObject<HTMLElement | null>;
  setDir: (dir: Direction) => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenuContext(part: string): ContextMenuContextValue {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <ContextMenu${part}> must be rendered inside <ContextMenu>.`);
  }
  return context;
}

// ---------------------------------------------------------------------------
// Root

export interface ContextMenuProps {
  open?: boolean;
  /** Of little use: the list has no point to open at until a press (spec §6). Present because RULES §5.5 has no exceptions. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** `true` (the default): an outside press closes the menu and reaches nothing under it (DropdownMenu §6). */
  modal?: boolean;
  children?: ReactNode;
}

export function ContextMenu({ open: openProp, defaultOpen, onOpenChange, modal = true, children }: ContextMenuProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const [dir, setDir] = useState<Direction>('ltr');
  const context = useMemo<ContextMenuContextValue>(() => ({ triggerRef, setDir }), []);
  /* Radix's root is controlled-only; the uncontrolled half is ours (spec §6). */
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
    component: 'ContextMenu',
    prop: 'open',
  });

  return (
    <ContextMenuContext.Provider value={context}>
      <RadixMenu.Root open={open} onOpenChange={setOpen} modal={modal} dir={dir}>
        {children}
      </RadixMenu.Root>
    </ContextMenuContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger

export interface ContextMenuTriggerProps extends ComponentPropsWithoutRef<'div'> {
  /** Renders the child instead of a `<div>`, merging the region's props onto it (RULES §5.7). */
  asChild?: boolean;
  /** No gesture opens the menu; the region is the thing inside it, unchanged. */
  disabled?: boolean;
}

export const ContextMenuTrigger = forwardRef<HTMLDivElement, ContextMenuTriggerProps>(function ContextMenuTrigger(
  { asChild = false, disabled = false, className, children, ...props },
  ref,
) {
  const { triggerRef } = useContextMenuContext('Trigger');
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, triggerRef as Ref<HTMLDivElement>), [ref, triggerRef]);
  return (
    /* Radix's trigger is a <span>; a region holds block content, so the
       element is ours, a <div>, through Radix's own asChild (spec §3). */
    <RadixMenu.Trigger asChild disabled={disabled}>
      {asChild ? (
        /* The consumer's element takes Radix's trigger props through Radix's
           Slot and ours through the library's (D-003): two slots deep, one
           element rendered. */
        <Slot ref={setRef as Ref<HTMLElement>} className={className} {...props}>
          {children}
        </Slot>
      ) : (
        <div ref={setRef} className={cx('pp-context-menu__trigger', className)} {...props}>
          {children}
        </div>
      )}
    </RadixMenu.Trigger>
  );
});

// ---------------------------------------------------------------------------
// Content

export interface ContextMenuContentProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RadixMenu.Content>,
    'collisionPadding' | 'alignOffset' | 'asChild' | 'forceMount'
  > {
  /** A step of the space scale kept between the list and the viewport's edges. */
  collisionPadding?: Space;
  /** Where the list is portalled. Defaults to `document.body`. */
  container?: Element | null;
}

export const ContextMenuContent = forwardRef<HTMLDivElement, ContextMenuContentProps>(function ContextMenuContent(
  { container, ...props },
  ref,
) {
  return (
    <RadixMenu.Portal container={container ?? undefined}>
      <MenuPanel ref={ref} {...props} />
    </RadixMenu.Portal>
  );
});

const MenuPanel = forwardRef<HTMLDivElement, Omit<ContextMenuContentProps, 'container'>>(function MenuPanel(
  { collisionPadding = '2', className, ...props },
  ref,
) {
  const { triggerRef, setDir } = useContextMenuContext('Content');
  const theme = useInheritedTheme(triggerRef);

  /* The direction goes up to the root as Radix's `dir` and the padding
     comes down as pixels, both read from the REGION at open time — this
     element mounts on open — before paint (spec §5). */
  const [resolved, setResolved] = useState({ collisionPadding: 0 });
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    setDir(directionOf(trigger));
    setResolved({ collisionPadding: resolveSpace(trigger, collisionPadding) });
  }, [triggerRef, setDir, collisionPadding]);

  return (
    <RadixMenu.Content
      ref={ref}
      className={cx('pp-dropdown-menu', 'pp-context-menu', className)}
      data-pp-theme={theme}
      collisionPadding={resolved.collisionPadding}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// The twelve parts a menu is made of, DropdownMenu's, built once (spec §1).

const parts = createMenuParts(RadixMenu, { name: 'ContextMenu', block: 'pp-context-menu', useMenuContext: useContextMenuContext });

export type ContextMenuItemProps = MenuItemProps;
export type ContextMenuCheckboxItemProps = MenuCheckboxItemProps;
export type ContextMenuRadioGroupProps = MenuRadioGroupProps;
export type ContextMenuRadioItemProps = MenuRadioItemProps;
export type ContextMenuItemIndicatorProps = MenuItemIndicatorProps;
export type ContextMenuGroupProps = MenuGroupProps;
export type ContextMenuLabelProps = MenuLabelProps;
export type ContextMenuSeparatorProps = MenuSeparatorProps;
export type ContextMenuShortcutProps = MenuShortcutProps;
export type ContextMenuSubProps = MenuSubProps;
export type ContextMenuSubTriggerProps = MenuSubTriggerProps;
export type ContextMenuSubContentProps = MenuSubContentProps;

export const ContextMenuItem = parts.Item;
export const ContextMenuCheckboxItem = parts.CheckboxItem;
export const ContextMenuRadioGroup = parts.RadioGroup;
export const ContextMenuRadioItem = parts.RadioItem;
export const ContextMenuItemIndicator = parts.ItemIndicator;
export const ContextMenuGroup = parts.Group;
export const ContextMenuLabel = parts.Label;
export const ContextMenuSeparator = parts.Separator;
export const ContextMenuShortcut = parts.Shortcut;
export const ContextMenuSub = parts.Sub;
export const ContextMenuSubTrigger = parts.SubTrigger;
export const ContextMenuSubContent = parts.SubContent;
