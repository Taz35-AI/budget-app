'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction, TransactionException, TransactionFormValues } from '@/types';

export type EditMode = 'all' | 'all_future' | 'this_only';
export type DeleteMode = 'all' | 'all_future' | 'this_only';

export interface TransactionsData {
  transactions: Transaction[];
  exceptions: TransactionException[];
}

async function fetchTransactions(): Promise<TransactionsData> {
  const res = await fetch('/api/transactions');
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export function useTransactions() {
  return useQuery<TransactionsData>({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    staleTime: 0,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create transaction');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
