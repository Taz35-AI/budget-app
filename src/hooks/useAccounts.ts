'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BudgetAccount } from '@/types';

const QK = ['accounts'] as const;

async function fetchAccounts(): Promise<BudgetAccount[]> {
  const res = await fetch('/api/accounts');
  if (!res.ok) throw new Error('Failed to fetch accounts');
  const data = await res.json();
  return data.accounts;
}

export function useAccounts() {
  return useQuery<BudgetAccount[]>({
    queryKey: QK,
    queryFn: fetchAccounts,
    staleTime: 60_000,
  });
}

export interface CreateAccountPayload {
  name: string;
  type: import('@/types').AccountType;
  credit_limit?: number | null;
}

export interface UpdateAccountPayload {
  id: string;
  name: string;
  type: import('@/types').AccountType;
  credit_limit?: number | null;
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAccountPayload) => {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create account');
      return data.account as BudgetAccount;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, type, credit_limit }: UpdateAccountPayload) => {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, credit_limit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update account');
      return data.account as BudgetAccount;
    },
    onMutate: async ({ id, name, type, credit_limit }) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<BudgetAccount[]>(QK);
      if (prev) {
        qc.setQueryData<BudgetAccount[]>(QK, prev.map((a) => (a.id === id ? { ...a, name, type, credit_limit } : a)));
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete account');
      return data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<BudgetAccount[]>(QK);
      if (prev) {
        qc.setQueryData<BudgetAccount[]>(QK, prev.filter((a) => a.id !== id));
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
    },
    onSuccess: () => {
      // Transactions for this account are deleted by DB cascade — invalidate
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: QK });
    },
  });
}
