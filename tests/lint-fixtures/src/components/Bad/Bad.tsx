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
