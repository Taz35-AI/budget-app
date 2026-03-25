'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, min as dateMin } from 'date-fns';
import { useTransactions } from './useTransactions';
import { computeBalances } from '@/engine/balanceEngine';
import { SEVEN_YEARS_DAYS } from '@/lib/constants';
import type { DayTransaction, Transaction } from '@/types';

async function fetchResetDate(): Promise<string | null> {
  const res = await fetch('/api/balance-reset');
  if (!res.ok) return null;
  const data = await res.json();
  return data.reset?.reset_date ?? null;
}

export interface BalancesResult {
  balances: Map<string, number>;
  dayTransactions: Map<string, DayTransaction[]>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Find the earliest date we need to start computing from.
 * We must start from the earliest transaction so that historical
 * transactions compound into today's running balance.
 *
 * Example: daily £5 income starting 10 days ago → today's balance is £50.
 */
function getEarliestComputeStart(
  transactions: Transaction[],
  resetDate: string | null | undefined,
  today: Date,
): string {
  const todayStr = format(today, 'yyyy-MM-dd');

  // If there's a reset, we never need to go before it
  if (resetDate) return resetDate;

  let earliest = todayStr;
  for (const tx of transactions) {
    const d = tx.type === 'one_off' ? (tx.date ?? todayStr) : (tx.start_date ?? todayStr);
    if (d < earliest) earliest = d;
  }
  return earliest;
}

export function useBalances(): BalancesResult {
  const { data: txData, isLoading: txLoading, error: txError } = useTransactions();

  const { data: resetDate } = useQuery<string | null>({
    queryKey: ['balance-reset'],
    queryFn: fetchResetDate,
    staleTime: 60_000,
  });

  const result = useMemo(() => {
    if (!txData) {
      return {
        balances: new Map<string, number>(),
        dayTransactions: new Map<string, DayTransaction[]>(),
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from earliest transaction (or reset date) so past
    // transactions compound into today's running balance
    const fromDate = getEarliestComputeStart(txData.transactions, resetDate, today);
    const toDate = format(addDays(today, SEVEN_YEARS_DAYS), 'yyyy-MM-dd');

    return computeBalances({
      transactions: txData.transactions,
      exceptions: txData.exceptions,
      resetDate: resetDate ?? null,
      fromDate,
      toDate,
    });
  }, [txData, resetDate]);

  return {
    balances: result.balances,
    dayTransactions: result.dayTransactions,
    isLoading: txLoading,
    error: txError as Error | null,
  };
}
