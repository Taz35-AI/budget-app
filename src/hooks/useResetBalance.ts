'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useResetBalance(accountId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/balance-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: accountId ?? null }),
      });
      if (!res.ok) throw new Error('Failed to reset balance');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance-reset'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
    },
  });
}
