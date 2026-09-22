# 3.16 `Form`

| | |
| --- | --- |
| **Tier** | 3 — Form & Action Core |
| **Status** | `review` — built 2026-09-22. Gate C passed **by delegation** (D-057); build findings in D-058. `done` waits on one Definition of Done box: the CI-authored screenshot baseline (D-013) |
| **Sizing contract** | `fill` |
| **RSC** | `client` — a submit handler, a ref and one effect (§5) |
| **Depends on** | 3.7 `Field` — its `controlId` is what the summary links to (§3). 5.2 `Alert` — composed, as the error summary (§2). 3.3 `Link` — composed, one per summary entry; **added to Deps at this gate**, see §9 |
| **APG pattern** | None applies. The summary follows the [GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/) behaviour, which is the most tested public pattern for it (§5) |

Approved on its own gate, not in 3D's group (tier-3d-composite.md §0). The
reasons are unchanged: it is a container rather than a composite input, its
summary is an `Alert`, and the one way this spec could have gone expensive is a
change to `Field`'s API. **This spec proposes no change to `Field`** (§3), and
that is the ruling it most needs you to check.

## Purpose

A `<form>` that does two things the platform does not: it **summarises the
errors** the app already found, at the top, as links that move focus to each
field; and it **refuses a second submission** while the first is pending. It
lays its children out with a `gap`, because a summary above a column of fields
needs spacing and RULES §2 means the form is the only thing that can provide it.

It deliberately does **not**:

- **Validate.** "Form validation engine" is out of scope on the roadmap and
  stays there. The app decides what is wrong; `Form` renders what it is told.
- **Hold field values.** There is no `values`, no `onValueChange`, no
  registration. The controls are ordinary controlled or uncontrolled inputs
  and `FormData` reads them the way it always has.
- **Render a field's own error.** `Field` does that, with the
  `aria-describedby` wiring an inline error needs. The summary repeats the
  message as a link; it does not replace it (§3).
- **Disable its controls while pending.** A disabled control is removed from
  the focus order, so disabling the button the user just pressed drops focus to
  `<body>` — the one moment they most need to know where they are (§6).
- **Know about `onSubmit`'s outcome.** It sees the submit event. Everything
  after it — the request, the response, the errors — arrives back as props.

---

## Decisions this spec asks you to approve

### 1. Configuration, not compound — and the summary is not a separate component

RULES §5.6 prefers composition, and the obvious shape is
`<Form><Form.ErrorSummary /></Form>` so the caller can place the summary. This
spec does not offer it. **The summary's focus behaviour (§5) depends on the
submit event, which the form owns.** A separately placed summary would have to
register its element with the form through context so the form could focus it —
an effect, a ref handed upward, and a render in which the form does not yet know
where its summary is. That is exactly D-036's argument against a compound
`Field`, one level up, and the placement it buys is almost never wanted: the
summary goes at the top of the form, because that is where focus lands and where
a sighted user looks after pressing submit.

A caller who needs a summary somewhere else — above the page heading, the GOV.UK
placement — composes an `Alert` of their own there and does not pass `errors`.
Nothing in this component is load-bearing for that case.

### 2. The summary is an `Alert`, and every pairing in it is one `Alert` already asserts

`tone="danger"`, `live="off"`, no icon, no dismiss. Its body is a list of
`Link`s with `tone="danger"` and `underline="always"`.

