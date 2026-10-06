/*
 * The theme lab (D-103 §4). A Server Component around one client island:
 * the generator and the checks run in the browser, in ThemeLab.tsx.
 */
import type { Metadata } from 'next';

import { ThemeLab } from './ThemeLab';
import './theme.css';

export const metadata: Metadata = {
  title: 'Theme — pixel-perfect',
  description: 'Your brand colour, solved by the library’s own generator and proven by its own contrast checks.',
};

export default function ThemePage() {
  return (
    <>
      <h1>Your accent, solved</h1>
      <p>
        Pick a brand colour. The library&rsquo;s own generator solves its ramps around it — twelve steps
        in each theme, the solid fill walked only as far as its text needs, every focus ring re-solved
        against every surface — and its own contrast checks run on the stylesheet it writes. Other
        libraries hand you a palette; this one hands you the palette and the proof.
      </p>
      <ThemeLab />
    </>
  );
}
