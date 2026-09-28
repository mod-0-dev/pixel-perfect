'use client';

import { useState } from 'react';

import {
  Field,
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadList,
  FileUploadTrigger,
  Text,
  type FileRejection,
} from 'pixel-perfect';

interface Item {
  id: string;
  name: string;
  size: number;
  progress?: number;
  error?: string;
}

const SEED: Item[] = [
  { id: 'a', name: 'receipt-september.pdf', size: 182_000, progress: 40 },
  { id: 'b', name: 'photo-of-a-very-long-file-name-that-needs-truncating-in-a-sidebar.jpg', size: 3_400_000, progress: 100 },
  { id: 'c', name: 'archive.zip', size: 52_000_000, error: 'ZIP archives are not accepted.' },
];

const REASONS: Record<FileRejection['reason'], string> = {
  type: 'is not an image or a PDF',
  size: 'is over 10 MB',
  count: 'is one too many',
};

/**
 * The list is the consumer's state (spec §Purpose): a selection adds items
 * at 0% and a rejection adds them with the reason; nothing is uploaded.
 * The playground's instances each own a list.
 */
export function Uploader({ testId, disabled, error }: { testId?: string; disabled?: boolean; error?: string }) {
  const [items, setItems] = useState<Item[]>(SEED);
  const onSelect = (accepted: File[], rejected: FileRejection[]) => {
    setItems((current) => [
      ...current,
      ...accepted.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size, progress: 0 })),
      ...rejected.map((r, i) => ({ id: `${Date.now()}-r${i}`, name: r.file.name, size: r.file.size, error: `${r.file.name} ${REASONS[r.reason]}.` })),
    ]);
  };
  return (
    <div {...(testId ? { 'data-testid': testId } : {})}>
      <Field group label="Attachments" description="Images or PDFs, up to 10 MB each" {...(error ? { error } : {})} {...(disabled ? { disabled } : {})}>
        <FileUpload accept="image/*,.pdf" multiple maxSize={10 * 1024 * 1024} onSelect={onSelect}>
          <FileUploadDropzone>
            <FileUploadTrigger>Choose files</FileUploadTrigger>
            <Text size="sm" tone="muted">
              or drop them here
            </Text>
          </FileUploadDropzone>
          <FileUploadList>
            {items.map((item) => (
              <FileUploadItem
                key={item.id}
                name={item.name}
                size={item.size}
                {...(item.progress !== undefined ? { progress: item.progress } : {})}
                {...(item.error ? { error: item.error } : {})}
                onRemove={() => setItems((current) => current.filter((i) => i.id !== item.id))}
                locale="en-US"
              />
            ))}
          </FileUploadList>
        </FileUpload>
      </Field>
    </div>
  );
}