`tone="danger"` on each `Link` is not decoration. `Link` defaults to `accent`
and **sets its own `data-pp-tone`**, so an unadorned `Link` inside a danger alert
draws accent's `--pp-tone-text` on danger's step 3 — a cross-hue pairing no
check asserts. With the tone passed, the link is danger's step 11 on danger's
step 3, which is exactly `Alert`'s body text and is asserted per hue as `muted
text vs component bg` (≥ 4.5:1). **This component adds no contrast assertion
and leans on none that is missing.** Computed at the gate (D-048 §1).

`live="off"`, because focus moving to the summary (§5) is what announces it. A
live region *and* a focus move reads it twice; a live region *instead of* the
focus move announces it and leaves the user at the bottom of a form whose first
problem is at the top.

### 3. The summary links to ids the caller already controls. `Field` is not changed.

```ts
interface FormError {
  /** The id of the element the link moves focus to. */
  target: string;
  /** The link text. Usually the same message the Field shows. */
  message: ReactNode;
}
```

**`Field` already has the id half of this.** `controlId` exists (D-037 §1)
precisely so "an error summary that links to `#email`" can — that phrase is in
its doc comment. So an entry is `{ target: 'email', message: 'Enter an email
address' }` and the field is `<Field controlId="email" error="Enter an email
address">`. No registration, no context, no effect, no first render in which the
summary is wrong.

**The cost, stated plainly: each message is passed twice** — once to the
`Field`, once to the summary. Three alternatives, all rejected:

| Alternative | Why not |
| --- | --- |
| `Field` registers with the nearest `Form` | D-036's objection verbatim: an effect, a state update, and a first render in which the summary is incomplete. And it changes `Field` — the class of change 3B was gated individually to prevent |
| `Field` reads its `error` from `Form` by `controlId` | No effect needed, so the timing objection falls away. But it is still a `Field` API change, it gives one error two sources that can disagree, and "why does this Field show an error I didn't pass" is a question with no answer visible at the call site |
| Scan the DOM for `[aria-invalid]` at submit time | Reads the summary's text out of other components' markup. Not renderable on the server, so a no-JS round trip gets no summary at all |

In practice the duplication is one line — most form libraries hand back an
object, and `Object.entries(errors).map(([target, message]) => ({ target,
message }))` is the whole adapter. That is shown in the docs page rather than
shipped as a helper, because a helper would have to guess the shape of every
form library's error object.

**Order is the array's.** An object's key order is insertion order, which is the
order the validator ran in, not the order of the fields on the page. An array
makes the caller say it.

**`target` can name a group.** A `RadioGroup` inside `<Field group>` has no
single control id (Field.md §9). The caller sets `id` on the `Field` itself —
which spreads onto its root — and targets that. The click handler (§4) focuses
the first focusable element inside a target that is not itself focusable,
preferring a checked radio, which is where the APG's radio group pattern puts
focus on entry.

### 4. A summary link is a real `href`, and the click handler improves it

Each entry is `<a href="#email">`. **Without JavaScript that works on its own**
— the browser scrolls to the element — so a server-rendered form that comes back
from a no-JS submission with errors still has a working summary.

With JavaScript, the click is intercepted, because fragment navigation scrolls
but does not reliably **focus**, and it scrolls the *control* to the top of the
viewport with its label above the fold. The handler:

1. finds the element by id (and does nothing further if there is none — the
   default navigation still happens);
2. focuses it, or the first focusable descendant for a group (§3), with
   `preventScroll`;
3. scrolls the enclosing `.pp-field`, or the element itself outside one, to the
   start of the viewport, so the label and the message are visible with the
   control.

`preventDefault` is called only once step 1 has found something. A dead link is
left to the browser, which is at least honest about it.

### 5. Focus moves to the summary after a submit that produced errors — and at no other time

The GOV.UK pattern, and the reason the summary exists: after a failed submit,
focus goes to the summary, the screen reader reads it, and every error is one
link away. Getting *when* right is the whole design:

| Moment | Focus moves? | Why |
| --- | --- | --- |
| A submit event fires, and `errors` becomes non-empty on a later render | **Yes** | The case the summary is for. Works for synchronous validation (same tick) and for a server round trip (`pending` in between) |
| `errors` changes while no submit is awaiting a result | No | Live validation on blur would otherwise yank focus out of the field being typed in |
| The form **mounts** with non-empty `errors` | **Yes** | That is what a no-JS round trip or a server action's full-page response looks like: the submission happened on the previous page |
| A submit fires and `errors` stays empty | No | Success is the app's to announce, usually by navigating |

