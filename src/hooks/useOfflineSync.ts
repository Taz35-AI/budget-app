'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { pending, dequeue } = useOfflineQueueStore();
  const qc = useQueryClient();
  const drainingRef = useRef(false);

  const drain = useCallback(async () => {
    if (drainingRef.current || pending.length === 0) return;
    drainingRef.current = true;
    setIsSyncing(true);

    let syncedAny = false;
    for (const item of [...pending]) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item.values, account_id: item.accountId ?? null }),
        });
        if (!res.ok) break; // server error — retry later
        dequeue(item.queueId);
        syncedAny = true;
      } catch {
        break; // network still down — stop draining
      }
    }

    if (syncedAny) {
      // Refetch so optimistic entries are replaced with real server data
      await qc.invalidateQueries({ queryKey: ['transactions'] });
    }

    setIsSyncing(false);
    drainingRef.current = false;
  }, [pending, dequeue, qc]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      drain();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [drain]);

  // Attempt drain on mount in case items were queued before a page reload
  useEffect(() => {
    if (isOnline && pending.length > 0) drain();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, isSyncing, pendingCount: pending.length };
}
