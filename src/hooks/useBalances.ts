'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { useTransactions } from './useTransactions';
import { computeBalancesCached } from '@/engine/balanceCache';
import { getEarliestComputeStart, findEarliestAffectedDate } from '@/engine/balanceDiff';
import { SEVEN_YEARS_DAYS } from '@/lib/constants';
import type { TransactionsData } from './useTransactions';
import type { DayTransaction } from '@/types';

async function fetchResetDate(accountId: string): Promise<string | null> {
  if (accountId === 'combined') return null;
  const res = await fetch(`/api/balance-reset?accountId=${accountId}`);
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param accountId  'combined' = all accounts summed; specific uuid = filter to that account.
 */
export function useBalances(accountId: string = 'combined'): BalancesResult {
  const { data: txData, isLoading: txLoading, error: txError } = useTransactions();

  const { data: resetDate } = useQuery<string | null>({
    queryKey: ['balance-reset', accountId],
    queryFn: () => fetchResetDate(accountId),
    staleTime: 60_000,
    // Combined view never uses a reset date
    enabled: accountId !== 'combined',
  });

  // Filter transactions to the selected account (or keep all for 'combined')
  const filteredTxData = useMemo<TransactionsData | undefined>(() => {
    if (!txData) return undefined;
    if (accountId === 'combined') return txData;
    return {
      transactions: txData.transactions.filter((t) => t.account_id === accountId),
      exceptions: txData.exceptions,
    };
  }, [txData, accountId]);

  const result = useMemo(() => {
    if (!filteredTxData) {
      return {
        balances: new Map<string, number>(),
        dayTransactions: new Map<string, DayTransaction[]>(),
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, 'yyyy-MM-dd');
    const toDate = format(addDays(today, SEVEN_YEARS_DAYS), 'yyyy-MM-dd');
    const effectiveResetDate = accountId === 'combined' ? undefined : resetDate;

    // The memo cache lives outside React (see engine/balanceCache.ts) so this
    // stays a pure computation — the incremental path returns the same result
    // as a full recompute, it just skips the untouched years.
    return computeBalancesCached(accountId, {
      transactions: filteredTxData.transactions,
      exceptions: filteredTxData.exceptions,
      resetDate: effectiveResetDate,
      toDate,
      fullFromDate: getEarliestComputeStart(filteredTxData.transactions, effectiveResetDate, today),
      deltaFromDate: (prev) =>
        findEarliestAffectedDate(prev, filteredTxData, effectiveResetDate, todayStr),
    });
  }, [filteredTxData, resetDate, accountId]);

  return {
    balances: result.balances,
    dayTransactions: result.dayTransactions,
    isLoading: txLoading,
    error: txError as Error | null,
  };
}
