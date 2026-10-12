import { Field, Icon, IconButton, Input, InputGroup, InputGroupAddon, Stack } from '@mod-0-dev/pixel-perfect';

import { Matrix } from '../../../harness/Matrix';
import { Password } from './Password';

const SIZES = ['sm', 'md', 'lg'] as const;

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function InputGroupPage() {
  return (
    <>
      <h1>3.19 InputGroup</h1>
      <p>
        An <code>Input</code> with things inside its box: an icon, a unit, a button that clears it
        or shows the password. The group draws the box and the ring; the <code>Input</code> inside
        gives its own up, so there is one box and one ring. Addons sit in DOM order, so a
        right-to-left page needs no <code>side</code>.
      </p>

      <section>
        <h2>Icon, unit, and both</h2>
        <p>
          The outer side keeps the control&rsquo;s padding; between the text and an addon is the
          control gap. A press on an icon, a unit or the padding focuses the field.
        </p>
        <Matrix>
          <Stack gap="3">
            <InputGroup>
              <InputGroupAddon>
                <Icon decorative>
                  <SearchGlyph />
                </Icon>
              </InputGroupAddon>
              <Input aria-label="Search" placeholder="Search components" />
            </InputGroup>
            <Field label="Price (EUR)">
              <InputGroup>
                <Input inputMode="decimal" defaultValue="1,250.00" />
                <InputGroupAddon>EUR</InputGroupAddon>
              </InputGroup>
            </Field>
            <Field label="Website">
              <InputGroup>
                <InputGroupAddon>https://</InputGroupAddon>
                <Input defaultValue="example.com" />
                <InputGroupAddon>/</InputGroupAddon>
              </InputGroup>
            </Field>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>A button inside</h2>
        <p>
          A <code>Button</code> or <code>IconButton</code> in an addon keeps its own look and its
          own focus ring; use the size one step down, so it sits inside the box. The addon sits
          closer to the edge, because a button already carries padding.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Password">
              <Password />
            </Field>
            <InputGroup>
              <InputGroupAddon>
                <Icon decorative>
                  <SearchGlyph />
                </Icon>
              </InputGroupAddon>
              <Input aria-label="Filter" defaultValue="button" />
              <InputGroupAddon>
                <IconButton label="Clear filter" size="sm" variant="ghost">
                  <CloseGlyph />
                </IconButton>
              </InputGroupAddon>
            </InputGroup>
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Sizes</h2>
        <p>The group reads the Field&rsquo;s size and hands it to the Input; its own prop wins.</p>
        <Matrix>
          <Stack gap="3">
            {SIZES.map((size) => (
              <Field key={size} label={`Size ${size}`} size={size}>
                <InputGroup>
                  <InputGroupAddon>
                    <Icon decorative>
                      <SearchGlyph />
                    </Icon>
                  </InputGroupAddon>
                  <Input placeholder="Search" />
                  <InputGroupAddon>⌘K</InputGroupAddon>
                </InputGroup>
              </Field>
            ))}
          </Stack>
        </Matrix>
      </section>

      <section>
        <h2>Invalid, disabled and read-only</h2>
        <p>
          The group owns the box, so it owns the state the box shows: an invalid group is drawn in
          the danger tone, and stays red while it has focus.
        </p>
        <Matrix>
          <Stack gap="3">
            <Field label="Amount (EUR)" error="Enter at least 10.00.">
              <InputGroup>
                <Input defaultValue="4.00" />
                <InputGroupAddon>EUR</InputGroupAddon>
              </InputGroup>
            </Field>
            <Field label="Amount (EUR)" disabled>
              <InputGroup>
                <Input defaultValue="25.00" />
                <InputGroupAddon>EUR</InputGroupAddon>
              </InputGroup>
            </Field>
            <Field label="Amount (EUR)">
              <InputGroup>
                <Input defaultValue="25.00" readOnly />
                <InputGroupAddon>EUR</InputGroupAddon>
              </InputGroup>
            </Field>
          </Stack>
        </Matrix>
      </section>
    </>
  );
}
