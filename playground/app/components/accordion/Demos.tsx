'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Field, Input, Stack, Text } from '@mod-0-dev/pixel-perfect';
import { useState } from 'react';

const FAQ = [
  ['shipping', 'When will my order ship?', 'Within two working days. You get a tracking link the moment it leaves.'],
  ['returns', 'What is the return policy?', 'Thirty days from delivery, no questions asked. Postage is on us for anything faulty.'],
  ['sizes', 'How do the sizes run, and is there a chart I can compare against my own measurements?', 'True to size. The chart on each product page lists chest, waist and length in centimetres.'],
] as const;

/** The Matrix gallery: three sections, the second open. */
export function Gallery() {
  return (
    <Accordion defaultValue="returns">
      {FAQ.map(([value, question, answer]) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionContent>
            <Text size="sm">{answer}</Text>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** One at a time by default, collapsible; the value shown. */
export function Single({ collapsible }: { collapsible?: false }) {
  const [value, setValue] = useState('');
  return (
    <Stack gap="2">
      <div data-testid={collapsible === false ? 'accordion-strict' : 'accordion-single'}>
        <Accordion value={value} onValueChange={setValue} {...(collapsible === false ? { collapsible: false } : {})}>
          {FAQ.map(([v, question, answer]) => (
            <AccordionItem key={v} value={v}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>
                <Text size="sm">{answer}</Text>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <Text size="sm" tone="muted">
        open: {value || 'none'}
      </Text>
    </Stack>
  );
}

/** Any number open. */
export function Multiple() {
  return (
    <div data-testid="accordion-multiple">
      <Accordion multiple defaultValue={['shipping']} headingLevel={4}>
        {FAQ.map(([v, question, answer]) => (
          <AccordionItem key={v} value={v}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionContent>
              <Text size="sm">{answer}</Text>
            </AccordionContent>
          </AccordionItem>
        ))}
        <AccordionItem value="disabled" disabled>
          <AccordionTrigger>A disabled section</AccordionTrigger>
          <AccordionContent>
            <Text size="sm">Never shown.</Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

/** A form in a kept panel beside one that empties. */
export function KeptForm() {
  return (
    <div data-testid="accordion-kept">
      <Accordion defaultValue="kept">
        <AccordionItem value="kept">
          <AccordionTrigger>Kept: type, close, reopen</AccordionTrigger>
          <AccordionContent keepMounted>
            <Field label="Still here">
              <Input placeholder="still here" />
            </Field>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="fresh">
          <AccordionTrigger>Fresh: emptied when closed</AccordionTrigger>
          <AccordionContent>
            <Field label="Gone on return">
              <Input placeholder="gone on return" />
            </Field>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
