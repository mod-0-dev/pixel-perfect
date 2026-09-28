'use client';

import type * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu';
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
  type RefObject,
} from 'react';

import type { Space } from '../../types';
import { cx } from '../cx';
import { resolveSpace } from '../overlay/space';
import { useInheritedTheme } from '../overlay/theme';
import { mergeRefs } from '../refs';
import { useControllableState } from '../useControllableState';

/**
 * THE PARTS OF A MENU, BUILT ONCE (DropdownMenu.md §2, D-073 §1). Radix
 * composes `@radix-ui/react-menu` twice — a dropdown menu opened from a
 * button and a context menu opened from a press — and the two expose the
 * same items, groups, labels, separators and submenus with different
 * scopes. This factory takes either package's namespace and returns the
 * library's parts for it: the tone attribute, the uncontrolled halves RULES
 * §5.5 asks for, the indicator that draws the right mark, the group named
 * by its label, the submenu aligned to its trigger's row. One
 * implementation, two components, nothing kept in agreement by hand.
 *
 * Types are read from `@radix-ui/react-dropdown-menu` as the canonical
 * shape; the context menu's parts are the same shape with another scope
 * and are handed in as such. Internal. Not exported from the package.
 */

export type MenuItemTone = 'neutral' | 'danger';
type CheckedState = boolean | 'indeterminate';

/** What a menu component gives its parts: the trigger (theme and direction) and its own guard. */
export interface MenuPartsContext {
  triggerRef: RefObject<HTMLElement | null>;
}

export interface MenuPrimitives {
  Portal: typeof RadixDropdownMenu.Portal;
  Item: typeof RadixDropdownMenu.Item;
  CheckboxItem: typeof RadixDropdownMenu.CheckboxItem;
  RadioGroup: typeof RadixDropdownMenu.RadioGroup;
  RadioItem: typeof RadixDropdownMenu.RadioItem;
  ItemIndicator: typeof RadixDropdownMenu.ItemIndicator;
  Group: typeof RadixDropdownMenu.Group;
  Label: typeof RadixDropdownMenu.Label;
  Separator: typeof RadixDropdownMenu.Separator;
  Sub: typeof RadixDropdownMenu.Sub;
  SubTrigger: typeof RadixDropdownMenu.SubTrigger;
  SubContent: typeof RadixDropdownMenu.SubContent;
}

export interface MenuPartsOptions {
  /** `DropdownMenu` or `ContextMenu`: the display names and the guard's message. */
  name: string;
  /** The class the part carries second, after `pp-dropdown-menu__<part>`; none for the dropdown menu itself. */
  block?: string;
  useMenuContext: (part: string) => MenuPartsContext;
}

// ---------------------------------------------------------------------------
// Prop types, shared by both components

export interface MenuItemProps extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item> {
  /** `danger` for a destructive command. Nothing else: a menu item is a command, not a status. */
  tone?: MenuItemTone;
}

export interface MenuCheckboxItemProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixDropdownMenu.CheckboxItem>, 'checked' | 'defaultChecked' | 'onCheckedChange'> {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  tone?: MenuItemTone;
}

export interface MenuRadioGroupProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixDropdownMenu.RadioGroup>, 'value' | 'defaultValue' | 'onValueChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export interface MenuRadioItemProps extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.RadioItem> {
  tone?: MenuItemTone;
}

export interface MenuItemIndicatorProps extends Omit<ComponentPropsWithoutRef<typeof RadixDropdownMenu.ItemIndicator>, 'forceMount'> {}
export interface MenuGroupProps extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.Group> {}
export interface MenuLabelProps extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.Label> {}
export interface MenuSeparatorProps extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.Separator> {}
export interface MenuShortcutProps extends ComponentPropsWithoutRef<'span'> {}

export interface MenuSubProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export interface MenuSubTriggerProps extends ComponentPropsWithoutRef<typeof RadixDropdownMenu.SubTrigger> {}

export interface MenuSubContentProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RadixDropdownMenu.SubContent>,
    'sideOffset' | 'alignOffset' | 'collisionPadding' | 'asChild' | 'forceMount'
  > {
  /** A step of the space scale between the trigger row and the submenu. */
  sideOffset?: Space;
  /** A step of the space scale kept between the submenu and the viewport's edges. */
  collisionPadding?: Space;
  /** Where the submenu is portalled. Defaults to `document.body`. */
  container?: Element | null;
}

// ---------------------------------------------------------------------------
// The marks, as markup rather than a `mask-image` (D-039 §3): the Checkbox's
// check, a dash for `indeterminate`, a dot for a radio item, a chevron for a
// submenu. `currentColor`, so the tone reaches them.

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

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

/** What the indicator inside a checkable item draws when it is given no children. */
interface IndicatorContextValue {
  kind: 'checkbox' | 'radio';
  checked: CheckedState;
}

// ---------------------------------------------------------------------------

