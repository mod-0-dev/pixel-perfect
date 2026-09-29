import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoA11yViolations, renderWithTheme } from '../../test';
import { Tree, TreeItem } from './Tree';

function Files(props: Partial<React.ComponentProps<typeof Tree>> = {}) {
  return (
    <Tree label="Files" {...props}>
      <TreeItem value="docs" label="docs">
        <TreeItem value="readme" label="README.md" />
        <TreeItem value="spec" label="spec.md" />
      </TreeItem>
      <TreeItem value="src" label="src">
        <TreeItem value="components" label="components">
          <TreeItem value="button" label="Button.tsx" />
        </TreeItem>
        <TreeItem value="index" label="index.ts" />
      </TreeItem>
      <TreeItem value="lock" label="package-lock.json" disabled />
      <TreeItem value="readme-root" label="README" />
    </Tree>
  );
}

const item = (value: string) => document.querySelector(`[data-value="${value}"]`) as HTMLElement;
const visible = () => Array.from(document.querySelectorAll('[role="treeitem"]')).map((n) => n.getAttribute('data-value'));
const tabStops = () => Array.from(document.querySelectorAll('[role="treeitem"][tabindex="0"]')).map((n) => n.getAttribute('data-value'));

describe('Tree', () => {
  it('is a named tree of treeitems with levels; parents say expanded and render a group only when open (spec §1)', () => {
    const { getByRole } = renderWithTheme(<Files defaultExpanded={['docs']} />);
    const tree = getByRole('tree', { name: 'Files' });
    expect(tree.tagName).toBe('UL');
    expect(tree).toHaveClass('pp-tree');
    expect(visible()).toEqual(['docs', 'readme', 'spec', 'src', 'lock', 'readme-root']);
    expect(item('docs')).toHaveAttribute('aria-expanded', 'true');
    expect(item('docs')).toHaveAttribute('data-state', 'open');
    expect(item('src')).toHaveAttribute('aria-expanded', 'false');
    expect(item('readme')).not.toHaveAttribute('aria-expanded');
    expect(item('readme')).toHaveAttribute('aria-level', '2');
    expect(item('docs')).toHaveAttribute('aria-level', '1');
    /* The row owns its group, a sibling in the presentational <li>. */
    const group = item('docs').parentElement!.querySelector('[role="group"]')!;
    expect(group).toHaveClass('pp-tree__group');
    expect(item('docs').getAttribute('aria-owns')).toBe(group.id);
    expect(item('docs').parentElement).toHaveAttribute('role', 'none');
    expect(item('src').parentElement!.querySelector('[role="group"]')).toBeNull();
    expect(item('src')).not.toHaveAttribute('aria-owns');
    expect(getByRole('treeitem', { name: 'README.md' })).toBe(item('readme'));
    expect(item('lock')).toHaveAttribute('aria-disabled', 'true');
    /* A parent's toggle draws the chevron; a leaf's is an empty Icon of the
       same size, so labels line up. */
    expect(item('docs').querySelector('.pp-tree__toggle svg path')).not.toBeNull();
    expect(item('readme').querySelector('.pp-tree__toggle svg path')).toBeNull();
  });

  it('has one tab stop: the selected item when rendered, else the first (spec §2)', () => {
    const first = renderWithTheme(<Files defaultExpanded={['docs']} defaultSelected="spec" />);
    expect(tabStops()).toEqual(['spec']);
    expect(item('spec')).toHaveAttribute('aria-selected', 'true');
    expect(item('spec')).toHaveAttribute('data-selected');
    expect(item('docs')).toHaveAttribute('aria-selected', 'false');
    first.unmount();
    renderWithTheme(<Files />);
    expect(tabStops()).toEqual(['docs']);
  });

  describe('keyboard (spec §2)', () => {
    it('moves down and up through the visible items, to the ends, and skips a disabled one', async () => {
      const user = userEvent.setup();
      renderWithTheme(<Files defaultExpanded={['docs']} />);
      item('docs').focus();
      await user.keyboard('{ArrowDown}');
      expect(item('readme')).toHaveFocus();
      await user.keyboard('{ArrowDown}{ArrowDown}');
      expect(item('src')).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(item('readme-root')).toHaveFocus();
      expect(tabStops()).toEqual(['readme-root']);
      await user.keyboard('{ArrowUp}');
      expect(item('src')).toHaveFocus();
      await user.keyboard('{Home}');
      expect(item('docs')).toHaveFocus();
      await user.keyboard('{End}');
      expect(item('readme-root')).toHaveFocus();
    });

    it('Right expands a closed parent, then moves into it; Left collapses an open one, then moves to the parent', async () => {
      const user = userEvent.setup();
      const onExpandedChange = vi.fn();
      renderWithTheme(<Files onExpandedChange={onExpandedChange} />);
      item('src').focus();
      await user.keyboard('{ArrowRight}');
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
      expect(onExpandedChange).toHaveBeenLastCalledWith(['src']);
      expect(item('src')).toHaveFocus();
      await user.keyboard('{ArrowRight}');
      expect(item('components')).toHaveFocus();
      await user.keyboard('{ArrowRight}{ArrowRight}');
      expect(item('button')).toHaveFocus();
      await user.keyboard('{ArrowRight}');
      expect(item('button')).toHaveFocus();
      await user.keyboard('{ArrowLeft}');
      expect(item('components')).toHaveFocus();
      await user.keyboard('{ArrowLeft}');
      expect(item('components')).toHaveAttribute('aria-expanded', 'false');
      expect(item('button')).toBeUndefined;
      expect(document.querySelector('[data-value="button"]')).toBeNull();
      await user.keyboard('{ArrowLeft}');
      expect(item('src')).toHaveFocus();
      await user.keyboard('{ArrowLeft}');
      expect(item('src')).toHaveAttribute('aria-expanded', 'false');
      expect(onExpandedChange).toHaveBeenLastCalledWith([]);
    });

    it('Enter and Space select, and toggle a parent; a disabled item is not selectable', async () => {
      const user = userEvent.setup();
      const onSelectedChange = vi.fn();
      renderWithTheme(<Files defaultExpanded={['docs']} onSelectedChange={onSelectedChange} />);
      item('readme').focus();
      await user.keyboard('{Enter}');
      expect(onSelectedChange).toHaveBeenLastCalledWith('readme');
      expect(item('readme')).toHaveAttribute('aria-selected', 'true');
      await user.keyboard('{ArrowUp} ');
      expect(onSelectedChange).toHaveBeenLastCalledWith('docs');
      expect(item('docs')).toHaveAttribute('aria-expanded', 'false');
      expect(document.querySelector('[data-value="readme"]')).toBeNull();
    });
  });

  it('a press on the row selects and toggles a parent; on the chevron alone it toggles; a child\'s press is the child\'s', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    const onExpandedChange = vi.fn();
    renderWithTheme(<Files defaultExpanded={['docs']} onSelectedChange={onSelectedChange} onExpandedChange={onExpandedChange} />);
    await user.click(item('readme').querySelector('.pp-tree__label')!);
    expect(onSelectedChange).toHaveBeenLastCalledWith('readme');
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(item('readme')).toHaveFocus();
    await user.click(item('docs').querySelector('.pp-tree__toggle')!);
    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
    await user.click(item('src').querySelector('.pp-tree__label')!);
    expect(onSelectedChange).toHaveBeenLastCalledWith('src');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['src']);
    await user.click(item('lock').querySelector('.pp-tree__label')!);
    expect(onSelectedChange).toHaveBeenLastCalledWith('src');
  });

  function Owner() {
    const [expanded, setExpanded] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | undefined>();
    return (
      <>
        <output>{`${expanded.join(',')}|${selected ?? ''}`}</output>
        <Files expanded={expanded} onExpandedChange={setExpanded} selected={selected} onSelectedChange={setSelected} />
      </>
    );
  }

  it('is controllable for both states, and holds when the owner does not store', async () => {
    const user = userEvent.setup();
    const { getByText, unmount } = renderWithTheme(<Owner />);
    await user.click(item('docs').querySelector('.pp-tree__label')!);
    expect(getByText('docs|docs')).toBeInTheDocument();
    expect(item('readme')).toBeInTheDocument();
    unmount();
    renderWithTheme(<Files expanded={[]} selected="src" />);
    await user.click(item('docs').querySelector('.pp-tree__label')!);
    expect(document.querySelector('[data-value="readme"]')).toBeNull();
    expect(item('src')).toHaveAttribute('aria-selected', 'true');
  });

  it('requires a label at the type level, and throws for an item outside a tree', () => {
    // @ts-expect-error — `label` is required.
    const bad = <Tree />;
    expect(bad).toBeTruthy();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<TreeItem value="x" label="x" />)).toThrow(/<TreeItem> must be rendered inside <Tree>/);
    error.mockRestore();
  });

  it('forwards refs and merges className and style, keeping the level variable', () => {
    const tree = createRef<HTMLUListElement>();
    const node = createRef<HTMLLIElement>();
    renderWithTheme(
      <Tree ref={tree} label="T" className="t" style={{ opacity: 0.5 }} data-testid="tree">
        <TreeItem ref={node} value="a" label="A" className="i" style={{ order: 1 }} data-testid="a" />
      </Tree>,
    );
    expect(tree.current).toHaveClass('pp-tree', 't');
    expect(tree.current).toHaveStyle({ opacity: '0.5' });
    expect(tree.current).toHaveAttribute('data-testid', 'tree');
    expect(node.current).toHaveClass('pp-tree__item', 'i');
    expect(node.current).toHaveStyle({ order: '1' });
    expect(node.current!.style.getPropertyValue('--_pp-tree-level')).toBe('1');
    expect(node.current).toHaveAttribute('data-testid', 'a');
    expect(node.current!.querySelector('[role="treeitem"]')).toHaveAttribute('data-value', 'a');
  });

  it('has no axe violations in both themes', async () => {
    const light = renderWithTheme(<Files defaultExpanded={['docs', 'src']} defaultSelected="readme" />);
    await expectNoA11yViolations(light.container);
    light.unmount();
    const dark = renderWithTheme(<Files />, { theme: 'dark' });
    await expectNoA11yViolations(dark.container);
  });
});
