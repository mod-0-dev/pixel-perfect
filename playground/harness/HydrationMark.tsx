'use client';

import { useEffect } from 'react';

/**
 * Writes `data-hydrated` on `<html>` once the page has hydrated, and removes
 * it on unmount. Rendered by the root layout AFTER the page, so its effect
 * runs after every effect in the page's tree.
 *
 * FOR THE HARNESS, NOT FOR THE LIBRARY (D-093 §5). `page.goto` resolves on
 * `load`; React hydrates after that, on its own scheduler, and on a loaded
 * runner nothing says the gap is closed before a test focuses an input,
 * clicks a button or sets an attribute on a page that is about to be taken
 * over. The harness's `test` fixture waits for this attribute after every
 * navigation, so a test acts on a page that is live. Nothing in the library
 * reads it, and it styles nothing.
 */
export function HydrationMark() {
  useEffect(() => {
    document.documentElement.setAttribute('data-hydrated', '');
    return () => document.documentElement.removeAttribute('data-hydrated');
  }, []);
  return null;
}
