---
'pixel-perfect': minor
---

Add `FileUpload` (5.10): a hidden native file input behind a
`FileUploadTrigger` Button, a `FileUploadDropzone` that takes a drop,
and a `FileUploadList` of `FileUploadItem`s with a size, a `Progress`
bar, an error line and a remove button; selection refused by type,
size and count with reasons through `onSelect`; the Trigger is the
labelled control in a `Field`. It selects and shows; uploading is the
consumer's.
