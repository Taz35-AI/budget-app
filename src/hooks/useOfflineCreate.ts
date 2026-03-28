'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateTransaction } from '@/hooks/useTransactions';
import type { TransactionsData } from '@/hooks/useTransactions';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import type { TransactionFormValues } from '@/types';

/**
 * Wraps useCreateTransaction with offline awareness.
 * - Online  → delegates straight to the React Query mutation (optimistic cache update included).
 * - Offline → writes optimistic entry to cache manually and queues for sync on reconnect.
 */
export function useOfflineCreate(accountId?: string | null) {
  const qc = useQueryClient();
  const create = useCreateTransaction(accountId ?? undefined);
  const enqueue = useOfflineQueueStore((s) => s.enqueue);

  const submit = useCallback(
    (values: TransactionFormValues, callbacks: { onSuccess?: () => void } = {}) => {
      if (!navigator.onLine) {
        const optimisticId = `optimistic-${Date.now()}`;
        qc.setQueryData<TransactionsData>(['transactions'], (old) => {
          if (!old) return old;
          return {
            ...old,
            transactions: [
              ...old.transactions,
              {
                id: optimisticId,
                user_id: '',
                account_id: accountId ?? null,
                name: values.name,
                amount: Number(values.amount),
                category: values.category,
                type: values.type ?? 'one_off',
                date: values.date ?? null,
                start_date: values.start_date ?? null,
                frequency: values.frequency ?? null,
                end_date: values.end_date ?? null,
                tag: values.tag ?? null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          };
        });
        enqueue({
          queueId: `q-${Date.now()}-${Math.random()}`,
          values,
          accountId: accountId ?? null,
          optimisticId,
          queuedAt: new Date().toISOString(),
        });
        callbacks.onSuccess?.();
        return;
      }
      create.reset();
      create.mutate(values, { onSuccess: callbacks.onSuccess });
    },
    [create, qc, enqueue, accountId],
  );

  return { submit, isPending: create.isPending, isError: create.isError, error: create.error };
}
