'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

const getSnapshot = () => navigator.onLine;

// The server can't know the client's connectivity; assume online so the first
// paint doesn't flash an offline banner.
const getServerSnapshot = () => true;

/**
 * Tracks browser connectivity.
 *
 * `useSyncExternalStore` reads `navigator.onLine` during render rather than
 * syncing it into state from an effect, so there's no extra render pass and no
 * window where the hook reports a stale value.
 */
export function useIsOnline() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
