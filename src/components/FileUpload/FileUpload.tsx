'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { cx } from '../../internal/cx';
import type { Size } from '../../types';
import { Button, type ButtonProps } from '../Button/Button';
import { useField } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { Progress } from '../Progress/Progress';

/**
 * Files, chosen or dropped: the one input `Input` excludes, drawn with our
 * tokens. It selects and shows; uploading is the consumer's.
 *
 * THE HIDDEN INPUT IS THE MECHANISM, THE TRIGGER IS THE KEYBOARD PATH (spec
 * §1): only a native file input opens the dialog and submits with a form,
 * so it is here, visually hidden and out of the tab order; the Button
 * inside the dropzone is the one tab stop and the labelled control.
 *
 * REFUSED BY TYPE, SIZE AND COUNT, WITH REASONS (spec §2): the dialog
 * honours `accept`, a drop does not, and neither honours a size, so every
 * path goes through the same check and `onSelect` hears both lists.
 *
 * Sizing contract: fill. RSC: client. Spec: docs/specs/FileUpload.md
 */

export type FileRejectionReason = 'type' | 'size' | 'count';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export type FileUploadStatus = 'idle' | 'uploading' | 'complete' | 'error';

interface FileUploadContextValue {
  inputRef: RefObject<HTMLInputElement | null>;
  open: () => void;
  select: (files: FileList | File[]) => void;
  disabled: boolean;
  invalid: boolean;
  size: Size;
  triggerProps: { id?: string | undefined; 'aria-describedby'?: string | undefined; 'aria-invalid'?: true | undefined };
}

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

function useFileUpload(part: string): FileUploadContextValue {
  const context = useContext(FileUploadContext);
  if (!context) throw new Error(`[pixel-perfect] <FileUpload${part}> must be rendered inside <FileUpload>.`);
  return context;
}

/** The input's `accept` grammar: MIME types, with a `*` subtype, and extensions. */
export function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const rules = accept
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

// ---------------------------------------------------------------------------
// Root

export interface FileUploadProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onSelect'> {
  accept?: string;
  multiple?: boolean;
  /** In bytes. */
  maxSize?: number;
  /** With `multiple`. A single input takes one. */
  maxFiles?: number;
  disabled?: boolean;
  invalid?: boolean;
  size?: Size;
  /** The input's, for a form. */
  name?: string;
  onSelect?: (accepted: File[], rejected: FileRejection[]) => void;
}

export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
  {
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    disabled: disabledProp,
    invalid: invalidProp,
    size: sizeProp,
    name,
    onSelect,
    className,
    children,
    ...props
  },
  ref,
) {
  const field = useField();
  const size = sizeProp ?? field?.size ?? 'md';
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const select = useCallback(
    (list: FileList | File[]) => {
      if (disabled) return;
      const files = Array.from(list);
      const accepted: File[] = [];
      const rejected: FileRejection[] = [];
      const limit = multiple ? maxFiles : 1;
      for (const file of files) {
        if (!matchesAccept(file, accept)) rejected.push({ file, reason: 'type' });
        else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: 'size' });
        else if (limit !== undefined && accepted.length >= limit) rejected.push({ file, reason: 'count' });
        else accepted.push(file);
      }
      onSelect?.(accepted, rejected);
    },
    [disabled, multiple, maxFiles, accept, maxSize, onSelect],
  );

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) select(event.target.files);
    /* Cleared, so choosing the same file again reports again (spec §2). */
    event.target.value = '';
  };

  /* IN A FIELD (spec §3): a `group` field names the root, and the Trigger
     keeps its own name ("Choose files"); a plain field's label points at
     the Trigger, which then takes the label as its name — a <label for>
     outranks a button's content — so a file field should be a group
     (D-087 §3). */
  const grouped = field?.control['aria-labelledby'] !== undefined;
  const context = useMemo<FileUploadContextValue>(
    () => ({
      inputRef,
      open: () => {
        if (!disabled) inputRef.current?.click();
      },
      select,
      disabled,
      invalid,
      size,
      triggerProps: grouped
        ? { 'aria-invalid': invalid || undefined }
        : {
            id: field?.control.id,
            'aria-describedby': field?.control['aria-describedby'],
            'aria-invalid': invalid || undefined,
          },
    }),
    [select, disabled, size, field, invalid, grouped],
  );

  return (
    <FileUploadContext.Provider value={context}>
      <div
        ref={ref}
        className={cx('pp-file-upload', className)}
        data-size={size}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        {...(grouped
          ? { role: 'group', 'aria-labelledby': field?.control['aria-labelledby'], 'aria-describedby': field?.control['aria-describedby'] }
          : {})}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          className="pp-file-upload__input"
          tabIndex={-1}
          aria-hidden="true"
          {...(accept !== undefined ? { accept } : {})}
          {...(name !== undefined ? { name } : {})}
          multiple={multiple}
          disabled={disabled}
          onChange={onChange}
        />
        {children}
      </div>
    </FileUploadContext.Provider>
  );
});

// ---------------------------------------------------------------------------
// Trigger

export interface FileUploadTriggerProps extends Omit<ButtonProps, 'asChild' | 'type'> {}

