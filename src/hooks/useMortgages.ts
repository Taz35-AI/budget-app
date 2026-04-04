'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Mortgage } from '@/types';

const QK = ['mortgages'] as const;

async function fetchMortgages(): Promise<Mortgage[]> {
  const res = await fetch('/api/mortgages');
  if (!res.ok) throw new Error('Failed to fetch mortgages');
  const data = await res.json();
  return data.mortgages ?? [];
}

export function useMortgages() {
  return useQuery<Mortgage[]>({
    queryKey: QK,
    queryFn: fetchMortgages,
    staleTime: 60_000,
  });
}

export interface CreateMortgagePayload {
  name: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  tag_id: string;
}

export function useCreateMortgage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMortgagePayload) => {
      const res = await fetch('/api/mortgages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create mortgage');
      return data.mortgage as Mortgage;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useDeleteMortgage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mortgages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete mortgage');
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export type UpdateMortgagePayload = Partial<Omit<CreateMortgagePayload, 'tag_id'>> & { id: string };

export function useUpdateMortgage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateMortgagePayload) => {
      const res = await fetch(`/api/mortgages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update mortgage');
      return data.mortgage as Mortgage;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
