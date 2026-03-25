'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

function storageKey(month: string) {
  return `budget_limit_${month}`;
}

export function useBudgetLimit(month: Date) {
  const monthKey = format(month, 'yyyy-MM');
  const [limit, setLimitState] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(monthKey));
    setLimitState(stored ? parseFloat(stored) : null);
  }, [monthKey]);

  const setLimit = useCallback(
    (value: number | null) => {
      if (value === null || value <= 0) {
        localStorage.removeItem(storageKey(monthKey));
        setLimitState(null);
      } else {
        localStorage.setItem(storageKey(monthKey), String(value));
        setLimitState(value);
      }
    },
    [monthKey],
  );

  return { limit, setLimit };
}
