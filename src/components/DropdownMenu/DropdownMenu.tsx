'use client';

import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
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
import { directionOf, resolveSide, type Direction, type LogicalSide } from '../../internal/overlay/side';
import { resolveSpace } from '../../internal/overlay/space';
import { useInheritedTheme } from '../../internal/overlay/theme';
import { mergeRefs } from '../../internal/refs';
import { useControllableState } from '../../internal/useControllableState';
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
export type DropdownMenuItemTone = 'neutral' | 'danger';
type CheckedState = boolean | 'indeterminate';

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

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

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
// Items

export interface DropdownMenuItemProps extends ComponentPropsWithoutRef<typeof RadixMenu.Item> {
  /** `danger` for a destructive command. Nothing else: a menu item is a command, not a status (spec §7). */
  tone?: DropdownMenuItemTone;
}

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(function DropdownMenuItem(
  { tone = 'neutral', className, ...props },
  ref,
) {
  useDropdownMenuContext('Item');
  return <RadixMenu.Item ref={ref} className={cx('pp-dropdown-menu__item', className)} data-pp-tone={tone} {...props} />;
});

/** What the indicator inside a checkable item draws when it is given no children. */
interface IndicatorContextValue {
  kind: 'checkbox' | 'radio';
  checked: CheckedState;
}

const IndicatorContext = createContext<IndicatorContextValue>({ kind: 'checkbox', checked: false });

export interface DropdownMenuCheckboxItemProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixMenu.CheckboxItem>, 'checked' | 'defaultChecked' | 'onCheckedChange'> {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  tone?: DropdownMenuItemTone;
}

export const DropdownMenuCheckboxItem = forwardRef<HTMLDivElement, DropdownMenuCheckboxItemProps>(
  function DropdownMenuCheckboxItem(
    { checked: checkedProp, defaultChecked, onCheckedChange, tone = 'neutral', className, children, ...props },
    ref,
  ) {
    useDropdownMenuContext('CheckboxItem');
    /* Radix's item is controlled-only; RULES §5.5 wants both halves. */
    const [checked, setChecked] = useControllableState<CheckedState>({
      value: checkedProp,
      defaultValue: defaultChecked ?? false,
      onChange: (next) => onCheckedChange?.(next === true),
      component: 'DropdownMenuCheckboxItem',
      prop: 'checked',
    });
    const indicator = useMemo<IndicatorContextValue>(() => ({ kind: 'checkbox', checked }), [checked]);
    return (
      <IndicatorContext.Provider value={indicator}>
        <RadixMenu.CheckboxItem
          ref={ref}
          className={cx('pp-dropdown-menu__item', className)}
          data-pp-tone={tone}
          checked={checked}
          onCheckedChange={setChecked}
          {...props}
        >
          {children}
        </RadixMenu.CheckboxItem>
      </IndicatorContext.Provider>
    );
  },
);

export interface DropdownMenuRadioGroupProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixMenu.RadioGroup>, 'value' | 'onValueChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupValueContext = createContext<string | undefined>(undefined);

export const DropdownMenuRadioGroup = forwardRef<HTMLDivElement, DropdownMenuRadioGroupProps>(
  function DropdownMenuRadioGroup({ value: valueProp, defaultValue, onValueChange, className, ...props }, ref) {
    useDropdownMenuContext('RadioGroup');
    const [value, setValue] = useControllableState<string | undefined>({
      value: valueProp,
      defaultValue,
      onChange: (next) => {
        if (next !== undefined) onValueChange?.(next);
      },
      component: 'DropdownMenuRadioGroup',
      prop: 'value',
    });
    return (
      <RadioGroupValueContext.Provider value={value}>
        <RadixMenu.RadioGroup
          ref={ref}
          className={cx('pp-dropdown-menu__radio-group', className)}
          {...(value !== undefined ? { value } : {})}
          onValueChange={setValue}
          {...props}
        />
      </RadioGroupValueContext.Provider>
    );
  },
);

export interface DropdownMenuRadioItemProps extends ComponentPropsWithoutRef<typeof RadixMenu.RadioItem> {
  tone?: DropdownMenuItemTone;
}

