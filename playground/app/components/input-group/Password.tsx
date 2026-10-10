'use client';

import { IconButton, Input, InputGroup, InputGroupAddon } from '@mod-0-dev/pixel-perfect';
import { useState } from 'react';

function EyeGlyph({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M3 3l18 18" /> : null}
    </svg>
  );
}

/** A reveal is state, so it is the one client part of this page. */
export function Password() {
  const [shown, setShown] = useState(false);
  return (
    <InputGroup>
      <Input type={shown ? 'text' : 'password'} defaultValue="correct horse" autoComplete="off" />
      <InputGroupAddon>
        <IconButton
          label={shown ? 'Hide password' : 'Show password'}
          size="sm"
          variant="ghost"
          onClick={() => setShown((s) => !s)}
        >
          <EyeGlyph off={shown} />
        </IconButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
