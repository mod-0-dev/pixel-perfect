'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';

import { cx } from '../../internal/cx';
import { useActiveOption } from '../../internal/listbox';
import { useFocusRestore } from '../../internal/overlay/focus';
import { useInheritedTheme } from '../../internal/overlay/theme';
import { mergeRefs } from '../../internal/refs';
import { useControllableState } from '../../internal/useControllableState';
import { Kbd } from '../Kbd/Kbd';

/**
 * Every command in an app, one keystroke away: a search field over a list
 * of commands, in a modal.
 *
 * MADE OF THE TIER (spec §2–§4): Dialog's modal and scrim through the
 * two-class contract (`pp-dialog pp-command-palette`), Combobox's highlight
 * through the shared listbox hook, DropdownMenu's row through its class and
 * private variables, Kbd's key caps for the shortcuts. No package added.
 *
 * THE CONSUMER RENDERS THE MATCHES (spec §1), as Combobox's does; the
 * component owns the text, the open state and the highlight, and the first
 * match is highlighted as the user types (spec §3).
 *
 * Sizing contract: fill, in a panel whose inline size is a token. RSC:
 * client. Spec: docs/specs/CommandPalette.md
 */

export interface CommandPaletteSelectEvent {
  value: string;
  defaultPrevented: boolean;
  preventDefault: () => void;
}

