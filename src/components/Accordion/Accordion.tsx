'use client';

import * as RadixAccordion from '@radix-ui/react-accordion';
import { createContext, forwardRef, useContext, useMemo, useState, type ComponentPropsWithoutRef } from 'react';

import { cx } from '../../internal/cx';

/**
 * A vertical stack of sections, each with a heading that shows or hides
 * its content.
 *
 * In flow, like Tabs: nothing floats, nothing is portalled, and no
 * direction is written (D-074 §2). Behaviour is Radix's — the state, the
 * roving focus, the measured height for the motion — and every node,
 * class and pixel is ours.
 *
 * THE HEADING IS DRAWN BY THE TRIGGER (spec §1): a button outside a heading
 * is the one shape APG forbids, so the level is asked once, on the root,
 * and the trigger renders the heading around itself. `multiple` IS A
 * BOOLEAN (spec §2): RULES §5 reserves `type`.
 *
 * Sizing contract: fill. RSC: client. Spec: docs/specs/Accordion.md
 */

export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

interface AccordionContextValue {
  headingLevel: AccordionHeadingLevel;
  /** Whether the item with this value is open — a mirror of Radix's state, for the kept panels (spec §5). */
  isOpen: (value: string) => boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(part: string): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error(`[pixel-perfect] <Accordion${part}> must be rendered inside <Accordion>.`);
  }
  return context;
}

const ItemValueContext = createContext<string | null>(null);

// ---------------------------------------------------------------------------
// Root

interface AccordionBaseProps extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'dir'> {
  /** Every item. */
  disabled?: boolean;
  /** The level of every item's heading (spec §1). */
  headingLevel?: AccordionHeadingLevel;
}

export interface AccordionSingleProps extends AccordionBaseProps {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Whether the open item can be closed by its own trigger. `true`, unlike Radix (spec §2). */
  collapsible?: boolean;
}

export interface AccordionMultipleProps extends AccordionBaseProps {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(props, ref) {
  const { disabled = false, headingLevel = 3, className, children } = props;

  /* Radix owns the state; this is its shadow, for the kept panels. */
  const [uncontrolled, setUncontrolled] = useState<string | string[]>(() => props.defaultValue ?? (props.multiple ? [] : ''));
  const selected = props.value ?? uncontrolled;
  const context = useMemo<AccordionContextValue>(
    () => ({
      headingLevel,
      isOpen: (value) => (Array.isArray(selected) ? selected.includes(value) : selected === value),
    }),
    [headingLevel, selected],
  );

  const common = { ref, disabled, className: cx('pp-accordion', className) };

  if (props.multiple) {
    const { multiple: _multiple, value, defaultValue, onValueChange, disabled: _d, headingLevel: _h, className: _c, children: _ch, ...rest } = props;
    return (
      <AccordionContext.Provider value={context}>
        <RadixAccordion.Root
          type="multiple"
          {...common}
          {...(value !== undefined ? { value } : {})}
          {...(defaultValue !== undefined ? { defaultValue } : {})}
          onValueChange={(next) => {
            setUncontrolled(next);
            onValueChange?.(next);
          }}
          {...rest}
        >
          {children}
        </RadixAccordion.Root>
      </AccordionContext.Provider>
    );
  }

  const { multiple: _multiple, value, defaultValue, onValueChange, collapsible = true, disabled: _d, headingLevel: _h, className: _c, children: _ch, ...rest } = props;
  return (
    <AccordionContext.Provider value={context}>
      <RadixAccordion.Root
        type="single"
        collapsible={collapsible}
        {...common}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
        onValueChange={(next) => {
          setUncontrolled(next);
          onValueChange?.(next);
        }}
        {...rest}
      >
        {children}
      </RadixAccordion.Root>
    </AccordionContext.Provider>
  );
});

// ---------------------------------------------------------------------------
// Item

export interface AccordionItemProps extends ComponentPropsWithoutRef<'div'> {
  value: string;
  disabled?: boolean;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { value, className, ...props },
  ref,
) {
  useAccordionContext('Item');
  return (
    <ItemValueContext.Provider value={value}>
      <RadixAccordion.Item ref={ref} value={value} className={cx('pp-accordion__item', className)} {...props} />
    </ItemValueContext.Provider>
  );
});

// ---------------------------------------------------------------------------
// Trigger

export interface AccordionTriggerProps extends ComponentPropsWithoutRef<'button'> {}

function Chevron() {
  return (
    <svg
      className="pp-accordion__chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** The heading around the button, at the root's level; `ref`, `className` and `style` land on the button. */
export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(function AccordionTrigger(
  { className, children, ...props },
  ref,
) {
  const { headingLevel } = useAccordionContext('Trigger');
  const Heading = `h${headingLevel}` as 'h2';
  return (
    <RadixAccordion.Header asChild>
      <Heading className="pp-accordion__header">
        <RadixAccordion.Trigger ref={ref} className={cx('pp-accordion__trigger', className)} {...props}>
          {children}
          <Chevron />
        </RadixAccordion.Trigger>
      </Heading>
    </RadixAccordion.Header>
  );
});

// ---------------------------------------------------------------------------
// Content

export interface AccordionContentProps extends ComponentPropsWithoutRef<'div'> {
  /** Keeps the panel's children rendered while closed, hidden — for a form that must not lose what was typed (spec §5). */
  keepMounted?: boolean;
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(function AccordionContent(
  { keepMounted = false, className, children, ...props },
  ref,
) {
  const { isOpen } = useAccordionContext('Content');
  const value = useContext(ItemValueContext);
  if (value === null) {
    throw new Error('[pixel-perfect] <AccordionContent> must be rendered inside <AccordionItem>.');
  }
  /* Radix's `forceMount` keeps the children and drops `hidden`; the mirror
     puts `hidden` back while closed (D-074 §3, applied here). The padding
     is on the body, not the animated box (spec §4). */
  return (
    <RadixAccordion.Content
      ref={ref}
      className={cx('pp-accordion__content', className)}
      {...(keepMounted ? { forceMount: true, hidden: !isOpen(value) } : {})}
      {...props}
    >
      <div className="pp-accordion__body">{children}</div>
    </RadixAccordion.Content>
  );
});
