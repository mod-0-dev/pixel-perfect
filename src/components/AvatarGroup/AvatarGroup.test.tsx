import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Avatar } from '../Avatar/Avatar';
import { AvatarGroup } from './AvatarGroup';

const NAMES = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton', 'Mary Jackson'];

function Team(props: Partial<React.ComponentProps<typeof AvatarGroup>> = {}) {
  return (
    <AvatarGroup {...props}>
      {NAMES.map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  );
}

const names = (root: HTMLElement) => Array.from(root.querySelectorAll('[role="img"]')).map((n) => n.getAttribute('aria-label'));

describe('AvatarGroup', () => {
  it('is a list of the children, one per item, all shown without max (spec §1)', () => {
    const { getByRole, getAllByRole } = renderWithTheme(<Team label="Assignees" />);
    const list = getByRole('list', { name: 'Assignees' });
    expect(list.tagName).toBe('UL');
    expect(list).toHaveClass('pp-avatar-group');
    expect(list).toHaveAttribute('data-size', 'md');
    expect(getAllByRole('listitem')).toHaveLength(5);
    for (const li of getAllByRole('listitem')) expect(li).toHaveClass('pp-avatar-group__item');
    expect(names(list)).toEqual(NAMES);
    expect(list.querySelector('.pp-avatar-group__more')).toBeNull();
  });

  it('shows the first max and a count drawn as an avatar, named "n more"; none at or above the count', () => {
    const { getByRole, getAllByRole, rerender } = renderWithTheme(<Team max={3} />);
    expect(getAllByRole('listitem')).toHaveLength(4);
    expect(names(getByRole('list'))).toEqual([...NAMES.slice(0, 3), '2 more']);
    const more = getByRole('img', { name: '2 more' });
    expect(more).toHaveClass('pp-avatar', 'pp-avatar-group__more');
    expect(more).toHaveTextContent('+2');
    expect(more).toHaveAttribute('data-size', 'md');
    expect(more).toHaveAttribute('data-pp-tone', 'neutral');
    rerender(<Team max={5} />);
    expect(getAllByRole('listitem')).toHaveLength(5);
    expect(document.querySelector('.pp-avatar-group__more')).toBeNull();
    rerender(<Team max={0} />);
    expect(getAllByRole('listitem')).toHaveLength(1);
    expect(getByRole('img', { name: '5 more' })).toBeInTheDocument();
  });

  it('takes size for the group and the count, and a moreLabel', () => {
    const { getByRole } = renderWithTheme(<Team max={2} size="sm" moreLabel={(n) => `and ${n} others`} />);
    expect(getByRole('list')).toHaveAttribute('data-size', 'sm');
    expect(getByRole('img', { name: 'and 3 others' })).toHaveAttribute('data-size', 'sm');
  });

  it('forwards the ref and merges className and style', () => {
    const ref = createRef<HTMLUListElement>();
    const { getByRole } = renderWithTheme(
      <AvatarGroup ref={ref} className="mine" style={{ opacity: 0.5 }} data-testid="g">
        <Avatar name="Ada Lovelace" />
      </AvatarGroup>,
    );
    expect(ref.current).toBe(getByRole('list'));
    expect(ref.current).toHaveClass('pp-avatar-group', 'mine');
    expect(ref.current).toHaveStyle({ opacity: '0.5' });
    expect(ref.current).toHaveAttribute('data-testid', 'g');
  });

  it('has no axe violations in both themes', async () => {
    const light = renderWithTheme(<Team max={3} label="Assignees" />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Team />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