interface CommandPaletteContextValue {
  triggerRef: RefObject<HTMLElement | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
  setInputValue: (text: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  listRef: RefObject<HTMLDivElement | null>;
  listId: string;
  label: string;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  move: (to: 'next' | 'prev' | 'first' | 'last') => void;
  active: () => HTMLElement | null;
  listMounted: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

function useCommandPaletteContext(part: string): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <CommandPalette${part}> must be rendered inside <CommandPalette>.`);
  }
  return context;
}

// ---------------------------------------------------------------------------
// Root

export interface CommandPaletteProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (text: string) => void;
  /** `mod+k`: a document-level shortcut that toggles the palette; `mod` is ⌘ on Apple platforms and Ctrl elsewhere (spec §5). Off by default. */
  hotkey?: string;
  /** The dialog's and the listbox's accessible name. */
  label?: string;
  children?: ReactNode;
}

const MODIFIERS = new Set(['mod', 'ctrl', 'meta', 'alt', 'shift']);

/** Whether a keydown is the hotkey, `mod` resolved on the platform at the time. */
function matchesHotkey(event: globalThis.KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey.toLowerCase().split('+');
  const key = parts[parts.length - 1] ?? '';
  const wanted = new Set(parts.slice(0, -1).filter((p) => MODIFIERS.has(p)));
  const apple = /mac|iphone|ipad|ipod/i.test(navigator.platform ?? '');
  if (wanted.has('mod')) {
    wanted.delete('mod');
    wanted.add(apple ? 'meta' : 'ctrl');
  }
  const pressed = { ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey, shift: event.shiftKey };
  return (
    event.key.toLowerCase() === key &&
    (Object.keys(pressed) as Array<keyof typeof pressed>).every((m) => pressed[m] === wanted.has(m))
  );
}

export function CommandPalette({
  open: openProp,
  defaultOpen,
  onOpenChange,
  inputValue: inputValueProp,
  defaultInputValue,
  onInputValueChange,
  hotkey,
  label = 'Command palette',
  children,
}: CommandPaletteProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const listId = `${useId()}-list`;

  const [open, setOpenState] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
    component: 'CommandPalette',
    prop: 'open',
  });
  const [inputValue, setInputValue] = useControllableState<string>({
    value: inputValueProp,
    defaultValue: defaultInputValue ?? '',
    onChange: onInputValueChange,
    component: 'CommandPalette',
    prop: 'inputValue',
  });
  const { activeId, setActiveId, move, active, listMounted } = useActiveOption(listRef);

  /* Closing clears the text, so the next open starts fresh. */
  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      if (!next) {
        setInputValue('');
        setActiveId(null);
      }
    },
    [setOpenState, setInputValue, setActiveId],
  );

  /* The hotkey, on the document, resolved on the platform when pressed. */
  useEffect(() => {
    if (!hotkey) return;
    const handle = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || !matchesHotkey(event, hotkey)) return;
      event.preventDefault();
      setOpen(!open);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [hotkey, open, setOpen]);

  const context = useMemo<CommandPaletteContextValue>(
    () => ({ triggerRef, open, setOpen, inputValue, setInputValue, inputRef, listRef, listId, label, activeId, setActiveId, move, active, listMounted }),
    [open, setOpen, inputValue, setInputValue, listId, label, activeId, setActiveId, move, active, listMounted],
  );

  return (
    <CommandPaletteContext.Provider value={context}>
      <RadixDialog.Root open={open} onOpenChange={setOpen}>
        {children}
      </RadixDialog.Root>
    </CommandPaletteContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger

export interface CommandPaletteTriggerProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

export const CommandPaletteTrigger = forwardRef<HTMLButtonElement, CommandPaletteTriggerProps>(function CommandPaletteTrigger(
  { asChild = false, className, ...props },
  ref,
) {
  const { triggerRef } = useCommandPaletteContext('Trigger');
  const setRef = useMemo(() => mergeRefs<HTMLButtonElement>(ref, triggerRef as Ref<HTMLButtonElement>), [ref, triggerRef]);
  return <RadixDialog.Trigger ref={setRef} asChild={asChild} className={cx(!asChild && 'pp-command-palette__trigger', className)} {...props} />;
});

// ---------------------------------------------------------------------------
// Content: the panel, Dialog's by the two-class contract

export interface CommandPaletteContentProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixDialog.Content>, 'asChild' | 'forceMount' | 'onFocusOutside' | 'aria-label' | 'aria-labelledby'> {
  container?: Element | null;
}

export const CommandPaletteContent = forwardRef<HTMLDivElement, CommandPaletteContentProps>(function CommandPaletteContent(
  { container, ...props },
  ref,
) {
  const { triggerRef } = useCommandPaletteContext('Content');
  const theme = useInheritedTheme(triggerRef);
  return (
    <RadixDialog.Portal container={container ?? undefined}>
      <RadixDialog.Overlay className="pp-dialog__scrim pp-command-palette__scrim" data-pp-theme={theme}>
        <Panel ref={ref} {...props} />
      </RadixDialog.Overlay>
    </RadixDialog.Portal>
  );
});

const Panel = forwardRef<HTMLDivElement, Omit<CommandPaletteContentProps, 'container'>>(function Panel(
  { className, onOpenAutoFocus, onCloseAutoFocus, ...props },
  ref,
) {
  const { triggerRef, label } = useCommandPaletteContext('Content');
  /* Focus returns to whatever had it — the trigger when the trigger was
     used, and the field the user was in when the hotkey was (D-078 §3). */
  const { handleOpenAutoFocus, handleCloseAutoFocus } = useFocusRestore(triggerRef, onOpenAutoFocus, onCloseAutoFocus, true);
  return (
    <RadixDialog.Content
      ref={ref}
      className={cx('pp-dialog', 'pp-command-palette', className)}
      aria-modal="true"
      aria-label={label}
      onOpenAutoFocus={handleOpenAutoFocus}
      onCloseAutoFocus={handleCloseAutoFocus}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Input

export interface CommandPaletteInputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'defaultValue' | 'onChange'> {}

function Glyph() {
  return (
    <svg className="pp-command-palette__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export const CommandPaletteInput = forwardRef<HTMLInputElement, CommandPaletteInputProps>(function CommandPaletteInput(
  { className, onKeyDown, ...props },
  ref,
) {
  const ctx = useCommandPaletteContext('Input');
  const setRef = useMemo(() => mergeRefs<HTMLInputElement>(ref, ctx.inputRef), [ref, ctx.inputRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      ctx.move(event.key === 'ArrowDown' ? 'next' : 'prev');
    } else if (event.key === 'Enter') {
      const node = ctx.active();
      if (node) {
        event.preventDefault();
        node.click();
      }
    }
  };

  return (
    <div className="pp-command-palette__field">
      <Glyph />
      <input
        ref={setRef}
        className={cx('pp-command-palette__input', className)}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={ctx.listId}
        aria-autocomplete="list"
        {...(ctx.activeId ? { 'aria-activedescendant': ctx.activeId } : {})}
        autoComplete="off"
        spellCheck={false}
        value={ctx.inputValue}
        onChange={(event) => ctx.setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
});

// ---------------------------------------------------------------------------
// List

export interface CommandPaletteListProps extends ComponentPropsWithoutRef<'div'> {}

export const CommandPaletteList = forwardRef<HTMLDivElement, CommandPaletteListProps>(function CommandPaletteList(
  { className, children, ...props },
  ref,
) {
  const ctx = useCommandPaletteContext('List');
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, ctx.listRef), [ref, ctx.listRef]);
  const [options, empties] = partition(children);

  /* The first match is highlighted as the user types, and on open (spec §3). */
  const { move, listMounted, inputValue } = ctx;
  useLayoutEffect(() => {
    listMounted();
    move('first');
    // On mount and on every change of the text; `move` reads the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  return (
    <div ref={setRef} className={cx('pp-command-palette__list', className)} {...props}>
      <div role="listbox" id={ctx.listId} aria-label={ctx.label} className="pp-command-palette__listbox">
        {options}
      </div>
      {empties}
    </div>
  );
});

function partition(children: ReactNode): [ReactNode[], ReactNode[]] {
  const options: ReactNode[] = [];
  const empties: ReactNode[] = [];
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && child.type === CommandPaletteEmpty) empties.push(child);
    else options.push(child);
  });
  return [options, empties];
}

// ---------------------------------------------------------------------------
// Item

export interface CommandPaletteItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onSelect'> {
  /** Reported on select; the item's text otherwise. */
  value?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** Runs the command. The palette closes after it unless `event.preventDefault()` is called (spec §6). */
  onSelect?: (event: CommandPaletteSelectEvent) => void;
}

export const CommandPaletteItem = forwardRef<HTMLDivElement, CommandPaletteItemProps>(function CommandPaletteItem(
  { value, icon, disabled = false, onSelect, className, children, onClick, onPointerMove, ...props },
  ref,
) {
  const ctx = useCommandPaletteContext('Item');
  const id = useId();
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, nodeRef), [ref]);
  const highlighted = ctx.activeId === id;

  useEffect(() => {
    if (highlighted) nodeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  return (
    <div
      ref={setRef}
      id={id}
      role="option"
      aria-selected={highlighted}
      aria-disabled={disabled || undefined}
      data-highlighted={highlighted ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-value={value}
      data-pp-tone="neutral"
      className={cx('pp-dropdown-menu__item', 'pp-command-palette__item', className)}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!disabled && !highlighted) ctx.setActiveId(id);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (disabled) return;
        const select: CommandPaletteSelectEvent = {
          value: value ?? nodeRef.current?.textContent?.trim() ?? '',
          defaultPrevented: false,
          preventDefault() {
            select.defaultPrevented = true;
          },
        };
        onSelect?.(select);
        if (!select.defaultPrevented) ctx.setOpen(false);
      }}
      {...props}
    >
      {icon !== undefined && icon !== null && (
        <span className="pp-command-palette__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Shortcut, Group, Label, Empty

export interface CommandPaletteShortcutProps extends ComponentPropsWithoutRef<'span'> {
  keys: string[];
}

/** The keys, as Kbds, at the row's end; hidden from assistive tech — the command's name is the label. */
export const CommandPaletteShortcut = forwardRef<HTMLSpanElement, CommandPaletteShortcutProps>(function CommandPaletteShortcut(
  { keys, className, ...props },
  ref,
) {
  useCommandPaletteContext('Shortcut');
  return (
    <span ref={ref} className={cx('pp-dropdown-menu__shortcut', 'pp-command-palette__shortcut', className)} aria-hidden="true" {...props}>
      {keys.map((key, index) => (
        <Kbd key={`${key}-${index}`} size="sm">
          {key}
        </Kbd>
      ))}
    </span>
  );
});

const GroupLabelContext = createContext<string | null>(null);

export interface CommandPaletteGroupProps extends ComponentPropsWithoutRef<'div'> {}

export const CommandPaletteGroup = forwardRef<HTMLDivElement, CommandPaletteGroupProps>(function CommandPaletteGroup(
  { className, 'aria-labelledby': ariaLabelledby, 'aria-label': ariaLabel, ...props },
  ref,
) {
  useCommandPaletteContext('Group');
  const labelId = useId();
  const wiresLabel = ariaLabel === undefined && ariaLabelledby === undefined;
  return (
    <GroupLabelContext.Provider value={labelId}>
      <div
        ref={ref}
        role="group"
        className={cx('pp-dropdown-menu__group', 'pp-command-palette__group', className)}
        {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
        aria-labelledby={wiresLabel ? labelId : ariaLabelledby}
        {...props}
      />
    </GroupLabelContext.Provider>
  );
});

export interface CommandPaletteLabelProps extends ComponentPropsWithoutRef<'div'> {}

export const CommandPaletteLabel = forwardRef<HTMLDivElement, CommandPaletteLabelProps>(function CommandPaletteLabel(
  { className, id, ...props },
  ref,
) {
  useCommandPaletteContext('Label');
  const labelId = useContext(GroupLabelContext);
  return <div ref={ref} id={id ?? labelId ?? undefined} className={cx('pp-dropdown-menu__label', 'pp-command-palette__label', className)} {...props} />;
});

export interface CommandPaletteEmptyProps extends ComponentPropsWithoutRef<'div'> {}

export const CommandPaletteEmpty = forwardRef<HTMLDivElement, CommandPaletteEmptyProps>(function CommandPaletteEmpty(
  { className, ...props },
  ref,
) {
  useCommandPaletteContext('Empty');
  return <div ref={ref} role="presentation" className={cx('pp-command-palette__empty', className)} {...props} />;
});
