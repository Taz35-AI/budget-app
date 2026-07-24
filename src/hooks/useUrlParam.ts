'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Reads a single query-string value on the client.
 *
 * Deliberately NOT next/navigation's `useSearchParams()`: that opts the whole
 * page out of prerendering (`BAILOUT_TO_CLIENT_SIDE_RENDERING`), so the server
 * ships only the Suspense fallback and the user sees an empty screen until the
 * JS bundle loads. On the login page that meant a blank page and unclickable
 * buttons on slow connections.
 *
 * Reading `window.location.search` through an external store keeps the page
 * statically prerendered — the markup arrives complete and the param-dependent
 * bit fills in on hydration.
 *
 * Only reflects client-side navigations that emit popstate; that's sufficient
 * for entry-point params like `?reason=timeout`.
 */
export function useUrlParam(name: string): string | null {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);

  const getSnapshot = useCallback(() => {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch {
      return null;
    }
  }, [name]);

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
