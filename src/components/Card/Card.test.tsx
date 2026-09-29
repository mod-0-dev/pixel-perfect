import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Button } from '../Button/Button';
import { Heading } from '../Heading/Heading';
import { Card, CardBody, CardFooter, CardHeader } from './Card';

describe('Card', () => {
  it('is a surface with sections, in order, and no role of its own (spec §1, §4)', () => {
    const { container } = renderWithTheme(
      <Card data-testid="card">
        <CardHeader>
          <Heading level={3} size="sm">
            Billing
          </Heading>
        </CardHeader>
        <CardBody>Next invoice on the 1st.</CardBody>
        <CardFooter>
          <Button variant="outline">Manage</Button>
        </CardFooter>
      </Card>,
    );
    const card = container.querySelector('.pp-card')!;
    expect(card.tagName).toBe('DIV');
    expect(card).not.toHaveAttribute('role');
    expect(Array.from(card.children).map((c) => c.className)).toEqual(['pp-card__header', 'pp-card__body', 'pp-card__footer']);
    expect(card.querySelector('.pp-card__header')?.tagName).toBe('DIV');
  });

  it('asChild renders the consumer\'s link as the card, keeping the class and the href (spec §3)', () => {
    const { getByRole } = renderWithTheme(
      <Card asChild className="mine">
        <a href="/projects/1">
          <CardHeader>Project</CardHeader>
          <CardBody>Summary</CardBody>
        </a>
      </Card>,
    );
    const link = getByRole('link');
    expect(link).toHaveClass('pp-card', 'mine');
    expect(link).toHaveAttribute('href', '/projects/1');
    expect(link.querySelector('.pp-card__body')).toHaveTextContent('Summary');
  });

  it('forwards refs and merges className and style onto every part', () => {
    const root = createRef<HTMLDivElement>();
    const header = createRef<HTMLDivElement>();
    const body = createRef<HTMLDivElement>();
    const footer = createRef<HTMLDivElement>();
    renderWithTheme(
      <Card ref={root} className="r" style={{ opacity: 0.5 }} data-testid="root">
        <CardHeader ref={header} className="h" style={{ order: 1 }} />
        <CardBody ref={body} className="b" style={{ order: 2 }} />
        <CardFooter ref={footer} className="f" style={{ order: 3 }} />
      </Card>,
    );
    expect(root.current).toHaveClass('pp-card', 'r');
    expect(root.current).toHaveStyle({ opacity: '0.5' });
    expect(root.current).toHaveAttribute('data-testid', 'root');
    expect(header.current).toHaveClass('pp-card__header', 'h');
    expect(header.current).toHaveStyle({ order: '1' });
    expect(body.current).toHaveClass('pp-card__body', 'b');
    expect(footer.current).toHaveClass('pp-card__footer', 'f');
    expect(footer.current).toHaveStyle({ order: '3' });
  });

  it('has no axe violations: a card with a heading and actions, and a link card, in both themes', async () => {
    const light = renderWithTheme(
      <>
        <Card>
          <CardHeader>
            <Heading level={2} size="sm">
              Billing
            </Heading>
          </CardHeader>
          <CardBody>Next invoice on the 1st.</CardBody>
          <CardFooter>
            <Button variant="outline">Manage</Button>
            <Button variant="ghost">Cancel</Button>
          </CardFooter>
        </Card>
        <Card asChild>
          <a href="/x">
            <CardBody>A link card</CardBody>
          </a>
        </Card>
      </>,
    );
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(
      <Card>
        <CardBody>Alone</CardBody>
      </Card>,
      { theme: 'dark' },
    );
    await expectNoA11yViolations(dark.container);
  });
});
