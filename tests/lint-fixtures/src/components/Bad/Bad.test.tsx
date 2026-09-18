// A test file that uses client-only React and has NO 'use client' directive.
// It must NOT be flagged: tsconfig.build.json excludes *.test.tsx from the
// package, so nothing here is ever evaluated by a React Server Component.
// scripts/test-lint.mjs asserts the absence, so the narrowing cannot silently
// widen into "the rule no longer fires anywhere".
import { useState } from 'react';

export function Owner() {
  const [on, setOn] = useState(false);
  return { on, setOn };
}