Mechanism: the submit handler sets a ref flag (not state — nothing re-renders
because of it); an effect keyed on `errors` checks the flag, focuses the
summary if it is set and `errors` is non-empty, and clears it. The flag is
also cleared when `pending` goes from `true` to `false` with no errors, **and by
a `setTimeout(0)` after the submit handler returns unless `pending` is now set**
— without which a synchronous success left the flag set and the next blur error
stole focus (D-058 §1). The
summary root takes `tabIndex={-1}` so it can be focused programmatically and is
never a tab stop.

**This is the only reason `Form` is a client component**, and it is a real one
(RULES §7): a Server Component cannot hold a ref or run an effect. The summary's
*markup* does not need the client, which is why §4's no-JS path works.

### 6. `pending` blocks resubmission. It does not disable anything.

`pending` → `data-pending` on the root, and **any submit event while it is set
is cancelled with `preventDefault`** before the caller's `onSubmit` sees it. A
double-click on a slow network sends one request.

It does not set `disabled` on anything, and it does not wrap the children in a
`<fieldset disabled>` — the platform's one-line way to disable a whole form.
Both remove the pressed button from the focus order, and focus falls to `<body>`
mid-submission. `Button` already has `loading` for the visual half, and the app
that knows the request is in flight also knows which button to put it on.

**No `aria-busy`.** It is specified for a region whose content is being
replaced, and several screen readers stop reading a busy region's contents —
which, on a form, includes the button the user is focused on.

**Interaction with React 19 actions.** `<form action={fn}>` is spread through
like any other prop. React does not dispatch an action for a submit event whose
default was prevented, so `pending` blocks a second action exactly as it blocks
a second `onSubmit`. A caller using `useActionState` passes its `isPending` as
`pending`.

### 7. `noValidate` defaults to `true`, and this is the one place `Form` disagrees with `<form>`

`Field` sets `required` on its control. With native validation on, an empty
required field makes the browser **cancel the submit event** and show its own
bubble — so `onSubmit` never runs, the app never validates, and the summary
never appears. The two validation mechanisms are mutually exclusive, and the one
that fires first wins. The browser's bubble is also unstyleable, disappears on
the next keystroke, and reports one field at a time.

`required` stays on the control, where it still does the job that matters —
assistive tech announces "required" — and `noValidate={false}` restores native
validation for a caller who wants it. D-049 §4 and 3D §3.15 rejected props the
platform would silently ignore; this is the reverse, a default the platform
would silently *undermine*, and the two rulings are consistent: in both, the
component does what actually happens in a browser rather than what the attribute
list implies.

### 8. `gap` is the sixth consumer of D-020's scale, default `'5'`

A form is a column: summary, fields, actions. `display: grid` with
`--_pp-gap` from `_shared/layout.css`, and `data-pp-gap` is **always emitted**,
for D-020's inheritance reason — a `Stack` inside a `Form` must not inherit the
form's rhythm.

`'5'` (1.5rem) rather than `Stack`'s `'0'`, because a `Form` with no gap is never
what anyone wants, whereas a `Stack` is a general primitive whose zero is its
identity. A horizontal row of fields is a `Cluster` inside the form, not a
`Form` prop.

### 9. Tracking corrections

