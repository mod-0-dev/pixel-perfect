# 5.10 `FileUpload`

| | |
| --- | --- |
| **Tier** | 5 — Composition & Data |
| **Status** | `review` — written and built 2026-09-28 under the standing delegation (D-069 §1); every recommendation adopted as written; rulings and findings in D-087; awaiting its CI-authored baseline (D-013) |
| **Sizing contract** | `fill` |
| **RSC** | `client` — the drag state, the hidden input, the Field context |
| **Depends on** | 3.7 `Field` (`done`): it is a form control and reads the field; 5.3 `Progress` (`review`, `done` under the batch) draws an item's progress |
| **APG pattern** | None of its own: a native `<input type="file">` behind a `Button`, a list of what was chosen |

Files, chosen or dropped: the one input `Input` (3.8) excludes, because
a native file control "renders as a button that ignores every token we
have" (tier-3c §5). This is that control, drawn with ours.

## Purpose

Attach a receipt, upload photos, import a CSV. The reader needs a way
to choose files with the file dialog, a place to drop them, and a list
of what they chose with how far each has got. Uploading is the
consumer's — a data layer — so the component **selects** and
**shows**: `onSelect` reports the files (and the ones it refused), and
the list's items take a `progress` the consumer sets.

It deliberately does **not**: upload; hold the list (the files chosen
are the consumer's state, rendered as items); or preview images (an
item is a name and a size; a thumbnail is the consumer's child).

---

## Decisions this spec asks you to approve

### 1. Six parts; the hidden input is the mechanism, the `Trigger` is the keyboard path

```tsx
<FileUpload accept="image/*,.pdf" multiple maxSize={10 * 1024 * 1024} onSelect={(accepted, rejected) => …}>
  <FileUploadDropzone>
    <FileUploadTrigger>Choose files</FileUploadTrigger>
    <Text size="sm" tone="muted">or drop them here</Text>
  </FileUploadDropzone>
  <FileUploadList>
    <FileUploadItem name="receipt.pdf" size={182_000} progress={40} onRemove={…} />
  </FileUploadList>
</FileUpload>
```

`FileUpload` (the root, holding a native `<input type="file">` that is
visually hidden and out of the tab order), `FileUploadTrigger` (a
`Button`, `outline` by default, that opens the file dialog — the one
tab stop, named by its children), `FileUploadDropzone` (the dashed
region that takes a drop and a click), `FileUploadList` (`<ul>`),
`FileUploadItem` (`<li>`: name, size, progress, a remove button), and
`FileUploadStatus` — no: an item's status is `data-state` on the item
(§4). Five parts, named exports.

The native input is the mechanism because it is the only thing that
opens the file dialog and the only thing a form submits; it is hidden
and `tabindex="-1"` because a second tab stop beside the button would
be the same control twice. The Dropzone is not focusable: a drop needs
a pointer, and the keyboard path is the button inside it (D-087 §1).

### 2. `onSelect(accepted, rejected)`: the component refuses by type, size and count and says why

`accept` (the input's grammar: MIME types with wildcards, and
extensions), `maxSize` (bytes) and `maxFiles` (with `multiple`) are
checked on selection and on drop alike — the file dialog honours
`accept` but a drop does not, and neither honours a size. Every
refused file is reported with its reason, `type | size | count`, so
the consumer can say "receipt.zip is not an image" rather than
silently dropping it. The input's value is cleared after every
selection, so choosing the same file twice reports twice.

### 3. In a `Field`, the Trigger is the labelled control

`useField()` gives the root the field's `control`: its `id` and
`aria-describedby` go on the Trigger, because that is the element a
reader tabs to, and a `<label for>` may point at a button. `invalid`,
`disabled` and `size` follow the field with the tier's precedence
(explicit prop, then the field, then the default); `data-invalid` puts
the dropzone in the danger tone.

### 4. An item is a row: name, size, a `Progress`, a remove button; `data-state` says how far

`FileUploadItem` takes `name`, `size` (bytes, formatted by `Intl` in
the locale's unit — "182 kB"), `progress` (0–100; a bar while
`0 ≤ progress < 100`), `status` (`idle | uploading | complete | error`,
derived from `progress` unless given), `error` (a line under the name,
in the danger tone), and `onRemove` (an `IconButton` "Remove {name}"
when given). The bar is `Progress` at `sm`, labelled by the name. The
dropzone's states are `idle | dragging`, and dragging is the accent
edge and the accent surface.

---

## Sizing contract justification

`fill`: the root, the dropzone and the list are blocks that take the
parent's width, `min-inline-size: 0`; the dropzone centres its content.

## Anatomy

```
<div class="pp-file-upload" data-size="md" data-invalid? data-disabled?>
  ├── <input type="file" class="pp-file-upload__input" tabindex="-1" aria-hidden="true">
  ├── <div class="pp-file-upload__dropzone" data-state="idle|dragging">
  │     ├── <button class="pp-button pp-file-upload__trigger">
  │     └── (the consumer's text)
  └── <ul class="pp-file-upload__list">
        └── <li class="pp-file-upload__item" data-state="uploading">
              ├── <span class="pp-file-upload__name">
              ├── <span class="pp-file-upload__size">
              ├── <div class="pp-progress pp-file-upload__progress">
              ├── <span class="pp-file-upload__error">
              └── <button class="pp-button pp-icon-button pp-file-upload__remove" aria-label="Remove receipt.pdf">
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| FileUpload | `pp-file-upload` | `<div>` | The root, the input |
| input | `pp-file-upload__input` | `<input type="file">` | Hidden, out of the tab order |
| FileUploadDropzone | `pp-file-upload__dropzone` | `<div>` | `data-state="idle|dragging"` |
| FileUploadTrigger | `pp-button pp-file-upload__trigger` | `Button` | Opens the dialog; the labelled control |
| FileUploadList | `pp-file-upload__list` | `<ul>` | |
| FileUploadItem | `pp-file-upload__item` | `<li>` | `data-state` |

## Props

**`FileUpload`**: `accept?: string`, `multiple?: boolean`, `maxSize?:
number` (bytes), `maxFiles?: number`, `disabled?`, `invalid?`, `size?`,
`name?: string` (the input's), `onSelect?: (accepted: File[], rejected:
FileRejection[]) => void`, …`<'div'>`. **`FileUploadTrigger`**:
…`ButtonProps` (`variant` defaults `outline`). **`FileUploadDropzone`**:
…`<'div'>`. **`FileUploadList`**: …`<'ul'>`. **`FileUploadItem`**:
`name: string`, `size?: number`, `progress?: number`, `status?:
FileUploadStatus`, `error?: ReactNode`, `onRemove?: () => void`,
`locale?: string`, …`<'li'>` less `children`? No — `children` render
after the name, for a thumbnail or a note.

Exported types: `FileUploadProps`, `FileUploadTriggerProps`,
`FileUploadDropzoneProps`, `FileUploadListProps`, `FileUploadItemProps`,
`FileRejection`, `FileRejectionReason`, `FileUploadStatus`.

## State

| State | Exposed as | Visual |
| --- | --- | --- |
| dragging over | `data-state="dragging"` on the dropzone | Accent edge and surface |
| invalid | `data-invalid` on the root | Danger edge |
| disabled | `data-disabled` on the root | Muted, no pointer |
| item uploading / complete / error | `data-state` on the item | The bar; nothing; the error line |

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-file-upload-border-color` | `--pp-color-border` | The dropzone's dashed edge |
| `--pp-file-upload-radius` | `--pp-radius-3` | The dropzone's corners |
| `--pp-file-upload-padding` | `--pp-space-6` | Inside the dropzone |
| `--pp-file-upload-dragging-bg` | `--pp-tone-bg` (accent) | The dropzone while dragging |

**Contrast, computed at the gate (D-048 §1).** The dropzone's edge is
`--pp-color-border`, the control boundary, 3:1 (D-050); the text inside
is the consumer's `Text`; an item's name is the page's text, its size
muted, its error the danger tone's text on the page — all asserted
pairings.

## Keyboard interaction

Tab to the Trigger; Enter or Space opens the file dialog. Tab through
the items' remove buttons. The dropzone is not a stop.

## Accessibility notes

- The Trigger is the labelled control (`Field`'s `id` and description
  land on it); the input is hidden from the tree.
- A remove button is named "Remove {name}"; a progress bar is labelled
  by the item's name.
- The error line is in the item, read with it; a live announcement of
  an upload's end is the consumer's `Toast`.
- **Manual walkthrough:** Tab to "Choose files", press Enter, hear the
  file dialog; drop a file with a pointer and see the item; Tab to
  "Remove receipt.pdf".

## Container behavior

`fill`; the dropzone's content wraps; an item's name truncates with an
ellipsis rather than pushing the row.

## Usage

```tsx
const [files, setFiles] = useState<Item[]>([]);
<Field label="Attachments" description="PDF or images, up to 10 MB">
  <FileUpload accept="image/*,.pdf" multiple maxSize={10 * 1024 * 1024} onSelect={add}>
    <FileUploadDropzone>
      <FileUploadTrigger>Choose files</FileUploadTrigger>
      <Text size="sm" tone="muted">or drop them here</Text>
    </FileUploadDropzone>
    <FileUploadList>
      {files.map((f) => <FileUploadItem key={f.id} name={f.name} size={f.size} progress={f.progress} onRemove={() => remove(f.id)} />)}
    </FileUploadList>
  </FileUpload>
</Field>
```

## Don't

- Don't upload from inside it; `onSelect` is where your upload starts.
- Don't make the dropzone the only way; the Trigger is the keyboard's.
- Don't pass `File`s to items; pass what you know: a name, a size, a
  progress.

## Testing notes

- **Unit:** the hidden input with `accept`, `multiple` and `name`; the
  Trigger opens the dialog (the input's `click`); a selection reports
  the accepted files and clears the input; rejection by type
  (MIME wildcard and extension), size and count, with reasons; a drop
  reports the same and a drag sets and clears the state; disabled
  ignores both; in a `Field` the Trigger carries the id and
  description, `invalid` and `disabled` follow; an item's name, size
  formatted, bar with the value and the name, status derived and
  given, error line, remove button named and called; refs, `className`,
  `style`; axe both themes.
- **Browser:** the dropzone dashed, the control edge, centred content,
  the cell's width; dragging (a dispatched `dragenter`) the accent edge
  and surface, gone on `dragleave`; an item's row and hairline, the
  name truncating; the ring on the Trigger.
- **Break checks (D-035 §3):** drop the dashed edge; drop the dragging
  surface; drop the item's hairline; drop the name's truncation.
- **Screenshot:** the dropzone with two items per cell, plus a Field
  with an error and a disabled one outside.

## Open questions

Resolved under the standing delegation; each recommendation adopted.

1. **Directory selection (`webkitdirectory`)?** Passes through the
   input's props; nothing to add. Recommend no prop.
2. **Image previews?** An item's children. Recommend no part.
3. **A paste path?** Not now.
