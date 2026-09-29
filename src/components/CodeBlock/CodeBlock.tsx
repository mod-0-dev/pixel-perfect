'use client';

import { Children, forwardRef, isValidElement, useEffect, useId, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/refs';
import { Badge } from '../Badge/Badge';
import { IconButton } from '../IconButton/IconButton';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';

/**
 * Block code: several lines in a frame, numbered if asked, one or two
 * lines pointed at, a button that copies it. Highlighting is the
 * consumer's — a peer, not a dependency — and this is the frame it goes in.
 *
 * `code` FOR TEXT, `CodeBlockLine` CHILDREN FOR HIGHLIGHTED OUTPUT (spec
 * §1): with `code` the component splits the lines; with children the
 * consumer renders one line per `CodeBlockLine`, holding whatever their
 * highlighter produced.
 *
 * THE <pre> IS A NAMED REGION THAT SCROLLS (spec §2, Table's reasoning): a
 * long line never pushes the page, and a keyboard user can reach it.
 *
 * Sizing contract: fill. RSC: client — the copy button's state.
 * Spec: docs/specs/CodeBlock.md
 */

declare const process: { env?: { NODE_ENV?: string } } | undefined;
const isProduction = () => typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

export interface CodeBlockLineProps extends ComponentPropsWithoutRef<'span'> {
  /** The line the prose points at. */
  highlighted?: boolean;
}

export const CodeBlockLine = forwardRef<HTMLSpanElement, CodeBlockLineProps>(function CodeBlockLine(
  { highlighted = false, className, ...props },
  ref,
) {
  return <span ref={ref} className={cx('pp-code-block__line', className)} data-highlighted={highlighted ? '' : undefined} {...props} />;
});

/** `title` is ours — a node, the block's name — and replaces the HTML attribute of the same name. */
export interface CodeBlockProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Plain text; split into lines. Or render `CodeBlockLine` children. */
  code?: string;
  title?: ReactNode;
  language?: string;
  lineNumbers?: boolean;
  /** 1-based, for the `code` form. */
  highlightLines?: number[];
  /** Long lines wrap instead of scrolling. */
  wrap?: boolean;
  /** The copy button. */
  copy?: boolean;
  /** The region's name when there is no title. */
  label?: string;
}

function CopyGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

const COPIED_FOR = 2000;

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { code, title, language, lineNumbers = false, highlightLines, wrap = false, copy = true, label = 'Code', className, children, ...props },
  ref,
) {
  const codeRef = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();

  const hasChildren = Children.toArray(children).some((child) => isValidElement(child) || (typeof child === 'string' && child.trim() !== ''));
  useEffect(() => {
    if (hasChildren && code !== undefined && !isProduction()) {
      console.warn('[pixel-perfect] <CodeBlock> was given both `code` and children; the children are rendered and `code` is ignored.');
    }
  }, [hasChildren, code]);

  /* The lines of the text form: a trailing newline is not a line. */
  const lines = useMemo(() => {
    if (hasChildren || code === undefined) return null;
    const parts = code.split('\n');
    if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();
    return parts;
  }, [hasChildren, code]);
  const pointed = useMemo(() => new Set(highlightLines ?? []), [highlightLines]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const canCopy = typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';
  const doCopy = async () => {
    const text = lines ? lines.join('\n') : (codeRef.current?.textContent ?? '');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_FOR);
  };

  const showCopy = copy && canCopy;
  const hasHeader = title !== undefined || language !== undefined || showCopy;
  const setCodeRef = useMemo(() => mergeRefs<HTMLElement>(codeRef), []);

  return (
    <div
      ref={ref}
      className={cx('pp-code-block', className)}
      data-wrap={wrap ? '' : undefined}
      data-line-numbers={lineNumbers ? '' : undefined}
      data-pp-tone="accent"
      {...props}
    >
      {hasHeader ? (
        <div className="pp-code-block__header">
          {title !== undefined ? (
            <span id={titleId} className="pp-code-block__title">
              {title}
            </span>
          ) : null}
          {language !== undefined ? (
            <Badge size="sm" className="pp-code-block__language">
              {language}
            </Badge>
          ) : null}
          {showCopy ? (
            <IconButton
              label={copied ? 'Copied' : 'Copy code'}
              variant="plain"
              size="sm"
              className="pp-code-block__copy"
              data-state={copied ? 'copied' : 'idle'}
              onClick={() => void doCopy()}
            >
              {copied ? <CheckGlyph /> : <CopyGlyph />}
            </IconButton>
          ) : null}
        </div>
      ) : null}
      <pre
        className="pp-code-block__pre"
        role="region"
        tabIndex={0}
        {...(title !== undefined ? { 'aria-labelledby': titleId } : { 'aria-label': label })}
      >
        <code ref={setCodeRef} className="pp-code-block__code">
          {lines
            ? lines.map((line, i) => (
                <CodeBlockLine key={i} highlighted={pointed.has(i + 1)}>
                  {line}
                </CodeBlockLine>
              ))
            : children}
        </code>
      </pre>
      {showCopy ? (
        <VisuallyHidden role="status" aria-live="polite">
          {copied ? 'Copied' : ''}
        </VisuallyHidden>
      ) : null}
    </div>
  );
});