export const DropdownMenuRadioItem = forwardRef<HTMLDivElement, DropdownMenuRadioItemProps>(
  function DropdownMenuRadioItem({ tone = 'neutral', className, children, value, ...props }, ref) {
    useDropdownMenuContext('RadioItem');
    const groupValue = useContext(RadioGroupValueContext);
    const indicator = useMemo<IndicatorContextValue>(
      () => ({ kind: 'radio', checked: groupValue === value }),
      [groupValue, value],
    );
    return (
      <IndicatorContext.Provider value={indicator}>
        <RadixMenu.RadioItem
          ref={ref}
          className={cx('pp-dropdown-menu__item', className)}
          data-pp-tone={tone}
          value={value}
          {...props}
        >
          {children}
        </RadixMenu.RadioItem>
      </IndicatorContext.Provider>
    );
  },
);

export interface DropdownMenuItemIndicatorProps extends Omit<ComponentPropsWithoutRef<typeof RadixMenu.ItemIndicator>, 'forceMount'> {}

/**
 * The marks, as markup rather than a `mask-image` (D-039 §3): the Checkbox's
 * check, a dash for `indeterminate`, a dot for a radio item. `currentColor`,
 * so the tone reaches them.
 */
function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function Dash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M6 12h12" />
    </svg>
  );
}

function Dot() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      className="pp-dropdown-menu__chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** Present while its item is checked (Radix's Presence). Draws the library's mark unless given children. */
export const DropdownMenuItemIndicator = forwardRef<HTMLSpanElement, DropdownMenuItemIndicatorProps>(
  function DropdownMenuItemIndicator({ className, children, ...props }, ref) {
    useDropdownMenuContext('ItemIndicator');
    const { kind, checked } = useContext(IndicatorContext);
    const mark = kind === 'radio' ? <Dot /> : checked === 'indeterminate' ? <Dash /> : <Check />;
    return (
      <RadixMenu.ItemIndicator ref={ref} className={cx('pp-dropdown-menu__indicator', className)} {...props}>
        {children ?? mark}
      </RadixMenu.ItemIndicator>
    );
  },
);

// ---------------------------------------------------------------------------
// Group, Label, Separator, Shortcut

const GroupLabelContext = createContext<string | null>(null);

export interface DropdownMenuGroupProps extends ComponentPropsWithoutRef<typeof RadixMenu.Group> {}

/**
 * `role="group"`, named by the `Label` inside it: the wiring is unconditional
 * and the gap is warned about, the Popover title's shape (Popover §2, D-036).
 */
export const DropdownMenuGroup = forwardRef<HTMLDivElement, DropdownMenuGroupProps>(function DropdownMenuGroup(
  { className, 'aria-labelledby': ariaLabelledby, 'aria-label': ariaLabel, ...props },
  ref,
) {
  useDropdownMenuContext('Group');
  const labelId = useId();
  const wiresLabel = ariaLabel === undefined && ariaLabelledby === undefined;
  useEffect(() => {
    if (isProduction() || !wiresLabel) return;
    if (!document.getElementById(labelId)) {
      console.warn(
        '[pixel-perfect] <DropdownMenuGroup> has no accessible name. Render a <DropdownMenuLabel> inside it, or pass `aria-label` or `aria-labelledby`.',
      );
    }
  }, [wiresLabel, labelId]);
  return (
    <GroupLabelContext.Provider value={labelId}>
      <RadixMenu.Group
        ref={ref}
        className={cx('pp-dropdown-menu__group', className)}
        {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
        aria-labelledby={wiresLabel ? labelId : ariaLabelledby}
        {...props}
      />
    </GroupLabelContext.Provider>
  );
});

export interface DropdownMenuLabelProps extends ComponentPropsWithoutRef<typeof RadixMenu.Label> {}

export const DropdownMenuLabel = forwardRef<HTMLDivElement, DropdownMenuLabelProps>(function DropdownMenuLabel(
  { className, id, ...props },
  ref,
) {
  useDropdownMenuContext('Label');
  const labelId = useContext(GroupLabelContext);
  return (
    <RadixMenu.Label
      ref={ref}
      id={id ?? labelId ?? undefined}
      className={cx('pp-dropdown-menu__label', className)}
      {...props}
    />
  );
});

export interface DropdownMenuSeparatorProps extends ComponentPropsWithoutRef<typeof RadixMenu.Separator> {}

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  function DropdownMenuSeparator({ className, ...props }, ref) {
    useDropdownMenuContext('Separator');
    return <RadixMenu.Separator ref={ref} className={cx('pp-dropdown-menu__separator', className)} {...props} />;
  },
);

