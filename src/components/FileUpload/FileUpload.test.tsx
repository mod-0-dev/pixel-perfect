import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Field } from '../Field/Field';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadList,
  FileUploadTrigger,
  formatBytes,
  matchesAccept,
} from './FileUpload';

const file = (name: string, type: string, bytes = 10) => new File([new Uint8Array(bytes)], name, { type });
const input = () => document.querySelector('.pp-file-upload__input') as HTMLInputElement;
const dropzone = () => document.querySelector('.pp-file-upload__dropzone') as HTMLElement;

function Basic(props: Partial<React.ComponentProps<typeof FileUpload>> = {}) {
  return (
    <FileUpload {...props}>
      <FileUploadDropzone>
        <FileUploadTrigger>Choose files</FileUploadTrigger>
        <span>or drop them here</span>
      </FileUploadDropzone>
    </FileUpload>
  );
}

describe('FileUpload', () => {
  it('holds a hidden native file input with accept, multiple and name; the Trigger opens it (spec §1)', async () => {
    const user = userEvent.setup();
    const { getByRole, getByText } = renderWithTheme(<Basic accept="image/*,.pdf" multiple name="attachments" />);
    const native = input();
    expect(native).toHaveAttribute('type', 'file');
    expect(native).toHaveAttribute('accept', 'image/*,.pdf');
    expect(native).toHaveAttribute('multiple');
    expect(native).toHaveAttribute('name', 'attachments');
    expect(native).toHaveAttribute('tabindex', '-1');
    expect(native).toHaveAttribute('aria-hidden', 'true');
    const click = vi.spyOn(native, 'click');
    const trigger = getByRole('button', { name: 'Choose files' });
    expect(trigger).toHaveClass('pp-button', 'pp-file-upload__trigger');
    expect(trigger).toHaveAttribute('data-variant', 'outline');
    await user.click(trigger);
    expect(click).toHaveBeenCalledTimes(1);
    /* A click on the zone itself opens it too; on the text inside, not. */
    await user.click(dropzone());
    expect(click).toHaveBeenCalledTimes(2);
    /* By its text: the Button's label is a span too, and the first draft
       clicked that. */
    await user.click(getByText('or drop them here'));
    expect(click).toHaveBeenCalledTimes(2);
  });

  it('reports a selection, and clears the input so the same file reports again (spec §2)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithTheme(<Basic multiple onSelect={onSelect} />);
    const a = file('a.png', 'image/png');
    await user.upload(input(), [a, file('b.png', 'image/png')]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]![0].map((f: File) => f.name)).toEqual(['a.png', 'b.png']);
    expect(onSelect.mock.calls[0]![1]).toEqual([]);
    expect(input().value).toBe('');
    await user.upload(input(), a);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('refuses by type, size and count, with reasons (spec §2)', async () => {
    /* user-event honours `accept` like the dialog does; off here, because the
       component's own check is what is under test (a drop bypasses the dialog). */
    const user = userEvent.setup({ applyAccept: false });
    const onSelect = vi.fn();
    renderWithTheme(<Basic accept="image/*,.pdf" multiple maxSize={100} maxFiles={2} onSelect={onSelect} />);
    await user.upload(input(), [
      file('a.png', 'image/png'),
      file('b.zip', 'application/zip'),
      file('c.pdf', 'application/pdf'),
      file('d.jpg', 'image/jpeg', 200),
      file('e.gif', 'image/gif'),
    ]);
    const [accepted, rejected] = onSelect.mock.calls[0]!;
    expect(accepted.map((f: File) => f.name)).toEqual(['a.png', 'c.pdf']);
    expect(rejected.map((r: { file: File; reason: string }) => [r.file.name, r.reason])).toEqual([
      ['b.zip', 'type'],
      ['d.jpg', 'size'],
      ['e.gif', 'count'],
    ]);
  });

  it('a single input takes one file and refuses the rest by count', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithTheme(<Basic onSelect={onSelect} />);
    fireEvent.change(input(), { target: { files: [file('a.png', 'image/png'), file('b.png', 'image/png')] } });
    void user;
    const [accepted, rejected] = onSelect.mock.calls[0]!;
    expect(accepted).toHaveLength(1);
    expect(rejected[0].reason).toBe('count');
  });

  it('matchesAccept: MIME, a wildcard subtype, an extension, and nothing', () => {
    expect(matchesAccept(file('a.png', 'image/png'), 'image/*')).toBe(true);
    expect(matchesAccept(file('a.png', 'image/png'), 'image/jpeg')).toBe(false);
    expect(matchesAccept(file('a.PDF', 'application/pdf'), '.pdf')).toBe(true);
    expect(matchesAccept(file('a.pdf', ''), '.pdf, image/*')).toBe(true);
    expect(matchesAccept(file('a.txt', 'text/plain'), undefined)).toBe(true);
    expect(matchesAccept(file('a.txt', 'text/plain'), ' ')).toBe(true);
  });

  it('takes a drop and sets the dragging state while a drag is over it; ignores both when disabled', () => {
    const onSelect = vi.fn();
    const { rerender } = renderWithTheme(<Basic onSelect={onSelect} />);
    const zone = dropzone();
    expect(zone).toHaveAttribute('data-state', 'idle');
    fireEvent.dragEnter(zone);
    expect(zone).toHaveAttribute('data-state', 'dragging');
    /* Entering a child and leaving it does not end the drag. */
    fireEvent.dragEnter(zone.querySelector('.pp-button')!);
    fireEvent.dragLeave(zone.querySelector('.pp-button')!);
    expect(zone).toHaveAttribute('data-state', 'dragging');
    fireEvent.dragLeave(zone);
    expect(zone).toHaveAttribute('data-state', 'idle');
    fireEvent.dragEnter(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [file('dropped.png', 'image/png')], types: ['Files'] } });
    expect(zone).toHaveAttribute('data-state', 'idle');
    expect(onSelect.mock.calls[0]![0][0].name).toBe('dropped.png');
    onSelect.mockClear();
    rerender(<Basic onSelect={onSelect} disabled />);
    fireEvent.dragEnter(zone);
    expect(zone).toHaveAttribute('data-state', 'idle');
    fireEvent.drop(zone, { dataTransfer: { files: [file('x.png', 'image/png')], types: ['Files'] } });
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.querySelector('.pp-file-upload')).toHaveAttribute('data-disabled');
    expect(input()).toBeDisabled();
  });

  it('in a group Field, the root is the named group and the Trigger keeps its name; invalid, disabled and size follow (spec §3)', () => {
    const { getByRole } = renderWithTheme(
      <Field group label="Attachments" description="PDF or images" error="Too big" size="sm" disabled>
        <Basic />
      </Field>,
    );
    const root = getByRole('group', { name: 'Attachments' });
    expect(root).toHaveClass('pp-file-upload');
    expect(root).toHaveAccessibleDescription('PDF or images Too big');
    const trigger = getByRole('button', { name: 'Choose files' });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('data-size', 'sm');
    expect(trigger).not.toHaveAttribute('id');
    expect(root).toHaveAttribute('data-invalid');
    expect(root).toHaveAttribute('data-size', 'sm');
  });

  it('in a plain Field, the label points at the Trigger, which takes the label as its name', () => {
    const { getByRole } = renderWithTheme(
      <Field label="Attachments" description="PDF or images">
        <Basic />
      </Field>,
    );
    const trigger = getByRole('button', { name: 'Attachments' });
    expect(trigger).toHaveClass('pp-file-upload__trigger');
    expect(trigger).toHaveAccessibleDescription('PDF or images');
    expect(document.querySelector('label')!.getAttribute('for')).toBe(trigger.id);
  });

  it('an item shows the name, the size, a bar while uploading, an error, and a named remove button (spec §4)', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { getByRole, getAllByRole, rerender } = renderWithTheme(
      <FileUpload>
        <FileUploadList>
          <FileUploadItem name="receipt.pdf" size={182_000} progress={40} onRemove={onRemove} locale="en-US" />
          <FileUploadItem name="done.png" size={1_200_000} progress={100} locale="en-US" />
          <FileUploadItem name="big.zip" size={5_000_000_000} error="Too big" locale="en-US" />
          <FileUploadItem name="pending.txt" locale="en-US" />
        </FileUploadList>
      </FileUpload>,
    );
    const items = getAllByRole('listitem');
    expect(items.map((i) => i.getAttribute('data-state'))).toEqual(['uploading', 'complete', 'error', 'idle']);
    expect(items[0]!.querySelector('.pp-file-upload__name')).toHaveTextContent('receipt.pdf');
    expect(items[0]!.querySelector('.pp-file-upload__size')).toHaveTextContent('182 kB');
    expect(items[1]!.querySelector('.pp-file-upload__size')).toHaveTextContent('1.2 MB');
    expect(items[2]!.querySelector('.pp-file-upload__size')).toHaveTextContent('5 GB');
    const bar = getByRole('progressbar', { name: 'receipt.pdf: 40%' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('data-size', 'sm');
    expect(items[1]!.querySelector('.pp-progress')).toBeNull();
    expect(items[2]!.querySelector('.pp-file-upload__error')).toHaveTextContent('Too big');
    await user.click(getByRole('button', { name: 'Remove receipt.pdf' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(items[1]!.querySelector('button')).toBeNull();
    rerender(
      <FileUpload>
        <FileUploadList>
          <FileUploadItem name="x" progress={10} status="error" />
        </FileUploadList>
      </FileUpload>,
    );
    expect(getByRole('listitem')).toHaveAttribute('data-state', 'error');
  });

  it('formatBytes picks the unit and rounds', () => {
    expect(formatBytes(0, 'en-US')).toBe('0 byte');
    expect(formatBytes(999, 'en-US')).toBe('999 byte');
    expect(formatBytes(1_000, 'en-US')).toBe('1 kB');
    expect(formatBytes(15_500, 'en-US')).toBe('15.5 kB');
    expect(formatBytes(2_345_678, 'en-US')).toBe('2.3 MB');
  });

  it('throws a readable error for a part outside the root', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<FileUploadTrigger>Lost</FileUploadTrigger>)).toThrow(/<FileUploadTrigger> must be rendered inside <FileUpload>/);
    error.mockRestore();
  });

  it('forwards refs and merges className and style on every part', () => {
    const root = createRef<HTMLDivElement>();
    const zone = createRef<HTMLDivElement>();
    const trigger = createRef<HTMLButtonElement>();
    const list = createRef<HTMLUListElement>();
    const item = createRef<HTMLLIElement>();
    renderWithTheme(
      <FileUpload ref={root} className="r" style={{ opacity: 0.5 }} data-testid="root">
        <FileUploadDropzone ref={zone} className="z" style={{ order: 1 }}>
          <FileUploadTrigger ref={trigger} className="t" style={{ order: 2 }}>
            Choose
          </FileUploadTrigger>
        </FileUploadDropzone>
        <FileUploadList ref={list} className="l" style={{ order: 3 }}>
          <FileUploadItem ref={item} name="a" className="i" style={{ order: 4 }} />
        </FileUploadList>
      </FileUpload>,
    );
    expect(root.current).toHaveClass('pp-file-upload', 'r');
    expect(root.current).toHaveStyle({ opacity: '0.5' });
    expect(root.current).toHaveAttribute('data-testid', 'root');
    expect(zone.current).toHaveClass('pp-file-upload__dropzone', 'z');
    expect(zone.current).toHaveStyle({ order: '1' });
    expect(trigger.current).toHaveClass('pp-file-upload__trigger', 't');
    expect(trigger.current).toHaveStyle({ order: '2' });
    expect(list.current).toHaveClass('pp-file-upload__list', 'l');
    expect(item.current).toHaveClass('pp-file-upload__item', 'i');
    expect(item.current).toHaveStyle({ order: '4' });
  });

  it('has no axe violations, in a Field with items, in both themes', async () => {
    const light = renderWithTheme(
      <Field group label="Attachments" description="Up to 10 MB">
        <FileUpload multiple>
          <FileUploadDropzone>
            <FileUploadTrigger>Choose files</FileUploadTrigger>
            <span>or drop them here</span>
          </FileUploadDropzone>
          <FileUploadList>
            <FileUploadItem name="receipt.pdf" size={182_000} progress={40} onRemove={() => {}} />
            <FileUploadItem name="big.zip" size={5_000_000} error="Too big" onRemove={() => {}} />
          </FileUploadList>
        </FileUpload>
      </Field>,
    );
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Basic />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
