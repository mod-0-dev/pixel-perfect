# Form

A `<form>` that summarises the errors your app already found, as links that
move focus to each field, and refuses a second submission while the first is
pending. Spec: [`Form.md`](../specs/Form.md).

```tsx
import { Form, type FormError } from 'pixel-perfect';
```

It does **not** validate, hold field values, or disable anything. Your app
decides what is wrong and passes it back as `errors`.

## Usage

```tsx
const [errors, setErrors] = useState<FormError[]>([]);
const messageFor = (target: string) => errors.find((e) => e.target === target)?.message;

<Form
  errors={errors}
  onSubmit={(event) => {
    event.preventDefault();
    setErrors(validate(new FormData(event.currentTarget)));
  }}
>
  <Field label="Email" controlId="email" error={messageFor('email')} required>
    <Input name="email" type="email" />
  </Field>
  {/* A group has no single control, so the summary targets the Field's own id. */}
  <Field label="Plan" id="plan" group error={messageFor('plan')}>
    <RadioGroup name="plan">…</RadioGroup>
  </Field>
  <Cluster>
    <Button type="submit">Continue</Button>
  </Cluster>
</Form>
```

With a React 19 action, pass `useActionState`'s pending flag:

```tsx
const [state, action, isPending] = useActionState(save, { errors: [] });

<Form action={action} errors={state.errors} pending={isPending}>…</Form>
```

### From a form library's error object

Most libraries return an object keyed by field. The adapter is one line, and it
is not shipped as a helper because every library's object is shaped differently:

```tsx
const errors = Object.entries(formState.errors).map(([target, e]) => ({
  target,
  message: e.message,
}));
```

Object key order is the order your validator ran in, not the order of the
fields on the page. Sort it if they differ; the summary shows the array's order.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `errors` | `readonly FormError[]` | `[]` | Non-empty renders the summary |
| `errorTitle` | `ReactNode` | `'There is a problem'` | Pass a `Heading` for heading semantics |
| `pending` | `boolean` | `false` | Cancels any submit while set |
| `gap` | `Space` | `'5'` | Space between the form's children |
| `noValidate` | `boolean` | `true` | See below |
| …rest | `<form>` props | | `onSubmit`, `action`, `method`, `aria-*` |

`FormError` is `{ target: string; message: ReactNode }`. `target` is the id the
link moves focus to: a `Field`'s `controlId`, or a group `Field`'s own `id`.

## Each message is passed twice, on purpose

Once to the `Field`, where it sits next to the control, and once to the summary.
That keeps `Field` unchanged and keeps each error in one place you can see at the
call site. The alternative, `Field` reading its error from the form, means a field
could show an error you never passed it.

## When focus moves

| Moment | Focus moves to the summary? |
| --- | --- |
| A submit, then `errors` becomes non-empty (now or after `pending`) | **Yes** |
| `errors` changes with no submit awaiting a result, e.g. validation on blur | No |
| The form mounts with `errors` already set (a no-JS round trip) | **Yes** |
| A submit that comes back with no errors | No — announcing success is your job |

Following a summary link focuses the control and scrolls its whole field, label
included, into view. Without JavaScript the link is still a plain `#id` link and
the browser scrolls to it.

## `noValidate` is on by default

This is the one place `Form` differs from `<form>`. `Field` puts `required` on
its control, and with native validation on, the browser cancels the submit event
for an empty required field. Your `onSubmit` never runs and the summary never
appears. `required` stays on the control, so assistive tech still announces it.
Pass `noValidate={false}` if you want the browser's bubbles back.

## `pending` blocks, it does not disable

While `pending` is set, a submit is cancelled before your `onSubmit` or action
sees it. Nothing is disabled: disabling the button that was just pressed drops
focus to `<body>`. Put `loading` on your submit `Button` for the visual state.

## Styling

| Custom property | Default | |
| --- | --- | --- |
| `--pp-form-gap` | the `gap` prop's step | Space between the form's children |

The summary is an `Alert` (`.pp-form__summary`), so `--pp-alert-*` apply to it.
State is `data-pending` on the root.

## Testing in jsdom

jsdom implements no `Element.prototype.scrollIntoView`, and following a summary
link calls it. Stub it in your test setup:

```ts
Element.prototype.scrollIntoView ??= function () {};
```

## Don't

```tsx
// ✗ The target is not an id on the page. The Field's control id comes from
//   useId(), not from "email", so the link goes nowhere.
<Form errors={[{ target: 'email', message: 'Enter an email address' }]}>
  <Field label="Email"><Input /></Field>
</Form>

// ✓ controlId makes the id known
<Field label="Email" controlId="email" error="Enter an email address"><Input /></Field>

// ✗ Disabling the form while pending. Focus falls to <body> mid-submit.
<Form pending={p}><fieldset disabled={p}>…</fieldset></Form>

// ✗ Summary-only errors. Someone who follows the link lands on a control with
//   no message beside it. Pass the message to the Field too.
<Form errors={errors}><Field label="Email" controlId="email"><Input /></Field></Form>
```
