'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction, TransactionException, TransactionFormValues } from '@/types';
import { applyOptimisticEdit, applyOptimisticDelete } from '@/lib/optimisticTransactions';

// Polling is only a safety net: Supabase Realtime delivers changes on web, and
// household-sync broadcasts cover native. 30s keeps that net in place without
// refetching every transaction every few seconds in every open tab (on mobile
// that also burns battery and cellular data). Realtime events, window focus,
// and reconnects all still trigger an immediate refetch.
const POLL_INTERVAL_MS = 30_000;

export type EditMode = 'all' | 'all_future' | 'this_only';
export type DeleteMode = 'all' | 'all_future' | 'this_only';

export interface TransactionsData {
  transactions: Transaction[];
  exceptions: TransactionException[];
}

const QK = ['transactions'] as const;

async function fetchTransactions(): Promise<TransactionsData> {
  const res = await fetch('/api/transactions');
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export function useTransactions() {
  return useQuery<TransactionsData>({
    queryKey: QK,
    queryFn: fetchTransactions,
    staleTime: 0,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useCreateTransaction(accountId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, account_id: accountId ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create transaction');
      return data;
    },
    onMutate: async (values) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<TransactionsData>(QK);
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: Transaction = {
        id: optimisticId,
        user_id: '',
        account_id: accountId ?? null,
        name: values.name,
        amount: Number(values.amount),
        category: values.category,
        type: values.type ?? 'one_off',
        date: values.date ?? null,
        frequency: values.frequency ?? null,
        end_date: values.end_date ?? null,
        tag: values.tag ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (prev) {
        qc.setQueryData<TransactionsData>(QK, {
          ...prev,
          transactions: [...prev.transactions, optimistic],
        });
      }
      return { prev, optimisticId };
    },
    onSuccess: (data, _vars, ctx) => {
      // Replace the optimistic placeholder with the real server item (gets real ID)
      if (!data?.transaction || !ctx?.optimisticId) return;
      const current = qc.getQueryData<TransactionsData>(QK);
      if (!current) return;
      qc.setQueryData<TransactionsData>(QK, {
        ...current,
        transactions: current.transactions.map((t) =>
          t.id === ctx.optimisticId ? data.transaction : t,
        ),
      });
    },
    onError: (_err, _vars, ctx) => {
      // TypeError = network failure. Keep the optimistic entry — useOfflineCreate
      // will queue it for sync when connectivity returns.
      if (_err instanceof TypeError) return;
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
    },
    onSettled: (_data, err) => {
      // Don't invalidate on network errors — the optimistic entry stays until synced
      if (err instanceof TypeError) return;
      qc.invalidateQueries({ queryKey: QK });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      editMode,
      effectiveFrom,
      values,
    }: {
      id: string;
      editMode: EditMode;
      effectiveFrom?: string;
      values: Partial<TransactionFormValues>;
    }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, editMode, effectiveFrom }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update transaction');
      return data;
    },
    onMutate: async ({ id, editMode, effectiveFrom, values }) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<TransactionsData>(QK);
      if (prev) {
        // Mirror exactly what the route handler will write, so the refetch that
        // follows produces identical data and the balances never visibly jump.
        // A null result means the change cannot be reproduced faithfully
        // (date move, type switch); leave the cache alone and wait for truth.
        const next = applyOptimisticEdit(prev, { id, editMode, effectiveFrom, values });
        if (next) qc.setQueryData<TransactionsData>(QK, next);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
    },
    onSuccess: (data, { id, values }) => {
      const current = qc.getQueryData<TransactionsData>(QK);
      if (!current) return;
      if (data?.transaction) {
        // one_off or editMode=all — full row returned
        qc.setQueryData<TransactionsData>(QK, {
          ...current,
          transactions: current.transactions.map((t) =>
            t.id === id ? { ...t, ...data.transaction } : t,
          ),
        });
      } else {
        // all_future / this_only — row-level fields updated but no transaction returned.
        // Patch only the fields that were actually sent so the cache reflects DB truth.
        const rowPatch: Record<string, unknown> = {};
        if (values.account_id !== undefined) rowPatch.account_id = values.account_id ?? null;
        if (values.category   !== undefined) rowPatch.category   = values.category;
        if (values.frequency  !== undefined) rowPatch.frequency  = values.frequency ?? null;
        if (Object.keys(rowPatch).length > 0) {
          qc.setQueryData<TransactionsData>(QK, {
            ...current,
            transactions: current.transactions.map((t) =>
              t.id === id ? { ...t, ...rowPatch } : t,
            ),
          });
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      deleteMode,
      effectiveFrom,
    }: {
      id: string;
      deleteMode: DeleteMode;
      effectiveFrom?: string;
    }) => {
      const params = new URLSearchParams({ deleteMode });
      if (effectiveFrom) params.set('effectiveFrom', effectiveFrom);
      const res = await fetch(`/api/transactions/${id}?${params}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete transaction');
      return data;
    },
    onMutate: async ({ id, deleteMode, effectiveFrom }) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<TransactionsData>(QK);
      if (prev) {
        // Mirrors the route handler, including the restore exception that keeps
        // a single-occurrence delete from hiding every later occurrence.
        const next = applyOptimisticDelete(prev, { id, deleteMode, effectiveFrom });
        if (next) qc.setQueryData<TransactionsData>(QK, next);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK, refetchType: 'none' });
    },
  });
}
