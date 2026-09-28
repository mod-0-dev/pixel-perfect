/*
 * A Server Component page; the Tree is a client component that holds what
 * is open and what is picked when uncontrolled. Every instance here is
 * uncontrolled.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { Tree, TreeItem } from 'pixel-perfect';

import { Matrix } from '../../../harness/Matrix';

function Folder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function File() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13H7V3Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function Files({ label = 'Files' }: { label?: string }) {
  return (
    <Tree label={label} defaultExpanded={['docs', 'src', 'components']} defaultSelected="button">
      <TreeItem value="docs" label="docs" icon={<Folder />}>
        <TreeItem value="readme" label="README.md" icon={<File />} />
        <TreeItem value="spec" label="a-specification-with-a-very-long-file-name-that-truncates.md" icon={<File />} />
      </TreeItem>
      <TreeItem value="src" label="src" icon={<Folder />}>
        <TreeItem value="components" label="components" icon={<Folder />}>
          <TreeItem value="button" label="Button.tsx" icon={<File />} />
          <TreeItem value="input" label="Input.tsx" icon={<File />} />
        </TreeItem>
        <TreeItem value="index" label="index.ts" icon={<File />} />
      </TreeItem>
      <TreeItem value="lock" label="package-lock.json" icon={<File />} disabled />
      <TreeItem value="license" label="LICENSE" icon={<File />} />
    </Tree>
  );
}

export default function TreeDemoPage() {
  return (
    <>
      <h1>5.11 Tree</h1>
      <p>
        A hierarchy to walk and pick from: the ARIA tree view, one tab stop, the arrows to move, expand
        and collapse; expansion and selection each controlled or uncontrolled. Rows on the control
        scale, indented by level through one custom property.
      </p>

      <section>
        <h2>At every width</h2>
        <p>Three levels, Button.tsx picked, one item disabled. A long label truncates.</p>
        <Matrix>
          <Files />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>Closed</h2>
        <p>Nothing expanded: the first item is the tab stop.</p>
        <div data-testid="tree-closed">
          <Tree label="Sections">
            <TreeItem value="intro" label="Introduction">
              <TreeItem value="intro-1" label="Why" />
            </TreeItem>
            <TreeItem value="usage" label="Usage">
              <TreeItem value="usage-1" label="Install" />
            </TreeItem>
          </Tree>
        </div>
      </section>

      <section>
        <h2>Right to left</h2>
        <p>Indented from the right; the chevrons point the way the hierarchy runs; Arrow Left expands.</p>
        <div dir="rtl" data-testid="tree-rtl">
          <Files label="الملفات" />
        </div>
      </section>
    </>
  );
}
