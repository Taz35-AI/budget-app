'use client';

/**
 * useOfflinePersist
 *
 * Persists the React Query cache for offline reads.
 *
 *  - On mount: eagerly hydrates the cache from Capacitor Preferences (native)
 *    or localStorage (web) so the dashboard has cached data to render before
 *    the first network fetch completes — or instead of it, if offline.
 *  - While running: subscribes to the query cache and writes back any
 *    successful query whose top-level key matches PERSISTED_KEYS.
 *
 * Storage namespace: `spentum:cache:<key>:v<VERSION>`.
 * Bumping VERSION invalidates old cached payloads after a schema change.
 *
 * Why hand-rolled instead of @tanstack/react-query-persist-client:
 *  - We only persist 3 specific queries, not the entire cache.
 *  - Avoids a 7kB+ dep for a tiny surface area.
 *  - Uses Capacitor Preferences directly so the native side gets durable
 *    storage outside of WebView localStorage (which can be evicted under
 *    storage pressure on iOS).
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';

const PERSISTED_KEYS = ['transactions', 'balances', 'accounts'] as const;
const VERSION = 1;

interface PersistedEntry {
  v: number;
  ts: string;
  data: unknown;
}

function storageKey(queryKey: string): string {
  return `spentum:cache:${queryKey}:v${VERSION}`;
}

async function readEntry(key: string): Promise<PersistedEntry | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key });
      return value ? (JSON.parse(value) as PersistedEntry) : null;
    }
    if (typeof window === 'undefined') return null;
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as PersistedEntry) : null;
  } catch {
    return null;
  }
}

async function writeEntry(key: string, entry: PersistedEntry): Promise<void> {
  try {
    const value = JSON.stringify(entry);
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key, value });
      return;
    }
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  } catch {
    /* quota exceeded / serialization failure — silently drop */
  }
}

export function useOfflinePersist() {
  const qc = useQueryClient();

  // Hydrate from disk on mount, before the first network fetch resolves
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const key of PERSISTED_KEYS) {
        const entry = await readEntry(storageKey(key));
        if (cancelled) return;
        if (!entry || entry.v !== VERSION) continue;

        // Don't overwrite a fresh fetch if it raced ahead of hydration
        const existing = qc.getQueryData([key]);
        if (existing === undefined) {
          qc.setQueryData([key], entry.data);
        }
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to cache changes and persist successful results
  useEffect(() => {
    const cache = qc.getQueryCache();
    const unsub = cache.subscribe((event) => {
      if (event.type !== 'updated') return;
      const query = event.query;
      if (query.state.status !== 'success') return;

      const top = query.queryKey[0];
      if (typeof top !== 'string') return;
      if (!PERSISTED_KEYS.includes(top as typeof PERSISTED_KEYS[number])) return;

      writeEntry(storageKey(top), {
        v: VERSION,
        ts: new Date().toISOString(),
        data: query.state.data,
      });
    });
    return () => unsub();
  }, [qc]);
}
