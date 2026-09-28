---
'pixel-perfect': minor
---

Add `Toast` (4.12): a brief message at a corner of the viewport, announced,
gone after a moment, on `@radix-ui/react-toast`. `ToastProvider` once near
the root (`placement`, logical; `duration`; `limit`) and `useToast()`
anywhere below: `toast(options)` returns an id, `dismiss(id?)`,
`update(id, options)`. Every toast is an `Alert` that floats — `tone`,
`icon`, `title`, `description`, one `action` with `altText`, a dismiss —
drawn by Alert's stylesheet; timers pause on hover, focus and blur; `F8`
reaches the region; a swipe toward the inline end dismisses.
