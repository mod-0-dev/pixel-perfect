'use client';

import { Pagination } from '@mod-0-dev/pixel-perfect';

/**
 * A function cannot cross from a Server Component page into a client
 * component, so the linked pagination — whose `getHref` is one — is
 * rendered from this client file (CommandPalette's page has the same
 * shape, D-078).
 */
export function LinkedPagination() {
  return <Pagination count={12} defaultPage={6} getHref={(p) => `/components/pagination?page=${p}`} label="Linked" />;
}
