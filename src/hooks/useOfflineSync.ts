'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import type { TransactionsData } from '@/hooks/useTransactions';

const QK = ['transactions'] as const;

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const { pending, dequeue } = useOfflineQueueStore();
  const qc = useQueryClient();
  const drainingRef = useRef(false);

  const drain = useCallback(async () => {
    if (drainingRef.current || pending.length === 0) return;
    drainingRef.current = true;
    setIsSyncing(true);

    for (const item of [...pending]) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item.values, account_id: item.accountId ?? null }),
        });
        if (!res.ok) break; // still having issues, stop draining
        const saved = await res.json();

        // Replace optimistic entry in cache with real data
        qc.setQueryData<TransactionsData>(QK, (old) => {
          if (!old) return old;
          return {
            ...old,
            transactions: old.transactions.map((t) =>
              t.id === item.optimisticId ? { ...t, ...saved } : t,
            ),
          };
        });

        dequeue(item.queueId);
      } catch {
        break; // network error — stop and retry next time we come online
      }
    }

    setIsSyncing(false);
    drainingRef.current = false;
  }, [pending, dequeue, qc]);

  useEffect(() => {
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

  // Attempt drain on mount in case we queued items before a page reload
  useEffect(() => {
    if (isOnline && pending.length > 0) drain();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, isSyncing, pendingCount: pending.length };
}