export interface DropdownMenuShortcutProps extends ComponentPropsWithoutRef<'span'> {}

/** The hint a command carries, as muted text at the item's end. Hidden from assistive tech: the command's name is the item's text (spec §7). */
export const DropdownMenuShortcut = forwardRef<HTMLSpanElement, DropdownMenuShortcutProps>(
  function DropdownMenuShortcut({ className, ...props }, ref) {
    useDropdownMenuContext('Shortcut');
    return <span ref={ref} className={cx('pp-dropdown-menu__shortcut', className)} aria-hidden="true" {...props} />;
  },
);

// ---------------------------------------------------------------------------
// Sub

export interface DropdownMenuSubProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function DropdownMenuSub({ open, defaultOpen, onOpenChange, children }: DropdownMenuSubProps) {
  useDropdownMenuContext('Sub');
  return (
    <RadixMenu.Sub
      {...(open !== undefined ? { open } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      {...(onOpenChange !== undefined ? { onOpenChange } : {})}
    >
      {children}
    </RadixMenu.Sub>
  );
}

export interface DropdownMenuSubTriggerProps extends ComponentPropsWithoutRef<typeof RadixMenu.SubTrigger> {}

export const DropdownMenuSubTrigger = forwardRef<HTMLDivElement, DropdownMenuSubTriggerProps>(
  function DropdownMenuSubTrigger({ className, children, ...props }, ref) {
    useDropdownMenuContext('SubTrigger');
    return (
      <RadixMenu.SubTrigger
        ref={ref}
        className={cx('pp-dropdown-menu__item', 'pp-dropdown-menu__sub-trigger', className)}
        data-pp-tone="neutral"
        {...props}
      >
        {children}
        <Chevron />
      </RadixMenu.SubTrigger>
    );
  },
);

export interface DropdownMenuSubContentProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RadixMenu.SubContent>,
    'sideOffset' | 'alignOffset' | 'collisionPadding' | 'asChild' | 'forceMount'
  > {
  sideOffset?: Space;
  collisionPadding?: Space;
  container?: Element | null;
}

export const DropdownMenuSubContent = forwardRef<HTMLDivElement, DropdownMenuSubContentProps>(
  function DropdownMenuSubContent({ container, ...props }, ref) {
    return (
      <RadixMenu.Portal container={container ?? undefined}>
        <SubPanel ref={ref} {...props} />
      </RadixMenu.Portal>
    );
  },
);

const SubPanel = forwardRef<HTMLDivElement, Omit<DropdownMenuSubContentProps, 'container'>>(function SubPanel(
  { sideOffset = '1', collisionPadding = '2', className, ...props },
  ref,
) {
  const { triggerRef } = useDropdownMenuContext('SubContent');
  const theme = useInheritedTheme(triggerRef);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, panelRef), [ref]);

  /*
   * Radix places a submenu on the side the root's `dir` says (spec §5); the
   * offsets are ours. `alignOffset` is minus this panel's own top edge —
   * border and padding, read from the element so a consumer's
   * `--pp-dropdown-menu-padding` is honoured — so the first sub-item sits
   * on the row of the item that opened it.
   */
  const [resolved, setResolved] = useState({ sideOffset: 0, collisionPadding: 0, alignOffset: 0 });
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    const view = panel?.ownerDocument.defaultView;
    const edge = panel && view ? parseFloat(view.getComputedStyle(panel).paddingBlockStart) + parseFloat(view.getComputedStyle(panel).borderBlockStartWidth) : 0;
    setResolved({
      sideOffset: resolveSpace(trigger, sideOffset),
      collisionPadding: resolveSpace(trigger, collisionPadding),
      alignOffset: Number.isFinite(edge) ? -edge : 0,
    });
  }, [triggerRef, sideOffset, collisionPadding]);

  return (
    <RadixMenu.SubContent
      ref={setRef}
      className={cx('pp-dropdown-menu', 'pp-dropdown-menu__sub', className)}
      data-pp-theme={theme}
      sideOffset={resolved.sideOffset}
      alignOffset={resolved.alignOffset}
      collisionPadding={resolved.collisionPadding}
      {...props}
    />
  );
});
