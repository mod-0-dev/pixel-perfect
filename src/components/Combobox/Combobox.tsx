'use client';

import * as RadixPopover from '@radix-ui/react-popover';
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
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { cx } from '../../internal/cx';
import { useActiveOption, type ListboxMove } from '../../internal/listbox';
import { Check } from '../../internal/menu/parts';
import { directionOf, resolveSide, type LogicalSide } from '../../internal/overlay/side';
import { resolveSpace } from '../../internal/overlay/space';
import { useInheritedTheme } from '../../internal/overlay/theme';
import { mergeRefs } from '../../internal/refs';
import { useControllableState } from '../../internal/useControllableState';
import type { Size, Space } from '../../types';
import { useField } from '../Field/Field';
import { Spinner } from '../Spinner/Spinner';

/**
 * A text input that offers a list of options as the user types, and takes
 * one — or several, with `multiple`.
 *
 * THE ONE TIER 4 COMPONENT WHOSE BEHAVIOUR IS THE LIBRARY'S OWN (spec §2):
 * Radix has no combobox. The list's portal and placement are Popover's
 * primitive (its `Anchor`, withheld by 4.2 for this), the list's look is
 * DropdownMenu's stylesheet, the control is Input's box; the keyboard
 * model, the highlight, the selection and the tokens are written here.
 *
 * THE CONSUMER RENDERS THE OPTIONS THAT MATCH (spec §2). The component does
 * not filter: it owns the text, the selection, the open state and the
 * highlight, and reports the text; whoever renders the options decides
 * which — which is what makes options from a server nothing special.
 *
 * FOCUS NEVER LEAVES THE INPUT (spec §4): the highlight is
 * `aria-activedescendant`, and the list refuses pointer focus.
 *
 * Sizing contract: fill (the control), hug with the overlay exception (the
 * list). RSC: client. Spec: docs/specs/Combobox.md
 */

export type ComboboxSide = LogicalSide;
type Move = ListboxMove;
/** Why the text changed: typed by the user, set by a selection, or following a value set from outside (spec §2). Filter on `input` only. */
export type ComboboxInputReason = 'input' | 'select' | 'value';

