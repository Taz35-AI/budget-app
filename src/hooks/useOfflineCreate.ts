'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateTransaction } from '@/hooks/useTransactions';
import type { TransactionsData } from '@/hooks/useTransactions';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import type { TransactionFormValues } from '@/types';

const QK = ['transactions'] as const;

/**
 * Wraps useCreateTransaction with two-layer offline awareness:
 *
 * Layer 1 — navigator.onLine check (fast path when browser knows it's offline)
 * Layer 2 — catch TypeError from mutateAsync (covers cases where the OS reports
 *            online but the request fails — common on mobile in airplane mode)
 *
 * In both cases: the optimistic entry is written to the React Query cache and
 * the item is queued in the persisted offline store for sync on reconnect.
 * (useCreateTransaction.onError skips rollback for TypeErrors so the optimistic
 *  entry survives until the sync drain invalidates the query.)
 */
export function useOfflineCreate(accountId?: string | null) {
  const qc = useQueryClient();
  const create = useCreateTransaction(accountId ?? undefined);
  const enqueue = useOfflineQueueStore((s) => s.enqueue);

  /** Adds the optimistic transaction to the RQ cache and queues it for sync. */
  const goOffline = useCallback(
    (values: TransactionFormValues, optimisticId: string) => {
      qc.setQueryData<TransactionsData>(QK, (old) => {
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
    },
    [qc, enqueue, accountId],
  );

  const submit = useCallback(
    async (values: TransactionFormValues, callbacks: { onSuccess?: () => void } = {}) => {
      // Layer 1: browser says offline → skip the request entirely
      if (!navigator.onLine) {
        goOffline(values, `optimistic-${Date.now()}`);
        callbacks.onSuccess?.();
        return;
      }

      // Layer 2: attempt the request; catch network failures
      try {
        create.reset();
        await create.mutateAsync(values);
        callbacks.onSuccess?.();
      } catch (err) {
        if (err instanceof TypeError) {
          // Network error — the optimistic entry from onMutate was NOT rolled back
          // (useCreateTransaction.onError skips rollback for TypeErrors).
          // Just enqueue the item; useOfflineSync will replace the optimistic
          // entry with real data when connectivity is restored.
          enqueue({
            queueId: `q-${Date.now()}-${Math.random()}`,
            values,
            accountId: accountId ?? null,
            optimisticId: '', // sync uses invalidateQueries, ID not needed
            queuedAt: new Date().toISOString(),
          });
          callbacks.onSuccess?.();
        }
        // Server errors (4xx/5xx): leave mutation in error state so the form can show them
      }
    },
    [create, goOffline, enqueue, accountId],
  );

  return { submit, isPending: create.isPending, isError: create.isError, error: create.error };
}
