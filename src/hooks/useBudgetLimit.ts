'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { format } from 'date-fns';

function storageKey(month: string) {
  return `budget_limit_${month}`;
}

// Subscribers in this tab. The `storage` event only fires in OTHER tabs, so
// same-tab writes have to notify explicitly.
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function readLimit(monthKey: string): number | null {
  try {
    const stored = localStorage.getItem(storageKey(monthKey));
    if (!stored) return null;
    const parsed = parseFloat(stored);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Per-month spending limit, persisted in localStorage.
 *
 * Reads through `useSyncExternalStore` rather than syncing storage into state
 * from an effect, so the value is correct on the first render and stays in
 * sync across every component using it.
 */
export function useBudgetLimit(month: Date) {
  const monthKey = format(month, 'yyyy-MM');

  const subscribe = useCallback((onChange: () => void) => {
    listeners.add(onChange);
    window.addEventListener('storage', onChange);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const getSnapshot = useMemo(() => () => readLimit(monthKey), [monthKey]);

  const limit = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const setLimit = useCallback(
    (value: number | null) => {
      if (value === null || value <= 0) {
        localStorage.removeItem(storageKey(monthKey));
      } else {
        localStorage.setItem(storageKey(monthKey), String(value));
      }
      notify();
    },
    [monthKey],
  );

  return { limit, setLimit };
}