interface ComboboxContextValue {
  multiple: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
  setInputValue: (text: string, reason: ComboboxInputReason) => void;
  isSelected: (value: string) => boolean;
  select: (value: string, label: string) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  move: (to: Move) => void;
  takeActive: () => boolean;
  listMounted: () => void;
  listId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  listRef: RefObject<HTMLDivElement | null>;
  boxRef: RefObject<HTMLDivElement | null>;
  disabled: boolean;
  invalid: boolean;
  required: boolean;
  loading: boolean;
  removeLast: () => void;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useComboboxContext(part: string): ComboboxContextValue {
  const context = useContext(ComboboxContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <Combobox${part}> must be rendered inside <Combobox>.`);
  }
  return context;
}

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Root

interface ComboboxBaseProps extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'> {
  /** The text in the input. Controlled, or seeded. */
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (text: string, reason: ComboboxInputReason) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The label of a value the component has never seen chosen — one set from outside (spec §3). */
  getLabel?: (value: string) => string;
  /** A spinner in the end slot, and `aria-busy` on the list. */
  loading?: boolean;
  /** `Input`'s: prop, then the field, then the default. */
  size?: Size;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** A hidden input per selected value, so a plain form posts the selection (spec §8). */
  name?: string;
  /** The chevron's accessible name. */
  toggleLabel?: string;
  /** The spinner's accessible name while `loading`. */
  loadingLabel?: string;
  /** A token's remove button's accessible name, from its label. */
  removeLabel?: (label: string) => string;
}

export interface ComboboxSingleProps extends ComboboxBaseProps {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export interface ComboboxMultipleProps extends ComboboxBaseProps {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

function Chevron() {
  return (
    <svg className="pp-combobox__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export const Combobox = forwardRef<HTMLDivElement, ComboboxProps>(function Combobox(props, ref) {
  const {
    multiple = false,
    inputValue: inputValueProp,
    defaultInputValue,
    onInputValueChange,
    open: openProp,
    defaultOpen,
    onOpenChange,
    getLabel,
    loading = false,
    size: sizeProp,
    invalid: invalidProp,
    disabled: disabledProp,
    required: requiredProp,
    name,
    toggleLabel = 'Show options',
    loadingLabel = 'Loading options',
    removeLabel = (label: string) => `Remove ${label}`,
    className,
    children,
    onBlur,
    // The value trio is read below, by shape.
    value: _value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    ...rest
  } = props;

  const field = useField();
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;

  const uid = useId();
  const listId = `${uid}-list`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRootRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, rootRef), [ref]);

  /* The three states, each controllable (RULES §5.5). */
  const [value, setValue] = useControllableState<string | string[]>({
    value: props.value,
    defaultValue: props.defaultValue ?? (multiple ? [] : ''),
    onChange: (next) => (props.onValueChange as ((v: string | string[]) => void) | undefined)?.(next),
    component: 'Combobox',
    prop: 'value',
  });
  const [inputValue, setInputValueState] = useControllableState<string>({
    value: inputValueProp,
    defaultValue: defaultInputValue ?? '',
    component: 'Combobox',
    prop: 'inputValue',
  });
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;
  /* The text, with WHY it changed: a consumer filters on `input` and shows
     everything after a selection, or a reopened list shows one match. */
  const setInputValue = useCallback(
    (text: string, reason: ComboboxInputReason) => {
      if (text === inputValueRef.current) return;
      setInputValueState(text);
      onInputValueChange?.(text, reason);
    },
    [setInputValueState, onInputValueChange],
  );
  const [open, setOpenState] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
    component: 'Combobox',
    prop: 'open',
  });
  /* The highlight, moved over the DOM's options (D-076 §6, shared with
     CommandPalette). */
  const { activeId, setActiveId, move, active, listMounted } = useActiveOption(listRef);
  const setOpen = useCallback(
    (next: boolean) => {
      if (disabled && next) return;
      setOpenState(next);
      if (!next) setActiveId(null);
    },
    [disabled, setOpenState],
  );

  /* Labels the user has chosen, by value; `getLabel` for the rest (spec §3). */
  const labels = useRef(new Map<string, string>());
  const labelFor = useCallback((v: string) => labels.current.get(v) ?? getLabel?.(v) ?? v, [getLabel]);

  const selectedValues = useMemo(() => (Array.isArray(value) ? value : value ? [value] : []), [value]);
  const isSelected = useCallback((v: string) => selectedValues.includes(v), [selectedValues]);

  /* A single combobox shows its value's label; when the value arrives from
     outside, the text follows it. */
  const committed = useRef<string | null>(null);
  useEffect(() => {
    if (multiple || Array.isArray(value)) return;
    if (committed.current === value) return;
    committed.current = value;
    setInputValue(value ? labelFor(value) : '', 'value');
  }, [multiple, value, labelFor, setInputValue]);

  const select = useCallback(
    (v: string, label: string) => {
      labels.current.set(v, label);
      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        setValue(current.includes(v) ? current.filter((x) => x !== v) : [...current, v]);
        setInputValue('', 'select');
        setActiveId(null);
      } else {
        committed.current = v;
        setValue(v);
        setInputValue(label, 'select');
        setOpen(false);
      }
    },
    [multiple, value, setValue, setInputValue, setOpen],
  );

  const remove = useCallback(
    (v: string) => {
      if (!Array.isArray(value)) return;
      setValue(value.filter((x) => x !== v));
    },
    [value, setValue],
  );
  const removeLast = useCallback(() => {
    if (Array.isArray(value) && value.length) setValue(value.slice(0, -1));
  }, [value, setValue]);

  const takeActive = useCallback((): boolean => {
    const node = active();
    if (!node) return false;
    const v = node.dataset.value ?? '';
    select(v, node.dataset.label ?? node.textContent?.trim() ?? v);
    return true;
  }, [active, select]);

  /* Focus leaving the control and its list closes the list; the text stays. */
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    const next = event.relatedTarget as Node | null;
    if (next && (rootRef.current?.contains(next) || listRef.current?.contains(next))) return;
    setOpen(false);
  };

  const context = useMemo<ComboboxContextValue>(
    () => ({
      multiple,
      open,
      setOpen,
      inputValue,
      setInputValue,
      isSelected,
      select,
      activeId,
      setActiveId,
      move,
      takeActive,
      listMounted,
      listId,
      inputRef,
      listRef,
      boxRef,
      disabled,
      invalid,
      required,
      loading,
      removeLast,
    }),
    [multiple, open, setOpen, inputValue, setInputValue, isSelected, select, activeId, move, takeActive, listMounted, listId, disabled, invalid, required, loading, removeLast],
  );

  return (
    <ComboboxContext.Provider value={context}>
      <RadixPopover.Root open={open} onOpenChange={setOpen} modal={false}>
        {/* Input's root: its size, tone and state resolve here, on the same
            attributes (D-070 §1's contract, spec §5). */}
        <div
          ref={setRootRef}
          className={cx('pp-input', 'pp-combobox', className)}
          data-size={size}
          data-state={open ? 'open' : 'closed'}
          data-invalid={invalid || undefined}
          data-disabled={disabled || undefined}
          data-pp-tone={invalid ? 'danger' : undefined}
          onBlur={handleBlur}
          {...rest}
        >
          <RadixPopover.Anchor asChild>
            <div ref={boxRef} className="pp-combobox__box">
              <div className="pp-combobox__field">
                {multiple &&
                  selectedValues.map((v) => {
                    const label = labelFor(v);
                    return (
                      <span key={v} className="pp-combobox__token" data-value={v}>
                        {label}
                        <button
                          type="button"
                          className="pp-combobox__remove"
                          aria-label={removeLabel(label)}
                          disabled={disabled}
                          onClick={() => {
                            remove(v);
                            inputRef.current?.focus();
                          }}
                        >
                          <Cross />
                        </button>
                      </span>
                    );
                  })}
                {children}
              </div>
              <button
                type="button"
                className="pp-combobox__toggle"
                tabIndex={-1}
                aria-label={toggleLabel}
                disabled={disabled}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  inputRef.current?.focus();
                  setOpen(!open);
                }}
              >
                {loading ? <Spinner size="sm" label={loadingLabel} /> : <Chevron />}
              </button>
              {name !== undefined && selectedValues.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
            </div>
          </RadixPopover.Anchor>
        </div>
      </RadixPopover.Root>
    </ComboboxContext.Provider>
  );
});

// ---------------------------------------------------------------------------
// Input

export interface ComboboxInputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size' | 'value' | 'defaultValue' | 'onChange'> {}

export const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(function ComboboxInput(
  { className, onKeyDown, ...props },
  ref,
) {
  const ctx = useComboboxContext('Input');
  const field = useField();
  const setRef = useMemo(() => mergeRefs<HTMLInputElement>(ref, ctx.inputRef), [ref, ctx.inputRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const to: Move = event.key === 'ArrowDown' ? 'next' : 'prev';
        if (!ctx.open) {
          ctx.setOpen(true);
          ctx.move(event.key === 'ArrowDown' ? 'first' : 'last');
        } else {
          ctx.move(to);
        }
        break;
      }
      case 'Enter':
        if (ctx.open && ctx.takeActive()) event.preventDefault();
        break;
      case 'Escape':
        if (ctx.open) {
          event.preventDefault();
          ctx.setOpen(false);
        }
        break;
      case 'Tab':
        if (ctx.open) ctx.setOpen(false);
        break;
      case 'Backspace':
        if (ctx.multiple && ctx.inputValue === '') ctx.removeLast();
        break;
      default:
    }
  };

  return (
    <input
      ref={setRef}
      className={cx('pp-combobox__control', className)}
      type="text"
      role="combobox"
      aria-expanded={ctx.open}
      {...(ctx.open ? { 'aria-controls': ctx.listId } : {})}
      aria-autocomplete="list"
      {...(ctx.open && ctx.activeId ? { 'aria-activedescendant': ctx.activeId } : {})}
      autoComplete="off"
      id={field?.control.id}
      aria-describedby={field?.control['aria-describedby']}
      aria-invalid={ctx.invalid || undefined}
      required={ctx.required || undefined}
      disabled={ctx.disabled || undefined}
      value={ctx.inputValue}
      onChange={(event) => {
        ctx.setInputValue(event.target.value, 'input');
        ctx.setActiveId(null);
        if (!ctx.open) ctx.setOpen(true);
      }}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// List

export interface ComboboxListProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RadixPopover.Content>,
    'side' | 'sideOffset' | 'align' | 'alignOffset' | 'collisionPadding' | 'asChild' | 'forceMount' | 'role'
  > {
  /** Logical: `start` and `end` follow the layout's direction. */
  side?: ComboboxSide;
  sideOffset?: Space;
  collisionPadding?: Space;
  container?: Element | null;
}

export const ComboboxList = forwardRef<HTMLDivElement, ComboboxListProps>(function ComboboxList({ container, ...props }, ref) {
  return (
    <RadixPopover.Portal container={container ?? undefined}>
      <ListPanel ref={ref} {...props} />
    </RadixPopover.Portal>
  );
});

const ListPanel = forwardRef<HTMLDivElement, Omit<ComboboxListProps, 'container'>>(function ListPanel(
  { side = 'bottom', sideOffset = '1', collisionPadding = '2', className, children, ...props },
  ref,
) {
  const ctx = useComboboxContext('List');
  const theme = useInheritedTheme(ctx.boxRef);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, ctx.listRef), [ref, ctx.listRef]);

  const [resolved, setResolved] = useState(() => ({ side: resolveSide(side, 'ltr'), sideOffset: 0, collisionPadding: 0 }));
  /* The list is NAMED AS ITS INPUT IS (spec §6): by the input's `aria-label`,
     or by the <label> it has — a Field's — read when the list mounts. */
  const [naming, setNaming] = useState<{ 'aria-label'?: string; 'aria-labelledby'?: string }>({});
  useLayoutEffect(() => {
    const box = ctx.boxRef.current;
    setResolved({
      side: resolveSide(side, directionOf(box)),
      sideOffset: resolveSpace(box, sideOffset),
      collisionPadding: resolveSpace(box, collisionPadding),
    });
    const input = ctx.inputRef.current;
    const ariaLabel = input?.getAttribute('aria-label');
    const labelledby = input?.getAttribute('aria-labelledby');
    const labelId = input?.labels?.[0]?.id;
    if (ariaLabel) setNaming({ 'aria-label': ariaLabel });
    else if (labelledby) setNaming({ 'aria-labelledby': labelledby });
    else if (labelId) setNaming({ 'aria-labelledby': labelId });
    else {
      setNaming({});
      if (!isProduction()) {
        console.warn('[pixel-perfect] <ComboboxList> has no accessible name: label the <ComboboxInput> (a Field, a <label>, or `aria-label`).');
      }
    }
    ctx.listMounted();
    // Per mount: the list mounts on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * THE LISTBOX IS INSIDE THE PANEL, AND THE EMPTY ROW IS BESIDE IT (D-076
   * §4): a `listbox` may hold only options and groups, and a "nothing
   * matches" row inside one fails axe's required-children rule. So the
   * panel — Radix's content, the box DropdownMenu.css draws — is a
   * presentation wrapper; the options go in a listbox of their own, and
   * any `ComboboxEmpty` among the children is rendered after it.
   */
  const [options, empties] = partition(children);

  return (
    <RadixPopover.Content
      ref={setRef}
      role="presentation"
      tabIndex={undefined}
      className={cx('pp-dropdown-menu', 'pp-combobox__list', className)}
      data-pp-theme={theme}
      side={resolved.side}
      align="start"
      sideOffset={resolved.sideOffset}
      collisionPadding={resolved.collisionPadding}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onCloseAutoFocus={(event) => event.preventDefault()}
      onFocusOutside={(event) => event.preventDefault()}
      onInteractOutside={(event) => {
        if (ctx.boxRef.current?.contains(event.target as Node)) event.preventDefault();
      }}
      /* A press in the list must not blur the input (spec §4). */
      onPointerDown={(event) => event.preventDefault()}
      {...props}
    >
      <div
        role="listbox"
        id={ctx.listId}
        {...naming}
        aria-multiselectable={ctx.multiple || undefined}
        aria-busy={ctx.loading || undefined}
        className="pp-combobox__listbox"
      >
        {options}
      </div>
      {empties}
    </RadixPopover.Content>
  );
});

/** The `ComboboxEmpty` elements among a list's children, apart from the rest. */
function partition(children: ReactNode): [ReactNode[], ReactNode[]] {
  const options: ReactNode[] = [];
  const empties: ReactNode[] = [];
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && child.type === ComboboxEmpty) empties.push(child);
    else options.push(child);
  });
  return [options, empties];
}

// ---------------------------------------------------------------------------
// Option, Group, Label, Empty

export interface ComboboxOptionProps extends ComponentPropsWithoutRef<'div'> {
  value: string;
  disabled?: boolean;
  /** The label, when the children are not text. */
  textValue?: string;
}

export const ComboboxOption = forwardRef<HTMLDivElement, ComboboxOptionProps>(function ComboboxOption(
  { value, disabled = false, textValue, className, children, onClick, onPointerMove, ...props },
  ref,
) {
  const ctx = useComboboxContext('Option');
  const id = useId();
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, nodeRef), [ref]);
  const selected = ctx.isSelected(value);
  const highlighted = ctx.activeId === id;

  /* The highlighted option stays in view as the arrows move (spec §6). */
  useEffect(() => {
    if (highlighted) nodeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const label = () => textValue ?? nodeRef.current?.textContent?.trim() ?? value;

  return (
    <div
      ref={setRef}
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-state={selected ? 'checked' : 'unchecked'}
      data-highlighted={highlighted ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-value={value}
      {...(textValue !== undefined ? { 'data-label': textValue } : {})}
      data-pp-tone="neutral"
      className={cx('pp-dropdown-menu__item', 'pp-combobox__option', className)}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!disabled && !highlighted) ctx.setActiveId(id);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!disabled) ctx.select(value, label());
      }}
      {...props}
    >
      {selected && (
        <span className="pp-dropdown-menu__indicator pp-combobox__indicator" aria-hidden="true">
          <Check />
        </span>
      )}
      {children}
    </div>
  );
});

const GroupLabelContext = createContext<string | null>(null);

export interface ComboboxGroupProps extends ComponentPropsWithoutRef<'div'> {}

export const ComboboxGroup = forwardRef<HTMLDivElement, ComboboxGroupProps>(function ComboboxGroup(
  { className, 'aria-labelledby': ariaLabelledby, 'aria-label': ariaLabel, ...props },
  ref,
) {
  useComboboxContext('Group');
  const labelId = useId();
  const wiresLabel = ariaLabel === undefined && ariaLabelledby === undefined;
  return (
    <GroupLabelContext.Provider value={labelId}>
      <div
        ref={ref}
        role="group"
        className={cx('pp-dropdown-menu__group', 'pp-combobox__group', className)}
        {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
        aria-labelledby={wiresLabel ? labelId : ariaLabelledby}
        {...props}
      />
    </GroupLabelContext.Provider>
  );
});

export interface ComboboxLabelProps extends ComponentPropsWithoutRef<'div'> {}

export const ComboboxLabel = forwardRef<HTMLDivElement, ComboboxLabelProps>(function ComboboxLabel({ className, id, ...props }, ref) {
  useComboboxContext('Label');
  const labelId = useContext(GroupLabelContext);
  return <div ref={ref} id={id ?? labelId ?? undefined} className={cx('pp-dropdown-menu__label', 'pp-combobox__label', className)} {...props} />;
});

export interface ComboboxEmptyProps extends ComponentPropsWithoutRef<'div'> {}

/** The consumer's "nothing matches" (or "searching…") row. */
export const ComboboxEmpty = forwardRef<HTMLDivElement, ComboboxEmptyProps>(function ComboboxEmpty({ className, ...props }, ref) {
  useComboboxContext('Empty');
  return <div ref={ref} role="presentation" className={cx('pp-combobox__empty', className)} {...props} />;
});

