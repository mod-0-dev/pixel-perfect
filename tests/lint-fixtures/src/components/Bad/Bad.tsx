// Deliberate violations for the rule-lint self-test.
import { useState } from 'react';

const initialTheme = window.localStorage.getItem('theme');

export interface BadProps {
  fullWidth?: boolean;
  maxWidth?: string;
  mt?: number;
  as?: string;
  tone?: 'neutral' | 'accent';
}

export function Bad(props: BadProps) {
  const [open] = useState(false);
  return { props, open, initialTheme };
}

// The word document in a comment is not an access. Nor is it in a string, a
// type, or a function body. None of these may be flagged (self-test asserts).
const NOT_AN_ACCESS = 'the document outline';
interface Outline {
  /** which document level */
  level: number;
}
function later(): number {
  return document.body.childElementCount + window.innerWidth;
}
export const uses: [string, Outline, typeof later] = [NOT_AN_ACCESS, { level: 1 }, later];
