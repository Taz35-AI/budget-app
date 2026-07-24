'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False during server render and the first client render, true once React has
 * hydrated and event handlers are actually attached.
 *
 * Needed because a form whose submit is handled in JS will fall back to a
 * NATIVE browser submit if the user interacts before hydration finishes — the
 * page reloads and the sign-in never runs, which reads to the user as "login is
 * broken". That window is invisible on a fast connection and very reachable on
 * a slow one, so the submit button stays disabled until this returns true.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
