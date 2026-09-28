# FileUpload

Files, chosen or dropped: a native file input behind a `Button`, a
dashed zone that takes a drop, and a list of what was chosen with how
far each has got. Spec: [`FileUpload.md`](../specs/FileUpload.md).

```tsx
import { FileUpload, FileUploadDropzone, FileUploadTrigger, FileUploadList, FileUploadItem } from 'pixel-perfect';
```

A client component. It **selects and shows**; uploading is yours:
`onSelect` is where your upload starts, and each item takes the
`progress` you know.

## Usage

```tsx
const [files, setFiles] = useState<Item[]>([]);

<Field label="Attachments" description="Images or PDFs, up to 10 MB">
  <FileUpload
    accept="image/*,.pdf"
    multiple
    maxSize={10 * 1024 * 1024}
    onSelect={(accepted, rejected) => {
      setFiles((f) => [...f, ...accepted.map(toItem)]);
      for (const r of rejected) toast({ title: `${r.file.name} ${why(r.reason)}` });
    }}
  >
    <FileUploadDropzone>
      <FileUploadTrigger>Choose files</FileUploadTrigger>
      <Text size="sm" tone="muted">or drop them here</Text>
    </FileUploadDropzone>
    <FileUploadList>
      {files.map((f) => (
        <FileUploadItem key={f.id} name={f.name} size={f.size} progress={f.progress} error={f.error} onRemove={() => remove(f.id)} />
      ))}
    </FileUploadList>
  </FileUpload>
</Field>
```

The file dialog honours `accept`; a drop does not, and neither honours
a size, so every path is checked the same way and every refused file
comes back with its reason: `type`, `size` or `count`. Choosing the
same file twice reports twice.

In a `Field`, the Trigger is the labelled control: the label points at
it, the description and error describe it, and `invalid`, `disabled`
and `size` follow the field.

## Parts

| Part | Renders | Notes |
| --- | --- | --- |
| `FileUpload` | `<div>` with a hidden `<input type="file">` | `accept`, `multiple`, `maxSize`, `maxFiles`, `name`, `onSelect` |
| `FileUploadDropzone` | `<div>` | Takes a drop and a click; `data-state="dragging"` while a drag is over it |
| `FileUploadTrigger` | a `Button`, `outline` | Opens the dialog; the one tab stop |
| `FileUploadList` | `<ul>` | |
| `FileUploadItem` | `<li>` | `name`, `size` (bytes), `progress` (0–100), `status`, `error`, `onRemove`, `locale` |

An item's `status` is derived from `progress` and `error` unless given:
a bar while `progress` is below 100, nothing when complete, the error
line in the danger tone. The size is formatted in the locale's unit.

## Keyboard

Tab to the Trigger; Enter or Space opens the dialog. Tab on through
the items' remove buttons. The dropzone is not a stop: a drop needs a
pointer, and the keyboard's path is the button inside it.

## Styling

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-file-upload-border-color` | `--pp-color-border` | The dashed edge |
| `--pp-file-upload-radius` | `--pp-radius-3` | The dropzone's corners |
| `--pp-file-upload-padding` | `--pp-space-6` | Inside the dropzone |
| `--pp-file-upload-dragging-bg` | `--pp-tone-bg` | While dragging |

## Anatomy

```
<div class="pp-file-upload" data-size="md">
  ├── <input type="file" class="pp-file-upload__input" tabindex="-1" aria-hidden="true">
  ├── <div class="pp-file-upload__dropzone" data-state="idle">
  │     └── <button class="pp-button pp-file-upload__trigger">
  └── <ul class="pp-file-upload__list">
        └── <li class="pp-file-upload__item" data-state="uploading">
              name · size · remove · <div class="pp-progress"> · error
```

## Don't

```tsx
// ✗ Uploading inside. onSelect is where yours starts.
<FileUpload upload={(f) => api.put(f)} />

// ✗ A dropzone with no Trigger. A keyboard cannot drop.
<FileUploadDropzone>Drop files here</FileUploadDropzone>

// ✗ Files as items. Pass what you know.
<FileUploadItem file={file} />
```
