'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useResetBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/balance-reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset balance');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance-reset'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
    },
  });
}