- **Deps gains 3.3 `Link`**, which is composed and was not listed. It is `done`,
  so nothing is blocked; the roadmap should say what the component is made of
  (D-053 §9's correction, the same shape).
- **3.16's Notes said "submission state"**. It is `pending` alone — a boolean
  the caller owns. An internal idle/submitting/submitted machine would have to
  guess when a request finished, which is information only the app has.

---

## Sizing contract justification

`fill`. A `<form>` is a block element and fills its parent with no declaration.
The root is a flex column (built that way rather than the grid first drawn here — D-058 §2) with `min-inline-size: 0`, so a long unbreakable
string in a summary message cannot widen it — and `Alert` already carries
`overflow-wrap: anywhere` for its own content (D-053 §4). No width anywhere.

## Anatomy

```
<form class="pp-form" data-pp-gap="5" data-pending? noValidate>
  ├── <div class="pp-alert pp-form__summary" data-pp-tone="danger" tabindex="-1">   (only when errors is non-empty)
  │     ├── <div class="pp-alert__content">
  │     │     ├── <div class="pp-alert__title">There is a problem</div>
  │     │     └── <div class="pp-alert__body">
  │     │           └── <ul class="pp-form__errors">
  │     │                 └── <li> <a class="pp-link pp-form__error-link" href="#email" data-pp-tone="danger">…</a>
  └── {children}
```

| Part | Class | Element | Notes |
| --- | --- | --- | --- |
| Root | `pp-form` | `<form>` | Grid with `gap`. `ref`, `className`, `style` and every remaining prop land here |
| Summary | `pp-form__summary` (+ `pp-alert`) | `Alert` | First child, only when `errors` is non-empty. `tabIndex={-1}` |
| List | `pp-form__errors` | `<ul>` | A list, so a screen reader announces the count |
| Entry link | `pp-form__error-link` (+ `pp-link`) | `Link` | `href="#<target>"` |

The list is unstyled (`list-style: none`, `padding: 0`) and is itself a grid
with `--pp-space-1` between entries. `margin: 0` on the `<ul>` is the reset's
zero, permitted by D-018.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `errors` | `readonly FormError[]` | `[]` | Non-empty renders the summary (§3). Order is display order |
| `errorTitle` | `ReactNode` | `'There is a problem'` | The summary's title. A `ReactNode` so `<Heading level={2}>` can supply heading semantics, `Alert`'s own escape (D-053 §8) |
| `pending` | `boolean` | `false` | Cancels any submit while set (§6) |
| `gap` | `Space` | `'5'` | D-020's scale (§8) |
| `noValidate` | `boolean` | `true` | §7 |
| `className` / `style` | | — | Merged onto the root |
| …rest | `ComponentPropsWithoutRef<'form'>` | — | `onSubmit`, `action`, `method`, `aria-*` |

`ref` → `HTMLFormElement`. `FormError` and `FormProps` are exported.

Six props of its own. No `variant`, `tone` or `size`: a form is not drawn, and a
`size` that cascaded to every `Field` inside would be a second way to set what
each `Field` already sets.

**Controlled / uncontrolled (RULES §5.5) does not apply.** `Form` holds no value
a caller could control. `errors` and `pending` are the caller's state, passed in
the way `Alert`'s visibility is (D-053 §7); the only internal state is §5's
"a submit is awaiting its result" flag, which is a ref and is not observable.

## State

| State | Exposed as | Visual treatment |
| --- | --- | --- |
| Pending | `data-pending` | None. The app puts `loading` on the button it knows about (§6) |
| Has errors | the summary's presence | The summary |

No `data-invalid` on the root. "The form is invalid" is exactly "the summary is
rendered", and `.pp-form:has(> .pp-form__summary)` says it without a second
attribute that could disagree.

## Styling API

| Custom property | Default token | Affects |
| --- | --- | --- |
| `--pp-form-gap` | `--_pp-gap` (from `gap`) | Space between the form's children |

The summary is an `Alert`, so `--pp-alert-*` apply to it through
`.pp-form__summary`. No `--pp-form-summary-*` duplicates them.

## Keyboard interaction

No APG pattern applies. What the component guarantees:

| Key / event | Behavior |
| --- | --- |
| Enter in a text field | Native implicit submission. Cancelled while `pending` |
| Submit that yields errors | Focus moves to the summary (§5) |
| Tab from the summary | The first summary link |
| Enter on a summary link | Focus moves to the field's control, the field scrolled into view (§4) |

The summary is never in the tab order on its own (`tabIndex={-1}`).

## Accessibility notes

- The summary is found by focus, not by a live region (§2).
- The title is a `<div>` unless the caller passes a heading (`Alert` §6's
  reasoning: `h2` on a page, `h3` in a card, and the form knows neither).
- Each field still carries its own inline error through `Field`'s
  `aria-describedby`; the summary does not replace it.
- **Manual walkthrough:** submit an empty required form with the keyboard and
  confirm focus lands on the summary and it is read; Tab to the first link and
  press Enter, confirm focus is on the control and its label is visible; fix
  the field, submit again with one error left, confirm focus returns to the
  summary; with `pending` set, press Enter twice and confirm one submission;
  type in a field whose error is cleared on blur and confirm focus never leaves
  it. Repeat the first step with JavaScript disabled against a server that
  re-renders the page with errors.

## Container behavior

No `@container` rules. It fills and stacks. Multi-column field layouts are a
`Grid` or `Split` inside it.

## Usage

```tsx
const [errors, setErrors] = useState<FormError[]>([]);

<Form
  errors={errors}
  onSubmit={(event) => {
    event.preventDefault();
    setErrors(validate(new FormData(event.currentTarget)));
  }}
>
  <Field label="Email" controlId="email" error={messageFor(errors, 'email')} required>
    <Input type="email" name="email" />
  </Field>
  <Field label="Plan" id="plan" group error={messageFor(errors, 'plan')}>
    <RadioGroup name="plan">…</RadioGroup>
  </Field>
  <Cluster>
    <Button type="submit">Continue</Button>
  </Cluster>
</Form>

// With a React 19 action
const [state, action, isPending] = useActionState(save, { errors: [] });
<Form action={action} errors={state.errors} pending={isPending}>…</Form>
```

## Don't

```tsx
// ✗ A target that is not an id on the page. The link scrolls nowhere and the
//   handler cannot focus anything. Field's controlId is what makes it real.
<Form errors={[{ target: 'email', message: '…' }]}>
  <Field label="Email"><Input /></Field>  {/* id is useId()'s, not "email" */}
</Form>

// ✗ Disabling the form while pending. Focus falls to <body> mid-submit.
<Form pending={p}><fieldset disabled={p}>…</fieldset></Form>

// ✗ Summary-only errors. The field itself must say what is wrong too, or a user
//   who follows the link lands on a control with no message beside it.
<Form errors={errors}><Field label="Email" controlId="email"><Input /></Field></Form>
```

## Testing notes

- **§5's table is the test plan**, one case per row, including the two "No"
  rows — the blur case is the one that fails silently in production.
- **The no-JS path is asserted in the browser with JavaScript disabled**: the
  server-rendered summary's link scrolls to its target.
- **`pending` blocks a React action, not only `onSubmit`** — a form with
  `action={spy}` submitted twice while pending calls the spy once.
- **The group target focuses the checked radio**, and the first one when none
  is checked.
- **Break checks** (D-035 §3): drop the ref flag and watch the blur test steal
  focus; drop `tone="danger"` on the links and watch the tone assertion catch
  the accent link; drop `noValidate` and watch the required-field test never
  reach `onSubmit`.

## Open questions

Resolve before Gate C.

1. **Is passing each message twice acceptable** (§3), or would you rather `Field`
   gain a read of `Form`'s errors by `controlId` — which removes the duplication
   and costs a `Field` API change and a second source for one error?
   **Recommendation: accept the duplication.** It is the only option that
   leaves `Field` untouched, and the adapter is one line.
2. **Focus on mount with errors** (§5, third row). Right for a no-JS round trip;
   surprising for a client-rendered form restored from a draft with errors
   already in it. **Recommendation: keep it** — the draft case is rare, and the
   round-trip case is the one progressive enhancement exists for.
3. **`errorTitle`'s English default.** `Alert`'s `dismissLabel` set the precedent
   of an English default for an accessible string. Same here, unless you want it
   required.
