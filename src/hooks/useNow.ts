'use client';

import { useSyncExternalStore } from 'react';

/**
 * The current time, as a React-safe external store.
 *
 * Calling `Date.now()` while rendering makes a component impure: two renders
 * with identical props can produce different output. The clock is an external
 * mutable source, so it's read through `useSyncExternalStore` instead — the
 * snapshot is cached and only changes on a tick, which keeps renders
 * deterministic and lets React re-render when the value genuinely moves.
 *
 * Ticks once a minute, which is ample for the day-granularity countdowns this
 * powers (goal deadlines) and costs one timer no matter how many components
 * subscribe.
 */

const TICK_MS = 60_000;

let cachedNow = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  if (timer === null) {
    cachedNow = Date.now();
    timer = setInterval(() => {
      cachedNow = Date.now();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

// Must return the cached value, not a fresh Date.now(): a changing snapshot on
// every read would make React re-render forever.
const getSnapshot = () => cachedNow;

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
