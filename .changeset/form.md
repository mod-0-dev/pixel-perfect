---
'pixel-perfect': minor
---

Add `Form` (3.16): a `<form>` that summarises the errors your app found and
refuses a second submission while the first is pending. It does not validate
and holds no field values.

- **Error summary.** `errors: FormError[]` (`{ target, message }`) renders a
  danger `Alert` as the form's first child, with one link per error. Each link
  is a real `#target` href, so it works without JavaScript. With JavaScript,
  following a link focuses the control and scrolls its whole field, label
  included, into view. A group `Field` is targeted by its own `id`, and the
  checked radio (or the first one) gets focus.
- **`Field` is unchanged.** Targets are `Field`'s existing `controlId`, so each
  message is passed twice: to the `Field` and to the summary.
- **Focus moves to the summary after a submit that produced errors**, including
  one that resolves after `pending`, and when the form mounts with errors. It
  never moves for errors set without a submit, such as validation on blur.
- **`pending` cancels any submit while set**, including a React 19 `action`, and
  disables nothing, so focus stays on the button that was pressed.
- **`noValidate` defaults to `true`.** Native validation would cancel the submit
  for an empty required field before your `onSubmit` ran.
- `gap` uses the shared space scale (default `'5'`), and `--pp-form-gap` overrides it.
- Test setups on jsdom need an `Element.prototype.scrollIntoView` stub.
