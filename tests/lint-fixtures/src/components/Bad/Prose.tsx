// A SHIPPED file (no .test suffix, not under test/) that has no 'use client'
// directive and must NOT be flagged for one. Every client-only name below is
// prose, a string or a type — none of them is a call. The self-test asserts the
// 'use client' rule fires exactly once across these fixtures, for Bad.tsx, so
// this file firing would break it.
//
// Ids come from useId() in the component that owns them, never here.

const NOT_A_CALL = 'useState(false)';

interface Note {
  /** Set by useEffect() somewhere else entirely. */
  label: string;
}

export const prose: [string, Note] = [NOT_A_CALL, { label: 'useRef<HTMLElement>(null)' }];