export const FileUploadTrigger = forwardRef<HTMLButtonElement, FileUploadTriggerProps>(function FileUploadTrigger(
  { variant = 'outline', className, onClick, ...props },
  ref,
) {
  const { open, disabled, size, triggerProps } = useFileUpload('Trigger');
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cx('pp-file-upload__trigger', className)}
      disabled={disabled}
      {...triggerProps}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) open();
      }}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Dropzone

export interface FileUploadDropzoneProps extends ComponentPropsWithoutRef<'div'> {}

export const FileUploadDropzone = forwardRef<HTMLDivElement, FileUploadDropzoneProps>(function FileUploadDropzone(
  { className, onDragEnter, onDragOver, onDragLeave, onDrop, onClick, ...props },
  ref,
) {
  const { open, select, disabled, invalid } = useFileUpload('Dropzone');
  const [dragging, setDragging] = useState(false);
  /* Enter and leave fire for every child crossed; a depth count keeps the
     state true until the pointer has left the dropzone itself. */
  const depth = useRef(0);

  const enter = (event: DragEvent<HTMLDivElement>) => {
    onDragEnter?.(event);
    if (disabled) return;
    event.preventDefault();
    depth.current += 1;
    setDragging(true);
  };
  const over = (event: DragEvent<HTMLDivElement>) => {
    onDragOver?.(event);
    if (disabled) return;
    event.preventDefault();
  };
  const leave = (event: DragEvent<HTMLDivElement>) => {
    onDragLeave?.(event);
    if (disabled) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    onDrop?.(event);
    if (disabled) return;
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (event.dataTransfer?.files?.length) select(event.dataTransfer.files);
  };

  return (
    <div
      ref={ref}
      className={cx('pp-file-upload__dropzone', className)}
      data-state={dragging ? 'dragging' : 'idle'}
      /* The scope the edge and the surface resolve in: the accent while a
         drag is over it, the danger when the field is invalid (D-007). */
      data-pp-tone={invalid ? 'danger' : 'accent'}
      onDragEnter={enter}
      onDragOver={over}
      onDragLeave={leave}
      onDrop={drop}
      onClick={(event) => {
        onClick?.(event);
        /* A click on the zone itself opens the dialog; a click on the
           Trigger already did, and a click on a link inside is the link's. */
        if (!event.defaultPrevented && event.target === event.currentTarget) open();
      }}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// List and items

export interface FileUploadListProps extends ComponentPropsWithoutRef<'ul'> {}

export const FileUploadList = forwardRef<HTMLUListElement, FileUploadListProps>(function FileUploadList(
  { className, ...props },
  ref,
) {
  useFileUpload('List');
  return <ul ref={ref} className={cx('pp-file-upload__list', className)} {...props} />;
});

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

/** A size in the locale's unit: "182 kB", "1.2 MB". */
export function formatBytes(bytes: number, locale?: string): string {
  let value = Math.max(0, bytes);
  let index = 0;
  while (value >= 1000 && index < UNITS.length - 1) {
    value /= 1000;
    index += 1;
  }
  return new Intl.NumberFormat(locale, { style: 'unit', unit: UNITS[index], maximumFractionDigits: index === 0 ? 0 : 1 }).format(value);
}

export interface FileUploadItemProps extends ComponentPropsWithoutRef<'li'> {
  name: string;
  /** In bytes. */
  size?: number;
  /** 0–100. A bar while below 100. */
  progress?: number;
  /** Derived from `progress` unless given. */
  status?: FileUploadStatus;
  /** A line under the name, in the danger tone. */
  error?: ReactNode;
  onRemove?: () => void;
  /** For the size's unit. */
  locale?: string;
}

function Cross() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export const FileUploadItem = forwardRef<HTMLLIElement, FileUploadItemProps>(function FileUploadItem(
  { name, size, progress, status: statusProp, error, onRemove, locale, className, children, ...props },
  ref,
) {
  useFileUpload('Item');
  const status: FileUploadStatus =
    statusProp ?? (error ? 'error' : progress === undefined ? 'idle' : progress >= 100 ? 'complete' : 'uploading');
  const clamped = progress === undefined ? undefined : Math.min(100, Math.max(0, progress));
  return (
    <li
      ref={ref}
      className={cx('pp-file-upload__item', className)}
      data-state={status}
      data-pp-tone={status === 'error' ? 'danger' : undefined}
      {...props}
    >
      <span className="pp-file-upload__name">{name}</span>
      {size !== undefined ? <span className="pp-file-upload__size">{formatBytes(size, locale)}</span> : null}
      {onRemove ? (
        <IconButton label={`Remove ${name}`} variant="plain" size="sm" className="pp-file-upload__remove" onClick={onRemove}>
          <Cross />
        </IconButton>
      ) : null}
      {status === 'uploading' && clamped !== undefined ? (
        <Progress label={`${name}: ${clamped}%`} value={clamped} size="sm" className="pp-file-upload__progress" />
      ) : null}
      {error ? <span className="pp-file-upload__error">{error}</span> : null}
      {children}
    </li>
  );
});
