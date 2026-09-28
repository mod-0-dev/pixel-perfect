// A SHIPPED file with no 'use client' that calls useId() — and is NOT a
// violation: React's server dispatcher implements useId, so a Server
// Component may name one element by another with it (Table, D-081 §4). The
// self-test's count of exactly one 'use client' hit, for Bad.tsx, is what
// says this file was not flagged.
import { useId } from 'react';

export function Ids() {
  const id = useId();
  return <div aria-labelledby={id}>{id}</div>;
}