export function createMenuParts(Radix: MenuPrimitives, { name, block, useMenuContext }: MenuPartsOptions) {
  const part = (suffix: string) => cx(`pp-dropdown-menu__${suffix}`, block && `${block}__${suffix}`);
  const IndicatorContext = createContext<IndicatorContextValue>({ kind: 'checkbox', checked: false });
  const RadioGroupValueContext = createContext<string | undefined>(undefined);
  const GroupLabelContext = createContext<string | null>(null);

  const Item = forwardRef<HTMLDivElement, MenuItemProps>(function Item({ tone = 'neutral', className, ...props }, ref) {
    useMenuContext('Item');
    return <Radix.Item ref={ref} className={cx(part('item'), className)} data-pp-tone={tone} {...props} />;
  });
  Item.displayName = `${name}Item`;

  const CheckboxItem = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(function CheckboxItem(
    { checked: checkedProp, defaultChecked, onCheckedChange, tone = 'neutral', className, children, ...props },
    ref,
  ) {
    useMenuContext('CheckboxItem');
    /* Radix's item is controlled-only; RULES §5.5 wants both halves. */
    const [checked, setChecked] = useControllableState<CheckedState>({
      value: checkedProp,
      defaultValue: defaultChecked ?? false,
      onChange: (next) => onCheckedChange?.(next === true),
      component: `${name}CheckboxItem`,
      prop: 'checked',
    });
    const indicator = useMemo<IndicatorContextValue>(() => ({ kind: 'checkbox', checked }), [checked]);
    return (
      <IndicatorContext.Provider value={indicator}>
        <Radix.CheckboxItem
          ref={ref}
          className={cx(part('item'), className)}
          data-pp-tone={tone}
          checked={checked}
          onCheckedChange={setChecked}
          {...props}
        >
          {children}
        </Radix.CheckboxItem>
      </IndicatorContext.Provider>
    );
  });
  CheckboxItem.displayName = `${name}CheckboxItem`;

  const RadioGroup = forwardRef<HTMLDivElement, MenuRadioGroupProps>(function RadioGroup(
    { value: valueProp, defaultValue, onValueChange, className, ...props },
    ref,
  ) {
    useMenuContext('RadioGroup');
    const [value, setValue] = useControllableState<string | undefined>({
      value: valueProp,
      defaultValue,
      onChange: (next) => {
        if (next !== undefined) onValueChange?.(next);
      },
      component: `${name}RadioGroup`,
      prop: 'value',
    });
    return (
      <RadioGroupValueContext.Provider value={value}>
        <Radix.RadioGroup
          ref={ref}
          className={cx(part('radio-group'), className)}
          {...(value !== undefined ? { value } : {})}
          onValueChange={setValue}
          {...props}
        />
      </RadioGroupValueContext.Provider>
    );
  });
  RadioGroup.displayName = `${name}RadioGroup`;

  const RadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(function RadioItem(
    { tone = 'neutral', className, children, value, ...props },
    ref,
  ) {
    useMenuContext('RadioItem');
    const groupValue = useContext(RadioGroupValueContext);
    const indicator = useMemo<IndicatorContextValue>(() => ({ kind: 'radio', checked: groupValue === value }), [groupValue, value]);
    return (
      <IndicatorContext.Provider value={indicator}>
        <Radix.RadioItem ref={ref} className={cx(part('item'), className)} data-pp-tone={tone} value={value} {...props}>
          {children}
        </Radix.RadioItem>
      </IndicatorContext.Provider>
    );
  });
  RadioItem.displayName = `${name}RadioItem`;

  /** Present while its item is checked (Radix's Presence). Draws the library's mark unless given children. */
  const ItemIndicator = forwardRef<HTMLSpanElement, MenuItemIndicatorProps>(function ItemIndicator(
    { className, children, ...props },
    ref,
  ) {
    useMenuContext('ItemIndicator');
    const { kind, checked } = useContext(IndicatorContext);
    const mark = kind === 'radio' ? <Dot /> : checked === 'indeterminate' ? <Dash /> : <Check />;
    return (
      <Radix.ItemIndicator ref={ref} className={cx(part('indicator'), className)} {...props}>
        {children ?? mark}
      </Radix.ItemIndicator>
    );
  });
  ItemIndicator.displayName = `${name}ItemIndicator`;

  /**
   * `role="group"`, named by the `Label` inside it: the wiring is
   * unconditional and the gap is warned about, the Popover title's shape
   * (Popover §2, D-036).
   */
  const Group = forwardRef<HTMLDivElement, MenuGroupProps>(function Group(
    { className, 'aria-labelledby': ariaLabelledby, 'aria-label': ariaLabel, ...props },
    ref,
  ) {
    useMenuContext('Group');
    const labelId = useId();
    const wiresLabel = ariaLabel === undefined && ariaLabelledby === undefined;
    useEffect(() => {
      if (isProduction() || !wiresLabel) return;
      if (!document.getElementById(labelId)) {
        console.warn(
          `[pixel-perfect] <${name}Group> has no accessible name. Render a <${name}Label> inside it, or pass \`aria-label\` or \`aria-labelledby\`.`,
        );
      }
    }, [wiresLabel, labelId]);
    return (
      <GroupLabelContext.Provider value={labelId}>
        <Radix.Group
          ref={ref}
          className={cx(part('group'), className)}
          {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
          aria-labelledby={wiresLabel ? labelId : ariaLabelledby}
          {...props}
        />
      </GroupLabelContext.Provider>
    );
  });
  Group.displayName = `${name}Group`;

  const Label = forwardRef<HTMLDivElement, MenuLabelProps>(function Label({ className, id, ...props }, ref) {
    useMenuContext('Label');
    const labelId = useContext(GroupLabelContext);
    return <Radix.Label ref={ref} id={id ?? labelId ?? undefined} className={cx(part('label'), className)} {...props} />;
  });
  Label.displayName = `${name}Label`;

  const Separator = forwardRef<HTMLDivElement, MenuSeparatorProps>(function Separator({ className, ...props }, ref) {
    useMenuContext('Separator');
    return <Radix.Separator ref={ref} className={cx(part('separator'), className)} {...props} />;
  });
  Separator.displayName = `${name}Separator`;

  /** The hint a command carries, as muted text at the item's end. Hidden from assistive tech: the command's name is the item's text. */
  const Shortcut = forwardRef<HTMLSpanElement, MenuShortcutProps>(function Shortcut({ className, ...props }, ref) {
    useMenuContext('Shortcut');
    return <span ref={ref} className={cx(part('shortcut'), className)} aria-hidden="true" {...props} />;
  });
  Shortcut.displayName = `${name}Shortcut`;

  function Sub({ open, defaultOpen, onOpenChange, children }: MenuSubProps) {
    useMenuContext('Sub');
    return (
      <Radix.Sub
        {...(open !== undefined ? { open } : {})}
        {...(defaultOpen !== undefined ? { defaultOpen } : {})}
        {...(onOpenChange !== undefined ? { onOpenChange } : {})}
      >
        {children}
      </Radix.Sub>
    );
  }
  Sub.displayName = `${name}Sub`;

  const SubTrigger = forwardRef<HTMLDivElement, MenuSubTriggerProps>(function SubTrigger({ className, children, ...props }, ref) {
    useMenuContext('SubTrigger');
    return (
      <Radix.SubTrigger ref={ref} className={cx(part('item'), part('sub-trigger'), className)} data-pp-tone="neutral" {...props}>
        {children}
        <Chevron />
      </Radix.SubTrigger>
    );
  });
  SubTrigger.displayName = `${name}SubTrigger`;

  const SubPanel = forwardRef<HTMLDivElement, Omit<MenuSubContentProps, 'container'>>(function SubPanel(
    { sideOffset = '1', collisionPadding = '2', className, ...props },
    ref,
  ) {
    const { triggerRef } = useMenuContext('SubContent');
    const theme = useInheritedTheme(triggerRef);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, panelRef), [ref]);

    /*
     * Radix places a submenu on the side the root's `dir` says; the offsets
     * are ours. `alignOffset` is minus this panel's own top edge — border
     * and padding, read from the element so a consumer's
     * `--pp-dropdown-menu-padding` is honoured — so the first sub-item sits
     * on the row of the item that opened it (D-072 §5).
     */
    const [resolved, setResolved] = useState({ sideOffset: 0, collisionPadding: 0, alignOffset: 0 });
    useLayoutEffect(() => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      const view = panel?.ownerDocument.defaultView;
      const edge =
        panel && view
          ? parseFloat(view.getComputedStyle(panel).paddingBlockStart) + parseFloat(view.getComputedStyle(panel).borderBlockStartWidth)
          : 0;
      setResolved({
        sideOffset: resolveSpace(trigger, sideOffset),
        collisionPadding: resolveSpace(trigger, collisionPadding),
        alignOffset: Number.isFinite(edge) ? -edge : 0,
      });
    }, [triggerRef, sideOffset, collisionPadding]);

    return (
      <Radix.SubContent
        ref={setRef}
        className={cx('pp-dropdown-menu', block, part('sub'), className)}
        data-pp-theme={theme}
        sideOffset={resolved.sideOffset}
        alignOffset={resolved.alignOffset}
        collisionPadding={resolved.collisionPadding}
        {...props}
      />
    );
  });

  const SubContent = forwardRef<HTMLDivElement, MenuSubContentProps>(function SubContent({ container, ...props }, ref) {
    return (
      <Radix.Portal container={container ?? undefined}>
        <SubPanel ref={ref} {...props} />
      </Radix.Portal>
    );
  });
  SubContent.displayName = `${name}SubContent`;

  return { Item, CheckboxItem, RadioGroup, RadioItem, ItemIndicator, Group, Label, Separator, Shortcut, Sub, SubTrigger, SubContent };
}
